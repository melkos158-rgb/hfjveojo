# Fiverr experiment (E13) — persistent state

Read this first when resuming. Then continue from **NEXT EXACT ACTION**.

## CURRENT STATUS

The gig is fully built as a draft: overview, pricing, description, FAQ, requirements, and gallery images uploaded with the declaration ticked.

It is waiting for the owner to click **Save & Continue** on the Gallery step and then **Publish Gig**. The operator is not allowed to make that final save / publish: the auto-mode safety check classes it as a real-world transaction.

## COMPLETED
- [x] Account inspected (2026-09-26 20:05 UTC+2):
  - user `kostia_melnyk`, display name "Melkos";
  - level "New seller", status Available, profile strength 8/12;
  - no active orders, 2 old inbox messages (3 months, unanswered);
  - one PAUSED gig ("create a custom 3d model … in blender", 0 impressions).
- [x] Market research on Fiverr (search "virtual staging", EUR display):
  - 1,200+ gigs;
  - leaders are Top Rated sellers with 1k+ reviews starting at €5–10;
  - premium gigs run €33–134;
  - new sellers price at €10–14.
- [x] ORVIONIS fulfilment for marketplace orders deployed (`/admin/orders/new`, ZIP download) — commit `632cced`, CI and Railway deploy green, page verified in production.
- [x] Gig copy and images prepared (`docs/FIVERR_GIG.md`, `docs/fiverr/*.jpg`, real output of order #6). Image 2 no longer promises "a link to the original": Fiverr deliveries should not point buyers off-platform.
- [x] **Overview** saved (owner approved ticking the license declaration):
  - title "I will do realistic virtual staging of your empty real estate photos";
  - Graphics & Design → Architecture & Interior Design → **Virtual Staging**;
  - metadata: "Other: Individual rooms" and Residential;
  - 5 tags (below).
  - Gig slug: `do-realistic-virtual-staging-of-your-empty-real-estate-photos`.
- [x] **Pricing** saved (below). Fiverr accepts only prices that are multiples of $5, so the H1 plan's $27 / $50 became $25 / $45.
- [x] **Description** (919 / 1,200 characters) + **4 FAQs** saved: structure untouched, best photos, furniture removal, disclosure.
- [x] **Requirements** saved:
  1. Room photos (attachment, required).
  2. Room type of each photo (free text, required).
  3. Style (multiple choice from the 6 styles, one answer, required).
  4. Anything to keep or avoid (optional).
- [x] **Gallery**: 2 images uploaded. Declaration ticked: "materials created by myself or my team". The owner delegated the call; both images are ORVIONIS's own.

## IN PROGRESS
- [ ] Owner: Gallery → Save & Continue → Publish Gig

## BLOCKED
- **Publishing (owner's click).** The operator's Save & Continue on the Gallery step was refused by the auto-mode safety check ("real-world transactions"), so the final save and Publish are the owner's.
  - Where: `https://www.fiverr.com/users/kostia_melnyk/manage_gigs/do-realistic-virtual-staging-of-your-empty-real-estate-photos/edit?wizard=4&tab=gallery`.

## FIVERR ACCOUNT STATUS
Active seller account, `https://www.fiverr.com/users/kostia_melnyk/seller_dashboard`

## SELLER STATUS
New seller, no reviews, profile 8/12

## GIG STATUS
Draft, complete, waiting for the owner's Publish click.

## GIG URL
— (after publishing: `https://www.fiverr.com/kostia_melnyk/do-realistic-virtual-staging-of-your-empty-real-estate-photos`)

## PRICING (hypothesis H1, as saved)

| Package | Name | What | Delivery | Revisions | Price |
| --- | --- | --- | --- | --- | --- |
| Basic | 1 room | 1 photo, 2 versions + MLS-labeled copies | 2 days | 1 | **$10** |
| Standard | 3 rooms | 3 photos, 2 versions each + labeled copies, same style | 2 days | 1 | **$25** ($8.33/photo) |
| Premium | Whole listing: 6 rooms | 6 photos, 2 versions each + labeled copies | 3 days | 1 | **$45** ($7.50/photo) |
| Extra | Additional image | +1 photo | +1 day | — | $10 |

**Extras:**
- Extra-fast delivery is off on purpose: fulfilment is semi-manual (owner or operator online), and a late delivery hurts a new seller more than a lost upsell.
- Object removal, colour changes and commercial staging are not offered: the pipeline doesn't do them.

**Why this price:**
- We can't beat 1k-review sellers at €5, so we compete on 2 versions per photo, the "architecture untouched" promise and AB 723 disclosure copies.
- The volume discount pushes buyers to Standard and Premium.
- Delivery takes ~2 minutes of AI time per photo; the 2–3 day window is buffer for the human step.

**Review:** after 14 days live or 300 impressions, whichever comes first.

**Search tags:** virtual staging, real estate, home staging, interior design, listing photos.

## FIRST ORDER
—

## ORDERS / REVENUE / COST / PROFIT
0 / $0 / $0 / $0

Costs per order: Fiverr fee 20 % + AI ≈ $0.10 per photo + ≈ 5 minutes of handling.

Net per package after Fiverr's 20 %:
- Basic: $8.00
- Standard: $20.00
- Premium: $36.00

## CONVERSION
Impressions → clicks → orders: no data yet

## EXPERIMENT RESULTS
—

## IMPORTANT DISCOVERIES
- **Pricing and positioning:**
  - The category is price-compressed (€5 from Top Rated sellers). The differentiation has to be visible in the thumbnail and the first line of the description.
  - Fiverr has a dedicated service type, Graphics & Design → Architecture & Interior Design → Virtual Staging, so the gig is listed exactly where buyers browse.
  - Fiverr prices must be multiples of $5.
- **Hidden window:** when the owner's Chrome window is minimized or covered, its tabs are "hidden". Timers and animation frames are throttled, so Save buttons and dropdowns can stall.
  - Fix: the owner keeps Chrome restored.
  - What worked meanwhile, for React inputs, selects and tags:
    - the native value setter plus an `input` event;
    - react-select: focus + `mousedown` on the control, then `click` on the option;
    - tags: set the value, then `keydown` Enter;
    - Fiverr "penta" selects: the option list is a portal under `body`, so pick inside the visible `aside.select-penta-design-box`;
    - requirement answer types: call the Select's `onChange({}, label, value)` with value `free_text` | `select` | `file_upload`.
- **Validation errors** show only as icons. Read them from React props: `validations-cell-notification` → `errors`.

## DECISIONS
- 2026-09-26: launch one focused gig (virtual staging) instead of several. The paused 3D-modeling gig is left untouched; it is the owner's.
- 2026-09-26: prices $10 / $25 / $45 (Fiverr's $5 steps); delivery 2 / 2 / 3 days; no extra-fast delivery until the fulfilment routine is proven.

## FULFILMENT (once an order arrives)
Follow `docs/FIVERR_GIG.md` → "Fulfilment through ORVIONIS":
1. Download the buyer's photos from Fiverr.
2. Create the order in `/admin/orders/new` (channel Fiverr, buyer price, 20 % fee, Fiverr order no.).
3. Download the ZIP, **look at every image**, then deliver on Fiverr.

## LAST COMPLETED ACTION
Gallery images uploaded and declaration ticked (21:10 UTC+2). Owner asked to click Save & Continue → Publish Gig.

## NEXT EXACT ACTION
After the owner publishes:
1. Open the live gig page and record the URL + status here.
2. Check the gig appears in search for "virtual staging" (new gigs can take hours).
3. Then monitor the seller dashboard daily: impressions, clicks, orders.

## TIMESTAMP
2026-09-26 21:20 UTC+2
