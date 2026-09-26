# Stripe live — how ORVIONIS takes real money

Owner finished Stripe live onboarding on 2026-09-26. This page is the switch procedure and the audit behind it.
No secret values appear here or anywhere in the repository: keys live only in Railway variables.

## How payments work (audited 2026-09-26)

- **Checkout:** hosted Stripe Checkout, created server-side in `src/lib/orders/create.ts`. The price comes from the `Product` table as inline `price_data` — there are **no Stripe Product or Price IDs** anywhere, so nothing has to be created in the live account and price changes in `/admin` need no Stripe change. No publishable key is used (no Stripe.js in the browser).
- **URLs:** success → `/checkout/success?order=…&t=…` (shows state only, never marks anything paid); cancel → `/checkout/cancel`. Sessions expire after 30 minutes. `receipt_email` + a description with the private order link go on the PaymentIntent, so Stripe's own receipt always carries the order link.
- **Fulfilment happens only from the verified webhook** `POST /api/stripe/webhook`: signature checked on the raw body against every configured signing secret; the event's own `livemode` decides which orders it may touch.
- **Idempotency:** every event is stored in `StripeEvent` first and processed once; the `PENDING → PAID` change is a conditional update in the same transaction as the `Payment` row, so retries, concurrent deliveries or `completed` + `async_payment_succeeded` for one session can never fulfil twice. Stripe IDs (`cs_…`, `pi_…`, `ch_…`) are unique columns for reconciliation.
- **No test/live mixing:** each order stores `livemode` from its Checkout Session. A sandbox event can never mark a live order paid (and vice versa); once `STRIPE_MODE=live`, a sandbox payment on a customer order is ignored and the admin is alerted (only admin test orders may be paid in the sandbox). Refunds go to the account of the order's own mode.
- **No lost payments:** async methods (bank debits) complete the checkout before the money arrives — such orders get `checkoutCompletedAt` and are never auto-closed as abandoned; a payment that still lands on an order closed as abandoned reopens and fulfils it (admin alerted).
- **States:** Order `PENDING → PAID → PROCESSING → (REVIEW) → COMPLETED`, plus `FAILED`, `RETRYING`, `REFUNDED`, `CANCELED`; Payment `SUCCEEDED`, `PARTIALLY_REFUNDED`, `REFUNDED`, `FAILED`. Refunds from `/admin` or the Stripe Dashboard (`charge.refunded`) both update the order.
- **Revenue:** sandbox orders in production are always flagged `isTest` and never count as revenue.

## Variables (Railway → hfjveojo → Variables)

| Variable | Holds | Status |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | sandbox secret key (`acct_1UIuDh2cM37Fu7zW`) | **2026-09-26 16:25 UTC: the owner pasted the live key here** — works (keys are recognised by prefix), but the sandbox is off until its key is back here and the live key moves to `STRIPE_LIVE_SECRET_KEY` |
| `STRIPE_WEBHOOK_SECRET` | signing secret of the sandbox destination | set — leave it |
| `STRIPE_LIVE_SECRET_KEY` | live secret key `sk_live_…` (or a restricted `rk_live_…`) | not set (the live key sits in `STRIPE_SECRET_KEY` for now) |
| `STRIPE_LIVE_WEBHOOK_SECRET` | signing secret of the **live** destination (its own `whsec_…`) | set by the owner, deployed 16:40 UTC — destination `we_1UJyViGsFrMfnr38ljrQ8d6L` (created 16:31 UTC from `/admin/system`, 7 events); **live probe verified 16:42 UTC** (`checkout.session.expired` received and processed) |
| `STRIPE_MODE` | `test` or `live` — which pair customer checkouts use | `test` until the checklist below is green. While it says `test` and no sandbox key is set, checkout answers "try again in a few minutes" (nothing charged) and admins get an hourly alert |

A restricted live key needs: Checkout Sessions *write*, Payment Intents *read*, Charges *read*, Refunds *write*, Webhook Endpoints *write*, Account *read*.

## Switch checklist

1. **Owner:** Stripe Dashboard (live mode) → Developers → API keys → copy the secret key → Railway variable `STRIPE_LIVE_SECRET_KEY` → deploy.
2. **Operator or owner:** `/admin/system` → Live column → **Create webhook destination** (creates `https://orvionis.com/api/stripe/webhook` with exactly the 7 events the code handles: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`). The app never stores the signing secret.
3. **Owner:** Stripe Dashboard (live) → Developers → Webhooks → the new destination → Signing secret → Reveal → Railway variable `STRIPE_LIVE_WEBHOOK_SECRET` → deploy.
4. **Operator:** `/admin/system` → Live column must show: key set, charges enabled, destination enabled with all 7 events, signing secret set. Then **Send probe event (no charge)** — opens and immediately expires a live Checkout Session; the live `checkout.session.expired` must appear as "event received — webhook path verified".
5. **Owner or operator:** Railway variable `STRIPE_MODE=live` → deploy. The admin page badge reads "Customer checkouts: LIVE".
6. **Verify without spending money:** open a tool page, start checkout → Stripe's live page must show the right name, price and ORVIONIS branding (do not pay). Admins get a "pay in the Stripe sandbox" checkbox on the order form: with the test card the whole flow (webhook → fulfilment → emails) runs on the live site without real money.
7. **First real payment** (owner's decision, e.g. the $9 Listing Description) → order page, delivery email, Stripe receipt, `/admin/analytics` revenue.

Status 2026-09-26 16:45 UTC: steps 1–4 done (live key in `STRIPE_SECRET_KEY`, destination, signing secret, probe verified). Waiting for the owner: step 5 (`STRIPE_MODE=live` — the operator's attempt to add it was blocked by the safety classifier as a production change) and the live account's public details (business name and statement descriptor still "jarvis").

Rollback at any time: `STRIPE_MODE=test` (live orders already paid keep working — refunds and events follow each order's own mode).
