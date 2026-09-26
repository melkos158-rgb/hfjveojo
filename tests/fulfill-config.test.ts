import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/stripe/client", () => {
  const fake = {
    checkout: { sessions: { create: vi.fn(async (params: { metadata: { orderId: string } }) => ({ id: `cs_test_${params.metadata.orderId}`, url: `https://checkout.stripe.com/c/pay/cs_test_${params.metadata.orderId}` })) } },
    paymentIntents: { retrieve: vi.fn(async (id: string) => ({ id, latest_charge: { id: `ch_${id}`, receipt_url: "https://pay.stripe.com/receipts/x" } })) },
    refunds: { create: vi.fn(async () => ({ id: "re_test_1" })) },
  };
  return { stripe: () => fake };
});

// Simulate production without an AI key: every model call fails with a NON-retryable provider error.
vi.mock("@/lib/ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai")>();
  const { AiProviderError } = await import("@/lib/ai/types");
  const boom = async () => {
    throw new AiProviderError("OPENAI_API_KEY is not set", { retryable: false });
  };
  return { ...actual, complete: boom, completeStructured: boom };
});

import { prisma } from "@/lib/db";
import { createOrderWithCheckout } from "@/lib/orders/create";
import { handleStripeEvent } from "@/lib/stripe/webhooks";
import { resetDatabase, samplePricingGuideIntake } from "./helpers";
import type Stripe from "stripe";

function paidEvent(orderId: string, amount: number): Stripe.Event {
  return {
    id: `evt_${orderId}`,
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_${orderId}`,
        object: "checkout.session",
        payment_status: "paid",
        amount_total: amount,
        currency: "usd",
        customer_details: { email: "buyer@example.com" },
        payment_intent: `pi_${orderId}`,
        metadata: { orderId },
      },
    },
  } as unknown as Stripe.Event;
}

describe("fulfilment when the AI provider is not configured", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("parks the paid order in REVIEW at once (no retry loop), keeps the money, and tells the admin what to fix", async () => {
    const { orderId } = await createOrderWithCheckout({ toolSlug: "photographer-pricing-guide", email: "buyer@example.com", intakeRaw: samplePricingGuideIntake });
    await handleStripeEvent(paidEvent(orderId, 2900));

    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { payments: true, runs: true } });
    expect(order.payments[0]?.status).toBe("SUCCEEDED");
    expect(order.status).toBe("REVIEW");
    expect(order.attempts).toBe(1);
    expect(order.errorMessage).toContain("OPENAI_API_KEY");
    expect(order.runs).toHaveLength(1);
    expect(order.runs[0].status).toBe("FAILED");
    // the order page now promises a human's day, not the usual hour
    expect(order.dueAt!.getTime()).toBeGreaterThan(Date.now() + 23 * 3600 * 1000);

    // nothing scheduled to retry blindly
    const queued = await prisma.job.count({ where: { type: "fulfill_order", status: "QUEUED" } });
    expect(queued).toBe(0);
    const parked = await prisma.event.count({ where: { name: "order_parked", orderId } });
    expect(parked).toBe(1);
  });
});
