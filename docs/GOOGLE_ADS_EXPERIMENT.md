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

software, app, apps, free, jobs, job, career, careers, hiring, salary, tutorial, how to, course, training, diy, download, template, photoshop, blender, 3d model, matterport, virtual tour, what is.

Status 29 Sep 23:10 UTC: **not added yet**. "free home staging software" got a click. "what is" was added to the list after "what is virtual staging" showed.

**Added 30 Sep ≈ 22:05 UTC** at campaign level (broad-match negatives). At the owner's request the operator typed the 23 terms, one per line, into the campaign's negative-keyword panel, and the owner pressed Save himself. 29 and 30 Sep ran without them; 1 Oct, the last day, runs with them. Verified at 22:55 UTC: 23 listed.

Added 30 Sep ≈ 23:10 UTC from the search terms (homeowners who want to rearrange their own room), typed by the operator and saved by the owner: rearrange, rearranging, arrangement, redecorate, redecorating, "my room", "my living room" (the last two as phrase match). Verified 23:58 UTC: 30 negatives.

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

**FINAL EVALUATION, 2026-10-02 05:10 UTC (read-only; numbers unchanged from the 1 Oct 23:05 read).**
- **Result:** €29.98 spent, 248 impressions, 23 clicks, CTR 9.27 %, CPC €1.30. Site channel `google`: 38 page views, **0 intakes, 0 previews, 0 checkouts, 0 paid orders**. Revenue $0, profit −€29.98, ROAS 0; cost per paid order undefined (no order).
- **Search terms (26 Sep – 1 Oct):** the 6 visible clicks (€8.09) all came from homeowner or DIY decor searches: "ai room decorator" (2 clicks), "free home staging software", "rearrange my room virtual", "rearrange my room virtual free", "room reorganizer ai". The realtor-intent queries ("virtual staging", "virtual staging service", "ai virtual staging") got impressions and **no clicks**. Google hides the other 17 clicks (€21.89) as "other search terms".
- **Diagnosis:** phrase-match close variants bought mostly the wrong audience (people redecorating their own room), and the page asked $15 up front. 23 clicks is far below the 60-click rule, so the test cannot say whether search converts for agents; it says this keyword setup attracted consumers.
- **Decision (DECISION RULES):** €30 gone with 0 orders → **stop, no top-up** on the same hypothesis. E8 is closed.
- **Changed hypothesis, ready if the owner wants a second test (E8b, needs his explicit yes):** the page now offers a free first photo with the real before/after on the first screen; keywords become **exact match only** on agent intent ("virtual staging", "virtual staging service", "virtual staging company", "virtual staging for realtors", "real estate virtual staging", "free virtual staging for realtors"); negatives add decorator, decor, rearrange, reorganizer, "my room", app, software, diy. Cap **€20** (the rest of the owner's €50 limit), 5 days, max CPC €1.50. Metric: free photos claimed by `google` visitors; ≥ 2 claims → keep going, 0 claims after ≥ 12 clicks → stop paid search and put the effort into video, groups and SEO. Before it starts: one real free photo through production (owner's email) and the import conversion action "ORVIONIS paid order".

**E8 has ENDED (read 2026-10-01 ≈ 23:05 UTC, read-only).** The campaigns table shows status "Завершено" (ended) and €30.00 total, 26 Sep – 1 Oct.
- **Final totals, 26 Sep – 1 Oct: 248 impressions, 23 clicks, €29.98 of the €30.** CTR 9.27 %, average CPC €1.30, **0 conversions**.
- Last day, 1 Oct (totals minus 26–30 Sep): 107 impressions, 6 clicks, €7.79. CTR 5.61 %, CPC €1.30. It ran with all 30 negatives.
- Google's reports can lag by a few hours. The 05:03 UTC evaluation on 2 Oct re-reads the totals and the 1 Oct search terms.
- The €30 is spent with 0 orders, so DECISION RULES say stop. No top-up without a changed hypothesis. The sale-fix release (free first photo, volume pricing, result-first hero) is that change, and it ships after the ads ended.

**Day 2 complete, read at 2026-09-30 ≈ 22:45 UTC** (account day 30 Sep, GMT+3):
- **104 impressions, 9 clicks, €10.50** (the 26–30 Sep total minus day 1). CTR 8.65 %, average CPC ≈ €1.17.
- 26–30 Sep: 141 impressions, 17 clicks, **€22.19 of the €30**, CPC €1.31, 0 conversions. €7.81 is left for 1 Oct, the last day.
- Site (`/admin/analytics`, channel `google`): 30 page views. No intake, preview or checkout from ad visitors (funnel still 3 → 7 → 0).
- **Negatives added at ≈ 22:05 UTC**, typed by the operator at the owner's request and saved by the owner.
- At this CPC the €30 buys about 23 clicks in total, well short of the 60-click rule in DECISION RULES. The evaluation will say what the clicks and the page behaviour show, not whether search "works".

**First serving day, read at 2026-09-29 23:10 UTC** (account day 29 Sep, GMT+3; "last 30 days" now covers it):
- **37 impressions, 8 clicks, €11.69 spent** (of the €30 total). CTR 21.62 %, average CPC €1.46, close to the €1.50 cap.
- Site (`/admin/analytics`, channel `google`): 18 page views. No intake, preview or checkout from ad visitors (funnel still 3 → 7 → 0).
- Search terms, 4 visible:
  - "free home staging software": 1 click, €1.48. A DIY-software search, so **the planned negatives are not in place**.
  - "what is virtual staging", "free virtual staging for realtors" and "room staging": 1 impression each, 0 clicks.
  - Google hides the rest as "other search terms": 7 clicks, 33 impressions, €10.21.
- Pace: €11.69 in about 9 hours. With the end date still 1 Oct, the remaining €18.31 will go on 30 Sep – 1 Oct.
- Asked of the owner (chat message and an owner-update email):
  - add the negative list, plus "what is";
  - the end date now matters less than the negatives.

**E8 is enabled and serving (2026-09-29 17:05 UTC, read-only).** The owner enabled it at about 11:45 UTC.
- Campaigns table: green status dot, "Відповідає вимогам" (eligible), €30 total, dates still **26 Sep – 1 Oct**. An account alert reads "1 campaign will end soon".
- First ad traffic, from `/admin/analytics`: channel `google` (first touch = a Google Ads click id) shows **3 page views**. Sessions rose by 2 since 11:25 UTC, and Virtual Staging views by 2 since 05:10. No new intake, preview or checkout (funnel still 3 → 7 → 0).
- Google's own numbers were not readable. The table held a 26–28 Sep range, and the date picker ignored every click in the hidden window. Google's reports are not real time either.
- Still pending from the owner: move the end date to 6 Oct, or the €30 is paced into the two days left.

**Advertiser verification PASSED on 2026-09-29** (seen 11:25 UTC). Policy → Account lists every task as completed: the organization questions, documents "submitted 29 Sep", EU political ads "no", the payer. The disclosure card reads "Advertiser identity verified · MELNYK KOSTIANTYN · UA".
- The campaign is still **paused** (ad: "Не відповідає вимогам · Кампанію призупинено", quality "Good"), and its end date is still 1 Oct.
- The owner was asked by chat and push at 11:30 UTC for three things:
  - move the end date to **6 Oct 2026** (Settings → Other settings → Start and end dates), keeping the €30 total;
  - **enable** the campaign;
  - turn auto-apply recommendations off.
- The E8 final evaluation is rescheduled to **7 Oct 05:03 UTC**. If enabling still fails, the next step is Google Ads support.

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
1. ~~**Negative keywords** (campaign level): Campaigns → E8 → Keywords → Negative keywords → + → paste the list above → Save.~~ **Done 30 Sep ≈ 22:05 UTC** (typed by the operator at the owner's request, saved by the owner).
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
| 2026-09-28 (to 23:10 UTC) — paused/restricted; verification under review | €0 | 0 | 0 | — | — | 0 | 0 | $0 | $0 | — | — |
| 2026-09-29 (to 05:10 UTC) — verification "Розглядається" (under review); campaign paused | €0 | 0 | 0 | — | — | 0 | 0 | $0 | $0 | — | — |
| 2026-09-29 (to 11:25 UTC) — **verification passed**; campaign still paused (owner to enable) | €0 | 0 | 0 | — | — | 0 | 0 | $0 | $0 | — | — |
| 2026-09-29 (to 17:05 UTC) — **enabled ≈ 11:45, serving**; Google's report not readable (date picker frozen) | not read | not read | site: 2 ad sessions, 3 page views | — | — | 0 | 0 | $0 | $0 | — | — |
| **2026-09-29, full account day (GMT+3), read 23:10 UTC** | **€11.69** | **37** | **8** | 21.62 % | €1.46 | 0 | 0 | $0 | −€11.69 | 0 | — |
| 2026-09-30 (to 17:05 UTC) — eligible, serving; today's report not readable (date presets don't apply) | not read | not read | site: `google` 25 page views (18 at the end of 29 Sep) | — | — | 0 | 0 | $0 | — | — | — |
| **2026-09-30, full account day (GMT+3), read ≈ 22:45 UTC** (26–30 Sep total minus 29 Sep) | **€10.50** | **104** | **9** | 8.65 % | €1.17 | 0 | 0 | $0 | −€10.50 | 0 | — |
| **Total 26–30 Sep** | **€22.19** | **141** | **17** | 12.06 % | €1.31 | 0 | 0 | $0 | −€22.19 | 0 | — |
| **2026-10-01, last day (GMT+3), read ≈ 23:05 UTC** (final total minus 26–30 Sep) | **€7.79** | **107** | **6** | 5.61 % | €1.30 | 0 | 0 | $0 | −€7.79 | 0 | — |
| **FINAL, 26 Sep – 1 Oct (campaign ended)** | **€29.98** | **248** | **23** | 9.27 % | €1.30 | 0 | 0 | $0 | −€29.98 | 0 | — |

## DECISION RULES

- **After 60 clicks with 0 checkouts:** the landing page or offer is the problem. Check the search terms, then change the page or the offer before spending more.
- **Checkouts but no orders:** check the price and trust elements on the page, and the checkout flow itself.
- **Irrelevant search terms:** add negative keywords every day.
- **One keyword produces orders:** move budget to it and add close variants.
- **€30 gone with 0 orders:** stop. Record the search terms and landing-page behaviour, and don't top up without a changed hypothesis.

## LOG

- 2026-10-05 ≈ 19:10 UTC (the owner asked to check, read-only): nothing is running. The campaigns table, account ORVIONIS (894-518-6662), still shows E8 alone, ended 26 Sep – 1 Oct: 248 impressions, 23 clicks, CTR 9.27 %, €29.98, 0 conversions, €0.00 a day. There has been no spend since 1 Oct. The billing summary didn't load in the hidden window (an ad-blocker notice), so the balance wasn't read; by our records a few cents of the €30 prepaid are left. E8b would need the owner's €20 top-up.
- 2026-10-02 05:10 UTC (final evaluation, read-only): numbers unchanged; search terms read; conclusion and the E8b proposal in STATUS. Owner report sent with the morning report.
- 2026-10-01 ≈ 23:05 UTC (release reminder, read-only): **E8 ended.** The campaigns table reads "Завершено" (ended). Final: 248 impressions, 23 clicks, €29.98, 0 conversions. The sale-fix release can ship now.
- 2026-09-30 ≈ 23:05 UTC (the owner: "так шо далі делаєм кажи або роби", read as a yes to the offer "напиши «впиши»"): the operator typed the 7 proposed negatives (rearrange, rearranging, arrangement, redecorate, redecorating, "my room", "my living room") into E8's add panel with campaign E8 picked, and asked the owner to press "Зберегти". Not saved by the operator.
  - ≈ 23:47 UTC the operator reloaded the negatives page to see whether they were saved. The page then stayed "busy", possibly on a "leave site?" prompt that would drop unsaved text. At 23:50 the Chrome extension disconnected (browser closed or the PC asleep), so the result is unknown.
  - The owner was told: if the browser asks "leave site?", stay and press Save; if the words are gone, write «ще раз».
  - ≈ 23:58 UTC (extension back): the negatives page reads **"1–30 із 30"**. The owner saved the 7, so 1 Oct runs with 30 negatives.
- 2026-09-30 ≈ 22:55 UTC (read-only, ahead of the 23:03 check-in): **negatives verified, search terms read.**
  - Negative keywords page: "1–23 з 23", all at campaign level on E8, broad match. The owner's save went through.
  - Search terms, 26–30 Sep. Visible clicks, 3 (€4.16); the chart puts 1 on 29 Sep and 2 on 30 Sep:
    - "free home staging software": 1 click, €1.48 (29 Sep);
    - "rearrange my room virtual": 1 click, 4 impressions, €1.35;
    - "rearrange my room virtual free": 1 click, 2 impressions, €1.33.
  - Impressions without clicks include buyer terms ("virtual staging services company" 2, "virtual staging for real estate photos" 1) and many consumer ones: "ai rearrange furniture free", "ai staging free", "best free virtual staging app", "free staging app for furniture", "how to stage furniture with ai", "interium app", "rearrange my living room ai free", "rearrange this room for me", "room arrangement ai", "show in my room", and a pasted AI prompt ("i want help redecorating my space…").
  - The other 14 clicks (€18.03) are "other search terms", which Google hides.
  - **Finding:** besides DIY-software searches, E8 reaches homeowners who want an AI app to rearrange their own room. Neither group buys a $15 listing edit. The saved list blocks "free", "app" and "how to". Proposed to the owner for the last day (he saves): rearrange, rearranging, arrangement, redecorate, redecorating, "my room", "my living room".
- 2026-09-30 ≈ 22:45 UTC (the owner asked how the numbers look, read-only): **day 2 complete.**
  - Campaigns table, "Останні 7 днів" (through 30 Sep in account time): 141 impressions, 17 clicks, €22.19, CPC €1.31, 0 conversions.
  - Day 2 alone (minus day 1): **104 impressions, 9 clicks, €10.50, CPC ≈ €1.17**. €7.81 of the €30 is left for 1 Oct.
  - Site (`/admin/analytics`): channel `google` 30 page views (25 at 17:05). Still no intake, preview or checkout from ads.
- 2026-09-30 ≈ 22:00–22:05 UTC (the owner in chat: "Додай мінус-слова… ти відкрий сторінку покажи пальцьом куди треба тицьнути", then "мінус слова впиши я просто опублікую"): **negatives added.**
  - The operator opened E8 → Keywords → Negative keywords and sent two annotated screenshots of where to click.
  - Then, as the owner asked, the operator typed the 23 terms one per line into the add panel, with campaign E8 chosen in the picker. The operator did not save.
  - The owner pressed Save himself ("слова опублікував", ≈ 22:05 UTC).
- 2026-09-30 17:05 UTC (check-in, read-only): **ads.google.com opens again** in the Chrome extension (page loaded at 16:58 UTC). Screenshots work; page text still returns only the footer.
  - Campaigns table, range "Останні 7 днів" (26–29 Sep): E8 "Відповідає вимогам" (eligible), €30 total, **26 Sep – 1 Oct**, optimization score 80.6 %. 37 impressions, 8 clicks, €11.69, 0 conversions. Alert "1 campaign will end soon".
  - Today's numbers were not read. The date picker opened, but neither "Сьогодні" nor the next-period arrow applied.
  - Negative keywords page: "У вас поки немає мінус-слів", so **0 negatives**. The list is with the owner (chat on 29–30 Sep, and the 30 Sep owner update email).
  - Site (`/admin/analytics`): channel `google` 25 page views (22 at 13:05, 18 at the end of 29 Sep). No intake, preview or checkout from ads.
  - Search terms were not re-read: the readable range still ends on 29 Sep, which is already recorded.
- 2026-09-30 12:35 UTC (the owner asked how it's going): **the Chrome extension now refuses ads.google.com** ("Permission denied for this action on this domain"). Screenshots are refused too; page text has been refused since 29 Sep 23:10. The operator does not work around it. Google Ads numbers now come from the owner, or from the extension once he allows the site again.
  - Site-side (`/admin/analytics`): channel `google` 22 page views (18 at 23:06), still no intake or checkout.
- 2026-09-30 05:05 UTC (check-in): not read. The owner's computer was asleep, with no Chrome extension and no device bridge. Day-1 numbers stand as read at 23:10 UTC.
- Landing page review for after the test: see E14 in `docs/GROWTH_EXPERIMENTS.md`. The page is unchanged while E8 runs.
- 2026-09-29 23:10 UTC (check-in, read-only): **first-day numbers.**
  - Campaigns table ("last 30 days" = 26–29 Sep): 37 impressions, 8 clicks, €11.69, CTR 21.62 %, CPC €1.46.
  - Search terms report (`/aw/keywords/searchterms`): "free home staging software" 1 click (€1.48); three more terms at 1 impression each; "other search terms" 7 clicks, €10.21.
  - The negatives were never added, as the "free … software" click shows. The list goes to the owner again, with "what is" added.
  - Site: channel `google` 18 page views, Virtual Staging views 16 → 28, no intake, preview or checkout.
  - `get_page_text` is now refused on ads.google.com ("Permission denied for reading page content on this domain"); screenshots and `find` still work.
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
- 2026-09-29 17:05 UTC (check-in, read-only): **E8 is serving.**
  - `/admin/analytics`: channel `google` = 3 page views; sessions 47 → 49 since 11:25 UTC; Virtual Staging views 14 → 16 since 05:10. No new intake, preview or checkout.
  - Campaigns table: eligible, €30 total, 26 Sep – 1 Oct; alert "1 campaign will end soon". The report range was 26–28 Sep. "Last 30 days" ends yesterday in account time. Clicks on "Today", "All time" and the days field did not apply in the hidden window, so impressions, cost and search terms were not read.
  - No negatives to add yet: the search terms were not visible.
- 2026-09-29 ≈ 11:50 UTC (owner asked "look at Google Ads now", read-only): **the owner enabled E8.**
  - The campaign row has a green status dot, "Відповідає вимогам" (eligible), €30 total.
  - The dates are still **26 Sep – 1 Oct 2026**; the end date was not moved. Asked again to move it to 6 Oct, so the €30 is not paced into about two days.
  - Ad status and today's numbers were not read yet (the ads page was still loading).
- 2026-09-29 11:25 UTC (check-in, read-only): **verification passed.**
  - Policy → Account: every task completed ("Ви надіслали документи", answer sent 29 Sep); the disclosure card shows "Advertiser identity verified".
  - Ads table: the RSA reads "Не відповідає вимогам · Кампанію призупинено" (quality "Добре"), 0 impressions, €0.
  - Owner asked by chat + push to move the end date to 6 Oct, enable the campaign and turn auto-apply off.
  - The E8 evaluation task moved from 2 Oct to 7 Oct 05:03 UTC.
  - Note: the campaign settings page still freezes when scrolled to "Other settings" in the hidden window, so the operator did not see the date editor.
- 2026-09-29 05:10 UTC (check-in, read-only): Policy → Account shows the documents "Розглядається (зазвичай від 3 до 5 робочих днів)", i.e. under review. The campaign table was not read: the owner's Chrome disconnected mid-check. The campaign is paused, so it cannot spend.
- 2026-09-28 23:10 UTC (check-in, read-only): E8 status "Призупинено" (paused), €0.00; "Submit your documents — Under review: usually takes 3–5 business days".
  - The campaign settings page still shows the €30 campaign total and dates 26 Sep – 1 Oct.
  - Google's help confirms the budget type can't change after creation. It does not say whether the end date of a campaign-total budget can be moved; check that when enabling, with the owner.
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
- **The site's channel `google` counts page views, not clicks.** `/admin/analytics` credits every page view of a session whose first touch was a Google Ads click id (`gclid`/`gbraid`/`wbraid`) to `google`. Compare the session count to estimate clicks, and use Google's click count once it is readable.
- "Останні 30 днів" (last 30 days) ends **yesterday** in account time (GMT+3), so the current day's serving is not in that view. In the hidden Chrome window the date picker opens, but choosing a preset does not apply, and the tab then freezes. On 30 Sep 17:00 UTC the same happened while the page rendered normally: neither "Сьогодні" nor the next-period arrow applied. Read a day after midnight GMT+3 instead.

## LAST COMPLETED ACTION

2026-09-30 ≈ 22:45 UTC, read-only: day 2 complete, **104 impressions, 9 clicks, €10.50**. The 26–30 Sep total is 141 / 17 / €22.19 with 0 checkouts, and €7.81 is left for 1 Oct. The negatives were added at ≈ 22:05 UTC (typed by the operator at the owner's request, saved by the owner).

Earlier, 2026-09-30 17:05 UTC, read-only check-in: E8 eligible and serving, end date 1 Oct, **0 negatives**. Google's numbers are readable again for past days (37 impressions, 8 clicks, €11.69 through 29 Sep). Today's were not, because the date presets don't apply. Site: `google` 25 page views, 0 checkouts.

Earlier, 2026-09-29 17:05 UTC, read-only check-in: E8 eligible and serving. The site shows 2 ad sessions (3 page views) and 0 checkouts. Google's own numbers were not readable because of the frozen date picker. End date still 1 Oct.

Earlier, 2026-09-28 12:45 UTC, read-only at the owner's request: located the "Україна" in the verification forms. It is the payments profile country, which cannot be edited.
- Advised: keep everything Ukrainian (international passport, profile address as stored), since Google's Ukraine requirements demand a Ukrainian-issued ID matching the profile.
- Advised: change the "manages accounts for other organizations" answer to No.
- Still restricted, €0. The EU political-ads answer is corrected.

Earlier, at 2026-09-27 17:05 UTC: Resume failed for the owner too (`CAMPAIGN_ERROR_CANNOT_ACTIVATE_RESTRICTED_CAMPAIGN`).

## NEXT EXACT ACTION

1. Every check-in: read Google's numbers for E8 (impressions, clicks, cost, search terms), read-only.
   - Open a fresh tab. A day's numbers show only after midnight in account time (GMT+3 = 21:00 UTC); the date presets don't apply in the extension.
   - The 30 Sep search terms and all 30 negatives are verified (LOG, 23:58 UTC). Read the 1 Oct search terms on 2 Oct.
   - List any new negative keywords for the owner from the search terms (DECISION RULES).
2. The end date stays 1 Oct: the owner left it, and the 30 Sep update email told him the rest would go on 30 Sep – 1 Oct. No more reminders.
3. Until the campaign ends: fill METRICS (spend, impressions, clicks, CTR, CPC, checkouts, orders, revenue) from Google Ads plus `/admin/analytics` (channel `google`), and apply DECISION RULES. Keep `/tools/virtual-staging` unchanged.
4. ~~Move the evaluation task to 2 Oct 05:03 UTC~~ done on 1 Oct at 00:36 UTC (trig_0157xqpW4GE2QDXcSZNQQ7wA); the owner was told in chat.
5. 2 Oct 05:03 UTC: final evaluation from the full 1 Oct numbers and search terms, recorded in GROWTH_EXPERIMENTS.md and BUSINESS_METRICS.md (spend register). After that the landing page may change (E14).

## TIMESTAMP

2026-09-30 23:00 UTC
