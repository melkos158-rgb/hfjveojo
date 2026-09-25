import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { StatusBadge, fmtDate, Kpi } from "@/components/admin/Kpi";
import { enqueueMaintenanceAction, requeueJobAction, toggleKillSwitchAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminSystem() {
  const e = env();
  const [jobs, errors, kill, stripeEvents, counts] = await Promise.all([
    prisma.job.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.errorLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.setting.findUnique({ where: { key: "ai.kill_switch" } }),
    prisma.stripeEvent.findMany({ orderBy: { receivedAt: "desc" }, take: 15 }),
    Promise.all([
      prisma.job.count({ where: { status: "QUEUED" } }),
      prisma.job.count({ where: { status: "RUNNING" } }),
      prisma.job.count({ where: { status: "FAILED" } }),
      prisma.file.aggregate({ _sum: { sizeBytes: true }, _count: true }),
    ]),
  ]);
  const killOn = kill?.value === true;
  const [queued, running, failed, files] = counts;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">System</h1>
      <div className="grid gap-4 sm:grid-cols-4">
        <Kpi label="Jobs queued / running / failed" value={`${queued} / ${running} / ${failed}`} />
        <Kpi label="Stored files" value={`${files._count}`} sub={`${((files._sum.sizeBytes ?? 0) / 1_048_576).toFixed(1)} MB · backend ${e.STORAGE_BACKEND}`} />
        <Kpi label="Environment" value={e.APP_ENV} sub={`AI ${e.AI_PROVIDER} · email ${e.EMAIL_PROVIDER} · jobs ${e.JOBS_INLINE ? "inline" : "worker"}`} />
        <div className="card">
          <div className="text-xs font-medium uppercase text-gray-500">AI kill switch</div>
          <div className={`mt-1 text-2xl font-bold ${killOn ? "text-red-600" : "text-green-600"}`}>{killOn ? "ON — AI blocked" : "off"}</div>
          <form action={toggleKillSwitchAction} className="mt-2">
            <input type="hidden" name="on" value={killOn ? "0" : "1"} />
            <button className={killOn ? "btn-secondary px-3 py-1.5" : "btn-danger px-3 py-1.5"} type="submit">
              {killOn ? "Turn off" : "Stop all AI calls"}
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Jobs</h2>
            <form action={enqueueMaintenanceAction}>
              <button className="btn-secondary px-3 py-1.5" type="submit">
                Run maintenance
              </button>
            </form>
          </div>
          <div className="mt-2 space-y-1 text-xs">
            {jobs.map((j) => (
              <div key={j.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line py-1">
                <span>
                  {fmtDate(j.createdAt)} · {j.type} · <StatusBadge status={j.status} /> · {j.attempts}/{j.maxAttempts}
                  {j.lastError ? <span className="text-red-600"> · {j.lastError.slice(0, 80)}</span> : null}
                </span>
                {j.status === "FAILED" ? (
                  <form action={requeueJobAction}>
                    <input type="hidden" name="id" value={j.id} />
                    <button className="underline" type="submit">
                      requeue
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2 className="font-bold">Recent errors</h2>
          <div className="mt-2 space-y-2 text-xs">
            {errors.map((er) => (
              <details key={er.id} className="border-t border-line py-1">
                <summary className="cursor-pointer">
                  {fmtDate(er.createdAt)} · {er.message.slice(0, 120)}
                </summary>
                <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap">{er.stack ?? ""}\n{JSON.stringify(er.context ?? {}, null, 2)}</pre>
              </details>
            ))}
            {errors.length === 0 ? <p className="text-gray-500">No errors logged.</p> : null}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold">Stripe webhook events</h2>
        <div className="mt-2 space-y-1 text-xs">
          {stripeEvents.map((ev) => (
            <div key={ev.id} className="border-t border-line py-1">
              {fmtDate(ev.receivedAt)} · {ev.type} · {ev.processedAt ? "processed" : "pending"} {ev.error ? <span className="text-red-600">· {ev.error.slice(0, 80)}</span> : null}
            </div>
          ))}
          {stripeEvents.length === 0 ? <p className="text-gray-500">No events received yet — check the webhook endpoint in Stripe.</p> : null}
        </div>
      </div>
    </div>
  );
}
