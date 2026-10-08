/**
 * Outreach templates for the first-customer experiments. Shown in /admin/content and docs/OUTREACH.md.
 * Format: EN (send as-is) + UA control translation + what to personalise. No invented numbers or testimonials.
 */
export type OutreachTemplate = {
  key: string;
  channel: string;
  when: string;
  en: string;
  ua: string;
  personalize: string;
};

export const outreachTemplates: OutreachTemplate[] = [
  {
    key: "re-ig-dm-9",
    channel: "Instagram DM → any real-estate agent (cold), $9 entry offer",
    when: "First contact for cold agents. Lowest-friction paid step; clips are the upsell after one paid order.",
    en: `Hey [name], the [street] listing looks sharp. I write MLS descriptions + the Instagram/Facebook captions from the listing facts — you send price, beds, the five things worth mentioning, it comes back in about five minutes, within your board's character limit and checked for fair-housing wording. $9 a listing, no subscription. Here's a full sample so you can judge the writing: orvionis.com/tools/listing-description#example. Want to try it on your next one?`,
    ua: `Привіт, [name], лістинг на [street] виглядає класно. Я пишу описи для MLS + підписи для Instagram/Facebook з фактів лістингу — ти надсилаєш ціну, спальні, п'ять речей, які варто згадати, і за близько п'ять хвилин отримуєш текст у межах ліміту символів твоєї MLS, перевірений на fair-housing формулювання. $9 за лістинг, без підписки. Ось повний зразок, щоб оцінити текст: orvionis.com/tools/listing-description#example. Хочеш спробувати на наступному?`,
    personalize: "[name], [street]. Link with ?utm_source=instagram_dm&exp=e3-listing-description.",
  },
  {
    key: "re-ig-dm-staging",
    channel: "Instagram DM → agent or listing photographer who posted a vacant listing (empty rooms in the photos)",
    when: "First contact when the listing is clearly empty. Strongest visual proof we have; the before/after does the selling.",
    en: `Hey [name], the [street] listing shoots well but the empty rooms are working against you. I stage room photos in about two minutes each: same walls, floors and windows, just furniture added. First room is free; the whole listing is $49 (up to 5 rooms, two versions each, plus the MLS description), or $15 a room. No subscription. Before/after: orvionis.com/tools/virtual-staging#example. Want to try it on the living room?`,
    ua: `Привіт, [name], лістинг на [street] добре знятий, але порожні кімнати працюють проти тебе. Я стейджу фото кімнат приблизно за дві хвилини на кожне: ті самі стіни, підлога й вікна, лише додані меблі. Перша кімната — безкоштовно; вся квартира — $49 (до 5 кімнат, по дві версії, плюс опис для MLS), або $15 за кімнату. Без підписки. До/після: orvionis.com/tools/virtual-staging#example. Хочеш спробувати на вітальні?`,
    personalize: "[name], [street], the room you name (living room / primary bedroom). Link with ?utm_source=instagram_dm&exp=e4-virtual-staging. Only send to listings that are actually empty.",
  },
  {
    key: "re-ig-dm-staging-ca",
    channel: "Instagram DM → California agent with a vacant listing (empty rooms in the photos)",
    when: "California only. AB 723 has required disclosure on digitally altered listing photos since January 1, 2026 — lead with the compliance angle, the before/after does the rest.",
    en: `Hey [name], quick one on the [street] listing. If you stage those empty rooms virtually, AB 723 now wants a label next to each staged photo and a link to the original. My staging covers that: labeled copies, a public page and QR code with the original, and the line to paste. $15 a photo, and your first photo is free. Before/after: orvionis.com/tools/virtual-staging#example`,
    ua: `Привіт, [name], коротко про лістинг на [street]. Якщо стейджитимеш ці порожні кімнати віртуально, AB 723 тепер вимагає позначку біля кожного застейдженого фото і посилання на оригінал. Мій стейджинг це покриває: копії з позначкою, публічна сторінка й QR-код з оригіналом і рядок, який треба вставити. $15 за фото, а перше фото — безкоштовно. До/після: orvionis.com/tools/virtual-staging#example`,
    personalize: "[name], [street]. California listings only; add ?utm_source=instagram_dm&exp=e4-virtual-staging. Never claim legal certainty — it helps them comply, they stay responsible.",
  },
  {
    key: "re-free-checker",
    channel: "Reddit / Facebook group post or comment — value first, no paid pitch",
    when: "Where tools are allowed. Answer replies; the checker itself links to the $9 tool.",
    en: `Made a small free thing for anyone writing listing copy: paste the description, it highlights the phrases that get flagged under fair housing ("perfect for families", "safe neighborhood", "walking distance to church"…) with a plain-English fix for each, and counts characters against your MLS limit. Runs in the browser, nothing is stored. orvionis.com/free/fair-housing-checker — tell me which phrases I'm missing.`,
    ua: `Зробив невелику безкоштовну штуку для всіх, хто пише тексти лістингів: вставляєш опис, воно підсвічує фрази, які підпадають під fair housing («perfect for families», «safe neighborhood», «walking distance to church»…) з простою правкою для кожної, і рахує символи проти ліміту твоєї MLS. Працює в браузері, нічого не зберігається. orvionis.com/free/fair-housing-checker — скажіть, яких фраз бракує.`,
    personalize: "Nothing. Never follow up with a paid pitch in the same thread.",
  },
  {
    key: "re-ig-dm-1",
    channel: "Instagram DM → real-estate agent who posted a listing walkthrough in the last 7 days",
    when: "First contact. Send after liking/commenting on the actual walkthrough post.",
    en: `Hey [name], saw the walkthrough of [street or neighborhood] — the [specific shot, e.g. kitchen island] shot is a good one. I cut listing videos into 5 vertical clips (price, beds/baths on screen, captions written, your branding) for $49, back in 48 hours. It's new, so I'm looking for a few agents to be first. Want me to cut one clip from that video for free so you can see the style?`,
    ua: `Привіт, [name], бачив прохідку по [street or neighborhood] — кадр з [specific shot, наприклад, кухонний острів] вдалий. Я нарізаю відео лістингів на 5 вертикальних кліпів (ціна, спальні/ванни на екрані, підписи написані, твій брендинг) за $49, повертаю за 48 годин. Це нове, тому шукаю кількох агентів, які будуть першими. Хочеш, зроблю один кліп із цього відео безкоштовно, щоб ти побачив(ла) стиль?`,
    personalize: "[name], [street or neighborhood], [specific shot] — must reference the real post; the free clip offer is optional (drop the last sentence to test paid-only).",
  },
  {
    key: "re-ig-dm-followup",
    channel: "Instagram DM follow-up",
    when: "3–4 days after message 1 if no reply.",
    en: `Quick one — still happy to cut that free clip if you have another listing coming up. No worries if it's not your thing.`,
    ua: `Коротко — все ще радий нарізати той безкоштовний кліп, якщо в тебе на підході ще один лістинг. Без проблем, якщо це не твоє.`,
    personalize: "Nothing — send as is.",
  },
  {
    key: "re-fb-group-post",
    channel: "Facebook group for agents (where self-promo is allowed) / r/realtors only if rules permit",
    when: "Value-first post; link only in comments if rules require.",
    en: `Agents who shoot their own walkthroughs: what do you do with the footage after the tour? I've been cutting them into 5 vertical clips with price/beds/baths on screen and captions written — the kind of thing an editor charges $50+ per clip for. I'm doing it for $49 per listing (5 clips, 48h) while I figure out if agents actually want this, so the first 10 orders are the test. Happy to answer questions about what footage works.`,
    ua: `Агенти, які самі знімають прохідки: що ви робите з відео після туру? Я нарізаю їх на 5 вертикальних кліпів із ціною/спальнями/ваннами на екрані та написаними підписами — те, за що монтажер бере $50+ за кліп. Роблю це за $49 за лістинг (5 кліпів, 48 год), поки з'ясовую, чи агентам це справді потрібно, тож перші 10 замовлень — це тест. Радо відповім на питання про те, яке відео підходить.`,
    personalize: "Nothing, but read the group rules first; post the link only where allowed.",
  },
  {
    key: "re-photo-ig-dm-credits",
    channel: "Instagram DM → real-estate photographer (not on Aryeo) who posted a recent listing shoot",
    when: "First contact for the photographer share of the daily send pack (court session 2: 25 %). Pro credits are the offer; the free first room is the low-risk test.",
    en: `Hey [name], saw your [street or neighborhood] shoot, the [specific shot, e.g. twilight exterior] is a good one. Quick question: do your agents ever ask for virtual staging? I built a stager that does a room in about two minutes, two versions each, no logo on the files, so you can offer it as your own add-on. 25 rooms are $149 (about $6 a room), no subscription. Before/after: orvionis.com/photographers. First room's free if you want to try it on one of your photos.`,
    ua: `Привіт, [name], бачив твою зйомку на [street or neighborhood], кадр [specific shot, наприклад, вечірній фасад] вдалий. Коротке питання: твої агенти колись просять віртуальний стейджинг? Я зробив стейджер, який робить кімнату приблизно за дві хвилини, по дві версії, без логотипа на файлах, тож ти можеш пропонувати це як свою додаткову послугу. 25 кімнат — $149 (приблизно $6 за кімнату), без підписки. До/після: orvionis.com/photographers. Перша кімната безкоштовна, якщо хочеш спробувати на одному зі своїх фото.`,
    personalize: "[name], [street or neighborhood], [specific shot] from a real recent post. Only photographers who don't deliver through Aryeo (Zillow gives Aryeo users AI staging at no extra cost). Link with ?utm_source=instagram_dm&exp=e20-pro-credits.",
  },
  {
    key: "re-team-dm-credits",
    channel: "Instagram DM → lead of a small team or brokerage with 5+ active listings",
    when: "The team share of the daily send pack (court session 2: 15 %). Several vacant listings at once make the prepaid pack the natural offer.",
    en: `Hey [name], [team name] has [N] listings up right now, nice run. Quick one: when some of them are vacant, I can stage the empty rooms in about two minutes a photo, two versions each. For teams there's a prepaid pack: 25 rooms for $149 (about $6 a room), shared by whoever signs in with your team's email. No subscription. Before/after: orvionis.com/tools/pro-credits. First room's free if you want to test it on one listing.`,
    ua: `Привіт, [name], у [team name] зараз [N] активних оголошень, гарний темп. Коротко: коли деякі з них порожні, я можу застейджити порожні кімнати приблизно за дві хвилини на фото, по дві версії. Для команд є передоплачений пакет: 25 кімнат за $149 (приблизно $6 за кімнату), спільний для всіх, хто входить із робочою поштою команди. Без підписки. До/після: orvionis.com/tools/pro-credits. Перша кімната безкоштовна, якщо хочеш спробувати на одному оголошенні.`,
    personalize: "[name], [team name], [N] = the active listings you counted on their own page or profile (5 or more). Link with ?utm_source=instagram_dm&exp=e20-pro-credits.",
  },
  {
    key: "re-builder-dm-staging",
    channel: "Instagram DM → small builder or new-construction sales agent with finished spec homes photographed empty",
    when: "The builder share of the daily send pack (court session 2: 10 %). Only where the listing photos show empty rooms.",
    en: `Hey [name], the [community or street] homes look sharp. Quick question: are any of the finished specs listed empty? I stage room photos in about two minutes each, same walls, floors and windows, just furniture added, so buyers see them lived-in without staging every home. First room's free; a whole home is $49 (up to 5 rooms plus the MLS description), or 25 rooms for $149 across your homes. Before/after: orvionis.com/tools/virtual-staging#example`,
    ua: `Привіт, [name], будинки в [community or street] виглядають класно. Коротке питання: чи є серед готових будинків такі, що виставлені порожніми? Я стейджу фото кімнат приблизно за дві хвилини кожне, ті самі стіни, підлога й вікна, лише додані меблі, тож покупці бачать їх обжитими без стейджингу кожного будинку. Перша кімната безкоштовна; цілий будинок — $49 (до 5 кімнат плюс опис для MLS), або 25 кімнат за $149 на всі ваші будинки. До/після: orvionis.com/tools/virtual-staging#example`,
    personalize: "[name], [community or street] from their own recent post or listing. Only builders whose listing photos show empty rooms (furnished models need nothing). Link with ?utm_source=instagram_dm&exp=e4-virtual-staging.",
  },
  {
    key: "re-reply-yes-preview",
    channel: "Instagram DM → an agent who answered yes (or asked to see it) after a first message",
    when: "Same day as the reply (court session 2, lever 2). Their own room is the strongest proof; the self-serve link is the fallback.",
    en: `Great! Send me a photo of one empty room (or tell me which listing photo I can use) and I'll send you a private link with it staged today. Or, if you'd rather try it yourself: orvionis.com/tools/virtual-staging, the first photo's free.`,
    ua: `Чудово! Надішли мені фото однієї порожньої кімнати (або скажи, яке фото з оголошення можна взяти), і я сьогодні надішлю тобі приватне посилання з уже застейдженою кімнатою. Або, якщо хочеш спробувати сам: orvionis.com/tools/virtual-staging, перше фото безкоштовне.`,
    personalize: "Nothing. When the photo comes: Admin → Orders → + Prospect preview (one room, their handle), then send the link from re-preview-link.",
  },
  {
    key: "re-preview-link",
    channel: "Instagram DM → the same agent, once their prospect preview is ready",
    when: "Right after Admin → Orders → + Prospect preview shows the page (the \"Preview for … is ready\" email has this text with the link filled in).",
    en: `Here's your room staged: [link] Two versions, plus labeled copies for ads and social. If you like it, the rest of the listing is $39 this week (4 more rooms + the description).`,
    ua: `Ось твоя кімната зі стейджингом: [link] Дві версії, плюс копії з позначкою для реклами й соцмереж. Якщо сподобається, решта оголошення — $39 цього тижня (ще 4 кімнати + опис).`,
    personalize: "[link]: the private page from the admin preview list (or the email). Follow up in 48 hours if they go quiet (court: every free-photo user within 48 h).",
  },
  {
    key: "photo-ig-dm-1",
    channel: "Instagram DM / Facebook group DM → wedding or portrait photographer",
    when: "First contact after engaging with their work.",
    en: `Hey [name], your [type, e.g. beach elopement] set from [month] is lovely. I built a small tool that writes and designs a branded pricing guide PDF from your real packages — about five minutes of questions, $29, no subscription. It's new and I'm looking for the first photographers to try it and tell me what's missing. Want the link?`,
    ua: `Привіт, [name], твоя серія [type, наприклад, пляжний елопмент] з [month] чудова. Я зробив невеликий інструмент, який пише й верстає брендований PDF прайс-гайд із твоїх реальних пакетів — близько п'яти хвилин запитань, $29, без підписки. Це нове, і я шукаю перших фотографів, які спробують і скажуть, чого бракує. Скинути посилання?`,
    personalize: "[name], [type], [month] — reference a real recent post.",
  },
  {
    key: "delivery-followup",
    channel: "Email after delivery (any tool)",
    when: "24 hours after delivery.",
    en: `Hi [name], did the [deliverable] do its job? If anything's off, reply with what to change — one revision is included. And if it worked, would you mind telling me in one line what made you say yes? It helps me decide what to build next.`,
    ua: `Привіт, [name], [deliverable] зробив свою справу? Якщо щось не так, відпиши, що змінити — одна правка включена. А якщо спрацювало, не проти сказати одним рядком, що змусило тебе погодитися? Це допомагає мені вирішити, що будувати далі.`,
    personalize: "[name], [deliverable] (e.g. 'the 5 clips', 'the pricing guide').",
  },
];
