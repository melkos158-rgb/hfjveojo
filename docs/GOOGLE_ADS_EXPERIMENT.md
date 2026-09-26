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
| Name | E8 Virtual Staging - Search - US |
| Type | Search, created without goal guidance. **Not** Performance Max: the new-account wizard pushes PMax, but it spreads money over YouTube, Display and Gmail. |
| Networks | Google Search only (Search partners off, Display off) |
| Location | United States — "presence: people in or regularly in". US agents are the buyers; AB 723 disclosure copies fit California. |
| Language | English |
| Budget | €6/day for 5 days = €30 (the prepaid balance) |
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

Two responsive search ads. Every claim is true on the live site:
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
- Upload an empty room photo and get 2 realistic staged versions. $15 per photo.
- Only furniture and decor are added. Walls, floors and windows stay as photographed.
- See a free watermarked preview of your own photo before you pay. 6 styles.
- Copies labeled "Virtually staged" included for MLS and California AB 723 disclosure.

**URLs:**
- Final URL: `https://orvionis.com/tools/virtual-staging`
- Display path: `orvionis.com/virtual-staging/per-photo`
- Final URL suffix: `utm_source=google&utm_medium=cpc&utm_campaign=e8_vs_search_us&utm_term={keyword}&utm_content={creative}&exp=e4-virtual-staging`

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

Account and billing are done. The Search campaign is being configured.

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

## LAST COMPLETED ACTION

Campaign wizard: business step (ORVIONIS, `/tools/virtual-staging`), then "no guidance" → Search → name → goals → Continue.

## NEXT EXACT ACTION

Campaign settings:
1. Networks: Search only.
2. Location US, language English.
3. Budget €6/day, bidding Maximize clicks with a €1.50 max CPC.
4. Keywords and negatives as above.
5. The 2 RSAs.
6. Final URL suffix.
7. Review, then publish. Publishing may need the owner's click.

## TIMESTAMP

2026-09-26 21:15 UTC+2
