import { beforeAll, describe, expect, it, vi } from "vitest";

const { sessions, expired, sent, open } = vi.hoisted(() => ({
  sessions: [] as Array<{ metadata: { orderId: string }; line_items: Array<{ quantity: number; price_data: { unit_amount: number } }>; cancel_url: string }>,
  expired: [] as string[],
  sent: [] as Array<{ to: string; subject: string; text: string }>,
  open: new Set<string>(),
}));
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async (m: { to: string; subject: string; text: string }) => {
    sent.push(m);
    return { id: null };
  }),
}));
vi.mock("@/lib/stripe/client", () => {
  let n = 0;
  const fake = {
    checkout: {
      sessions: {
        create: vi.fn(async (params: { metadata: { orderId: string }; line_items: Array<{ quantity: number; price_data: { unit_amount: number } }>; cancel_url: string }) => {
          sessions.push(params);
          const id = `cs_test_${params.metadata.orderId}_${n++}`;
          open.add(id);
          return { id, url: `https://checkout.stripe.com/c/pay/${id}`, livemode: false };
        }),
        expire: vi.fn(async (id: string) => {
          expired.push(id);
          open.delete(id);
          return { id, status: "expired" };
        }),
        retrieve: vi.fn(async (id: string) => ({ id, status: open.has(id) ? "open" : "expired", url: open.has(id) ? `https://checkout.stripe.com/c/pay/${id}` : null })),
      },
    },
  };
  return { stripe: () => fake };
});

import { prisma } from "@/lib/db";
import { createOrderWithCheckout, resumeCheckout } from "@/lib/orders/create";
import { sendCheckoutReminders } from "@/lib/orders/reminders";
import { materializeTestIntake } from "@/lib/tools/samples/materialize";
import { resetDatabase } from "./helpers";

const PHOTO = "@file:img/sample-staging-before.jpg";
const HOUR = 3600_000;

async function checkout(email: string, rooms: number, addDescription = false) {
  const intake = await materializeTestIntake({ rooms: Array.from({ length: rooms }, () => ({ photoFileId: PHOTO, roomType: "bedroom" })), style: "modern", notes: "" });
  const { orderId } = await createOrderWithCheckout({ toolSlug: "virtual-staging", email, intakeRaw: { rooms: JSON.stringify(intake.rooms), style: "modern", ...(addDescription ? { addDescription: "1" } : {}) }, mode: "test" });
  return prisma.order.findUniqueOrThrow({ where: { id: orderId } });
}

describe("resume an unpaid order, and one reminder email", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("sends a customer straight back to a checkout that is still open, with the token on the cancel link", async () => {
    const order = await checkout("back@example.com", 2);
    expect(sessions.at(-1)?.cancel_url).toContain(`t=${encodeURIComponent(order.accessToken)}`);
    const r = await resumeCheckout(order.id, order.accessToken);
    expect(r).toEqual({ kind: "checkout", url: `https://checkout.stripe.com/c/pay/${order.stripeCheckoutSessionId}` });
    expect(sessions).toHaveLength(1); // no second session while the first can still be paid
    expect((await resumeCheckout(order.id, "wrong-token")).kind).toBe("form");
  });

  it("re-opens an expired checkout as a new session for the same order and price", async () => {
    const order = await checkout("later@example.com", 2, true); // $30 + $7 description
    const firstSession = order.stripeCheckoutSessionId!;
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELED", errorMessage: "checkout.session.expired", createdAt: new Date(Date.now() - 3 * HOUR) } });
    const before = sessions.length;
    const r = await resumeCheckout(order.id, order.accessToken);
    expect(r.kind).toBe("checkout");
    expect(sessions.length).toBe(before + 1);
    expect(sessions.at(-1)?.line_items).toMatchObject([{ quantity: 2, price_data: { unit_amount: 1500 } }, { quantity: 1, price_data: { unit_amount: 700 } }]);
    expect(expired).toContain(firstSession);
    const fresh = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(fresh.status).toBe("PENDING");
    expect(fresh.stripeCheckoutSessionId).not.toBe(firstSession);
    expect(fresh.amountCents).toBe(3700);
  });

  it("refuses paid, old and free orders", async () => {
    const paid = await checkout("paid@example.com", 1);
    await prisma.order.update({ where: { id: paid.id }, data: { status: "PAID", paidAt: new Date() } });
    expect((await resumeCheckout(paid.id, paid.accessToken)).kind).toBe("order");
    const old = await checkout("old@example.com", 1);
    await prisma.order.update({ where: { id: old.id }, data: { status: "CANCELED", errorMessage: "checkout.session.expired", createdAt: new Date(Date.now() - 30 * HOUR) } });
    expect((await resumeCheckout(old.id, old.accessToken)).kind).toBe("form");
    const product = await prisma.product.findFirstOrThrow({ where: { toolId: "virtual-staging" } });
    const free = await prisma.order.create({ data: { customerEmail: "free@example.com", toolId: "virtual-staging", productId: product.id, status: "PENDING", free: true, intake: {}, amountCents: 0, quantity: 1, accessToken: `free-${Date.now()}`, createdAt: new Date(Date.now() - 3 * HOUR) } });
    expect((await resumeCheckout(free.id, free.accessToken)).kind).toBe("form");
  });

  it("emails one reminder about 2 hours after a checkout was left, and never twice", async () => {
    const left = await checkout("reminder@example.com", 4);
    await prisma.order.update({ where: { id: left.id }, data: { status: "CANCELED", errorMessage: "checkout.session.expired", createdAt: new Date(Date.now() - 3 * HOUR) } });
    const fresh = await checkout("toosoon@example.com", 1); // 0 h old: not yet
    const test = await checkout("sandbox@example.com", 1);
    await prisma.order.update({ where: { id: test.id }, data: { isTest: true, createdAt: new Date(Date.now() - 3 * HOUR) } });
    // only the left checkout counts as a real customer's here (earlier tests' orders are test orders now)
    await prisma.order.updateMany({ where: { id: { not: left.id } }, data: { isTest: true } });
    await prisma.order.update({ where: { id: left.id }, data: { isTest: false } });
    await prisma.order.update({ where: { id: fresh.id }, data: { isTest: false } }); // real, but too recent
    sent.length = 0;
    expect(await sendCheckoutReminders()).toBe(1);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("reminder@example.com");
    expect(sent[0].text).toContain(`/api/orders/${left.id}/resume?t=`);
    expect(sent[0].text).toContain("this is the only reminder");
    expect(await sendCheckoutReminders()).toBe(0);
    expect(fresh.id).toBeTruthy();
  });
});
