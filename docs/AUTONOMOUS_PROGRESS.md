# ORVIONIS — autonomous progress (read this first)

Persistent state for the autonomous operator. Update after every significant task. Timestamps are UTC+2 (owner's time).
Companion files: `OPERATOR.md` (infrastructure facts, owner actions, long session log), `docs/REQUIRED_SERVICES_AND_KEYS.md`, `docs/ENVIRONMENT_VARIABLES.md`, `docs/RUNBOOK.md`.

## CURRENT STATUS

- Production **live and healthy** at https://orvionis.com (Railway `courageous-flow` → service `hfjveojo`, EU West). Health: `/api/health` ok, embedded job loop ticking, hourly maintenance running.
- 4 tools live: Listing Clips ($49, concierge 48 h), Photographer Pricing Guide ($29, auto), Listing Description ($9, auto), **Virtual Staging ($15, auto, gpt-image-2)** — proven in production 2026-09-26 15:17 (order #6: two clean staged versions in < 1 min, AI cost ≈ $0.11). Every tool page shows a real sample deliverable (Virtual Staging: the unedited output of order #6, not a mock-up).
- Payments: Stripe **sandbox** (`acct_1UIuDh2cM37Fu7zW` "orvionis sandbox"); key + webhook on the same account (webhook enabled, all 7 events). **Stripe → our webhook delivery is proven**: the real `checkout.session.expired` events of the pipeline-test sessions (04:54, 05:07) arrived signed and were processed. No real money possible until Stripe live activation (owner).
- AI: OpenAI key live; smoke test in production answered "OK" (gpt-4.1-mini, 1.6 s, $0.0001). Budget guards: $5/day, $1/order.
- Auth: magic link (email) + **Google sign-in** (verified end-to-end in production 2026-09-26 03:50). Admin = `ADMIN_EMAILS`.
- Email: Resend domain `orvionis.com` **verified** (03:40). Sign-in link, order confirmation and delivery emails delivered in production (Resend log).
- **End-to-end pipeline proven in production** for all four tools (orders #2–#6, all `isTest`): synthetic paid event → real AI fulfilment → QC → delivery + emails. The only untested link is Stripe's own card form (needs a human with the test card).
- Free lead magnet: `/free/fair-housing-checker`. Search Console: domain verified, sitemap submitted.

## CURRENT PRIORITY

1. (P0, owner) Stripe live activation → live `STRIPE_SECRET_KEY` + live webhook destination + `STRIPE_WEBHOOK_SECRET`. Without it there is no revenue.
2. (P1, owner) One sandbox purchase with the test card `4242 4242 4242 4242` on https://orvionis.com/tools/listing-description — webhook delivery is already proven, so this only checks Stripe's card form end to end; then the same in live with a real $9 order.
3. (P1, operator) Start acquisition: the vacant-listing DM (`re-ig-dm-staging`, strongest visual proof) and the $9 description DM (`re-ig-dm-9`) — 20 personal messages/day, tracked with UTM + experiment keys. Needs the owner to send from his accounts (the operator does not send messages on his behalf without per-message approval).
4. (P2, operator) Conversion + acquisition assets: outreach kit with links to samples/free tool; second free tool for photographers (pricing calculator); admin metrics for the 90-day experiment (Stripe fees, revenue/hour, repeat purchases).
5. (P2) AI cost control audit (§14): **verified 2026-09-26** — every intake field has a zod max length, orders are rate-limited per IP (10 / 10 min), uploads 20 / 10 min and 8 MB, OpenAI client timeout 120 s with 2 retries, 3 fulfilment attempts, daily budget $5 and $1 per order as hard stops; non-retryable provider errors park the order in REVIEW instead of burning retries. Nothing to tighten until real traffic shows a pattern.

## DONE (verified in production unless noted)

- 2026-09-25: Ride Lab → ORVIONIS on the same repo/service/domain; V1 platform (Next 15, Prisma, Stripe Checkout + webhooks, AI engine with cost accounting, admin console, magic-link auth, jobs on Postgres).
- 2026-09-26 00:45: embedded job loop (no worker service), `/api/health` heartbeat.
- 01:05: per-tool Open Graph cards, SEO titles.
- 01:50–02:30: owner's dark premium SaaS palette; home rebuilt around "Upload what you have → get the finished result"; ToolDefinition `io/featured/active`; `/contact` tool-request form.
- 02:30–02:55: AI-config failure parks paid orders in REVIEW with admin alert; tool pages with category photo + You send / You get / Time.
- 03:00–03:25: third tool **Listing Description** ($9); "Order again"; copyable private order link.
- 03:30–03:55: graceful shutdown on Railway (SIGTERM reaches Next, jobs handed back, exit 0) — seen in prod logs.
- 03:55–04:25: **sample results** on every tool page + home (real 5-page PDF for the pricing guide); favicon; fair-housing rules as word-boundary regexes.
- 04:25–04:50: free **fair-housing checker** (lead magnet), linked from footer/real-estate/sitemap.
- 04:50–05:05: Stripe receipt carries the private order link (`receipt_email` + description); parked orders promise +24 h with contact/refund links.
- 05:05–05:35: Stripe sandbox branding colours set; `/admin/system` Stripe card (account, mode, business name, branding).
- 05:35–06:05: **Google sign-in**; magic-link route returns 503 with a human message when email fails; stray Railway project `satisfied-empathy` auto-deploy disabled.
- 06:05–06:45: services/keys audit docs; `.env.example` complete; Resend domain + DNS (DKIM, `rsend`, `send`, `_dmarc`); Namecheap forwarders `hello@`, `dmarc@` → owner; Search Console sitemap submitted; verification meta support; stable sitemap `lastmod`.
- 06:45–07:05: found and surfaced the Stripe key/webhook account mismatch (key was the old Ride Lab sandbox); owner replaced the key; admin webhook-on-this-account check; **Test AI provider** button (prod: OK).
- 07:05–07:20: Stripe "apply branding" via API removed (Stripe forbids it on own account); admin links to the Dashboard branding page instead; `docs/AUTONOMOUS_PROGRESS.md` created.
- 07:20–07:35: body-size guards on every JSON/upload route (413 before parsing); outreach kit refreshed ($9 entry DM, free-checker opener, sample links, UTM per experiment) in docs + /admin/content.
- 07:35–08:10: free **photography pricing calculator** + `/free` index; experiment KPIs (est. Stripe fees, net contribution, revenue/founder hour, repeat rate, AI cost per paid order, free-tool uses).
- 08:10–08:30: `Order.isTest` + admin **full pipeline test** (sandbox only) — run in production: Order #2 COMPLETED with real AI output and real emails, excluded from metrics.
- 08:30–09:00: delivered text rendered as sections with Copy buttons; GitHub Actions **uptime monitor** (every 15 min, emails on failure); pipeline test selectable per tool → production runs: #3 Pricing Guide COMPLETED (3 AI calls, PDF rendered, $0.02), #4 Listing Clips → REVIEW with the clip plan and concierge checklist (as designed); fixes found on the way (double-numbered steps, REVIEW note scope, close-test-order); OG cards for /free pages; CEO report text carries the new KPIs.
- 14:52–15:20: **Virtual Staging** shipped: transfer verified by full-tree checksum, commit `e0420f7` deployed (migration `20260926030000_output_type_image` applied, seed synced, graceful restart in logs); production test #5 on gpt-image-1 worked technically but visual review caught a chandelier swap and an added built-in; fixed in `2f1d6f2` (freestanding-only prompt, gpt-image-2 default, exact photo proportions, EXIF auto-rotate) → test #6 clean on both versions (recessed light, windows, walls, doors untouched, 1536×1040). Stripe webhook delivery confirmed from the expired-session events. Uptime monitor run #1 had failed on a Python f-string quirk while production was healthy (log: ok, db up, 1,845 worker ticks) — check rewritten, runs off the hour now and once on every change of the workflow file.
- 15:25–15:45: Virtual Staging sample replaced with the **real, unedited output of production order #6** (version 1, gpt-image-2): before/after composite on the tool page, home card and OG card; copy says "real pipeline output, unedited" and tells agents to label the photo "virtually staged" in the MLS.

## IN PROGRESS

- Nothing mid-flight. Candidate next build: an automated vision QC for Virtual Staging (a cheap model compares before/after and parks the order for a human if walls, windows, doors, built-ins or ceiling fixtures changed) — build it once real orders show any failure; test #6 needed none.

## BLOCKED (needs the owner)

- Stripe live activation (business details, bank) — operator never enters financial/government data or API keys.
- A paid test order (card `4242…`) on the sandbox — operator does not enter card numbers on checkout.stripe.com (webhook side already proven).
- Outreach messages — sent from the owner's accounts; the operator drafts them (EN + UA control copy in /admin/content and docs/OUTREACH.md).
- Google OAuth consent screen: publish if still in "Testing" (sign-in for the owner worked, so either it is published or the owner is a test user).
- Scheduled task `trig_01KoEtNKBvEzGvaoWeHTPPGS` (every 2 h) runs **cloud-only** and cannot push code (git auth is on the owner's PC) until "Require this computer" is enabled for it in the desktop app. Nothing runs between sessions otherwise — no 24/7 claim.

## NEXT TASKS (ordered by expected business impact)

1. Owner: Stripe live activation, then one real $9 order (operator swaps keys, creates the live webhook, verifies, enables Stripe receipts).
2. Owner + operator: first outreach batch — vacant listings (`re-ig-dm-staging`) and new listings (`re-ig-dm-9`); operator prepares 20 target profiles/day with personalised lines if the owner wants.
3. Close test orders #2–#6 in /admin once the owner has looked at them (#4 sits in REVIEW).
4. Deliverable quality loop: read the outputs of orders #2–#6 critically and tighten prompts where needed.
5. Browser extension — only on demand.

## PRODUCTION STATUS

- Last verified: 2026-09-26 15:20 UTC+2 — deploy of `2f1d6f2` ACTIVE (GitHub status `courageous-flow - hfjveojo` = success, CI green); `/api/health` ok, worker ticking every 10 s, hourly maintenance DONE every hour; Virtual Staging test #6 COMPLETED on gpt-image-2.
- Known warnings in logs: none open.
- Railway: auto-deploy from `main`; graceful shutdown proven again today (SIGTERM → jobs handed back → exit); `RAILWAY_DEPLOYMENT_DRAINING_SECONDS` not set (default 3 s).
- Uptime monitor: run #1 (07:59 UTC) failed on a bug in the check itself, not the site; fixed check runs on every workflow change and at :07/:22/:37/:52.

## LAST VERIFIED COMMIT

- `2f1d6f2` (staging prompt + gpt-image-2) — deployed and verified in production with a real image edit. Later commits: monitoring/docs only.

## KNOWN BUGS

- None open. Watch list: files live in Postgres (`File.data`) — a staging order stores the original upload (≤ 8 MB) + 2 JPEG outputs (≈ 0.2–0.5 MB each); at >100 staging orders/month switch `STORAGE_BACKEND=s3` (Cloudflare R2, abstraction ready) before the Railway volume fills; Stripe Checkout shows the sandbox's creation name "jarvis sandbox" (cosmetic, sandbox only, goes away with the live account); Chrome extension in the operator's session sometimes stalls on orvionis.com pages (tooling, not the site).

## BUSINESS METRICS (real data only)

- Revenue: $0 (no live payments possible yet). Orders: 0 paid. Visitors: no meaningful traffic yet (no outreach started).
- AI budget note: `AI_DAILY_BUDGET_CENTS=500` allows ~45 staging orders/day at ≈11¢ each — raise it in Railway Variables once staging orders arrive (the guard parks orders in REVIEW, it never loses them). Test spend today: $0.13 (#5) + $0.11 (#6).
- Costs so far: Railway Hobby plan, OpenAI ≈ $0.01 (smoke test + one pipeline test order: 2 calls, 1,325 in / 492 out tokens → margin after AI on a $9 order ≈ $8.99 before Stripe fees ≈ $0.56). Instrumentation in place: `Event` table (visits, CTA, checkout, paid, delivered, free-tool use), `AiRequest` (cost per call), `ChannelCost` (hours/spend per channel), KPIs on `/admin/analytics`, daily CEO report.
- First-profit forecast given to the owner 2026-09-26: first sale 2–5 days after Stripe live + daily outreach starts; infra breaks even after ~3–5 orders.

## IMPORTANT DECISIONS

- One repo, one Railway project, one Stripe account — no duplicates (owner rule). Secrets only in Railway Variables / `.env.local`.
- Sell finished results, not "AI"; every tool = ToolDefinition (config + pipeline) added as one file + one registry line.
- Jobs on Postgres (no Redis); embedded loop in the web process; graceful shutdown hands jobs back.
- Files in Postgres until uploads grow (R2 later, abstraction ready).
- No CAPTCHA until abuse appears (honeypot + rate limits + Stripe); no Google Analytics (first-party events).
- Stripe: hosted Checkout with inline `price_data` (prices live in the DB, no Price IDs); receipts carry the order link.
- Fair-housing gate: "risk" phrases block automated delivery (→ REVIEW); "style" phrases only advise.
