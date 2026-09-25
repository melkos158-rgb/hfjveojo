# AI CEO layer

The "AI CEO" is a reporting and recommendation loop, not an autonomous spender. It sees aggregates only (never customer PII), writes down what it concludes, and a human executes anything irreversible.

## Daily report (06:10 UTC, worker; or `npm run ceo:report`; or `/admin/analytics` → Generate)

1. `computeKpis()` (src/lib/analytics/kpi.ts) computes the day and the previous day: visits, funnel, paid, revenue, refunds, AI cost, channel cost, founder hours, gross contribution, conversion, delivery time, feedback, by tool, by channel.
2. Running experiments and unhandled feedback are attached.
3. A cheap-tier model writes `SUMMARY` + 3 ranked `ACTIONS`, instructed to separate facts from hypotheses and to say when numbers are too small to conclude.
4. Stored in `CeoReport`, emailed to `ADMIN_EMAILS`, shown on `/admin`.

## Weekly review (Monday)

Same pipeline with `period=WEEKLY`. The founder answers, in `/admin/experiments`:
- Which experiment produced money? (facts)
- What was the real cost per order (AI + channel + hours)?
- What is the single highest-leverage action for next week: sell more of the winner, automate its most expensive step, or start the next experiment?
- What gets killed?

## Resource allocation rules

- Founder hours go to: 1) delivering paid orders on time, 2) outreach for the running experiment, 3) automation of a step that cost > 1h/order twice, 4) new tools. In that order.
- AI budget scales with paid orders: raise `AI_DAILY_BUDGET_CENTS` only when the previous day's AI cost per paid order was below 5% of price.
- Marketing spend (paid ads) is unlocked for a tool only when organic/outreach has produced ≥ 5 paid orders and gross contribution per order is known.

## What the AI CEO may do without asking

Read data, write reports, draft content and outreach, flag anomalies (amount mismatches, disputes, failed jobs), recommend price tests. Everything else — refunds, price changes, pausing tools, spending, deleting data, legal wording — is a human action in `/admin` and is audited.
