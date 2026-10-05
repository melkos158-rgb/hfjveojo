# Fiverr experiment (E13) — persistent state

Read this first when resuming. Then continue from **NEXT EXACT ACTION**.

## CURRENT STATUS

**The gig is LIVE** (Active, published by the owner on 2026-09-26 ≈ 21:30 UTC+2).
- Seller dashboard, last 30 days: 0 impressions, 0 clicks, 0 orders (26 Sep).
- **Manage Orders: 0 in every status** (Priority, Active, Incomplete, Late, Delivered, Completed, Cancelled, Starred), verified again 2026-10-05 12:56 UTC (and at the 4 Oct midday check). Manage Orders is the only source of truth. Inbox, 5 Oct: no new conversations since the 26 Sep phishing wave.
- Inbox: not read on 27 Sep. Fiverr's "It needs a human touch" check appeared on `/inbox` even after a 35-second pause following Manage Orders. The operator never solves it, so the owner reads the inbox. With Manage Orders at 0, no message can be a real order.
- Within an hour of going live, three phishing messages arrived. Two were reported and blocked; see SECURITY INCIDENTS.
- **Impressions since 26 Sep are unknown.** The seller dashboard has been gated for the operator since 29 Sep, so the owner reads it; the number goes here.
- **Gig media kit, ready 2 Oct (not uploaded yet).** The files are in `ORVIONIS_VIDEO_REFERENCES/fiverr/` on the owner's PC:
  - `orvionis_v8_fiverr_gig.mp4`, the gig video: 16:9, 16 s, 6.5 MB, under Fiverr's 75 s / 50 MB limits. It has no URL, no price and no off-platform ask; the only brand text is the ORVIONIS mark and the "Virtually staged by ORVIONIS" chip.
  - `orvionis_fiverr_gig_six_styles.jpg`, a new first gallery image at 1280×769: the empty stock room and its six real staged results.
  - The owner uploads both in Gig → Edit → Gallery and saves. The operator does not edit the gig.
  - 3 Oct 13:00 UTC: the video was re-rendered without the brand name. The photo chip now reads "Virtually staged" instead of "Virtually staged by ORVIONIS", so the gig carries nothing that points buyers off Fiverr; the end card keeps only the mark. Same file name, 6.5 MB.
- **Seller profile fixed 3 Oct** at the owner's explicit request («профіль поправ», twice). Before, it said "3D Modeler · Blender Custom Models by Reference", had a 3D About text, profile strength 7/12 and no portfolio. Buyers see this card next to the staging gig.
  - Title (tagline): "Real Estate Virtual Staging in 6 Styles, 2 Versions per Photo". Fiverr rejects "|" in the tagline, which is why the owner's own save failed.
  - About (490 characters): six styles, two versions, walls, windows, floors and light unchanged, AI-assisted with a check before delivery, and the Blender background in one sentence.
  - Skills: Virtual staging is new and first, then Interior design 3D modeling, 3D rendering and Blender. Hand modeling was removed. All are Intermediate. Fiverr shows skills in the order they were added, so the 3D ones were deleted and re-added after Virtual staging.
  - All three were verified on the public profile at 13:40 UTC. The operator saved them after the owner asked.
  - **Portfolio project "One empty room, six staging styles" is published** (owner's «так», 3 Oct ≈ 13:55 UTC). Portfolio page: 1 project, status Active.
    - 5 images: a 4:3 collage cover, the empty room, then modern, farmhouse and coastal.
    - Industry Real Estate + Residential Real Estate, 1–7 days, started Oct 2026. Category Architecture & Interior Design. Linked to the staging gig (Fiverr doesn't show that link to buyers).
    - Fiverr requires a project cost. The owner chose $45, the gig's Premium price for six stagings. The description ends with: "There was no client, so the cost shown is what six stagings cost on my gig (Premium package)."
    - The description says it is a sample on a free stock photo (Pexels 3958955, Curtis Adams), AI-assisted and unretouched.
    - Operator note: in a hidden tab, one image upload stalled without `filerrAttachmentId`, and Continue silently did nothing. Deleting that image and uploading it again fixed it. When a Fiverr form step won't advance, read the react-hook-form errors instead of clicking again.
  - Work experience was added at the owner's yes: "Virtual Staging Specialist · Self-Employed / Freelancer · Self-employed · Sep 2026 – Present", with a short staging description.
    - The owner had approved "Founder, ORVIONIS". Fiverr requires a website for a new company, though, and the profile never links off Fiverr, so the existing company entry was used and the description leaves out the brand.
  - **Seller profile strength: 9/12** (3 Oct ≈ 14:05 UTC). The missing items are an intro video, education and certifications, and only the owner can supply real ones. No certifications exist to claim.
  - Client (buyer) profile at **100 %** (owner: «треба 100»). It doesn't affect selling.
    - Overview: purpose "Primary job or business", industry Real Estate, and a short text. Fiverr allows only letters, commas, periods and hyphens there, so the text has no "3D", "!" or apostrophes.
    - Preferred hours: Mon–Sun, 10:00–22:00 Europe/Warsaw. The operator picked these after the owner said «сам думай».
    - About your business: ORVIONIS, Owner / CEO, just me, service provider, launch stage. Fiverr shows this block only to the owner, and no website was entered.

## ORDER VERIFICATION RULES (owner, permanent)

1. Fiverr **Manage Orders** is the ONLY source of truth for whether an order exists. Open it directly.
2. Verify that a real order exists; match the buyer and the service.
3. Never trust a buyer's claim that "I already placed an order".
4. Never use a buyer-provided external website to "verify" or "approve" an order.
5. Never enter Fiverr credentials, payment information, API keys or personal information on external websites.
6. Manage Orders shows 0 → the message is suspicious and unverified. **Do no work for an unverified order.**
7. Report and block suspicious messages. Use the message's `…` → Report, choose "communicate outside of Fiverr", tick "Block this user".
8. Keep looking for legitimate Fiverr opportunities.
9. Never report a Fiverr customer or order as acquired unless it is visible in Fiverr's official order system.
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
- [ ] Monitor: impressions → clicks → orders (seller dashboard / Manage Orders), at most once or twice a day. Fiverr shows a bot check when pages are opened quickly.
## BLOCKED
- Nothing blocks the gig.
- **Human-only:** Fiverr's "It needs a human touch" press-and-hold check (seen on `/inbox`, 2026-09-26 ≈ 22:00). The owner solves it; the operator never does.
## FIVERR ACCOUNT STATUS
Active seller account, `https://www.fiverr.com/users/kostia_melnyk/seller_dashboard`

## SELLER STATUS
New seller, no reviews, profile 8/12

## GIG STATUS
Active (live). 0 impressions / 0 clicks / 0 orders in the first hour.
## GIG URL
`https://www.fiverr.com/kostia_melnyk/do-realistic-virtual-staging-of-your-empty-real-estate-photos` (from the gig slug; the public page was not opened, to avoid Fiverr's bot check).

## SECURITY INCIDENTS

2026-09-26 21:44–21:59 UTC+2 — a phishing wave, typical for newly published gigs. All three accounts were created in Sept 2026. **Manage Orders = 0**, so every claim was false. Links are defanged here and were not opened.

| Buyer account | From | Message | Link | Action |
| --- | --- | --- | --- | --- |
| primemaple299 | United Kingdom | "My order for your service has already been placed, and I'm currently awaiting your approval" | `dongtai-industry[.]com` | reported + blocked (22:05) |
| w0ng_v_175 | United Kingdom | "My order for your service has been placed successfully… Please check all required details" | `gloc-tourtech[.]com` | reported + blocked (22:08) |
| jake_ilj_03906 | Chile | "Please go through everything and complete it soon." (inbox preview) | — | the thread shows no messages, so there is nothing to report; unverified, no work done |
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
- **Scam wave after publishing:** fake "order placed, approve at <link>" messages arrive within an hour of a gig going live. They come from brand-new accounts and look professional. Manage Orders settles it in seconds.
- **Reporting UI:** the per-message `…` menu has Reply / Save / Move to spambox / Report. Report → reason → Next → "Report this user" + "Block this user" → Submit. The first-conversation banner also has a Report button. In the hidden window the React `onClick` of the menu `li` has to be called directly, followed by a screenshot to render.
- **Bot check:** several quick navigations (manage_orders → inbox) triggered PerimeterX "It needs a human touch". Keep Fiverr visits few and slow.

## DECISIONS
- 2026-09-26: launch one focused gig (virtual staging) instead of several. The paused 3D-modeling gig is left untouched; it is the owner's.
- 2026-09-26: prices $10 / $25 / $45 (Fiverr's $5 steps); delivery 2 / 2 / 3 days; no extra-fast delivery until the fulfilment routine is proven.

## FULFILMENT (once an order arrives)
Follow `docs/FIVERR_GIG.md` → "Fulfilment through ORVIONIS":
1. Download the buyer's photos from Fiverr.
2. Create the order in `/admin/orders/new` (channel Fiverr, buyer price, 20 % fee, Fiverr order no.).
3. Download the ZIP, **look at every image**, then deliver on Fiverr.

## LAST COMPLETED ACTION
2026-10-03 12:58 UTC (midday check-in): **Manage Orders shows 0 in every status** (Priority, Active, Incomplete, Late, Delivered, Completed, Cancelled, Starred). One page view; no human check. The owner was active on Fiverr himself (profile editing).
2026-10-02 12:58 UTC (midday check-in): **Manage Orders shows 0 in every status** (Priority, Active, Incomplete, Late, Delivered, Completed, Cancelled, Starred). One page view; the bell shows a notification dot, left for the owner.
2026-10-01 23:16 UTC (the 11:03 check was missed while the session was idle, so it ran at night): **Manage Orders shows 0 in every status** (Priority, Active, Incomplete, Late, Delivered, Completed, Cancelled, Starred). One page view, no other Fiverr page opened. The bell shows a notification dot, left for the owner.
2026-09-30 12:35 UTC (the owner was back online): **Manage Orders shows 0 in every status** (Priority, Active, Incomplete, Late, Delivered, Completed, Cancelled, Starred).
2026-09-30 11:05 UTC: **not checked.** The owner's computer was off (no Chrome extension, no device bridge, retried). Fiverr notifies the owner of any order directly. The next look is at the next check-in that finds Chrome connected.
2026-09-29 11:25 UTC: **Manage Orders shows 0 in every status** (Priority, Active, Incomplete, Late, Delivered, Completed, Cancelled, Starred). After a 40-second pause the seller dashboard showed Fiverr's human check ("It needs a human touch"), which was left for the owner. From now on the operator opens **Manage Orders only**, since both the inbox and the dashboard are gated for its visits. The owner reads impressions and messages himself.
2026-09-28 11:20 UTC: Manage Orders shows 0 in every status. `/inbox` showed Fiverr's human check again, after a 45-second pause; it was left for the owner. The inbox is gated for the operator's visits every time, so from now on the second page is the seller dashboard (impressions / clicks), not the inbox.
2026-09-27 11:05 UTC: Manage Orders shows 0 in every status. The inbox was behind Fiverr's human check, which was left for the owner. (26 Sep 22:20 UTC+2: gig verified Active, two phishing senders reported and blocked, owner's order-verification rules recorded.)
## NEXT EXACT ACTION
1. Once a day at the 11:03 UTC check-in: **Manage Orders only** (the only order truth). The inbox (27–28 Sep) and the seller dashboard (29 Sep) both showed Fiverr's human check for the operator; the owner reads them. If the check shows anywhere, stop and leave it for the owner.
2. For any new inbox message, apply ORDER VERIFICATION RULES first. Replies to real buyers are drafted and sent only with the owner's approval.
3. After 14 days live or 300 impressions: review pricing hypothesis H1.
4. When a real order is delivered, ask the buyer's permission before adding it to the portfolio. Until then, the stock-photo sample is the only project.
## TIMESTAMP
2026-10-05 12:56 UTC
