import { prisma } from "@/lib/db";
import { computeKpis, daysAgo } from "@/lib/analytics/kpi";
import { formatUsd } from "@/lib/ai/pricing";
import { Kpi, fmtDate } from "@/components/admin/Kpi";
import { runReportNowAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminAnalytics({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: d } = await searchParams;
  const days = Math.min(Math.max(Number(d ?? 30) || 30, 1), 365);
  const k = await computeKpis(daysAgo(days), new Date(Date.now() + 60_000));
  const reports = await prisma.ceoReport.findMany({ orderBy: { createdAt: "desc" }, take: 7 });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Analytics — last {days} days</h1>
        <form className="flex gap-2">
          {[7, 30, 90].map((n) => (
            <button key={n} name="days" value={n} className={`btn-secondary px-3 py-1.5 ${n === days ? "bg-mist" : ""}`}>
              {n}d
            </button>
          ))}
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Visits / sessions" value={`${k.visits} / ${k.uniqueSessions}`} />
        <Kpi label="Funnel" value={`${k.intakeStarted} → ${k.checkoutStarted} → ${k.ordersPaid}`} sub="intake → checkout → paid" />
        <Kpi label="Gross revenue" value={formatUsd(k.revenueCents)} sub={`${k.ordersPaid} paid · AOV ${formatUsd(k.avgOrderCents)} · refunds ${formatUsd(k.refundedCents)}`} />
        <Kpi
          label="Net revenue"
          value={formatUsd(k.netRevenueCents)}
          sub={`gross − refunds − Stripe fees ${formatUsd(k.stripeFeesCents)} (${k.stripeFeesActualCount}/${k.ordersPaid} actual, rest estimated)`}
        />
        <Kpi label="Revenue after AI" value={formatUsd(k.revenueAfterAiCents)} sub={`gross − refunds − AI/API ${formatUsd(k.aiCostCents)}`} />
        <Kpi label="Profit estimate" value={formatUsd(k.netContributionCents)} sub={`net revenue − AI ${formatUsd(k.aiCostCents)} − channels ${formatUsd(k.channelCostCents)} · ${k.founderHours}h logged`} />
        <Kpi label="Revenue / founder hour" value={k.revenuePerFounderHourCents === null ? "—" : formatUsd(k.revenuePerFounderHourCents)} sub="log hours in Experiments → channel cost" />
        <Kpi label="Customers / repeat" value={`${k.customers} / ${k.repeatCustomers}`} sub={`${(k.repeatRate * 100).toFixed(0)}% bought twice · AI ${formatUsd(k.aiCostPerPaidOrderCents)} per paid order`} />
        <Kpi label="Free tool uses" value={`${k.freeToolUses}`} sub="checker + calculator sessions" />
        <Kpi label="Free staging previews" value={`${k.previewsShown}`} sub={`${k.previewSessionsToCheckout} of those sessions went to checkout`} />
        <Kpi label="Visit → paid" value={`${(k.conversionVisitToPaid * 100).toFixed(2)}%`} />
        <Kpi label="Checkout → paid" value={`${(k.conversionCheckoutToPaid * 100).toFixed(1)}%`} />
        <Kpi label="Delivered / review / failed" value={`${k.ordersDelivered} / ${k.ordersInReview} / ${k.ordersFailed}`} />
        <Kpi label="Feedback" value={k.feedbackAvgRating ? `${k.feedbackAvgRating.toFixed(1)} ★` : "—"} sub={`${k.feedbackCount} responses`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-bold">By tool</h2>
          <table className="mt-2 w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-500">
              <tr>
                <th className="py-1">Tool</th>
                <th className="py-1" title="tool page views → order form started → free previews → checkouts">Funnel</th>
                <th className="py-1">Paid</th>
                <th className="py-1">Revenue</th>
                <th className="py-1">AI cost</th>
                <th className="py-1">AI / order</th>
              </tr>
            </thead>
            <tbody>
              {k.byTool.map((t) => (
                <tr key={t.toolId} className="border-t border-line">
                  <td className="py-1">{t.name}</td>
                  <td className="py-1 text-xs text-gray-600" title="views → started → previews → checkout">
                    {t.views}→{t.started}→{t.previews}→{t.checkouts}
                  </td>
                  <td className="py-1">{t.paid}</td>
                  <td className="py-1">{formatUsd(t.revenueCents)}</td>
                  <td className="py-1">{formatUsd(t.aiCostCents)}</td>
                  <td className="py-1">{t.paid ? formatUsd(Math.round(t.aiCostCents / t.paid)) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2 className="font-bold">By channel (first touch)</h2>
          <table className="mt-2 w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-500">
              <tr>
                <th className="py-1">Source</th>
                <th className="py-1">Visits</th>
                <th className="py-1">Paid</th>
                <th className="py-1">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {k.byChannel.map((c) => (
                <tr key={c.source} className="border-t border-line">
                  <td className="py-1">{c.source}</td>
                  <td className="py-1">{c.visits}</td>
                  <td className="py-1">{c.paid}</td>
                  <td className="py-1">{formatUsd(c.revenueCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">AI CEO reports</h2>
          <form action={runReportNowAction}>
            <button className="btn-secondary px-3 py-1.5" type="submit">
              Generate daily report now
            </button>
          </form>
        </div>
        <div className="mt-3 space-y-4">
          {reports.map((r) => (
            <details key={r.id} className="rounded-lg border border-line p-3" open={r.id === reports[0]?.id}>
              <summary className="cursor-pointer text-sm font-semibold">
                {r.period} · {fmtDate(r.periodStart)} → {fmtDate(r.periodEnd)} · generated {fmtDate(r.createdAt)}
              </summary>
              <p className="mt-2 whitespace-pre-wrap text-sm">{r.summary}</p>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {(r.recommendations as string[]).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </details>
          ))}
          {reports.length === 0 ? <p className="text-sm text-gray-500">No reports yet.</p> : null}
        </div>
      </div>
    </div>
  );
}
