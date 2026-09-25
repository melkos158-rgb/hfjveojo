import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/stripe/client", () => {
  const fake = {
    checkout: { sessions: { create: vi.fn(async (params: { metadata: { orderId: string } }) => ({ id: `cs_test_${params.metadata.orderId}`, url: `https://checkout.stripe.com/c/pay/cs_test_${params.metadata.orderId}` })) } },
    paymentIntents: { retrieve: vi.fn(async (id: string) => ({ id, latest_charge: { id: `ch_${id}`, receipt_url: "https://pay.stripe.com/receipts/x" } })) },
    refunds: { create: vi.fn(async () => ({ id: "re_test_1" })) },
  };
  return { stripe: () => fake };
});

import { prisma } from "@/lib/db";
import { createOrderWithCheckout } from "@/lib/orders/create";
import { handleStripeEvent } from "@/lib/stripe/webhooks";
import { refundOrder, deliverOrder } from "@/lib/orders/service";
import { AppError } from "@/lib/errors";
import { resetDatabase, samplePricingGuideIntake, sampleListingClipsIntake } from "./helpers";
import type Stripe from "stripe";

function checkoutCompletedEvent(orderId: string, amount: number, id = `evt_${orderId}`): Stripe.Event {
  return {
    id,
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_${orderId}`,
        object: "checkout.session",
        payment_status: "paid",
        amount_total: amount,
        currency: "usd",
        payment_intent: `pi_${orderId}`,
        customer_email: "buyer@example.com",
        customer_details: { email: "buyer@example.com", name: "Buyer" },
        metadata: { orderId },
        client_reference_id: orderId,
      },
    },
  } as unknown as Stripe.Event;
}

describe("order → checkout → webhook → fulfilment", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("prices the order server-side and returns a checkout URL", async () => {
    const res = await createOrderWithCheckout({ toolSlug: "photographer-pricing-guide", email: "Buyer@Example.com", intakeRaw: samplePricingGuideIntake });
    expect(res.checkoutUrl).toContain("checkout.stripe.com");
    const order = await prisma.order.findUniqueOrThrow({ where: { id: res.orderId } });
    expect(order.status).toBe("PENDING");
    expect(order.amountCents).toBe(2900);
    expect(order.customerEmail).toBe("buyer@example.com");
    expect(order.stripeCheckoutSessionId).toBe(`cs_test_${order.id}`);
  });

  it("rejects invalid intake with a 400 AppError", async () => {
    await expect(createOrderWithCheckout({ toolSlug: "listing-clips", email: "a@b.co", intakeRaw: { ...sampleListingClipsIntake, videoLink: "https://evil.example/x" } })).rejects.toBeInstanceOf(AppError);
  });

  it("processes checkout.session.completed exactly once and fulfils the order (mock AI, inline jobs)", async () => {
    const { orderId } = await createOrderWithCheckout({ toolSlug: "photographer-pricing-guide", email: "buyer@example.com", intakeRaw: samplePricingGuideIntake });
    const first = await handleStripeEvent(checkoutCompletedEvent(orderId, 2900));
    expect(first.duplicate).toBe(false);
    const second = await handleStripeEvent(checkoutCompletedEvent(orderId, 2900));
    expect(second.duplicate).toBe(true);

    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { payments: true, outputs: true, aiRequests: true, user: true } });
    expect(order.payments).toHaveLength(1);
    expect(order.payments[0].status).toBe("SUCCEEDED");
    expect(order.paidAt).not.toBeNull();
    expect(order.user?.email).toBe("buyer@example.com");
    // AUTO tool with mock AI → delivered
    expect(order.status).toBe("COMPLETED");
    expect(order.outputs.some((o) => o.type === "PDF")).toBe(true);
    expect(order.aiRequests.length).toBeGreaterThanOrEqual(1);
  });

  it("parks concierge orders in REVIEW and lets an admin deliver with a link", async () => {
    const { orderId } = await createOrderWithCheckout({ toolSlug: "listing-clips", email: "agent@example.com", intakeRaw: sampleListingClipsIntake });
    await handleStripeEvent(checkoutCompletedEvent(orderId, 4900));
    let order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.status).toBe("REVIEW");

    const admin = await prisma.user.upsert({ where: { email: "admin@example.com" }, create: { email: "admin@example.com", role: "ADMIN" }, update: {} });
    await deliverOrder(orderId, { by: "admin", adminId: admin.id, deliveryLink: "https://drive.google.com/drive/folders/xyz" });
    order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { outputs: true } });
    expect(order.status).toBe("COMPLETED");
    expect(order.deliveredAt).not.toBeNull();
  });

  it("ignores paid events for unknown orders and does not throw", async () => {
    const res = await handleStripeEvent(checkoutCompletedEvent("does-not-exist", 100, "evt_unknown"));
    expect(res.handled).toBe(true);
  });

  it("refunds through Stripe and updates payment + order state", async () => {
    const paid = await prisma.order.findFirstOrThrow({ where: { status: "COMPLETED", toolId: "photo-pricing-guide" }, include: { payments: true } });
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@example.com" } });
    await refundOrder(paid.id, { adminId: admin.id, reason: "test" });
    const after = await prisma.order.findUniqueOrThrow({ where: { id: paid.id }, include: { payments: true, refunds: true } });
    expect(after.status).toBe("REFUNDED");
    expect(after.payments[0].status).toBe("REFUNDED");
    expect(after.refunds[0].status).toBe("SUCCEEDED");
    await expect(refundOrder(paid.id, { adminId: admin.id })).rejects.toBeInstanceOf(AppError);
  });
});
