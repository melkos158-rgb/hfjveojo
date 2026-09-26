# Business metrics

Only real numbers go here. Source of truth: `/admin/analytics` and the daily CEO email, both computed from our own database. Test orders are excluded everywhere: admin pipeline tests, sandbox checkouts, `isTest`. GA4 is the traffic view once `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.

## Snapshot — 2026-09-26 19:30 UTC+2 (last 30 days)

| Metric | Value | Note |
| --- | --- | --- |
| Gross revenue | **$0** | Stripe live since 18:50 today; no real payment yet |
| Paid orders / customers | 0 / 0 | |
| Visits / sessions | 482 / 29 | almost all operator + owner testing; no outreach or ads have run yet |
| Funnel (intake started → checkout → paid) | 3 → 7 → 0 | checkouts are test and sandbox verifications |
| Free-tool uses | 3 | fair-housing checker + pricing calculator |
| Free staging previews | 0 | the real-model preview has never run in production |
| AI spend | $0.29 | pipeline tests only |
| Profit estimate | −$0.29 | + Railway plan (fixed) |

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
