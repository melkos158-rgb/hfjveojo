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

**The campaign is PAUSED and has never served** (found 2026-09-27 05:10 UTC, read-only):
- the campaign's status icon reads "Призупинено" (paused);
- the ad reads "Не відповідає вимогам · Кампанію призупинено" (not eligible, campaign paused);
- the account banner says "none of your ads are showing: campaigns and ad groups are paused or removed";
- 0 impressions, 0 clicks, €0 spent; billing is fine (€30.00 balance, no cost).

Change history has one event only: the publish batch on 26 Sep at 23:19:05 account time (20:19 UTC), made from the web client. No pause event exists, so the campaign was most likely created paused. The "Enabled, eligible (learning)" reading at 23:04 UTC on 26 Sep was wrong; the campaign status icon is the reliable signal.

Enabling it edits the live campaign, which is the owner's click (safety check). The owner was asked at 05:12 UTC by chat and push, with the negatives and auto-apply off in the same message.

**It is a Google-side restriction, not a normal pause** (2026-09-27 ≈ 12:11 UTC). The owner pressed "Відновити" (Resume) in the campaign diagnostics and got "Сталася помилка. Спробуйте пізніше." His browser console showed:
- `errorCode: CAMPAIGN_ERROR_CANNOT_ACTIVATE_RESTRICTED_CAMPAIGN`;
- `originalErrorMessage: Restricted Campaigns can only be activated by RFA systems.`

No advertiser can lift this, the owner included. Google's own systems or support have to. Google's help says it "may briefly pause and restrict ad spend … to conduct an investigation" and sends an in-account notification (https://support.google.com/adspolicy/answer/9872152).

Next steps for the owner:
1. Read the notifications (bell).
2. Check Admin → Advertiser verification.
3. Otherwise contact Google Ads support by chat with the campaign id and the error code.

**Advertiser verification, 2026-09-28 12:45 UTC** (read-only; the owner completes every step himself):
- **Completed:**
  - the questions about the organization (26 Sep);
  - the EU political-ads declaration, which now reads "don't plan to run EU political ads" (corrected by the owner);
  - the payer question (28 Sep).
- **Open:** "Submit your documents", the last task.
- **The payments profile country is Ukraine (UA)** (Payments → Settings → Payer info). The profile is an individual, MELNYK KOSTIANTYN, with a Ukrainian address, and the country field has no edit control.
  - Google: "You cannot change the country for an existing payments profile." In Google Ads the country changes only through a billing transfer (Payments → "Change payer" / «Змінення платника»), which creates a new profile and restarts verification.
- **Documents for Ukraine:** "Individuals must submit a Ukrainian government-issued photo ID", and the details must exactly match the payments profile.
  - Accepted: international or internal passport, passport card, driving licence, residence card.
  - A Polish karta pobytu or a Polish address would not match.
  - Advised: the Ukrainian international passport (Latin name identical to the profile) and, if asked, the profile address exactly as stored.
- **Organization answers fixed at 13:45 UTC** at the owner's explicit request: legal name MELNYK KOSTIANTYN, and **No** to "manages Google Ads accounts for other organizations". Yes had declared an agency, and "another organization's legal name" had switched the page to the client flow.

**Do not recreate the campaign to get around it:** "circumventing systems" is a policy violation that can suspend the account.

Published 2026-09-26 22:15 UTC+2 (20:15 UTC). Settings were verified on the review page after a full reload:
- Search only, US presence, English;
- 15 keywords, exact and phrase match;
- 1 RSA;
- Maximize clicks capped at €1.50;
- AI Max, text customization and final URL expansion off;
- campaign total €30, 26 Sep – 1 Oct.

## OWNER ACTIONS (pending)

The auto-mode safety check blocks the operator from editing the live campaign ("real-world transactions"). Exact steps were sent to the owner on 2026-09-26 22:20:
0. **Get the restriction lifted** (Resume failed on 27 Sep, `CAMPAIGN_ERROR_CANNOT_ACTIVATE_RESTRICTED_CAMPAIGN`). State on 28 Sep 12:45 UTC:
   - the EU political-ads answer is corrected;
   - the organization answers are corrected (own name, No), done by the operator at the owner's request at 13:45 UTC;
   - still to do (owner only): submit the documents, a **Ukrainian** photo ID (international passport) matching the UA payments profile, started fresh from "Start task".
   - Then wait for Google's review, with support chat if the campaign stays restricted.
   - Once Google lifts it: enable the campaign and extend the end date past 1 Oct if the test lost days.
1. **Negative keywords** (campaign level): Campaigns → E8 → Keywords → Negative keywords → + → paste the list above → Save.
2. **Auto-apply recommendations off:** Recommendations → Auto-apply → untick all → Save.
3. Optional: Final URL suffix (campaign Settings → Campaign URL options).
4. Before the first paid ad order is uploaded: create the conversion action "ORVIONIS paid order" (Goals → Conversions → + New → Import → Track conversions from clicks). Wait 6 h before the first upload.

## METRICS

| Date | Spend | Impressions | Clicks | CTR | CPC | Checkouts | Orders | Revenue | Profit | ROAS | CAC |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-09-26 (to 23:04 UTC) | €0 | 0 | 0 | — | — | 0 | 0 | $0 | $0 | — | — |
| 2026-09-27 (to 05:10 UTC) — campaign paused | €0 | 0 | 0 | — | — | 0 | 0 | $0 | $0 | — | — |
| 2026-09-27 (to 11:05 UTC) — still paused | €0 | 0 | 0 | — | — | 0 | 0 | $0 | $0 | — | — |
| 2026-09-27 (to 17:05 UTC) — restricted by Google | €0 | 0 | 0 | — | — | 0 | 0 | $0 | $0 | — | — |
| 2026-09-27 (to 23:10 UTC) — restricted by Google | €0 | 0 | 0 | — | — | 0 | 0 | $0 | $0 | — | — |
| 2026-09-28 (to 05:10 UTC) — restricted by Google | €0 | 0 | 0 | — | — | 0 | 0 | $0 | $0 | — | — |
| 2026-09-28 (to 11:20 UTC) — restricted by Google | €0 | 0 | 0 | — | — | 0 | 0 | $0 | $0 | — | — |
| 2026-09-28 (to 17:10 UTC) — restricted; verification documents under review | €0 | 0 | 0 | — | — | 0 | 0 | $0 | $0 | — | — |

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
- 2026-09-26 23:04 UTC: read-only check. Eligible (learning), no impressions yet, €0 spent; no negatives in the change history. Owner away until ~1 Oct: daily read-only checks continue.
- 2026-09-27 ~00:20 UTC: landing page `/tools/virtual-staging` updated with the SEO release, **before the first impression** (0 at the last check). New title/description, an FAQ answer "Is this AI virtual staging?", a link to the cost guide; offer, price and order form unchanged. From here the page stays constant until the 1 Oct evaluation.
- 2026-09-27 05:10 UTC (check-in, read-only): **the campaign is paused and has never served.** Evidence: the campaign status icon, the ad status ("campaign paused") and the account banner. Change history holds only the publish batch (no pause event); billing balance €30.00, cost €0. The 23:04 "eligible (learning)" reading was wrong. Owner asked to enable it, plus the negatives and auto-apply off, by chat and push (05:12). The test window shrinks: until he enables it, E8 is not running.
- 2026-09-28 17:10 UTC (check-in, read-only): the campaign table shows E8 with €30 (total), 26 Sep – 1 Oct, 0 impressions, 0 clicks, €0.00. Policy → Account: documents "under review". Nothing for the owner to do until Google decides.
- 2026-09-28 ≈ 14:00 UTC: **the owner submitted the documents** (Ukrainian ID card as "Посвідчення особи державного зразка", which is Google's "passport in card form"; address as in the payments profile).
  - Policy → Account now reads "Submit your documents — Under review: usually takes 3–5 business days", so a decision is expected Thu 1 Oct to Mon 5 Oct.
  - After approval: check whether the campaign restriction is lifted. Then the owner enables E8 and moves its end date (currently 1 Oct) about 7 days past the first serving day, keeping the €30 total.
  - The E8 evaluation moves with it: 7 days of serving or €30 spent, whichever comes first.
- 2026-09-28 ≈ 13:45 UTC (owner's explicit request in chat: "зроби будь ласка", after the operator offered to set "No" and press Submit): the operator corrected the organization answers in Policy → Account.
  - Before: the legal-name question had been switched to "Another organization's legal name". The page then offered "Submit documents for your client" and "who pays for your client's ads", which is the agency flow.
  - After: legal name **MELNYK KOSTIANTYN**, and "doesn't manage Google Ads accounts for other organizations" (**No**) → Submit.
  - Verified by reopening the panel: both answers saved. The page is back to "Submit your documents" and "who pays for your ads".
  - The only open task is "Submit your documents", with a Ukrainian photo ID. The owner uploads it, starting fresh from "Start task", because the "Advertiser Identity" tab he had opened dates from the client-mode state.
- 2026-09-28 12:45 UTC (owner request, read-only): the owner asked where to change the country "Україна" that appears in the verification address form.
  - Found: it is the **payments profile country (UA)**, which cannot be edited; only a billing transfer changes it.
  - Google's Ukraine document page requires a Ukrainian-issued photo ID that matches the profile. So the fix is to keep everything Ukrainian (international passport + the profile address as stored), not to switch to Polish documents.
  - Also found: the organization answer "manages Google Ads accounts for other organizations" = Yes (should be No).
  - The EU political-ads answer is now "don't plan"; the payer question was answered on 28 Sep; "Submit your documents" is the last open task.
  - Sent to the owner with two screenshots (profile country, organization panel). Nothing was clicked or submitted by the operator.
- 2026-09-28 11:20 UTC (check-in, read-only): unchanged. Not eligible · campaign paused; €0; the EU political-ads answer is still "yes".
- 2026-09-28 05:10 UTC (check-in, read-only): unchanged. Still restricted ("not eligible · campaign paused"), 0 impressions, €0. The EU political-ads answer is still "yes".
- 2026-09-27 23:10 UTC (check-in, read-only): unchanged. The ad still reads "not eligible · campaign paused", and the EU political-ads answer is still "yes" (not corrected yet; 01:10 in Poland). No new message: the reminder goes in the next daily summary.
- 2026-09-27 17:05 UTC (check-in, read-only): still restricted. The ad reads "not eligible · campaign paused"; 0 impressions, 0 clicks, €0.
  - The advertiser-verification page now records "You confirmed that you **plan to show political ads in the EU**" (answered by the owner on 27 Sep), and the account summary reads "The account shows EU political ads". That is the opposite of the truth for ORVIONIS, which runs no political ads, and it is not what was advised.
  - The owner is asked to change the answer to "No" (Admin → Policy → Account → "Political advertising in the EU" → "Edit answer"). Then: the campaign's own EU political-ads field, if the settings show one → "No"; Resume; support chat if it still fails.
  - Still open: submit documents (optional-looking, review 1–10 days); the payer question (marked optional).
  - Also completed on 26 Sep: "answered questions about your organization".
- 2026-09-27 ≈ 12:20 UTC: Admin → Policy → Account → "Advertiser verification" lists **open tasks**:
  - the **EU political ads declaration**, a required question under EU regulation, about 1 minute;
  - **submit documents** (advertiser verification; Google reviews in 1–10 days);
  - a required task under the ad-sponsor text, which currently shows "MELNYK KOSTIANTYN".

  Google blocks campaign-management changes while the political-ads question is unanswered: the Ads API fails mutate calls for accounts with undeclared campaigns from 1 Apr 2026 (https://developers.google.com/google-ads/api/docs/api-policy/eu-par). The unanswered declaration is therefore the most likely cause of the restriction; this is not confirmed.

  The owner answers the declaration truthfully (ORVIONIS runs no political ads), completes the other tasks, then retries Resume; support chat if it still fails.
- 2026-09-27 ≈ 12:11 UTC: the owner pressed Resume and it failed with `CAMPAIGN_ERROR_CANNOT_ACTIVATE_RESTRICTED_CAMPAIGN` ("Restricted Campaigns can only be activated by RFA systems"). So Google restricted the campaign, and only Google (its systems or support) can activate it. Owner's next step: notifications, advertiser verification, support chat (a message was drafted for him in EN with a UA translation).
- 2026-09-27 11:05 UTC (check-in, read-only): still paused. The ad reads "not eligible · campaign paused", ad quality "Good", 0 impressions, €0. No reply from the owner yet. As planned, the reminder goes into the 17:03 daily summary, with no second push.

## DISCOVERIES

- Google asked the owner to verify identity ("Підтвердьте свою особу") at the Budget step. Until then the draft did not save ("Не вдалося зберегти зміни").
- The review page summary can be stale after a failed save. It showed "All countries" and AI text automation "on" while the editors showed the right values. Only a full page reload shows the server truth. **Always verify the review after a reload.**
- The wizard's draft keeps keywords, ads, location, AI Max and budget, but not the Final URL suffix.
- The "total campaign budget" option exists for Search. It needs start and end dates, and the budget type is fixed after launch.
- Estimated with US-only targeting: about €0.76–0.87 average CPC. €30 buys roughly 35–40 clicks.
- **Read the campaign status from the status icon** on the Campaigns table (its label, e.g. "Призупинено") or from the ad's status column, never from the status filter chip ("Статус кампанії: Увімкнено, призупинено" lists both states) or the review page. The 26 Sep 23:04 check reported "eligible (learning)" for a campaign that was paused; how that happened is not known.
- The account reports in **GMT+03:00 (Eastern European time)** per the footer, not GMT+2 as noted at setup. Day boundaries in Google's reports are an hour off Poland's.
- In the owner's hidden Chrome window, Google Ads pages render only for a few seconds after a navigation: navigate → screenshot → read in one batch, and open a fresh tab when a tab freezes.
- **The payments profile decides the verification country.** The 26 Sep setup log says "Poland", but the payments profile the account bills to is Ukraine (UA). So the verification forms lock the country to UA and require a Ukrainian-issued ID.
  - The profile country can't be edited (a billing transfer is the only route).
  - Documents must match the profile exactly, per country: https://support.google.com/adspolicy/answer/9872280?co=GENIE.CountryCode%3DUA
- The organization question "manages Google Ads accounts for other organizations" declares an agency when answered Yes; a single business advertiser answers No.

## LAST COMPLETED ACTION

2026-09-28 12:45 UTC, read-only at the owner's request: located the "Україна" in the verification forms. It is the payments profile country, which cannot be edited.
- Advised: keep everything Ukrainian (international passport, profile address as stored), since Google's Ukraine requirements demand a Ukrainian-issued ID matching the profile.
- Advised: change the "manages accounts for other organizations" answer to No.
- Still restricted, €0. The EU political-ads answer is corrected.

Earlier, at 2026-09-27 17:05 UTC: Resume failed for the owner too (`CAMPAIGN_ERROR_CANNOT_ACTIVATE_RESTRICTED_CAMPAIGN`).

## NEXT EXACT ACTION

1. Every check-in: read Policy → Account (documents "under review" since 28 Sep ≈ 14:00 UTC, 3–5 business days) and the campaign status icon, read-only.
   - When verification is approved: see whether Resume is possible (the restriction lifted).
   - Then send the owner the exact clicks: enable the campaign, move the end date ~7 days past the first serving day, €30 total unchanged.
   - Remind only in the daily summary unless the approval arrives, which is worth one message.
2. After the owner enables it: confirm the status icon, then the first impressions and clicks, and the search terms report (add negatives through the owner). Check that the negatives and auto-apply changes are visible.
3. Every day until 1 Oct: fill METRICS (spend, impressions, clicks, CTR, CPC, checkouts, orders, revenue) from Google Ads plus `/admin/analytics` (channel `google`), and apply DECISION RULES.
4. 1 Oct: final evaluation, recorded in GROWTH_EXPERIMENTS.md and BUSINESS_METRICS.md (spend register).

## TIMESTAMP

2026-09-28 12:50 UTC
