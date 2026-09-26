# Legal and privacy flags (for human verification, not legal advice)

The code and pages ship with reasonable defaults. The items below still need a decision, or a professional's confirmation, before or shortly after launch.
- Placeholders are marked `VERIFY` in `src/config/site.ts`.
- The legal pages show an amber "Draft for human verification" banner until every `VERIFY` value has been replaced.
- **Never fill a placeholder with a guess.**

## Privacy audit — 2026-09-26 (`/privacy` against the production implementation)

**Method:**
- The whole codebase was read for every place personal data is collected, stored, sent or deleted.
- Production configuration was checked through Railway variable **names** (no values were read or copied) and `/admin/system`.
- Every sentence of `/privacy` now maps to code.

### Production facts

| Setting | Production |
| --- | --- |
| AI provider | `AI_PROVIDER=openai`. There is **no** `ANTHROPIC_API_KEY`, so Anthropic never receives data. Image edits always go to OpenAI. |
| File storage | `STORAGE_BACKEND=db`: files live in Postgres on Railway. No S3/R2 variables. |
| File retention | `FILE_RETENTION_DAYS_*` not set → defaults: 90 days for outputs, 30 for inputs. |
| Google Analytics | `NEXT_PUBLIC_GA_MEASUREMENT_ID` **not set** → GA is not loaded at all. |
| Email | `EMAIL_PROVIDER=resend`. |
| Sign-in | Email magic link and Google (`GOOGLE_CLIENT_ID` set). |
| Payments | Stripe live. |
| Error tracking | `SENTRY_DSN` not set; Sentry isn't wired in the code either. |
| Cloudflare Turnstile | `TURNSTILE_*` variables exist, but **no code uses them** (Ride Lab leftovers), so there is no Cloudflare processing. |
| Hosting | App on Railway, region EU West. Domain DNS and email forwarding (`hello@`, `dmarc@`) at Namecheap. No external fonts or CDNs, and no third-party scripts unless GA is enabled. |

### Data inventory (what the implementation does)

| # | Area | Implementation |
| --- | --- | --- |
| 1 | Personal data collected | Order email, name, form answers (property details, agent name, brokerage, social handle, studio/business details), uploaded photos/logos, footage links, contact-form message + optional email, order feedback, sign-in email/name. |
| 2 | Database | `User`: email, name, role, `stripeCustomerId`, last login. `Order`: email, name, intake JSON, attribution JSON incl. gclid, access/public tokens. `Payment`: minimal raw `{sessionId, livemode}`, fees, receipt URL. `StripeEvent.payload` holds the **full Stripe event JSON**. `Event`: session id, user/order id, path, referrer, utm, props, IP hash, user agent. `Feedback`: email, text. `MagicLinkToken`: email + token hash. `AiRequest`: metadata only, no content. `ErrorLog`: message, stack, context. `RateLimit`: keyed IP hash in the key. |
| 3 | Uploads | `/api/uploads` stores images (sniffed, ≤ 8 MB) as `File` rows (kind INPUT) in Postgres; original bytes, including any EXIF. |
| 4 | Retention and deletion | `putFile` sets `expiresAt`: inputs 30 days, outputs 90. When an upload is attached to an order, its `expiresAt` is reset to **90 days from the order**. The hourly `maintenance` job deletes expired files and unlinks outputs. Text results (`GeneratedOutput.content`), orders, payments, Stripe events, events, feedback, users and tokens have **no deletion**. Rate-limit rows: pruned after 24 h. |
| 5 | Stripe | Hosted Checkout (card data never reaches us); `customer_email`, `receipt_email`, and the order link in the PaymentIntent description. Webhook events stored in full (see #2). Customer details (name, email, billing address/country) come in `checkout.session.*`; card brand, last4, expiry and country in `charge.refunded` / `payment_intent.payment_failed`. |
| 6 | Google sign-in | OIDC scope `openid email profile`. Stores email + name (unverified emails rejected); `sub` and picture not stored. Cookies: `orv_google_state` (10 min), `orv_auth_evt` (60 s). |
| 7 | Email (Resend) | Magic links, order confirmation (order link + receipt link), delivery emails, admin alerts including tool requests. The code enables no open/click tracking. |
| 8 | OpenAI | Order prompts built from intake fields (no account email, no payment data); staging photos rotated, resized ≤ 2048 px and re-encoded (EXIF not sent). Automated QA on generated text. Free preview sends the photo before payment and stores nothing. Daily CEO report: aggregate KPIs + up to 5 unhandled feedback texts (≤ 200 characters each). |
| 9 | Anthropic | Code path exists (fallback) but is inactive: no key in production. |
| 10 | Google Analytics 4 | Loaded only when `APP_ENV=production` and a valid `G-` id is set; **not set now**. When on, Consent Mode v2 applies (see VERIFIED). |
| 11 | Google Ads / gclid | The middleware validates gclid/gbraid/wbraid (format) into the `orv_attr` cookie (90 days) and the order attribution. The admin CSV (`/api/admin/ads/google-conversions`) has gclid, conversion name, paid time, value and currency, for manual upload. **No Google tag on the site** (by decision). |
| 12 | Cookies | `orv_session` (sign-in, TTL `SESSION_TTL_DAYS`); `orv_sid` (random ID, 180 d, all visitors); `orv_attr` (90 d, when a campaign param or external referrer is present); `orv_internal` (admin devices, 1 y); `orv_google_state`; `orv_auth_evt`. localStorage: `orv_consent`, `orv_analytics`, `orv_ga_*`. `_ga*` only with GA on. |
| 13 | Consent mechanism | Without GA: an informational notice ("Got it"). With GA: "Accept Google Analytics" / "Decline", which affects GA `analytics_storage` only. `orv_sid` / `orv_attr` are set regardless. |
| 14 | IP addresses | Used for rate limits (sign-in, uploads, orders, ZIP, previews, requests) and in analytics events: now **keyed hashes only** (see D4). Railway handles IPs for routing and its own logs. |
| 15 | Analytics identifiers | `orv_sid` → `Event.sessionId`, linked to `userId` / `orderId` when signed in or ordering. The GA client id only with GA on. |
| 16 | Admin / user data | Admins = `ADMIN_EMAILS` + ADMIN role (middleware-enforced). Admins can see all orders, intake and files. `AdminAction` audit log. |
| 17 | Processors / recipients | Railway (hosting + database), Stripe, OpenAI, Resend, Google (sign-in; Ads conversion upload; GA only if enabled), Namecheap (email forwarding), Fiverr (independent platform for marketplace orders). |

### Discrepancies found and how each was resolved

| # | The old policy said | Production actually did | Resolution |
| --- | --- | --- | --- |
| D1 | AI providers are "OpenAI, and Anthropic as a fallback" | Anthropic key not configured, so it is never used | Policy: OpenAI only. **If `ANTHROPIC_API_KEY` is ever added, update `/privacy` first.** |
| D2 | Payment data = "status, amount and a receipt link" | Full Stripe events are stored: name, email, billing details; card brand/last4/expiry/country for refunds and failures | Policy corrected. Minimisation → SHOULD FIX. |
| D3 | Account data = "email and sign-in timestamps when you use a sign-in link" | Google sign-in too. Name stored (from Google, the order form or Stripe checkout) | Policy corrected. |
| D4 | "IP addresses are stored only as a truncated hash" | Raw IPs sat in `RateLimit` keys (auth, zip, upload, order, preview) for ~24 h. The event hash was a plain SHA-256, reversible for IPv4. | **Code fixed:** keyed HMAC-SHA256 (`hashIp`, server secret) for every rate-limit key and event. Maintenance nulls the older event hashes and drops raw-IP rate-limit rows for 7 days (`dropLegacyIpData`). Tests: `tests/privacy.test.ts`. |
| D5 | "an anonymous session id"; the notice said "count visits without identifying you" | `orv_sid` is a 180-day ID linked to account/order events | Policy and notice now say "random visit ID", linked when you sign in or order. |
| D6 | Usage data didn't mention the user agent or referrer | Events stored the user agent and the **full referrer URL** | **Code fixed:** referrer stored as origin only (`referrerOrigin`). Policy mentions the user agent and referring site. |
| D7 | "Delivered files 90 days, uploaded inputs 30 days" | Uploads attached to an order are kept 90 days from the order. Text results stay in the order record. | Policy states the implemented behaviour exactly. |
| D8 | "Order records and invoices are kept as long as accounting and tax rules require" | No deletion is implemented, and we issue no invoices (Stripe receipts only) | Policy: "not deleted automatically at the moment … ask us to delete". Periods → SHOULD FIX (none invented). |
| D9 | Cookies: "Essential cookies: session, attribution, anonymous session id" | `orv_sid` / `orv_attr` are statistics/marketing cookies set for all visitors. `orv_google_state`, `orv_auth_evt`, `orv_internal` and the localStorage keys were unlisted. | Policy lists every cookie and storage key with its lifetime, and says the notice choice covers GA only. Consent question → MUST FIX. |
| D10 | GA: cookies set in the EEA only after "Accept analytics"; elsewhere an "Essential only" opt-out | GA is off in production. When on (advanced Consent Mode) Google gets cookieless pings before consent. "Essential only" was misleading because first-party cookies are set anyway. `gaOnce` wrote localStorage even with GA off. | Policy says GA is currently off, mentions cookieless pings, and states the rest accurately. Buttons renamed "Accept Google Analytics" / "Decline". **Code fixed:** `gaOnce` does nothing while GA is off. |
| D11 | AI receives "the content of your order form" | Also staging photos, free-preview photos before payment, generated text for QA, and the daily internal report with feedback texts | Policy corrected. |
| D12 | — | The public disclosure page (unguessable link, noindex) shows the original photos until they are deleted (90 days) | Policy section added. |
| D13 | — | Contact / tool-request form and order feedback stored; admins emailed | Policy bullet added. |
| D14 | Railway "EU/US regions" | App runs in EU West; database region not verified | Policy names the app region only. DB region → SHOULD FIX. |
| D15 | — | Namecheap forwards mail sent to the support address | Listed as a recipient. |
| D16 | — | Marketplace (Fiverr) orders go through the same pipeline | Policy bullet added. |
| D17 | — | International transfers were not mentioned (OpenAI, Resend, Stripe, Google and Railway are US-based companies) | Policy says data may be processed in the US. Safeguard = placeholder `site.legal.transfersNote` (VERIFY). |
| D18 | — | `orv_sid`, `orv_attr`, `orv_internal` and `orv_auth_evt` lacked the Secure flag | **Code fixed:** Secure over HTTPS (`x-forwarded-proto`) / in production. `/api/admin/request-info` shows `forwardedProto` for verification. |

## Checklist

### MUST FIX BEFORE LAUNCH (owner or professional input; never fabricate)

- [ ] **Legal entity name, registered address, country:** `site.legal.entityName` / `address` / `country`. If ORVIONIS sells under the owner's Polish sole proprietorship, use that identity exactly as registered.
- [ ] **VAT / NIP:** not shown anywhere yet. Add it to the site config and legal pages if required.
- [ ] **Governing law and venue:** `site.legal.governingLaw` (Terms).
- [ ] **Supervisory authority:** the policy says "your local data-protection authority". Name the lead authority once the controller's country is confirmed.
- [ ] **International transfers:** confirm a DPA with Standard Contractual Clauses or the EU–US Data Privacy Framework for OpenAI, Resend, Stripe, Google and Railway. Then replace `site.legal.transfersNote`.
- [ ] **Consent for first-party cookies in the EEA/UK:** `orv_sid` (statistics, 180 d) and `orv_attr` (campaign/ad attribution, 90 d) are set for every visitor without consent, and the policy says so openly. Decide with a professional:
  - (a) set them only after consent in the EEA/UK/CH, like GA (code change in `src/middleware.ts` + `CookieConsent.tsx`); or
  - (b) keep them under a documented exemption; or
  - (c) shorten them / drop the order and user linkage.
- [ ] **Legal bases per purpose:** the policy names contract performance for orders. Confirm the basis for analytics/attribution, abuse prevention, marketing measurement, AI internal reports and messages (legitimate interest vs consent).
- [ ] **EU consumer withdrawal right for digital content:** see item 2 below.
- [ ] **VAT / OSS on digital services:** see item 3 below.

### SHOULD FIX

- [ ] **Retention periods (not implemented, so none are stated):** decide periods, implement deletion in the maintenance job, then update `/privacy`. Covers:
  - order records (intake, text results) and payment records / `StripeEvent` payloads;
  - analytics events and feedback;
  - users without orders;
  - magic-link tokens and `ErrorLog`.
- [ ] **Stripe event minimisation:** store only the fields the app uses, or clear `StripeEvent.payload` N days after processing.
- [ ] **EXIF:** uploaded photos are stored with their original metadata (possibly GPS and camera serial), and the public disclosure page serves those bytes. Strip metadata at upload (sharp re-encode) or when serving.
- [ ] **Railway database region:** confirm it is EU West (the policy currently names only the app's region).
- [ ] **Resend:** confirm open/click tracking is off in the domain settings.
- [ ] **OpenAI:** review the organisation's API data controls (retention and zero-data-retention eligibility).
- [ ] **Railway variables:** remove unused `TURNSTILE_*`, `ADMIN_PATH`, `ADMIN_RESET`, `SITE_URL` (Ride Lab leftovers).
- [ ] **Terms §5** says copies are kept "for a limited period". True for files (90 days); text results stay in the order record. Align the wording.
- [ ] **Data subject requests:** self-service export and deletion (today by email to the support address).
- [ ] **Google Ads:** the auto-created "Purchase" website conversion action (tag-based) is unused. Mark it secondary or remove it. Measurement is the offline import of paid orders; no Google tag on the site.
- [ ] **If GA is enabled:** consider basic Consent Mode (load gtag only after consent) for the stricter ePrivacy reading (item 8 below).

### VERIFIED (matches production)

- **Card data:** full card numbers and CVC never reach us (Stripe hosted Checkout).
- **Google sign-in:** scope `openid email profile`; only email + name stored; unverified emails rejected; picture not stored.
- **AI:** only OpenAI is active. Prompts carry no account email or payment data. Staging photos are normalised (orientation applied, ≤ 2048 px, re-encoded without EXIF) before sending.
- **Free preview:** the result is returned to the browser and not stored; the upload expires after 30 days unless ordered.
- **Free tools:** the fair-housing checker and pricing calculator run client-side; nothing typed is sent.
- **File deletion:** the hourly maintenance deletes expired files (DB rows and bytes; S3 objects when S3 is used). Outputs 90 d; inputs 30 d, or 90 d from the order.
- **Rate limits:** rows pruned after 24 h; keys hold keyed IP hashes only (since D4).
- **Google Ads:** gclid/gbraid/wbraid accepted only in the Google format. The CSV holds gclid, conversion name, paid time, value and currency; no name, email or files. No Google tag or advertising cookies on the site.
- **GA4 implementation (when enabled):**
  - production only, with a validated `G-` id;
  - Consent Mode v2: ad storage, ad user data and ad personalisation denied everywhere; analytics denied by default in the EEA/UK/CH and granted elsewhere; the saved choice is re-applied;
  - `allow_google_signals: false`, `allow_ad_personalization_signals: false`;
  - page views sent by hand with a sanitised `page_location` (only campaign params kept, order ids collapsed);
  - `purchase` event carries only the order id, amount, currency and item;
  - currently not configured, so none of this runs.
- **Resend:** used only for transactional and admin email.
- **No other third parties:** no Sentry, no external fonts/CDNs, no Cloudflare in the data path.
- **Admin access:** `ADMIN_EMAILS` + ADMIN role checked in the middleware on a signed session; admin actions audit-logged.

## Other legal items (from launch)

| # | Topic | Why it matters | Where |
| --- | --- | --- | --- |
| 1 | **Legal entity, address, governing law** | Terms and Privacy must name the seller. Ride Lab shipped from Chełm, Poland. If ORVIONIS sells under the same sole proprietorship, use that identity. | `src/config/site.ts` → `legal.*` |
| 2 | **EU consumer withdrawal right for digital content** | For EU consumers, the 14-day withdrawal right can be waived only with the consumer's express consent and acknowledgement before delivery starts. The Terms include the acknowledgement. Consider an explicit checkbox in the intake form for EU consumers, or restrict sales to business customers (B2B). | Terms §6; `IntakeForm.tsx` |
| 3 | **VAT / OSS on digital services to EU consumers; US sales tax** | Digital services sold to EU consumers are taxed at the customer's country rate (OSS). US states increasingly tax digital goods/SaaS. Stripe Tax can calculate and collect, but registration obligations remain yours. | Stripe dashboard → Tax |
| 4 | **Invoices / receipts** | Stripe emails receipts. Polish accounting may require invoices (faktura) for business customers; confirm with your accountant. | Stripe Invoicing or manual |
| 5 | **Fair Housing Act (US) advertising rules** | Listing copy must not indicate preference based on protected classes. The pipeline flags risky phrases (`src/lib/tools/qa.ts`) and the prompt forbids them; a human still approves every clip caption. | `listing-clips.ts`, admin review |
| 6 | **Music licensing for clips** | Only royalty-free or licensed tracks may go into deliverables. "Trending audio" must be added by the agent inside Instagram/TikTok (the product copy already says so). | Runbook |
| 7 | **Customer footage rights** | The Terms make the customer responsible for rights to the footage. Keep it that way, and never reuse footage for marketing without written permission. | Terms §4 |
| 8 | **Cookie consent / Google Analytics** | With `NEXT_PUBLIC_GA_MEASUREMENT_ID` set, GA4 runs with Consent Mode v2 (advanced mode: cookieless pings before consent). A stricter reading of ePrivacy would load GA only after consent everywhere; decide with a professional (default in `src/lib/ga.ts`). The first-party cookie question is in MUST FIX above. | `CookieConsent.tsx`, `src/lib/ga.ts`, `/privacy` |
| 9 | **Processors and data transfers** | See the audit above (DPAs, safeguards, regions). | Privacy page |
| 10 | **Refund policy vs card disputes** | The policy promises refunds in defined cases. Disputes are handled in Stripe (`charge.dispute.created` notifies admins). Keep delivery evidence (order page, emails); the system stores it. | Refund page, `/admin/system` |
| 11 | **AI-generated content disclosure** | The Terms disclose AI generation. Some platforms and jurisdictions may require labelling AI-generated marketing content; check before scaling paid ads. | Terms §7 |
| 12 | **Trademark "ORVIONIS"** | Not checked (search engines were blocked). Do a USPTO / EUIPO / UPRP search before spending on the brand. | — |

Nothing in this repository is legal advice. Where a rule was uncertain, the safer behaviour was chosen, and the policy describes what the code does rather than what it might do.
