# ORVIONIS — canonical environment variables

Source of truth for names: `src/lib/env.ts` (validated with zod at boot; unknown variables are ignored, missing required ones stop the app).
Values: production → Railway → service `hfjveojo` → Variables. Development → `.env.local` (git-ignored). **Never real values in this file or in `.env.example`.**
`NEXT_PUBLIC_*` variables are compiled into the browser bundle — never put a secret in one.

Legend: 🔒 secret (server-only) · ⚙️ configuration (not secret) · 🌐 public (may reach the browser) · ✅ set in Railway today · ⏳ to do

# Required now

## Production (Railway → Variables)

```
# App
APP_ENV=production                                  ⚙️ ✅
NODE_ENV=production                                 ⚙️ ✅
NEXT_PUBLIC_APP_URL=https://orvionis.com            🌐 ✅  (base for links, OAuth redirect, webhooks)
NEXT_PUBLIC_BRAND_NAME=ORVIONIS                     🌐 ✅
ADMIN_EMAILS=                                       ⚙️ ✅  comma-separated admin logins
SESSION_TTL_DAYS=30                                 ⚙️ ✅
LOG_LEVEL=info                                      ⚙️ ✅

# Database (Railway reference variable)
DATABASE_URL=${{Postgres.DATABASE_URL}}?schema=orvionis   🔒 ✅

# App secrets — generated with `openssl rand -base64 32`, different per environment
AUTH_SECRET=                                        🔒 ✅  sessions + Google sign-in state (≥32 chars)
SIGNING_SECRET=                                     🔒 ✅  order links, signed file URLs (≥16 chars)
CRON_SECRET=                                        🔒 ✅  bearer for /api/internal/* (only used by an external scheduler)

# Stripe (sandbox today; live values in V1)
STRIPE_SECRET_KEY=                                  🔒 ✅
STRIPE_WEBHOOK_SECRET=                              🔒 ✅  signing secret of the destination https://orvionis.com/api/stripe/webhook
STRIPE_CURRENCY=usd                                 ⚙️ ✅

# AI
AI_PROVIDER=openai                                  ⚙️ ✅  openai | anthropic | mock
OPENAI_API_KEY=                                     🔒 ✅
AI_MODEL_CHEAP=gpt-4.1-mini                         ⚙️ ✅
AI_MODEL_STANDARD=gpt-4.1                           ⚙️ ✅
AI_MODEL_BEST=gpt-4.1                               ⚙️ ✅
AI_DAILY_BUDGET_CENTS=500                           ⚙️ ✅  hard stop per day
AI_MAX_COST_PER_ORDER_CENTS=100                     ⚙️ ✅  hard stop per order
AI_IMAGE_MODEL=gpt-image-2                          ⚙️ ✅  image edits (virtual staging); default in code
AI_IMAGE_QUALITY=medium                             ⚙️ ✅  low | medium | high — quality/cost of staged photos
AI_IMAGE_COST_CENTS=5                               ⚙️ ✅  assumed cost per output image (cost accounting)
FREE_PREVIEWS_PER_DAY=15                            ⚙️ ✅  free watermarked staging previews per UTC day (0 = off); default in code
FREE_PREVIEWS_PER_IP=2                              ⚙️ ✅  per visitor IP per day; previews also stop at 40 % of the daily AI budget
AI_PREVIEW_QUALITY=medium                           ⚙️ ✅  low | medium | high — preview quality (medium ≈ 5–6 ¢ each)

# Email (Resend) — key set; domain orvionis.com must be verified in Resend (DNS), see REQUIRED_SERVICES_AND_KEYS.md §3
EMAIL_PROVIDER=resend                               ⚙️ ✅
RESEND_API_KEY=                                     🔒 ✅
EMAIL_FROM=ORVIONIS <hello@orvionis.com>            ⚙️ ✅
EMAIL_REPLY_TO=hello@orvionis.com                   ⚙️ ✅

# Google sign-in
GOOGLE_CLIENT_ID=                                   ⚙️ ✅  (public by nature, kept server-side)
GOOGLE_CLIENT_SECRET=                               🔒 ✅

# Storage & jobs
STORAGE_BACKEND=db                                  ⚙️ ✅
JOBS_INLINE=true                                    ⚙️ ✅  fulfil right after the webhook response
EMBEDDED_WORKER=true                                ⚙️ (default) retries, hourly maintenance, daily report inside the web process
EMBEDDED_WORKER_CONCURRENCY=1                       ⚙️ (default)
EMBEDDED_WORKER_POLL_MS=10000                       ⚙️ (default)

# Search Console (only if you verify with the HTML tag instead of a DNS TXT record)
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=               🌐 ⏳ optional
```

Legacy, unused by ORVIONIS, safe to delete from Railway: `ADMIN_PATH`, `SITE_URL`, `ADMIN_RESET`.
Provided by Railway automatically (do not set): `PORT`, `RAILWAY_*`.

## Development (`.env.local`)

```
APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BRAND_NAME=ORVIONIS
ADMIN_EMAILS=you@example.com
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/orvionis?schema=public
AUTH_SECRET=                      # any 32+ random chars, never the production value
SIGNING_SECRET=                   # any 16+ random chars
CRON_SECRET=dev-cron
STRIPE_SECRET_KEY=                # sandbox key (sk_test_… / rk_test_…)
STRIPE_WEBHOOK_SECRET=            # from `stripe listen --forward-to localhost:3000/api/stripe/webhook`
STRIPE_CURRENCY=usd
AI_PROVIDER=mock                  # mock = no cost, deterministic; openai to test real output
OPENAI_API_KEY=                   # only when AI_PROVIDER=openai
EMAIL_PROVIDER=console            # emails printed to the terminal; magic link shown on /login
GOOGLE_CLIENT_ID=                 # optional: same OAuth client, redirect http://localhost:3000/api/auth/google/callback
GOOGLE_CLIENT_SECRET=
STORAGE_BACKEND=db
JOBS_INLINE=true
```

# Required later

## V1 — first real money (Stripe live, verified email, monitoring)

```
STRIPE_SECRET_KEY=                # live key replaces the sandbox key (same name)
STRIPE_WEBHOOK_SECRET=            # signing secret of the LIVE destination (same name, new value)
SENTRY_DSN=                       # error monitoring (install @sentry/nextjs first) — optional
RAILWAY_DEPLOYMENT_DRAINING_SECONDS=30   # Railway setting: let in-flight jobs finish on deploy — optional
```

## V2 — growth (uploads at scale, second AI provider, bot protection if abuse appears)

```
STORAGE_BACKEND=s3
S3_ENDPOINT=                      # https://<accountid>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=orvionis-files
S3_ACCESS_KEY_ID=                 🔒
S3_SECRET_ACCESS_KEY=             🔒
FILE_RETENTION_DAYS_OUTPUT=90
FILE_RETENTION_DAYS_INPUT=30
ANTHROPIC_API_KEY=                🔒 only with AI_PROVIDER=anthropic or a tool that asks for it
AI_PRICE_TABLE_JSON=              ⚙️ optional cost-table override
NEXT_PUBLIC_TURNSTILE_SITE_KEY=   🌐 FUTURE — not read by code yet
TURNSTILE_SECRET_KEY=             🔒 FUTURE — not read by code yet
RESEND_WEBHOOK_SECRET=            🔒 FUTURE — bounce/complaint webhook, not implemented
NEXT_PUBLIC_BING_SITE_VERIFICATION=   🌐 optional
```

## V3 — extension, scaling

```
# Dedicated worker service (second Railway service, same variables + these):
EMBEDDED_WORKER=false             # on the web service once the worker runs
WORKER_CONCURRENCY=2              # on the worker service
WORKER_POLL_MS=2000
# Browser extension: no server variables. The extension ships only NEXT_PUBLIC_APP_URL at build time.
```

# Public variables (compiled into the browser — never secrets)

```
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_BRAND_NAME
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION      (optional)
NEXT_PUBLIC_BING_SITE_VERIFICATION        (optional)
NEXT_PUBLIC_TURNSTILE_SITE_KEY            (FUTURE)
```

# Server-only secrets (Railway Variables only; never GitHub, frontend, extension, logs, screenshots)

```
DATABASE_URL
AUTH_SECRET
SIGNING_SECRET
CRON_SECRET
STRIPE_SECRET_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY                 (FUTURE)
RESEND_API_KEY
GOOGLE_CLIENT_SECRET
S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY   (FUTURE)
TURNSTILE_SECRET_KEY              (FUTURE)
SENTRY_DSN                        (low sensitivity, still server-side)
```

# Webhook secrets

```
STRIPE_WEBHOOK_SECRET             endpoint https://orvionis.com/api/stripe/webhook — events: checkout.session.completed,
                                  checkout.session.async_payment_succeeded, checkout.session.async_payment_failed,
                                  checkout.session.expired, payment_intent.payment_failed, charge.refunded, charge.dispute.created
RESEND_WEBHOOK_SECRET             (FUTURE) endpoint https://orvionis.com/api/email/webhook — not implemented
```

# OAuth credentials

```
GOOGLE_CLIENT_ID                  Google Cloud → APIs & Services → Credentials → OAuth client (Web application)
GOOGLE_CLIENT_SECRET              Authorized redirect URIs: https://orvionis.com/api/auth/google/callback
                                                            http://localhost:3000/api/auth/google/callback
                                  Authorized JavaScript origins: https://orvionis.com, http://localhost:3000
                                  Scopes: openid email profile
```
