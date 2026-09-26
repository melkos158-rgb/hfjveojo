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

QC notes list what failed (missing price, placeholder text, model QA issue). Options on the order page: **Retry** (runs the pipeline again on the same intake; earlier runs stay listed, the customer only ever gets the set you deliver), **Approve QC flags** then **Deliver**, or refund. Never deliver output you haven't opened.

## Customer asks for a redo (delivered order)

Every tool page promises one redo when the result is unusable (Virtual Staging: the room's structure changed — a ceiling fixture, a built-in, a window). Open the order, look at the delivered files, then **Free redo** with a short internal reason. The pipeline runs again on the same brief:

- AUTO tools (staging, description, pricing guide) re-deliver on their own; the customer gets "Your redo is ready — order #N" with only the new files, and the order page swaps to the new set.
- Concierge tools (Listing Clips) go back to REVIEW; deliver the new link as usual.

Until the new files are delivered the customer keeps the last delivery on the order page. The card shows how many redos an order already had; a second one is your call (or refund). If the redo is still wrong, refund rather than looping.

## Refunds

`/admin/orders/<id>` → Refund (full by default, partial by amount). Money moves immediately via Stripe; the order becomes REFUNDED when fully refunded. Refunds issued from the Stripe dashboard are synced by the `charge.refunded` webhook.

## Budgets and the kill switch

Free staging previews (order form, watermarked): at most `FREE_PREVIEWS_PER_DAY` (15) a day for everyone, `FREE_PREVIEWS_PER_IP` (2) per visitor, and none once today's AI spend reaches 40 % of `AI_DAILY_BUDGET_CENTS`. Set `FREE_PREVIEWS_PER_DAY=0` to switch them off; they show as purpose `preview` in AI costs and as "Free staging previews" in analytics.

- `AI_DAILY_BUDGET_CENTS` / `AI_MAX_COST_PER_ORDER_CENTS` stop calls when exceeded (orders wait in RETRYING/REVIEW, nothing is lost).
- `/admin/system` → **Stop all AI calls** flips `Setting ai.kill_switch` instantly; turn it off the same way.
- `/admin/ai-costs` shows spend by model/purpose/tool; unit cost per order must stay far below price.

## Pausing or changing a tool

`/admin/tools`: set status `PAUSED` (landing shows "paused", checkout refuses), change price (logged, locked against code defaults). Status `VALIDATING` = orderable but shown as new in reporting.

## Incidents

| Symptom | Check | Fix |
| --- | --- | --- |
| Orders stuck in PAID | job loop down (`/api/health`: `worker.lastTickAt` stale or `jobs.queued` growing) | redeploy `web` (embedded loop restarts) or restart the worker service; or call `/api/internal/run-jobs` with `CRON_SECRET` |
| Order in PROCESSING for long | admin order page → Runs: "last heartbeat Ns ago" | Running pipelines send a heartbeat every 30 s. A deploy hands the order back at once (run marked "abandoned: worker shutdown", order → RETRYING, attempt not counted); a crashed worker's job is re-queued within ~20 min and the order taken over. **Retry** works on a PROCESSING order only when its run has been silent for 2 minutes (otherwise it would pay the AI twice). A 6-photo staging order legitimately takes up to ~12 minutes. |
| Payment made, order still PENDING | Stripe → Webhooks → deliveries failing | fix `STRIPE_WEBHOOK_SECRET`/URL, then *Resend* the event in Stripe; handler is idempotent |
| Emails not arriving | Resend domain not verified / `EMAIL_PROVIDER=console` | verify DNS; check Resend logs |
| AI failures | `/admin/ai-costs` failed calls; provider status page | fallback provider via `ANTHROPIC_API_KEY`; retry orders |
| Disk/DB growth | `/admin/system` stored files | switch `STORAGE_BACKEND=s3`; retention purges hourly |

## Weekly (Monday, 30 minutes)

Weekly CEO report arrives; update each experiment's status/conclusion in `/admin/experiments`; decide the one thing to build or kill this week; write it into `nextAction`.
