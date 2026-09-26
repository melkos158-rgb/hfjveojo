import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";
import { stripe } from "@/lib/stripe/client";
import { secretKeyFor } from "@/lib/stripe/mode";

export type PaymentFees = { feeCents: number; netCents: number; settlementCurrency: string; exchangeRate: number | null };

/**
 * Stripe's real fee for a charge, in the payment's currency. The balance transaction is in the account's settlement
 * currency (e.g. PLN or EUR for a Polish account charging USD): amount_settlement = amount_charged × exchange_rate, so
 * fee_in_charge_currency = fee ÷ exchange_rate. Minor units throughout (all currencies we use have two decimals).
 */
export function feesFromBalanceTransaction(bt: Pick<Stripe.BalanceTransaction, "fee" | "net" | "currency" | "exchange_rate">, paymentCurrency: string, paidCents: number): PaymentFees {
  const rate = bt.exchange_rate ?? null;
  const sameCurrency = !rate || bt.currency.toLowerCase() === paymentCurrency.toLowerCase();
  const feeCents = sameCurrency ? bt.fee : Math.round(bt.fee / rate);
  return { feeCents, netCents: paidCents - feeCents, settlementCurrency: bt.currency.toLowerCase(), exchangeRate: sameCurrency ? null : rate };
}

/** The balance transaction of an expanded charge, when Stripe has already created it. */
export function balanceTransactionOf(charge: Stripe.Charge | null | undefined): Stripe.BalanceTransaction | null {
  const bt = charge?.balance_transaction;
  return bt && typeof bt === "object" ? (bt as Stripe.BalanceTransaction) : null;
}

/**
 * Fill in fees Stripe had not settled yet when the payment was recorded (maintenance job). Each payment is read in
 * the mode of its own order; a mode without a key on this server is skipped.
 */
export async function syncMissingPaymentFees(limit = 20): Promise<number> {
  const pending = await prisma.payment.findMany({
    where: { feeCents: null, stripeChargeId: { not: null }, status: { in: ["SUCCEEDED", "PARTIALLY_REFUNDED", "REFUNDED"] }, createdAt: { lt: new Date(Date.now() - 5 * 60_000) } },
    select: { id: true, stripeChargeId: true, amountCents: true, currency: true, order: { select: { livemode: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  let updated = 0;
  for (const p of pending) {
    const mode = p.order.livemode ? "live" : "test";
    if (!secretKeyFor(mode)) continue;
    try {
      const charge = await stripe(mode).charges.retrieve(p.stripeChargeId as string, { expand: ["balance_transaction"] });
      const bt = balanceTransactionOf(charge);
      if (!bt) continue;
      await prisma.payment.update({ where: { id: p.id }, data: feesFromBalanceTransaction(bt, p.currency, p.amountCents) });
      updated++;
    } catch (err) {
      log.warn("stripe.fee_sync_failed", { paymentId: p.id, error: (err as Error).message });
    }
  }
  return updated;
}
