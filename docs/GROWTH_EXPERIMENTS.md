# Growth experiments — running log

Each experiment has a hypothesis, a test, one metric, a status, a result and a decision. Experiments are judged by paid orders and contribution, never by likes or replies.

- Framework and the original research: `docs/EXPERIMENTS.md`.
- Live experiment records (tracked with `?exp=<key>` links): `/admin/experiments`.
- Numbers: `docs/BUSINESS_METRICS.md`.

**Phase: days 1–30 = EXPLORE.** Payments went live on 2026-09-26. No acquisition channel has run yet, so every experiment below is waiting for traffic. That is the first thing to fix.

## Active (built, waiting for traffic)

| ID | Hypothesis | Test | Metric → success / failure | Status |
| --- | --- | --- | --- | --- |
| E1 | Agents with walkthrough footage pay $49 for 5 edited listing clips (48 h, concierge) | Instagram DMs `re-ig-dm-1` | message→paid ≥ 5 % in 60 DMs / 0 paid after 60 DMs + one offer change | waiting for outreach |
| E2 | Photographers pay $29 for a branded pricing-guide PDF made from their packages | DMs, Facebook groups, SEO, free pricing calculator | ≥ 5 paid in 30 days | waiting for traffic |
| E3 | $9 MLS description + captions is an easy first purchase for agents | DMs `re-ig-dm-9`, free fair-housing checker, SEO | ≥ 10 paid in 30 days | waiting for traffic |
| E4 | Agents with vacant listings pay $15/photo for two staged versions in minutes. Incumbent: BoxBrownie US$30 per image, 48 h | DMs `re-ig-dm-staging`, CA variant with the AB 723 angle | ≥ 10 paid photos in 30 days, AI ≤ $0.40/order, ≤ 20 % redos | waiting for outreach |
| E5 | Multi-room orders (up to 6 photos) raise staging AOV above $15 | order form: several photos, live total | AOV of staging orders > $22 once 5 orders exist | built 2026-09-26 |
| E6 | A free watermarked preview on the visitor's own photo lifts checkout rate | preview button on the staging form | preview sessions → checkout ≥ 2× non-preview sessions | built, no real preview yet |
| E7 | AB 723 compliance (labeled copies, original-photo page, QR) is a buying reason in California | CA DM variant + `/guides/ab-723-virtual-staging` | CA share of staging orders; guide → tool clicks | built |

## Proposed next (ranked by speed to first data)

| ID | Hypothesis | Test | Cost | Owner action? |
| --- | --- | --- | --- | --- |
| E8 | High-intent search traffic for "virtual staging" converts at ≥ 2 % at $15/photo | **Published 2026-09-26 22:15 but paused since creation — has not served** (found 27 Sep 05:10 UTC): Search, US, 15 exact/phrase keywords, 1 RSA, Maximize clicks ≤ €1.50, **campaign total €30 for 26 Sep – 1 Oct** (`docs/GOOGLE_ADS_EXPERIMENT.md`); owner enables it, adds negatives + turns off auto-apply | €30 | yes — enable (asked 27 Sep 05:12 UTC) |
| E9 | 20 personal DMs per day to agents with vacant or new listings produce the first paid orders within 7 days | `docs/OUTREACH.md` templates (EN, with UA control copy), UTM per template, log the hours | ~30 min/day of founder time | yes — sent from the owner's accounts |
| E10 | Long-tail guides bring organic visitors who use the free tools and buy | guides (AB 723, photo tips, fair-housing wording), free tools linked to paid tools | operator time | no |
| E11 | "Remove furniture / declutter" sells next to staging. Incumbent: BoxBrownie item removal US$10 standard, US$5 minor | concierge-first: offer it by hand to the first staging customers, automate once 3 are sold | ~0 | no |
| E12 | Day-to-dusk for exterior photos is an impulse add-on (incumbent BoxBrownie US$5) | only after E4 shows buyers; price would have to be ~$5 | ~0 | no |
| E13 | A Fiverr gig reaches buyers who already search "virtual staging" (gigs at US$5–30 prove demand); our cost ≈ $0.10/photo | **Live since 2026-09-26 ≈ 21:30**: $10 / $25 / $45 for 1 / 3 / 6 photos, 2 versions each; 0 impressions / 0 orders so far (Manage Orders is the only order truth; 2 phishing senders reported + blocked) (`docs/FIVERR_EXPERIMENT.md`) | first order within 14 days of the gig going live; profit per order after Fiverr's 20 % | owner: Publish |
| E14 | Photographers buy a pricing-guide template on Etsy (US$10–20 templates with thousands of sales) | editable template built from our generator, listed on Etsy | ≥ 5 sales in 30 days | yes — Etsy shop |

**Rule:** no new automated tool gets built before an existing one has real buyers. The exception is a concierge test that costs nothing to offer (E11).

## Closed

None yet.

## Log

- 2026-09-29 15:15 UTC — **E10/E4: free virtual staging cost calculator** (`/free/virtual-staging-cost-calculator`). The owner asked to look at the Search Console queries and decide on a new feature.
  - Evidence, Search Console 28 days to 27 Sep plus the last 24 h:
    - the photography pricing calculator family ranks best ("photography pricing calculator" position 7.8, the real estate variant 14.7, the wedding variant 29);
    - staging-price queries show up for our main product: "virtual staging cost" 97, "how much does virtual staging cost" 91, "virtual staging pricing" 2 impressions in 24 h;
    - "photo licensing fee calculator" 79.
  - Why this tool: tool pages get impressions fastest for us (the calculator case), and staging price is buyer intent for the $15 product. It is also a second free tool for agents.
  - What it shows: from photos per listing and listings per month, the cost with a human editor ($24 / $30 per photo), a Virtual Staging AI plan ($16–$79/mo with yearly billing), ORVIONIS ($15), and physical staging (NAR median $1,500).
  - It reports the cheapest option for a one-off listing and for the same volume every month. It says honestly that a subscription wins at steady volume.
  - Prices were re-checked on 29 Sep. Linked from `/free`, `/real-estate` and `llms.txt`.
  - Not linked from the E8 landing page or the cost guide while the ad test runs.
  - Rejected for now: a photo licensing fee calculator, because there are no citable usage multipliers and it would mean inventing pricing.
  - Measure: Search Console impressions and positions for staging cost/pricing queries; `free_tool_used` for the tool; `cta_click` from "staging-cost-calculator".
- 2026-09-29 00:05 UTC — **E10: sixth guide, "What to put in a photography pricing guide: a checklist"** (`/guides/photography-pricing-guide-checklist`, for photographers; supports E2).
  - Eight sections, each with what to include and a tip, plus the mistakes that cost bookings. The checklist is marked as our recommendation.
  - One sourced number: The Knot 2026 Real Weddings Study, $3,000 average, regional $2,600–$3,800.
  - Leads to the free calculator and the $29 Photographer Pricing Guide (sample PDF link).
  - The $29 tool page now links to the guide and the calculator (definition data only; the shared tool template and the E8 landing page are unchanged).
  - Sitemap: the guide, `/guides` and `/tools/photographer-pricing-guide` are dated 29 Sep, so IndexNow sends only those.
  - Measure: Search Console impressions for "photography pricing guide" queries from 6 Oct; `cta_click` to the $29 tool.
- 2026-09-28 13:30 UTC — **E10: the photography pricing calculator page, rebuilt for its query family** (`/free/photography-pricing-calculator`).
  - Why: it is the first ORVIONIS page with organic demand in Search Console. "photography pricing calculator" has 3 impressions at position 7.3, the real estate variant 14.5, the wedding variant 29, and 0 clicks.
  - Shipped:
    - a new title and description;
    - a real estate example preset;
    - a sourced market check: The Knot 2026 wedding data, Thumbtack real estate hourly ranges, published real estate rate cards;
    - floor-vs-market advice that leads to the $29 pricing guide;
    - two market FAQs;
    - its own sitemap lastmod, so IndexNow sends only this URL.
  - Not the E8 landing page, which is unchanged.
  - Measure weekly from 5 Oct: position, impressions and CTR for the three queries; calculator uses (`free_tool_used`) and `cta_click` from "pricing-calculator" in `/admin/analytics`.
- 2026-09-28 05:40 UTC — **E10: fifth guide, "Which rooms should you virtually stage?"** (`/guides/which-rooms-to-virtually-stage`).
  - Data-backed from the NAR 2025 Profile of Home Staging press release. Buyers' agents' most important room to stage: living room 37%, primary bedroom 34%, kitchen 23%, guest bedroom 7%. What sellers' agents stage: living room 91%, primary bedroom 83%, dining room 69%, kitchen 68%, guest or children's bedroom 22% each. Photos matter: 88% / 73%.
  - Adds a room-by-room plan for 1–6 photos, labeled as our recommendation. It supports E5 (multi-room orders).
  - Linked from the cost guide. The E8 landing page is untouched.
  - The sitemap now dates guides individually. After the first accepted IndexNow submission, only newer URLs are sent: here, the new guide, the cost guide and `/guides`.
  - E8: still restricted, and the EU political-ads answer is still "yes".
- 2026-09-27 17:05 UTC — Day 2 close.
  - Revenue $0, 0 paid orders, visits unchanged (498 / 30 days).
  - **E8:** restricted by Google (Resume fails with `CAMPAIGN_ERROR_CANNOT_ACTIVATE_RESTRICTED_CAMPAIGN`). The account's EU political-ads declaration reads "yes", which is wrong; the owner is asked to correct it to "No", then retry, then support chat.
  - **E10:** IndexNow accepted 37 URLs (HTTP 202 at 12:00 UTC).
  - **E13:** Manage Orders 0.
- 2026-09-27 11:20 UTC — **E10: IndexNow built.** The hourly maintenance submits the 21 sitemap URLs plus 16 retired Ride Lab paths (404 now) once per content version to the shared IndexNow endpoint, which passes them to Bing, Yandex, Seznam, Naver, Yep and Amazon. Production only, after the public key file answers.
  - Bing baseline (`site:orvionis.com`, 11:20 UTC): about 24 results. The home page already shows the new title, and `/tools`, `/pricing`, `/real-estate`, `/contact` and `/photographers` are listed. Ride Lab pages are there too (`/en`; on www `/en/shop`, `/en/about`, `/en/faq`). The flagship and the guides are not on the first page.
  - Bing Webmaster Tools still waits for the owner.
  - E8 is still paused (owner). E13: Manage Orders 0; the inbox was behind Fiverr's human check.
- 2026-09-27 05:10 UTC — **E8 has not started: the campaign is paused** and has been since it was published (change history has no pause event; ad status "campaign paused"; 0 impressions, €0, balance €30). The owner is asked to enable it (chat + push). No other channel traffic overnight: 30-day visits 498 (+6), 0 paid orders, 0 orders in review or failed; production healthy, deploy `5c2b514` green.
- 2026-09-27 00:50 UTC — **E10 Search Console operations** (owner's yes): sitemap resubmitted; indexing requested for `/`, `/tools/virtual-staging`, four guides, `/guides`, `/photographers` (all but `/` were not on Google); Ride Lab prefixes `/pl/` and `/en/` in Removals ("Processing"). Bing Webmaster Tools waits for the owner's sign-in.
- 2026-09-27 00:20 UTC — **E10 SEO audit** (SEO-AEO-GEO Ultimate plugin; record in `docs/SEO_AUDIT.md`). Evidence: Google indexes 11 ORVIONIS URLs but **not** the flagship `/tools/virtual-staging` or any guide, plus **16 old Ride Lab URLs** that rank first for the brand name; www served a duplicate host; metadata sat in `<body>` for Googlebot and AI crawlers on 12 pages. Shipped: metadata in `<head>`, www → apex, WebSite markup, current titles/descriptions (home, tools, pricing, real estate, flagship, cost guide, legal), flagship in the nav/footer, cost guide cross-links, `/llms.txt`. Owner: Search Console + Bing Webmaster Tools (OPERATOR.md). Baseline (first party, 30 days): `www.google.com` 18 visits, 0 orders. **E8 note:** the landing page changed before its first impression.
- 2026-09-26 23:20 — **E10:** new buyer-intent guide `/guides/virtual-staging-cost`: sourced prices checked today (BoxBrownie US$30 / 48 h, VirtualStaging.com $24, Virtual Staging AI $16–79/month) plus NAR 2025 staging data (median $1,500 for a staging service). Not linked from the tool page while the ad test runs, so the E8 landing page stays unchanged.
- 2026-09-26 22:25 — **E8 published** (campaign 24292280138, in review, €30 campaign total until 1 Oct). **E13 live** (gig Active). Three fake-order phishing messages came in within an hour; Manage Orders = 0; 2 senders reported and blocked. Owner policies recorded: 90-day reinvestment (BUSINESS_METRICS.md) and Fiverr order verification.
- 2026-09-26 — **E13 Fiverr gig built** (overview, pricing $10/$25/$45, description, 4 FAQs, 4 buyer requirements, 2 gallery images); the final publish is the owner's click. **E8 Google Ads**: account EUR/Poland, €30 prepaid by the owner, Search campaign being configured (not PMax). Site: Google click id + keyword now kept with every order, paid ad clicks override older attribution, admin CSV export for Google's offline conversion import.
- 2026-09-26 — Fulfilment for marketplace orders built: `/admin/orders/new` (external order: tool intake + channel, buyer price, channel fee, channel order no.) → PAID order through the normal pipeline, counted as channel revenue with the fee; refunds recorded without Stripe; "Download all (ZIP)" on customer and admin order pages. Gig copy + images ready in `docs/FIVERR_GIG.md` / `docs/fiverr/`.
- 2026-09-26 — Free preview verified in production with the real model: gpt-image-2, 32 s, $0.06, watermark and response OK (operator test). Market scan (`docs/MARKET_OPPORTUNITIES.md`): staging demand is proven but crowded (Fiverr US$5–30/photo, AI subscriptions US$16–79/month) → the channels with built-in demand (Fiverr E13, Etsy E14) rank above building more tools. Team devices are now excluded from traffic metrics (`orv_internal` cookie).
- 2026-09-26 — Payments live. Snapshot: 0 real visitors, 0 paid. Decision: acquisition is the bottleneck. Operator: E10 (SEO) and the outreach kit. Owner: E9 (outreach) and optionally E8 (€50 ads test).
