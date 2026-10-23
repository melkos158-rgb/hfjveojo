# Business metrics

Only real numbers go here. Source of truth: `/admin/analytics` and the daily CEO email, both computed from our own database. Test orders are excluded everywhere: admin pipeline tests, sandbox checkouts, `isTest`. GA4 is the traffic view once `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.

## 90-day reinvestment policy (owner, 2026-09-26)

- **Days 1–90 (Day 1 = 2026-09-26, Day 90 = 2026-12-24):** zero personal withdrawals.
- **What gets reinvested:** profit or cash that is *safe* to reinvest. Eligible uses:
  - AI subscriptions and API usage;
  - hosting;
  - ads, SEO and content;
  - automation tools and sales channels;
  - scaling products or channels with positive unit economics.
- **Day 91 (2026-12-25):** evaluate the business, then decide on withdrawals.
- **Never spend because budget is available.** Every material expense goes into the Spend register below with:
  - a reason;
  - a hypothesis;
  - an expected outcome;
  - a metric;
  - a limit.
- **Ranking:** expected incremental revenue ÷ incremental cost.
- **Losing channels:** a channel that keeps losing money gets reduced or stopped. It is kept only if a controlled experiment could plausibly fix it. The 90-day experiment itself continues when a single product, channel or strategy fails.
- **Revenue ≠ profit ≠ cash.** The ledger keeps them separate.

## Running ledger (days 1–90)

Currencies: revenue in USD (Stripe prices), ad spend in EUR. ROAS converts spend at the ECB rate of the spend date; until then both native amounts are shown.

| Line | To date | Source / note |
| --- | --- | --- |
| Gross revenue (paid, non-test orders) | **$0** | `/admin/analytics` |
| Refunds | $0 | |
| Stripe fees | $0 | actual fee per payment (balance transaction) |
| Marketplace fees (Fiverr 20 %) | $0 | |
| **Net revenue** | **$0** | gross − refunds − Stripe − marketplace fees |
| AI / API costs | $4.08 | `/admin/analytics`, 6 Oct 08:50 UTC: pipeline tests, 1 production staging preview, the daily and weekly AI CEO reports, and the marketing lab (2 Oct +$1.65, 3 Oct room-type test +$1.65, 4 Oct bathroom runs +$0.33) |
| **Gross profit** | **−$4.08** | net revenue − variable costs (AI) |
| Advertising spend | **€29.98** (29 Sep €11.69 + 30 Sep €10.50 + 1 Oct €7.79) | Google Ads E8, final: 23 clicks at €1.30 average, of the €30 campaign total prepaid by the owner. Campaign ended 1 Oct; evaluated 2 Oct 05:10 UTC (stop). |
| Infrastructure | Railway Hobby plan | owner-paid; monthly amount → from the Railway invoice (not yet recorded) |
| AI subscriptions (Claude, etc.) | owner-paid | amount to record from the owner's billing (not yet recorded) |
| **Net profit** | **−$4.08 − €29.98 − fixed costs** | gross profit − ads − infrastructure − subscriptions (the ad spend comes out of the owner's €30 prepaid balance) |
| **Cash available for reinvestment (business-generated)** | **$0** | all spending so far is owner-funded; nothing has been earned yet |

## Revenue and profit per channel

| Channel | Spend | Paid orders | Revenue | Profit | ROAS | Revenue per € / $ spent |
| --- | --- | --- | --- | --- | --- | --- |
| google (E8, Search, ended 1 Oct) | €29.98 (248 impressions, 23 clicks, CPC €1.30); site: 38 page views, 0 intakes, 0 checkouts | 0 | $0 | −€29.98 | 0 | 0 |
| fb_group (E9, Facebook groups, from 29 Sep) | $0 (founder time); 2 Oct 15:55 UTC: 2 posts live (SoCal Professionals 5 reactions, 2 comments; Northern California 0), 3 awaiting admin review since 30 Sep, All Realtors membership pending; a collage post for SoCal Professionals, published by the owner ≈ 22:00 UTC, still awaiting admin review at 4 Oct 18:55 UTC (2 days); site: 13 page views (`fb_group`) plus 7 untagged Facebook referrals, 0 intakes | 0 | $0 | $0 | — | — |
| instagram_dm (E19, personal DMs to agents, from 2 Oct) | $0 (founder time); 10 sent 2 Oct ≈ 15:40–15:47 UTC, 1 human reply (passed to her builder), 1 auto-reply; batch 2 (10) not sent yet at 4 Oct 18:55 UTC; site: 0 `instagram_dm` page views (the link goes out after a reply), 0 free photos | 0 | $0 | $0 | — | — |
| youtube / ig / tiktok (E15, short video, from 30 Sep) | $0 (founder time) + Higgsfield credits (owner's plan); 3 Oct 18:55 UTC: TikTok v1 772, v2 769, v5 743, v8 769, v9 504 (posted 12:53 UTC), each flat after its first hours; YouTube Shorts v1 32, v2 18, v5 79, v8 3; Instagram 5 posts, 0 followers; site: `youtube` 3 page views, `ig` 0, `tiktok` 0, 0 intakes | 0 | $0 | $0 | — | — |
| fiverr (E13, gig live 26 Sep) | $0 (20 % fee only on sales) | 0 (Manage Orders) | $0 | $0 | — | — |
| outreach (E1–E3) | founder time only | 0 | $0 | $0 | — | — |
| direct / organic | $0 | 0 | $0 | $0 | — | — |

## Spend register (every material expense)

| Date | Item | Reason | Hypothesis | Expected outcome | Metric | Limit | Status / result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-09-26 | Google Ads E8: Search, US, "virtual staging service" intent | find a paid channel for the $15/photo staging tool | US agents who search for a virtual staging service will buy at $15 per photo after a free preview | ≥ 1 paid order from ~35–40 clicks (≈ €0.76–1.50 CPC) | paid orders, cost per paid order vs ≈ $14 contribution per photo | **€30** campaign total + €30 prepaid balance (owner authorized ≤ €50) | published 26 Sep; restricted until advertiser verification **passed 29 Sep**. The owner enabled it at ≈ 11:45 UTC. Day 1 (29 Sep): **€11.69, 8 clicks**; day 2 (30 Sep): **€10.50, 9 clicks**; 0 checkouts. Negatives added 30 Sep ≈ 22:05 UTC. **Final (ended 1 Oct): €29.98, 248 impressions, 23 clicks, 0 intakes, 0 checkouts, 0 orders. Evaluated 2 Oct 05:10 UTC: stop.** Visible search terms were consumers redecorating their own room. €20 of the owner's €50 limit is unused; a second test (E8b) only with his yes |
| 2026-09-26 | Fiverr gig E13 (virtual staging) | marketplace buyers who already look for staging | new-seller pricing $10 / $25 / $45 converts on Fiverr search | first order within 14 days of going live | impressions → clicks → orders (Manage Orders), net after 20 % | $0 cash; fee only on sales | live 26 Sep; 0 impressions, 0 orders |
| 2026-10-02 | Marketing lab: OpenAI image edits (gpt-image-2 medium) on 5 free-licence stock photos of empty rooms, 15 style runs × 2 versions | the owner: "the videos all look alike, use other photos"; AI spend approved ("все шо треба то трать") | real ORVIONIS output on new rooms makes fresher videos that hold viewers longer than v4–v7 (all built on order #6) | `video-v8` and the next videos beat v4–v7 on views or comments within 7 days | views, comments, tagged visits, free first photos claimed | code guard: 35 % of the $5 daily AI budget, 16 lab calls a day | done 2 Oct 13:40–14:10 UTC: 15 runs, cost-log estimate **≈ $1.65** (11 cents a run). Evening check: `/admin/analytics` AI spend went from $0.41 (12:58 UTC) to $2.06 (18:55 UTC), +$1.65, as estimated. That figure comes from our own cost log; OpenAI's invoice isn't visible from here. Used in `video-v8`, `video-v9`, the style gallery and the styles guide |
| 2026-10-03 | Marketing lab, room-type test: OpenAI image edits (gpt-image-2 medium) on 8 stock photos of two kitchens, two bathrooms, a dining room, an office, a porch and a pool, plus two quality tests (a living room at 480 px, a wide-angle living room); 15 runs × 2 versions | the owner's question: only living rooms and bedrooms had been tested, and bad photos may stage badly | room-specific prompt lines make every room type in the form keep the "fixtures untouched" promise | each room type in the form passes a lab run; failing ones get a fix or leave the form | lab contact sheets: fixtures kept, nothing added that isn't movable | the same code guard (35 % of the $5 daily AI budget, which allows 15 runs a day) | 3 rounds, 15 runs by 18:18 UTC, cost-log estimate **≈ $1.65**. `/admin/analytics` AI spend $2.07 (12:55 UTC) → $3.72 (18:55 UTC). Results: s77 room lines, bathroom in the form (s78), kitchen spotlights kept in round 3. The 16th run (the bathroom) ran after 00:00 UTC on 4 Oct, +$0.11 (AI $3.83 at 06:55 UTC); one version hung a new towel bar, so s80 adds round 4 (2 bathroom runs, ≈ $0.22, done by 07:09 UTC: all 4 versions clean). Used in `video-v10` |
| 2026-10-02 | Higgsfield Pro plan (bought by the owner himself; price paid not recorded here) + AI video credits | E15 short videos: the owner asked for "the most awesome video" | an AI "room stages itself" shot built from the real before/after lifts views and clicks above v4–v6 | v7 beats v6 on views and on tagged visits (`tiktok`, `ig`, `instagram_dm`) within 7 days | views per video, tagged visits, free first photos claimed | operator's own cap: use credits only for the shots a video needs | 2 Oct: 4 test shots (Kling 8.75, MiniMax H3 10, Gemini Omni 22.5, Seedance 2.0 45) = **86.25 credits**, balance 678.65 → **592.4**. MiniMax H3 used in `video-v7` |

## Snapshot — 2026-10-23 13:10 UTC (midday check-in)

- Search Console, 28 days to 21 Oct: 4 clicks, 255 impressions (248 a week earlier), CTR 1.6 %, position 24.2. Staging-cost queries at 85–96; rules pages at 6–8 (state laws 15 impressions at 7.7).
- s134 (snippets) pushed as `4db056d`; s135 (guide links on the home page) prepared and tested.

## Snapshot — 2026-10-23 07:05 UTC (morning check-in, last 30 days, `/admin/analytics`)

- 681 / 197 page views and sessions (676 / 192 on 20 Oct; the daily report counts 1 visit on 22 Oct). Funnel 3 → 7 → 0; $0 revenue; AI $4.35. Free first photos 0, prospect previews 0, photo warnings 0; delivered / review / failed 0 / 0 / 0; free tool uses 24. First touch: direct 577, google 39, www.google.com 26, fb_group 14.
- Production: `/api/health` ok, jobs 0 / 0 / 0, new worker `web-5e4675267973-14` (8,142 ticks): Railway built and deployed s132–s133 on 22 Oct after its outage. The MLS rules page shows 21 boards, the ARMLS guide the Tucson line; CI #173 and #174 green.
- Search Console: the MLS rules page is now "URL is on Google"; re-indexing requested after the 21-board update (≈ 07:00 UTC).

## Snapshot — 2026-10-22 18:58 UTC (evening check-in; the owner's computer is offline)

- s132 looks live: the sitemap lists the MLS rules and AB 723 guides with lastmod 21 Oct and the AB 723 guide names MetroList; two other cloud fetches (the MLS rules page, the ARMLS guide) still returned the old text, so the deploy is confirmed from the owner's computer at the next run. Railway (15:29 UTC): builds for Pro and Enterprise run, Hobby and Free not yet; incident open.
- `/admin/analytics` not read (computer offline, no Chrome extension). Tracker unchanged. No owner message (passive mode; the Railway checklist went out this morning).
- Check-ins of 23 and 24 Oct exist.

## Snapshot — 2026-10-22 13:15 UTC (midday check-in; the owner's computer is offline again)

- Railway (status page, 12:30 UTC): builds are back for Pro workspaces, not yet for Hobby or Free; the incident is still open. s132 is not live yet (the MLS rules page shows 17 boards).
- `/admin/analytics` not read. Tracker unchanged. Prepared locally (ships with s134): shorter search snippets on the fair-housing, AB 723, Stellar and Virtual Staging pages.

## Snapshot — 2026-10-22 07:15 UTC (morning check-in; the computer is back, the Chrome extension isn't)

- **Incident (not ours): Railway's security disclosure and platform outage of 21 Oct.** Customers' environment variables may have been read; builds and deploys are paused platform-wide. The owner got the key-rotation checklist. Production keeps serving: `/api/health` ok, jobs 0 / 0 / 0, worker `web-e6eae51c60bb-14`.
- s132 pushed as `b01f15f` (CI #173 green) but not deployed until Railway resumes builds; the live MLS rules page still shows 17 boards.
- `/admin/analytics` not read (no Chrome extension). Tracker unchanged (20 touches).

## Snapshot — 2026-10-21 18:55 UTC (evening check-in; the owner's computer is offline)

- `/admin/analytics` not read: the computer has been offline since 20 Oct ≈ 07:00 UTC (no device bridge, no Chrome extension; retried). The site serves pages (the AB 723 guide loaded at 18:54 UTC, fetched from the cloud).
- Tracker unchanged (20 touches, no new replies). No owner message: passive mode, nothing to report.
- Check-ins of 22 and 23 Oct exist.

## Snapshot — 2026-10-21 13:10 UTC (midday check-in; the owner's computer is offline)

- `/admin/analytics` not read (no device bridge, no Chrome extension; retried). No Fiverr look: Mondays only in passive mode.
- Prepared locally (ships with s132): MetroList and Las Vegas REALTORS® MLS on the MLS rules page (21 boards), MetroList in the AB 723 guide.

## Snapshot — 2026-10-21 06:55 UTC (morning check-in, passive mode day 1; the owner's computer is offline)

- `/admin/analytics` not read: the computer has been offline since 20 Oct ≈ 07:00 UTC (no device bridge, no Chrome extension; retried). The site serves pages: the MLS rules guide loaded at 06:55 UTC, still showing 17 boards because s132 hasn't shipped.
- Tracker unchanged overnight: 20 owner-sent touches (19 sent, 1 replied), 29 to do; no new replies.
- Check-ins of 21 and 22 Oct exist.

## Snapshot — 2026-10-20 18:55 UTC (evening check-in; the owner's computer is offline)

- **The court's gate: 20 owner-sent touches by 20 Oct (19 sent, 1 replied; the last on 8 Oct), below the 50 it set → passive mode from 21 Oct** (`docs/COURT_2026-10-06.md`).
- `/admin/analytics` not read: the computer has been offline since ≈ 07:00 UTC (no device bridge, no Chrome extension; retried). The last reading (06:58 UTC) stands: 676 / 192, $0 revenue, 0 paid orders, 0 free photos, AI $4.33. The site serves pages (the state laws guide loaded at ≈ 18:55 UTC, fetched from the cloud).
- Waiting for the computer: the s132 transfer (BeachesMLS and MLSSAZ on the MLS rules page, the gate docs), the s131 CI and deploy check, the vault.

## Snapshot — 2026-10-20 12:58 UTC (midday check-in; the owner's computer is offline)

- `/admin/analytics` and Fiverr not read: no device bridge, no Chrome extension (retried). The site serves pages (the MLS rules guide loaded during the check, fetched from the cloud).
- E19: 20 owner-sent touches (19 sent, 1 replied), 29 to do; the only tracker change since the morning is the Arizona cards' new date (21 Oct). The gate is counted at the evening run.
- s131 (`06601b1`, docs): CI and the deploy not confirmed yet. GitHub's commit list is closed to the cloud fetcher and its Actions page came back as an old copy, so both are checked at the evening run.
- Prepared locally (ships with the next transfer): BeachesMLS and MLSSAZ on the MLS rules page (19 boards), with links from the Stellar and ARMLS guides (s132).

## Snapshot — 2026-10-20 06:58 UTC (morning check-in, last 30 days, `/admin/analytics`)

- 676 / 192 page views and sessions (no change overnight; the daily report counts 1 visit on 19 Oct). No overnight orders, free photos, prospect previews, photo warnings or Pro credits purchases; funnel 3 → 7 → 0; $0 revenue; AI $4.33.
- Gate day: 20 owner-sent touches in the tracker (19 sent, 1 replied), nothing since 8 Oct; the final count is taken at the evening run.
- Tracker: the three Arizona cards (dated 20 Oct) moved to 21 Oct, so "Today" stays at the 10 unsent cards (court rule: at most 10 new a day, new cards only after sends).
- Production: `/api/health` ok, jobs 0 / 0 / 0, worker `web-ced3545b28a1-14` (s130 `13bd3b5`, CI #171 green).

## Snapshot — 2026-10-19 18:55 UTC (evening check-in, last 30 days, `/admin/analytics`)

- 676 / 192 page views and sessions (+1 / +1 since 18 Oct evening). The weekly report: 14 visits in 12–19 Oct, 52 the week before. Funnel 3 → 7 → 0; $0 revenue; AI $4.32; free first photos 0; prospect previews 0; delivered / review / failed 0 / 0 / 0.
- Search Console, 28 days to 17 Oct: 248 impressions, 5 clicks (216 a week earlier).
- E19: the tracker is unchanged (19 sent, 1 replied, 29 to do); nothing sent since 8 Oct. The gate is counted on 20 Oct.
- Production: `/api/health` ok, worker `web-1f0b1e31d67f-14` (s129 `a9db951`, CI #170 green). The owner's computer was offline from the morning until the evening.

## Snapshot — 2026-10-19 12:58 UTC (midday check-in; the owner's computer is still offline)

- `/admin/analytics`, Search Console and Fiverr not read: no Chrome extension, no device bridge (retried). The site serves pages (the state laws guide loaded at 12:54 UTC, fetched from the cloud).
- E19: the tracker is unchanged (19 sent, 1 replied, 29 to do); nothing sent since 8 Oct.
- Prepared locally (ships with the next transfer): links from the Stellar, ARMLS and Texas guides to the MLS rules and state laws pages (s130).

## Snapshot — 2026-10-19 06:58 UTC (morning check-in; the owner's computer is offline)

- `/admin/analytics` and Search Console not read: the owner's computer is offline (no Chrome extension, no device bridge; retried). The site serves pages (the MLS rules guide loaded at 06:55 UTC, fetched from the cloud). The Search Console reading moves to the first run with the computer online.
- E19: the tracker is unchanged (19 sent, 1 replied, 29 to do); nothing sent since 8 Oct. The court's 50 by 20 Oct needs 30 today and tomorrow.
- Check-ins of 19 and 20 Oct exist.

## Snapshot — 2026-10-18 18:55 UTC (evening check-in, last 30 days, `/admin/analytics`)

- 675 / 191 page views and sessions (+2 / +2 since 17 Oct evening; the daily report counts 1 visit on 17 Oct). Funnel 3 → 7 → 0; $0 revenue; AI $4.30; free first photos 0; prospect previews 0; delivered / review / failed 0 / 0 / 0.
- The owner's computer was offline from the morning until the evening run (no Fiverr look today).
- E19: the tracker is unchanged (19 sent, 1 replied, 29 to do); nothing sent since 8 Oct. The court's 50 by 20 Oct needs 30 in 2 days.
- Production: `/api/health` ok, jobs 0 / 0 / 0, worker `web-2a3c9b91d6e6-14` (s128 `ca5af49`, CI #169 green).
- The owner got the daily summary (Ukrainian) at 18:55 UTC; check-ins of 20 Oct scheduled (the evening one takes the gate count).

## Snapshot — 2026-10-18 12:58 UTC (midday check-in; the owner's computer is still offline)

- `/admin/analytics` and Fiverr not read: no Chrome extension, no device bridge (retried). The site serves pages (the state laws guide loaded at 12:54 UTC, fetched from the cloud).
- E19: the tracker is unchanged (19 sent, 1 replied, 29 to do); nothing sent since 8 Oct.

## Snapshot — 2026-10-18 06:58 UTC (morning check-in; the owner's computer is offline)

- `/admin/analytics` not read: the owner's computer is offline (no Chrome extension, no device bridge; retried). The site serves pages: the MLS rules guide loaded at 06:54 UTC (fetched from the cloud).
- E19: the tracker is unchanged since last evening (19 sent, 1 replied, 29 to do); nothing sent since 8 Oct. The court's 50 by 20 Oct needs 30 in 3 days, today included.
- Check-ins of 18 and 19 Oct exist. Docs wait for the next run with the computer online.

## Snapshot — 2026-10-17 18:55 UTC (evening check-in, last 30 days, `/admin/analytics`)

- 673 / 189 page views and sessions (no change since midday). Funnel 3 → 7 → 0; $0 revenue; AI $4.29; free first photos 0; prospect previews 0; delivered / review / failed 0 / 0 / 0.
- E19: the tracker is unchanged (19 sent, 1 replied, 29 to do); nothing sent since 8 Oct. The court's 50 by 20 Oct needs 30 in 3 days (10 a day).
- Production: `/api/health` ok, jobs 0 / 0 / 0, worker `web-01b7ee7737fb-14` (s127 `0a3625f`, CI #168 green).
- The owner got the daily summary (Ukrainian) at 18:56 UTC, with the passive-mode alternative spelled out; check-ins of 19 Oct scheduled.

## Snapshot — 2026-10-17 12:58 UTC (midday check-in, last 30 days, `/admin/analytics`)

- 673 / 189 page views and sessions (+1 / +1 since last evening; the daily report counts 2 visits on 16 Oct). Funnel 3 → 7 → 0; $0 revenue; AI $4.29 (the daily report, about a cent); free first photos 0; prospect previews 0; delivered / review / failed 0 / 0 / 0.
- Fiverr: Manage Orders 0 in every status; inbox unchanged (the same 6 conversations).
- E19: the tracker is unchanged (19 sent, 1 replied, 29 to do); nothing sent since 8 Oct.
- Shipped: the MLS rules guide (17 boards), s127. The owner's computer came back online before midday.

## Snapshot — 2026-10-17 06:58 UTC (morning check-in; the owner's computer is offline)

- `/admin/analytics` not read: the owner's computer is offline (no Chrome extension, no device bridge; retried). The site serves pages: the new state laws guide loaded at 06:55 UTC (fetched from the cloud).
- E19: the tracker is unchanged since last evening (19 sent, 1 replied, 29 to do); nothing sent since 8 Oct. The court's 50 by 20 Oct needs 30 in 4 days, today included (7–8 a day).
- Check-ins of 17 and 18 Oct exist. Docs wait for the next run with the computer online (transfer s127).

## Snapshot — 2026-10-16 18:55 UTC (evening check-in, last 30 days, `/admin/analytics`)

- 672 / 188 page views and sessions (+1 / +1 since midday; `www.bing.com` first-touch visits 1 → 2). Funnel 3 → 7 → 0; $0 revenue; AI $4.28; free first photos 0; prospect previews 0; delivered / review / failed 0 / 0 / 0.
- E19: the tracker is unchanged (19 sent, 1 replied, 29 to do); nothing sent since 8 Oct. The court's 50 by 20 Oct needs 30 in 4 days (7–8 a day).
- Production: `/api/health` ok, jobs 0 / 0 / 0, worker `web-5016a3219e3d-14` (s125 `967ba49`, CI #166 green).
- The owner got the daily summary (Ukrainian) at 18:56 UTC; check-ins of 18 Oct scheduled.

## Snapshot — 2026-10-16 12:58 UTC (midday check-in, last 30 days, `/admin/analytics`)

- 671 / 187 page views and sessions (one view since the morning). Funnel 3 → 7 → 0; $0 revenue; AI $4.28; free first photos 0; prospect previews 0; delivered / review / failed 0 / 0 / 0.
- Fiverr: Manage Orders 0 in every status; inbox unchanged (the same 6 conversations).
- E19: the tracker is unchanged since the morning (19 sent, 1 replied, 29 to do); nothing sent since 8 Oct. The owner hasn't answered this morning's question yet.
- Shipped: the state laws guide (California, Wisconsin's Act 69 from 1 Jan 2027, the New York and New Jersey bills), s125.

## Snapshot — 2026-10-16 06:58 UTC (morning check-in, last 30 days, `/admin/analytics`)

- 670 / 187 page views and sessions (no change overnight; 4 visits on 15 Oct by the daily report). No overnight orders, free photos, prospect previews, photo warnings or Pro credits purchases; funnel 3 → 7 → 0; $0 revenue; AI $4.28.
- E19: nothing sent since 8 Oct (20 touches); the tracker is unchanged. The court's 50 by 20 Oct needs 30 in 5 days, today included (6 a day).
- 15 Oct evening: the run read 670 / 187 and the tracker, then stopped when the owner wrote a cut-off message ("окей тепер пере…"); the daily summary and the 17 Oct check-ins were done this morning instead (the owner was asked what he meant).
- Production: `/api/health` ok, jobs 0 / 0 / 0, worker `web-87ceb9d156a8-14` (s123 `c781409`, CI #164 green).

## Snapshot — 2026-10-15 12:58 UTC (midday check-in, last 30 days, `/admin/analytics`)

- 669 / 186 page views and sessions (no change since the morning). Funnel 3 → 7 → 0; $0 revenue; AI $4.27; free first photos 0; prospect previews 0; delivered / review / failed 0 / 0 / 0.
- Fiverr: Manage Orders 0 in every status shown; inbox unchanged.
- E19: the tracker is unchanged since the morning; nothing sent since 8 Oct.
- Shipped: internal links from the four pages with the most impressions to the newer guides (s123).

## Snapshot — 2026-10-15 06:58 UTC (morning check-in, last 30 days, `/admin/analytics`)

- 669 / 186 page views and sessions (+3 / +3 overnight; 1 visit on 14 Oct by the daily report). No overnight orders, free photos, prospect previews, photo warnings or Pro credits purchases; funnel 3 → 7 → 0; $0 revenue; AI $4.27.
- E19: nothing sent since 8 Oct (20 touches); the tracker is unchanged overnight. The court's 50 by 20 Oct needs 30 in 6 days, today included (5 a day).
- Production: `/api/health` ok, jobs 0 / 0 / 0, worker `web-665af4b9114b-14` (s121 `ba96bb3`, CI #162 green).

## Snapshot — 2026-10-14 18:55 UTC (evening check-in, last 30 days, `/admin/analytics`)

- The owner's computer is back. 666 / 183 page views and sessions (1 visit on 13 Oct by the daily report). Funnel 3 → 7 → 0; $0 revenue; AI $4.27; free first photos 0; prospect previews 0; photo warnings 0; delivered / review / failed 0 / 0 / 0; Pro credits 0 purchases.
- E19: nothing sent since 8 Oct (20 touches); the tracker is unchanged. The court's 50 by 20 Oct needs 30 in 6 days (5 a day, within the 10-a-day cap).
- Production: `/api/health` ok, jobs 0 / 0 / 0, worker `web-de1baa2e4def-14` (s120 `9904a50`).

## Snapshot — 2026-10-14 12:58 UTC (midday check-in; `/admin/analytics` not read)

- The owner's computer is still offline (no browser extension, no device bridge), so analytics, Fiverr and the transfer wait. The tracker is unchanged since the morning: nothing sent since 8 Oct.
- Shipped without the computer: the tracker v11 (a "copy and open the chat" button per card).

## Snapshot — 2026-10-14 06:58 UTC (morning check-in; `/admin/analytics` not read)

- The owner's computer was offline (the browser extension and the device bridge didn't answer), so `/admin/analytics` and `/api/health` couldn't be opened from here. Production signal: the GitHub Uptime workflow, which checks `/api/health`, passed at 05:23 UTC (run #87).
- E19: the tracker is unchanged overnight; nothing sent since 8 Oct (20 touches). Today's plan step: the 10 prepared messages.

## Snapshot — 2026-10-13 18:55 UTC (evening check-in, last 30 days, `/admin/analytics`)

- 665 / 182 page views and sessions (no change since midday). Funnel 3 → 7 → 0; $0 revenue; AI $4.26; free first photos 0; prospect previews 0; delivered / review / failed 0 / 0 / 0.
- E19: nothing sent today either (20 touches; the tracker is unchanged since midday). The court's 50 by 20 Oct needs 30 in 7 days (more than 4 a day).
- Production: `/api/health` ok, jobs 0 / 0 / 0, worker `web-0919fef5660e-14` (s119 `9746c86`, CI #160 green).

## Snapshot — 2026-10-13 12:58 UTC (midday check-in, last 30 days, `/admin/analytics`)

- 665 / 182 page views and sessions (+1 / +1 since the morning). Funnel 3 → 7 → 0; $0 revenue; AI $4.26; free first photos 0; prospect previews 0; delivered / review / failed 0 / 0 / 0; Pro credits 0 purchases.
- Fiverr: Manage Orders 0 in every status; inbox unchanged.
- E19: nothing sent since 8 Oct (20 touches); the tracker is unchanged since the morning.
- Shipped: `/guides/texas-virtual-staging-rules` (s119), the week plan's SEO page for Texas.

## Snapshot — 2026-10-13 06:58 UTC (morning check-in, last 30 days, `/admin/analytics`)

- 664 / 181 page views and sessions (+1 / +1 overnight; 3 visits on 12 Oct by the daily report). No overnight orders, free photos, prospect previews, photo warnings or Pro credits purchases; funnel 3 → 7 → 0; $0 revenue; AI $4.26.
- E19: nothing sent since 8 Oct (20 touches); the tracker is unchanged overnight and "Today" keeps the same 10 cards. The court's 50 by 20 Oct needs 30 in 8 days, today included (about 4 a day).
- Production: `/api/health` ok, jobs 0 / 0 / 0, worker `web-e168ae406112-14` (s117 `420d451`, CI #158 green).

## Snapshot — 2026-10-12 18:55 UTC (evening check-in, last 30 days, `/admin/analytics`)

- 663 / 180 page views and sessions (no change since midday). Funnel 3 → 7 → 0; $0 revenue; AI $4.25; free first photos 0; prospect previews 0; delivered / review / failed 0 / 0 / 0.
- E19: nothing sent since 8 Oct (20 touches); the tracker is unchanged since midday. The court's 50 by 20 Oct needs 30 in 8 days (about 4 a day).
- Week plan 13–19 Oct sent to the owner (`docs/GROWTH_EXPERIMENTS.md`); no budget ask.
- Production: `/api/health` ok, jobs 0 / 0 / 0, worker `web-555eaa41baf7-14` (s116 `910a77f`, CI #157 green).

## Snapshot — 2026-10-12 12:58 UTC (midday check-in, last 30 days, `/admin/analytics`)

- 663 / 180 page views and sessions (+2 / +2 since the morning). Funnel 3 → 7 → 0; $0 revenue; AI $4.25; free first photos 0; prospect previews 0; delivered / review / failed 0 / 0 / 0.
- Fiverr: the extension reads fiverr.com again; Manage Orders 0 in every status, inbox unchanged (6 conversations, the newest 3 weeks old).
- E19: nothing sent since 8 Oct (20 touches); the tracker's "Today" still holds the same 10 cards.
- Shipped: the staging cost calculator prices all nine companies of the cost guide (s116).

## Snapshot — 2026-10-12 06:58 UTC (morning check-in, last 30 days, `/admin/analytics`)

- 661 / 178 page views and sessions (no change overnight). No paid orders; $0 revenue; AI $4.25 (+$0.02, the daily and weekly AI reports); free tool uses 24.
- Weekly AI report (Monday): visits 110 → 52 week over week, E4-tagged visits 45 → 4; the week before still held the last Google Ads days (29 Sep – 1 Oct).
- Search Console, 28 days to 9 Oct: 5 clicks, 216 impressions (181 a week earlier), average position 26.7; all clicks on the home page. Detail in `docs/GROWTH_EXPERIMENTS.md`.
- E19: nothing sent since 8 Oct (20 touches); the tracker is unchanged. The court's 50 by 20 Oct needs 30 in 9 days, today included (more than 3 a day).
- Production: `/api/health` ok, worker `web-a3a358f056c7-14` (s114 `4695b48`, CI #155 green).

## Snapshot — 2026-10-11 18:55 UTC (evening check-in, last 30 days, `/admin/analytics`)

- 661 / 178 page views and sessions (+2 / +2 since midday). Funnel 3 → 7 → 0; $0 revenue; AI $4.23; free first photos 0; prospect previews 0; delivered / review / failed 0 / 0 / 0.
- E19: nothing sent since 8 Oct (20 touches). The court's 50 by 20 Oct needs 30 in 9 days (more than 3 a day); 3+ real free photos by 27 Oct: 0; first paid order by 5 Nov: none yet.
- Production: `/api/health` ok, jobs 0 / 0 / 0, worker `web-b1f0b22632f7-14` (s113 `4797891`, CI #154 green).

## Snapshot — 2026-10-11 12:58 UTC (midday check-in, last 30 days, `/admin/analytics`)

- 659 / 176 page views and sessions (no change since the morning). Funnel 3 → 7 → 0; $0 revenue; AI $4.23; free first photos 0; prospect previews 0; delivered / review / failed 0 / 0 / 0.
- Fiverr: not checked — the browser extension now refuses both reading and screenshots on fiverr.com ("Permission denied for this action on this domain"); the owner's site settings decide this, so the operator does not work around it. Manage Orders read 0 in every status on 10 Oct.
- E19: nothing sent since 8 Oct.

## Snapshot — 2026-10-11 06:58 UTC (morning check-in, last 30 days, `/admin/analytics`)

- 659 / 176 page views and sessions (4 visits on 10 Oct by the daily report). No overnight orders, free photos, prospect previews, photo warnings or Pro credits purchases; funnel 3 → 7 → 0; $0 revenue; AI $4.23.
- E19: nothing sent since 8 Oct (20 touches); "Today" keeps the same 10 cards.
- Production: `/api/health` ok, jobs 0 / 0 / 0, worker `web-f6bd5c93101d-14` (s111 `e1038bf`, CI #152 green).

## Snapshot — 2026-10-10 18:55 UTC (evening check-in, last 30 days, `/admin/analytics`)

- 659 / 176 page views and sessions (no change since midday). Funnel 3 → 7 → 0; $0 revenue; AI $4.22; free first photos 0; prospect previews 0; delivered / review / failed 0 / 0 / 0.
- E19: nothing sent since 8 Oct (20 owner-sent touches). The court's 50 by 20 Oct now needs 30 in 10 days (3 a day); 3+ real free photos by 27 Oct: 0 so far.
- Shipped today: `/photographers` links the pricing guide (s109); `/guides/virtual-staging-disclaimer` (s110), live (the page title loaded from production).
- Production: `/api/health` ok, jobs 0 / 0 / 0, worker `web-e559683405e3-14` (s110 `e1fd3c8`, CI #151 green).

## Snapshot — 2026-10-10 12:58 UTC (midday check-in, last 30 days, `/admin/analytics`)

- 659 / 176 page views and sessions (+3 / +3 since the morning); first Bing visit in the channel list (www.bing.com 1). Funnel 3 → 7 → 0; $0 revenue; AI $4.22; free first photos 0; prospect previews 0; delivered / review / failed 0 / 0 / 0.
- E19: still nothing sent since 8 Oct (20 touches). Fiverr: Manage Orders 0 in every status; inbox unchanged.
- Production: `/api/health` ok, jobs 0 / 0 / 0, worker `web-d6c81f95041b-14` (s109 `a9d169c`); `/photographers` shows the pricing-guide link live.

## Snapshot — 2026-10-10 06:58 UTC (morning check-in, last 30 days, `/admin/analytics`)

- 656 / 173 page views and sessions (+1 / +1 overnight; 6 visits on 9 Oct by the daily report). No overnight orders, free photos, prospect previews, photo warnings or Pro credits purchases; funnel 3 → 7 → 0; $0 revenue; AI $4.22; delivered / review / failed 0 / 0 / 0.
- E19: no sends confirmed since 8 Oct (20 touches in all). "Today" in the tracker stays at the same 10 cards (5 agents, 2 photographers, 2 teams, 1 builder), so no new research; the 9 reminders and the Lesley thank-you also wait.
- Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker `web-84306a5e39f9-14` (s108 `6f6348e`, CI #149 green).

## Snapshot — 2026-10-09 18:55 UTC (evening check-in, last 30 days, `/admin/analytics`)

- 655 / 172 page views and sessions (+1 / +1 since midday). Funnel 3 → 7 → 0; $0 revenue; AI $4.21; free first photos 0; prospect previews 0; delivered / review / failed 0 / 0 / 0.
- E19: no sends confirmed today; 20 owner-sent touches in all. The court's 50 by 20 Oct needs 30 more in 11 days (about 3 a day). Waiting: the 10 cards of the pack (they carry over to 10 Oct), the 9 reminders to the 2 Oct batch and the Lesley thank-you.
- Shipped today: the ARMLS guide (s105; Arizona, $200 fines from December), the photographers' pricing guide (s107; 12 price lists, median $35 a staged photo, Pro credits margin), tracker v9–v10 answers (ARMLS, SABOR, photographer margins). Stripe payouts enabled (seen at midday).
- Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker `web-2b2e2447f68a-14` (s107 `f4226b7`, CI #148 green).

## Snapshot — 2026-10-09 12:58 UTC (midday check-in, last 30 days, `/admin/analytics`)

- 654 / 171 page views and sessions (+5 / +5 since the morning). Funnel 3 → 7 → 0; $0 revenue; AI $4.21; free first photos 0; prospect previews 0; delivered / review / failed 0 / 0 / 0. First touch over 30 days: direct 553, Google 65 (google 39 + www.google.com 26), Facebook group 13, Facebook 12, Gmail app 8, YouTube 3.
- **Stripe payouts are enabled:** `/admin/system` reads the live account as "charges enabled · payouts enabled · details submitted" (payouts were not enabled on 26 Sep). The court's owner step "payouts by 20 Oct" is done.
- E19: nothing marked sent today yet (20 touches in all); today's 10 and the 9 reminders wait for the owner. The 10 Oct pack is today's 10 carried over; new cards only once these are sent.
- Fiverr: Manage Orders 0 in every status; inbox unchanged (6 conversations, the newest 2 weeks old).
- IndexNow: 5 URLs at 08:00 UTC (the ARMLS guide, `/guides`, the Stellar and AB 723 guides, `/tools/virtual-staging`), HTTP 200 accepted.
- Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker `web-16efa0eefa8b-14` (s105 `c61a1c9`, CI #146 green).

## Snapshot — 2026-10-09 06:58 UTC (morning check-in, last 30 days, `/admin/analytics`)

- 649 / 166 page views and sessions (+2 / +1 overnight). No overnight orders; funnel 3 → 7 → 0; $0 revenue; AI $4.21; free first photos 0 (the owner's self-test no longer counts, s103); prospect previews 0; delivered / review / failed 0 / 0 / 0.
- E19: 20 owner-sent touches (11 yesterday). Lesley answered at 19:53 UTC: the builder has no homes ready for market, so no Crestview message for now; a thank-you + "mind if I check back in a few weeks" reply was drafted (next contact ≈ 29 Oct). The 9 reminders to the 2 Oct batch: not confirmed sent (asked the owner; they stay due in the tracker).
- Daily send pack for 9 Oct filled to 10 with the court's split: 5 agents (Shawna, Reggie — DFW; Omar — Orlando; Nitin — Austin; new: Moises Morales — San Antonio, new-construction specialist), 2 photographers (Bear Karry, Tampa Home Photos), 2 teams (new: The Brescia Group and SR Collective, Tampa), 1 builder (new: Easy Home Holding, San Antonio, move-in ready homes).
- Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker `web-5136da43cf00-14` (s103 `b75b3e3`, CI #144 green).

## Snapshot — 2026-10-08 18:55 UTC (evening check-in, last 30 days, `/admin/analytics`)

- 647 / 165 page views and sessions (+5 / +4 since midday; Facebook referrers +4, Gmail app +1, direct +1; some may be the owner's own phone, which has no internal-visitor cookie). Funnel 3 → 7 → 0; $0 revenue; AI $4.21 (+$0.11: the self-test photo).
- **Owner's free-photo self-test passed (court deadline 9 Oct):** order #8, claimed 18:46 UTC, staged and delivered within the same minute, QC passed, 2 versions + 2 labeled copies, AI $0.11, input 320×240. "Free first photos 1" on the card is this test; from s103 the card leaves the admins' own free photos out.
- **E19 sends: 11 today** (the 10 of the pack at 18:21–18:25 UTC + the Lesley reminder at 18:39), all visible as sent in Instagram, no warnings. Total 20 owner-sent touches: the court's first 20 done a day early. Gate: 50+ by 20 Oct needs 30 more in 12 days (2.5 a day). The 9 reminders to the 2 Oct batch (first counted as 8) wait for later tonight or tomorrow.
- Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker `web-adc632884252-14` (s102 `c490c04`, CI #143 green).

## Snapshot — 2026-10-08 12:57 UTC (midday check-in, last 30 days, `/admin/analytics`)

- 642 / 161 page views and sessions (+1 / +1 since the morning). Funnel 3 → 7 → 0; $0 revenue; AI $4.10; free first photos 0; prospect previews 0 (new card, s100); delivered / review / failed 0 / 0 / 0.
- Fiverr Manage Orders 0 in every status; inbox unchanged (newest conversation 2 weeks old), no human check. TikTok unchanged (6 videos, 2 followers).
- E19 tracker: nothing sent today (9 sent + 1 replied, all 2 Oct). The 9 Oct pack stays at 6 (4 agents, 2 photographers): with 16 prepared messages unsent, more research waits until sending resumes.
- Shipped this morning: prospect previews (s100, court lever 2) and the Stellar MLS guide with the "labeled copies for ads and social" fix (s101).
- Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker `web-cdfea3c1f8f8-14` (s101 `3ea662c`, CI #142 green).

## Snapshot — 2026-10-08 06:58 UTC (morning check-in, last 30 days, `/admin/analytics`)

- 641 / 160 page views and sessions (+4 / +4 overnight; direct 547). No overnight orders; funnel 3 → 7 → 0; $0 revenue; AI $4.10 (+$0.01, the daily report); free tool uses 20 (+2); free staging previews 1; photo warnings 0; free first photos 0; delivered / review / failed 0 / 0 / 0. Pro credits page 1 view, 0 checkouts. The daily report for 7 Oct counted 3 visits (15 on 6 Oct).
- TikTok unchanged: 6 videos, 2 followers, 3 likes, no new post (posting is paused by the court).
- E19 tracker: still 9 sent + 1 replied (all 2 Oct); none of the 10 planned for 7 Oct went out. Gate: 50+ owner-sent touches by 20 Oct needs 41 more in 12 days (≈ 3.4 a day).
- Daily send pack for 8 Oct kept at 10 (the Instagram limit) and set to the court's split as closely as 10 allows: 5 agents, 2 team leads, 2 photographers, 1 builder (Gulf Bay Builders). 4 agents and 2 photographers moved to 9 Oct.
- Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker `web-d2564c6a86a1-14` (s98 `e3bd282`, CI #139 green), 4,300 ticks.

## Snapshot — 2026-10-07 18:55 UTC (evening check-in, last 30 days, `/admin/analytics`)

- 637 / 156 page views and sessions (+1 / +1 today). Funnel 3 → 7 → 0; $0 revenue; AI $4.09; free tool uses 18; free first photos 0; delivered / review / failed 0 / 0 / 0.
- E19 tracker: nothing sent today; still 9 sent + 1 replied (all 2 Oct). Today's 10 and tomorrow's 6 wait in the tracker.
- Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker `web-e230d30de468-14` (s97 `e834c72`, CI #138 green).

## Snapshot — 2026-10-07 12:57 UTC (midday check-in, last 30 days, `/admin/analytics`)

- 636 / 155 page views and sessions (no change since the morning: US night hours). Funnel 3 → 7 → 0; $0 revenue; AI $4.09; free first photos 0; delivered / review / failed 0 / 0 / 0.
- Fiverr Manage Orders 0 in every status; inbox unchanged. E19 tracker: nothing sent yet today (9 sent + 1 replied, all 2 Oct).
- Builder share started: Gulf Bay Builders (Tampa infill townhomes) added for 8 Oct.
- Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker `web-a929ab4186ad-14` (s96 `4c39772`, CI #137 green).

## Snapshot — 2026-10-07 06:55 UTC (morning check-in, last 30 days, `/admin/analytics`)

- 636 / 155 page views and sessions (+2 / +2 overnight; direct 542). No overnight orders; funnel 3 → 7 → 0; $0 revenue; AI $4.09 (+$0.01, the daily report); free tool uses 18 (+1); free staging previews 1; photo warnings 0; free first photos 0; delivered / review / failed 0 / 0 / 0. Pro credits page 1 view, 0 checkouts.
- TikTok unchanged (v10 777, v9 796; 2 followers). E19 tracker: still 9 sent + 1 replied, nothing sent since 2 Oct.
- First daily send pack in the tracker for 7 Oct (court session 2): 10 new messages, 5 agents in Florida and Texas, 2 team leads, 3 photographers not on Aryeo; 5 more queued for 8 Oct; Phoenix moved to 20 Oct (Arizona from week 3); markets outside Florida and Texas, and Houston, held with the reason shown on the card.
- Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker `web-3abde5561c5c-14` (s95 `70e534f`, CI #136 green), 4,270 ticks.

## Snapshot — 2026-10-06 18:55 UTC (evening check-in, last 30 days, `/admin/analytics`)

- 634 / 153 page views and sessions (+1 / +1 since midday; direct 540). Funnel 3 → 7 → 0; $0 revenue; AI $4.08; free tool uses 17; free first photos 0; delivered / review / failed 0 / 0 / 0. Pro credits page 1 view, 0 checkouts.
- E19 tracker: still 9 sent + 1 replied (all 2 Oct); tomorrow's "Today" tab holds 14 (10 agents of batch 2 + the 4 photographers) plus follow-ups for the 9 sent. The tracker's price reply was corrected (it still said "$12 each from 5") and a Pro credits reply was added.
- Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker `web-36ec3b6c9389-14` (s94 `c1040f2`, CI #135 green), 2,088 ticks.

## Snapshot — 2026-10-06 12:55 UTC (midday check-in, last 30 days, `/admin/analytics`)

- 633 / 152 page views and sessions (+7 / +3 since the morning; some are the operator's own checks of the new pages in the built-in browser, which has no internal-visitor cookie). Funnel 3 → 7 → 0; $0 revenue; AI $4.08 (unchanged: today's work ran on mock AI); free tool uses 17 (+2); free staging previews 1; free first photos 0; delivered / review / failed 0 / 0 / 0. Pro credits page: 1 view, 0 checkouts.
- IndexNow 12:00 UTC: 8 URLs accepted (HTTP 200): the pages changed by s91–s93.
- Fiverr Manage Orders 0 in every status; inbox unchanged (newest conversation 2 weeks old). TikTok unchanged (v10 777, v9 796; 2 followers); YouTube Shorts 3 / 4 / 79 / 18.
- E19 tracker: 9 sent + 1 replied (all 2 Oct), nothing sent since; 34 to do, including the 4 photographers added for 7 Oct.
- Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker `web-f46d33abcba1-14` (s93 `892b61b`, CI #134 green).

## Snapshot — 2026-10-06 08:50 UTC (morning check-in, last 30 days, `/admin/analytics`)

- 626 / 149 page views and sessions (+9 / +9 overnight, all direct: 532). No overnight orders; funnel 3 → 7 → 0; $0 revenue; AI $4.08 (+$0.01, the daily report); free tool uses 15 (+1); free staging previews 1; photo warnings 0; free first photos 0; delivered / review / failed 0 / 0 / 0. Virtual Staging funnel 59 → 1 → 1 → 2.
- The AI CEO daily report for 5 Oct: 11 visits, 0 intakes, 0 checkouts.
- Short video: no new post. TikTok v10 777, v9 796, v8 770, v5 745, v2 770, v1 772. YouTube Shorts v10 3, v8 4, v5 79, v2 18, v1 32. Instagram 6 posts, 0 followers.
- E19 tracker unchanged (9 sent, 1 replied, 30 to do). The SoCal collage post is still in admin review (3 days).
- Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker `web-6bde7c4a7a34-14` (s86 `681b6c4`, CI #127 green).

## Snapshot — 2026-10-05 18:55 UTC (evening check-in, last 30 days, `/admin/analytics`)

- 617 / 140 page views and sessions (609 / 132 in the morning). By first touch: direct 523, `www.google.com` 26 (+1), the rest unchanged.
- Funnel 3 → 7 → 0; $0 revenue; AI $4.07; free tool uses 14; photo warnings 0; free first photos 0; delivered / review / failed 0 / 0 / 0.
- TikTok: v10 775 views in 6 h, the same ceiling as the five before it. E19 tracker unchanged. The SoCal collage is still in review.
- Week plan 6–12 Oct with the E8b €20 ask: `docs/GROWTH_EXPERIMENTS.md`.

## Snapshot — 2026-10-05 12:55 UTC (midday check-in, last 30 days, `/admin/analytics` at 12:43)

- 613 / 136 page views and sessions; funnel 3 → 7 → 0; $0 revenue; AI $4.07; free first photos 0; delivered / review / failed 0 / 0 / 0.
- Fiverr Manage Orders 0 in every status; inbox unchanged. TikTok: v10 posted at 12:32 UTC, 98 views by 12:55; v9 796.

## Snapshot — 2026-10-05 06:55 UTC (morning check-in, last 30 days, `/admin/analytics`)

- 609 / 132 page views and sessions (+2 / +2 overnight). No overnight orders; funnel 3 → 7 → 0; $0 revenue; AI $4.07; photo warnings 0; free first photos 0; delivered / review / failed 0 / 0 / 0.
- Search Console, 28 days to 2 Oct: 4 clicks, 181 impressions (89 the period before), average position 21.7.
- TikTok unchanged (v10 not posted). E19: follow-ups due today, texts sent to the owner.

## Snapshot — 2026-10-04 18:55 UTC (evening check-in, last 30 days, `/admin/analytics`)

- 607 / 130 page views and sessions (593 / 116 at 3 Oct 18:55: +14 / +14 in a day). By first touch: direct 514, the rest unchanged. Still no `tiktok`, `ig` or `instagram_dm` visits.
- Funnel 3 → 7 → 0; $0 revenue; AI $4.05 (today's lab: 3 bathroom runs, ≈ $0.33); free tool uses 13; free staging previews 1; photo warnings 0 (new card, live since 13:13 UTC); free first photos 0; delivered / review / failed 0 / 0 / 0. Virtual Staging funnel 58 → 1 → 1 → 2.
- Short video: no new post today (v10 waits); TikTok v9 796, v8 770, v5 745, v2 769, v1 772. Instagram DMs (E19): unchanged since 2 Oct (batch 2 not sent). The SoCal Professionals post is still in admin review (2 days).
- Production: `/api/health` ok, worker `web-dffced64036d-14` (s82 `1c5fd9c`).

## Snapshot — 2026-10-04 12:55 UTC (midday check-in, last 30 days, `/admin/analytics`)

- 602 / 125 page views and sessions (+1 / +1 since the morning; Sunday). By first touch: direct 509, the rest unchanged.
- Funnel 3 → 7 → 0; $0 revenue; AI $4.05 (+$0.22, lab round 4); free tool uses 13; free first photos 0; delivered / review / failed 0 / 0 / 0.
- Fiverr Manage Orders 0 in every status; inbox has nothing new. TikTok: v9 796 (stopped, like the others); v10 not posted yet.

## Snapshot — 2026-10-04 06:55 UTC (morning check-in, last 30 days, `/admin/analytics`)

- 601 / 124 page views and sessions (593 / 116 at 3 Oct 18:55). By first touch: direct 508, `google` 39, `www.google.com` 25, `fb_group` 13, Gmail app 6, `www.facebook.com` 5, `youtube` 3, `m.facebook.com` 2. No `tiktok`, `ig` or `instagram_dm` visits.
- No overnight orders. Funnel 3 → 7 → 0; $0 revenue; AI $3.83 (+$0.11, the round 3 bathroom lab run); free tool uses 13 (+3); free staging previews 1; free first photos 0; delivered / review / failed 0 / 0 / 0. Virtual Staging funnel 56 → 1 → 1 → 2.
- TikTok: v9 795 views, a little past the ≈ 770 where every earlier video stopped; v8 770, v5 745, v2 769, v1 772.
- Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker `web-daf416310c93-14` (s79 `9ff0076`).

## Snapshot — 2026-10-03 18:55 UTC (evening check-in, last 30 days, `/admin/analytics`)

- 593 / 116 page views and sessions (590 / 113 at 12:55). By first touch: direct 500, `google` 39, `www.google.com` 25, `fb_group` 13, Gmail app 6, `www.facebook.com` 5, `youtube` 3, `m.facebook.com` 2. Still no `tiktok`, `ig` or `instagram_dm` visits.
- Funnel 3 → 7 → 0; $0 revenue; AI **$3.72** (the room-type lab added $1.65); free tool uses 10; free staging previews 1; free first photos 0; delivered / review / failed 0 / 0 / 0. Virtual Staging funnel 55 → 1 → 1 → 2.
- Short video: TikTok v9 (posted 12:53 UTC) 504 views, 1 like; v1 772, v2 769, v5 743, v8 769. YouTube Shorts v1 32, v2 18, v5 79, v8 3 (v9 not on YouTube). Instagram 5 posts, 0 followers (per-reel plays don't load in the hidden window).
- Instagram DMs (E19): batch 1 unchanged (9 sent, 1 replied); batch 2 (10) not sent today; batch 3 (20) held. Batch 1 follow-ups fall due on 5 Oct. Facebook: the SoCal Professionals collage post still awaits admin review (20 h).
- Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker `web-8f3fb32001ab-14` (s78 `5699d77`) ticking at 18:53 UTC.

## Snapshot — 2026-10-03 12:55 UTC (midday check-in, last 30 days, `/admin/analytics`)

- 590 / 113 page views and sessions (579 / 103 at 2 Oct 18:55). By first touch: direct 497, `google` 39, `www.google.com` 25, `fb_group` 13, Gmail app 6, `www.facebook.com` 5, `youtube` 3, `m.facebook.com` 2. Still no `tiktok`, `ig` or `instagram_dm` visits.
- Funnel 3 → 7 → 0; $0 revenue; AI $2.07; **free tool uses 9** (4 at 2 Oct 18:55: five new checker or calculator sessions); free first photos 0; delivered / review / failed 0 / 0 / 0. Virtual Staging funnel 55 → 1 → 1 → 2.
- TikTok: v8 769 views. Like v1, v2 and v5, it climbed to about 770 and stopped. A new 16 s post went up at 12:53 UTC (caption: hashtags only).
- Fiverr Manage Orders 0 in every status (12:58 UTC). Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker `web-9ac98fe99412-14` (s74). s74 `e850703` CI and Railway green.

## Snapshot — 2026-10-03 06:55 UTC (morning check-in)

- Not readable: the owner's computer and Chrome were offline, so `/admin/analytics` and `/api/health` could not be read. The public styles guide loaded through WebFetch. Numbers resume at the midday check-in.

## Snapshot — 2026-10-02 18:55 UTC (evening check-in, last 30 days, `/admin/analytics`)

- 579 / 103 page views and sessions (576 / 100 at 12:58). By first touch: direct 487, `google` 38, `www.google.com` 25, `fb_group` 13, Gmail app 6, `www.facebook.com` 5, `youtube` 3, `m.facebook.com` 2. No `tiktok`, `ig` or `instagram_dm` visits yet.
- Funnel 3 → 7 → 0; $0 revenue; AI **$2.06** (the lab added $1.65); free staging previews 1; free first photos 0 claimed; delivered / review / failed 0 / 0 / 0. Virtual Staging funnel 54 → 1 → 1 → 2.
- Instagram DMs (E19): 10 sent, 1 human reply, 1 auto-reply, 10 queued for 3 Oct. Facebook: 2 posts live (SoCal Professionals 5 reactions, 2 comments), 3 awaiting admin review, 1 typed and waiting for the owner's Publish.
- Short video: TikTok v1 772, v2 769, v5 743 views (flat since the morning); YouTube Shorts 32 / 18 / 80; Instagram 3 posts, 0 followers. v6–v9 not posted yet.
- Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker `web-5aa9f6a937ef-14` ticking (18:54 UTC); s71 `abcb14d` CI and Railway green.

## Snapshot — 2026-10-02 12:58 UTC (last 30 days, `/admin/analytics`)

- 576 / 100 page views and sessions (+1 since 05:15; US morning). By first touch: direct 484, `google` 38, `www.google.com` 25, `fb_group` 13, Gmail app 6, `www.facebook.com` 5, `youtube` 3, `m.facebook.com` 2. Still no `tiktok` or `ig` visits.
- Funnel 3 → 7 → 0; $0 revenue; AI $0.41; free staging previews 1; free first photos 0 claimed; delivered / review / failed 0 / 0 / 0. Virtual Staging funnel 54 → 1 → 1 → 2.
- Short video: TikTok v1 772, v2 769, v5 (California) 742 views; YouTube Shorts 32 / 18 / 80; Instagram 3 Reels, 0 followers. v6 and v7 are not posted yet. Their audio was broken until 13:05 UTC (see GROWTH_EXPERIMENTS E15), fixed files in `ORVIONIS_VIDEO_REFERENCES/videos/`.
- Fiverr Manage Orders 0 in every status (12:58 UTC). Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker `web-2ee5e99be724-14` ticking (12:55 UTC); s67 `22a9889` CI and Railway green.

## Snapshot — 2026-10-02 05:15 UTC (last 30 days, `/admin/analytics`)

- 575 / 99 page views and sessions (unchanged since 1 Oct 23:10 UTC; US night). By first touch: direct 483, `google` 38, `www.google.com` 25, `fb_group` 13, Gmail app 6, `www.facebook.com` 5, `youtube` 3, `m.facebook.com` 2. No `tiktok` or `ig` visits yet.
- Funnel 3 → 7 → 0; $0 revenue; AI $0.40; free first photos 0 claimed (live since 1 Oct 23:17 UTC); delivered / review / failed 0 / 0 / 0.
- Google Ads E8 final: €29.98, 23 clicks, 0 conversions; evaluated: stop.
- Short video: TikTok v1 772, v2 767, the 2 Oct video 276 views, 2 followers; YouTube Shorts 32 / 18 / 42; Instagram 3 Reels, about 1 play, 0 followers.
- Facebook: the SoCal Professionals post 5 reactions, 2 comments (no new comments).
- Fiverr Manage Orders 0. Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker ticking (05:08 UTC).

## Snapshot — 2026-09-30 22:55 UTC (last 30 days, `/admin/analytics`)

- 565 / 91 page views and sessions (554 / 82 at 17:05). By first touch: direct 481, **`google` 30** (ads; 25 at 17:05), `www.google.com` 25, `fb_group` 13, `www.facebook.com` 5, **`youtube` 3** (new: the YouTube channel link), `m.facebook.com` 2, Gmail app 6.
- Funnel 3 → 7 → 0 (unchanged); $0 revenue; AI $0.39; delivered / review / failed 0 / 0 / 0. Virtual Staging views 46 (39 at 17:05).
- Google Ads, 30 Sep (account day): €10.50, 104 impressions, 9 clicks. 26–30 Sep: €22.19, 17 clicks, 0 conversions. 23 negatives saved by the owner at ≈ 22:05 UTC (verified).
- Facebook (22:20 UTC): 2 posts live (SoCal Professionals: 3 reactions, 2 comments; Northern California: 0), 4 awaiting admin review.
- Short video (E15): TikTok @orvionis.staging `video-v1` 251 views, 2 followers; YouTube Short 8 views; Instagram @orvionis_ 1 Reel, 0 followers, profile link live (arrives as `ig`).
- Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker ticking (22:49 UTC).

## Snapshot — 2026-09-30 17:05 UTC (last 30 days, `/admin/analytics`)

- 554 / 82 page views and sessions (544 / 74 at 13:05). By first touch: direct 480, `www.google.com` 25, **`google` 25** (ads; 22 at 13:05), **`fb_group` 13** (6 at 13:05), `m.facebook.com` 2, `www.facebook.com` 3, Gmail app 6.
- Funnel 3 → 7 → 0 (unchanged); $0 revenue; AI $0.39; delivered / review / failed 0 / 0 / 0. Virtual Staging views 39 (32 at 13:05).
- Google Ads: eligible, end date 1 Oct, 0 negatives; 30 Sep numbers not readable before midnight GMT+3. Facebook: the owner published the three day-2 posts at ≈ 14:00 UTC (2 live with 0 reactions, 1 awaiting admin review) and the reply on the SoCal post at ≈ 13:00 UTC. Fiverr: 0 (Manage Orders, 12:35 UTC).
- **Correction (22:20 UTC):** none of the three day-2 posts is live. The groups' «Ваш контент» (your content) pages list all three as awaiting admin review.
- Production: `/api/health` ok, db up, jobs 0 / 0 / 0, worker ticking (16:57 UTC).

## Snapshot — 2026-09-29 23:10 UTC (last 30 days, `/admin/analytics`)

- 540 / 70 page views and sessions. By first touch: direct 480, `www.google.com` 25, **`google` 18** (ads), `fb_group` 6, `m.facebook.com` 2, `www.facebook.com` 3, Gmail app 6.
- Funnel 3 → 7 → 0 (unchanged); $0 revenue; AI $0.38; delivered / review / failed 0 / 0 / 0. Virtual Staging views 28.
- Google Ads day 1: €11.69 for 8 clicks. Facebook: 2 posts live (1 comment), 1 awaiting admin review.
- Production: `91e2a77` live (owner email updates); the first update email went out at 19:42 UTC.

## Snapshot — 2026-09-29 17:05 UTC (last 30 days, `/admin/analytics`)

- 514 / 49 page views and sessions, by first touch: direct 480, `www.google.com` 25, **`google` 3** (Google Ads click id, the first ad traffic), Gmail app 6.
- Funnel 3 → 7 → 0 (unchanged); $0 revenue; AI $0.38; delivered / review / failed 0 / 0 / 0. Virtual Staging views 16 (+2 since 05:10).
- Google Ads: serving; Google's cost not readable today. Fiverr: not checked (11:03 only).
- Search Console, last 24 h: 1 click, 24 impressions, average position 8.8.

## Snapshot — 2026-09-29 11:25 UTC

- 511 / 47 visits and sessions; funnel 3 → 7 → 0; $0 revenue; AI $0.38; delivered / review / failed 0 / 0 / 0.
- Fiverr Manage Orders 0.
- Google Ads: **advertiser verification passed**; the campaign is paused until the owner enables it, €0.

## Snapshot — 2026-09-29 05:10 UTC (last 30 days, `/admin/analytics`)

- 509 / 46 visits and sessions: direct 478, **`www.google.com` 25 (+5 overnight)**, Gmail app 6.
- Funnel 3 → 7 → 0; $0 revenue; AI $0.38; delivered / review / failed 0 / 0 / 0.
- Virtual Staging views 14 (+1).
- Google Ads €0 (verification under review).

## Snapshot — 2026-09-28 17:10 UTC (last 30 days, `/admin/analytics`; at 23:10: 504 / 41 visits, `www.google.com` 20 first-touch visits (+1), still 0 paid)

Unchanged since 11:20:
- 502 / 40 visits and sessions; funnel 3 → 7 → 0;
- $0 revenue; AI spend $0.38; delivered / review / failed 0 / 0 / 0;
- free-tool uses 3.

Google Ads €0 (verification under review). Fiverr Manage Orders 0 at 11:20.

## Snapshot — 2026-09-28 11:20 UTC update (last 30 days, `/admin/analytics`)

- 502 / 40 visits and sessions: direct 477, `www.google.com` 19 (+1 organic), Gmail app 6.
- 0 paid; delivered / review / failed 0 / 0 / 0.
- AI spend $0.38.
- Fiverr Manage Orders 0.
- Google Ads restricted, €0.

The table below is from 2026-09-27 17:05 UTC.

## Snapshot — 2026-09-27 17:05 UTC (last 30 days, `/admin/analytics`; identical to 11:05. At 23:06 UTC: 499 / 38 visits, one more direct visit, still 0 paid)

| Metric | Value | Note |
| --- | --- | --- |
| Gross revenue | **$0** | Stripe live since 26 Sep 16:50 UTC; no real payment yet |
| Paid orders / customers | 0 / 0 | delivered / review / failed: 0 / 0 / 0 (real orders); Fiverr Manage Orders: 0 in every status (27 Sep 11:05 UTC) |
| Visits / sessions | 498 / 37 | unchanged since 05:10 UTC (+6 / +5 since 26 Sep 20:00 UTC); by first touch: direct 474, `www.google.com` 18, Gmail app 6. No ad traffic: the campaign is paused. |
| Funnel (intake started → checkout → paid) | 3 → 7 → 0 | the checkouts were test and sandbox verifications |
| Free-tool uses | 3 | fair-housing checker + pricing calculator |
| Free staging previews | 1 | 1 session went on to checkout (operator test) |
| AI spend | $0.36 | tests + the daily AI CEO report |
| Profit estimate | −$0.36 | plus the fixed Railway plan |

**Diagnosis:** the product, checkout and delivery work end to end. The missing input is traffic. There have been zero real visitors from any acquisition channel, so conversion, AOV and retention can't be measured yet. The next data has to come from outreach or a small paid test (see `docs/GROWTH_EXPERIMENTS.md`).

## Unit economics per order (variable cost)

| Tool | Price | AI / API cost (measured) | Stripe fee (US card) | Other | Contribution |
| --- | --- | --- | --- | --- | --- |
| Virtual Staging, per photo | $15 | ≈ $0.08–0.11 (2 images, gpt-image-2 medium; test #6 logged $0.11) | ≈ $0.74 | storage ≈ 0 | **≈ $14.1** |
| Listing Description | $9 | ≈ $0.01 (2 calls, gpt-4.1-mini/4.1) | ≈ $0.56 | — | **≈ $8.4** |
| Photographer Pricing Guide | $29 | ≈ $0.02 (3 calls) + PDF render | ≈ $1.14 | — | **≈ $27.8** |
| Listing Clips (concierge) | $49 | ≈ $0.01–0.03 (clip plan) | ≈ $1.72 | founder editing 60–120 min | ≈ $47 before founder time |
| Free staging preview | $0 | ≈ $0.04–0.06 each, capped at 15/day and 40 % of the daily AI budget | — | — | acquisition cost |

- **Stripe fees:** the fee is 2.9 % + 30¢ for US cards on a US-priced charge. A Polish account also pays cross-border/FX fees on foreign cards. The actual fee is recorded per payment from the balance transaction, and the KPIs show "n/n actual".
- **Guards:** a customer can't create more AI cost than they paid for. There's a per-order cap of $1 per unit (a 6-photo order may spend $6), a daily cap of $5 (raise it in Railway once orders arrive), 3 fulfilment attempts, and non-retryable errors park the order for a human.

## Definitions

These are computed in `src/lib/analytics/kpi.ts`.

- **Gross revenue:** what Stripe charged on paid, non-test orders, promotion codes included.
- **Net revenue:** gross − refunds − Stripe fees.
- **Profit estimate:** net − AI/API cost − channel spend. Founder hours are logged per channel in Experiments.
- **Conversion:** visit → paid (sessions) and checkout → paid.
- **AOV:** gross / paid orders.
- **Repeat rate:** share of customers with 2+ paid orders.
- **Per tool:** views → form started → free previews → checkouts → paid → revenue → AI cost.
- **Per channel:** first-touch source (`utm_source`, `ref`, referrer).

## Update rule

Refresh this snapshot at every session end, or when the first real order arrives. Never estimate revenue: if a number is not in the database, write "no data".
