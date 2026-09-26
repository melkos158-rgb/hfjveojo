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
    en: `Hey [name], the [street] listing shoots well but the empty rooms are working against you. I stage room photos in about two minutes: same walls, floors and windows, just furniture added. There's a free watermarked preview on your own photo, and the full set (two versions) is $15, no subscription. Before/after: orvionis.com/tools/virtual-staging#example. Want to try it on the living room?`,
    ua: `Привіт, [name], лістинг на [street] добре знятий, але порожні кімнати працюють проти тебе. Я стейджу фото кімнат приблизно за дві хвилини: ті самі стіни, підлога й вікна, лише додані меблі. На своєму фото можна безкоштовно подивитися превʼю з водяним знаком, а повний комплект (дві версії) коштує $15, без підписки. До/після: orvionis.com/tools/virtual-staging#example. Хочеш спробувати на вітальні?`,
    personalize: "[name], [street], the room you name (living room / primary bedroom). Link with ?utm_source=instagram_dm&exp=e4-virtual-staging. Only send to listings that are actually empty.",
  },
  {
    key: "re-ig-dm-staging-ca",
    channel: "Instagram DM → California agent with a vacant listing (empty rooms in the photos)",
    when: "California only. AB 723 has required disclosure on digitally altered listing photos since January 1, 2026 — lead with the compliance angle, the before/after does the rest.",
    en: `Hey [name], quick one on the [street] listing. If you stage those empty rooms virtually, AB 723 now wants a label next to each staged photo and a link to the original. My staging covers that: labeled copies, a public page and QR code with the original, and the line to paste. $15 a photo, free watermarked preview first. Before/after: orvionis.com/tools/virtual-staging#example`,
    ua: `Привіт, [name], коротко про лістинг на [street]. Якщо стейджитимеш ці порожні кімнати віртуально, AB 723 тепер вимагає позначку біля кожного застейдженого фото і посилання на оригінал. Мій стейджинг це покриває: копії з позначкою, публічна сторінка й QR-код з оригіналом і рядок, який треба вставити. $15 за фото, спершу безкоштовне превʼю з водяним знаком. До/після: orvionis.com/tools/virtual-staging#example`,
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
