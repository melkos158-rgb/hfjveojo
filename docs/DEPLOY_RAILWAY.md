# Deploying ORVIONIS on Railway (replacing Ride Lab on orvionis.com)

Target topology: **one Railway project, two services** — `web` (Next.js) and `postgres` (Railway Postgres plugin). The web process embeds the job loop (`EMBEDDED_WORKER=true`, see `src/instrumentation.ts`), so retries, hourly maintenance and the daily CEO report run without a separate worker. A dedicated `worker` service (`npm run worker`, same repo) is optional for higher throughput; when you add it, set `EMBEDDED_WORKER=false` on `web`.

## 0. Replace Ride Lab (one-time)

The domain currently serves the Ride Lab store from the existing repo + Railway service. ORVIONIS takes that place:

1. **Backups first** (irreversible steps below): export anything from Ride Lab you may need — Railway → old service → Postgres → *Backups* or `pg_dump`; Stripe data stays in Stripe regardless.
2. **Repo**: in the existing GitHub repo, create a branch `orvionis`, delete the old application files, copy this repository's contents in (keep `.git`), commit, open a PR, merge to `main`. Git history keeps Ride Lab if you ever need it. (Alternative: create a fresh repo and point the Railway service at it.)
3. **Railway service variables**: remove every Ride Lab variable from the `web` service, then add the variables in section 3. Old secrets must not remain — they are the wrong app's credentials.
4. **Database**: add a **new** Postgres service for ORVIONIS rather than reusing Ride Lab's database (the schemas are unrelated). Delete the old database service only after step 1.
5. **Domain**: `orvionis.com` stays attached to the same `web` service, so the first successful deploy of the new code replaces Ride Lab with no DNS change. If you deploy ORVIONIS as a *new* service instead, move the custom domain in Railway → Settings → Domains (remove from old, add to new).
6. **Stripe**: same account. Create the new webhook endpoint (section 4). Archive the Ride Lab products in the Stripe dashboard so they don't confuse reporting (optional).

Human approval required for: deleting the old database/service, deleting Stripe products, and any DNS change.

## 1. Services

| Service | Source | Build | Start | Notes |
| --- | --- | --- | --- | --- |
| `web` | GitHub repo, branch `main` | `npm run build` (auto) | `npm run start:railway` | runs `prisma migrate deploy` then `next start`; healthcheck `/api/health` (set in `railway.json`) |
| `worker` | same repo | `npm run build` | `npm run worker` | no public domain; scale to 1 replica |
| `postgres` | Railway Postgres | — | — | copy `DATABASE_URL` into both services (use the private URL) |

`railway.json` in the repo configures the `web` service (healthcheck path, restart policy, start command). For `worker`, override the start command in the service settings.

## 2. GitHub

- Default branch `main` = production. Every push deploys `web` and `worker`.
- Branch protection: require the CI workflow (`.github/workflows/ci.yml`: gitleaks, typecheck, tests, build) before merge.
- Optional: enable Railway PR environments for previews.

## 3. Variables (Railway → service → Variables)

Set on **both** `web` and `worker` unless noted. Never commit them.

```
APP_ENV=production
NEXT_PUBLIC_APP_URL=https://orvionis.com
NEXT_PUBLIC_BRAND_NAME=ORVIONIS
ADMIN_EMAILS=<your email>
DATABASE_URL=${{Postgres.DATABASE_URL}}          # Railway reference to the Postgres service
AUTH_SECRET=<openssl rand -base64 48>
SIGNING_SECRET=<openssl rand -base64 48>
SESSION_TTL_DAYS=30
STRIPE_SECRET_KEY=sk_live_...                     # test key first, live key after the test order works
STRIPE_WEBHOOK_SECRET=whsec_...                   # from step 4
STRIPE_CURRENCY=usd
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=                                # optional fallback
AI_MODEL_CHEAP=gpt-4.1-mini
AI_MODEL_STANDARD=gpt-4.1
AI_MODEL_BEST=gpt-4.1
AI_DAILY_BUDGET_CENTS=500
AI_MAX_COST_PER_ORDER_CENTS=100
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
EMAIL_FROM=ORVIONIS <hello@orvionis.com>
EMAIL_REPLY_TO=<your email>
STORAGE_BACKEND=db                                # switch to s3 + S3_* when files grow (Cloudflare R2 works)
JOBS_INLINE=true                                  # web without a worker service: fulfil right after the webhook; false once a worker service exists
EMBEDDED_WORKER=true                              # web: job loop in-process (retries, maintenance, daily report). false when a worker service exists
EMBEDDED_WORKER_POLL_MS=10000                     # web only
WORKER_CONCURRENCY=2                              # worker service only
WORKER_POLL_MS=2000                               # worker service only
CRON_SECRET=<openssl rand -hex 24>
LOG_LEVEL=info
```

`NEXT_PUBLIC_*` values are baked into the client bundle at build time — change them and redeploy.

## 4. Stripe

1. Dashboard → Developers → Webhooks → *Add endpoint*: `https://orvionis.com/api/stripe/webhook`.
2. Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`.
3. Copy the signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy `web`.
4. Dashboard → Settings → Public details: business name, support email; Checkout branding (logo, colour).
5. Do a **test-mode** end-to-end order (card `4242 4242 4242 4242`) before switching to live keys. Check `/admin/system` shows the webhook events as processed.
6. Consider enabling **Stripe Tax** if you need to collect sales tax/VAT (see `docs/LEGAL_FLAGS.md`).

## 5. Email (Resend)

Add and verify the sending domain (`orvionis.com`) in Resend: SPF + DKIM DNS records. Until verified, transactional emails will not deliver reliably — keep `EMAIL_PROVIDER=console` and read links from logs.

## 6. First deploy checklist

1. Push `main` → Railway builds `web` and `worker` (`npm ci` runs `prisma generate`; the build runs it again).
2. `web` start runs `prisma migrate deploy` → applies `prisma/migrations/*`.
3. Open a Railway shell on `web` (or run locally against the production `DATABASE_URL`) and run `npm run db:seed` once → tools, products, admin user, experiments.
4. `https://orvionis.com/api/health` → `{"ok":true,"db":"up",...}`.
5. `/login` with your admin email → `/admin` loads.
6. `/admin/tools`: both tools `LIVE`. Prices correct.
7. Test order in Stripe test mode: intake → Checkout → success page → order page shows *Paid — queued* → *Delivered* (auto tool) within a couple of minutes; check email arrives; check `/admin/ai-costs` logged the calls.
8. Switch Stripe keys to live, redeploy `web`, place a real $29 order with your own card, refund it from `/admin/orders/<id>` — this verifies the money path both ways.

## 7. Scheduled work

The job loop (embedded in `web`, or the worker service) schedules the daily CEO report (06:10 UTC) and hourly maintenance itself; `/api/health` shows its heartbeat (`worker.lastTickAt`). Only if you run with `EMBEDDED_WORKER=false` **and** no worker service, add a Railway cron service (or GitHub Actions schedule) that calls:

```
curl -X POST https://orvionis.com/api/internal/run-jobs -H "Authorization: Bearer $CRON_SECRET"      # every minute
curl -X POST https://orvionis.com/api/internal/daily-report -H "Authorization: Bearer $CRON_SECRET"  # daily
```

## 8. Logs, errors, rollback

- Logs: Railway → service → Logs (JSON lines from `src/lib/logger.ts`).
- Application errors: `/admin/system` (persisted `ErrorLog`), plus Stripe webhook events and failed jobs with a *requeue* button.
- Rollback: Railway → Deployments → previous deployment → *Redeploy*. Migrations are additive in V1; if a future migration must be reverted, write a down migration — never edit the schema by hand.
- Sentry: set `SENTRY_DSN`, install `@sentry/nextjs`, and call `Sentry.captureException` inside `reportError()` (`src/lib/errors.ts`) — the hook is marked in the code.

## 9. Storage growth

`STORAGE_BACKEND=db` keeps PDFs and logos in Postgres (fine for thousands of ~200 KB files). When you add video delivery or large inputs, create a Cloudflare R2 bucket, set `STORAGE_BACKEND=s3` and the `S3_*` variables; no code change is needed. Expired files are purged hourly by maintenance according to `FILE_RETENTION_DAYS_*`.
