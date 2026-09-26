import { prisma } from "@/lib/db";
import { microsToCents } from "@/lib/ai/pricing";

export type Kpis = {
  from: Date;
  to: Date;
  visits: number;
  uniqueSessions: number;
  intakeStarted: number;
  checkoutStarted: number;
  ordersPaid: number;
  ordersDelivered: number;
  ordersRefunded: number;
  ordersInReview: number;
  ordersFailed: number;
  revenueCents: number;
  refundedCents: number;
  aiCostCents: number;
  channelCostCents: number;
  founderHours: number;
  grossContributionCents: number; // revenue - refunds - AI cost - channel cost (Stripe fees not included: see notes)
  conversionVisitToPaid: number;
  conversionCheckoutToPaid: number;
  avgOrderCents: number;
  avgDeliveryHours: number | null;
  feedbackAvgRating: number | null;
  feedbackCount: number;
  byTool: Array<{ toolId: string; name: string; paid: number; revenueCents: number; aiCostCents: number }>;
  byChannel: Array<{ source: string; visits: number; paid: number; revenueCents: number }>;
  /** Estimated card fees (2.9 % + $0.30 per paid order) until balance transactions are pulled from Stripe. */
  stripeFeesCents: number;
  /** gross contribution − estimated Stripe fees */
  netContributionCents: number;
  /** revenue ÷ founder hours logged as channel cost (null when no hours logged) */
  revenuePerFounderHourCents: number | null;
  customers: number;
  repeatCustomers: number;
  repeatRate: number;
  aiCostPerPaidOrderCents: number;
  freeToolUses: number;
};

export const STRIPE_FEE_PCT = 0.029;
export const STRIPE_FEE_FIXED_CENTS = 30;
export function estimateStripeFeesCents(orders: Array<{ amountCents: number }>): number {
  return Math.round(orders.reduce((s, o) => s + o.amountCents * STRIPE_FEE_PCT + STRIPE_FEE_FIXED_CENTS, 0));
}

function sourceOf(utm: unknown): string {
  const u = (utm ?? {}) as Record<string, string | undefined>;
  return u.utm_source || u.ref || u.referrer || "direct";
}

export async function computeKpis(from: Date, to: Date): Promise<Kpis> {
  const range = { gte: from, lt: to };

  const [pageViews, intakeStarted, checkoutStarted, paidOrders, delivered, refunded, inReview, failed, aiAgg, channelCosts, feedbackAgg, tools, freeToolUses] =
    await Promise.all([
      prisma.event.findMany({ where: { name: "page_view", createdAt: range }, select: { sessionId: true, utm: true } }),
      prisma.event.count({ where: { name: "intake_started", createdAt: range } }),
      prisma.event.count({ where: { name: "checkout_started", createdAt: range } }),
      prisma.order.findMany({
        where: { paidAt: range, isTest: false },
        select: { id: true, toolId: true, amountCents: true, attribution: true, paidAt: true, deliveredAt: true, status: true, customerEmail: true },
      }),
      prisma.order.count({ where: { deliveredAt: range, isTest: false } }),
      prisma.refund.aggregate({ _sum: { amountCents: true }, _count: true, where: { createdAt: range, status: "SUCCEEDED" } }),
      prisma.order.count({ where: { status: "REVIEW" } }),
      prisma.order.count({ where: { status: "FAILED" } }),
      prisma.aiRequest.groupBy({ by: ["toolId"], _sum: { costMicros: true }, where: { createdAt: range } }),
      prisma.channelCost.aggregate({ _sum: { costCents: true, hours: true }, where: { date: range } }),
      prisma.feedback.aggregate({ _avg: { rating: true }, _count: true, where: { createdAt: range } }),
      prisma.tool.findMany({ select: { id: true, name: true } }),
      prisma.event.count({ where: { name: "free_tool_used", createdAt: range } }),
    ]);

  const sessions = new Set(pageViews.map((p) => p.sessionId).filter(Boolean) as string[]);
  const revenueCents = paidOrders.reduce((s, o) => s + o.amountCents, 0);
  const refundedCents = refunded._sum.amountCents ?? 0;
  const aiCostCents = Math.round(microsToCents(aiAgg.reduce((s, r) => s + (r._sum.costMicros ?? 0), 0)));
  const channelCostCents = channelCosts._sum.costCents ?? 0;
  const founderHours = channelCosts._sum.hours ?? 0;

  const deliveryHours = paidOrders
    .filter((o) => o.deliveredAt && o.paidAt)
    .map((o) => ((o.deliveredAt as Date).getTime() - (o.paidAt as Date).getTime()) / 3_600_000);

  const byTool = tools.map((t) => {
    const orders = paidOrders.filter((o) => o.toolId === t.id);
    const ai = aiAgg.find((a) => a.toolId === t.id)?._sum.costMicros ?? 0;
    return { toolId: t.id, name: t.name, paid: orders.length, revenueCents: orders.reduce((s, o) => s + o.amountCents, 0), aiCostCents: Math.round(microsToCents(ai)) };
  });

  const stripeFeesCents = estimateStripeFeesCents(paidOrders);
  const byCustomer = new Map<string, number>();
  for (const o of paidOrders) byCustomer.set(o.customerEmail, (byCustomer.get(o.customerEmail) ?? 0) + 1);
  const customers = byCustomer.size;
  const repeatCustomers = [...byCustomer.values()].filter((n) => n >= 2).length;

  const channelMap = new Map<string, { visits: number; paid: number; revenueCents: number }>();
  for (const pv of pageViews) {
    const src = sourceOf(pv.utm);
    const row = channelMap.get(src) ?? { visits: 0, paid: 0, revenueCents: 0 };
    row.visits++;
    channelMap.set(src, row);
  }
  for (const o of paidOrders) {
    const src = sourceOf(o.attribution);
    const row = channelMap.get(src) ?? { visits: 0, paid: 0, revenueCents: 0 };
    row.paid++;
    row.revenueCents += o.amountCents;
    channelMap.set(src, row);
  }

  return {
    from,
    to,
    visits: pageViews.length,
    uniqueSessions: sessions.size,
    intakeStarted,
    checkoutStarted,
    ordersPaid: paidOrders.length,
    ordersDelivered: delivered,
    ordersRefunded: refunded._count,
    ordersInReview: inReview,
    ordersFailed: failed,
    revenueCents,
    refundedCents,
    aiCostCents,
    channelCostCents,
    founderHours,
    grossContributionCents: revenueCents - refundedCents - aiCostCents - channelCostCents,
    conversionVisitToPaid: sessions.size ? paidOrders.length / sessions.size : 0,
    conversionCheckoutToPaid: checkoutStarted ? paidOrders.length / checkoutStarted : 0,
    avgOrderCents: paidOrders.length ? Math.round(revenueCents / paidOrders.length) : 0,
    avgDeliveryHours: deliveryHours.length ? deliveryHours.reduce((a, b) => a + b, 0) / deliveryHours.length : null,
    feedbackAvgRating: feedbackAgg._avg.rating ?? null,
    feedbackCount: feedbackAgg._count,
    byTool,
    byChannel: [...channelMap.entries()].map(([source, v]) => ({ source, ...v })).sort((a, b) => b.revenueCents - a.revenueCents),
    stripeFeesCents,
    netContributionCents: revenueCents - refundedCents - aiCostCents - channelCostCents - stripeFeesCents,
    revenuePerFounderHourCents: founderHours > 0 ? Math.round(revenueCents / founderHours) : null,
    customers,
    repeatCustomers,
    repeatRate: customers ? repeatCustomers / customers : 0,
    aiCostPerPaidOrderCents: paidOrders.length ? Math.round(aiCostCents / paidOrders.length) : 0,
    freeToolUses,
  };
}

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}
