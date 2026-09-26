import { prisma } from "@/lib/db";
import { sourceOf } from "@/lib/analytics/attribution";
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
  /** Gross revenue: what Stripe actually charged on paid orders (after promotion codes). */
  revenueCents: number;
  refundedCents: number;
  /** gross − refunds − Stripe fees */
  netRevenueCents: number;
  /** gross − refunds − AI/API cost (variable cost of producing the orders) */
  revenueAfterAiCents: number;
  /** How many paid orders have Stripe's actual fee recorded (the rest are estimated). */
  stripeFeesActualCount: number;
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
  byTool: Array<{ toolId: string; name: string; views: number; started: number; previews: number; checkouts: number; paid: number; revenueCents: number; aiCostCents: number }>;
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
  /** Free watermarked previews shown, and how many of those sessions went on to checkout. */
  previewsShown: number;
  previewSessionsToCheckout: number;
};

export const STRIPE_FEE_PCT = 0.029;
export const STRIPE_FEE_FIXED_CENTS = 30;
export function estimateStripeFeesCents(orders: Array<{ amountCents: number }>): number {
  return Math.round(orders.reduce((s, o) => s + o.amountCents * STRIPE_FEE_PCT + STRIPE_FEE_FIXED_CENTS, 0));
}


export async function computeKpis(from: Date, to: Date): Promise<Kpis> {
  const range = { gte: from, lt: to };

  const [pageViews, intakeEvents, checkoutEvents, paidOrders, delivered, refunded, inReview, failed, aiAgg, channelCosts, feedbackAgg, tools, freeToolUses, previewEvents, checkoutSessions] =
    await Promise.all([
      prisma.event.findMany({ where: { name: "page_view", createdAt: range }, select: { sessionId: true, utm: true, path: true } }),
      prisma.event.findMany({ where: { name: "intake_started", createdAt: range }, select: { props: true } }),
      prisma.event.findMany({ where: { name: "checkout_started", createdAt: range }, select: { props: true } }),
      prisma.order.findMany({
        where: { paidAt: range, isTest: false },
        select: {
          id: true,
          toolId: true,
          amountCents: true,
          attribution: true,
          paidAt: true,
          deliveredAt: true,
          status: true,
          customerEmail: true,
          payments: { select: { amountCents: true, feeCents: true }, orderBy: { createdAt: "asc" }, take: 1 },
        },
      }),
      prisma.order.count({ where: { deliveredAt: range, isTest: false } }),
      prisma.refund.aggregate({ _sum: { amountCents: true }, _count: true, where: { createdAt: range, status: "SUCCEEDED" } }),
      prisma.order.count({ where: { status: "REVIEW" } }),
      prisma.order.count({ where: { status: "FAILED" } }),
      prisma.aiRequest.groupBy({ by: ["toolId"], _sum: { costMicros: true }, where: { createdAt: range } }),
      prisma.channelCost.aggregate({ _sum: { costCents: true, hours: true }, where: { date: range } }),
      prisma.feedback.aggregate({ _avg: { rating: true }, _count: true, where: { createdAt: range } }),
      prisma.tool.findMany({ select: { id: true, name: true, slug: true } }),
      prisma.event.count({ where: { name: "free_tool_used", createdAt: range } }),
      prisma.event.findMany({ where: { name: "preview_ready", createdAt: range }, select: { sessionId: true, props: true } }),
      prisma.event.findMany({ where: { name: "checkout_started", createdAt: range, sessionId: { not: null } }, select: { sessionId: true } }),
    ]);
  const checkoutSessionIds = new Set(checkoutSessions.map((e) => e.sessionId));
  const previewSessionIds = new Set(previewEvents.map((e) => e.sessionId).filter(Boolean) as string[]);

  const intakeStarted = intakeEvents.length;
  const checkoutStarted = checkoutEvents.length;
  const toolOf = (props: unknown) => ((props ?? {}) as { tool?: string }).tool;
  const sessions = new Set(pageViews.map((p) => p.sessionId).filter(Boolean) as string[]);
  // What Stripe actually charged (promotion codes included); the priced amount only when no payment row exists (admin tests).
  const charged = (o: (typeof paidOrders)[number]) => o.payments[0]?.amountCents ?? o.amountCents;
  const revenueCents = paidOrders.reduce((s, o) => s + charged(o), 0);
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
    const matches = (props: unknown) => toolOf(props) === t.id || toolOf(props) === t.slug;
    return {
      toolId: t.id,
      name: t.name,
      views: pageViews.filter((p) => p.path === `/tools/${t.slug}`).length,
      started: intakeEvents.filter((e) => matches(e.props)).length,
      previews: previewEvents.filter((e) => matches(e.props)).length,
      checkouts: checkoutEvents.filter((e) => matches(e.props)).length,
      paid: orders.length,
      revenueCents: orders.reduce((s, o) => s + charged(o), 0),
      aiCostCents: Math.round(microsToCents(ai)),
    };
  });

  // Stripe's actual fee where recorded (balance transaction), the estimate for the rest.
  const stripeFeesCents = paidOrders.reduce((s, o) => s + (o.payments[0]?.feeCents ?? estimateStripeFeesCents([{ amountCents: charged(o) }])), 0);
  const stripeFeesActualCount = paidOrders.filter((o) => o.payments[0]?.feeCents != null).length;
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
    row.revenueCents += charged(o);
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
    netRevenueCents: revenueCents - refundedCents - stripeFeesCents,
    revenueAfterAiCents: revenueCents - refundedCents - aiCostCents,
    stripeFeesActualCount,
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
    previewsShown: previewEvents.length,
    previewSessionsToCheckout: [...previewSessionIds].filter((id) => checkoutSessionIds.has(id)).length,
  };
}

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}
