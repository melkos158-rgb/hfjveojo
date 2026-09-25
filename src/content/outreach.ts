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
