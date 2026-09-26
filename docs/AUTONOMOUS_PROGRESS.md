# ORVIONIS — autonomous progress (read this first)

Persistent state for the autonomous operator. Update after every significant task. Timestamps are UTC+2 (owner's time).
Companion files: `OPERATOR.md` (infrastructure facts, owner actions, long session log), `docs/REQUIRED_SERVICES_AND_KEYS.md`, `docs/ENVIRONMENT_VARIABLES.md`, `docs/RUNBOOK.md`.

## CURRENT STATUS

- Production **live and healthy** at https://orvionis.com (Railway `courageous-flow` → service `hfjveojo`, EU West). Health: `/api/health` ok, embedded job loop ticking, hourly maintenance running.
- 3 tools live: Listing Clips ($49, concierge 48 h), Photographer Pricing Guide ($29, auto), Listing Description ($9, auto). Every tool page shows a real sample deliverable.
- Payments: Stripe **sandbox** (`acct_1UIuDh2cM37Fu7zW` "orvionis sandbox"); key + webhook now on the same account (verified in `/admin/system` 2026-09-26 03:55: webhook enabled, all 7 events). No real money possible until Stripe live activation (owner).
- AI: OpenAI key live; smoke test in production answered "OK" (gpt-4.1-mini, 1.6 s, $0.0001). Budget guards: $5/day, $1/order.
- Auth: magic link (email) + **Google sign-in** (verified end-to-end in production 2026-09-26 03:50). Admin = `ADMIN_EMAILS`.
- Email: Resend key set; domain `orvionis.com` added (eu-west-1) with DNS at Namecheap — **verification Pending** at last check. Until verified every email fails (graceful: login shows a 503 message, orders still work, Stripe receipts carry the order link).
- Free lead magnet: `/free/fair-housing-checker`. Search Console: domain verified, sitemap submitted.

## CURRENT PRIORITY

1. (P0, owner) Stripe live activation → live `STRIPE_SECRET_KEY` + live webhook destination + `STRIPE_WEBHOOK_SECRET`. Without it there is no revenue.
2. (P1, waiting) Resend domain verified → confirm sign-in and order emails in production logs.
3. (P1, operator) First end-to-end **paid** order in sandbox by the owner (test card) → confirm PAID → fulfilment → delivery page → receipt; then the same in live with a real $9 order.
4. (P2, operator) Conversion + acquisition assets: outreach kit with links to samples/free tool; second free tool for photographers (pricing calculator); admin metrics for the 90-day experiment (Stripe fees, revenue/hour, repeat purchases).
5. (P2) AI cost control audit (§14 of the brief): input size caps per field, timeouts, retry limits, per-user/IP order rate limits — verify and tighten.

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

## IN PROGRESS

- Nothing mid-flight. Next task starts from CURRENT PRIORITY.

## BLOCKED (needs the owner)

- Stripe live activation (business details, bank) — operator never enters financial/government data or API keys.
- A paid test order (card `4242…`) on the sandbox — operator does not enter card numbers on checkout.stripe.com.
- Resend domain verification — automatic once DNS propagates; check Resend → Domains if still Pending after 24 h.
- Google OAuth consent screen: publish if still in "Testing" (sign-in for the owner worked, so either it is published or the owner is a test user).
- Scheduled task `trig_01KoEtNKBvEzGvaoWeHTPPGS` (every 2 h) runs **cloud-only** and cannot push code (git auth is on the owner's PC) until "Require this computer" is enabled for it in the desktop app. Nothing runs between sessions otherwise — no 24/7 claim.

## NEXT TASKS (ordered by expected business impact)

1. Outreach kit: `docs/OUTREACH.md` refresh with the live URLs (samples, free checker), 3 DM variants per niche, a follow-up, and a "send me your listing facts, I'll do the first one for $9" offer.
2. Photographers free tool: pricing calculator (cost of doing business → what to charge) → CTA to the $29 guide. Same pattern as the checker.
3. Admin metrics for the experiment: Stripe fee estimate (2.9 % + $0.30), revenue/hour from ChannelCost hours, repeat-purchase rate, per-channel conversion — extend `src/lib/analytics/kpi.ts` + `/admin/analytics`.
4. AI cost control audit: intake field max lengths (zod `.max`), request timeouts on provider calls, `MAX_ORDER_ATTEMPTS`, per-IP order creation limit, upload caps — verify and add tests.
5. Uptime: UptimeRobot on `/api/health` (owner, free, 5 min) — or an internal check that alerts when the worker heartbeat is older than 5 min.
6. Next tool by demand (`/admin/feedback` tool requests). Candidate with the strongest owner signal: Virtual Staging (room photo → staged image, OpenAI Images) — build only after the first paid orders or 3+ requests.
7. Browser extension — only on demand.

## PRODUCTION STATUS

- Last verified: 2026-09-26 07:15 UTC+2 — deploy of `ff94d67` ACTIVE, `/api/health` ok, `/admin/system` reachable via Google sign-in, AI smoke test OK, Stripe account/webhook aligned.
- Known warnings in logs: Resend 403 "domain not verified" (until DNS verification completes).
- Railway: auto-deploy from `main`; graceful shutdown proven; `RAILWAY_DEPLOYMENT_DRAINING_SECONDS` not set (default 3 s).

## LAST VERIFIED COMMIT

- `ff94d67` (admin: Test AI provider) — deployed and verified. Commits after it are listed in git log; each is pushed only after typecheck + 31 tests + `next build` pass locally.

## KNOWN BUGS

- None open. Watch list: Resend sending after verification (first real email); Stripe Checkout showing the sandbox's creation name "jarvis sandbox" (cosmetic, sandbox only, goes away with the live account).

## BUSINESS METRICS (real data only)

- Revenue: $0 (no live payments possible yet). Orders: 0 paid. Visitors: no meaningful traffic yet (no outreach started).
- Costs so far: Railway Hobby plan, OpenAI ≈ $0.0001 (smoke test). Instrumentation in place: `Event` table (visits, CTA, checkout, paid, delivered, free-tool use), `AiRequest` (cost per call), `ChannelCost` (hours/spend per channel), KPIs on `/admin/analytics`, daily CEO report.
- First-profit forecast given to the owner 2026-09-26: first sale 2–5 days after Stripe live + daily outreach starts; infra breaks even after ~3–5 orders.

## IMPORTANT DECISIONS

- One repo, one Railway project, one Stripe account — no duplicates (owner rule). Secrets only in Railway Variables / `.env.local`.
- Sell finished results, not "AI"; every tool = ToolDefinition (config + pipeline) added as one file + one registry line.
- Jobs on Postgres (no Redis); embedded loop in the web process; graceful shutdown hands jobs back.
- Files in Postgres until uploads grow (R2 later, abstraction ready).
- No CAPTCHA until abuse appears (honeypot + rate limits + Stripe); no Google Analytics (first-party events).
- Stripe: hosted Checkout with inline `price_data` (prices live in the DB, no Price IDs); receipts carry the order link.
- Fair-housing gate: "risk" phrases block automated delivery (→ REVIEW); "style" phrases only advise.
