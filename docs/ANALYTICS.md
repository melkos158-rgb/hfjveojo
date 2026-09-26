# Analytics — two layers, one source of truth

**Money and operations come from our own database** (`/admin/analytics`, daily CEO email): revenue, refunds, Stripe fees, AI cost, orders, conversion, repeat customers, revenue per tool and per acquisition channel. **Google Analytics 4 is the traffic and marketing view** (where visitors come from, which pages lead to checkout). When the two disagree, the database wins.

## Google Analytics 4

- **Switch on:** Railway variable `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-…` (a public id, not a secret) → deploy. GA loads only when `APP_ENV=production` and the id has the `G-XXXX` format; without it nothing Google-related is loaded.
- **Snippet:** rendered by the root layout (`src/app/layout.tsx`, `gaInitScript` in `src/lib/ga.ts`) before hydration, so events from components are never lost.
- **Consent Mode v2:** ad storage, ad user data and ad personalisation always denied; analytics storage denied by default in the EEA, UK and Switzerland until the visitor presses "Accept analytics", granted by default elsewhere with an "Essential only" opt-out. The choice is stored in `localStorage` (`orv_analytics`). Google signals and ad personalisation are off.
- **Privacy:** page URLs are sanitised before GA sees them — query strings are dropped except campaign parameters (`utm_*`, `gclid`, `ref`, `exp`, `variant`) and order ids become `/orders/:id` (order links carry access tokens). `/admin` is never reported. No emails, names, tokens or file URLs are sent.

### Events

| Our moment | GA4 event | Parameters |
| --- | --- | --- |
| page view | `page_view` (sent by hand) | sanitised `page_location`, `page_title` |
| tool page opened ("tool_open") | `view_item` | `currency`, `value`, `items[{item_id: slug, item_name, price}]` |
| order form first touched ("tool_started") | `tool_started` | `tool` |
| free preview asked / shown | `preview_requested`, `preview_shown` | `tool`, `again` |
| free tool used | `free_tool_used` | `tool` |
| checkout started ("checkout_started") | `begin_checkout` | `currency`, `value`, `items` — sent before the redirect to Stripe |
| paid | `purchase` | `transaction_id` = our order id, `value` = amount Stripe charged, `currency`, `items` — once per order per browser, only for real (non-test) paid orders, fired on the checkout success page or the order page |
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

`Event` table (page views, intake starts, previews, checkout, paid, delivered, free-tool uses, downloads, sign-ups), `Order`/`Payment`/`Refund` (money), `AiRequest` (cost per AI call), `ChannelCost` (hours and spend per channel). `/admin/analytics` shows revenue, refunds, estimated Stripe fees, net contribution (revenue − refunds − AI − channel costs − Stripe fees), revenue per founder hour, AOV, customers and repeat rate, AI cost per paid order, conversion (visit → paid, checkout → paid), revenue and AI cost per tool, revenue per acquisition channel, free-tool uses and free previews. Test orders (admin pipeline tests, sandbox checkouts in production) are excluded everywhere.
