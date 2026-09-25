# ORVIONIS — AI operator state (persistent)

This file is the hand-off between operator sessions. Every session: read it first, act, then update it and commit.
Rule: no secrets in this file — only names, ids, paths and states.

## Infrastructure (facts)

| Item | Value |
| --- | --- |
| GitHub repo | `melkos158-rgb/hfjveojo` (branch `main` = production) |
| Local clone (owner's Windows PC) | `C:\Users\Kostiantyn\Documents\hfjveojo` |
| Git auth (local) | `.git/orvionis-credential-helper.sh` reads the token from a file outside the repo (owner's Desktop); `git push` works from the Cowork VM mount `~/mnt/hfjveojo` |
| Railway project | `courageous-flow` (id `4059435b-10b8-4d3b-8353-063e4f01ffb1`), env `production` (id `ef5df801-c352-4288-93d1-9ff49fe373b7`) |
| Railway web service | `hfjveojo` (id `5630800b-857d-4f7e-aec2-22e2fcbe7994`), domain `orvionis.com`, region EU West, auto-deploys from GitHub `main` |
| Railway Postgres | service `Postgres`; ORVIONIS lives in schema `orvionis` (`DATABASE_URL=${{Postgres.DATABASE_URL}}?schema=orvionis`); legacy Ride Lab tables remain in `public` (do not drop without owner approval) |
| Start command | `npm run start:railway` = `prisma migrate deploy && tsx prisma/seed.ts && next start` |
| Worker | none yet — `JOBS_INLINE=true` on the web service (fulfilment runs after the webhook response via `after()`) |
| Stripe | account "jarvis sandbox" (test mode, acct `acct_1UIuDh2cM37Fu7zW`); webhook destination `orvionis-production` (`we_1UJgdu2cM37Fu7zWW3FeZqvh`) → `https://orvionis.com/api/stripe/webhook`, 7 events; `STRIPE_SECRET_KEY` is a **test** key — live mode not activated |
| Email | `EMAIL_PROVIDER=console` (no Resend key yet) → customer emails are only written to Railway logs |
| AI | `AI_PROVIDER=openai`, **`OPENAI_API_KEY` not set** → automated orders will fail until the owner adds it in Railway Variables |
| Admin | `ADMIN_EMAILS=melkos158@gmail.com`; sign-in link appears in Railway deploy logs while email is in console mode |

## Status (update every session)

- 2026-09-25 — Ride Lab replaced by ORVIONIS on the same repo/service/domain. Production ACTIVE at https://orvionis.com (home, /tools, tool pages, legal pages, /api/health). Migrations applied in schema `orvionis`; seed runs on every start. Stripe test webhook created. Variables set (secrets generated per environment, not stored here).

## Owner actions needed (cannot be done by the operator)

1. Add `OPENAI_API_KEY` in Railway → hfjveojo → Variables (then click Deploy). Until then: Photographer Pricing Guide orders fail after retries; Listing Clips orders still arrive (concierge) but without the AI clip plan.
2. Resend: create account, verify domain `orvionis.com` (SPF/DKIM), add `RESEND_API_KEY` and set `EMAIL_PROVIDER=resend`. Until then customers get no emails (order page + Stripe receipt still work).
3. Stripe live mode: activate the account, add the live `STRIPE_SECRET_KEY`, create the live webhook endpoint (same URL/events) and set its `STRIPE_WEBHOOK_SECRET`.
4. Legal placeholders in `src/config/site.ts` (entity, address, governing law) — see `docs/LEGAL_FLAGS.md`.
5. Outreach: docs/OUTREACH.md — 15 DMs/day to agents, 10/day to photographers; log hours in /admin/experiments.

## Operator TODO (priority order)

1. [ ] Verify end-to-end test purchase on production (Stripe test card 4242…) once OPENAI_API_KEY is set: order → webhook → fulfilment → delivery email in logs → /admin/orders.
2. [ ] Add a `worker` Railway service (`npm run worker`) and set `JOBS_INLINE=false` on web — enables the nightly AI CEO report and maintenance without cron.
3. [ ] Hero/OG visuals for /real-estate and /photographers (Higgsfield images, `public/img/`), `opengraph-image` routes.
4. [ ] Clean legacy Ride Lab variables on Railway (`ADMIN_PATH`, `SITE_URL`, `ADMIN_RESET`) — harmless, low priority.
5. [ ] GitHub Actions: confirm CI passes on `main` (needs repo Actions enabled).
6. [ ] After first paid orders: review /admin/analytics, update experiments E1/E2 conclusions, decide next tool.

## Session log

- 2026-09-25 22:55–23:35 UTC+2: repo replaced, 6 deploy iterations (gitignore `storage/` bug, devDependencies under NODE_ENV=production, vitest in type-check, P3005 non-empty DB → own schema), seed-on-start, Stripe webhook, variables. Production verified via HTTP.
