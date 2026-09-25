import Link from "next/link";
import { prisma } from "@/lib/db";
import { computeKpis, daysAgo } from "@/lib/analytics/kpi";
import { formatUsd } from "@/lib/ai/pricing";
import { Kpi, StatusBadge, fmtDate } from "@/components/admin/Kpi";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [k7, k30, review, latestReport] = await Promise.all([
    computeKpis(daysAgo(7), new Date(Date.now() + 60_000)),
    computeKpis(daysAgo(30), new Date(Date.now() + 60_000)),
    prisma.order.findMany({ where: { status: { in: ["REVIEW", "FAILED", "RETRYING"] } }, include: { tool: true }, orderBy: { dueAt: "asc" }, take: 20 }),
    prisma.ceoReport.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">Last 7 days</h1>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Revenue" value={formatUsd(k7.revenueCents)} sub={`${k7.ordersPaid} paid · 30d ${formatUsd(k30.revenueCents)}`} />
          <Kpi label="Gross contribution" value={formatUsd(k7.grossContributionCents)} sub={`AI ${formatUsd(k7.aiCostCents)} · channels ${formatUsd(k7.channelCostCents)} · refunds ${formatUsd(k7.refundedCents)}`} />
          <Kpi label="Visit → paid" value={`${(k7.conversionVisitToPaid * 100).toFixed(2)}%`} sub={`${k7.uniqueSessions} sessions · ${k7.checkoutStarted} checkouts`} />
          <Kpi label="Delivery" value={k7.avgDeliveryHours === null ? "—" : `${k7.avgDeliveryHours.toFixed(1)} h avg`} sub={`${k7.ordersDelivered} delivered · rating ${k7.feedbackAvgRating?.toFixed(1) ?? "—"}`} />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Needs a human ({review.length})</h2>
          <Link href="/admin/orders?status=REVIEW" className="text-sm font-semibold text-brand">
            All orders →
          </Link>
        </div>
        {review.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">Queue is empty. Go sell something.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-mist text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Tool</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Due</th>
                  <th className="px-3 py-2">QC</th>
                </tr>
              </thead>
              <tbody>
                {review.map((o) => (
                  <tr key={o.id} className="border-t border-line">
                    <td className="px-3 py-2">
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">
                        #{o.number}
                      </Link>
                      <div className="text-xs text-gray-500">{o.customerEmail}</div>
                    </td>
                    <td className="px-3 py-2">{o.tool.name}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className={`px-3 py-2 ${o.dueAt && o.dueAt < new Date() ? "font-semibold text-red-600" : ""}`}>{fmtDate(o.dueAt)}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{o.qcStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Latest AI CEO report</h2>
          <Link href="/admin/analytics" className="text-sm font-semibold text-brand">
            Analytics →
          </Link>
        </div>
        {latestReport ? (
          <div className="mt-3 text-sm">
            <div className="text-xs text-gray-500">
              {latestReport.period} · {fmtDate(latestReport.periodStart)} → {fmtDate(latestReport.periodEnd)}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-gray-800">{latestReport.summary}</p>
            <ul className="mt-3 list-disc pl-5 text-gray-800">
              {(latestReport.recommendations as string[]).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-600">No report yet — generate one from Analytics or wait for the nightly job.</p>
        )}
      </section>
    </div>
  );
}
