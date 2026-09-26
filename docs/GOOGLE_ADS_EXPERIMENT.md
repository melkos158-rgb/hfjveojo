# Google Ads experiment (E8) — persistent state

Read this first when resuming. Then continue from **NEXT EXACT ACTION**.

**Hypothesis:** people searching for virtual staging / real-estate photo editing will pay for ORVIONIS at $15 per photo.

**Success:** real, profitable paid orders from ad clicks. A paid order is the only conversion that counts, not clicks and not checkouts.

**Failure:** the budget is spent without economically meaningful orders. Then stop, and record what the search terms and landing-page behaviour taught us.

## ACCOUNT

| | |
| --- | --- |
| Account | Google Ads 894-518-6662 "ORVIONIS" (owner's Google account) |
| Settings | billing country Poland · time zone GMT+2 (Poland) · currency **EUR** — all chosen with the owner, permanent |
| Payments | manual (prepaid): **€30.00** paid 2026-09-26 by the owner, Visa ••6918 |
| Spending cap | the prepaid balance: ads stop when it is spent. The owner authorized ≤ €50 total; never add money or another payment method without the owner. |
| Marketing | the "strategist contact" and "promotional emails" questions were answered No |

## CAMPAIGN

| Setting | Value |
| --- | --- |
| Name | E8 Virtual Staging - Search - US (campaign id **24292280138**) |
| Type | Search, created without goal guidance. **Not** Performance Max: the new-account wizard pushes PMax, but it spreads money over YouTube, Display and Gmail. |
| Networks | Google Search only (Search partners off, Display off) |
| Location | United States — "presence: people in or regularly in". US agents are the buyers; AB 723 disclosure copies fit California. |
| Language | English |
| Budget | **Campaign total €30, 26 Sep – 1 Oct 2026.** Google caps a total budget at the amount, and the €30 prepaid balance is a second hard stop. The budget type can't change after launch; the amount can. |
| Bidding | Maximize clicks with a max CPC of €1.50. There's no conversion history yet, so bidding for conversions would be blind. |
| Auto-apply recommendations | off (no automatic budget raises or broad match) |
| AI Max / broad match | off. Keywords are exact and phrase match only. |

### Keywords

Exact and phrase match, high intent:
- virtual staging service
- virtual staging services
- real estate virtual staging
- virtual home staging
- virtual staging company
- virtual staging photos
- virtual staging for real estate
- ai virtual staging
- virtual furniture staging
- [virtual staging] (exact only)

### Negative keywords

software, app, apps, free, jobs, job, career, careers, hiring, salary, tutorial, how to, course, training, diy, download, template, photoshop, blender, 3d model, matterport, virtual tour.

### Ads

One responsive search ad (15 headlines, 4 descriptions, ad strength "Good"). Every claim is true on the live site:
- $15 per photo;
- 2 versions per photo;
- free watermarked preview;
- 6 styles;
- architecture untouched;
- disclosure copies.

**Headlines (≤ 30 characters):**
- Virtual Staging from $15/Photo
- 2 Staged Versions Per Photo
- Stage an Empty Room in Minutes
- Your Walls & Windows Untouched
- Free Watermarked Preview
- Try a Free Preview First
- Modern, Scandi, Farmhouse
- MLS-Ready High-Res JPG
- Disclosure Copies Included
- Virtual Staging Service
- Real Estate Virtual Staging
- Upload a Photo, Get 2 Versions
- No Subscription Needed
- Pay Per Photo, No Contract
- ORVIONIS Virtual Staging

**Descriptions (≤ 90 characters):**
- Virtual staging: upload an empty room photo, get 2 realistic staged versions. $15/photo.
- Only furniture and decor are added. Walls, floors and windows stay as photographed.
- Free watermarked preview of your own listing photo before you pay. 6 staging styles.
- Copies labeled "Virtually staged" included for MLS and California AB 723 disclosure.

**URLs:**
- Final URL: `https://orvionis.com/tools/virtual-staging`
- Display path: `orvionis.com/virtual-staging/per-photo`
- Final URL suffix (intended): `utm_source=google&utm_medium=cpc&utm_campaign=e8_vs_search_us&utm_term={keyword}&utm_content={creative}&exp=e4-virtual-staging`
  - **Not set yet.** The wizard's draft did not persist it, neither at ad nor at campaign level, even with real typing. Owner item: campaign Settings → Campaign URL options.
  - Until then attribution relies on the gclid (auto-tagging), which the middleware stores. Only `utm_term` (the keyword per order) is missing.

## CONVERSION TRACKING

- **First-party (the business truth).** The middleware stores the Google click id (gclid, plus gbraid/wbraid) and `utm_term` in the attribution cookie; a paid ad click replaces an older first touch.
  - Every order keeps that attribution.
  - `/admin/analytics` credits the order to channel `google`.
  - The keyword comes from `utm_term`.
- **Google Ads (reporting).** Offline conversion import, with no Google cookies or tags on the site.
  1. `/admin/analytics` → "Google Ads conversions" → **Download conversions CSV** (`/api/admin/ads/google-conversions`, Google's "conversions from clicks" template). It lists paid, non-test, non-refunded orders with a gclid.
  2. In Google Ads, create the conversion action "ORVIONIS paid order": Goals → Conversions → + New → Import → Track conversions from clicks.
  3. Upload the CSV under Goals → Conversions → Uploads.
  4. Create the action **before** the first click, and upload at least 6 hours after creating it.
- The onboarding wizard auto-created a website "Purchase" action with no tag installed. Leave it secondary or remove it so it doesn't pose as the primary goal.
- **Ad spend** is logged as a channel cost in `/admin/experiments`, so the profit estimate subtracts it.

## STATUS

**Published 2026-09-26 22:15 UTC+2 and in Google's ad review.** Ads start after approval, usually within hours.

Settings were verified on the review page after a full reload:
- Search only, US presence, English;
- 15 keywords, exact and phrase match;
- 1 RSA;
- Maximize clicks capped at €1.50;
- AI Max, text customization and final URL expansion off;
- campaign total €30, 26 Sep – 1 Oct.

## OWNER ACTIONS (pending)

The auto-mode safety check blocks the operator from editing the live campaign ("real-world transactions"). Exact steps were sent to the owner on 2026-09-26 22:20:
1. **Negative keywords** (campaign level): Campaigns → E8 → Keywords → Negative keywords → + → paste the list above → Save.
2. **Auto-apply recommendations off:** Recommendations → Auto-apply → untick all → Save.
3. Optional: Final URL suffix (campaign Settings → Campaign URL options).
4. Before the first paid ad order is uploaded: create the conversion action "ORVIONIS paid order" (Goals → Conversions → + New → Import → Track conversions from clicks). Wait 6 h before the first upload.

## METRICS

| Date | Spend | Impressions | Clicks | CTR | CPC | Checkouts | Orders | Revenue | Profit | ROAS | CAC |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | €0 | 0 | 0 | — | — | 0 | 0 | $0 | $0 | — | — |

## DECISION RULES

- **After 60 clicks with 0 checkouts:** the landing page or offer is the problem. Check the search terms, then change the page or the offer before spending more.
- **Checkouts but no orders:** check the price and trust elements on the page, and the checkout flow itself.
- **Irrelevant search terms:** add negative keywords every day.
- **One keyword produces orders:** move budget to it and add close variants.
- **€30 gone with 0 orders:** stop. Record the search terms and landing-page behaviour, and don't top up without a changed hypothesis.

## LOG

- 2026-09-26: business info entered truthfully:
  - owner's description;
  - services Virtual staging, Real Estate, Interior Design, Photographic & Digital Arts (irrelevant software/electronics categories removed);
  - landing page `/tools/virtual-staging`.
- 2026-09-26: the wizard forced Performance Max. Switched to the expert flow: account without a campaign → EUR/Poland/GMT+2 → billing by the owner (€30 prepaid).
- 2026-09-26: offline conversion tracking built into the site (gclid capture + CSV export). The privacy policy now says purchases by ad visitors may be reported to Google Ads.
- 2026-09-26 21:25–22:15: keywords and the RSA entered, the RSA reaching ad strength "Good". The owner passed Google's identity check.
  - Fixed after a reload: the budget had defaulted to the recommended €22.45/day, and it became a €30 campaign total for 26 Sep – 1 Oct.
  - Verified location US, AI Max off and max CPC €1.50, then **published** (campaign id 24292280138, in review).
- 2026-09-26 22:20: edits to the live campaign blocked by the safety check. Negatives and auto-apply off sent to the owner.

## DISCOVERIES

- Google asked the owner to verify identity ("Підтвердьте свою особу") at the Budget step. Until then the draft did not save ("Не вдалося зберегти зміни").
- The review page summary can be stale after a failed save. It showed "All countries" and AI text automation "on" while the editors showed the right values. Only a full page reload shows the server truth. **Always verify the review after a reload.**
- The wizard's draft keeps keywords, ads, location, AI Max and budget, but not the Final URL suffix.
- The "total campaign budget" option exists for Search. It needs start and end dates, and the budget type is fixed after launch.
- Estimated with US-only targeting: about €0.76–0.87 average CPC. €30 buys roughly 35–40 clicks.

## LAST COMPLETED ACTION

Campaign published and all settings verified. Owner asked to add negatives and turn off auto-apply (22:20).

## NEXT EXACT ACTION

1. After the owner confirms: check that the negatives and auto-apply changes are visible.
2. When the ads are approved: record the approval time. Check the first impressions and clicks, and the search terms report (add negatives through the owner).
3. Every day until 1 Oct: fill METRICS (spend, impressions, clicks, CTR, CPC, checkouts, orders, revenue) from Google Ads plus `/admin/analytics` (channel `google`), and apply DECISION RULES.
4. 1 Oct: final evaluation, recorded in GROWTH_EXPERIMENTS.md and BUSINESS_METRICS.md (spend register).

## TIMESTAMP

2026-09-26 22:25 UTC+2
