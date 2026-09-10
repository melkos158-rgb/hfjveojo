'use strict';
const { Pool, types } = require('pg');
types.setTypeParser(20, (v) => parseInt(v, 10)); // bigint → number (ids are small)
const fs = require('fs');
const path = require('path');
const { randomToken } = require('./util');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add a PostgreSQL service on Railway and reference its DATABASE_URL.');
  process.exit(1);
}
const isLocal = /localhost|127\.0\.0\.1|@postgres\.railway\.internal/.test(DATABASE_URL);
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 8,
});

const q = (text, params) => pool.query(text, params);
const one = async (text, params) => (await pool.query(text, params)).rows[0] || null;
const all = async (text, params) => (await pool.query(text, params)).rows;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (key text PRIMARY KEY, value text NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS images (
  id bigserial PRIMARY KEY, mime text NOT NULL, bytes bytea NOT NULL,
  width int, height int, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS products (
  id bigserial PRIMARY KEY, slug text UNIQUE NOT NULL,
  name_pl text NOT NULL, name_en text NOT NULL DEFAULT '',
  tagline_pl text NOT NULL DEFAULT '', tagline_en text NOT NULL DEFAULT '',
  price_grosze int NOT NULL DEFAULT 0, compare_grosze int,
  stock int NOT NULL DEFAULT 0, lead_days int NOT NULL DEFAULT 2, active boolean NOT NULL DEFAULT true,
  fits text[] NOT NULL DEFAULT '{}', material text NOT NULL DEFAULT '', color text NOT NULL DEFAULT '', weight_g int,
  desc_pl text NOT NULL DEFAULT '', desc_en text NOT NULL DEFAULT '',
  install_pl text NOT NULL DEFAULT '', install_en text NOT NULL DEFAULT '',
  print_pl text NOT NULL DEFAULT '', print_en text NOT NULL DEFAULT '',
  sold_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS product_images (
  product_id bigint REFERENCES products(id) ON DELETE CASCADE,
  image_id bigint REFERENCES images(id) ON DELETE CASCADE,
  sort int NOT NULL DEFAULT 0, PRIMARY KEY (product_id, image_id));
CREATE TABLE IF NOT EXISTS hero_slides (
  id bigserial PRIMARY KEY, image_id bigint REFERENCES images(id) ON DELETE CASCADE,
  title_pl text NOT NULL DEFAULT '', title_en text NOT NULL DEFAULT '',
  sub_pl text NOT NULL DEFAULT '', sub_en text NOT NULL DEFAULT '',
  sort int NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS orders (
  id bigserial PRIMARY KEY, number text UNIQUE NOT NULL, status text NOT NULL DEFAULT 'new',
  items jsonb NOT NULL, subtotal_grosze int NOT NULL, delivery_grosze int NOT NULL DEFAULT 0, total_grosze int NOT NULL,
  currency text NOT NULL DEFAULT 'pln', customer_name text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '',
  delivery_method text NOT NULL DEFAULT 'pickup', address text NOT NULL DEFAULT '', note text NOT NULL DEFAULT '',
  lang text NOT NULL DEFAULT 'pl', payment text NOT NULL DEFAULT 'pickup',
  stripe_session_id text, paid_at timestamptz, admin_note text NOT NULL DEFAULT '', counted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS requests (
  id bigserial PRIMARY KEY, kind text NOT NULL DEFAULT 'part', scooter_model text NOT NULL DEFAULT '',
  part text NOT NULL DEFAULT '', contact text NOT NULL DEFAULT '', message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new', lang text NOT NULL DEFAULT 'pl', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS pageviews (
  id bigserial PRIMARY KEY, ts timestamptz NOT NULL DEFAULT now(), day date NOT NULL,
  path text NOT NULL, lang text, ref_host text, is_bot boolean NOT NULL DEFAULT false, visitor text);
CREATE SEQUENCE IF NOT EXISTS order_seq;
CREATE INDEX IF NOT EXISTS pageviews_day ON pageviews(day);
CREATE INDEX IF NOT EXISTS orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS products_active ON products(active);
`;

// ---------- settings (cached) ----------
let settingsCache = null;
const DEFAULTS = {
  shop_name: 'Ride Lab',
  legal_name: '',            // full company/seller name for Regulamin
  nip: '',
  address: 'Chełm, ul. — (uzupełnij w Ustawieniach)',
  hours: 'pon–pt 10:00–18:00, sob 10:00–14:00',
  phone: '+48 000 000 000',
  whatsapp: '',              // digits only, e.g. 48600000000
  email: 'kontakt@example.com',
  instagram: '',
  delivery_grosze: '1500',
  default_lead_days: '2',
  site_url: process.env.SITE_URL || '',
  telegram_token: '', telegram_chat: '',
};
async function loadSettings() {
  const rows = await all('SELECT key, value FROM settings');
  const s = { ...DEFAULTS };
  for (const r of rows) s[r.key] = r.value;
  settingsCache = s;
  return s;
}
async function getSettings() { return settingsCache || loadSettings(); }
async function setSetting(key, value) {
  await q('INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value', [key, String(value == null ? '' : value)]);
  settingsCache = null;
}
async function setSettings(obj) { for (const k of Object.keys(obj)) await setSetting(k, obj[k]); }
async function ensureSecret(key) {
  const s = await getSettings();
  if (s[key]) return s[key];
  const v = randomToken(32);
  await setSetting(key, v);
  return v;
}

// ---------- images ----------
async function insertImage(mime, buf, width, height) {
  const r = await one('INSERT INTO images(mime,bytes,width,height) VALUES($1,$2,$3,$4) RETURNING id', [mime, buf, width || null, height || null]);
  return r.id;
}

// ---------- seed ----------
async function seedIfEmpty() {
  const c = await one('SELECT count(*)::int AS n FROM products');
  if (c.n > 0) return;
  const seedDir = path.join(__dirname, '..', 'assets', 'seed');
  const readImg = (f) => { try { return fs.readFileSync(path.join(seedDir, f)); } catch { return null; } };

  const sample = {
    slug: 'rear-fender-kukirin-g4-2025',
    name_pl: 'Tylny błotnik do Kukirin G4 2025', name_en: 'Rear Fender for Kukirin G4 2025',
    tagline_pl: 'Mocniejszy. Czystszy. Więcej ochrony.', tagline_en: 'Stronger. Cleaner. More protection.',
    price_grosze: 5900, compare_grosze: null, stock: 3, lead_days: 2, active: true,
    fits: ['Kukirin G4 2025', 'Kukirin G4'], material: 'PETG', color: 'Czarny mat / Matte black', weight_g: 180,
    desc_pl: `Tylny błotnik zaprojektowany specjalnie pod Kukirin G4 2025. Zakrywa więcej koła niż fabryczny, więc mniej wody i błota trafia na plecy i na hamulec.

- Dokładne dopasowanie do ramy G4 2025 — bez luzów i wibracji
- Montaż na oryginalnych śrubach, bez wiercenia
- Grube ściany i żebra wzmacniające w miejscu mocowania
- Matowa, czarna powierzchnia — wygląda jak część fabryczna
- Drukowany z PETG: odporny na wodę, sól drogową i mróz`,
    desc_en: `Rear fender designed specifically for the Kukirin G4 2025. Covers more of the wheel than the stock part, so less water and mud reaches your back and the brake.

- Exact fit to the G4 2025 frame — no play, no rattling
- Mounts on the original bolts, no drilling
- Thick walls and reinforcing ribs at the mounting points
- Matte black finish — looks like a factory part
- Printed in PETG: resistant to water, road salt and frost`,
    install_pl: `1. Odkręć dwie śruby fabrycznego błotnika (klucz imbusowy 4 mm).
2. Zdejmij stary błotnik.
3. Załóż nowy błotnik, dopasuj otwory do ramy.
4. Dokręć oryginalne śruby — bez nadmiernej siły, wystarczy „do oporu i ćwierć obrotu”.
5. Sprawdź, czy koło obraca się swobodnie i nic nie ociera.

Czas montażu: około 5 minut. Jeśli śruby są skorodowane, dorzucamy nowe — napisz w uwagach do zamówienia.`,
    install_en: `1. Remove the two bolts of the stock fender (4 mm hex key).
2. Take the old fender off.
3. Fit the new fender and line up the holes with the frame.
4. Tighten the original bolts — no excessive force, "snug plus a quarter turn" is enough.
5. Check that the wheel spins freely and nothing rubs.

Installation time: about 5 minutes. If your bolts are corroded, we can add new ones — mention it in the order notes.`,
    print_pl: `Materiał: PETG (opcjonalnie ASA na życzenie — bardziej odporny na UV).
Wysokość warstwy: 0,2 mm, 4 ściany, wypełnienie 40% gyroid.
Każdy błotnik jest po druku oczyszczony z podpór i sprawdzony na ramie testowej.

Wymiana: jeśli część pęknie w ciągu 30 dni normalnej jazdy, drukujemy nową bez pytań.`,
    print_en: `Material: PETG (ASA on request — better UV resistance).
Layer height: 0.2 mm, 4 walls, 40% gyroid infill.
Every fender is cleaned of supports after printing and checked on a test frame.

Replacement: if the part cracks within 30 days of normal riding, we print a new one, no questions asked.`,
  };
  const r = await one(`INSERT INTO products(slug,name_pl,name_en,tagline_pl,tagline_en,price_grosze,compare_grosze,stock,lead_days,active,fits,material,color,weight_g,desc_pl,desc_en,install_pl,install_en,print_pl,print_en)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING id`,
    [sample.slug, sample.name_pl, sample.name_en, sample.tagline_pl, sample.tagline_en, sample.price_grosze, sample.compare_grosze, sample.stock, sample.lead_days, sample.active, sample.fits, sample.material, sample.color, sample.weight_g, sample.desc_pl, sample.desc_en, sample.install_pl, sample.install_en, sample.print_pl, sample.print_en]);
  let sort = 0;
  for (const f of ['fender-1.jpg', 'fender-2.jpg', 'fender-3.jpg', 'fender-4.jpg']) {
    const buf = readImg(f);
    if (!buf) continue;
    const id = await insertImage('image/jpeg', buf);
    await q('INSERT INTO product_images(product_id,image_id,sort) VALUES($1,$2,$3)', [r.id, id, sort++]);
  }
  // Hero photos: local file if present, otherwise fetched once from the generated originals (Railway has open egress).
  const HERO_CDN = 'https://d2ol7oe51mr4n9.cloudfront.net/user_38IocPBuUYE3aSfPP7dyPFYHcP9/';
  const slides = [
    ['hero-1.jpg', HERO_CDN + '2b8c751e-56a2-405c-bd41-0b7df127fe70.jpg', 'Gotowe części 3D do Twojej hulajnogi', 'Ready-made 3D-printed parts for your e-scooter', 'Drukujemy w Chełmie. Dopasowane do modelu, gotowe do montażu.', 'Printed in Chełm. Fitted to your model, ready to bolt on.'],
    ['hero-2.jpg', HERO_CDN + 'f148a9ea-f73f-430e-823c-786ac62326e0.jpg', 'Błotniki, które naprawdę zakrywają koło', 'Fenders that actually cover the wheel', 'PETG i ASA — odporne na wodę, sól i mróz.', 'PETG and ASA — resistant to water, salt and frost.'],
    ['hero-3.jpg', HERO_CDN + 'c810ffcd-511c-4638-bad4-75f2d6906e2d.jpg', 'Drukowane na zamówienie, w 1–3 dni', 'Printed to order, in 1–3 days', 'Odbiór osobisty w Chełmie albo dostawa po mieście.', 'Local pickup in Chełm or delivery in town.'],
  ];
  sort = 0;
  for (const [f, remote, tpl, ten, spl, sen] of slides) {
    let buf = readImg(f); let mime = 'image/jpeg';
    if (!buf && remote) {
      try {
        const r = await fetch(remote, { signal: AbortSignal.timeout(20000) });
        if (r.ok) { buf = Buffer.from(await r.arrayBuffer()); mime = r.headers.get('content-type') || 'image/png'; }
      } catch (e) { console.log('hero seed skipped (' + f + '): ' + e.message); }
    }
    if (!buf) continue;
    const id = await insertImage(mime.split(';')[0], buf);
    await q('INSERT INTO hero_slides(image_id,title_pl,title_en,sub_pl,sub_en,sort) VALUES($1,$2,$3,$4,$5,$6)', [id, tpl, ten, spl, sen, sort++]);
  }
  console.log('Seeded sample product and hero slides.');
}

async function migrate() {
  await q(SCHEMA);
  await ensureSecret('session_secret');
  await ensureSecret('token_secret');
  await seedIfEmpty();
}

// ---------- product helpers ----------
async function productsWithCover({ activeOnly = true, search = '', sort = 'new', limit = 200 } = {}) {
  const params = [];
  let where = activeOnly ? 'WHERE p.active' : 'WHERE true';
  if (search) {
    params.push('%' + search.toLowerCase() + '%');
    where += ` AND (lower(p.name_pl) LIKE $${params.length} OR lower(p.name_en) LIKE $${params.length} OR lower(array_to_string(p.fits,' ')) LIKE $${params.length})`;
  }
  const order = sort === 'cheap' ? 'p.price_grosze ASC' : sort === 'exp' ? 'p.price_grosze DESC' : 'p.created_at DESC';
  params.push(limit);
  return all(`SELECT p.*, (SELECT image_id FROM product_images pi WHERE pi.product_id=p.id ORDER BY sort LIMIT 1) AS cover
    FROM products p ${where} ORDER BY ${order} LIMIT $${params.length}`, params);
}
async function productBySlug(slug) {
  const p = await one('SELECT * FROM products WHERE slug=$1', [slug]);
  if (!p) return null;
  p.images = (await all('SELECT image_id FROM product_images WHERE product_id=$1 ORDER BY sort', [p.id])).map((r) => r.image_id);
  return p;
}
async function productById(id) {
  const p = await one('SELECT * FROM products WHERE id=$1', [id]);
  if (!p) return null;
  p.images = (await all('SELECT image_id FROM product_images WHERE product_id=$1 ORDER BY sort', [p.id])).map((r) => r.image_id);
  return p;
}
async function nextOrderNumber() {
  const y = new Date().getFullYear();
  const r = await one(`SELECT nextval('order_seq')::int AS n`);
  return `RL-${y}-${String(r.n).padStart(4, '0')}`;
}

module.exports = { pool, q, one, all, migrate, getSettings, setSetting, setSettings, ensureSecret, insertImage, productsWithCover, productBySlug, productById, nextOrderNumber, DEFAULTS };
