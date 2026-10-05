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
| AI / API costs | $4.05 | `/admin/analytics`, 4 Oct 12:55 UTC: pipeline tests, 1 production staging preview, the daily and weekly AI CEO reports, and the marketing lab (2 Oct +$1.65, 3 Oct room-type test +$1.65, 4 Oct bathroom runs +$0.33) |
| **Gross profit** | **−$4.05** | net revenue − variable costs (AI) |
| Advertising spend | **€29.98** (29 Sep €11.69 + 30 Sep €10.50 + 1 Oct €7.79) | Google Ads E8, final: 23 clicks at €1.30 average, of the €30 campaign total prepaid by the owner. Campaign ended 1 Oct; evaluated 2 Oct 05:10 UTC (stop). |
| Infrastructure | Railway Hobby plan | owner-paid; monthly amount → from the Railway invoice (not yet recorded) |
| AI subscriptions (Claude, etc.) | owner-paid | amount to record from the owner's billing (not yet recorded) |
| **Net profit** | **−$4.05 − €29.98 − fixed costs** | gross profit − ads − infrastructure − subscriptions (the ad spend comes out of the owner's €30 prepaid balance) |
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
