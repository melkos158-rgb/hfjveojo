# Ride Lab

Sklep z gotowymi, drukowanymi w 3D częściami do hulajnóg elektrycznych. Chełm, Polska.
Shop for ready-made 3D-printed e-scooter parts. Chełm, Poland.

Pełna specyfikacja: [PLAN.md](PLAN.md).

## Stack

Node 20+ · Express · PostgreSQL · Stripe Checkout · zero build step. Zdjęcia w bazie (`bytea`), strony renderowane po stronie serwera (PL + EN), panel admina pod ukrytym adresem.

## Uruchomienie lokalne

```bash
npm install
export DATABASE_URL=postgres://postgres@localhost:5432/ridelab
export ADMIN_PATH=/panel-lokalny
npm start
# http://localhost:3000  →  /pl/  |  /en/  |  /panel-lokalny
```

Przy pierwszym starcie tworzą się tabele, przykładowy produkt i zdjęcia na stronę główną. W logu pojawia się `ADMIN SETUP TOKEN` — potrzebny do ustawienia hasła w panelu.

## Zmienne środowiskowe (Railway → Variables)

| Zmienna | Wymagana | Opis |
| --- | --- | --- |
| `DATABASE_URL` | tak | `${{Postgres.DATABASE_URL}}` — referencja do serwisu PostgreSQL |
| `ADMIN_PATH` | tak | ukryty adres panelu, np. `/panel-x7k2m9` |
| `SITE_URL` | tak | publiczny adres, np. `https://twojadomena.pl` (sitemap, Stripe redirect) |
| `STRIPE_SECRET_KEY` | do płatności online | `sk_live_…` z Stripe → Developers → API keys. Bez klucza działa tylko płatność przy odbiorze |
| `STRIPE_WEBHOOK_SECRET` | nie | opcjonalny webhook `checkout.session.completed` na `/api/stripe/webhook` |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET` | nie | Cloudflare Turnstile zamiast wbudowanego testu „nie jestem robotem” |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | nie | powiadomienia o zamówieniach (można też ustawić w panelu) |

## Struktura

```
server.js            start, routing, nagłówki bezpieczeństwa
src/db.js            PostgreSQL, migracje, seed
src/i18n.js          słowniki PL/EN, mapa adresów
src/security.js      rate-limit, proof-of-work, sesje, hasła, CSRF
src/payments.js      Stripe Checkout
src/notify.js        Telegram
src/render/          szablony: layout, strony publiczne, panel
src/routes/          public, api, admin
public/              site.css, site.js, admin.css, admin.js
assets/seed/         zdjęcia przykładowego produktu
```
