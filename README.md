# ORVIONIS

One brand, many tools, revenue first. ORVIONIS turns a customer's inputs into a finished, branded deliverable — paid per result through Stripe, fulfilled by an AI pipeline with quality gates, or by a human (concierge) using an AI-drafted plan. Every tool is configuration; every order, payment, AI call and marketing dollar is measured so the business can be run from data.

**Live tools (V1)**

| Tool | Slug | Customer | Price | Fulfilment |
| --- | --- | --- | --- | --- |
| Listing Clips | `/tools/listing-clips` | Real-estate agents | $49 / listing | MANUAL (concierge, AI-drafted plan), 48h |
| Photographer Pricing Guide | `/tools/photographer-pricing-guide` | Photographers | $29 | AUTO (AI → QA → PDF), minutes |

Vertical landings: `/real-estate`, `/photographers`. Catalog: `/tools`. Admin (AI CEO console): `/admin`.

## Stack

Next.js 15 (App Router, TypeScript, Tailwind v4) · Prisma 6 (Rust-free client + `@prisma/adapter-pg`) · PostgreSQL · Stripe hosted Checkout + webhooks · OpenAI (Anthropic fallback, mock provider for tests) · `@react-pdf/renderer` · Resend (HTTP API) · Postgres-backed job queue with a worker process · Railway.

## Quick start (local)

```bash
npm install                       # also runs `prisma generate`
cp .env.example .env.local        # fill DATABASE_URL, AUTH_SECRET, SIGNING_SECRET, ADMIN_EMAILS; keep AI_PROVIDER=mock to run without keys
npx prisma migrate deploy         # apply migrations (or `npm run db:migrate` while developing schema changes)
npm run db:seed                   # tools, products, admin users, experiments, channels
npm run dev                       # http://localhost:3000
```

With `JOBS_INLINE=true` orders are fulfilled inside the web process right after the Stripe webhook, and the embedded job loop (`EMBEDDED_WORKER=true`, started from `src/instrumentation.ts`) handles retries, hourly maintenance and the daily report — so one service is enough. A dedicated worker (`npm run worker`) is optional for throughput.

Sign in at `/login` — with `EMAIL_PROVIDER=console` the magic link is printed in the server log and returned to the login form in non-production.

Stripe locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook` and put the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `npm run build` / `npm start` | Next.js |
| `npm run start:railway` | `prisma migrate deploy && next start` (production start command) |
| `npm run worker` | Optional dedicated worker (same job loop as the embedded one, higher concurrency) |
| `npm run db:migrate` / `npm run db:deploy` / `npm run db:seed` | Prisma migrations and seed |
| `npm run smoke` | End-to-end pipeline test without Stripe or API keys (`AI_PROVIDER=mock`) |
| `npm test` / `npm run typecheck` | Vitest (needs a Postgres at `TEST_DATABASE_URL`) / `tsc` |
| `npm run ceo:report` | Generate the AI CEO daily report now (`-- WEEKLY` for the weekly one) |

## Repository map

```
prisma/schema.prisma            data model (26 tables) · prisma/migrations · prisma/seed.ts
src/app                         pages, API routes, admin (server components + server actions)
src/lib/tools                   Tool engine: types, registry, QA rules, definitions/<tool>.ts
src/lib/ai                      provider abstraction (openai | anthropic | mock), routing, budgets, cost logging
src/lib/orders                  order creation (server-side pricing), fulfilment pipeline, delivery, refunds
src/lib/stripe                  Stripe client + idempotent webhook handlers
src/lib/jobs                    Postgres job queue (SKIP LOCKED) + runner + loop (embedded worker) · scripts/worker.ts
src/lib/analytics · src/lib/ceo first-party events, KPIs, AI CEO report
src/lib/storage · src/lib/email storage (db | s3) and email (resend | console) adapters
src/lib/security                signed tokens, rate limiting, upload sniffing, link allow-list
docs/                           ARCHITECTURE, DEPLOY_RAILWAY, EXPERIMENTS, OUTREACH, RUNBOOK, LEGAL_FLAGS, AI_CEO, ADDING_A_TOOL
```

## Adding a tool (the whole point)

1. Create `src/lib/tools/definitions/<slug>.ts` exporting a `ToolDefinition`: intake fields + zod schema, pricing, SLA, landing copy, SEO, delivery email, and a `run(ctx)` function that returns outputs + QC result (`needsHuman: true` for concierge).
2. Register it in `src/lib/tools/registry.ts`.
3. `npm run db:seed` (syncs Tool + Product rows). Set status in `/admin/tools`.

You get for free: landing page with JSON-LD, intake form, Stripe Checkout, webhook → job → pipeline, QC gate, delivery email + order page, admin queue, analytics, AI cost tracking, sitemap entry. See `docs/ADDING_A_TOOL.md`.

## Non-negotiable rules (enforced in code, repeated here on purpose)

- Secrets live only in `.env.local` (git-ignored) and Railway Variables. `.env.example` has placeholders only. CI runs gitleaks.
- The client never decides price, payment status, permissions, credits or admin status. Prices come from the `Product` table; payment state comes from verified Stripe webhooks; admin = signed session **and** `ADMIN_EMAILS`.
- Every Stripe event is recorded once (`StripeEvent.id`) and processed at most once.
- Every AI call is logged with tokens and cost; daily and per-order budgets stop runaway spend; `/admin/system` has a kill switch.
- Schema changes ship as migrations. Never edit production schema by hand.
- Nothing ships to a customer without passing QC rules or a human approval.
- Refunds, price changes and tool pauses are admin-only and audited (`AdminAction`).
