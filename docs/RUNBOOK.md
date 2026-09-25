# Runbook — running ORVIONIS day to day

## Every morning (10 minutes)

1. Read the AI CEO email (or `/admin`): revenue, contribution, funnel, actions.
2. `/admin` → **Needs a human**: anything past its due time is red. Handle in due-date order.
3. `/admin/system`: failed jobs (requeue), errors, webhook events pending → if Stripe events are missing, check the endpoint in Stripe.
4. `/admin/feedback`: reply personally to every unhandled item, then mark handled.
5. Outreach block (docs/OUTREACH.md). Log hours.

## Fulfilling a Listing Clips order (concierge)

1. Open the order → read intake, download footage from the link (never from a public re-upload).
2. Open **Clip plan (structured)** and **Captions & hashtags** outputs — the AI-drafted 5 angles, hooks, on-screen text and shot lists.
3. Edit in CapCut/DaVinci: 1080×1920, 15–45 s each, overlays from intake (price, beds/baths, sqft), agent name/brokerage/logo, music per the intake vibe (royalty-free) or silent.
4. Export MP4 (H.264), upload to a share folder (Drive/Dropbox), copy the link.
5. Re-read captions for fair-housing wording. Fix if needed (edit in the delivery note).
6. Order page → **Deliver**: paste the link → the customer gets the email + order page with captions.
7. Note the editing time in *Internal notes* (needed for unit economics).
8. 24h later: send `delivery-followup`.

Target: ≤ 90 minutes per order. If it takes longer twice in a row, the next automation task is the overlay/caption step (ffmpeg templates), not more outreach.

## Automated tool flagged by QC

QC notes list what failed (missing price, placeholder text, model QA issue). Options on the order page: **Retry** (new version, same intake), **Approve QC flags** then **Deliver**, or refund. Never deliver output you haven't opened.

## Refunds

`/admin/orders/<id>` → Refund (full by default, partial by amount). Money moves immediately via Stripe; the order becomes REFUNDED when fully refunded. Refunds issued from the Stripe dashboard are synced by the `charge.refunded` webhook.

## Budgets and the kill switch

- `AI_DAILY_BUDGET_CENTS` / `AI_MAX_COST_PER_ORDER_CENTS` stop calls when exceeded (orders wait in RETRYING/REVIEW, nothing is lost).
- `/admin/system` → **Stop all AI calls** flips `Setting ai.kill_switch` instantly; turn it off the same way.
- `/admin/ai-costs` shows spend by model/purpose/tool; unit cost per order must stay far below price.

## Pausing or changing a tool

`/admin/tools`: set status `PAUSED` (landing shows "paused", checkout refuses), change price (logged, locked against code defaults). Status `VALIDATING` = orderable but shown as new in reporting.

## Incidents

| Symptom | Check | Fix |
| --- | --- | --- |
| Orders stuck in PAID | job loop down (`/api/health`: `worker.lastTickAt` stale or `jobs.queued` growing) | redeploy `web` (embedded loop restarts) or restart the worker service; or call `/api/internal/run-jobs` with `CRON_SECRET` |
| Payment made, order still PENDING | Stripe → Webhooks → deliveries failing | fix `STRIPE_WEBHOOK_SECRET`/URL, then *Resend* the event in Stripe; handler is idempotent |
| Emails not arriving | Resend domain not verified / `EMAIL_PROVIDER=console` | verify DNS; check Resend logs |
| AI failures | `/admin/ai-costs` failed calls; provider status page | fallback provider via `ANTHROPIC_API_KEY`; retry orders |
| Disk/DB growth | `/admin/system` stored files | switch `STORAGE_BACKEND=s3`; retention purges hourly |

## Weekly (Monday, 30 minutes)

Weekly CEO report arrives; update each experiment's status/conclusion in `/admin/experiments`; decide the one thing to build or kill this week; write it into `nextAction`.
