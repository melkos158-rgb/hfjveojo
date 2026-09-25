# Architecture

## Principles

1. **Tool = configuration.** `ToolDefinition` (intake schema + fields, pricing, SLA, landing/SEO copy, `run()` pipeline). Adding a tool never touches routing, payments or delivery.
2. **Server decides money.** Prices come from `Product`; payment state only from verified Stripe webhooks; the success page just reads state.
3. **Everything measurable.** Events (funnel), AiRequest (tokens + cost per call), ChannelCost (spend + hours), Experiment attribution on orders.
4. **Manual → automated without rebuild.** Fulfilment mode is a field (`MANUAL | HYBRID | AUTO`); the concierge path stores the same outputs and uses the same delivery.
5. **Boring infrastructure.** One Postgres for data, files (V1) and the job queue. No Redis, no serverless functions, no third-party analytics.

## Request flows

**Order**: `/tools/[slug]` → `IntakeForm` → `POST /api/tools/[slug]/order` → `createOrderWithCheckout()` (zod validation, Product price, attribution cookie, PENDING order, Stripe Checkout Session with `metadata.orderId`) → redirect to Stripe → `/checkout/success` (read-only).

**Payment**: Stripe → `POST /api/stripe/webhook` (raw body signature check) → `handleStripeEvent()` → `StripeEvent` row (idempotency) → `onCheckoutPaid()`: amount check, Payment row, user upsert, order PAID, confirmation email, `enqueue("fulfill_order")`.

**Fulfilment**: worker `claimNextJob()` (`FOR UPDATE SKIP LOCKED`) → `fulfillOrder()`: order PROCESSING → `ToolRun` → `def.run(ctx)` with AI helpers that log every call and enforce budgets → outputs stored (`GeneratedOutput` + `File`) → QC → AUTO & passed: `deliverOrder()` (COMPLETED, email with signed links) · otherwise REVIEW + admin email. Errors: RETRYING with backoff up to 3 attempts, then FAILED + admin email.

**Concierge**: same as above, tool returns `needsHuman: true` → REVIEW → admin edits → `/admin/orders/[id]` **Deliver** with a link → COMPLETED.

**Auth**: magic link (`MagicLinkToken` sha256 hash, 20 min, single use) → HttpOnly JWT cookie (`jose`, HS256, 30 days). Admin = role ADMIN in the token **and** email in `ADMIN_EMAILS`; middleware gates `/admin/*`, server actions re-check.

## Data model (prisma/schema.prisma)

Users & auth: `User`, `MagicLinkToken` · Tools: `Tool`, `ToolVersion` · Catalog & billing: `Product`, `Order`, `Payment`, `Refund`, `StripeEvent`, `Subscription`, `CreditLedger` · Execution: `Job`, `ToolRun`, `AiRequest`, `File`, `GeneratedOutput` · Growth: `Experiment`, `ExperimentVariant`, `Event`, `MarketingChannel`, `ChannelCost`, `Feedback` · Ops: `AdminAction`, `CeoReport`, `ErrorLog`, `RateLimit`, `Setting`.

Order states: `PENDING → PAID → PROCESSING → (REVIEW) → COMPLETED`, with `RETRYING`, `FAILED`, `REFUNDED`, `CANCELED`. Tool states: `DRAFT, VALIDATING, LIVE, PAUSED, DEPRECATED`.

## AI engine

`complete()` / `completeStructured()` in `src/lib/ai/index.ts`: tier → model mapping from env; provider chain (primary + fallback if the other key exists); retry on retryable errors; JSON-schema-constrained output parsed by the caller's zod schema; every attempt recorded in `AiRequest` with `costMicros` from `pricing.ts` (unknown models are over-estimated). Guards: kill switch (`Setting ai.kill_switch`), daily budget, per-order budget. Providers: OpenAI SDK, Anthropic via fetch, Mock (schema-aware, used in tests/CI).

## Security controls

Secrets only in env; `NEXT_PUBLIC_` only for public values · security headers in `next.config.ts` · signed, expiring file URLs · order pages by unguessable token or owner session · rate limits on auth, orders, uploads (DB-backed) · upload MIME sniffing + 2 MB cap · video links restricted to known hosts · Stripe signature verification + event idempotency + server-side amount check · admin actions audited · errors persisted without secrets · cookies HttpOnly/SameSite=Lax/Secure in production.

## Deployment

Railway: `web` (Next), `worker` (`tsx scripts/worker.ts`), Postgres. `start:railway` runs migrations then the server. Healthcheck `/api/health`. CI: gitleaks, typecheck, vitest (Postgres service), build.

## Deliberately not in V1

Subscriptions/credits UI (schema ready), browser extension (thin client later; it must never hold secrets), multi-org accounts, S3 by default, Sentry wiring (hook present), i18n, Etsy integration, automated video rendering (ffmpeg templates are the first automation step for Listing Clips once it sells).
