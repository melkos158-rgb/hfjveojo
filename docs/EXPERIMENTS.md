# Revenue experiments — the operating system of the first 90 days

Business loop: DATA → ANALYSIS → HYPOTHESIS → EXPERIMENT → ACTION → CUSTOMER → MONEY → RESULT → DATA.
Every experiment lives in `/admin/experiments` (table `Experiment`), gets traffic via `?exp=<key>` links, and is judged only by paid orders, delivery cost and feedback — never by likes or replies.

## Why these two first (evidence, not preference)

Sources are from the research phase (`docs/` in the research docs; public price pages read on 2026-09-25):

- **Willingness to pay for listing clips is proven by incumbents**: Editvideo.io sells real-estate short-form editing at $195/mo for 10 videos; Fiverr's top RE video editor charges $65 per 1-minute video with 905 profile reviews; the Fiverr category has 32,000+ services. White Glove Content (subscription content production) reached $65,519 MRR / 588 subscriptions, Stripe-verified on TrustMRR — productized video subscriptions can reach five figures with a tiny team. Retention there is unproven (founded April 2026), so we start with one-time orders, not a subscription.
- **Photographers already pay for the document we automate**: Etsy pricing-guide templates at $10–$20 with shops showing 640–2,400 sales; welcome guides with 8,000+ ratings; CRMs gating templates behind $29–$129/mo plans. The job is real; the price ceiling is low, so this tool must be near-zero marginal cost — which the automated pipeline delivers (AI cost per order is logged; target ≤ $0.50).
- **Contradiction resolved**: the launch brief chose clips as *the* business, the platform brief made documents the code core. Both are right for different reasons: clips are the fastest path to a real payment (no automation needed to deliver — a human edits), documents are the fastest path to a *repeatable* automated sale. They share the same order/payment/delivery engine, so running both costs almost nothing extra.

## E1 — Listing Clips concierge (primary money test)

| Field | Value |
| --- | --- |
| Target customer | US residential agents who posted a listing walkthrough on Instagram/TikTok in the last 7 days (they have footage *and* the habit) |
| Problem | Footage sits unedited; agencies cost ~$195/mo minimum; Fiverr is unreliable |
| Offer | 5 vertical clips (9:16) with price/beds/baths overlays, branding, captions + hashtags, from one walkthrough, 48h, one revision |
| Price | **$49** per listing (anchored under $65/single Fiverr edit and $195/mo agency) |
| Expected cost per order | AI ≈ $0.02–0.05 (clip plan + captions); founder editing time ≈ 60–120 min; Stripe ≈ $1.72; music: royalty-free library or none |
| Expected margin | ≈ $47 gross contribution per order before founder time; ≈ $25–35/h effective founder rate at 90 min/order — acceptable for validation, not for scale |
| Acquisition | 15 personalised Instagram DMs per day (template `re-ig-dm-1`), 2 Facebook-group posts per week where allowed, optional free 1-clip sample for the first 10 prospects |
| Success (14 days) | ≥ 3 paid orders from ≤ 60 messages (≥ 5% message→paid), ≥ 1 repeat order or explicit interest in monthly, all delivered ≤ 48h, 0 refunds |
| Failure (14 days) | 0 paid after 60 messages + one offer iteration (price $79 with free sample **or** $29 without), or editing > 2h/order twice |
| Log | every DM batch as a `ChannelCost` (hours), every reply in `adminNotes`, every order's editing time in the order notes |

If it wins → V1.1: **Listing Clips Monthly** ($199/mo, 4 listings) via Stripe subscription mode (schema already has `Subscription`), and hire/automate the edit step (ffmpeg templates for overlays first, human for shot selection).

## E2 — Photographer Pricing Guide (automated, proves the engine)

| Field | Value |
| --- | --- |
| Target customer | Wedding/portrait/family photographers on Instagram and in Facebook groups; Etsy searchers for "photography pricing guide" later |
| Offer | Branded 5-page PDF pricing guide + Markdown, generated in minutes, one free regeneration |
| Price | **$29** (above templates, far below CRM plans) |
| Expected cost per order | AI ≈ $0.05–0.15 (standard-tier generation + cheap-tier QA), Stripe ≈ $1.14, founder time ≈ 0 |
| Expected margin | ≈ $27.7 gross contribution per order; margin is the point — this is the first tool that scales without hours |
| Acquisition | 10 DMs/day (template `photo-ig-dm-1`), 1 helpful group post/week, SEO page live from day one (`/tools/photographer-pricing-guide`, JSON-LD Product + FAQ) |
| Success (30 days) | ≥ 5 paid orders, AI cost ≤ $0.50/order, feedback ≥ 4/5, ≥ 1 organic (non-outreach) order |
| Failure (30 days) | < 2 paid after 60 messages + 2 posts, or feedback < 3/5 |

If it wins → add the sibling documents (welcome guide, FAQ, email sequence) as a $49–$79 kit — same intake, more outputs, same pipeline.

## Decision rules (pre-committed, so the data decides, not the mood)

1. **Money beats opinion.** A paid order counts; a "love this, will order next month" does not.
2. **Kill fast, keep the engine.** A failed experiment retires the *offer*, not the platform: mark it LOST, write the conclusion, and start the next one within 24h.
3. **Double down on repeat.** The first customer who orders twice defines the roadmap for the next 30 days.
4. **Automate what was paid for twice.** No automation work for a tool with fewer than 2 paid orders (except E2, which exists to prove the automation).
5. **Unit economics gate scaling.** Spend on acquisition only where `(revenue − refunds − AI − channel cost) / paid orders` is positive and founder hours per order are known.
6. **Pricing is an experiment.** Change price via `/admin/tools` (logged), never in code first; run price variants with `?exp=<key>&variant=<v>`.
7. **Weekly review is mandatory** (docs/AI_CEO.md): what won, what lost, what next — written into `Experiment.conclusion`.

## 90-day model

- **Days 1–30 — discover willingness to pay.** Run E1 and E2. Ship one more concierge offer only if the first two produce fewer than 3 combined paid orders by day 14 (candidates from research: handyman quote packs, nurse résumé packs — both have evidence of spend, both fit the Document Engine).
- **Days 31–60 — double down.** Take the winner to a repeatable channel (subscription for clips; SEO + Etsy listing for documents), add the second tool in the winning vertical, automate the most expensive manual step.
- **Days 61–90 — scale on unit economics.** Paid acquisition only for tools with proven contribution margin; introduce credits/bundles if customers buy more than one tool; browser extension only if a repeat workflow demands it.

## Metrics that matter (all computed in `/admin/analytics`)

visits → intake started → checkout started → paid (conversion at each step) · revenue · refunds · AI cost per order · channel cost + founder hours (CAC) · gross contribution · delivery time vs SLA · feedback rating · repeat orders. Anything not in this list is vanity until it moves one of these.
