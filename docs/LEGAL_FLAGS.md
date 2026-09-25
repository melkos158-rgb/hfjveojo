# Items flagged for human verification (not legal advice)

The code and pages ship with reasonable defaults, but the following require a decision or a professional's confirmation before or shortly after launch. Placeholders are marked `VERIFY` in `src/config/site.ts`; the legal pages show an amber banner until they are replaced.

| # | Topic | Why it matters | Where |
| --- | --- | --- | --- |
| 1 | **Legal entity, address, governing law** | Terms/Privacy must name the seller. Ride Lab shipped from Chełm, Poland — if ORVIONIS sells under the same sole proprietorship, use that identity. | `src/config/site.ts` → `legal.*` |
| 2 | **EU consumer withdrawal right for digital content** | Selling to EU consumers: the 14-day withdrawal right for digital content can be waived only with the consumer's express consent + acknowledgement before delivery starts. The Terms include the acknowledgement; consider an explicit checkbox in the intake form for EU consumers, or restrict to business customers (B2B). | Terms §6; `IntakeForm.tsx` |
| 3 | **VAT / OSS on digital services to EU consumers; US sales tax** | Digital services sold to EU consumers are taxed at the customer's country rate (OSS). US states increasingly tax digital goods/SaaS. Stripe Tax can calculate and collect; registration obligations remain yours. | Stripe dashboard → Tax |
| 4 | **Invoices / receipts** | Stripe receipts are emailed; Polish accounting may require invoices (faktura) for business customers. Confirm with your accountant. | Stripe Invoicing or manual |
| 5 | **Fair Housing Act (US) advertising rules** | Listing copy must not indicate preference based on protected classes. The pipeline flags risky phrases (`src/lib/tools/qa.ts`) and the prompt forbids them; a human still approves every clip caption. | `listing-clips.ts`, admin review |
| 6 | **Music licensing for clips** | Only royalty-free / licensed tracks may be added to deliverables. "Trending audio" must be added by the agent inside Instagram/TikTok (the product copy already says so). | Runbook |
| 7 | **Customer footage rights** | Terms make the customer responsible for rights to the footage; keep it that way, never reuse footage for marketing without written permission. | Terms §4 |
| 8 | **Cookie consent requirement** | The site sets only essential cookies (session, attribution, anonymous id). Whether a banner is legally required for the attribution cookie in your jurisdiction is uncertain — the banner ships anyway. | `CookieConsent.tsx` |
| 9 | **Privacy: processors and data transfers** | OpenAI/Anthropic/Stripe/Railway/Resend are named. Confirm data-processing terms (DPA) with each, and the hosting region on Railway. | Privacy page |
| 10 | **Refund policy vs. card disputes** | The policy promises refunds in defined cases; disputes are handled in Stripe (`charge.dispute.created` notifies admins). Keep delivery evidence (order page, emails) — the system stores them. | Refund page, `/admin/system` |
| 11 | **AI-generated content disclosure** | Terms disclose AI generation. Some platforms/jurisdictions may require labelling AI-generated marketing content; check before scaling paid ads. | Terms §7 |
| 12 | **Trademark "ORVIONIS"** | Not checked in this session (search engines were blocked). Do a USPTO / EUIPO / UPRP search before spending on brand. | — |

Nothing in this repository is legal advice. Where a rule is uncertain, the safer behaviour was chosen (explicit acknowledgement text, essential cookies only, human approval on regulated copy).
