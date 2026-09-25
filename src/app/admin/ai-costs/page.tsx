import { prisma } from "@/lib/db";
import { daysAgo } from "@/lib/analytics/kpi";
import { formatUsd, microsToCents, priceTable } from "@/lib/ai/pricing";
import { env } from "@/lib/env";
import { todaysSpendMicros } from "@/lib/ai";
import { Kpi, fmtDate } from "@/components/admin/Kpi";

export const dynamic = "force-dynamic";

export default async function AdminAiCosts() {
  const since = daysAgo(30);
  const [byModel, byPurpose, byTool, recent, today, failures] = await Promise.all([
    prisma.aiRequest.groupBy({ by: ["provider", "model"], _sum: { costMicros: true, inputTokens: true, outputTokens: true }, _count: true, where: { createdAt: { gte: since } } }),
    prisma.aiRequest.groupBy({ by: ["purpose"], _sum: { costMicros: true }, _count: true, where: { createdAt: { gte: since } } }),
    prisma.aiRequest.groupBy({ by: ["toolId"], _sum: { costMicros: true }, _count: true, where: { createdAt: { gte: since } } }),
    prisma.aiRequest.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    todaysSpendMicros(),
    prisma.aiRequest.count({ where: { ok: false, createdAt: { gte: since } } }),
  ]);
  const total = byModel.reduce((s, r) => s + (r._sum.costMicros ?? 0), 0);
  const e = env();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">AI costs — last 30 days</h1>
      <div className="grid gap-4 sm:grid-cols-4">
        <Kpi label="Total spend" value={formatUsd(Math.round(microsToCents(total)))} />
        <Kpi label="Today" value={formatUsd(Math.round(microsToCents(today)))} sub={`budget ${formatUsd(e.AI_DAILY_BUDGET_CENTS)} / day`} />
        <Kpi label="Per-order cap" value={formatUsd(e.AI_MAX_COST_PER_ORDER_CENTS)} sub={`provider ${e.AI_PROVIDER}`} />
        <Kpi label="Failed calls" value={String(failures)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card">
          <h2 className="font-bold">By model</h2>
          {byModel.map((r) => (
            <div key={`${r.provider}-${r.model}`} className="mt-2 text-sm">
              <div className="flex justify-between">
                <span>
                  {r.provider}/{r.model}
                </span>
                <strong>{formatUsd(Math.round(microsToCents(r._sum.costMicros ?? 0)))}</strong>
              </div>
              <div className="text-xs text-gray-500">
                {r._count} calls · {r._sum.inputTokens ?? 0} in / {r._sum.outputTokens ?? 0} out
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <h2 className="font-bold">By purpose</h2>
          {byPurpose.map((r) => (
            <div key={r.purpose} className="mt-2 flex justify-between text-sm">
              <span>
                {r.purpose} ({r._count})
              </span>
              <strong>{formatUsd(Math.round(microsToCents(r._sum.costMicros ?? 0)))}</strong>
            </div>
          ))}
        </div>
        <div className="card">
          <h2 className="font-bold">By tool</h2>
          {byTool.map((r) => (
            <div key={r.toolId ?? "none"} className="mt-2 flex justify-between text-sm">
              <span>
                {r.toolId ?? "(reports)"} ({r._count})
              </span>
              <strong>{formatUsd(Math.round(microsToCents(r._sum.costMicros ?? 0)))}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold">Price table in use (USD per 1M tokens — verify against provider pricing)</h2>
        <div className="mt-2 grid gap-1 text-xs sm:grid-cols-3">
          {Object.entries(priceTable()).map(([m, p]) => (
            <div key={m}>
              {m}: in {p.in} / out {p.out}
            </div>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-bold">Recent calls</h2>
        <table className="mt-2 w-full text-left text-xs">
          <thead className="uppercase text-gray-500">
            <tr>
              <th className="py-1">When</th>
              <th className="py-1">Model</th>
              <th className="py-1">Purpose</th>
              <th className="py-1">Tokens</th>
              <th className="py-1">Cost</th>
              <th className="py-1">ms</th>
              <th className="py-1">OK</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="py-1">{fmtDate(r.createdAt)}</td>
                <td className="py-1">{r.model}</td>
                <td className="py-1">{r.purpose}</td>
                <td className="py-1">
                  {r.inputTokens}/{r.outputTokens}
                </td>
                <td className="py-1">{(microsToCents(r.costMicros) / 100).toFixed(4)}</td>
                <td className="py-1">{r.latencyMs}</td>
                <td className="py-1">{r.ok ? "✓" : `✗ ${r.error?.slice(0, 40) ?? ""}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
