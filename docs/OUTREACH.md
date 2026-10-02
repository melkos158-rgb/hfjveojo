# First-customer mechanism — outreach that a real person would send

Rules: personal, short, honest about being new, one ask, no fake numbers, no testimonials we don't have. Every message below is also available in `/admin/content`. UA lines are word-for-word control translations for review before sending.

## What exists now (link to these, they do the convincing)

- Sample results on every tool page: https://orvionis.com/tools/listing-description#example ($9, MLS copy + captions), https://orvionis.com/tools/photographer-pricing-guide#example (real 5-page PDF), https://orvionis.com/tools/listing-clips#example (clip plan).
- Free tool for agents: https://orvionis.com/free/fair-housing-checker — paste listing copy, see risky phrases + character count. Best value-first opener; it is useful even if they never buy.
- Cheapest first purchase: Listing Description, $9, about 5 minutes. Use it as the entry offer for cold contacts; $49 clips are the upsell once they have paid once.
- Most visual proof: Virtual Staging, $15 per photo, $12 each from 5 photos, $99 for 10 (up to 10 rooms in one order), about 2 minutes per photo — https://orvionis.com/tools/virtual-staging#example shows a real before/after. **From 1 Oct the first photo is free**: one photo per person, the full result without watermarks, started by a link in the confirmation email (daily limit). The free watermarked preview on the prospect's own photo still works too. Use it for vacant listings (empty rooms in the photos); the picture sells itself.
- Tracking: add `?utm_source=<channel>&exp=<experiment>` to every link (`e3-listing-description`, `e1-listing-clips`, `e2-photo-pricing-guide`, `e4-virtual-staging`); the channel shows up in /admin/analytics.

## Daily routine (45–60 minutes)

**From 2 Oct (E19): the Realtor DM Tracker** (private claude.ai artifact, link in the operator's chat) holds the day's batch: 10 agents with one written message each, copy buttons, status, the 3-day follow-up and reply templates. The operator finds and writes, the owner sends from @orvionis_ and marks the status; check-ins read the statuses and add the next batch.
- Since 3 Oct each agent has a send day (Warsaw date). «Сьогодні» shows who to write today, «Наступні» the later days. A batch held for the E19 check is marked «Чекає перевірки перших 20» and stays out of «Сьогодні» until the operator releases it.
- **Batch 3** (prepared 2–3 Oct overnight, held): 20 agents in new markets: Atlanta 4, Houston 3, Orlando 4, Austin 2, Nashville 5, Denver 2. They were picked first for vacant-home work: probate and estate specialists, a builder's new-construction agent, high-volume listing agents, team leads.
  - Days: 10 on 4 Oct, 10 on 5 Oct. They are released only after the E19 check on the first 20.
  - Sources: web search for public profiles, then one read of each profile (bio, follower count, latest post captions; about 30 profiles, nothing liked, followed or sent). Phone numbers and emails were redacted at read time, and no addresses were stored.

0. Cold contacts get the $9 offer (`re-ig-dm-9`) first; walkthrough posters get `re-ig-dm-1` (clips). One paid $9 order is worth more than ten "interested" replies — it proves the funnel end to end.
1. Find 15 agents who posted a walkthrough in the last 7 days (Instagram: search `#listingvideo`, `#justlisted`, `#[city]realestate`, watch Reels; TikTok: `#realestatetok`). Save handle + listing + one specific detail.
2. Like/comment something specific on the post, then send `re-ig-dm-1`.
3. Log the batch in `/admin/experiments` → *Log channel cost* (channel `instagram_dm`, hours, note "15 DMs, Austin/Denver").
4. Reply to every answer within an hour during work hours. Send the tool link with `?exp=e1-listing-clips&utm_source=instagram_dm`.
5. Day 3–4: `re-ig-dm-followup` to non-responders. Then stop — no third message.
6. Photographers: same loop with `photo-ig-dm-1` (10/day), link `?exp=e2-photo-pricing-guide&utm_source=instagram_dm`.
7. Twice a week: one value-first post in a group that allows it (`re-fb-group-post`). Read group rules first; never DM from a group without engaging publicly.

Platform limits (do not exceed — accounts get restricted): Instagram roughly 20–30 new DMs/day from a mature account, fewer from a new one; Reddit: comment history first, promo DMs are reported as spam; Facebook groups: follow each group's promo day.

## Templates

### re-ig-dm-1 — Instagram DM to an agent who posted a walkthrough (first contact)

📤 EN — send as is:
Hey [name], saw the walkthrough of [street or neighborhood] — the [specific shot, e.g. kitchen island] shot is a good one. I cut listing videos into 5 vertical clips (price, beds/baths on screen, captions written, your branding) for $49, back in 48 hours. It's new, so I'm looking for a few agents to be first. Want me to cut one clip from that video for free so you can see the style?

🇺🇦 UA — контроль:
Привіт, [name], бачив прохідку по [street or neighborhood] — кадр з [specific shot, наприклад, кухонний острів] вдалий. Я нарізаю відео лістингів на 5 вертикальних кліпів (ціна, спальні/ванни на екрані, підписи написані, твій брендинг) за $49, повертаю за 48 годин. Це нове, тому шукаю кількох агентів, які будуть першими. Хочеш, зроблю один кліп із цього відео безкоштовно, щоб ти побачив(ла) стиль?

✍️ Personalise: [name], [street or neighborhood], [specific shot]. The free-clip sentence is optional — drop it to test paid-only.

### re-ig-dm-9 — Instagram DM to an agent, $9 entry offer (use this first for cold contacts)

📤 EN — send as is:
Hey [name], the [street] listing looks sharp. I write MLS descriptions + the Instagram/Facebook captions from the listing facts — you send price, beds, the five things worth mentioning, it comes back in about five minutes, within your board's character limit and checked for fair-housing wording. $9 a listing, no subscription. Here's a full sample so you can judge the writing: orvionis.com/tools/listing-description#example. Want to try it on your next one?

🇺🇦 UA — контроль:
Привіт, [name], лістинг на [street] виглядає класно. Я пишу описи для MLS + підписи для Instagram/Facebook з фактів лістингу — ти надсилаєш ціну, спальні, п'ять речей, які варто згадати, і за близько п'ять хвилин отримуєш текст у межах ліміту символів твоєї MLS, перевірений на fair-housing формулювання. $9 за лістинг, без підписки. Ось повний зразок, щоб оцінити текст: orvionis.com/tools/listing-description#example. Хочеш спробувати на наступному?

✍️ Personalise: [name], [street]. Add `?utm_source=instagram_dm&exp=e3-listing-description` to the link.

### re-ig-dm-staging — Instagram DM to an agent or photographer with a vacant listing (empty rooms in the photos)

📤 EN — send as is:
Hey [name], the [street] listing shoots well but the empty rooms are working against you. I stage room photos in about two minutes each: same walls, floors and windows, just furniture added. Your first photo is free; after that it's $15 a photo (two versions each), $12 from five photos. No subscription. Before/after: orvionis.com/tools/virtual-staging#example. Want to try it on the living room?

🇺🇦 UA — контроль:
Привіт, [name], лістинг на [street] добре знятий, але порожні кімнати працюють проти тебе. Я стейджу фото кімнат приблизно за дві хвилини на кожне: ті самі стіни, підлога й вікна, лише додані меблі. Перше фото — безкоштовно; далі $15 за фото (по дві версії), $12 від пʼяти фото. Без підписки. До/після: orvionis.com/tools/virtual-staging#example. Хочеш спробувати на вітальні?

✍️ Personalise: [name], [street], the room you name. Add `?utm_source=instagram_dm&exp=e4-virtual-staging`. Only send to listings that are actually empty — the message is wrong for furnished ones.


### re-ig-dm-staging-ca — Instagram DM to a California agent with a vacant listing

When: California only — AB 723 has required a disclosure next to digitally altered listing photos (and access to the original) since January 1, 2026.

📤 EN — готове до відправки:
Hey [name], quick one on the [street] listing. If you stage those empty rooms virtually, AB 723 now wants a label next to each staged photo and a link to the original. My staging covers that: labeled copies, a public page and QR code with the original, and the line to paste. $15 a photo, and your first photo is free. Before/after: orvionis.com/tools/virtual-staging#example

🇺🇦 UA — переклад для контролю:
Привіт, [name], коротко про лістинг на [street]. Якщо стейджитимеш ці порожні кімнати віртуально, AB 723 тепер вимагає позначку біля кожного застейдженого фото і посилання на оригінал. Мій стейджинг це покриває: копії з позначкою, публічна сторінка й QR-код з оригіналом і рядок, який треба вставити. $15 за фото, а перше фото — безкоштовно. До/після: orvionis.com/tools/virtual-staging#example

✍️ Personalise: [name], [street]. California listings only; add `?utm_source=instagram_dm&exp=e4-virtual-staging`. Never promise legal certainty — the pack helps them comply, they stay responsible.
### re-free-checker — Reddit / Facebook group comment or post, value first (no link to paid)

📤 EN:
Made a small free thing for anyone writing listing copy: paste the description, it highlights the phrases that get flagged under fair housing ("perfect for families", "safe neighborhood", "walking distance to church"…) with a plain-English fix for each, and counts characters against your MLS limit. Runs in the browser, nothing is stored. orvionis.com/free/fair-housing-checker — tell me which phrases I'm missing.

🇺🇦 UA:
Зробив невелику безкоштовну штуку для всіх, хто пише тексти лістингів: вставляєш опис, воно підсвічує фрази, які підпадають під fair housing («perfect for families», «safe neighborhood», «walking distance to church»…) з простою правкою для кожної, і рахує символи проти ліміту твоєї MLS. Працює в браузері, нічого не зберігається. orvionis.com/free/fair-housing-checker — скажіть, яких фраз бракує.

✍️ Nothing. Post it where tools are allowed; answer replies; never follow up with a paid pitch in the same thread — the checker links to the $9 tool itself.

### re-ig-dm-followup — 3–4 days later, no reply

📤 EN: Quick one — still happy to cut that free clip if you have another listing coming up. No worries if it's not your thing.

🇺🇦 UA: Коротко — все ще радий нарізати той безкоштовний кліп, якщо в тебе на підході ще один лістинг. Без проблем, якщо це не твоє.

✍️ Nothing.

### re-fb-group-post — agent group, value first

📤 EN: Agents who shoot their own walkthroughs: what do you do with the footage after the tour? I've been cutting them into 5 vertical clips with price/beds/baths on screen and captions written — the kind of thing an editor charges $50+ per clip for. I'm doing it for $49 per listing (5 clips, 48h) while I figure out if agents actually want this, so the first 10 orders are the test. Happy to answer questions about what footage works.

🇺🇦 UA: Агенти, які самі знімають прохідки: що ви робите з відео після туру? Я нарізаю їх на 5 вертикальних кліпів із ціною/спальнями/ваннами на екрані та написаними підписами — те, за що монтажер бере $50+ за кліп. Роблю це за $49 за лістинг (5 кліпів, 48 год), поки з'ясовую, чи агентам це справді потрібно, тож перші 10 замовлень — це тест. Радо відповім на питання про те, яке відео підходить.

✍️ Nothing, but check group rules; link only where allowed.

### re-fb-group-ab723 — California agent groups, value first (virtual staging)

📤 EN:
Quick heads-up for California agents, in case it slipped past anyone: since January 1, 2026, AB 723 requires a disclosure next to any virtually staged or digitally altered listing photo, plus access to the original.

In practice: "Virtually staged" on or right next to the photo, the original uploaded right after it in the MLS, and a link or QR code to the original on portals, social posts and flyers.

I wrote a plain-English checklist with the sources (bill text, SDMLS, Bay East): orvionis.com/guides/ab-723-virtual-staging?utm_source=fb_group&exp=e4-virtual-staging

Full disclosure: I run a small virtual staging service ($15 a photo). Every order comes with labeled copies, a public page with the original and a QR code, so that part is ready to use. Ask away in the comments.

🇺🇦 UA — переклад для контролю:
Коротке нагадування для агентів у Каліфорнії, раптом хтось пропустив: з 1 січня 2026 року закон AB 723 вимагає позначку біля кожного віртуально застейдженого або цифрово зміненого фото в оголошенні, а також доступ до оригіналу.

На практиці: «Virtually staged» на фото або одразу поруч, оригінал завантажений одразу після нього в MLS, а на порталах, у соцмережах і на флаєрах — посилання або QR-код на оригінал.

Я написав простий чекліст із джерелами (текст закону, SDMLS, Bay East): orvionis.com/guides/ab-723-virtual-staging?utm_source=fb_group&exp=e4-virtual-staging

Чесно скажу: у мене невеликий сервіс віртуального стейджингу ($15 за фото). Кожне замовлення йде з підписаними копіями, публічною сторінкою з оригіналом і QR-кодом, тож ця частина вже готова. Питайте в коментарях.

✍️ Nothing. California groups only. One group per day, never the same text twice in one day. Where the rules frown on links (Southern California Real Estate Professionals), post without the link and give it in a comment when asked. Never promise legal certainty.

### re-fb-group-calc — US agent groups, value first (free staging cost calculator)

📤 EN:
For anyone comparing virtual staging prices, I made a free calculator. Enter photos per listing and listings per month, and it shows what you'd pay with per-photo services ($24–$30 a photo), a monthly AI subscription, or physical staging (NAR's median is $1,500). It also shows when a subscription is the cheaper choice.

orvionis.com/free/virtual-staging-cost-calculator?utm_source=fb_group&exp=e4-virtual-staging

Disclosure: one of the options in it is mine ($15 a photo, free watermarked preview on your own photo first). Questions welcome.

🇺🇦 UA — переклад для контролю:
Для всіх, хто порівнює ціни на віртуальний стейджинг: я зробив безкоштовний калькулятор. Вводиш, скільки фото в оголошенні і скільки оголошень на місяць, і він показує, скільки ти заплатиш у сервісах з оплатою за фото ($24–$30 за фото), за місячну AI-підписку або за справжній стейджинг (медіана за даними NAR — $1,500). А ще показує, коли підписка виходить дешевшою.

orvionis.com/free/virtual-staging-cost-calculator?utm_source=fb_group&exp=e4-virtual-staging

Чесно кажу: один із варіантів у ньому мій ($15 за фото, спершу безкоштовне превʼю з водяним знаком на твоєму фото). Питання вітаються.

✍️ Nothing. Re-check the prices on the calculator page before reusing this after October 2026.

### re-fb-group-reply — someone in a group asks who to use for virtual staging

📤 EN: I run one, so take this with that in mind: ORVIONIS, about two minutes a photo, and your first photo is free (full resolution, no watermark). After that it's $15 a photo, $12 from five. In California it also includes the AB 723 labeled copies. orvionis.com/tools/virtual-staging?utm_source=fb_group&exp=e4-virtual-staging

🇺🇦 UA — переклад для контролю: У мене свій такий сервіс, тож враховуй це: ORVIONIS, десь дві хвилини на фото, і перше фото безкоштовне (повна роздільність, без водяного знака). Далі $15 за фото, $12 від пʼяти. Для Каліфорнії ще входять підписані копії під AB 723. orvionis.com/tools/virtual-staging?utm_source=fb_group&exp=e4-virtual-staging

✍️ Answer only real questions, in the thread. The strict groups (Lab Coat Agents) allow product talk only as an answer to a question.

### re-fb-group-free-photo — agent groups that allow services (the free first photo, from 2 Oct)

📤 EN — готове до відправки:
Agents with a vacant listing: I'll stage one of your room photos for free. Upload it, confirm your email, and two staged versions come back in a few minutes, full resolution, no watermark. Walls, windows and floors stay as shot, only furniture gets added. After the first one it's $15 a photo. A real before/after so you can judge first: orvionis.com/tools/virtual-staging?utm_source=fb_group&exp=e4-virtual-staging

🇺🇦 UA — переклад для контролю:
Агенти з порожнім оголошенням: застейджу одне фото вашої кімнати безкоштовно. Завантажуєте його, підтверджуєте email, і за кілька хвилин приходять дві застейджені версії в повній роздільності, без водяного знака. Стіни, вікна й підлога лишаються як на фото, додаються тільки меблі. Після першого — $15 за фото. Справжнє до/після, щоб спершу оцінити: orvionis.com/tools/virtual-staging?utm_source=fb_group&exp=e4-virtual-staging

✍️ Nothing to personalise. Only in groups whose rules allow services (Southern California Real Estate and Services does); in the others answer questions with `re-fb-group-reply`. One post per group, and answer every comment.

### photo-ig-dm-1 — photographer, first contact

📤 EN: Hey [name], your [type, e.g. beach elopement] set from [month] is lovely. I built a small tool that writes and designs a branded pricing guide PDF from your real packages — about five minutes of questions, $29, no subscription. It's new and I'm looking for the first photographers to try it and tell me what's missing. Want the link?

🇺🇦 UA: Привіт, [name], твоя серія [type, наприклад, пляжний елопмент] з [month] чудова. Я зробив невеликий інструмент, який пише й верстає брендований PDF прайс-гайд із твоїх реальних пакетів — близько п'яти хвилин запитань, $29, без підписки. Це нове, і я шукаю перших фотографів, які спробують і скажуть, чого бракує. Скинути посилання?

✍️ [name], [type], [month] — reference a real recent post.

### delivery-followup — email 24h after delivery

📤 EN: Hi [name], did the [deliverable] do its job? If anything's off, reply with what to change — one revision is included. And if it worked, would you mind telling me in one line what made you say yes? It helps me decide what to build next.

🇺🇦 UA: Привіт, [name], [deliverable] зробив свою справу? Якщо щось не так, відпиши, що змінити — одна правка включена. А якщо спрацювало, не проти сказати одним рядком, що змусило тебе погодитися? Це допомагає мені вирішити, що будувати далі.

✍️ [name], [deliverable].

## Facebook groups for agents (checked 2026-09-29 through the owner's Facebook, read-only)

The owner joins and posts himself, answering join questions truthfully (a virtual staging service, not a realtor). Numbers are from each group's About page on 29 Sep 2026.

| Group | Link | Size, activity | Vendor posts |
| --- | --- | --- | --- |
| Southern California Real Estate Professionals | https://www.facebook.com/groups/SoCalRealEstateProfessionals | public, 25.0k, 81 posts that day | allowed: rules name home staging and RE photography "with useful information"; sales posts "once in a while"; repeats and third-party links get blocked |
| REALTORS® - Northern California | https://www.facebook.com/groups/RealtorsGroup | public, 16.9k, 66 posts that day | allowed in moderation ("TOO much self-promotion" is not); one admin is a virtual tour company |
| California Realtor | https://www.facebook.com/groups/328642043896502 | public, 10.3k, 17 posts that day | no rules listed; invites listings, news and real estate laws (the AB 723 post fits) |
| California Real Estate | https://www.facebook.com/groups/4737211546357168 | public, 50.6k, 290 posts that day | "please don't spam, keep it professional"; posts sink fast |
| Southern California Real Estate and Services | https://www.facebook.com/groups/759924907456250 | public, 13.4k, 45 posts that day | services welcome (lenders, title, escrow, any real estate business) |
| All Realtors and related Professionals | https://www.facebook.com/groups/350007408391439 | public, 85.2k, 299 posts that day, US-wide | no rules listed; very noisy |

Not for promotion:
- **Lab Coat Agents** (https://www.facebook.com/groups/labcoatagents, private, 168k). No self-promotion without admin approval. Product talk only when answering a question. No messages to members without their explicit permission.
- **New Real Estate Agents** (https://www.facebook.com/groups/NewRealEstateAgentsGroup, private, 73k). Only paid sponsors may promote or post links.
- The "virtual staging" groups (for example https://www.facebook.com/groups/virtualstagings, 8k) are mostly other staging vendors; buyers there are rare.

**Log:**
- 2026-09-29 ≈ 18:30 UTC, at the owner's explicit request ("Вступай за мене"): the operator joined all six groups in the owner's Chrome. They are public and admitted him at once, with no questions.
- The operator typed three posts, and the owner presses Publish himself:
  - All Realtors and related Professionals: `re-fb-group-calc`;
  - Southern California Real Estate Professionals: `re-fb-group-ab723` for SoCal, with the SDMLS line and no link (the checklist is offered in the comments);
  - REALTORS® - Northern California: the question variant below, with the Bay East line and the guide link.
- The other three groups get fresh texts from 30 Sep, so the account does not post a promotion in six groups on its first day.
- Check ≈ 25 minutes after the owner published:
  - SoCal Professionals is live: https://www.facebook.com/groups/SoCalRealEstateProfessionals/posts/4229101407234094/
  - Northern California is live, with the guide's link card: https://www.facebook.com/groups/RealtorsGroup/posts/3270337369822424/
  - Both had 0 comments and 0 reactions so far.
  - All Realtors: **pending**. The admins review new members' posts ("Ваш запит на перевірку все ще на розгляді"). Leave it; never press "Скасувати перевірку".
  - 30 Sep ≈ 12:50 UTC, at the owner's request:
    - The reply to the SoCal comment was typed under the comment for him to send. Facebook put the commenter's tag first, so the text starts "Thanks!".
    - The three day-2 posts were typed into composers in separate tabs (California Realtor, California Real Estate, SoCal RE & Services), unpublished. He publishes them at 18:00, 19:00 and 20:00 Warsaw time.
    - The owner asked whether the commenter is a potential client. Answer: nothing suggests it. No question, no price or turnaround ask, a generic compliment. Such comments usually come from other vendors or engagement accounts. The reply is still worth it for the other readers.
  - 30 Sep 12:35 UTC, about 18 hours in:
    - SoCal Professionals: 2 likes, 1 comment, no reply from the owner yet.
    - Northern California: 0 comments.
    - All Realtors: still under admin review.
    - `fb_group` still 6 page views.
  - 23:10 UTC, about 4 hours in:
    - SoCal Professionals has **1 comment**, a generic compliance remark that may be an engagement account. A reply was drafted for the owner (below).
    - Northern California: 0 comments, 0 reactions.
    - All Realtors: still waiting for admin review.
    - No new Facebook visits since 19:16.
  - `/admin/analytics`: 529 / 63 (was 514 / 49 at 17:05). First Facebook traffic: `fb_group` 6 page views, plus `m.facebook.com` 2 and `www.facebook.com` 3 without the tag; some may be the owner's own clicks. `google` (ads) rose from 3 to 7 page views. Funnel unchanged (3 → 7 → 0), 0 paid.
- 30 Sep ≈ 13:05 and 17:00 UTC (the owner asked for the status, then the 17:03 check-in), read-only:
  - The owner sent the SoCal reply at ≈ 13:00 UTC. It shows under the comment with the guide's link card. SoCal Professionals: 2 reactions, 2 comments (the commenter's and the reply).
  - He published all three day-2 posts at ≈ 14:00 UTC, together rather than an hour apart:
    - California Real Estate (`re-fb-group-ca-flip`): live, 0 reactions, 0 comments at 17:00.
    - Southern California Real Estate and Services (`re-fb-group-socal-service`): live, 0 reactions, 0 comments.
    - California Realtor (`re-fb-group-ca-question`): **awaiting admin review** ("Ваш допис очікує на перевірку").
  - Northern California: 0 reactions, 0 comments. All Realtors: the membership review was still pending at 13:05.
  - `/admin/analytics`: `fb_group` 6 → 13 page views between 13:05 and 17:05, no intake.
  - The California Real Estate and SoCal RE & Services feeds are mostly spam (job offers, "investor" posts), so few working agents read them. Future posts go first to the groups with real discussion (SoCal Professionals, Northern California).
- 30 Sep ≈ 22:20 UTC (the owner asked to look at the posts), read-only. **Correction to the 17:00 entry: none of the day-2 posts is live.**
  - Each group's «Ваш контент» (your content) page lists the post as awaiting admin review: California Real Estate, Southern California Real Estate and Services, and California Realtor. All Realtors has been waiting since 29 Sep.
  - Live: SoCal Professionals (3 reactions, 2 comments: the commenter's and the owner's reply) and Northern California (0 reactions, 0 comments).
  - So 2 of the 6 posts are visible, and 4 wait for admins. **From now on a post's state is read on the group's «Ваш контент» page**, which is where the 17:00 misreading showed up.
  - What follows: post where posts go live (SoCal Professionals, Northern California), and in the other groups answer real questions with helpful comments until the admins know the account.
- 2 Oct ≈ 15:55 UTC (the owner asked to check the groups), read-only:
  - Live: SoCal Professionals (5 reactions, 2 comments) and Northern California (0 reactions, 0 comments).
  - Still awaiting admin review after two days: California Realtor, California Real Estate, SoCal RE & Services. All Realtors: the membership is still pending.
- 2 Oct ≈ 16:05 UTC, at the owner's "так":
  - The operator opened SoCal Professionals in a new tab of the owner's Chrome and typed `re-fb-group-styles` (below).
  - He attached the collage `ORVIONIS_VIDEO_REFERENCES/fb/same-room-six-styles.jpg`: the guide's stock room, empty and in all six styles, marked "All six virtually staged".
  - The post has no link: the group blocks repeats and third-party links, so it asks a question instead.
  - The owner presses Publish himself.
- 2 Oct ≈ 22:00 UTC: the owner published it. At 23:10 UTC it was **awaiting admin review** («В очікуванні · 1» on the group's pending-content page), although the first SoCal post had gone live at once. So SoCal Professionals now reviews this account's posts too. Check it on the group's «Ваш контент» page.

Reply drafted for the first comment (SoCal post, 29 Sep); the owner posts it himself:
> Thanks, [first name]. The label is the easy part; keeping the original attached to every syndicated copy is where it slips. Here's the checklist I mentioned, sources included: orvionis.com/guides/ab-723-virtual-staging?utm_source=fb_group&exp=e4-virtual-staging

**Day 2 texts (30 Sep), one per remaining group, each different.** Post them at least an hour apart, ideally 16:00–19:00 UTC (morning in California).

`re-fb-group-ca-question` for **California Realtor**:
> Question for California listing agents: has your MLS pushed back on a virtually staged photo since AB 723 kicked in?
>
> The rule itself is simple: a disclosure next to the altered photo, and a way for buyers to see the original. The part that's easy to miss is syndication. SDMLS, for example, wants the label and the original to carry through to IDX and syndication feeds.
>
> I keep a one-page checklist with the bill text and the SDMLS and Bay East requirements, if it helps: orvionis.com/guides/ab-723-virtual-staging?utm_source=fb_group&exp=e4-virtual-staging
>
> (I run a small virtual staging service, so I built the labeling into it.)

UA: Питання до агентів у Каліфорнії: чи ваша MLS уже відхиляла віртуально застейджене фото, відколи діє AB 723? / Саме правило просте: позначка біля зміненого фото і спосіб для покупців побачити оригінал. Найлегше пропустити синдикацію: SDMLS, наприклад, хоче, щоб позначка й оригінал доходили і в IDX, і в синдикаційні фіди. / У мене є чекліст на одну сторінку з текстом закону й вимогами SDMLS і Bay East, якщо стане в пригоді: [посилання] / (У мене невеликий сервіс віртуального стейджингу, тож позначки я вбудував у нього.)

`re-fb-group-ca-flip` for **California Real Estate** (investors and agents):
> For flippers and listing agents with vacant homes: I made a free calculator that compares what staging a listing actually costs. Enter photos per listing and listings per month, and it lays out per-photo virtual staging ($15 to $30 a photo), a monthly AI subscription, and physical staging (NAR's median is $1,500 for a staging service). It also tells you when a subscription is the cheaper option.
>
> orvionis.com/free/virtual-staging-cost-calculator?utm_source=fb_group&exp=e4-virtual-staging
>
> Disclosure: the $15 option is mine. In California staged photos need an AB 723 label, and mine include it.

UA: Для фліпперів і агентів із порожніми будинками: я зробив безкоштовний калькулятор, який порівнює, скільки насправді коштує стейджинг оголошення. Вводиш фото на оголошення й оголошення на місяць, і він показує віртуальний стейджинг з оплатою за фото ($15–$30 за фото), місячну AI-підписку і справжній стейджинг (медіана NAR — $1,500 за послугу). А ще каже, коли підписка вигідніша. / [посилання] / Чесно: варіант за $15 — мій. У Каліфорнії застейджені фото потребують позначки за AB 723, і в моїх вона є.

`re-fb-group-socal-service` for **Southern California Real Estate and Services** (services welcome):
> SoCal agents with an empty listing: try virtual staging on one of your own room photos. You see a free watermarked preview first; if you like it, it's $15 a photo (two versions each), ready in about two minutes, with the AB 723 labeled copy and a page with the original included. Walls, floors and windows stay exactly as shot; only furniture is added.
>
> Before/after and the free preview: orvionis.com/tools/virtual-staging?utm_source=fb_group&exp=e4-virtual-staging

UA: Агенти Південної Каліфорнії з порожнім оголошенням: спробуйте віртуальний стейджинг на одному з ваших фото кімнати. Спершу ви бачите безкоштовне превʼю з водяним знаком; якщо сподобається — $15 за фото (по дві версії), готово десь за дві хвилини, з підписаною копією під AB 723 і сторінкою з оригіналом. Стіни, підлога й вікна лишаються точно як на фото, додаються тільки меблі. / До/після і безкоштовне превʼю: [посилання]

✍️ Nothing to change in any of the three. The third links to the E8 landing page: the page itself does not change, and `utm_source=fb_group` keeps these visits apart from ad clicks.

Question variant used for Northern California:
> NorCal agents, a practical AB 723 question: how are you handling the disclosure on virtually staged photos? / Since January 1, 2026, a staged or otherwise digitally altered listing photo needs a disclosure next to it and access to the original. Bay East, for example, asks for the label ("altered", "digitally altered" or "AI altered") and the original uploaded right after the staged photo. / I put the rules and a 7-step checklist on one page, with sources: [guide link with `utm_source=fb_group&exp=e4-virtual-staging`] / I also run a virtual staging service ($15 a photo) that hands you the labeled copies, a public page with the original and a QR code. Curious what your brokerage tells you to do.

`re-fb-group-styles` for **Southern California Real Estate Professionals** (2 Oct). It goes with the six-style collage and has no link:
> Same empty living room, six staging styles. If this were your listing, which one would you go with: 1 to 6?
>
> I ran a free stock photo through my staging tool once per style to see how much the style changes the feel of the same room. Curious what SoCal buyers respond to.
>
> (All six are virtually staged, so in California they'd need the AB 723 label.)

UA: Та сама порожня вітальня, шість стилів стейджингу. Якби це було ваше оголошення, який би ви обрали: від 1 до 6? / Я прогнав безкоштовне стокове фото через свій інструмент для стейджингу, по разу на кожен стиль, щоб побачити, наскільки стиль змінює відчуття від тієї самої кімнати. Цікаво, на що реагують покупці в Південній Каліфорнії. / (Усі шість віртуально застейджені, тож у Каліфорнії їм потрібна позначка за AB 723.)

If someone asks which tool it is or wants the photos larger, reply with the guide. It shows all six large, with notes on each style: orvionis.com/guides/virtual-staging-styles?utm_source=fb_group&exp=e4-virtual-staging

Cadence: join all six, then post in one or two groups a day with a different template each time (`re-fb-group-ab723` for California groups, `re-fb-group-calc` for the rest). Answer every comment. No private messages unless someone asks for one. Also search each group for "virtual staging" and answer real questions with `re-fb-group-reply`. Results show up in `/admin/analytics` as channel `fb_group`.

## Short video (E15, from 1 Oct)

Files: `ORVIONIS_VIDEO_REFERENCES/videos/` on the owner's PC (not in git), 1080×1920, 13–15 s, silent (the owner adds a sound in the app). Built by `make_videos.py` in the same folder from real assets only: the before/after of test order #6, real UI screenshots, the official logo.

Post one a day, the same file on TikTok, Reels and Shorts, around 16:00–18:00 UTC (morning in the US). Links for the profiles:
- TikTok: `https://orvionis.com/tools/virtual-staging?utm_source=tiktok&utm_medium=social&utm_campaign=video-test`
- Instagram: `https://orvionis.com/tools/virtual-staging?utm_source=instagram&utm_medium=social&utm_campaign=video-test`
- YouTube: `https://orvionis.com/tools/virtual-staging?utm_source=youtube&utm_medium=social&utm_campaign=video-test`

If a platform doesn't allow a profile link yet, the end card of every video shows orvionis.com.

**TikTok short link: orvionis.com/tt** (from 30 Sep, `next.config.ts` → `SHORT_LINKS`). TikTok gives a clickable bio link only from 1,000 followers or to a registered business account, so the TikTok bio and captions show `orvionis.com/tt`. It redirects (307) to the TikTok-tagged link above, so a visitor who types it counts as `tiktok` instead of `direct`. In TikTok captions, write "orvionis.com/tt" instead of "Link in bio".

**Accounts, set up on 30 Sep** (the operator typed and uploaded in the owner's Chrome; the owner pressed every final Save, Publish and Confirm):
- **TikTok:** @orvionis.staging ("orvionis" was taken), name "ORVIONIS · Virtual Staging", logo avatar. Bio: "Virtual staging for US listings · $15/photo · free preview · orvionis.com" (30 Sep 23:58 UTC: changed to "… orvionis.com/tt", typed by the operator for the owner to save; the edit-profile dialog has no website field for this account). The profile has no clickable link yet, so TikTok visitors type the address and count as `direct`. The owner posted `video-v1` on 30 Sep: **251 views**, 2 followers at 22:55 UTC (read from the profile page; TikTok Studio pages time out in the extension).
- **YouTube:** channel "ORVIONIS · Virtual Staging", @orvionis.staging ("@orvionis" was taken), description, logo, and a 2560×1440 banner with the real before/after. Channel link "Virtual staging, $15/photo" → the YouTube link above. The Short "Empty listing? Same room, virtually staged in about 2 minutes" is public (AI-use disclosure: yes): 4 views at 22:45 UTC, 8 at 22:55. The first tagged visits arrived: `youtube` 3 page views. Clickable links in video descriptions need the channel's phone verification (owner).
- **Instagram:** @orvionis_, the owner's existing account renamed for ORVIONIS. Logo avatar, and the bio above is saved: "Virtual staging for real estate listings. 2 staged versions in ~2 min · $15/photo · free preview · AB 723 labels · orvionis.com". The owner added the profile link orvionis.com from his phone. The link Instagram serves carries `utm_source=ig&utm_medium=social&utm_content=link_in_bio`, so these visits arrive as channel **`ig`**, not `instagram`. 1 Reel, 0 followers at 22:55 UTC.

Profile bio (TikTok, ≤ 80 characters):
> Virtual staging for listings · $15/photo · free preview · AB 723 labels

UA: Віртуальний стейджинг для оголошень · $15 за фото · безкоштовне превʼю · позначки AB 723

Profile bio (Instagram / YouTube):
> Virtual staging for listings. Empty room in, 2 staged versions out in about 2 minutes. $15 a photo, free preview first. AB 723 labels included.

UA: Віртуальний стейджинг для оголошень. Порожня кімната на вході, 2 застейджені версії на виході десь за 2 хвилини. $15 за фото, спершу безкоштовне превʼю. Позначки під AB 723 — у комплекті.

`video-v1` (before/after):
> Empty rooms are hard to picture. Same room, virtually staged in about 2 minutes. Walls, floors and windows stay exactly as shot. $15 a photo, free preview first. Link in bio.
> #realestate #virtualstaging #realtor #listingphotos #homestaging

UA: Порожні кімнати важко уявити. Та сама кімната, віртуально застейджена десь за 2 хвилини. Стіни, підлога й вікна лишаються точно як на фото. $15 за фото, спершу безкоштовне превʼю. Посилання в профілі.

`video-v2` (how it works):
> How it works: upload a photo of the empty room, see a free watermarked preview, then get 2 staged versions for $15. California agents also get the AB 723 labeled copies. Link in bio.
> #virtualstaging #realestatetips #realtor #listingphotos #realestateagent

UA: Як це працює: завантажуєш фото порожньої кімнати, бачиш безкоштовне превʼю з водяним знаком, потім отримуєш 2 застейджені версії за $15. Агенти в Каліфорнії також отримують копії з позначкою AB 723. Посилання в профілі.

`video-v3` (California, AB 723):
> California agents: since Jan 1, 2026, a virtually staged listing photo needs a disclosure next to it and the original available to buyers (AB 723). Every ORVIONIS order comes with a labeled copy plus a public link and QR code to the original. Check your MLS rules too. Link in bio.
> #californiarealestate #realestate #virtualstaging #realtor #ab723

UA: Агенти в Каліфорнії: з 1 січня 2026 року біля віртуально застейдженого фото в оголошенні має бути позначка, а оригінал — доступний покупцям (AB 723). Кожне замовлення ORVIONIS містить копію з позначкою, публічне посилання і QR-код на оригінал. Правила своєї MLS теж перевірте. Посилання в профілі.

**From 2 Oct, once the free first photo is live in production (release s60):** use these captions. On TikTok, end with `orvionis.com/tt` instead of "Link in bio".

`video-v2` (how it works), new caption:
> How it works: upload a photo of the empty room and confirm your email. Your first photo comes back staged, in 2 versions, free. After that it's $15 a photo, $12 from five. California agents also get AB 723 labeled copies. Link in bio.
> #virtualstaging #realestatetips #realtor #listingphotos #realestateagent

UA: Як це працює: завантажуєш фото порожньої кімнати й підтверджуєш email. Перше фото повертається застейдженим, у 2 версіях, безкоштовно. Далі $15 за фото, $12 від пʼяти. Агенти в Каліфорнії також отримують копії з позначкою AB 723. Посилання в профілі.

`video-v3` (California): the caption above stays; on TikTok it ends "Check your MLS rules too. orvionis.com/tt".

Proposed bios, which the owner saves only once the release is live:
- TikTok (68 characters): "Virtual staging for US listings · first photo free · orvionis.com/tt". UA: «Віртуальний стейджинг для оголошень у США · перше фото безкоштовно · orvionis.com/tt».
- Instagram: "Virtual staging for real estate listings. 2 staged versions in ~2 min · first photo free · then $15/photo · AB 723 labels · orvionis.com". UA: «Віртуальний стейджинг для оголошень. 2 застейджені версії за ~2 хв · перше фото безкоштовно · далі $15 за фото · позначки AB 723 · orvionis.com».

`video-v4` (first photo free, 12 s, made on 2 Oct with the Motion Reel plugin): `ORVIONIS_VIDEO_REFERENCES/videos/orvionis_v4_first_photo_free.mp4`, cover frame `orvionis_v4_cover.png`, source `ORVIONIS_VIDEO_REFERENCES/reels/reel-orv-free-photo-src.tgz` (re-render with the skill). Real assets only: the registered before/after of order #6, the live page at 390 px, the official mark; synthesized house track and SFX, mastered to -14 LUFS, so no music licence is needed. On TikTok and Instagram a trending sound can go under it at low volume.
> Empty listing photo? Same photo, 2 minutes later. Same walls, same windows, same light. Your first photo is free, then $15 a photo. Link in bio.
> #realestate #virtualstaging #realtor #listingphotos #homestaging #realestateagent

UA: Порожнє фото оголошення? Те саме фото, 2 хвилини потому. Ті самі стіни, ті самі вікна, те саме світло. Перше фото безкоштовно, далі $15 за фото. Посилання в профілі.

- TikTok: replace "Link in bio." with "orvionis.com/tt", and turn on TikTok's "AI-generated content" label (the staged room is AI output).
- YouTube Shorts title: "Empty room to staged listing photo in 2 minutes (first photo free)"; answer "yes" to the altered or synthetic content question, as with v1.

`video-v5` (California, AB 723, 12 s, 2 Oct): `ORVIONIS_VIDEO_REFERENCES/videos/orvionis_v5_ab723_california.mp4`, cover `orvionis_v5_cover.png`, source `reels/reel-orv-ab723-src.tgz`. Hook "CALIFORNIA AGENT?", then "STAGED PHOTOS NEED A DISCLOSURE.", the real "Virtually staged" label stamped at the pipeline's own position, and "LABELED COPIES · ORIGINAL PHOTO PAGE · QR CODE FOR FLYERS".
> California agents: since Jan 1, 2026, AB 723 wants a disclosure next to every virtually staged listing photo and the original available to buyers. Every ORVIONIS order comes with labeled copies, a page with the original photo and a QR code for flyers. Your first photo is free. Not legal advice, check your MLS rules too. Link in bio.
> #californiarealestate #realestate #virtualstaging #realtor #ab723

UA: Агенти в Каліфорнії: з 1 січня 2026 року AB 723 вимагає позначку біля кожного віртуально застейдженого фото в оголошенні й доступ покупців до оригіналу. Кожне замовлення ORVIONIS містить копії з позначкою, сторінку з оригінальним фото і QR-код для флаєрів. Перше фото безкоштовно. Це не юридична порада, правила своєї MLS теж перевірте. Посилання в профілі.

On TikTok: "orvionis.com/tt" instead of "Link in bio." and the AI-generated content label on.

`video-v6` (3D, "explosive", 11.25 s, 2 Oct): `ORVIONIS_VIDEO_REFERENCES/videos/orvionis_v6_explosive_3d.mp4`, TikTok cut `orvionis_v6_explosive_3d_tiktok.mp4` (end card orvionis.com/tt), cover `orvionis_v6_cover.png`, source `reels/reel-orv-explosive-src.tgz` (`tools_scene3d.py` builds the 3D layers from the two real photos, `scene3d.js` renders them, `sound.sh` rebuilds the audio). The 3D is an edit of the photo: nothing in it is generated. Audio re-done 2 Oct 13:05 UTC (the first copies had a clipped music bed; use only the files in `videos/` from that time on).
> 3, 2, 1… staged. Same empty room, now with a sofa, rug, art and plants. Walls and windows untouched. Your first photo is free, then $15 a photo. Link in bio.
> #realestate #virtualstaging #realtor #listingphotos #homestaging #realestateagent #justlisted

UA: 3, 2, 1… застейджено. Та сама порожня кімната, тепер з диваном, килимом, картинами й рослинами. Стіни й вікна не змінені. Перше фото безкоштовно, далі $15 за фото. Посилання в профілі.

- TikTok: the `_tiktok` file, "orvionis.com/tt" instead of "Link in bio.", AI-generated content label on.
- YouTube Shorts title: "3, 2, 1… staged: empty room to furnished listing photo (first photo free)"; "yes" to altered or synthetic content.
- If someone asks for 3D tours: "Not yet. You get two staged photos of each room, the 3D move is just how we edited the video." UA: «Поки ні. Ти отримуєш дві застейджені фотографії кожної кімнати, а 3D-рух — це просто монтаж відео.»

`video-v7` (AI staging + real 3D, 11.25 s, 2 Oct): the owner bought Higgsfield Pro and asked for "the most awesome video". Beats 4–10 are an AI shot (Higgsfield, MiniMax H3, 2K) whose first frame is the real empty photo of order #6 and whose last frame is the real staged result: the rug unrolls, then sofa, tables, chairs, art and tree appear, time-remapped so each piece lands on a half beat. Everything else is real (3D doorway walk, divider, live page, offer). Final files (2 Oct 12:25 UTC, 1-frame caption ghost fixed; audio fixed 13:05 UTC, see GROWTH_EXPERIMENTS E15) are in `ORVIONIS_VIDEO_REFERENCES/videos/` (`orvionis_v7_ai_staging.mp4`, TikTok cut `orvionis_v7_ai_staging_tiktok.mp4`, cover `orvionis_v7_cover.png`); plates and the composite script are in `ORVIONIS_VIDEO_REFERENCES/reels/v7/` and on the repo branch `marketing-media` (never deployed; used because the cloud sandboxes can only meet on GitHub).
> 3, 2, 1… watch this empty room stage itself. Rug, sofa, tables, chairs, art. Same walls, same windows. Your first photo is free, then $15 a photo. Link in bio.
> #realestate #virtualstaging #realtor #listingphotos #homestaging #realestateagent #justlisted

UA: 3, 2, 1… дивись, як порожня кімната сама себе обставляє. Килим, диван, столи, крісла, картини. Ті самі стіни, ті самі вікна. Перше фото безкоштовно, далі $15 за фото. Посилання в профілі.

- TikTok: the TikTok cut, "orvionis.com/tt" instead of "Link in bio.", **AI-generated content label on** (the clip contains AI video).
- YouTube: "yes" to altered or synthetic content.
- If asked whether we make such videos: "The video is our edit. You get two staged photos of each room, in about two minutes." UA: «Відео — це наш монтаж. Ти отримуєш дві застейджені фотографії кожної кімнати приблизно за дві хвилини.»

`video-v8` (one room, six styles, 16 s, 2 Oct): the owner said the videos all look alike and asked for new photos and a new idea. A free-licence stock photo of an empty living room (Pexels 3958955) was staged in production by the marketing lab (`src/lib/ops/lab.ts`) in all six styles with the exact customer pipeline; the video shows one of the two delivered versions per style, as delivered (each registered onto the empty photo's frame by a sub-1 % shift so the walls hold still at the cuts). Hook "ONE EMPTY ROOM." → the six results flash by → "SAME PHOTO." → each style for four beats with story bars, a wipe on every downbeat and punch-ins on three of them → "WHICH ONE WOULD YOU LIST? Comment 1 – 6" over all six → "FIRST PHOTO FREE." + URL. New synthesized track (135 bpm, F dorian), -14.1 LUFS, stems checked for clipping. Files in `ORVIONIS_VIDEO_REFERENCES/videos/`: `orvionis_v8_six_styles.mp4`, TikTok cut `orvionis_v8_six_styles_tiktok.mp4` (orvionis.com/tt), cover `orvionis_v8_cover.png`; source `reels/reel-orv-v8-src.tgz`.
> Same empty living room, six styles: modern, Scandinavian, farmhouse, mid-century, luxury, coastal. The walls, the windows and even the ceiling fan stay exactly where they were. Which one would you list it with? Comment 1–6. First photo free, then $15 a photo. Link in bio.
> #virtualstaging #realestate #realtor #listingphotos #homestaging #interiordesign #realestateagent

UA: Та сама порожня вітальня, шість стилів: модерн, скандинавський, фермерський, мідсенчурі, люкс, прибережний. Стіни, вікна і навіть стельовий вентилятор лишаються точно там, де були. З яким би ти виставив її на продаж? Напиши в коментарях 1–6. Перше фото безкоштовно, далі $15 за фото. Посилання в профілі.

- TikTok: the TikTok cut, "orvionis.com/tt" instead of "Link in bio.", **AI-generated content label on** (the staged photos are AI edits).
- YouTube: "yes" to altered or synthetic content.
- Pin a first comment with the answer key if people ask which is which: "1 modern · 2 Scandinavian · 3 farmhouse · 4 mid-century · 5 luxury · 6 coastal".
- If asked whose listing it is: "None — it's a free stock photo of an empty room, staged by ORVIONIS for this video. Your own photo works the same way: the first one is free." UA: «Нічий — це безкоштовне стокове фото порожньої кімнати, яке ORVIONIS застейджив для цього відео. З твоїм фото працює так само: перше безкоштовно.»

`video-v9` (guess the style, 16.9 s, made 2 Oct for 3 Oct): four other lab rooms (a white bedroom, a living room with a stone fireplace, a green living room with a vaulted ceiling, a portrait bedroom). Each round: the empty room, then the staged result with three style options, a 2-1 countdown and the answer in green; ends on "How many did you get? Comment your score: 0 – 4" and "First photo free". New track (128 bpm, A minor), -14.1 LUFS, stems checked. Files in `ORVIONIS_VIDEO_REFERENCES/videos/`: `orvionis_v9_guess_the_style.mp4`, TikTok cut `orvionis_v9_guess_the_style_tiktok.mp4`, cover `orvionis_v9_cover.png`; source `reels/reel-orv-v9-src.tgz`.
> Guess the style: 4 empty rooms, staged by ORVIONIS. How many did you get? Comment your score, 0–4. First photo free, then $15 a photo. Link in bio.
> #virtualstaging #realestate #realtor #interiordesign #homestaging #listingphotos

UA: Вгадай стиль: 4 порожні кімнати, обставлені ORVIONIS. Скільки вгадав? Напиши свій рахунок у коментарях, від 0 до 4. Перше фото безкоштовно, далі $15 за фото. Посилання в профілі.

- TikTok: the TikTok cut, "orvionis.com/tt" instead of "Link in bio.", AI-generated content label on. YouTube: "yes" to altered or synthetic content.
- Reply to score comments ("4/4, nice eye") — replies keep the video in circulation.

More before/after sets now come from the marketing lab: add free-licence empty-room photos to `src/content/lab-requests.ts` (append only), deploy, and production stages them within its budget share; the media bridge (branch `media-bridge`) fetches the results. Already staged on 2 Oct: four more rooms (a white bedroom, a living room with a stone fireplace, one with green walls and a vaulted ceiling, a portrait bedroom), 2–3 styles each, for the next videos (e.g. "guess the real photo").

## What to say when they ask

- "Can I see examples?" → send the sample link for that tool (`/tools/<slug>#example`): the listing-description sample is the full deliverable, the pricing-guide sample is the real PDF. For clips, until a paid set exists: "the first clip is free — send the link and you'll have it tomorrow"; after: a delivered set with the customer's permission.
- "Do you use my footage anywhere?" → "No. Your footage is only used for your clips and deleted after 30 days" (matches the Privacy Policy retention setting).
- "Why not Fiverr?" → "Same price range, but the brief is structured, captions and fair-housing check are included, and you deal with one person who answers."
