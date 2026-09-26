import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/stripe/client", () => {
  const client = {
    checkout: { sessions: { create: vi.fn(async (params: { metadata: { orderId: string } }) => ({ id: `cs_test_${params.metadata.orderId}`, url: "https://checkout.stripe.com/c/pay/x", livemode: false })) } },
    paymentIntents: {
      retrieve: vi.fn(async (id: string) => ({
        id,
        latest_charge: { id: `ch_${id}`, receipt_url: "https://pay.stripe.com/receipts/x", balance_transaction: { id: `txn_${id}`, fee: 56, net: 844, currency: "usd", exchange_rate: null } },
      })),
    },
    charges: {
      retrieve: vi.fn(async (id: string) => ({ id, balance_transaction: { id: `txn_${id}`, fee: 236, net: 5614, currency: "pln", exchange_rate: 3.9 } })),
    },
    refunds: { create: vi.fn(async () => ({ id: "re_1" })) },
  };
  return { stripe: () => client };
});

import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { createOrderWithCheckout } from "@/lib/orders/create";
import { handleStripeEvent } from "@/lib/stripe/webhooks";
import { feesFromBalanceTransaction, syncMissingPaymentFees } from "@/lib/stripe/fees";
import { computeKpis, estimateStripeFeesCents } from "@/lib/analytics/kpi";
import { resetDatabase, sampleListingDescriptionIntake } from "./helpers";

function paidEvent(orderId: string, amount: number): Stripe.Event {
  return {
    id: `evt_fee_${orderId}`,
    type: "checkout.session.completed",
    livemode: false,
    data: { object: { id: `cs_test_${orderId}`, object: "checkout.session", payment_status: "paid", amount_total: amount, currency: "usd", payment_intent: `pi_${orderId}`, customer_email: "agent@example.com", customer_details: { email: "agent@example.com" }, metadata: { orderId }, client_reference_id: orderId } },
  } as unknown as Stripe.Event;
}

describe("actual Stripe fees and net revenue", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("converts the settlement-currency fee back to the charge currency", () => {
    expect(feesFromBalanceTransaction({ fee: 74, net: 1426, currency: "usd", exchange_rate: null }, "usd", 1500)).toEqual({ feeCents: 74, netCents: 1426, settlementCurrency: "usd", exchangeRate: null });
    // $15.00 charged, settled as 58.50 PLN with a 2.36 PLN fee → $0.61
    expect(feesFromBalanceTransaction({ fee: 236, net: 5614, currency: "pln", exchange_rate: 3.9 }, "usd", 1500)).toEqual({ feeCents: 61, netCents: 1439, settlementCurrency: "pln", exchangeRate: 3.9 });
  });

  it("records Stripe's real fee with the payment, and revenue is what Stripe charged (promotion code included)", async () => {
    const { orderId } = await createOrderWithCheckout({ toolSlug: "listing-description", email: "agent@example.com", intakeRaw: sampleListingDescriptionIntake });
    await handleStripeEvent(paidEvent(orderId, 900));
    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId } });
    expect(payment).toMatchObject({ amountCents: 900, feeCents: 56, netCents: 844, settlementCurrency: "usd" });

    // a second order paid with a 50 % promotion code; its fee is not settled yet
    const second = await createOrderWithCheckout({ toolSlug: "listing-description", email: "other@example.com", intakeRaw: sampleListingDescriptionIntake });
    await prisma.order.update({ where: { id: second.orderId }, data: { status: "PAID", paidAt: new Date() } });
    await prisma.payment.create({ data: { orderId: second.orderId, stripePaymentIntentId: `pi_promo_${second.orderId}`, stripeChargeId: `ch_promo_${second.orderId}`, amountCents: 450, currency: "usd", status: "SUCCEEDED", createdAt: new Date(Date.now() - 3600_000) } });

    let k = await computeKpis(new Date(Date.now() - 3600_000 * 2), new Date(Date.now() + 60_000));
    expect(k.revenueCents).toBe(900 + 450);
    expect(k.stripeFeesActualCount).toBe(1);
    expect(k.stripeFeesCents).toBe(56 + estimateStripeFeesCents([{ amountCents: 450 }]));
    expect(k.netRevenueCents).toBe(k.revenueCents - k.refundedCents - k.stripeFeesCents);
    expect(k.revenueAfterAiCents).toBe(k.revenueCents - k.refundedCents - k.aiCostCents);
    const tool = k.byTool.find((t) => t.toolId === "listing-description");
    expect(tool).toMatchObject({ paid: 2, revenueCents: 1350, checkouts: 2 });

    // maintenance fills in the missing fee from the charge's balance transaction (settled in PLN)
    expect(await syncMissingPaymentFees()).toBe(1);
    const promo = await prisma.payment.findFirstOrThrow({ where: { orderId: second.orderId } });
    expect(promo).toMatchObject({ feeCents: 61, settlementCurrency: "pln", exchangeRate: 3.9 });
    k = await computeKpis(new Date(Date.now() - 3600_000 * 2), new Date(Date.now() + 60_000));
    expect(k.stripeFeesActualCount).toBe(2);
    expect(k.stripeFeesCents).toBe(56 + 61);
  });
});
