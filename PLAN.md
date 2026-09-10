# RIDE LAB — план магазину готових 3D-друкованих деталей до самокатів

Магазин для Хелма (Chełm, PL). Продаємо **готові, вже надруковані деталі**, не файли.
Поки що тільки Хелм: відбір особистий або доставка по місту. Реєстрації покупців немає.
Дві мови: **PL (основна)** і **EN**. Адмінка на прихованому URL, вхід по паролю.

---

## 1. Стек

| Шар | Вибір | Чому |
| --- | --- | --- |
| Сервер | Node 22 + Express | Railway вже підхопив Node; один процес, серверний рендер |
| БД | PostgreSQL на Railway | Персистентність між деплоями; фото зберігаємо в БД (`bytea`), бо диск на Railway ефемерний |
| Оплата | Stripe Checkout (hosted) у PLN | Не тримаємо карток у себе; Stripe сам робить SCA/3DS |
| Рендер | Серверні шаблони (JS template literals) | Google бачить готовий HTML, без JS-рендеру |
| Стилі | Один `site.css` + `admin.css`, без фреймворків | Той самий стиль, що вже є: чорне тло, бурштин `#F4C430`, Barlow Condensed + IBM Plex |
| Залежності | `express`, `pg`, `stripe`, `multer` | Мінімум; сесії, HMAC, rate-limit, антибот — свої, на `crypto` |

## 2. Карта URL

Кожна публічна сторінка існує у двох мовах. `/` → редірект на `/pl/` (або `/en/`, якщо є cookie мови).

| Сторінка | PL | EN |
| --- | --- | --- |
| Головна | `/pl/` | `/en/` |
| Магазин (усі товари, пошук, сортування) | `/pl/sklep` | `/en/shop` |
| Товар | `/pl/produkt/:slug` | `/en/product/:slug` |
| Кошик + чекаут | `/pl/koszyk` | `/en/cart` |
| Успішне замовлення | `/pl/zamowienie/:number` | `/en/order/:number` |
| Про нас | `/pl/o-nas` | `/en/about` |
| Контакт | `/pl/kontakt` | `/en/contact` |
| FAQ | `/pl/faq` | `/en/faq` |
| Регламін (обовʼязково для PL e-commerce) | `/pl/regulamin` | `/en/terms` |
| Політика приватності / RODO | `/pl/polityka-prywatnosci` | `/en/privacy` |
| Sitemap / robots | `/sitemap.xml`, `/robots.txt` | — |
| Фото | `/img/:id` (кеш 1 рік, immutable) | — |
| Адмінка | `ADMIN_PATH` зі змінної середовища, напр. `/panel-x7k2m9` | — |

Категорій немає — це магазин, а не каталог. Замість категорій: пошук по назві й моделі самоката + сортування.

## 3. Публічні сторінки — що на кожній

### Головна
1. **Hero з ротацією фото.** Слайди керуються з адмінки (фото + заголовок PL/EN + підзаголовок). Міняються кожні 6 с із плавним переходом, є крапки-індикатори. Якщо слайдів нема — SVG-пейзаж, який уже є.
2. Заголовок: «Gotowe części 3D do Twojej hulajnogi» / «Ready-made 3D-printed parts for your scooter». Дві кнопки: «Zobacz sklep», «Nie ma Twojego modelu?».
3. **Плашка Хелм**: «Działamy w Chełmie — odbiór osobisty lub dostawa po mieście».
4. **Jak to działa** — 3 кроки: Wybierz część → Drukujemy (1–3 dni) → Odbierz w Chełmie / dostawa.
5. **Товари** — усі активні (до 8), далі кнопка «Wszystkie części».
6. **Dlaczego my** — 4 тези: dopasowanie do modelu, PETG/ASA odporne na pogodę, wymiana jeśli pęknie w 30 dni, lokalnie w Chełmie.
7. **Nie ma Twojego modelu?** — форма запиту: модель самоката, яка деталь, контакт. Йде в адмінку → розділ «Zapytania». Це головний інструмент дізнатись попит на старті.
8. FAQ (5 питань) + контакт (телефон, WhatsApp, адреса відбору, години).

### Магазин `/sklep`
Сітка карток: фото, назва, під яку модель, ціна, статус (в наявності / на замовлення N днів). Пошук (назва, модель самоката), сортування (нові / ціна ↑ / ціна ↓). Пусто → підказка залишити запит.

### Товар `/produkt/:slug` (за макетом)
- Хлібні крихти: Home → Sklep → назва.
- Великий заголовок + підзаголовок («Mocniejszy. Czystszy. Więcej ochrony.»), три бейджі (3D-druk, łatwy montaż, wytrzymały).
- Галерея: головне фото + вертикальні мініатюри, стрілки, свайп на мобілці.
- Права колонка: ціна (brutto, z VAT), «Dodaj do koszyka», «Kup teraz», далі три довірчі пункти: odbiór w Chełmie, gotowe w N dni, bezpieczna płatność Stripe / płatność przy odbiorze.
- Блок **Specyfikacja**: pasuje do (моделі), materiał, kolor, waga, czas druku, gwarancja.
- Вкладки: **Opis** / **Montaż** / **Druk i materiał** (PL і EN окремо з адмінки; якщо EN порожнє — показуємо PL).
- Плашка Хелм.
- **Podobne części** — інші активні товари.
- JSON-LD `Product` + `Offer` (ціна, наявність, PLN), OG-теги, canonical, hreflang.

### Кошик `/koszyk`
Кошик живе в `localStorage`. На сторінці: позиції, кількість, сума. Далі форма чекауту:
- Imię, telefon, e-mail (опційно), спосіб отримання: **Odbiór osobisty (0 zł)** або **Dostawa po Chełmie (+X zł, з налаштувань)**, коментар.
- Чекбокс **«Nie jestem robotem»** (див. §6) + honeypot.
- Дві кнопки: **«Zapłać online»** (Stripe Checkout, є тільки якщо ключ налаштований) і **«Zamów, zapłacę przy odbiorze»** (замовлення без оплати, статус `new`).
Ціни рахуються на сервері з БД — клієнт передає лише id і кількість.

### Успіх `/zamowienie/:number`
Номер замовлення `RL-2026-0001`, склад, сума, спосіб отримання, що далі (подзвонимо / напишемо, адреса відбору). Для Stripe: сторінка сама верифікує `session_id` через API і позначає замовлення `paid` — тому вебхук не обовʼязковий на старті.

### Статичні сторінки
O nas, Kontakt, FAQ, Regulamin, Polityka prywatności — текст у коді PL/EN, контактні дані підставляються з налаштувань адмінки. Regulamin і polityka — реальні, з обовʼязковими пунктами для PL (odstąpienie od umowy 14 dni, reklamacje, RODO, administrator danych).

## 4. Адмінка (`ADMIN_PATH`)

Ніде не лінкується, `noindex`, не в sitemap, **не** в robots.txt (щоб не світити шлях).

- **Перший запуск** — сторінка «Ustaw hasło». Потрібен одноразовий setup-токен, який сервер друкує в лог Railway при старті, коли пароля ще нема. Пароль зберігається як scrypt-хеш.
- **Логін** — пароль, 5 спроб / 15 хв на IP, сесія — підписаний HMAC-cookie на 7 днів, `HttpOnly`, `SameSite=Lax`, `Secure`.
- **Dashboard (аналітика)**
  - Плитки: zamówienia dziś / przychód dziś / 7 dni / 30 dni / odsłony dziś / konwersja (zamówienia ÷ unikalni odwiedzający).
  - Графік 14 днів: замовлення + виручка; графік 14 днів: перегляди (люди) окремо від ботів.
  - Топ товарів за продажами, топ сторінок, джерела переходів, нові запити.
- **Produkty** — таблиця (фото, назва, ціна, stan, aktywny, sprzedano), дії: edytuj / duplikuj / usuń. Редактор:
  назва PL/EN, підзаголовок PL/EN, slug (авто з EN, можна змінити), ціна (zł), стара ціна (закреслена, опційно), stan magazynowy, czas realizacji (dni), aktywny,
  pasuje do (моделі, через кому), materiał, kolor, waga (g), opis PL/EN, montaż PL/EN, druk PL/EN,
  **фото**: кілька файлів, стискаються в браузері до 1600 px JPEG перед відправкою, перетягування для порядку, перше = обкладинка.
- **Zamówienia** — список зі статусами `new` (без оплати) / `paid` / `fulfilled` (wydane) / `cancelled`, фільтр, деталь, зміна статусу, примітка. Позначка «opłacone przy odbiorze».
- **Strona główna** — слайди hero: фото, заголовок/підзаголовок PL/EN, порядок, вкл/викл.
- **Zapytania** — форма «Nie ma Twojego modelu?»: модель, деталь, контакт, статус (nowe / odpowiedziano).
- **Ustawienia** — nazwa sklepu, adres odbioru, godziny, telefon, WhatsApp, e-mail, Instagram, cena dostawy po Chełmie, domyślny czas realizacji, zmiana hasła, статус Stripe (ключ є / нема), опційно Telegram-сповіщення про нові замовлення.

## 5. Модель даних (PostgreSQL)

```
settings        key text pk, value text                    -- секрети сесій, контакти, ціни
images          id, mime, bytes bytea, width, height, created_at
products        id, slug unique, name_pl, name_en, tagline_pl, tagline_en,
                price_grosze int, compare_grosze int null, stock int, lead_days int, active bool,
                fits text[], material, color, weight_g int,
                desc_pl, desc_en, install_pl, install_en, print_pl, print_en,
                sold_count int, created_at, updated_at
product_images  product_id, image_id, sort
hero_slides     id, image_id, title_pl, title_en, sub_pl, sub_en, sort, active
orders          id, number unique, status, items jsonb, subtotal_grosze, delivery_grosze, total_grosze,
                currency, customer_name, phone, email, delivery_method, note,
                stripe_session_id, paid_at, created_at, updated_at, admin_note
requests        id, scooter_model, part, contact, message, status, created_at
pageviews       id, ts, day date, path, lang, ref_host, is_bot bool, visitor_hash
```

Міграції — `CREATE TABLE IF NOT EXISTS` при старті. Якщо товарів нема — сідиться зразок (§8).

## 6. Антибот і безпека

- **Чекбокс «Nie jestem robotem»** — без стороннього акаунта: клік запускає в браузері proof-of-work (SHA-256, ~0,3–1 с), сервер перевіряє й видає підписаний токен на 10 хв. Токен обовʼязковий для чекауту, запиту деталі та контакту. Гальмує масові боти, людині — одна галочка. Якщо задати `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET` — автоматично вмикається Cloudflare Turnstile замість PoW.
- Honeypot-поле у всіх формах, rate-limit на `/api/*` по IP.
- **Google не блокуємо**: перевірка тільки на діях (POST), сторінки віддаються всім. Googlebot/Bingbot розпізнаємо по UA і в аналітиці рахуємо окремо.
- Заголовки: CSP, X-Frame-Options DENY, Referrer-Policy, HSTS. Усе екранується при рендері.
- Файли: тільки image/jpeg|png|webp, ≤ 6 MB, перевірка магічних байтів.

## 7. SEO

- `/sitemap.xml` генерується з БД: головна, sklep, кожен активний товар, статичні сторінки — у PL і EN з `xhtml:link hreflang`. `lastmod` з `updated_at`.
- `robots.txt`: allow all, disallow `/api/`, `/img/` не блокуємо (фото товарів індексуються). Адмінка — лише `noindex` мета + заголовок `X-Robots-Tag`.
- Кожна сторінка: `<title>`, description, canonical, `hreflang` pl/en/x-default, OG-теги з фото. Товар: JSON-LD Product/Offer. Головна: JSON-LD LocalBusiness (Chełm).
- Кошик, успіх, адмінка — `noindex`.

## 8. Контент на старт

- **Зразок товару**: «Rear Fender for Kukirin G4 2025» / «Tylny błotnik do Kukirin G4 2025». Фото — з макета. Ціна 59 zł, PETG, czarny, 1–2 dni, pasuje do: Kukirin G4 2025. Повний опис PL/EN, montaż, druk. Це шаблон: скопіювати через «Duplikuj» і поміняти.
- **3 hero-фото** (згенеровані; замінити своїми в адмінці): самокат на гірській дорозі на заході сонця; крупний план надрукованого крила на самокаті; 3D-принтер друкує деталь.
- Налаштування за замовчуванням: Chełm, dostawa po mieście 15 zł, czas realizacji 2 dni.

## 9. Деплой

1. Railway: до проєкту додати **PostgreSQL**; у сервісі змінні `DATABASE_URL = ${{Postgres.DATABASE_URL}}`, `ADMIN_PATH = /panel-…`, `NODE_ENV = production`, `SITE_URL`.
2. Код → `Documents\hfjveojo` → `git add -A && git commit -m "shop" && git push` → Railway передеплоїть сам.
3. Після старту в логах — `ADMIN SETUP TOKEN`. Зайти на `ADMIN_PATH`, задати пароль.
4. **Stripe**: після реєстрації — у Developers → API keys взяти **Secret key** і вставити в Railway як `STRIPE_SECRET_KEY`. Ключ вставляє власник акаунта, не я. Без ключа магазин працює в режимі «płatność przy odbiorze».
5. **Домен**: Railway → Settings → Networking → Custom Domain → CNAME/ALIAS у Namecheap Advanced DNS. `SITE_URL` оновити на домен.

## 10. Що зробив понад ТЗ (для зручності)

- Оплата при відборі — магазин приймає замовлення ще до підключення Stripe.
- Форма «Nie ma Twojego modelu?» → розділ запитів в адмінці: видно, які самокати питають у Хелмі.
- Кнопка WhatsApp у футері й на товарі (номер із налаштувань).
- «Duplikuj» товар — новий листинг за 20 секунд.
- Стискання фото в браузері — не треба нічого готувати перед завантаженням.
- Лічильник `sold_count` → «Sprzedano N» на картці, коли > 0.
- Опційні Telegram-сповіщення про нове замовлення/запит.
- Перемикач мови зберігає поточну сторінку (не кидає на головну).
