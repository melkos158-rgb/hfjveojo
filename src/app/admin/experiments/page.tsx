import { prisma } from "@/lib/db";
import { StatusBadge, fmtDate } from "@/components/admin/Kpi";
import { formatUsd, microsToCents } from "@/lib/ai/pricing";
import { createExperimentAction, logChannelCostAction, updateExperimentAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminExperiments() {
  const experiments = await prisma.experiment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      orders: { select: { status: true, amountCents: true, paidAt: true, id: true } },
      costs: { select: { costCents: true, hours: true } },
      events: { select: { name: true } },
    },
  });
  const aiByExperiment = new Map<string, number>();
  for (const e of experiments) {
    const ids = e.orders.map((o) => o.id);
    if (ids.length === 0) continue;
    const agg = await prisma.aiRequest.aggregate({ _sum: { costMicros: true }, where: { orderId: { in: ids } } });
    aiByExperiment.set(e.id, agg._sum.costMicros ?? 0);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Experiments</h1>
        <p className="mt-1 text-sm text-gray-600">
          Hypothesis → offer → channel → numbers → conclusion. Attribute traffic with <code>?exp=KEY</code> (and optionally <code>&variant=KEY</code>) on any link.
        </p>
      </div>

      <div className="grid gap-4">
        {experiments.map((e) => {
          const paid = e.orders.filter((o) => o.paidAt);
          const revenue = paid.reduce((s, o) => s + o.amountCents, 0);
          const channel = e.costs.reduce((s, c) => s + c.costCents, 0);
          const hours = e.costs.reduce((s, c) => s + (c.hours ?? 0), 0);
          const ai = Math.round(microsToCents(aiByExperiment.get(e.id) ?? 0));
          const visits = e.events.filter((ev) => ev.name === "page_view").length;
          const expected = (e.expected ?? {}) as { orders?: number | null; revenueCents?: number | null; costCents?: number | null };
          return (
            <div key={e.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-bold">
                    {e.name} <span className="text-xs font-normal text-gray-500">({e.key})</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {fmtDate(e.startAt)} → {fmtDate(e.endAt)} · {e.channel} · {e.priceCents ? formatUsd(e.priceCents) : "—"}
                  </div>
                </div>
                <StatusBadge status={e.status} />
              </div>
              <p className="mt-2 text-sm">
                <strong>Hypothesis:</strong> {e.hypothesis}
              </p>
              <p className="text-sm">
                <strong>Target:</strong> {e.targetCustomer} · <strong>Offer:</strong> {e.offer}
              </p>
              <p className="text-sm">
                <strong>Success:</strong> {e.successCriteria} · <strong>Failure:</strong> {e.failureCriteria}
              </p>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
                <div>
                  Visits: <strong>{visits}</strong>
                </div>
                <div>
                  Paid: <strong>{paid.length}</strong> {expected.orders != null ? `(expected ${expected.orders})` : ""}
                </div>
                <div>
                  Revenue: <strong>{formatUsd(revenue)}</strong> {expected.revenueCents != null ? `(expected ${formatUsd(expected.revenueCents)})` : ""}
                </div>
                <div>
                  Profit after AI+channel: <strong>{formatUsd(revenue - ai - channel)}</strong> · {hours}h founder time
                </div>
              </div>
              {e.conclusion ? (
                <p className="mt-2 rounded-lg bg-mist p-2 text-sm">
                  <strong>Conclusion:</strong> {e.conclusion} {e.nextAction ? <em>→ {e.nextAction}</em> : null}
                </p>
              ) : null}
              <form action={updateExperimentAction} className="mt-3 grid gap-2 sm:grid-cols-4">
                <input type="hidden" name="id" value={e.id} />
                <select name="status" defaultValue={e.status} className="field-input">
                  {["PLANNED", "RUNNING", "WON", "LOST", "PAUSED"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input name="conclusion" defaultValue={e.conclusion ?? ""} placeholder="Conclusion (facts, not hopes)" className="field-input sm:col-span-2" />
                <input name="nextAction" defaultValue={e.nextAction ?? ""} placeholder="Next action" className="field-input" />
                <button className="btn-secondary sm:col-span-4" type="submit">
                  Update
                </button>
              </form>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={createExperimentAction} className="card space-y-2">
          <h2 className="font-bold">New experiment</h2>
          <input name="key" className="field-input" placeholder="key, e.g. e3-handymen-quotes" required />
          <input name="name" className="field-input" placeholder="Name" required />
          <textarea name="hypothesis" className="field-input" placeholder="Hypothesis: who pays what for what, and why we believe it" required />
          <input name="targetCustomer" className="field-input" placeholder="Target customer" required />
          <input name="offer" className="field-input" placeholder="Offer (deliverable + price + delivery)" required />
          <div className="grid grid-cols-2 gap-2">
            <input name="channel" className="field-input" placeholder="Channel" required />
            <input name="priceCents" className="field-input" placeholder="Price (cents)" />
          </div>
          <input name="successCriteria" className="field-input" placeholder="Success criteria (numbers + deadline)" required />
          <input name="failureCriteria" className="field-input" placeholder="Failure criteria (numbers + deadline)" required />
          <div className="grid grid-cols-3 gap-2">
            <input name="expectedOrders" className="field-input" placeholder="Exp. orders" />
            <input name="expectedRevenueCents" className="field-input" placeholder="Exp. revenue ¢" />
            <input name="expectedCostCents" className="field-input" placeholder="Exp. cost ¢" />
          </div>
          <button className="btn-primary w-full" type="submit">
            Start experiment
          </button>
        </form>

        <form action={logChannelCostAction} className="card space-y-2">
          <h2 className="font-bold">Log channel cost / founder time</h2>
          <p className="text-xs text-gray-600">Honest CAC needs every dollar and hour. Log outreach sessions, ad spend, tools.</p>
          <div className="grid grid-cols-2 gap-2">
            <input name="channel" className="field-input" placeholder="channel key, e.g. instagram_dm" required />
            <input name="channelName" className="field-input" placeholder="Display name" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input name="costCents" className="field-input" placeholder="Cost (cents)" defaultValue={0} />
            <input name="hours" className="field-input" placeholder="Hours" />
            <input name="experimentKey" className="field-input" placeholder="Experiment key" />
          </div>
          <input name="note" className="field-input" placeholder="Note (e.g. 20 DMs sent to Austin agents)" />
          <button className="btn-secondary w-full" type="submit">
            Log
          </button>
        </form>
      </div>
    </div>
  );
}
