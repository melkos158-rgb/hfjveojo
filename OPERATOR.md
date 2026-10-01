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
| Start command | `npm run start:railway` = `prisma migrate deploy && tsx prisma/seed.ts && NEXT_MANUAL_SIG_HANDLE=true exec next start` (exec so SIGTERM reaches Next; the app hands running jobs back to the queue and exits 0) |
| Deploy status without the dashboard | Railway posts commit statuses to GitHub: `GET https://api.github.com/repos/melkos158-rgb/hfjveojo/commits/<sha>/status` → context `courageous-flow - hfjveojo` = production (`Success - orvionis.com`). Works from the Cowork VM (`device_bash` + curl); orvionis.com itself is not reachable from the VM or the sandbox — production pages are verified in the owner's Chrome |
| Worker | no separate service — `JOBS_INLINE=true` (fulfilment runs right after the webhook response via `after()`) + embedded job loop in the web process (`EMBEDDED_WORKER`, default on; `src/instrumentation.ts`) for retries, hourly maintenance and the 06:10 UTC CEO report. `/api/health` → `worker.lastTickAt` is the heartbeat |
| Stripe | Live account `acct_1UIuDZGsFrMfnr38` (dashboard name "jarvis"): live key currently in `STRIPE_SECRET_KEY` (owner, 2026-09-26), destination `we_1UJyViGsFrMfnr38ljrQ8d6L` → `https://orvionis.com/api/stripe/webhook`, 7 events, `STRIPE_LIVE_WEBHOOK_SECRET` set, probe verified 16:42 UTC; `STRIPE_MODE` picks the checkout mode (owner sets `live`). Sandbox "orvionis sandbox" (`acct_1UIuDh2cM37Fu7zW`): destination `we_1UJgdu2cM37Fu7zWW3FeZqvh` + `STRIPE_WEBHOOK_SECRET`; its key is not in Railway right now. Procedure `docs/STRIPE_LIVE.md` |
| Email | Resend, domain `orvionis.com` verified 2026-09-26 (`EMAIL_PROVIDER=resend`); sign-in, confirmation and delivery emails delivered in production |
| AI | `AI_PROVIDER=openai` with `OPENAI_API_KEY` in Railway (smoke test OK); image edits on `gpt-image-2`; caps `AI_DAILY_BUDGET_CENTS` (daily) and `AI_MAX_COST_PER_ORDER_CENTS` (per order **unit**, e.g. per staged photo) |
| Admin | `ADMIN_EMAILS=melkos158@gmail.com`; magic link by email or Google sign-in |
| Brand mark | Official ORVIONIS mark supplied by the owner 2026-09-26 — master `public/brand/orvionis-logo-original.png`, all derivatives via `scripts/brand_assets.py`, usage rules `docs/BRAND.md`; Stripe live Icon + Logo set in the Dashboard |
| Brand style | Owner's spec (2026-09-26, supersedes the earlier light concept): **dark premium SaaS** — canvas `#08090D`, cards `#11131A`, text `#F5F5F7`/`#A1A1AA`, primary accent `#8B5CF6` (+ `#D946EF` gradient on primary CTAs only), success `#22C55E`; 80–90 % neutral, 10–20 % accent. Tokens + inverted gray scale in `src/app/globals.css`. Site sells the *finished result*, not "AI": every card shows input → output → time → price → CTA |

## Status (update every session)

> Current state lives in `docs/AUTONOMOUS_PROGRESS.md` (read first). This file keeps infrastructure facts, owner actions and the detailed session log.

- 2026-09-25 — Ride Lab replaced by ORVIONIS on the same repo/service/domain. Production ACTIVE at https://orvionis.com (home, /tools, tool pages, legal pages, /api/health). Migrations applied in schema `orvionis`; seed runs on every start. Stripe test webhook created. Variables set (secrets generated per environment, not stored here).
- 2026-09-26 03:40 UTC+2 — Deploy `cc0d956` (Listing Description) ACTIVE on Railway; deploy log: `tools synced: 3, products: 3`, experiments e1/e2/e3, worker started; `/api/health` ok with a fresh worker id. Every container swap so far ended with `npm error signal SIGTERM` in the logs because the signal never reached Next (sh in between) — fixed in the next commit (graceful shutdown, jobs handed back to the queue).
- 2026-09-26 15:20 UTC+2 — Deploy `2f1d6f2` ACTIVE: 4 tools live incl. Virtual Staging on gpt-image-2 (test order #6 clean); migration `20260926030000_output_type_image` applied; `/api/health` ok.
- 2026-09-27 05:05 UTC — `5c2b514` ACTIVE, `/api/health` ok. Google Ads E8 found paused (never served); owner asked to enable it.
- 2026-09-26 — Brand visuals live: Higgsfield-generated heroes (`public/img/hero-*.webp`, JPEG twins for OG) on /real-estate, /photographers and the home "Who is this for?" cards; static Open Graph cards for /, /real-estate, /photographers (`src/lib/og.tsx`, rendered at build time). Vertical pages now have a primary CTA to the tool page and a `#tools` anchor.

## Owner away 2026-09-27 → ~2026-10-01 (autonomous mode)

- **Schedule:** check-ins ran into this Cowork session every ~6 h from 26 Sep 23:03 to 1 Oct 17:03 UTC. The E8 final evaluation runs 2 Oct 05:03 UTC (moved from 7 Oct on 1 Oct 00:36). **From 2 Oct the operator is the project manager** (owner's yes on 1 Oct): three check-ins a day, ≈ 08:52 / 14:52 / 20:52 Warsaw, as one-off tasks that the evening run keeps scheduling two days ahead — the routine is in `docs/AUTONOMOUS_PROGRESS.md` → "MANAGER CHECK-INS". The old "AI operator loop" (fresh sessions every 2 h, failing since 25 Sep) is disabled. Find them with `list_triggers`.
- **The owner's PC must stay on** with the Claude desktop app and Chrome running. Without it there is no Chrome (Ads / Fiverr / Railway / admin) and no git push; the cloud can't reach orvionis.com or GitHub.
- **Fiverr (owner's choice): the gig stays active.** A real order goes like this:
  1. verify it in Manage Orders;
  2. produce the files via `/admin/orders/new`;
  3. look at every image;
  4. get the owner's yes by message + push;
  5. only then deliver or reply on Fiverr.

  Fiverr is checked only at the 11:03 UTC run (bot checks).
- **Reporting (owner's choice):** one short Ukrainian daily summary at the 17:03 UTC run. Otherwise message only when his decision is needed; a push only for real orders or incidents.
- **Blocked for the operator** (safety check or human-only):
  - edits to the live Google Ads campaign;
  - Railway variables;
  - Fiverr bot checks;
  - messages or deliveries to buyers without approval.

## Owner actions needed (cannot be done by the operator)

**New, 2026-09-27 — Search Console (biggest SEO lever; details in `docs/SEO_AUDIT.md`).** The Domain property
`sc-domain:orvionis.com` exists and the operator can read it. Google has not indexed `/tools/virtual-staging` or any guide,
still lists 16 old Ride Lab pages for this domain, and shows an old home-page title. The sitemap was last read on 26 Sep
with 13 URLs (it now has 21). **Done by the operator on 2026-09-27 with the owner's yes** ("do everything needed, don't ask; Ride Lab is old junk"):
sitemap resubmitted, indexing requested for 8 URLs (home, flagship, 4 guides, /guides, /photographers), Ride Lab
prefixes `/pl/` and `/en/` sent to Removals. Receipts in `docs/SEO_AUDIT.md` → Status.
Still the owner's (account sign-in is not something the operator does):
- **Bing Webmaster Tools:** https://www.bing.com/webmasters → Sign in (Google account) → "Import from Google Search
  Console" → pick orvionis.com. It takes the site and sitemap; Bing also feeds ChatGPT search, Copilot and DuckDuckGo.

**Current, 2026-09-26 22:00 UTC+2. Do these first; the older numbered items below are history.**
- **Google Ads, live campaign `E8 Virtual Staging - Search - US` (id 24292280138).** The auto-mode safety check blocks the operator from editing a live campaign ("real-world transactions"). The owner does these:
  - (a) ~~add the campaign-level negative keywords (list in `docs/GOOGLE_ADS_EXPERIMENT.md`)~~ done 30 Sep ≈ 22:05 UTC (23 terms, verified); 7 more proposed on 30 Sep at 22:55 UTC;
  - (b) Recommendations → Auto-apply → untick everything;
  - (c) optional: campaign Settings → Campaign URL options → Final URL suffix (value in the doc);
  - (d) before the first paid ad order is uploaded: create the conversion action "ORVIONIS paid order" (Import → clicks).
- **Fiverr:** only *Manage Orders* proves an order exists (owner rule, `docs/FIVERR_EXPERIMENT.md`). Fiverr's "It needs a human touch" check is solved by the owner only.
- **90-day reinvestment policy:** no withdrawals on days 1–90 (Day 1 = 2026-09-26). Every material spend follows `docs/BUSINESS_METRICS.md` → Spend register.


0. **Stripe key is from the Ride Lab sandbox** — replace `STRIPE_SECRET_KEY` in Railway with the secret key of sandbox "orvionis sandbox" (`acct_1UIuDh2cM37Fu7zW`, https://dashboard.stripe.com/acct_1UIuDh2cM37Fu7zW/test/apikeys), then Deploy; `/admin/system` → Stripe card must show that account id and "webhook … enabled · all 7 events". (Earlier note, now explained:) **Stripe shows "Pay Ride Lab" on the checkout page** (verified 2026-09-26 by creating a test-mode checkout session). Stripe Dashboard → Settings → Business → Public details: business name `ORVIONIS`, support email `hello@orvionis.com`, website `https://orvionis.com`; Settings → Branding: icon/logo, brand color `#8B5CF6`, background `#08090D`. Do it in the sandbox now and again on the live account when it is activated.
1. Add `OPENAI_API_KEY` in Railway → hfjveojo → Variables (then click Deploy). Until then: Photographer Pricing Guide orders fail after retries; Listing Clips orders still arrive (concierge) but without the AI clip plan.
2. Resend: create account, verify domain `orvionis.com` (SPF/DKIM), add `RESEND_API_KEY` and set `EMAIL_PROVIDER=resend`. Until then customers get no ORVIONIS emails — but in live mode Stripe's own receipt (now always sent, with the private order link in its description) covers the essentials.
3. Stripe live mode: activate the account, add the live `STRIPE_SECRET_KEY`, create the live webhook endpoint (same URL/events) and set its `STRIPE_WEBHOOK_SECRET`.
4. Legal placeholders in `src/config/site.ts` (entity, address, governing law) — see `docs/LEGAL_FLAGS.md`.
6. Railway project `satisfied-empathy` (duplicate of this repo, no variables, failed every push): auto-deploy **disabled by the operator on 2026-09-26** (Service → Settings → Source). Delete the project when convenient (Railway → satisfied-empathy → Settings → Danger) — deletion is left to you.
7. Resend: domain `orvionis.com` **verified** (2026-09-26 03:40 UTC+2, DNS by the operator); production emails delivered. Nothing to do.
8. Google sign-in: keys are in Railway (done). Remaining: Google Cloud → OAuth consent screen → **Publish** (while "Testing", only listed test users can sign in) and confirm the redirect URI `https://orvionis.com/api/auth/google/callback`.
5. Outreach: docs/OUTREACH.md — 15 DMs/day to agents, 10/day to photographers; log hours in /admin/experiments.

## Operator TODO (priority order)

1. [ ] Verify end-to-end test purchase on production (Stripe test card 4242…) once OPENAI_API_KEY is set: order → webhook → fulfilment → delivery email in logs → /admin/orders.
2. [x] Background jobs without a worker service — done 2026-09-26 via the embedded loop (owner asked for no new Railway services). A dedicated worker is only needed for throughput; if added, set `EMBEDDED_WORKER=false` on web.
3. [x] Hero/OG visuals for /real-estate and /photographers (Higgsfield images, `public/img/`), `opengraph-image` routes — done 2026-09-26. To regenerate: Higgsfield `generate_image_batch` (gpt_image_2_5, 16:9) → resize 1200px WebP q60 + 900px JPEG for the OG renderer (WebP is not decoded by it).
4. [ ] Clean legacy Ride Lab variables on Railway (`ADMIN_PATH`, `SITE_URL`, `ADMIN_RESET`) — harmless, low priority.
5. [x] GitHub Actions: CI green on `main` (runs #1–#9 checked 2026-09-26).
6. [ ] After first paid orders: review /admin/analytics, update experiments E1/E2/E3 conclusions, decide next tool (tool requests in /admin/feedback are the vote).
8. [ ] Browser extension (thin client, no secrets) — only when a tool benefits from in-page capture (e.g. listing description from an MLS page); no demand signal yet.
7. [ ] Share-preview check after deploy: paste https://orvionis.com/real-estate into a preview debugger (opengraph.xyz or the Facebook Sharing Debugger) once; the card is cached by platforms for ~24h after first share.

## Owner email updates (since 2026-09-29)

The owner asked to get updates by ORVIONIS email. To send one:
1. Append an entry to `src/content/owner-updates.ts`: a new unique id (`YYYY-MM-DD-slug`), a subject and a plain-text body in Ukrainian.
2. The repo is public, so keep it to business status, as in docs/. No personal data, contact details, secrets or order details; a test enforces the obvious cases.
3. Commit it with the check-in transfer. After the deploy, the job loop emails it once to ADMIN_EMAILS from hello@orvionis.com.
4. Confirm on `/admin/system` → "Owner email updates" ("N of N sent").

The 17:03 daily summary goes both to the chat (SendUserMessage) and as an owner update. Decisions he must make also get an update, plus a push. Replies to these emails go to hello@orvionis.com, which the operator cannot read, so he answers in the Claude chat.

## Session log

- 2026-09-30 23:05–23:55 UTC (owner: "what's next — say it or do it, keep moving"):
  - Shipped s58 (`9bc0211`): short link `orvionis.com/tt` → the staging page tagged `tiktok` (TikTok has no clickable bio link below 1,000 followers). CI and Railway green; verified in production.
  - Built the sale fixes from the growth plan in a separate working copy, to ship after E8 ends (1 Oct 21:00 UTC): E14 first screen, free first photo by confirmed email, volume pricing (up to 10 rooms, $12 from 5, $99 for 10), one-line cookie notice on phones. 164 tests; checked in a local production build at 390/1366 px. Backups: `/mnt/user-data/outputs/release-e14.tgz` and `.git/xfer/pending/` on the owner's PC. A one-off reminder into this session fires at 1 Oct 21:05 UTC (trig_018H39KpjvujXquBjaw94irq).
  - Follow-up marketing emails are not built: CAN-SPAM needs a business postal address in each one, and there is none yet (owner decision later).
  - Google Ads: the 7 extra negatives were typed for the owner to save; the save is unconfirmed (see GOOGLE_ADS_EXPERIMENT LOG). At 23:50 the Chrome extension disconnected; the device bridge still works.
  - The 23:03 check-in's items were covered by the 22:44–23:05 work (health, analytics, Ads day 2, socials, docs shipped as s57).

- 2026-09-30 17:20–23:05 UTC (owner online, phone and PC):
  - Growth plan to 25 Dec written as a Claude Doc at his request ("be the general manager"), and copied into his Obsidian vault for ChatGPT/Codex. Higgsfield advice: don't buy now; 14-day free test first (E15 rule).
  - Three 13–15 s videos made from real assets only (`make_videos.py`), plus a logo avatar and a YouTube banner. The owner opened TikTok, YouTube and Instagram in the session. The operator typed profiles and uploads; the owner pressed every final Confirm, Publish and Save (the safety check blocks those clicks for the operator).
  - Google Ads: at his request the operator typed the 23 negatives into E8's add panel, and he saved them (≈ 22:05 UTC). Verified at 22:55: 23 listed. Day 2: 9 clicks, €10.50; total €22.19, 0 checkouts. 7 more negatives proposed from the search terms (rearrange-my-room homeowners); they wait for his «впиши».
  - Facebook correction: at 22:20 all three day-2 posts turned out to be awaiting admin review, not live. 2 of 6 posts are live. The docs and his chat were corrected; the 17:13 daily email said otherwise, so tomorrow's summary carries a one-line correction.
  - Socials at 22:55: TikTok `video-v1` 251 views, YouTube Short 8, Instagram (@orvionis_) 1 Reel; site `youtube` 3 page views. His Instagram link arrives as `ig`.
  - Health ok (22:49); analytics 565 / 91; 0 paid.

- 2026-09-30 13:03–17:20 UTC (owner online from his phone, then the 17:03 check-in):
  - 13:05, the owner asked about the business and TikTok. Health ok; analytics 544 / 74, 0 paid. Facebook: SoCal 2 likes, the reply still typed; NorCal 0; All Realtors pending; the three day-2 posts still in their composers. TikTok: no account connected, no video; offered to generate it in Higgsfield.
  - 16:55 and 17:03: ads.google.com opens again (read-only): eligible, end date 1 Oct, 0 negatives; 30 Sep numbers not readable before midnight GMT+3. Analytics 554 / 82, `google` 25, `fb_group` 13, 0 paid. Facebook: the reply was published ≈ 13:00 and the three day-2 posts ≈ 14:00 (2 live with 0 reactions, 1 awaiting review).
  - Shipped as s56: these docs and the owner update "2026-09-30-daily".

- 2026-09-30 12:32–12:50 UTC (the owner asked "how is it going"; computer back online):
  - Analytics: 544 / 74; `google` 22 ad page views; funnel 3 → 7 → 0; 0 paid.
  - Fiverr Manage Orders: 0 in every status.
  - Facebook: SoCal post has 2 likes and 1 comment; NorCal has 0; All Realtors is still pending.
  - Google Ads: the extension now denies ads.google.com (page text and screenshots), so it was not read.
  - The docs from 05:03 and 11:03 shipped as s55.

- 2026-09-30 11:04–11:20 UTC (scheduled check-in, Fiverr day): the owner's computer was still off (no extension, no bridge).
  - The site answered through WebFetch: `/tools/virtual-staging` up, H1 and $15 price.
  - Google Ads, Fiverr, Facebook and `/admin` were not readable, and nothing could be committed.
  - A chat message went out: leave the computer on with sleep disabled; plus the three day-2 group texts to copy, or the offer to type them in once he is at the computer.

- 2026-09-30 05:04–05:40 UTC (scheduled check-in): **the owner's computer was asleep.** The Chrome extension and the device bridge were not connected (retried once).
  - The homepage answered through WebFetch; `/api/health` is disallowed there by our own robots.txt.
  - Admin, Google Ads and Facebook were not readable, and nothing could be committed. The docs wait in the cloud clone for the next transfer.
  - Done meanwhile:
    - day-2 texts for the three remaining Facebook groups (`docs/OUTREACH.md`);
    - a review of the ad landing page from a local production build: E14, to run after E8 ends.

- 2026-09-29 23:04–23:35 UTC (scheduled check-in):
  - Production healthy on `91e2a77`.
  - Analytics: 540 / 70, 0 paid.
  - **Google Ads day 1: 8 clicks, €11.69, 0 checkouts.** A "free home staging software" click shows the negatives are missing.
  - Facebook: SoCal post has 1 comment (reply drafted), Northern California has 0, All Realtors is still pending.
  - Owner update #2 (negatives, numbers, the comment) committed for email. A chat message was left too, with no push at night.

- 2026-09-29 ≈ 19:25 UTC: the owner offered a Telegram chat with his second number as the channel for questions. **Not used.** Sending from his account needs his OK for each message, operating Telegram needs his computer awake, and it would expose his private chats. The channel stays SendUserMessage plus push; he was asked to allow notifications for the Claude app. His screenshot showed his ID document, so he was advised not to share such screenshots. No number or document detail is recorded anywhere.

- 2026-09-29 17:04–17:40 UTC (scheduled check-in, daily summary):
  - Production healthy; `422cb5c` confirmed (Railway success, CI green).
  - Analytics: 514 / 49, with the **first ad traffic**: channel `google` 3 page views in 2 sessions. 0 paid; funnel unchanged.
  - Google Ads: eligible and serving, end date still 1 Oct. Google's own numbers were not readable (the date picker ignores clicks in the hidden window).
  - IndexNow accepted the 3 calculator URLs at 16:00. Search Console: indexing requested for the staging cost calculator; the which-rooms guide is now indexed.
  - Still waiting on the owner: the end date, the yes/no on the "AI operator loop" task, and the outreach channel.

- 2026-09-29 11:45–15:30 UTC (owner online):
  - Google Ads read-only: the owner **enabled E8** and it is eligible. The end date is still 1 Oct; he was asked again to move it to 6 Oct.
  - At his request the operator reviewed the Search Console queries and built the free virtual staging cost calculator (s51).

- 2026-09-29 11:22–11:40 UTC (scheduled check-in, Fiverr day):
  - Production healthy.
  - Analytics: 511 / 47 visits, 0 paid.
  - Fiverr: Manage Orders 0; the seller dashboard is now behind Fiverr's human check too, so from now on Manage Orders only.
  - **Google Ads: advertiser verification passed.** The owner was asked by chat + push to move the end date to 6 Oct, enable E8 and turn auto-apply off.
  - The E8 evaluation task moved to 7 Oct 05:03 UTC.

- 2026-09-29 05:04–05:25 UTC (scheduled check-in):
  - Production healthy.
  - Analytics: 509 / 46 visits, `www.google.com` 25 (+5 overnight); 0 paid.
  - IndexNow accepted 3 URLs at 01:00.
  - Search Console, 24 h: 23 impressions, 1 click; staging-price queries are appearing. Indexing requested for the sixth guide.
  - Google Ads: verification under review, campaign paused, €0.
  - The owner's Chrome disconnected during the Ads campaign-table read; nothing else was affected.
  - s48 (`e3e7de9`) was verified at 00:07.

- 2026-09-28 23:04 – 29 Sep 00:20 UTC (scheduled check-in):
  - Production healthy.
  - Analytics: 504 / 41 visits, +1 first-touch visit from `www.google.com` (20 in total); 0 paid.
  - Google Ads: E8 paused/restricted, €0, verification under review.
  - Fiverr: not checked (11:03 only).
  - Built the sixth guide (photography pricing guide checklist) and linked it and the calculator from the $29 tool page. s48, pushed after 00:00 UTC so the 29 Sep dates are not in the future.
  - Still waiting on the owner's yes/no for turning off the failing "AI operator loop" task.

- 2026-09-28 17:03–17:30 UTC (scheduled check-in + daily summary):
  - Production healthy: `/api/health` ok, 0 jobs queued / running / failed, worker ticking.
  - Analytics unchanged: 502 / 40 visits, 0 paid, AI $0.38.
  - IndexNow: HTTP 200 for **1 URL** at 14:00 (the calculator page), so the single-page lastmod works.
  - Google Ads: E8 0 impressions, €0; verification documents under review.
  - Scheduled task "AI operator loop" (`trig_01KoEtNKBvEzGvaoWeHTPPGS`, every 2 h, push + email to the owner): its last run failed at 16:42. The owner is asked whether to turn it off.
  - s47: docs only.

- 2026-09-28 13:45–14:05 UTC (owner online): at his explicit request ("зроби будь ласка") the operator set the organization answers to his own name and "No" (Submit, verified). The owner then submitted his Ukrainian ID card and the profile address himself. Verification is under review, 3–5 business days.

- 2026-09-28 11:40–13:40 UTC (owner online, between check-ins):
  - Google Ads verification help, read-only. The owner corrected the EU political-ads answer himself.
  - Found that the country "Україна" in the verification forms is the payments profile country, which cannot be edited.
  - Google's Ukraine document rules require a Ukrainian ID matching the profile. Advised: international passport, the profile address as stored, and the "manages accounts for other organizations" answer changed to No.
  - Details in `docs/GOOGLE_ADS_EXPERIMENT.md`. The operator clicked and submitted nothing.
  - Search Console first organic signal recorded. The calculator page was rebuilt for its query family (E10, s46).

- 2026-09-28 11:18–11:35 UTC (scheduled check-in):
  - Production healthy.
  - Analytics: 502 / 40 visits, including +1 organic Google first touch; 0 paid.
  - IndexNow incremental run accepted: HTTP 200 for 3 URLs.
  - Google Ads unchanged: restricted; the political-ads answer is still "yes".
  - Fiverr: Manage Orders 0. The inbox was gated by the human check again, so from now on the second page is the seller dashboard.
  - Admin IndexNow card copy made accurate for incremental submissions.

- 2026-09-28 05:03–05:50 UTC (scheduled check-in):
  - Production healthy. Analytics unchanged: 499 / 38 visits, 0 paid, nothing in review or failed.
  - Google Ads unchanged: restricted; the EU political-ads answer is still "yes".
  - Bing `site:` unchanged at about 24 results, too early after IndexNow.
  - Built the fifth guide (which rooms to stage, from the NAR 2025 data), per-guide sitemap dates and incremental IndexNow.

- 2026-09-27 23:03–23:20 UTC (scheduled check-in):
  - Production healthy: worker continuous since the 17:11 deploy.
  - Analytics: 499 / 38 visits (+1 direct), 0 paid, nothing in review or failed.
  - Google Ads unchanged: restricted, and the EU political-ads answer is still "yes".
  - Useful work: the uptime workflow now retries HTTP errors and prints only the status and the first 400 bytes (after the 07:04 probe whose log was truncated).

- 2026-09-27 12:10–17:20 UTC (owner briefly online, then the 17:03 check-in):
  - The owner tried Resume in Google Ads and got `CAMPAIGN_ERROR_CANNOT_ACTIVATE_RESTRICTED_CAMPAIGN` ("Restricted Campaigns can only be activated by RFA systems"), so the restriction is on Google's side. He opened the advertiser-verification page.
  - At 17:05 the page shows his EU political-ads answer as "yes, we plan to show them", which is wrong for ORVIONIS. Correcting it is his step (a declaration in his name); asked in the daily summary.
  - IndexNow: HTTP 202 for 37 URLs at 12:00 UTC. Production healthy; analytics unchanged.
  - Daily summary sent (Ukrainian).

- 2026-09-27 11:03–11:30 UTC (scheduled check-in, owner away):
  - Production healthy (`/api/health` ok, 0 failed jobs); `/admin/analytics` unchanged: 0 paid, 0 in review or failed,
    498 visits. Google Ads E8 still paused (no reply yet; reminder goes into the 17:03 summary).
  - Fiverr: Manage Orders 0 in every status. `/inbox` showed Fiverr's human check after a 35-second pause; it was left
    for the owner.
  - Built IndexNow (see `docs/SEO_AUDIT.md` A8). Bing baseline taken first: about 24 orvionis.com URLs, including Ride
    Lab pages; no flagship or guides on page 1.

- 2026-09-27 05:03–05:20 UTC (scheduled check-in, owner away):
  - Production healthy: `/api/health` ok, 0 failed jobs; `5c2b514` CI + Railway green. `/admin/analytics`: 0 paid,
    0 in review or failed, 30-day visits 498 (+6), no ad traffic.
  - **Google Ads E8 is paused and has never served** (status icon "Призупинено", ad "campaign paused", 0 impressions,
    €0, balance €30). Change history holds only the publish batch, so it was most likely created paused. The owner is asked
    to enable it and add the negatives (chat + push, 05:12). Details: `docs/GOOGLE_ADS_EXPERIMENT.md`.
  - The operator no longer opens order rows on `/admin/orders`: the safety check flagged it as personal-data handling. The
    aggregate counts on `/admin/analytics` cover the check-in.
  - Earlier (00:50–01:00 UTC): the video script was written for the owner as a Claude Doc (link in `docs/AUTONOMOUS_PROGRESS.md`,
    NEXT TASKS 7).

- 2026-09-26 23:10 – 2026-09-27 00:20 UTC (SEO audit with the SEO-AEO-GEO Ultimate plugin, installed at the owner's request):
  - The owner asked for the `claude-seo` skill (AgriciDaniel). It isn't in the Claude plugin catalog, and the operator does not
    run third-party install scripts, so the closest catalog plugins were offered; the owner installed SEO-AEO-GEO Ultimate,
    SearchFit SEO and Claude SEO and GEO Site Audit.
  - Shipped `a929437`: own site never counted as an acquisition channel (verified in production: the "orvionis.com 465" row is
    now "direct").
  - Audit findings, evidence and the decision record: `docs/SEO_AUDIT.md`. Biggest: Google indexes 16 Ride Lab pages and none
    of the guides or the flagship → owner actions above (Search Console). Code shipped: metadata always in `<head>`, www → apex,
    WebSite markup, current titles/descriptions, flagship in the nav, cost guide cross-links, `/llms.txt`.

- 2026-09-26 22:30–22:55 UTC+2 (privacy audit):
  - `/privacy` now describes production exactly. Audit table and checklist are in `docs/LEGAL_FLAGS.md`.
  - Code: keyed IP hashes everywhere (`hashIp`) with a one-week legacy cleanup (`dropLegacyIpData`), referrer origin only, Secure cookies, cookie notice copy, `gaOnce` guard.
  - Owner must supply: legal identity, VAT/NIP, governing law, transfer safeguards, and the consent decision for `orv_sid` / `orv_attr`.
- 2026-09-26 21:25–22:25 UTC+2 (Google Ads launch, Fiverr live, security):
  - **Google Ads E8 published** (campaign id 24292280138, in Google review). Search only, US presence, English, 15 exact/phrase keywords, 1 RSA (15 headlines / 4 descriptions, ad strength "Good"), Maximize clicks capped at €1.50, AI Max and text/URL automation off, **campaign total budget €30 for 26 Sep – 1 Oct**. Every setting was verified on the review page after a full reload.
    - Google asked the owner to verify identity at the Budget step; the owner did it.
    - The review summary can be stale after a failed save; only a reload shows the server state.
    - Ad-level and campaign-level "Final URL suffix" did not persist in the draft, even with real typing, so the suffix is an owner item. Attribution still works through the gclid.
    - After publishing, the auto-mode check blocked edits to the live campaign; negatives and auto-apply went to the owner.
  - **Fiverr gig Active** (0 impressions so far). Within an hour, 3 phishing "order placed, confirm at <link>" messages arrived from Sept-2026 accounts. Manage Orders showed 0 in every status.
    - primemaple299 and w0ng_v_175: reported and blocked (reason "communicate outside of Fiverr").
    - jake_ilj_03906: shows no messages in the thread; left unreported and unverified.
    - Fiverr's bot check hit `/inbox` once and the owner passed it. Keep Fiverr navigation slow and minimal.
  - **Deploy `96c843f` verified in production:** the "Google Ads conversions" card is on `/admin/analytics`.
  - **Owner policies recorded:** the 90-day reinvestment policy, and Fiverr order verification (`docs/DECISIONS.md`, `docs/BUSINESS_METRICS.md`).
- 2026-09-26 19:00–19:25 UTC+2: official brand mark rolled out (Stripe branding via the Dashboard upload fields — `file_upload` works with files in the session's outputs folder, not with paths in the connected repo; site, icons, manifest, OG, emails; `e72a409`). The Stripe Dashboard tab in the owner's hidden window freezes often; the reliable check is `/admin/system` (reads branding through the API).
- 2026-09-26 18:25–18:45 UTC+2: Stripe live, operator side — webhook URL verified for the owner, live destination created from `/admin/system`, owner's staged Railway variable deployed, live probe verified; checkout-down message fix `bbb6746`. Railway stages variable edits ("Apply N changes") until someone presses Deploy — a saved variable is not live before that. The safety classifier blocks the operator from adding production variables itself (`STRIPE_MODE`) — owner action.
- 2026-09-26 17:50–18:20 UTC+2: **multi-room Virtual Staging** (up to 6 photos, $15 each; `rooms` field, `ToolDefinition.quantity/photoInputs`, `pricing.unit`, `landing.ctaLabelMany`, `Order.quantity`) and **run leases** (`src/lib/orders/runs.ts`: 30 s heartbeat, takeover after 2 min of silence, shutdown hands the order back, conditional claim, abandoned runs drop results) after finding that a deploy mid-fulfilment stranded the order in PROCESSING. `faa9882` deployed; production pages checked in Chrome. Note: the owner's hidden Chrome window also freezes `file_upload` (page never reaches document_idle) — upload flows are verified locally with Playwright against a production build. orvionis.com is blocked from both the sandbox and the Cowork VM proxies; GitHub API works from the VM only.
- 2026-09-26 17:40–17:50 UTC+2: photo-tips guide for staging inputs; `landing.guides` links on tool pages.
- 2026-09-26 17:30–17:40 UTC+2: `/guides/ab-723-virtual-staging` (checklist + sources, JSON-LD, sitemap, footer link). US spelling for customer-facing copy.
- 2026-09-26 17:25 UTC+2: deploy of `1a665ae` failed on Railway (`@types/qrcode` in devDependencies — Railway installs production deps only; the previous deployment kept serving). **Rule: anything `next build` needs (types, typescript, tailwind, prisma) goes in `dependencies`; before pushing a dependency change, run a production-only install + `next build` in a copy of the repo** (`npm ci --omit=dev` then `npx next build`).
- 2026-09-26 17:10–17:25 UTC+2: **disclosure pack** (AB 723 / MLS) for Virtual Staging: labelled copies, public original-photo page `/original/<token>` + QR, disclosure line; `Order.publicToken`; California DM variant. Also: `/api/admin/request-info` showed Railway replaces client-sent `X-Forwarded-For` — IP limits are sound.
- 2026-09-26 16:58–17:10 UTC+2: **real Stripe fees in the KPIs** (`src/lib/stripe/fees.ts`: fee from the balance transaction, converted from the settlement currency with Stripe's exchange rate; maintenance back-fills unsettled ones) + gross/net revenue, revenue after AI, profit estimate and a per-tool funnel on `/admin/analytics` and in the CEO email.
- 2026-09-26 16:50–16:58 UTC+2: **GA4** integrated (needs only `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Railway; production only). Verified locally with `APP_ENV=production` + a dummy id: consent defaults, sanitised `page_location` (order token never in dataLayer), `view_item`, `tool_started`, `purchase` + `tool_completed` once per order, `file_download`, 404 page view. Found on the way: the first-party `/api/events` allow-list silently dropped `preview_requested`/`preview_shown` — fixed. Stripe live: production on `7a835e6` shows the live column empty (no `STRIPE_LIVE_SECRET_KEY` yet); live account `acct_1UIuDZGsFrMfnr38` has no destination yet.
- 2026-09-26 16:35–16:50 UTC+2: **Stripe live — code side** after the owner submitted live onboarding. Checked production first: still the sandbox key (`acct_1UIuDh2cM37Fu7zW`, webhook OK), so nothing was broken. Railway shows 34 service variables; no live Stripe variable visible in the rendered part of the list (values never read). Built dual mode (sandbox pair untouched + `STRIPE_LIVE_*` + `STRIPE_MODE`), livemode guard on every event, atomic paid transition, async/abandoned handling, per-mode refunds, admin live/sandbox columns with destination-create and no-charge probe, admin sandbox checkout on the live site. Procedure: `docs/STRIPE_LIVE.md`.
- 2026-09-26 16:10–16:35 UTC+2: **free staging preview** (`src/lib/tools/preview.ts`, `POST /api/tools/[slug]/preview`, `ToolDefinition.preview`): one watermarked 1024 px version of the visitor's own photo, nothing stored; caps `FREE_PREVIEWS_PER_DAY`=15, `FREE_PREVIEWS_PER_IP`=2, stop at 40 % of `AI_DAILY_BUDGET_CENTS`; AI calls logged as purpose `preview` (that is what the cap counts). Watermark = `public/brand/preview-watermark.png` (tiled) + `preview-banner.png`, rendered with PIL/DejaVu Sans so the server needs no fonts. To switch previews off: Railway variable `FREE_PREVIEWS_PER_DAY=0`. Staging DM updated to offer the preview.
- 2026-09-26 15:45–16:10 UTC+2: checked order #6 on the customer page → "After · version 1" showed the `-v2` file (outputs listed newest first) and a re-run/redo would have shown and emailed old and new files together; the promised "one redo" had no button for delivered orders. Built: `GeneratedOutput.deliveredAt` (migration `20260926150000_output_delivered_at`, backfilled), `src/lib/orders/deliverables.ts` (what a delivery sends / what the page shows), **Free redo** card on delivered orders (`redoOrder`, audit `redo_order`, "Your redo is ready" email, concierge → REVIEW, customer keeps the last delivery meanwhile), admin note now reaches AUTO customers, escaped email HTML. Runbook section "Customer asks for a redo". Verified locally: 49 tests, build, screenshots of the redo-in-progress page and the admin card.
- 2026-09-26 15:25–15:45 UTC+2: Virtual Staging sample is now the **real output of test order #6** (one of its two versions, unedited). orvionis.com is unreachable from the operator sandbox, so the signed file URL from /admin was rendered in the Higgsfield sandbox, composited (before | after, 1420×480 WebP) and moved over in base64 chunks checked by md5 → `public/img/sample-virtual-staging.webp`; the OG card was rebuilt from the same pixels (`public/img/sample-virtual-staging-og.jpg`, 540×630 JPEG). Tool page + home card copy: "real pipeline output, unedited".
- 2026-09-26 14:50–15:25 UTC+2: **Virtual Staging live** ($15, `/tools/virtual-staging`). Transfer to the owner's clone verified by a full-tree checksum sweep (caught two files missing from the bundle before commit); note for future sessions: extract with `tar --overwrite` (plain `tar x` must unlink, which the mount forbids) and move stray `.git/*.lock` files into `.git/stale-locks/` after git commands (the mount forbids unlink; `maintenance.auto=false` + `gc.auto=0` set locally, status runs with `GIT_OPTIONAL_LOCKS=0`). `e0420f7` deployed (migration + seed in Railway logs). Production test #5 (gpt-image-1) worked but both versions swapped the recessed light for a chandelier and one added a built-in bookcase → `2f1d6f2`: freestanding-only prompt, `gpt-image-2` default (gpt-image-1 deprecated; ≈ $0.041 per 1536×1024 image; arbitrary sizes keep the photo's proportions), EXIF auto-rotate + 2048 px cap on input → test #6 clean (1536×1040, light/windows/walls/doors untouched, $0.11). Stripe→webhook delivery confirmed via the real `checkout.session.expired` events. Uptime run #1 had failed on the check's own Python f-string, production healthy → fixed and rescheduled off the hour.
- 2026-09-26 07:20–08:30 UTC+2: body-size guards (413) on all JSON/upload routes; outreach kit refreshed; free **photography pricing calculator** + `/free`; experiment KPIs (est. Stripe fees, net contribution, revenue/founder hour, repeat rate, free-tool uses); Resend domain **verified** and three production emails delivered (sign-in, order confirmation, delivery); `Order.isTest` + admin **full pipeline test** — run in production: Order #2 PAID → real OpenAI ($0.01) → QC PASSED → COMPLETED → emails. The whole result pipeline is proven; only Stripe's card step remains for the owner (test card in sandbox, then live).
- 2026-09-26 07:05–07:20 UTC+2: production `/admin/system` verified after the owner replaced the Stripe key: account `acct_1UIuDh…` "orvionis sandbox", webhook on that account enabled with all 7 events; **Test AI provider → OK** (gpt-4.1-mini, 1.6 s). Stripe refused `accounts.update` on our own account, so the "Apply branding" action was removed — the card now links to the Dashboard branding page. New persistent state file `docs/AUTONOMOUS_PROGRESS.md` (status, priority, done/blocked/next, production status, metrics, decisions) — read it first in any new session.
- 2026-09-26 06:45–07:05 UTC+2: **Stripe key/webhook mismatch found** via the new admin card: `STRIPE_SECRET_KEY` in Railway belongs to the old **Ride Lab** sandbox (`acct_1UEGNjGhArTra4ru`, hence "Pay Ride Lab"), while the webhook `orvionis-production` + `STRIPE_WEBHOOK_SECRET` live in the sandbox the owner renamed "orvionis sandbox" (`acct_1UIuDh2cM37Fu7zW`). Checkout would work, orders would never turn PAID. Owner asked to paste the orvionis-sandbox secret key into Railway (`STRIPE_SECRET_KEY`); after that everything is on one account. `/admin/system` now shows the account's dashboard name and checks that a webhook destination for `https://orvionis.com/api/stripe/webhook` exists **on the key's account** with all 7 events (test guards the list against the handler). Google sign-in verified end-to-end in production (signed into /admin with it).
- 2026-09-26 06:05–06:45 UTC+2: **infrastructure audit + DNS** (owner: "make the infra once"). Written: `docs/REQUIRED_SERVICES_AND_KEYS.md` (18-point audit of every service: configured / create-now / future) and `docs/ENVIRONMENT_VARIABLES.md` (canonical list by stage); `.env.example` now carries every name the code reads. Railway already has OPENAI_API_KEY, RESEND_API_KEY, GOOGLE_CLIENT_ID/SECRET (owner added them tonight). Done in the owner's browser with his permission: Resend → domain `orvionis.com` added (eu-west-1) and its records created at Namecheap (CNAME `rsend`, CNAME `send`, TXT `resend._domainkey` DKIM, TXT `_dmarc` p=none rua=dmarc@); Namecheap email forwarders `hello@` and `dmarc@` → owner's Gmail (there were none — replies would have bounced); Google Search Console domain property was already verified (TXT) → sitemap `https://orvionis.com/sitemap.xml` submitted (initial "couldn't fetch" is the usual placeholder; the file serves 13 URLs). Code: `verification` meta support (NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION / BING), sitemap `lastmod` is now a stable content date.
- 2026-09-26 05:35–06:05 UTC+2: **Sign in with Google** (`src/lib/auth/google.ts`, `/api/auth/google` → Google → `/api/auth/google/callback`; state = signed JWT bound to a nonce cookie, `next` sanitised, only verified Google emails, same `upsertUserByEmail` so ADMIN_EMAILS still decides roles). Shown on `/login` only when `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` are set. Redirect URI for Google Cloud: `https://orvionis.com/api/auth/google/callback`. Trigger: prod logs showed `/api/auth/request` → 500 because the owner switched `EMAIL_PROVIDER=resend` but Resend says "orvionis.com domain is not verified"; the route now answers 503 `email_unavailable` with a human message instead of a bare 500. Railway: auto-deploy on the stray project `satisfied-empathy` disabled (reversible) — no more failed builds per push.
- 2026-09-26 05:05–05:35 UTC+2: owner granted full autonomy on the computer ("сам зроби, даю дозвіл"). Stripe sandbox `acct_1UIuDh…` (owner renamed it "orvionis sandbox"): Checkout branding colours set in the dashboard (brand `#08090D`, accent `#8B5CF6`, saved + verified after reload). Business name/icon cannot be edited in a sandbox UI before activation → `/admin/system` now shows the Stripe account the key points at (id, live/test, business name, colours, icon, charges) and has **Apply ORVIONIS branding** (`src/lib/stripe/branding.ts`: uploads `public/brand/icon-512.png` as a business icon, sets name/support/URL/colours via the Accounts API with the key already in Railway; result stored in Setting `stripe.branding_last`). To be pressed on production after this deploy.
- 2026-09-26 04:50–05:05 UTC+2: **customer never loses the order** — Stripe Checkout now sets `payment_intent_data.receipt_email` + a description with the private order link (`ORVIONIS order #N — Tool. Your files: https://orvionis.com/orders/…?t=…`): in live mode Stripe emails that receipt itself, so buyers get a mail with their link even while `EMAIL_PROVIDER=console`. Parked orders (AI not configured → REVIEW) get `dueAt` pushed to +24 h and the order page says a person is finishing it, with contact/refund links. Verified d983ee2 in production (checker highlights 4 risks on the demo text); prod logs of the previous swap show `server.shutdown → worker.stopped → server.exit` (no npm error) and the hourly `jobs.maintenance` running.
- 2026-09-26 04:25–04:50 UTC+2: **free lead magnet** `/free/fair-housing-checker` — paste listing remarks, risky phrases highlighted with the protected class + a rewrite hint, style flags ("master bedroom"), live character count against 500/1,000/1,500/2,500 limits; runs in the browser (nothing sent), `free_tool_used` event, CTA to the $9 tool. The lexicon (`FAIR_HOUSING_RULES` in `src/lib/tools/qa.ts`) now carries basis + hint + severity and is the same gate the delivery pipeline uses (only "risk" blocks). Linked from the footer, the real-estate page ("Free" row via `CATEGORIES[].free`) and the sitemap; WebApplication + FAQ JSON-LD. Also: OPERATOR.md infra facts — Railway deploy status via GitHub commit statuses (no dashboard needed), stray Railway project `satisfied-empathy` flagged as owner action 6.
- 2026-09-26 03:55–04:25 UTC+2: **sample results** — every live tool page now has an "Example result" section (`#example`, `src/components/SampleResult.tsx`, data in `src/lib/tools/samples/*` via `landing.sample`): fictional input on the left, the finished deliverable on the right. Pricing guide: a real 5-page PDF rendered by the production renderer (`public/samples/photographer-pricing-guide-sample.pdf`, regenerate with `npx tsx scripts/render-samples.ts`) + page preview `public/img/sample-pricing-guide.webp`; Listing Description: full MLS copy (641/1,000 chars) + long version + captions + hashtags + email; Listing Clips: 5-clip plan + captions. Home "Before → after" links to each sample and gained a full-width Listing Description card. Fair-housing rules are now word-boundary regexes ("mature maples" and "Christiansen Ave" no longer send a $9 order to REVIEW; "mature adults" still does). Favicon + apple icon (`src/app/icon.tsx`, `apple-icon.tsx`, `public/favicon.ico`) — there was none. Tests: samples pass the delivery QA, hand-written `/tools/<slug>` links must exist (caught a wrong slug). 29 tests, build, Playwright 1280/390.
- 2026-09-26 03:30–03:55 UTC+2: graceful shutdown — `start:railway` now `exec`s `next start` with `NEXT_MANUAL_SIG_HANDLE=true`, so Railway's SIGTERM reaches the server; `src/lib/jobs/embedded.ts` stops polling, gives in-flight jobs a grace derived from `RAILWAY_DEPLOYMENT_DRAINING_SECONDS` (default 3 s → 1.5 s) and hands every job this process still holds back to the queue (`attempts` not charged), then exits 0. Lock ids are per process (`src/lib/jobs/identity.ts`: `inline:<host>-<pid>`, `web-<host>-<pid>`) so a replica never releases another's jobs, and the runner only writes a result while it still holds the lock (`jobs.lock_lost` otherwise). Proven in a real `npm run start:railway` process: SIGTERM → `server.shutdown` → 2 own jobs QUEUED, foreign job untouched → `server.exit`, npm exit 0. Tests: `tests/shutdown.test.ts` (27 total).
- 2026-09-25 22:55–23:35 UTC+2: repo replaced, 6 deploy iterations (gitignore `storage/` bug, devDependencies under NODE_ENV=production, vitest in type-check, P3005 non-empty DB → own schema), seed-on-start, Stripe webhook, variables. Production verified via HTTP.
- 2026-09-26 03:00–03:25 UTC+2: third tool **Listing Description** ($9, AUTO, `src/lib/tools/definitions/listing-description.ts`): facts → MLS description within the chosen limit + web version + 3 captions + hashtags + email blurb; rules + model QA for fair housing (flag ⇒ REVIEW); Markdown output with .md download shown open on the order page; experiment `e3-listing-description` seeded. Added by creating one file + one line in `definitions/index.ts` — no other code changed for the tool itself. Also: "Order again" on delivered orders/emails, copyable private order link, cookie banner off on admin/checkout.
- 2026-09-26 02:30–02:55 UTC+2: fulfilment safety net — a non-retryable AI error (no key) parks the paid order in REVIEW at once with an admin email (test `tests/fulfill-config.test.ts`); production checkout verified up to Stripe (order → session → checkout.stripe.com, $29, email prefilled; not paid — PENDING orders auto-close after 24 h); Stripe public name still "Ride Lab" → owner action 0. Tool pages: category photo in the hero + "You send / You get / Time" summary; sitemap skips inactive tools.
- 2026-09-26 01:50–02:30 UTC+2: owner sent the product/UI brief → dark premium SaaS palette applied site-wide (inverted gray scale keeps every component readable), home rebuilt in the required order (hero with the 5-step flow, before/after examples, tools, categories with "planned" items, how it works, pricing table, trust, FAQ + FAQ JSON-LD, final CTA); ToolDefinition gained `io` (input/output/processingTime/ctaLabel), `featured`, `active`; ToolCard shows Upload → Get → From $ → CTA; `/contact` has a tool-request form (`POST /api/requests`, rate-limited, honeypot) stored as Feedback(source=tool_request) + admin email. Verified: typecheck, tests, build, Playwright 1280/390.
- 2026-09-26 01:20–01:45 UTC+2: brand restyle to concept №2 (owner's pick from 9 boards): palette tokens, light heroes with photo right, nav "Get started" pill, factual trust row on home, per-page eyebrows in amber, OG cards in the new palette; new Higgsfield hero `public/img/hero-home.webp` (dusk villa, 1024×688) + JPEG twin for OG. Verified: typecheck, tests, build, Playwright at 1280/390 px.
- 2026-09-26 01:05–01:20 UTC+2: share/SEO fix for tool pages — title no longer doubles "| ORVIONIS", per-tool Open Graph card at `/tools/[slug]/opengraph-image` (dynamic, hero by category + price), `twitter:card=summary_large_image`, page titles now flow into og:title (root openGraph.title removed). `src/lib/tools/definitions/index.ts` holds the pure tool list (registry adds DB helpers).
- 2026-09-26 00:45–01:05 UTC+2: embedded job loop (`src/lib/jobs/loop.ts` shared with `scripts/worker.ts`, started by `src/instrumentation.ts`), inline-enqueue race fixed (inline jobs are created locked; jobs with a future `runAt` are now really scheduled instead of running at once), `/api/health` reports the loop heartbeat. Verified locally: 23 tests, build, `next start` picked up a hand-inserted QUEUED job within one poll.
- 2026-09-26 00:05–00:45 UTC+2: hero visuals + OG cards (commit `b1ded03`). Verified locally: typecheck, 20 unit tests, `next build` (OG routes prerender as static PNGs), Playwright screenshots at 1280 px and 390 px. Files transferred to the owner's clone as a tarball (checksums matched), committed and pushed from there. Note for future sessions: `device_commit_files` refuses paths inside `.git/`; write to the repo root and `mv` afterwards.
