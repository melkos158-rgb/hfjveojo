import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Checkout mode is switchable per test; every Stripe client call records the mode it was made for.
const state = vi.hoisted(() => ({ mode: "test" as "test" | "live", clientModes: [] as string[] }));

vi.mock("@/lib/stripe/mode", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stripe/mode")>();
  return { ...actual, checkoutMode: () => state.mode, secretKeyFor: (m: "test" | "live") => `sk_${m}_unit` };
});

vi.mock("@/lib/stripe/client", () => {
  const client = (mode: "test" | "live") => ({
    checkout: {
      sessions: {
        create: vi.fn(async (params: { metadata: { orderId: string } }) => ({
          id: `cs_${mode}_${params.metadata.orderId}`,
          url: `https://checkout.stripe.com/c/pay/cs_${mode}_${params.metadata.orderId}`,
          livemode: mode === "live",
        })),
      },
    },
    paymentIntents: { retrieve: vi.fn(async (id: string) => ({ id, latest_charge: { id: `ch_${id}`, receipt_url: "https://pay.stripe.com/receipts/x" } })) },
    refunds: { create: vi.fn(async () => ({ id: `re_${mode}_1` })) },
  });
  return {
    stripe: (mode: "test" | "live" = state.mode) => {
      state.clientModes.push(mode);
      return client(mode);
    },
  };
});

import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { createOrderWithCheckout } from "@/lib/orders/create";
import { handleStripeEvent } from "@/lib/stripe/webhooks";
import { refundOrder } from "@/lib/orders/service";
import { enqueue } from "@/lib/jobs/queue";
import { resetDatabase, sampleListingDescriptionIntake } from "./helpers";

let seq = 0;
function sessionEvent(orderId: string, opts: { livemode: boolean; type?: string; paymentStatus?: string; amount?: number }): Stripe.Event {
  seq += 1;
  return {
    id: `evt_live_${seq}_${orderId}`,
    type: opts.type ?? "checkout.session.completed",
    livemode: opts.livemode,
    data: {
      object: {
        id: `cs_${opts.livemode ? "live" : "test"}_${orderId}`,
        object: "checkout.session",
        payment_status: opts.paymentStatus ?? "paid",
        amount_total: opts.amount ?? 900,
        currency: "usd",
        payment_intent: `pi_${seq}_${orderId}`,
        customer_email: "agent@example.com",
        customer_details: { email: "agent@example.com", name: "Agent" },
        metadata: { orderId },
        client_reference_id: orderId,
      },
    },
  } as unknown as Stripe.Event;
}

const order = (id: string) => prisma.order.findUniqueOrThrow({ where: { id }, include: { payments: true } });
const newOrder = (extra: { mode?: "test" | "live"; isTest?: boolean } = {}) =>
  createOrderWithCheckout({ toolSlug: "listing-description", email: "agent@example.com", intakeRaw: sampleListingDescriptionIntake, ...extra });

describe("Stripe live mode: no mixing, no double fulfilment, no lost payments", () => {
  beforeAll(async () => {
    await resetDatabase();
  });
  beforeEach(() => {
    state.mode = "live";
    state.clientModes = [];
  });

  it("a live checkout records livemode, and only a live payment event completes it", async () => {
    const { orderId } = await newOrder();
    expect(state.clientModes).toContain("live");
    expect((await order(orderId)).livemode).toBe(true);

    await handleStripeEvent(sessionEvent(orderId, { livemode: false })); // a sandbox event for a live order
    expect((await order(orderId)).status).toBe("PENDING");

    await handleStripeEvent(sessionEvent(orderId, { livemode: true }));
    const paid = await order(orderId);
    expect(paid.status).toBe("COMPLETED"); // AUTO tool: paid → fulfilled → delivered (mock AI, inline jobs)
    expect(paid.payments).toHaveLength(1);
    expect(paid.checkoutCompletedAt).not.toBeNull();
    expect(state.clientModes).toContain("live"); // the receipt lookup used the live client
  });

  it("once checkouts are live, a sandbox payment cannot unlock a customer's order — only an admin test order", async () => {
    const customer = await newOrder({ mode: "test" }); // e.g. a sandbox session opened just before the switch
    await handleStripeEvent(sessionEvent(customer.orderId, { livemode: false }));
    expect((await order(customer.orderId)).status).toBe("PENDING");
    expect((await order(customer.orderId)).payments).toHaveLength(0);

    const adminTest = await newOrder({ mode: "test", isTest: true });
    await handleStripeEvent(sessionEvent(adminTest.orderId, { livemode: false }));
    expect((await order(adminTest.orderId)).status).toBe("COMPLETED");
  });

  it("two events for one session (completed + async succeeded, delivered at once) fulfil the order exactly once", async () => {
    const { orderId } = await newOrder();
    const a = sessionEvent(orderId, { livemode: true });
    const b = { ...sessionEvent(orderId, { livemode: true, type: "checkout.session.async_payment_succeeded" }) } as Stripe.Event;
    (b.data.object as { payment_intent: string }).payment_intent = (a.data.object as { payment_intent: string }).payment_intent;
    await Promise.allSettled([handleStripeEvent(a), handleStripeEvent(b)]);
    const o = await order(orderId);
    expect(o.payments).toHaveLength(1);
    expect(await prisma.event.count({ where: { name: "order_paid", orderId } })).toBe(1);
    expect(await prisma.toolRun.count({ where: { orderId } })).toBe(1);
  });

  it("an async payment still settling is never auto-closed, and completes when the money arrives", async () => {
    const { orderId } = await newOrder();
    await handleStripeEvent(sessionEvent(orderId, { livemode: true, paymentStatus: "unpaid" }));
    let o = await order(orderId);
    expect(o.status).toBe("PENDING");
    expect(o.checkoutCompletedAt).not.toBeNull();

    await prisma.order.update({ where: { id: orderId }, data: { createdAt: new Date(Date.now() - 30 * 3600 * 1000) } });
    await enqueue("maintenance", {});
    expect((await order(orderId)).status).toBe("PENDING"); // not closed as abandoned

    await handleStripeEvent(sessionEvent(orderId, { livemode: true, type: "checkout.session.async_payment_succeeded" }));
    o = await order(orderId);
    expect(o.status).toBe("COMPLETED");
    expect(o.payments).toHaveLength(1);
  });

  it("a payment that lands after the order was closed as abandoned reopens it instead of keeping the money", async () => {
    const { orderId } = await newOrder();
    await prisma.order.update({ where: { id: orderId }, data: { createdAt: new Date(Date.now() - 30 * 3600 * 1000) } });
    await enqueue("maintenance", {});
    expect((await order(orderId)).status).toBe("CANCELED");

    await handleStripeEvent(sessionEvent(orderId, { livemode: true }));
    const o = await order(orderId);
    expect(o.status).toBe("COMPLETED");
    expect(o.errorMessage).toBeNull();
    expect(o.payments).toHaveLength(1);
  });

  it("an expired session closes only an order of its own mode", async () => {
    const { orderId } = await newOrder();
    await handleStripeEvent(sessionEvent(orderId, { livemode: false, type: "checkout.session.expired" }));
    expect((await order(orderId)).status).toBe("PENDING");
    await handleStripeEvent(sessionEvent(orderId, { livemode: true, type: "checkout.session.expired" }));
    expect((await order(orderId)).status).toBe("CANCELED");
  });

  it("refunds go to the account that took the money, even after checkouts switch modes", async () => {
    const { orderId } = await newOrder();
    await handleStripeEvent(sessionEvent(orderId, { livemode: true }));
    const admin = await prisma.user.upsert({ where: { email: "admin@example.com" }, create: { email: "admin@example.com", role: "ADMIN" }, update: {} });
    state.mode = "test"; // checkouts switched back to the sandbox meanwhile
    state.clientModes = [];
    await refundOrder(orderId, { adminId: admin.id, reason: "test" });
    expect(state.clientModes).toEqual(["live"]);
    expect((await order(orderId)).status).toBe("REFUNDED");
  });
});
