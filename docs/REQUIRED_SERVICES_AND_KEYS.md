# ORVIONIS — external services, credentials and configuration (audit)

Audited on 2026-09-26 against the actual code (`src/lib/env.ts` is the only place a variable is read; nothing else reads `process.env`),
`.env.example`, `package.json`, `railway.json`, the Railway service `hfjveojo` (project `courageous-flow`) and the Stripe sandbox.
Goal: set the infrastructure up **once**; ORVIONIS then uses the same keys for every tool, page and job.

**Never put real values in this file, in `.env.example`, in source, in the browser, in a browser extension, in logs or in commit messages.**
Production values live only in Railway → service `hfjveojo` → Variables. Local values live only in `.env.local` (git-ignored).

## 0. Summary

| Status | Service / credential | Variable(s) |
| --- | --- | --- |
| ✅ configured | PostgreSQL (Railway) | `DATABASE_URL` |
| ✅ configured | App secrets (generated, no provider) | `AUTH_SECRET`, `SIGNING_SECRET`, `CRON_SECRET` |
| ✅ configured | Stripe (sandbox/test) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| ✅ configured | OpenAI | `OPENAI_API_KEY` |
| ✅ configured | Google sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| ⚠️ configured, **domain not verified** | Resend | `RESEND_API_KEY` (+ DNS records, see §3) |
| ⏳ CREATE NOW (no key, DNS only) | Google Search Console | `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` or a DNS TXT record |
| ⏳ NOW (owner finished live onboarding 2026-09-26) | Stripe **live** key + live webhook | `STRIPE_LIVE_SECRET_KEY`, `STRIPE_LIVE_WEBHOOK_SECRET`, then `STRIPE_MODE=live` — see `docs/STRIPE_LIVE.md` |
| FUTURE (V1/V2) | S3-compatible storage (Cloudflare R2) | `S3_*` |
| FUTURE (V1) | Error monitoring (Sentry) | `SENTRY_DSN` |
| FUTURE (V2, only if spam appears) | Cloudflare Turnstile | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| FUTURE (V2) | Anthropic (second AI provider) | `ANTHROPIC_API_KEY` |
| FUTURE (V2/V3) | Browser extension, Chrome Web Store | none server-side |
| not needed | Redis / queue service, Google Analytics, Tag Manager, Stripe publishable key, Stripe Price IDs | — |

## 1. How to read the entries

Each entry answers the 18 questions from the audit brief in a fixed order:
service · variable · purpose · needed now? · stage · where to get it · credential type · prod/dev/both · free tier ·
one key for all of ORVIONIS? · separate key/domain/project? · callback/webhook URLs & domains · DNS · scopes/permissions ·
secret? (never in GitHub/frontend/extension) · safe in Railway Variables? · rotation/revocation · official page.

Stages: **MVP** = what is live today (3 tools, Stripe test mode). **V1** = first real money (Stripe live, verified email domain).
**V2** = growth (more tools, uploads at scale, second AI provider, bot protection if needed). **V3** = extension, multi-service scaling.

---

## 2. AUTH

### 2.1 Google sign-in (OAuth 2.0 / OpenID Connect) — ✅ configured

- **Variables:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Purpose:** "Continue with Google" on `/login` (`src/lib/auth/google.ts`, routes `/api/auth/google` and `/api/auth/google/callback`). Does not depend on email delivery.
- **Needed now:** yes (already set in Railway). **Stage:** MVP.
- **Where:** Google Cloud Console → APIs & Services → Credentials → Create credentials → OAuth client ID → type **Web application**. First configure the **OAuth consent screen** (External, app name ORVIONIS, support email, homepage `https://orvionis.com`, privacy `https://orvionis.com/privacy`, terms `https://orvionis.com/terms`). Publish the consent screen so any Google account can sign in (while "Testing", only listed test users can).
- **Credential type:** OAuth client ID (public) + client secret (secret).
- **Prod/dev:** both; one client can hold several redirect URIs.
- **Free:** yes.
- **One key for all of ORVIONIS:** yes — one OAuth client for the whole site; add more redirect URIs if new domains appear.
- **Separate project needed:** no; one Google Cloud project "ORVIONIS" is enough (Search Console and later APIs can live in the same project).
- **Authorized redirect URIs (exact, from code `appUrl("/api/auth/google/callback")`):**
  - `https://orvionis.com/api/auth/google/callback` (production)
  - `http://localhost:3000/api/auth/google/callback` (development)
- **Authorized JavaScript origins:** `https://orvionis.com`, `http://localhost:3000`.
- **DNS:** none.
- **Scopes:** `openid email profile` (non-sensitive; no verification review needed).
- **Secret:** `GOOGLE_CLIENT_SECRET` — never in GitHub/frontend/extension. `GOOGLE_CLIENT_ID` is public by design but is still kept server-side here.
- **Railway Variables:** safe. **Rotation:** rotate the secret in Google Cloud if leaked (a client can hold two secrets during rotation); no scheduled rotation needed.
- **Official page:** https://console.cloud.google.com/apis/credentials

### 2.2 Email magic links — ✅ configured (depends on Resend, §3)

- **Variables:** `AUTH_SECRET` (session JWT + Google state signing), `SESSION_TTL_DAYS`, `SIGNING_SECRET` (order links, file URLs), `ADMIN_EMAILS` (who is ADMIN).
- **Purpose:** passwordless sign-in (`/api/auth/request` → email → `/api/auth/verify`); order access tokens; signed file URLs.
- **Needed now:** yes. **Stage:** MVP.
- **Where:** generated locally — `openssl rand -base64 32` (no provider). Already set in Railway.
- **Type:** random secrets (≥32 chars for `AUTH_SECRET`, ≥16 for `SIGNING_SECRET`).
- **Prod/dev:** both, **different values per environment**.
- **Secret:** yes, all three. **Railway:** safe. **Rotation:** rotating `AUTH_SECRET` logs everyone out; rotating `SIGNING_SECRET` invalidates old order links/file URLs (customers keep the order page via login). Rotate only on suspected leak.

### 2.3 Other OAuth providers — none planned

Apple/Microsoft/Facebook sign-in is not in the code or the plan. Customers are agents, photographers and contractors; Google + email covers them. Do not create these.

---

## 3. EMAIL — Resend — ⚠️ key set, domain **not verified** (this is the current blocker for all email)

- **Variables:** `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM` (`ORVIONIS <hello@orvionis.com>`), `EMAIL_REPLY_TO` (`hello@orvionis.com`)
- **Purpose:** sign-in links, order confirmation, delivery emails, admin alerts (`src/lib/email`, HTTP API `https://api.resend.com/emails`, no SMTP).
- **Needed now:** yes. **Stage:** MVP.
- **Where:** https://resend.com/api-keys (key) and https://resend.com/domains (domain).
- **Credential type:** API key with **Sending access** only (not "Full access"), optionally restricted to the domain `orvionis.com`.
- **Prod/dev:** production only; development uses `EMAIL_PROVIDER=console` (emails are printed to the log, magic link is shown on the page).
- **Free tier:** yes (3,000 emails/month, 100/day at the time of writing) — enough for months.
- **One key for all:** yes, one key covers every email ORVIONIS sends.
- **Separate domain:** the **sending domain must be verified once**: add `orvionis.com` in Resend → Domains (region EU or US — pick one and keep it), then create the DNS records Resend shows. Until verified, every send fails with `403 The orvionis.com domain is not verified` (seen in production logs 2026-09-26 03:18).
- **DNS records (Resend shows the exact values; typical set):**
  - DKIM: TXT `resend._domainkey.orvionis.com` → `p=MIG…` (the value Resend generates)
  - Return-path/SPF for bounces: MX `send.orvionis.com` → `feedback-smtp.<region>.amazonses.com` (priority 10) and TXT `send.orvionis.com` → `v=spf1 include:amazonses.com ~all`
  - DMARC (recommended, add yourself): TXT `_dmarc.orvionis.com` → `v=DMARC1; p=none; rua=mailto:hello@orvionis.com` (move to `p=quarantine` after a few weeks of clean reports)
  - Do **not** add a second SPF TXT on the root domain if one already exists; merge includes into the existing record.
- **Sender:** `hello@orvionis.com` (`EMAIL_FROM`). Replies go to the same mailbox (`EMAIL_REPLY_TO`) — that mailbox must exist (Google Workspace, Zoho, or forwarding). Resend does not receive mail.
- **Webhook / signing secret:** not needed now. Only if you later want bounce/complaint events in the app (FUTURE V2: `RESEND_WEBHOOK_SECRET`, endpoint `https://orvionis.com/api/email/webhook` — not implemented).
- **Scopes:** Sending access.
- **Secret:** `RESEND_API_KEY` yes. **Railway:** safe. **Rotation:** on leak; keys can be revoked instantly in the Resend dashboard.

---

## 4. AI

### 4.1 OpenAI — ✅ configured

- **Variables:** `AI_PROVIDER=openai`, `OPENAI_API_KEY`, `AI_MODEL_CHEAP` (`gpt-4.1-mini`), `AI_MODEL_STANDARD` (`gpt-4.1`), `AI_MODEL_BEST` (`gpt-4.1`), `AI_DAILY_BUDGET_CENTS`, `AI_MAX_COST_PER_ORDER_CENTS`, `AI_PRICE_TABLE_JSON` (optional price override for cost accounting); image edits: `AI_IMAGE_MODEL` (`gpt-image-2`; `gpt-image-1` is deprecated), `AI_IMAGE_QUALITY` (`medium`), `AI_IMAGE_COST_CENTS` (≈ cost per output image, default 5 — used for cost accounting and the per-order cap)
- **Purpose:** drafting every AUTO deliverable (listing description, pricing guide copy, clip plan) and model QA (`src/lib/ai`); **Virtual Staging** sends the customer's room photo to the Images API (`images.edit`, 2 outputs per order; gpt-image-2 medium ≈ $0.041 per 1536×1024 image → ≈ $0.10 per order incl. input). Cost is metered per request into `AiRequest`; the daily budget and per-order cap are hard stops (the $1 per-order cap leaves ~9× headroom over a staging order).
- **Needed now:** yes. **Stage:** MVP.
- **Where:** https://platform.openai.com/api-keys — create the key inside a **project** named ORVIONIS (Projects → Create), so usage and limits are separate from any other work. Add a monthly budget limit at https://platform.openai.com/settings/organization/limits.
- **Credential type:** project API key (`sk-proj-…`).
- **Prod/dev:** both can share one key; a second key in the same project for local development is cleaner for revocation.
- **Free tier:** no (prepaid credits; a few dollars cover hundreds of orders at current prices).
- **One key for all:** yes — all tools use the same provider abstraction.
- **Separate project:** one OpenAI project "ORVIONIS" (not a separate organization).
- **Callbacks/DNS:** none. **Scopes:** default (model access); no organization-admin permissions.
- **Secret:** yes. **Railway:** safe. **Rotation:** on leak, or when a team member leaves; set a spend limit as the real safety net.
- **Image work (Virtual Staging, live)** uses the same key (`gpt-image-2` on the Images API) — no new credential. Verified in production 2026-09-26: the project has image-model access (the first test ran on `gpt-image-1`). Tier-1 limit for gpt-image-2 is 5 images/minute (= 2 staging orders/minute) — raise the usage tier before running paid traffic in bursts.

### 4.2 Anthropic — FUTURE (V2), optional second provider

- **Variables:** `ANTHROPIC_API_KEY` (+ `AI_PROVIDER=anthropic` to switch)
- **Purpose:** the provider abstraction already supports Anthropic (`https://api.anthropic.com/v1/messages`). Use it as a fallback or for tools where it writes better; not required for MVP.
- **Where:** https://console.anthropic.com/settings/keys. Paid, per-token. Secret, Railway-safe, rotate on leak. **Do not create until a tool needs it.**

### 4.3 Other AI providers — not needed

Higgsfield is used by the operator for marketing visuals through the Cowork session, not by the app. No key in Railway.

---

## 5. PAYMENTS — Stripe — ✅ test mode configured, live mode = V1

- **Variables:** sandbox pair `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`; live pair `STRIPE_LIVE_SECRET_KEY` + `STRIPE_LIVE_WEBHOOK_SECRET`; `STRIPE_MODE` (test | live) picks the pair customer checkouts use; `STRIPE_CURRENCY=usd`. The switch procedure is `docs/STRIPE_LIVE.md`.
- **Not needed:** `STRIPE_PUBLISHABLE_KEY` (hosted Checkout, no Stripe.js in the browser), Price IDs / Product IDs (prices are created inline with `price_data` from the `Product` table, so changing a price in `/admin/products` needs no Stripe change), Stripe Customer Portal, Stripe Tax (revisit when VAT/OSS is decided — see `docs/LEGAL_FLAGS.md`).
- **Purpose:** Checkout Sessions (`src/lib/orders/create.ts`), refunds (`refunds.create`), receipts with the private order link (`payment_intent_data.receipt_email` + description), webhook → order state machine, account branding (`/admin/system`).
- **Needed now:** yes (test). **Stage:** MVP = sandbox; **V1 = live keys** once the account is activated (business details, bank account — owner only).
- **Where:**
  - Secret key: https://dashboard.stripe.com/apikeys (live) · https://dashboard.stripe.com/test/apikeys (sandbox). Use a **restricted key** if you prefer: permissions Checkout Sessions *write*, Payment Intents *read*, Refunds *write*, Charges *read*, Files *write*, Account *write* (for branding).
  - Webhook: https://dashboard.stripe.com/webhooks (live) · https://dashboard.stripe.com/test/webhooks (sandbox) → Add destination → endpoint URL below → events below → copy the **signing secret** (`whsec_…`).
- **Webhook endpoint (exact, from code `src/app/api/stripe/webhook/route.ts`):** `https://orvionis.com/api/stripe/webhook`
- **Events to subscribe (exact, from `src/lib/stripe/webhooks.ts`):** `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`
- **Credential type:** secret key (`sk_test_…` / `sk_live_…` or `rk_…` restricted) + webhook signing secret (`whsec_…`). Each mode (test/live) has its **own** pair — the live webhook is a separate destination with its own secret.
- **Prod/dev:** production holds both pairs: customer checkouts use `STRIPE_MODE`; admin sandbox checkouts and pipeline tests always use the sandbox (`acct_1UIuDh2cM37Fu7zW`, "orvionis sandbox"); each order stores its `livemode` and only events of that mode can change it; refunds go to the order's own mode. Development uses sandbox keys and `stripe listen --forward-to localhost:3000/api/stripe/webhook` (Stripe CLI gives a local `whsec_`).
- **Free:** no monthly fee; per-transaction pricing.
- **One key for all:** yes — one Stripe account for all ORVIONIS products.
- **Separate account:** no. Do not create new sandboxes; the existing one is wired.
- **Domains:** `orvionis.com` is set as the business URL; Checkout runs on `checkout.stripe.com` (no custom domain needed).
- **DNS:** none. **Scopes:** see restricted-key permissions above.
- **Secret:** both variables. **Railway:** safe. **Rotation:** roll the key in the Dashboard (Stripe supports a grace period); rotate the webhook secret by adding a new destination and deleting the old one.
- **Branding / public business name:** Dashboard only — Stripe refuses account updates through the API on your own account ("you may only use it on connected accounts"). Settings → Business → Branding (colours/icon, works in a sandbox; set to `#08090D` / `#8B5CF6` on 2026-09-26) and Public details (business name — appears after activation; a sandbox keeps its creation name on Checkout). `/admin/system` shows the account the key points at and whether the webhook lives there.
- **Customer emails:** Dashboard → Settings → Customer emails → enable "Successful payments" (live). Receipts already carry the order link because the app sets `receipt_email`.

---

## 6. BOT PROTECTION — no CAPTCHA today (by design); Turnstile = FUTURE (V2)

- **What exists:** honeypot field on the contact/tool-request form, per-IP and per-email rate limits (`src/lib/security/ratelimit.ts`, stored in Postgres), size/type sniffing on uploads, Stripe's own fraud checks at Checkout. Paid orders are the only expensive action and they sit behind Stripe.
- **Needed now:** no. Add only if `/admin/feedback` or the login endpoint shows automated abuse.
- **Planned provider when needed:** **Cloudflare Turnstile** (free, no cookie banner impact, works without a Cloudflare-proxied domain).
  - Variables: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (public, browser), `TURNSTILE_SECRET_KEY` (server, verifies the token at `https://challenges.cloudflare.com/turnstile/v0/siteverify`).
  - Where: https://dash.cloudflare.com/?to=/:account/turnstile → Add widget → hostnames `orvionis.com`, `www.orvionis.com`, and `localhost` for development (Turnstile allows localhost in the hostname list).
  - Widget mode: Managed (invisible when possible). One widget serves the whole site.
  - Secret: `TURNSTILE_SECRET_KEY` only. Railway-safe. Rotation on leak.
- reCAPTCHA is not planned (privacy banner implications, worse UX).

---

## 7. DATABASE — PostgreSQL on Railway — ✅ configured

- **Variable:** `DATABASE_URL` = `${{Postgres.DATABASE_URL}}?schema=orvionis` (Railway reference variable; the ORVIONIS tables live in schema `orvionis`, legacy Ride Lab tables remain in `public`).
- **Purpose:** everything: users, orders, jobs (queue), files (`STORAGE_BACKEND=db`), analytics events, rate limits, settings.
- **Migrations:** `prisma migrate deploy` runs on every start (`npm run start:railway`); no extra credential. Prisma uses the Rust-free client (`engineType="client"`, `@prisma/adapter-pg`).
- **Backups:** Railway volume backups (Postgres service → Backups; daily on Hobby) — no credential in the app. For an off-site copy later (V2): a read-only role `orvionis_backup` and a scheduled `pg_dump` to R2 — FUTURE, no variable today.
- **Dev:** local Postgres, `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/orvionis?schema=public`.
- **Secret:** yes (contains the password). **Railway:** safe (managed by Railway). **Rotation:** Railway can regenerate the Postgres password; update the reference automatically.

---

## 8. STORAGE — Postgres today, S3-compatible = FUTURE (V1/V2)

- **Today:** `STORAGE_BACKEND=db` — generated PDFs/markdown and small uploads (logos) are stored as bytes in Postgres with retention (`FILE_RETENTION_DAYS_OUTPUT=90`, `FILE_RETENTION_DAYS_INPUT=30`, purged by the hourly maintenance job). Fine up to a few hundred MB.
- **Switch when:** room photos / video uploads arrive (virtual staging, clips at scale) or the DB passes ~1 GB of files.
- **Provider:** **Cloudflare R2** (S3-compatible, no egress fees, free tier 10 GB) — the code already uses `@aws-sdk/client-s3` with a custom endpoint, so AWS S3 or Backblaze B2 work too.
- **Variables:** `STORAGE_BACKEND=s3`, `S3_ENDPOINT` (`https://<accountid>.r2.cloudflarestorage.com`), `S3_REGION=auto`, `S3_BUCKET` (`orvionis-files`), `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- **Where:** https://dash.cloudflare.com/?to=/:account/r2 → Create bucket → Manage R2 API Tokens → token with **Object Read & Write** limited to that bucket.
- **Bucket:** one private bucket for all environments is enough; use a `dev/` prefix locally, or a second bucket `orvionis-files-dev` if you want isolation. Files are served through signed URLs (`/api/files/[id]`), so the bucket stays private (no public domain, no CORS needed).
- **DNS:** none. **Secret:** access key + secret key. **Railway:** safe. **Rotation:** on leak; tokens are revocable per bucket.

---

## 9. DEPLOYMENT — Railway — ✅ configured

- **Project/service:** `courageous-flow` → service `hfjveojo` (web + embedded job loop) + `Postgres`. Auto-deploys from GitHub `melkos158-rgb/hfjveojo` branch `main`. Build `npm run build`, start `npm run start:railway`, healthcheck `/api/health`.
- **Variables that are configuration, not secrets:** `APP_ENV=production`, `NODE_ENV=production`, `NEXT_PUBLIC_APP_URL=https://orvionis.com`, `NEXT_PUBLIC_BRAND_NAME=ORVIONIS`, `ADMIN_EMAILS`, `STRIPE_CURRENCY`, `AI_*` model names and budgets, `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `STORAGE_BACKEND`, `JOBS_INLINE=true`, `EMBEDDED_WORKER*`, `SESSION_TTL_DAYS`, `LOG_LEVEL`. Optional: `RAILWAY_DEPLOYMENT_DRAINING_SECONDS=30` (lets in-flight jobs finish during a deploy).
- **Legacy (Ride Lab) variables still present, unused by ORVIONIS:** `ADMIN_PATH`, `SITE_URL`, `ADMIN_RESET` — safe to delete.
- **Railway-provided (8, read-only):** `RAILWAY_*` (environment, service, deployment ids), `PORT`. No action.
- **Domain:** `orvionis.com` attached to the service (Railway → Settings → Networking → Custom Domain); DNS at the registrar: `CNAME orvionis.com → <service>.up.railway.app` (or ALIAS/ANAME at the apex) and `CNAME www → same`. TLS is automatic.
- **Webhook URLs registered elsewhere that point here:** Stripe `https://orvionis.com/api/stripe/webhook`; Google redirect `https://orvionis.com/api/auth/google/callback`.
- **Railway API token:** **not needed** by the app. The operator reads deploy status from GitHub commit statuses (Railway posts them) and the dashboard. Do not create a Railway token for the app.
- **GitHub:** repo access for the local clone uses the credential helper (token file outside the repo). GitHub Actions CI needs no secrets (tests use a local Postgres service in the workflow).
- **Secrets in Railway:** every value marked secret in this document is safe there (encrypted at rest, only visible to project members).

---

## 10. ANALYTICS — first-party — ✅ no external service

- **What exists:** page views, CTA clicks, intake starts, checkout, paid, delivered, free-tool use → `Event` table, sessions via `orv_sid` cookie, UTM attribution via `orv_attr` cookie, KPIs in `/admin/analytics`, daily CEO report. No cookies from third parties; the consent banner covers the first-party cookie.
- **Google Analytics / Tag Manager:** **not needed** and not planned — they add a consent burden and duplicate what `/admin/analytics` already shows. Revisit only if you buy ads that require conversion pixels (then: Meta/Google Ads pixels, V2, public IDs only, no secrets).
- **Google Search Console:** see §11 — free, no API key; verification only.

---

## 11. SEO — ⏳ Search Console verification is the one thing to do now

- **What exists in code:** `robots.ts` (`/robots.txt`, disallows admin/api/orders/checkout/login), `sitemap.ts` (`/sitemap.xml`, all live tools + free tools), canonical URLs, Open Graph/Twitter cards, JSON-LD (Product + FAQ on tools, FAQ on home, WebApplication on the free checker), favicon/apple icon.
- **Search Console (free, no key):** https://search.google.com/search-console → Add property → **Domain** `orvionis.com` → verify with a **DNS TXT record** at the registrar: name `@` (root), value `google-site-verification=…` (Google shows it). Domain property covers `http/https` and `www` at once. Then Sitemaps → submit `https://orvionis.com/sitemap.xml`.
  - Alternative without DNS: URL-prefix property + HTML tag — set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<token>` (public, not a secret) and the app renders the `<meta name="google-site-verification">` tag (`src/app/layout.tsx`).
- **Bing Webmaster Tools (optional, free):** can import from Search Console; `NEXT_PUBLIC_BING_SITE_VERIFICATION` is supported the same way if you want it. FUTURE.
- **Indexing API:** not needed (it is for job/livestream pages only).
- **DNS:** the TXT verification record above; nothing else.

---

## 12. BROWSER EXTENSION — FUTURE (V2/V3), not built

- **Plan:** thin client (MV3) that captures a listing page and opens the ORVIONIS intake pre-filled. It calls the public site only: `NEXT_PUBLIC_APP_URL` baked at build time, user sessions via the normal login in a tab (or a short-lived token issued by `/api/extension/session` — to be designed). **No server secrets in the extension**, ever: no OpenAI, Stripe, Resend, DB or `AUTH_SECRET`.
- **Google sign-in from the extension:** not needed; the extension opens `https://orvionis.com/login` in a tab. If an in-extension flow is ever wanted, register a second redirect URI `https://<extension-id>.chromiumapp.org/` on the same OAuth client (no new client).
- **Chrome Web Store:** one-time developer registration ($5) under the owner's Google account — https://chrome.google.com/webstore/devconsole. Publishing is manual; no API credential unless CI publishing is wanted later (then a separate OAuth client + refresh token, FUTURE V3).
- **Extension ID:** appears after the first upload; only needed if the backend must restrict CORS to the extension origin (`chrome-extension://<id>`). No variable today.

---

## 13. SOCIAL / ACQUISITION — no API credentials needed for the plan

- **What the plan actually needs:** manual DMs (docs/OUTREACH.md), the free tools as lead magnets, Search Console. All manual or first-party.
- **Not needed now:** Instagram Graph API, TikTok API, LinkedIn API, Buffer/Later, Zapier, Mailchimp. Creating them "just in case" would only add tokens to rotate. Revisit only when a specific automation is scheduled (e.g. posting sample results automatically — V3).
- **Higgsfield / image generation for marketing:** used by the operator inside Cowork; no app credential.

---

## 14. MONITORING — ✅ built-in today; Sentry = FUTURE (V1)

- **Built-in:** structured JSON logs (Railway Logs), `ErrorLog` table + `/admin/system` "Recent errors", admin alert emails (`notifyAdmins`, via Resend), `/api/health` (DB, queue depth, worker heartbeat; Railway healthcheck), daily CEO report.
- **Uptime:** Railway restarts on failure (`restartPolicyType ON_FAILURE`). **GitHub Actions `uptime.yml`** pings `https://orvionis.com/api/health` every 15 minutes (health ok, worker heartbeat < 5 min, home page renders) — a failed run emails the repo owner; no credentials. UptimeRobot (1–5 min checks) stays optional: https://uptimerobot.com
- **Error monitoring:** `SENTRY_DSN` is reserved in `env.ts` but the SDK is not installed (`src/lib/errors.ts` has the hook). When there are paying customers: create a Sentry project (Next.js) at https://sentry.io → the DSN is **public-ish** (it can only send events) but keep it in Railway anyway; install `@sentry/nextjs`. FUTURE V1.
- **Log retention:** Railway keeps recent logs; for longer retention (V2) a log drain (Better Stack/Axiom) — token in Railway, FUTURE.

---

## 15. BACKGROUND JOBS — ✅ Postgres-backed, no extra service

- **Queue:** `Job` table with `FOR UPDATE SKIP LOCKED` claims; embedded loop in the web process (`EMBEDDED_WORKER=true`), inline execution after webhooks (`JOBS_INLINE=true`), hourly maintenance and the 06:10 UTC daily report scheduled by the loop. Graceful shutdown hands running jobs back on deploy.
- **Redis / BullMQ / external cron:** **not needed**. `/api/internal/*` endpoints exist for an external scheduler and are protected by `CRON_SECRET` (bearer) — only needed if the embedded loop is ever disabled.
- **Dedicated worker (V2, throughput):** a second Railway service running `npm run worker` with the **same variables** (reference them) and `EMBEDDED_WORKER=false` on the web service. No new credentials.

---

## 16. What to create now — the short list for the owner

1. **Resend domain verification** — Resend → Domains → `orvionis.com` → add the DKIM/MX/SPF records (plus `_dmarc`) at the DNS provider → Verify. Nothing to paste into Railway; the key is already there. Until then, sign-in emails and order emails fail (Google sign-in and Stripe receipts still work).
2. **Google Search Console** — Domain property `orvionis.com`, DNS TXT verification, submit `https://orvionis.com/sitemap.xml`. No key.
3. **Google OAuth consent screen → Publish** (if still in "Testing" status), and confirm the client has exactly `https://orvionis.com/api/auth/google/callback` as redirect URI. Keys are already in Railway.
4. **OpenAI project budget limit** (not a credential): platform.openai.com → Limits → monthly budget, e.g. $50, with email alert at 75 %.
5. **Stripe live:** follow `docs/STRIPE_LIVE.md` — live secret key → `STRIPE_LIVE_SECRET_KEY`; live destination (created from `/admin/system` or the Dashboard) → its signing secret → `STRIPE_LIVE_WEBHOOK_SECRET`; probe event verified on `/admin/system`; then `STRIPE_MODE=live`. The sandbox pair stays as it is.

Everything else in this document is FUTURE — do not create it yet.
