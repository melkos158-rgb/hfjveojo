# Decision log

Every entry records: date, the decision, why, the alternative that was rejected, and what would change the decision. Newest first.

| Date | Decision | Why | Rejected alternative | Revisit when |
| --- | --- | --- | --- | --- |
| 2026-09-26 | **Acquisition before new tools.** Four tools are live and nobody has seen them yet | 0 real visitors so far; a fifth tool adds nothing without traffic | building more automated tools | the first 5 paid orders arrive, or 14 days of outreach bring 0 |
| 2026-09-26 | Official brand mark everywhere, derived from the owner's master only (`docs/BRAND.md`) | one recognisable identity across site, Stripe, email and icons | a separate simplified icon for small sizes | a designer supplies a vector version |
| 2026-09-26 | Stripe live with the live key in `STRIPE_SECRET_KEY` (recognised by prefix) and `STRIPE_MODE=live` | the owner's setup; the code treats keys by prefix, so it is safe | forcing a variable rename before launch | the owner wants admin sandbox tests again (move the live key to `STRIPE_LIVE_SECRET_KEY`, restore the sandbox key) |
| 2026-09-26 | Missing Stripe key → checkout fails closed with "try again", plus an hourly admin alert | never charge without a working webhook; never show internals | falling back to the other mode's key | — |
| 2026-09-26 | Multi-room staging: up to 6 photos per order at $15 each (Stripe line quantity) | a vacant listing has 4–6 empty rooms; one photo per checkout was friction | volume discounts | AOV data from 10+ orders |
| 2026-09-26 | Pipeline runs hold a heartbeat lease; shutdown hands the order back | a deploy mid-fulfilment stranded orders in PROCESSING | longer stale timeouts only | — |
| 2026-09-26 | Price anchor on the staging page = sourced incumbent prices ($23–37 per photo, 24–48 h; BoxBrownie US$30/48 h) | honesty; the old "$25–75" had no source | no anchor | prices change (check quarterly) |
| 2026-09-26 | Free watermarked staging preview, capped at 15/day, 2 per IP and 40 % of the AI budget | let the visitor judge the result on their own room | free first order | the preview → checkout rate is known |
| 2026-09-26 | GA4 only as the marketing view; the first-party database is the business truth | GA sampling, consent loss, ad blockers | GA as the source of revenue | — |
| 2026-09-25 | Sell finished results, not "AI"; every tool is one `ToolDefinition` file | clear offers; adding a tool costs one file | a generic AI chat or credits UI | subscription or credits signals in the data |
| 2026-09-25 | One-time payments first (no subscriptions or credits yet) | retention is unproven; simplest checkout | a subscription at launch | ≥ 30 % repeat buyers within 30 days on any tool |
| 2026-09-25 | Hosted Stripe Checkout with inline prices (no Price IDs, no Stripe.js) | prices live in our database; no client secrets | Stripe Elements | a custom checkout UX is needed for conversion |
| 2026-09-25 | Jobs on Postgres with an embedded worker loop; files in Postgres until volume grows (R2 ready) | no extra Railway services; small volumes | Redis/BullMQ, S3 on day 1 | > 100 staging orders/month (storage) or job backlog |
| 2026-09-25 | No CAPTCHA/Turnstile until abuse appears: honeypot + rate limits, and Stripe is the paywall | fewer steps for real buyers; no abuse seen | Turnstile on every form | abuse in the logs: form spam, preview farming |
| 2026-09-25 | Concierge first where automation is weak (Listing Clips: a human edits) | fastest path to a real payment | automated video editing before demand exists | ≥ 3 paid clip orders → automate overlays |
| 2026-09-25 | One repo, one Railway project, one Stripe account; secrets only in Railway Variables | owner rule; no duplicated infrastructure | — | — |
