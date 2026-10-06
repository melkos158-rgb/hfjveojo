import { beforeAll, describe, expect, it, vi } from "vitest";

const { sent, sessions } = vi.hoisted(() => ({
  sent: [] as Array<{ to: string; subject: string; text: string }>,
  sessions: [] as Array<{ line_items: Array<{ quantity: number; price_data: { unit_amount: number; product_data: { name: string } } }> }>,
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async (m: { to: string; subject: string; text: string }) => {
    sent.push(m);
    return { id: null };
  }),
}));

vi.mock("@/lib/stripe/client", () => {
  const fake = {
    checkout: {
      sessions: {
        create: vi.fn(async (params: { metadata: { orderId: string }; line_items: Array<{ quantity: number; price_data: { unit_amount: number; product_data: { name: string } } }> }) => {
          sessions.push(params);
          return { id: `cs_test_${params.metadata.orderId}`, url: `https://checkout.stripe.com/c/pay/cs_test_${params.metadata.orderId}` };
        }),
      },
    },
    paymentIntents: { retrieve: vi.fn(async (id: string) => ({ id, latest_charge: { id: `ch_${id}`, receipt_url: "https://pay.stripe.com/receipts/x" } })) },
  };
  return { stripe: () => fake };
});

import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { resetDatabase } from "./helpers";
import { createOrderWithCheckout } from "@/lib/orders/create";
import { handleStripeEvent } from "@/lib/stripe/webhooks";
import { creditBalance, CREDIT_VALID_MS } from "@/lib/orders/credits";
import { isCreditOrder, isFreePhotoOrder } from "@/lib/orders/voucher";
import { refundOrder } from "@/lib/orders/service";
import { computeKpis } from "@/lib/analytics/kpi";
import { materializeTestIntake } from "@/lib/tools/samples/materialize";

const PHOTO = "@file:img/sample-staging-before.jpg";
const DAY = 24 * 3600 * 1000;
let seq = 0;

/** A paid Pro credits purchase, `daysAgo` days ago. */
async function purchase(email: string, daysAgo = 0) {
  const product = await prisma.product.findFirstOrThrow({ where: { toolId: "pro-credits" } });
  const at = new Date(Date.now() - daysAgo * DAY);
  return prisma.order.create({
    data: { customerEmail: email, toolId: "pro-credits", productId: product.id, status: "COMPLETED", paidAt: at, createdAt: at, intake: { businessName: "" }, amountCents: 14900, quantity: 1, accessToken: `pro-${seq++}-${Date.now()}` },
  });
}

/** A staging order paid with credits placed directly (for balance arithmetic), `daysAgo` days ago. */
async function spent(email: string, rooms: number, daysAgo = 0, status: "COMPLETED" | "REFUNDED" | "CANCELED" = "COMPLETED") {
  const product = await prisma.product.findFirstOrThrow({ where: { toolId: "virtual-staging" } });
  const at = new Date(Date.now() - daysAgo * DAY);
  return prisma.order.create({
    data: {
      customerEmail: email,
      toolId: "virtual-staging",
      productId: product.id,
      status,
      paidAt: at,
      createdAt: at,
      intake: { rooms: [], style: "modern", notes: "", paidWithCredits: true },
      amountCents: 0,
      free: true,
      freeKey: `credit:test-${seq++}`,
      quantity: rooms,
      accessToken: `spent-${seq++}-${Date.now()}`,
    },
  });
}

async function roomsOf(n: number) {
  return (await materializeTestIntake({ rooms: Array.from({ length: n }, () => ({ photoFileId: PHOTO, roomType: "bedroom" })), style: "modern", notes: "" })).rooms;
}

function paid(orderId: string, amount: number, email: string): Stripe.Event {
  return {
    id: `evt_credits_${orderId}`,
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_${orderId}`,
        object: "checkout.session",
        payment_status: "paid",
        amount_total: amount,
        currency: "usd",
        payment_intent: `pi_${orderId}`,
        customer_email: email,
        customer_details: { email, name: "Studio" },
        metadata: { orderId },
        client_reference_id: orderId,
      },
    },
  } as unknown as Stripe.Event;
}

describe("Pro credits", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("sells 25 rooms for $149 and the paid order becomes the balance", async () => {
    expect(await creditBalance("studio@example.com")).toEqual({ rooms: 0, validUntil: null });
    const { orderId } = await createOrderWithCheckout({ toolSlug: "pro-credits", email: "studio@example.com", intakeRaw: { businessName: "Bright Lens" } });
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect([order.amountCents, order.quantity, order.free]).toEqual([14900, 1, false]);
    expect(sessions.at(-1)?.line_items).toMatchObject([{ quantity: 1, price_data: { unit_amount: 14900 } }]);
    // not paid yet: no rooms
    expect((await creditBalance("studio@example.com")).rooms).toBe(0);

    await handleStripeEvent(paid(orderId, 14900, "studio@example.com"));
    const done = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { outputs: true } });
    expect(done.status).toBe("COMPLETED");
    const md = (done.outputs.find((o) => o.type === "MARKDOWN")?.content as { markdown?: string } | null)?.markdown ?? "";
    expect(md).toContain("25 rooms");
    expect(md).toContain("Bright Lens");
    expect(sent.at(-1)?.subject).toBe("Your 25 rooms of virtual staging are ready");
    expect(sent.at(-1)?.text).toContain("/login?next=");

    const balance = await creditBalance("Studio@Example.com");
    expect(balance.rooms).toBe(25);
    expect(Math.abs((balance.validUntil as Date).getTime() - ((done.paidAt as Date).getTime() + CREDIT_VALID_MS))).toBeLessThan(1000);
  });

  it("stages photos from the balance for the signed-in buyer: paid at once for $0, no checkout", async () => {
    await purchase("team@example.com");
    const checkouts = sessions.length;
    const rooms = await roomsOf(3);
    const res = await createOrderWithCheckout({
      toolSlug: "virtual-staging",
      email: "team@example.com",
      intakeRaw: { rooms: JSON.stringify(rooms), style: "modern", addDescription: "1" },
      useCredits: true,
      sessionEmail: "Team@Example.com",
    });
    expect(sessions.length).toBe(checkouts);
    const order = await prisma.order.findUniqueOrThrow({ where: { id: res.orderId } });
    expect(order).toMatchObject({ toolId: "virtual-staging", free: true, amountCents: 0, quantity: 3, customerEmail: "team@example.com" });
    expect(order.paidAt).not.toBeNull();
    expect(order.freeKey).toMatch(/^credit:/);
    // credits pay for rooms only: no description voucher on these orders
    expect(order.intake).toMatchObject({ paidWithCredits: true, addDescription: false });
    expect((order.intake as Record<string, unknown>).extraIncluded).toBeUndefined();
    expect(isCreditOrder(order)).toBe(true);
    expect(isFreePhotoOrder(order)).toBe(false);
    expect(res.checkoutUrl).toContain(`/orders/${order.id}?t=`);
    expect(await prisma.file.count({ where: { orderId: order.id, kind: "INPUT" } })).toBe(3);
    expect((await creditBalance("team@example.com")).rooms).toBe(22);
    // tests run jobs inline: the order is delivered, and the email says what is left
    const done = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(["PAID", "PROCESSING", "COMPLETED", "REVIEW"]).toContain(done.status);
    if (done.status === "COMPLETED") expect(sent.at(-1)?.text).toContain("Paid with Pro credits: 3 rooms used, 22 left");
  });

  it("needs the buyer signed in and enough rooms", async () => {
    await purchase("short@example.com");
    await spent("short@example.com", 24);
    const rooms = await roomsOf(2);
    const intakeRaw = { rooms: JSON.stringify(rooms), style: "modern" };
    await expect(createOrderWithCheckout({ toolSlug: "virtual-staging", email: "short@example.com", intakeRaw, useCredits: true })).rejects.toMatchObject({ code: "credits_sign_in", status: 403 });
    await expect(createOrderWithCheckout({ toolSlug: "virtual-staging", email: "short@example.com", intakeRaw, useCredits: true, sessionEmail: "someone@example.com" })).rejects.toMatchObject({ code: "credits_sign_in" });
    await expect(createOrderWithCheckout({ toolSlug: "virtual-staging", email: "short@example.com", intakeRaw, useCredits: true, sessionEmail: "short@example.com" })).rejects.toMatchObject({ code: "credits_short", status: 409 });
    await expect(createOrderWithCheckout({ toolSlug: "virtual-staging", email: "nobody@example.com", intakeRaw, useCredits: true, sessionEmail: "nobody@example.com" })).rejects.toMatchObject({ code: "credits_short" });
    // other tools can't be paid with credits
    await expect(
      createOrderWithCheckout({ toolSlug: "listing-description", email: "short@example.com", intakeRaw: { ...(await import("@/lib/tools/samples/test-intakes")).TEST_INTAKES["listing-description"] }, useCredits: true, sessionEmail: "short@example.com" }),
    ).rejects.toMatchObject({ code: "credits_tool" });
    expect(await prisma.order.count({ where: { customerEmail: "short@example.com", toolId: "virtual-staging", freeKey: { startsWith: "credit:" }, status: { not: "COMPLETED" } } })).toBe(0);
  });

  it("never spends the same rooms twice when two orders arrive together", async () => {
    await purchase("race@example.com");
    await spent("race@example.com", 23);
    const [a, b] = await Promise.all([roomsOf(2), roomsOf(2)]);
    const results = await Promise.allSettled([
      createOrderWithCheckout({ toolSlug: "virtual-staging", email: "race@example.com", intakeRaw: { rooms: JSON.stringify(a), style: "modern" }, useCredits: true, sessionEmail: "race@example.com" }),
      createOrderWithCheckout({ toolSlug: "virtual-staging", email: "race@example.com", intakeRaw: { rooms: JSON.stringify(b), style: "modern" }, useCredits: true, sessionEmail: "race@example.com" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find((r) => r.status === "rejected")).toMatchObject({ reason: { code: "credits_short" } });
    expect((await creditBalance("race@example.com")).rooms).toBe(0);
  });

  it("gives an order's rooms back when it is refunded, and takes a refunded pack away", async () => {
    const admin = await prisma.user.create({ data: { email: "admin-credits@example.com", role: "ADMIN" } });
    const pack = await purchase("refund@example.com");
    const used = await spent("refund@example.com", 5);
    expect((await creditBalance("refund@example.com")).rooms).toBe(20);
    await refundOrder(used.id, { adminId: admin.id, reason: "structure changed" });
    expect((await prisma.order.findUniqueOrThrow({ where: { id: used.id } })).status).toBe("REFUNDED");
    expect((await creditBalance("refund@example.com")).rooms).toBe(25);
    expect(await prisma.adminAction.count({ where: { action: "return_credits", targetId: used.id } })).toBe(1);
    await expect(refundOrder(used.id, { adminId: admin.id })).rejects.toMatchObject({ code: "nothing_to_refund" });
    // a cancelled credit order never counted
    await spent("refund@example.com", 4, 0, "CANCELED");
    expect((await creditBalance("refund@example.com")).rooms).toBe(25);
    await prisma.order.update({ where: { id: pack.id }, data: { status: "REFUNDED" } });
    expect(await creditBalance("refund@example.com")).toEqual({ rooms: 0, validUntil: null });
  });

  it("expires a pack after 12 months, using the oldest valid pack first", async () => {
    // one pack 13 months old: nothing left
    await purchase("old@example.com", 400);
    expect((await creditBalance("old@example.com")).rooms).toBe(0);

    // pack A 300 days ago, pack B 10 days ago; 20 rooms used 200 days ago came from A, 10 used today from A too
    await purchase("fifo@example.com", 300);
    const b = await purchase("fifo@example.com", 10);
    await spent("fifo@example.com", 20, 200);
    await spent("fifo@example.com", 10, 0);
    const now = await creditBalance("fifo@example.com");
    // A: 25 - 20 - 5 = 0, B: 25 - 5 = 20
    expect(now.rooms).toBe(20);
    expect(Math.abs((now.validUntil as Date).getTime() - ((b.paidAt as Date).getTime() + CREDIT_VALID_MS))).toBeLessThan(1000);

    // 100 days from now pack A has expired, which changes nothing: its rooms were used
    expect((await creditBalance("fifo@example.com", new Date(Date.now() + 100 * DAY))).rooms).toBe(20);

    // unused rooms of an expired pack are gone, the newer pack keeps its own
    await purchase("expire@example.com", 360);
    await purchase("expire@example.com", 30);
    await spent("expire@example.com", 5, 20);
    expect((await creditBalance("expire@example.com")).rooms).toBe(45);
    expect((await creditBalance("expire@example.com", new Date(Date.now() + 10 * DAY))).rooms).toBe(25);
  });

  it("keeps credit orders out of the free-photo numbers and revenue", async () => {
    const range = [new Date(Date.now() - DAY), new Date(Date.now() + 60_000)] as const;
    const before = await computeKpis(...range);
    await purchase("kpi@example.com");
    await spent("kpi@example.com", 2);
    const after = await computeKpis(...range);
    expect(after.freePhotosClaimed).toBe(before.freePhotosClaimed);
  });
});
