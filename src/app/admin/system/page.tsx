import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { StatusBadge, fmtDate, Kpi } from "@/components/admin/Kpi";
import { aiSmokeTestAction, enqueueMaintenanceAction, ensureStripeWebhookAction, requeueJobAction, runPipelineTestAction, stripeWebhookProbeAction, toggleKillSwitchAction } from "@/app/admin/actions";
import { REQUIRED_WEBHOOK_EVENTS, STRIPE_BRAND, stripeAccountSummary, stripeWebhookCheck, type StripeAccountSummary, type StripeWebhookCheck } from "@/lib/stripe/branding";
import { stripeConfigSummary, type StripeMode } from "@/lib/stripe/mode";
import { TEST_INTAKES } from "@/lib/tools/samples/test-intakes";

export const dynamic = "force-dynamic";

export default async function AdminSystem() {
  const e = env();
  const cfg = stripeConfigSummary();
  const [jobs, errors, kill, stripeEvents, counts, smokeLast, stripeModes] = await Promise.all([
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
    Promise.all((["live", "test"] as const).map((mode) => loadStripeMode(mode, cfg))),
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
          <h2 className="font-bold">Stripe payments</h2>
          <span className={`badge ${cfg.checkoutMode === "live" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
            Customer checkouts: {cfg.checkoutMode.toUpperCase()} (STRIPE_MODE)
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Sandbox and live keys live side by side; an order keeps the mode it was paid in, and only events of that mode can change it. Switch STRIPE_MODE to live in Railway only when the live column below shows the key, charges enabled, the destination with all {REQUIRED_WEBHOOK_EVENTS.length} events, STRIPE_LIVE_WEBHOOK_SECRET set and a live probe event received.
        </p>
        {cfg.problems.length ? (
          <ul className="mt-3 space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            {cfg.problems.map((p) => (
              <li key={p}>• {p}</li>
            ))}
          </ul>
        ) : null}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {stripeModes.map((m) => (
            <StripeModePanel key={m.mode} m={m} active={cfg.checkoutMode === m.mode} />
          ))}
        </div>
        {cfg.test.keyVar ? (
          <form action={runPipelineTestAction} className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-bg p-3">
            <select name="tool" className="field-input w-auto py-1.5 text-sm" defaultValue="listing-description">
              {Object.keys(TEST_INTAKES).map((slug) => (
                <option key={slug} value={slug}>
                  {slug}
                </option>
              ))}
            </select>
            <button className="btn-primary px-3 py-1.5" type="submit">
              Run a full pipeline test order
            </button>
            <span className="text-xs text-gray-500">
              Always in the sandbox, also when checkouts are live: creates an order for {e.ADMIN_EMAILS.split(",")[0]}, marks it paid with a synthetic Stripe event (no money), runs the real fulfilment (AI, PDF, QC) and sends the real emails. Concierge tools stop in REVIEW for you to deliver. Flagged as test — excluded from metrics.
            </span>
          </form>
        ) : null}
        <p className="mt-3 text-xs text-gray-500">
          Checkout branding target: name {STRIPE_BRAND.name}, brand color {STRIPE_BRAND.primaryColor}, accent {STRIPE_BRAND.secondaryColor}, icon public/brand/icon-512.png — set in the Dashboard of each account (Stripe does not let an account edit its own name/branding through the API).
        </p>
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

type ModeData = Awaited<ReturnType<typeof loadStripeMode>>;

async function loadStripeMode(mode: StripeMode, cfg: ReturnType<typeof stripeConfigSummary>) {
  const keyVar = mode === "live" ? cfg.live.keyVar : cfg.test.keyVar;
  const fail = (err: Error) => ({ error: err.message.slice(0, 200) });
  const [acct, webhook, lastEvent, ensure, probe] = await Promise.all([
    keyVar ? stripeAccountSummary(mode).catch((err: Error): StripeAccountSummary | { error: string } => fail(err)) : null,
    keyVar ? stripeWebhookCheck(mode).catch((err: Error): StripeWebhookCheck | { error: string } => fail(err)) : null,
    prisma.stripeEvent.findFirst({
      where: { payload: { path: ["livemode"], equals: mode === "live" } },
      orderBy: { receivedAt: "desc" },
      select: { type: true, receivedAt: true, processedAt: true, error: true },
    }),
    prisma.setting.findUnique({ where: { key: `stripe.webhook_ensure.${mode}` } }),
    prisma.setting.findUnique({ where: { key: `stripe.webhook_probe.${mode}` } }),
  ]);
  return {
    mode,
    keyVar,
    webhookSecret: mode === "live" ? cfg.live.webhookSecret : cfg.test.webhookSecret,
    secretVar: mode === "live" ? "STRIPE_LIVE_WEBHOOK_SECRET" : "STRIPE_WEBHOOK_SECRET",
    acct,
    webhook,
    lastEvent,
    ensure: ensure?.value as { action: string; id: string; at: string } | undefined,
    probe: probe?.value as { sessionId: string; at: string } | undefined,
  };
}

function Ok({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <span className={ok ? "text-green-600" : "font-semibold text-amber-700"}>{children}</span>;
}

function StripeModePanel({ m, active }: { m: ModeData; active: boolean }) {
  const title = m.mode === "live" ? "Live" : "Sandbox (test)";
  const acct = m.acct && !("error" in m.acct) ? m.acct : null;
  const hook = m.webhook && !("error" in m.webhook) ? m.webhook : null;
  const probeSeen = Boolean(m.probe && m.lastEvent && m.lastEvent.receivedAt >= new Date(m.probe.at));
  return (
    <div className={`rounded-xl border p-4 ${active ? "border-accent" : "border-line"}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-bold">{title}</h3>
        {active ? <span className="badge bg-accent-soft text-accent">customers pay here</span> : null}
      </div>
      <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-gray-500">Secret key</dt>
        <dd>{m.keyVar ? <Ok ok>set ({m.keyVar})</Ok> : <Ok ok={false}>not set{m.mode === "live" ? " — add STRIPE_LIVE_SECRET_KEY in Railway" : ""}</Ok>}</dd>
        <dt className="text-gray-500">Account</dt>
        <dd>
          {m.acct && "error" in m.acct ? (
            <span className="text-red-600">{m.acct.error}</span>
          ) : acct ? (
            <>
              {acct.id}
              {acct.displayName ? <span className="font-semibold"> · {acct.displayName}</span> : null}
              {acct.businessName ? ` · ${acct.businessName}` : ""}
            </>
          ) : (
            "—"
          )}
        </dd>
        <dt className="text-gray-500">Can take money</dt>
        <dd>
          {acct ? (
            <>
              <Ok ok={acct.chargesEnabled}>charges {acct.chargesEnabled ? "enabled" : "not enabled"}</Ok> · <Ok ok={acct.payoutsEnabled}>payouts {acct.payoutsEnabled ? "enabled" : "not enabled"}</Ok> · <Ok ok={acct.detailsSubmitted}>details {acct.detailsSubmitted ? "submitted" : "missing"}</Ok>
              {acct.disabledReason ? <div className="text-xs text-amber-700">Stripe: {acct.disabledReason}</div> : null}
              {acct.requirementsDue.length ? <div className="text-xs text-amber-700">Stripe still needs: {acct.requirementsDue.join(", ")}</div> : null}
            </>
          ) : (
            "—"
          )}
        </dd>
        <dt className="text-gray-500">Destination</dt>
        <dd>
          {m.webhook && "error" in m.webhook ? (
            <span className="text-red-600">cannot list: {m.webhook.error}</span>
          ) : hook ? (
            hook.found ? (
              <Ok ok={hook.status === "enabled" && hook.missingEvents.length === 0}>
                {hook.status} · {hook.missingEvents.length ? `missing ${hook.missingEvents.join(", ")}` : `all ${REQUIRED_WEBHOOK_EVENTS.length} events`}
              </Ok>
            ) : (
              <Ok ok={false}>none for {hook.url}</Ok>
            )
          ) : (
            "—"
          )}
        </dd>
        <dt className="text-gray-500">Signing secret</dt>
        <dd>{m.webhookSecret ? <Ok ok>set ({m.secretVar})</Ok> : <Ok ok={false}>{m.secretVar} not set</Ok>}</dd>
        <dt className="text-gray-500">Last event</dt>
        <dd>
          {m.lastEvent ? (
            <Ok ok={!m.lastEvent.error}>
              {m.lastEvent.type} · {fmtDate(m.lastEvent.receivedAt)}
              {m.lastEvent.error ? ` · error: ${m.lastEvent.error.slice(0, 80)}` : m.lastEvent.processedAt ? " · processed" : ""}
            </Ok>
          ) : (
            "none received yet"
          )}
        </dd>
        {m.probe ? (
          <>
            <dt className="text-gray-500">Probe</dt>
            <dd>
              sent {fmtDate(new Date(m.probe.at))} · {probeSeen ? <Ok ok>event received — webhook path verified</Ok> : <Ok ok={false}>waiting for the event (reload in a few seconds; if it never comes, the signing secret or destination is wrong)</Ok>}
            </dd>
          </>
        ) : null}
      </dl>
      {m.keyVar ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={ensureStripeWebhookAction}>
            <input type="hidden" name="mode" value={m.mode} />
            <button className="btn-secondary px-3 py-1.5 text-xs" type="submit">
              {hook?.found ? "Repair destination events" : "Create webhook destination"}
            </button>
          </form>
          {m.webhookSecret && hook?.found ? (
            <form action={stripeWebhookProbeAction}>
              <input type="hidden" name="mode" value={m.mode} />
              <button className="btn-secondary px-3 py-1.5 text-xs" type="submit">
                Send probe event (no charge)
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
      {m.ensure ? (
        <p className="mt-2 text-xs text-gray-500">
          Destination {m.ensure.action} {fmtDate(new Date(m.ensure.at))} ({m.ensure.id}).{" "}
          {m.ensure.action === "created" ? `Now reveal its signing secret in the Stripe Dashboard (Developers → Webhooks → this destination) and store it in Railway as ${m.secretVar}.` : ""}
        </p>
      ) : null}
    </div>
  );
}
