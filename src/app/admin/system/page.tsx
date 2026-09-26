import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { StatusBadge, fmtDate, Kpi } from "@/components/admin/Kpi";
import { aiSmokeTestAction, enqueueMaintenanceAction, requeueJobAction, runPipelineTestAction, toggleKillSwitchAction } from "@/app/admin/actions";
import { STRIPE_BRAND, stripeAccountSummary, stripeWebhookCheck, type StripeAccountSummary, type StripeWebhookCheck } from "@/lib/stripe/branding";

export const dynamic = "force-dynamic";

export default async function AdminSystem() {
  const e = env();
  const [jobs, errors, kill, stripeEvents, counts, smokeLast, stripeAcct, webhook] = await Promise.all([
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
    prisma.setting.findUnique({ where: { key: "ai.smoke_test_last" } }),
    stripeAccountSummary().catch((err: Error): StripeAccountSummary | { error: string } => ({ error: err.message.slice(0, 200) })),
    stripeWebhookCheck().catch((err: Error): StripeWebhookCheck | { error: string } => ({ error: err.message.slice(0, 200) })),
  ]);
  const lastSmoke = smokeLast?.value as { ok: boolean; message: string; at: string } | null;
  const killOn = kill?.value === true;
  const [queued, running, failed, files] = counts;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">System</h1>
      <div className="grid gap-4 sm:grid-cols-4">
        <Kpi label="Jobs queued / running / failed" value={`${queued} / ${running} / ${failed}`} />
        <Kpi label="Stored files" value={`${files._count}`} sub={`${((files._sum.sizeBytes ?? 0) / 1_048_576).toFixed(1)} MB · backend ${e.STORAGE_BACKEND}`} />
        <div className="card">
          <div className="text-xs font-medium uppercase text-gray-500">Environment</div>
          <div className="mt-1 text-2xl font-bold">{e.APP_ENV}</div>
          <div className="text-xs text-gray-500">{`AI ${e.AI_PROVIDER} · email ${e.EMAIL_PROVIDER} · jobs ${e.JOBS_INLINE ? "inline" : "worker"}`}</div>
          <form action={aiSmokeTestAction} className="mt-2">
            <button className="btn-secondary px-3 py-1.5" type="submit">
              Test AI provider
            </button>
          </form>
          {lastSmoke ? (
            <p className={`mt-2 text-xs ${lastSmoke.ok ? "text-green-600" : "text-red-600"}`}>
              {fmtDate(new Date(lastSmoke.at))}: {lastSmoke.message}
            </p>
          ) : null}
        </div>
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

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">Stripe account (what the buyer sees on Checkout)</h2>
          <a
            href={"error" in stripeAcct ? "https://dashboard.stripe.com/settings/branding" : `https://dashboard.stripe.com/${stripeAcct.id}/${stripeAcct.mode === "live" ? "" : "test/"}settings/branding`}
            target="_blank"
            rel="noopener"
            className="btn-secondary px-3 py-1.5"
          >
            Branding in Stripe →
          </a>
        </div>
        {e.STRIPE_SECRET_KEY.startsWith("sk_test_") || e.STRIPE_SECRET_KEY.startsWith("rk_test_") ? (
          <form action={runPipelineTestAction} className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-bg p-3">
            <button className="btn-primary px-3 py-1.5" type="submit">
              Run a full pipeline test order
            </button>
            <span className="text-xs text-gray-500">
              Sandbox only: creates a $9 Listing Description order for {e.ADMIN_EMAILS.split(",")[0]}, marks it paid with a synthetic Stripe event (no money), runs the real AI fulfilment and sends the real emails. Flagged as test — excluded from metrics.
            </span>
          </form>
        ) : null}
        <p className="mt-1 text-xs text-gray-500">
          Target: name {STRIPE_BRAND.name}, brand colour {STRIPE_BRAND.primaryColor}, accent {STRIPE_BRAND.secondaryColor}, icon public/brand/icon-512.png. Stripe does not allow an account to edit its own name/branding through the API, so this is set in the Dashboard (business name appears after activation).
        </p>
        {"error" in stripeAcct ? (
          <p className="mt-2 text-sm text-red-600">Cannot read the account: {stripeAcct.error}</p>
        ) : (
          <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="text-gray-500">Account</dt>
            <dd>
              {stripeAcct.id}
              {stripeAcct.displayName ? <span className="font-semibold"> · {stripeAcct.displayName}</span> : null} ·{" "}
              <span className={stripeAcct.mode === "live" ? "font-semibold text-green-600" : "font-semibold text-amber-700"}>{stripeAcct.mode} key</span> · charges {stripeAcct.chargesEnabled ? "enabled" : "not enabled"}
            </dd>
            <dt className="text-gray-500">Webhook</dt>
            <dd>
              {"error" in webhook ? (
                <span className="text-red-600">cannot list: {webhook.error}</span>
              ) : webhook.found ? (
                <>
                  <span className={webhook.status === "enabled" && webhook.missingEvents.length === 0 ? "text-green-600" : "text-amber-700"}>
                    {webhook.url} · {webhook.status}
                    {webhook.missingEvents.length ? ` · missing events: ${webhook.missingEvents.join(", ")}` : " · all 7 events"}
                  </span>
                </>
              ) : (
                <span className="font-semibold text-red-600">
                  none on this account for {webhook.url} — paid orders will never be marked PAID. Create the destination on THIS account (or point the key at the account that has it).
                </span>
              )}
            </dd>
            <dt className="text-gray-500">Business name</dt>
            <dd className={stripeAcct.businessName === STRIPE_BRAND.name ? "" : "text-amber-700"}>{stripeAcct.businessName ?? "—"}</dd>
            <dt className="text-gray-500">Support / URL</dt>
            <dd>
              {stripeAcct.supportEmail ?? "—"} · {stripeAcct.url ?? "—"}
            </dd>
            <dt className="text-gray-500">Branding</dt>
            <dd>
              {stripeAcct.primaryColor ?? "—"} / {stripeAcct.secondaryColor ?? "—"} · icon {stripeAcct.hasIcon ? "set" : "missing"} ·{" "}
              {stripeAcct.matches ? <span className="text-green-600">matches the site</span> : <span className="text-amber-700">differs from the site</span>}
            </dd>
          </dl>
        )}
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
