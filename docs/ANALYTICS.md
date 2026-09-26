# Analytics — two layers, one source of truth

**Money and operations come from our own database** (`/admin/analytics`, daily CEO email): revenue, refunds, Stripe fees, AI cost, orders, conversion, repeat customers, revenue per tool and per acquisition channel. **Google Analytics 4 is the traffic and marketing view** (where visitors come from, which pages lead to checkout). When the two disagree, the database wins.

## First-party analytics privacy

- IP addresses are stored as keyed hashes only (`hashIp`, HMAC-SHA256 with `SIGNING_SECRET`, 128 bits), in rate-limit keys and in `Event.ipHash`. Never store `clientIp(req)` itself.
- `Event.referrer` keeps the referring site (origin) only, never the full referring URL (`referrerOrigin`).
- `/privacy` describes exactly this; change both together (audit: `docs/LEGAL_FLAGS.md`).

## Google Analytics 4

- **Switch on:** Railway variable `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-…` (a public id, not a secret) → deploy. GA loads only when `APP_ENV=production` and the id has the `G-XXXX` format; without it nothing Google-related is loaded.
- **Snippet:** rendered by the root layout (`src/app/layout.tsx`, `gaInitScript` in `src/lib/ga.ts`) before hydration, so events from components are never lost.
- **Consent Mode v2:** ad storage, ad user data and ad personalisation always denied; analytics storage denied by default in the EEA, UK and Switzerland until the visitor presses "Accept Google Analytics", granted by default elsewhere with a "Decline" opt-out (the choice covers GA only; the first-party cookies `orv_sid` / `orv_attr` are set for every visitor, see `docs/LEGAL_FLAGS.md`). Advanced mode: before consent Google may receive cookieless pings. The choice is stored in `localStorage` (`orv_analytics`). Google signals and ad personalisation are off.
- **Privacy:** page URLs are sanitised before GA sees them — query strings are dropped except campaign parameters (`utm_*`, `gclid`, `ref`, `exp`, `variant`) and order ids become `/orders/:id` (order links carry access tokens). `/admin` is never reported. No emails, names, tokens or file URLs are sent.

### Events

| Our moment | GA4 event | Parameters |
| --- | --- | --- |
| page view | `page_view` (sent by hand) | sanitised `page_location`, `page_title` |
| tool page opened ("tool_open") | `view_item` | `currency`, `value`, `items[{item_id: slug, item_name, price}]` |
| order form first touched ("tool_started") | `tool_started` | `tool` |
| free preview asked / shown | `preview_requested`, `preview_shown` | `tool`, `again` |
| free tool used | `free_tool_used` | `tool` |
| checkout started ("checkout_started") | `begin_checkout` | `currency`, `value`, `items` — sent before the redirect to Stripe; per-photo tools send `quantity` = photos and `value` = unit price × photos |
| paid | `purchase` | `transaction_id` = our order id, `value` = amount Stripe charged, `currency`, `items` (with `quantity` for multi-photo orders) — once per order per browser, only for real (non-test) paid orders, fired on the checkout success page or the order page |
| delivered order viewed ("tool_completed") | `tool_completed` | `tool` — once per order |
| file downloaded | `file_download` | `tool`, `kind` (image, pdf, markdown, link) — never the URL |
| tool request / contact form sent | `generate_lead` | `form` |
| first sign-in / sign-in | `sign_up` / `login` | `method` (email, google) |

Subscriptions do not exist yet (no `subscription_started`).

### One-time settings in GA (owner)

1. Admin → Data streams → web stream → **Enhanced measurement** → Page views → Show advanced settings → turn **off** "Page changes based on browser history events" (we send page views ourselves; otherwise client-side navigations count twice). Also turn off "Form interactions" (noise).
2. Admin → Data streams → **Redact data** → URL query parameters: add `t`, `token`, `session_id` (defence in depth — the code already drops them).
3. Admin → Data settings → Data retention → 14 months. Admin → Data collection → keep Google signals **off**.
4. Admin → Events → mark `purchase` and `generate_lead` as **key events**.
5. Admin → Data filters → add an "Internal traffic" filter for the owner's IP if wanted.

## First-party analytics (authoritative)

`Event` table (page views, intake starts, previews, checkout, paid, delivered, free-tool uses, downloads, sign-ups), `Order`/`Payment`/`Refund` (money), `AiRequest` (cost per AI call), `ChannelCost` (hours and spend per channel). Test orders (admin pipeline tests, sandbox checkouts in production) are excluded everywhere.

`/admin/analytics` (and the daily CEO email):

| KPI | Definition |
| --- | --- |
| Gross revenue | what Stripe actually charged on paid orders (promotion codes included) |
| Refunds | refunds that succeeded in the period |
| Stripe fees | Stripe's **actual** fee per payment from the charge's balance transaction (converted from the settlement currency — PLN/EUR for a Polish account — into the charge currency); payments whose fee is not settled yet are estimated (2.9 % + 30¢) and filled in by the maintenance job; the tile shows "n/n actual" |
| Net revenue | gross − refunds − Stripe fees |
| Revenue after AI | gross − refunds − AI/API cost |
| Profit estimate | net revenue − AI/API cost − channel spend (hours are shown next to it) |
| Orders, AOV, customers, repeat rate | paid non-test orders |
| Conversion | visit → paid (sessions), checkout → paid |
| Per tool | funnel views → form started → free previews → checkouts, then paid, revenue, AI cost, AI per order |
| Per acquisition channel | attributed source (utm_source; `google` for an auto-tagged ad click; else ref or referrer) — visits, paid, revenue. First touch wins, except a Google Ads click (gclid/gbraid/wbraid) replaces it and keeps the old source as `firstTouch` (`src/lib/analytics/attribution.ts`) |


## Google Ads conversions (offline import)

The paid order is the only conversion reported to Google Ads — no Google Ads tag or ad cookies on the site.

1. The ad's final URL suffix adds `utm_source=google&utm_medium=cpc&utm_campaign=…&utm_term={keyword}&utm_content={creative}`; auto-tagging adds `gclid`. The middleware keeps both in the first-party `orv_attr` cookie (a paid click replaces an older first touch) and every order stores it.
2. `/admin/analytics` → **Google Ads conversions** shows how many paid orders came from an ad click in the last 90 days and links the CSV (`/api/admin/ads/google-conversions`, Google's "conversions from clicks" template, UTC). Paid, non-test, non-refunded orders only; `?name=` sets the conversion action name (default "ORVIONIS paid order").
3. In Google Ads: Goals → Conversions → + New conversion action → Import → Track conversions from clicks, named exactly like the CSV; upload under Goals → Conversions → Uploads (≥ 6 h after creating the action; clicks up to 90 days old).
4. Ad spend goes into `/admin/experiments` as a channel cost so the profit estimate is honest. Keyword-level results: group paid orders by `utm_term`.
