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
| E8 | High-intent search traffic for "virtual staging" converts at ≥ 2 % at $15/photo | **In setup** — account + €30 prepaid done; Search campaign, US, exact/phrase high-intent keywords, €6/day × 5 days (`docs/GOOGLE_ADS_EXPERIMENT.md`); paid orders tracked by gclid + offline conversion import | €30 | publish click may need the owner |
| E9 | 20 personal DMs per day to agents with vacant or new listings produce the first paid orders within 7 days | `docs/OUTREACH.md` templates (EN, with UA control copy), UTM per template, log the hours | ~30 min/day of founder time | yes — sent from the owner's accounts |
| E10 | Long-tail guides bring organic visitors who use the free tools and buy | guides (AB 723, photo tips, fair-housing wording), free tools linked to paid tools | operator time | no |
| E11 | "Remove furniture / declutter" sells next to staging. Incumbent: BoxBrownie item removal US$10 standard, US$5 minor | concierge-first: offer it by hand to the first staging customers, automate once 3 are sold | ~0 | no |
| E12 | Day-to-dusk for exterior photos is an impulse add-on (incumbent BoxBrownie US$5) | only after E4 shows buyers; price would have to be ~$5 | ~0 | no |
| E13 | A Fiverr gig reaches buyers who already search "virtual staging" (gigs at US$5–30 prove demand); our cost ≈ $0.10/photo | **Gig built, awaiting owner's Publish click** — $10 / $25 / $45 for 1 / 3 / 6 photos, 2 versions each; fulfilment through `/admin/orders/new` (`docs/FIVERR_EXPERIMENT.md`) | first order within 14 days of the gig going live; profit per order after Fiverr's 20 % | owner: Publish |
| E14 | Photographers buy a pricing-guide template on Etsy (US$10–20 templates with thousands of sales) | editable template built from our generator, listed on Etsy | ≥ 5 sales in 30 days | yes — Etsy shop |

**Rule:** no new automated tool gets built before an existing one has real buyers. The exception is a concierge test that costs nothing to offer (E11).

## Closed

None yet.

## Log

- 2026-09-26 — **E13 Fiverr gig built** (overview, pricing $10/$25/$45, description, 4 FAQs, 4 buyer requirements, 2 gallery images); the final publish is the owner's click. **E8 Google Ads**: account EUR/Poland, €30 prepaid by the owner, Search campaign being configured (not PMax). Site: Google click id + keyword now kept with every order, paid ad clicks override older attribution, admin CSV export for Google's offline conversion import.
- 2026-09-26 — Fulfilment for marketplace orders built: `/admin/orders/new` (external order: tool intake + channel, buyer price, channel fee, channel order no.) → PAID order through the normal pipeline, counted as channel revenue with the fee; refunds recorded without Stripe; "Download all (ZIP)" on customer and admin order pages. Gig copy + images ready in `docs/FIVERR_GIG.md` / `docs/fiverr/`.
- 2026-09-26 — Free preview verified in production with the real model: gpt-image-2, 32 s, $0.06, watermark and response OK (operator test). Market scan (`docs/MARKET_OPPORTUNITIES.md`): staging demand is proven but crowded (Fiverr US$5–30/photo, AI subscriptions US$16–79/month) → the channels with built-in demand (Fiverr E13, Etsy E14) rank above building more tools. Team devices are now excluded from traffic metrics (`orv_internal` cookie).
- 2026-09-26 — Payments live. Snapshot: 0 real visitors, 0 paid. Decision: acquisition is the bottleneck. Operator: E10 (SEO) and the outreach kit. Owner: E9 (outreach) and optionally E8 (€50 ads test).
