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
| AI / API costs | $0.35 | `/admin/analytics` (pipeline tests + 1 production staging preview) |
| **Gross profit** | **−$0.35** | net revenue − variable costs (AI) |
| Advertising spend | €0.00 spent | Google Ads E8: €30 prepaid by the owner, campaign live from 26 Sep (in review) |
| Infrastructure | Railway Hobby plan | owner-paid; monthly amount → from the Railway invoice (not yet recorded) |
| AI subscriptions (Claude, etc.) | owner-paid | amount to record from the owner's billing (not yet recorded) |
| **Net profit** | **−$0.35 − fixed costs** | gross profit − ads − infrastructure − subscriptions |
| **Cash available for reinvestment (business-generated)** | **$0** | all spending so far is owner-funded; nothing has been earned yet |

## Revenue and profit per channel

| Channel | Spend | Paid orders | Revenue | Profit | ROAS | Revenue per € / $ spent |
| --- | --- | --- | --- | --- | --- | --- |
| google (E8, Search) | €0 (of €30 cap) | 0 | $0 | $0 | — | — |
| fiverr (E13, gig live 26 Sep) | $0 (20 % fee only on sales) | 0 (Manage Orders) | $0 | $0 | — | — |
| outreach (E1–E3) | founder time only | 0 | $0 | $0 | — | — |
| direct / organic | $0 | 0 | $0 | $0 | — | — |

## Spend register (every material expense)

| Date | Item | Reason | Hypothesis | Expected outcome | Metric | Limit | Status / result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-09-26 | Google Ads E8: Search, US, "virtual staging service" intent | find a paid channel for the $15/photo staging tool | US agents who search for a virtual staging service will buy at $15 per photo after a free preview | ≥ 1 paid order from ~35–40 clicks (≈ €0.76–1.50 CPC) | paid orders, cost per paid order vs ≈ $14 contribution per photo | **€30** campaign total + €30 prepaid balance (owner authorized ≤ €50) | live 26 Sep, in Google review; decide on 1 Oct by the rules in `docs/GOOGLE_ADS_EXPERIMENT.md` |
| 2026-09-26 | Fiverr gig E13 (virtual staging) | marketplace buyers who already look for staging | new-seller pricing $10 / $25 / $45 converts on Fiverr search | first order within 14 days of going live | impressions → clicks → orders (Manage Orders), net after 20 % | $0 cash; fee only on sales | live 26 Sep; 0 impressions, 0 orders |

## Snapshot — 2026-09-26 22:00 UTC+2 (last 30 days, `/admin/analytics`)

| Metric | Value | Note |
| --- | --- | --- |
| Gross revenue | **$0** | Stripe live since 18:50; no real payment yet |
| Paid orders / customers | 0 / 0 | Fiverr Manage Orders: 0 |
| Visits / sessions | 492 / 32 | almost all operator + owner testing; Google Ads published 22:15 (in review), Fiverr gig live |
| Funnel (intake started → checkout → paid) | 3 → 7 → 0 | the checkouts were test and sandbox verifications |
| Free-tool uses | 3 | fair-housing checker + pricing calculator |
| Free staging previews | 1 | 1 session went on to checkout (operator test) |
| AI spend | $0.35 | tests only |
| Profit estimate | −$0.35 | plus the fixed Railway plan |

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
