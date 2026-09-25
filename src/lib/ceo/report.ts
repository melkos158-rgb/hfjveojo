import { prisma } from "@/lib/db";
import { complete } from "@/lib/ai";
import { computeKpis, daysAgo, type Kpis } from "@/lib/analytics/kpi";
import { formatUsd } from "@/lib/ai/pricing";
import { notifyAdmins } from "@/lib/orders/service";
import type { ReportPeriod } from "@prisma/client";

/**
 * AI CEO report: numbers first (computed, not guessed), then a short model-written interpretation with
 * the next actions. The model only sees aggregates — never customer PII.
 */
export function kpiSummaryText(k: Kpis): string {
  return [
    `Period: ${k.from.toISOString().slice(0, 10)} → ${k.to.toISOString().slice(0, 10)}`,
    `Visits: ${k.visits} (unique sessions ${k.uniqueSessions}) · intake started: ${k.intakeStarted} · checkout started: ${k.checkoutStarted}`,
    `Paid orders: ${k.ordersPaid} · delivered: ${k.ordersDelivered} · refunded: ${k.ordersRefunded} · in review now: ${k.ordersInReview} · failed now: ${k.ordersFailed}`,
    `Revenue: ${formatUsd(k.revenueCents)} · refunds: ${formatUsd(k.refundedCents)} · AI cost: ${formatUsd(k.aiCostCents)} · channel cost: ${formatUsd(k.channelCostCents)} · founder hours logged: ${k.founderHours}`,
    `Gross contribution (revenue − refunds − AI − channel spend; Stripe fees not deducted): ${formatUsd(k.grossContributionCents)}`,
    `Conversion visit→paid: ${(k.conversionVisitToPaid * 100).toFixed(2)}% · checkout→paid: ${(k.conversionCheckoutToPaid * 100).toFixed(1)}% · avg order: ${formatUsd(k.avgOrderCents)}`,
    `Avg delivery time: ${k.avgDeliveryHours === null ? "n/a" : `${k.avgDeliveryHours.toFixed(1)} h`} · feedback: ${k.feedbackCount} responses, avg rating ${k.feedbackAvgRating?.toFixed(2) ?? "n/a"}`,
    `By tool: ${k.byTool.map((t) => `${t.name}: ${t.paid} paid, ${formatUsd(t.revenueCents)}, AI ${formatUsd(t.aiCostCents)}`).join(" | ") || "none"}`,
    `By channel: ${k.byChannel.map((c) => `${c.source}: ${c.visits} visits, ${c.paid} paid, ${formatUsd(c.revenueCents)}`).join(" | ") || "none"}`,
  ].join("\n");
}

export async function generateCeoReport(period: ReportPeriod = "DAILY"): Promise<{ id: string; summary: string }> {
  const days = period === "DAILY" ? 1 : 7;
  const from = daysAgo(days);
  const to = daysAgo(0);
  const kpis = await computeKpis(from, to);
  const previous = await computeKpis(daysAgo(days * 2), from);
  const experiments = await prisma.experiment.findMany({ where: { status: "RUNNING" }, select: { key: true, name: true, hypothesis: true, successCriteria: true, failureCriteria: true, startAt: true } });
  const openFeedback = await prisma.feedback.findMany({ where: { handled: false }, orderBy: { createdAt: "desc" }, take: 5, select: { rating: true, text: true } });

  const context = [
    "CURRENT PERIOD",
    kpiSummaryText(kpis),
    "",
    "PREVIOUS PERIOD (same length)",
    kpiSummaryText(previous),
    "",
    "RUNNING EXPERIMENTS",
    experiments.length ? experiments.map((e) => `- ${e.key} "${e.name}": ${e.hypothesis}. Success: ${e.successCriteria}. Failure: ${e.failureCriteria}. Started ${e.startAt?.toISOString().slice(0, 10) ?? "?"}`).join("\n") : "none",
    "",
    "UNHANDLED FEEDBACK (latest 5)",
    openFeedback.length ? openFeedback.map((f) => `- [${f.rating ?? "-"}/5] ${f.text.slice(0, 200)}`).join("\n") : "none",
  ].join("\n");

  let summary = "";
  let recommendations: string[] = [];
  let costMicros = 0;
  try {
    const res = await complete(
      {
        tier: "cheap",
        system:
          "You are the AI CEO of a small AI-services business. You get aggregate metrics only. Write a brutally honest, short daily review: what happened, what it means, and the 3 most valuable actions for tomorrow ranked by expected profit impact. Distinguish facts (the numbers) from hypotheses. If the numbers are too small to conclude anything, say so and recommend the cheapest experiment to get signal. No fluff, no invented numbers. Format: 'SUMMARY:' paragraph, then 'ACTIONS:' with lines starting '1.', '2.', '3.'.",
        user: context,
        maxOutputTokens: 700,
      },
      { purpose: "report" },
    );
    costMicros = res.costMicros;
    const [s, a] = res.text.split(/ACTIONS:/i);
    summary = (s ?? res.text).replace(/^SUMMARY:\s*/i, "").trim();
    recommendations = (a ?? "")
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => /^\d+\./.test(l));
  } catch (err) {
    summary = `AI summary unavailable (${(err as Error).message.slice(0, 100)}). Numbers above are authoritative.`;
  }

  const report = await prisma.ceoReport.create({
    data: { period, periodStart: from, periodEnd: to, metrics: kpis as unknown as object, summary, recommendations, costMicros },
  });
  await notifyAdmins(`${period === "DAILY" ? "Daily" : "Weekly"} CEO report — ${formatUsd(kpis.revenueCents)} revenue, ${kpis.ordersPaid} paid`, `${kpiSummaryText(kpis)}\n\nSUMMARY\n${summary}\n\nACTIONS\n${recommendations.join("\n")}\n\nFull report: /admin/analytics`);
  return { id: report.id, summary };
}
