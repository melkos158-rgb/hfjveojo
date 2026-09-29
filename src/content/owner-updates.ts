/**
 * Updates from the operator to the owner. The job loop emails each one once to ADMIN_EMAILS, from EMAIL_FROM
 * (hello@orvionis.com); see src/lib/ops/owner-updates.ts.
 *
 * Append only. Every id is unique and is never reused or edited after it ships: the id is what marks it as sent.
 * This repository is public, so business status only, at the level of detail docs/ already has: never personal data,
 * contact details, secrets, customer or order details.
 */
export type OwnerUpdate = {
  /** `YYYY-MM-DD-short-slug`, unique forever. */
  id: string;
  /** Subject line without the brand prefix (the sender adds "[ORVIONIS]"). */
  subject: string;
  /** Plain-text body, in the owner's language. */
  text: string;
};

export const OWNER_UPDATES: OwnerUpdate[] = [
  {
    id: "2026-09-29-email-channel",
    subject: "Тепер оновлення приходять на пошту",
    text: [
      "Привіт! Це перший лист від ORVIONIS: відтепер я надсилаю оновлення сюди, на пошту.",
      "",
      "Що буде приходити:",
      "- щоденний підсумок (гроші, реклама, Fiverr, що зроблено);",
      "- окремий лист, коли потрібне твоє рішення.",
      "",
      "Стан на 29 вересня, вечір:",
      "- Продажів поки 0. Сайт працює.",
      "- Реклама Google працює з 29 вересня; з неї вже прийшли перші відвідувачі. Скільки списано, гляну на перевірці.",
      "- Facebook: 3 пости в групах рієлторів. Два вже видно всім, третій (All Realtors) чекає на перевірку адмінів.",
      "",
      "Що потрібно від тебе:",
      "1. Google Ads → кампанія E8 → Налаштування → дата завершення 6 жовтня (бюджет €30 не чіпай). Зараз стоїть 1 жовтня.",
      "2. Так чи ні: вимкнути задачу «AI operator loop»?",
      "",
      "Відповідати на цей лист не треба: відповідь сюди до мене не дійде. Пиши в чат Claude.",
    ].join("\n"),
  },
];
