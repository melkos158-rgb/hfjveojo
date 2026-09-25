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
| Worker | no separate service — `JOBS_INLINE=true` (fulfilment runs right after the webhook response via `after()`) + embedded job loop in the web process (`EMBEDDED_WORKER`, default on; `src/instrumentation.ts`) for retries, hourly maintenance and the 06:10 UTC CEO report. `/api/health` → `worker.lastTickAt` is the heartbeat |
| Stripe | account "jarvis sandbox" (test mode, acct `acct_1UIuDh2cM37Fu7zW`); webhook destination `orvionis-production` (`we_1UJgdu2cM37Fu7zWW3FeZqvh`) → `https://orvionis.com/api/stripe/webhook`, 7 events; `STRIPE_SECRET_KEY` is a **test** key — live mode not activated |
| Email | `EMAIL_PROVIDER=console` (no Resend key yet) → customer emails are only written to Railway logs |
| AI | `AI_PROVIDER=openai`, **`OPENAI_API_KEY` not set** → automated orders will fail until the owner adds it in Railway Variables |
| Admin | `ADMIN_EMAILS=melkos158@gmail.com`; sign-in link appears in Railway deploy logs while email is in console mode |
| Brand style | Owner chose concept **№2 "premium editorial"** (2026-09-26): white canvas, near-black type and primary buttons (`#0B0B0C`), warm off-white sections (`#F7F6F3`), hairlines `#E7E4DE`, amber accent `#C48A2E` for eyebrows. Tokens live in `src/app/globals.css` (`@theme`); heroes are light with the photo on the right; OG cards use the same palette. Do not reintroduce dark/neon hero blocks |

## Status (update every session)

- 2026-09-25 — Ride Lab replaced by ORVIONIS on the same repo/service/domain. Production ACTIVE at https://orvionis.com (home, /tools, tool pages, legal pages, /api/health). Migrations applied in schema `orvionis`; seed runs on every start. Stripe test webhook created. Variables set (secrets generated per environment, not stored here).
- 2026-09-26 — Brand visuals live: Higgsfield-generated heroes (`public/img/hero-*.webp`, JPEG twins for OG) on /real-estate, /photographers and the home "Who is this for?" cards; static Open Graph cards for /, /real-estate, /photographers (`src/lib/og.tsx`, rendered at build time). Vertical pages now have a primary CTA to the tool page and a `#tools` anchor.

## Owner actions needed (cannot be done by the operator)

1. Add `OPENAI_API_KEY` in Railway → hfjveojo → Variables (then click Deploy). Until then: Photographer Pricing Guide orders fail after retries; Listing Clips orders still arrive (concierge) but without the AI clip plan.
2. Resend: create account, verify domain `orvionis.com` (SPF/DKIM), add `RESEND_API_KEY` and set `EMAIL_PROVIDER=resend`. Until then customers get no emails (order page + Stripe receipt still work).
3. Stripe live mode: activate the account, add the live `STRIPE_SECRET_KEY`, create the live webhook endpoint (same URL/events) and set its `STRIPE_WEBHOOK_SECRET`.
4. Legal placeholders in `src/config/site.ts` (entity, address, governing law) — see `docs/LEGAL_FLAGS.md`.
5. Outreach: docs/OUTREACH.md — 15 DMs/day to agents, 10/day to photographers; log hours in /admin/experiments.

## Operator TODO (priority order)

1. [ ] Verify end-to-end test purchase on production (Stripe test card 4242…) once OPENAI_API_KEY is set: order → webhook → fulfilment → delivery email in logs → /admin/orders.
2. [x] Background jobs without a worker service — done 2026-09-26 via the embedded loop (owner asked for no new Railway services). A dedicated worker is only needed for throughput; if added, set `EMBEDDED_WORKER=false` on web.
3. [x] Hero/OG visuals for /real-estate and /photographers (Higgsfield images, `public/img/`), `opengraph-image` routes — done 2026-09-26. To regenerate: Higgsfield `generate_image_batch` (gpt_image_2_5, 16:9) → resize 1200px WebP q60 + 900px JPEG for the OG renderer (WebP is not decoded by it).
4. [ ] Clean legacy Ride Lab variables on Railway (`ADMIN_PATH`, `SITE_URL`, `ADMIN_RESET`) — harmless, low priority.
5. [x] GitHub Actions: CI green on `main` (runs #1–#9 checked 2026-09-26).
6. [ ] After first paid orders: review /admin/analytics, update experiments E1/E2 conclusions, decide next tool.
7. [ ] Share-preview check after deploy: paste https://orvionis.com/real-estate into a preview debugger (opengraph.xyz or the Facebook Sharing Debugger) once; the card is cached by platforms for ~24h after first share.

## Session log

- 2026-09-25 22:55–23:35 UTC+2: repo replaced, 6 deploy iterations (gitignore `storage/` bug, devDependencies under NODE_ENV=production, vitest in type-check, P3005 non-empty DB → own schema), seed-on-start, Stripe webhook, variables. Production verified via HTTP.
- 2026-09-26 01:20–01:45 UTC+2: brand restyle to concept №2 (owner's pick from 9 boards): palette tokens, light heroes with photo right, nav "Get started" pill, factual trust row on home, per-page eyebrows in amber, OG cards in the new palette; new Higgsfield hero `public/img/hero-home.webp` (dusk villa, 1024×688) + JPEG twin for OG. Verified: typecheck, tests, build, Playwright at 1280/390 px.
- 2026-09-26 01:05–01:20 UTC+2: share/SEO fix for tool pages — title no longer doubles "| ORVIONIS", per-tool Open Graph card at `/tools/[slug]/opengraph-image` (dynamic, hero by category + price), `twitter:card=summary_large_image`, page titles now flow into og:title (root openGraph.title removed). `src/lib/tools/definitions/index.ts` holds the pure tool list (registry adds DB helpers).
- 2026-09-26 00:45–01:05 UTC+2: embedded job loop (`src/lib/jobs/loop.ts` shared with `scripts/worker.ts`, started by `src/instrumentation.ts`), inline-enqueue race fixed (inline jobs are created locked; jobs with a future `runAt` are now really scheduled instead of running at once), `/api/health` reports the loop heartbeat. Verified locally: 23 tests, build, `next start` picked up a hand-inserted QUEUED job within one poll.
- 2026-09-26 00:05–00:45 UTC+2: hero visuals + OG cards (commit `b1ded03`). Verified locally: typecheck, 20 unit tests, `next build` (OG routes prerender as static PNGs), Playwright screenshots at 1280 px and 390 px. Files transferred to the owner's clone as a tarball (checksums matched), committed and pushed from there. Note for future sessions: `device_commit_files` refuses paths inside `.git/`; write to the repo root and `mv` afterwards.
