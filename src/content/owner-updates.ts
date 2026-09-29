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
  {
    id: "2026-09-30-ads-day-1",
    subject: "Реклама: перший день і мінус-слова",
    text: [
      "Реклама Google (E8), перший день показів (29 вересня):",
      "- 37 показів, 8 кліків, витрачено €11.69 з €30. Один клік коштує €1.46.",
      "- Люди з реклами дивляться сайт, але замовлення ще ніхто не почав. Для висновків рано.",
      "- Один клік (€1.48) був за запитом «free home staging software»: людина шукала безкоштовну програму, а не послугу. Отже, мінус-слова ще не додані.",
      "",
      "Що зробити (2 хвилини, найважливіше зараз):",
      "Google Ads → кампанія E8 → Ключові слова → Мінус-слова → + → встав цей рядок і збережи:",
      "software, app, apps, free, jobs, job, career, careers, hiring, salary, tutorial, how to, course, training, diy, download, template, photoshop, blender, 3d model, matterport, virtual tour, what is",
      "",
      "Дата завершення тепер не така важлива: якщо лишиш 1 жовтня, решта €18 піде 30 вересня – 1 жовтня, і я одразу підіб'ю підсумок.",
      "",
      "Facebook: під постом у Southern California Real Estate Professionals з'явився перший коментар. Готову відповідь я залишив у чаті Claude. Пост в All Realtors ще чекає на перевірку адмінів.",
    ].join("\n"),
  },
];
