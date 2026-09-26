# ORVIONIS — autonomous progress (read this first)

Persistent state for the autonomous operator. Update after every significant task. Timestamps are UTC+2 (owner's time).
Companion files: `OPERATOR.md` (infrastructure facts, owner actions, long session log), `docs/REQUIRED_SERVICES_AND_KEYS.md`, `docs/ENVIRONMENT_VARIABLES.md`, `docs/RUNBOOK.md`.

## CURRENT STATUS

- Production **live and healthy** at https://orvionis.com (Railway `courageous-flow` → service `hfjveojo`, EU West). Health: `/api/health` ok, embedded job loop ticking, hourly maintenance running.
- 4 tools: Listing Clips ($49, concierge 48 h), Photographer Pricing Guide ($29, auto), Listing Description ($9, auto), **Virtual Staging ($15, auto, image model)** — the fourth is built and tested, production verification pending (see IN PROGRESS). Every tool page shows a real sample deliverable.
- Payments: Stripe **sandbox** (`acct_1UIuDh2cM37Fu7zW` "orvionis sandbox"); key + webhook now on the same account (verified in `/admin/system` 2026-09-26 03:55: webhook enabled, all 7 events). No real money possible until Stripe live activation (owner).
- AI: OpenAI key live; smoke test in production answered "OK" (gpt-4.1-mini, 1.6 s, $0.0001). Budget guards: $5/day, $1/order.
- Auth: magic link (email) + **Google sign-in** (verified end-to-end in production 2026-09-26 03:50). Admin = `ADMIN_EMAILS`.
- Email: Resend domain `orvionis.com` **verified** (03:40). Sign-in link, order confirmation and delivery emails delivered in production (Resend log).
- **End-to-end pipeline proven in production** (04:24): admin pipeline test → Order #2 PAID (synthetic event, no money) → real OpenAI fulfilment (2 calls, $0.01) → QC PASSED → COMPLETED with the full deliverable → both emails delivered. Only the card charge itself is untested (Stripe's side).
- Free lead magnet: `/free/fair-housing-checker`. Search Console: domain verified, sitemap submitted.

## CURRENT PRIORITY

1. (P0, owner) Stripe live activation → live `STRIPE_SECRET_KEY` + live webhook destination + `STRIPE_WEBHOOK_SECRET`. Without it there is no revenue.
2. (P1, owner) One sandbox purchase with the test card `4242…` on https://orvionis.com/tools/listing-description — the only untested link is Stripe's own card step → webhook delivery to our endpoint (the app side is proven); then the same in live with a real $9 order.
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

## IN PROGRESS

- **Virtual Staging tool** (`/tools/virtual-staging`, $15) — deployed 2026-09-26 15:00 (commit `e0420f7`, migration applied, seed synced, graceful restart seen in logs). Production pipeline test **order #5** (gpt-image-1): COMPLETED in ~60 s, QC passed, AI cost $0.13, before/after renders on the order page. **Visual review found two broken promises** in the real output: both versions replaced the recessed ceiling light with a chandelier, version 1 added a built-in bookcase. Fix in the next commit: prompt allows only freestanding furniture/decor and forbids ceiling fixtures and built-ins explicitly, default model → `gpt-image-2` (gpt-image-1 is deprecated; ≈ $0.041/image; any size → output keeps the photo's exact proportions), input photos EXIF-rotated and capped at 2048 px before the model sees them, `input_fidelity: high` for GPT Image 1/1.5. Next: deploy, re-run the pipeline test, judge the images, then decide on an automated vision QC check.

## BLOCKED (needs the owner)

- Stripe live activation (business details, bank) — operator never enters financial/government data or API keys.
- A paid test order (card `4242…`) on the sandbox — operator does not enter card numbers on checkout.stripe.com.
- Resend domain verification — automatic once DNS propagates; check Resend → Domains if still Pending after 24 h.
- Google OAuth consent screen: publish if still in "Testing" (sign-in for the owner worked, so either it is published or the owner is a test user).
- Scheduled task `trig_01KoEtNKBvEzGvaoWeHTPPGS` (every 2 h) runs **cloud-only** and cannot push code (git auth is on the owner's PC) until "Require this computer" is enabled for it in the desktop app. Nothing runs between sessions otherwise — no 24/7 claim.

## NEXT TASKS (ordered by expected business impact)

1. Stripe Dashboard → webhook `orvionis-production` → "Send test event" (checkout.session.completed) to prove signature + reachability of the endpoint from Stripe's side (needs the owner's Chrome; the app side is proven).
2. Close test orders #2–#4 in /admin (button exists) once the owner has looked at them.
3. Virtual Staging in production: run the pipeline test, read the Railway log for the image call, check cost per order in /admin/analytics (expected ≈ $0.13–0.15), then start the vacant-listing DM (`re-ig-dm-staging`).
4. Stripe live: when the owner activates — swap keys, create the live webhook, run one real $9 order, enable "Successful payments" emails in Stripe.
5. Deliverable quality loop: read the outputs of orders #2–#4 critically (tone, facts, fair-housing) and tighten prompts where needed; add a "regenerate section" option later if customers ask.
6. Browser extension — only on demand.

## PRODUCTION STATUS

- Last verified: 2026-09-26 08:45 UTC+2 — deploy of `39f2252` ACTIVE; all three tool pipelines proven in production (orders #2–#4, all `isTest`); emails delivered; uptime workflow committed (first scheduled run pending).
- Known warnings in logs: none open (Resend 403 stopped after verification).
- Railway: auto-deploy from `main`; graceful shutdown proven; `RAILWAY_DEPLOYMENT_DRAINING_SECONDS` not set (default 3 s).

## LAST VERIFIED COMMIT

- `39f2252` (pipeline test per tool) — deployed and verified in production. Later commits (`3a223c3`, `73e769f`, this one) pushed after typecheck + 40 tests + `next build`; production check pending when the owner's Chrome is back online.

## KNOWN BUGS

- None open. Watch list: files live in Postgres (`File.data`) — a staging order stores ≈ 8 MB input + 2 PNG outputs; at >100 staging orders/month switch `STORAGE_BACKEND=s3` (Cloudflare R2, abstraction ready) before the Railway volume fills; Stripe Checkout shows the sandbox's creation name "jarvis sandbox" (cosmetic, sandbox only, goes away with the live account); Chrome extension in the operator's session sometimes stalls on orvionis.com pages (tooling, not the site).

## BUSINESS METRICS (real data only)

- Revenue: $0 (no live payments possible yet). Orders: 0 paid. Visitors: no meaningful traffic yet (no outreach started).
- AI budget note: `AI_DAILY_BUDGET_CENTS=500` allows ~35 staging orders/day at ≈13¢ each — raise it in Railway Variables once staging orders arrive (the guard parks orders in REVIEW, it never loses them).
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
