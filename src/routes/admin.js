'use strict';
const express = require('express');
const multer = require('multer');
const db = require('../db');
const sec = require('../security');
const A = require('../render/admin');
const { slugify, parsePrice, clampInt, randomToken, dayKey, clientIp } = require('../util');
const payments = require('../payments');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024, files: 12 } });

function createAdminRouter(adminPath) {
  const router = express.Router();
  let setupToken = null;

  async function passwordSet() { return !!(await db.getSettings()).admin_password; }
  async function ensureSetupToken() {
    if (await passwordSet()) return null;
    if (!setupToken) { setupToken = randomToken(9); console.log(`\n==============================\n ADMIN SETUP TOKEN: ${setupToken}\n Open ${adminPath} and set the password.\n==============================\n`); }
    return setupToken;
  }
  ensureSetupToken().catch(() => {});

  router.use(express.urlencoded({ extended: false, limit: '256kb' }));
  router.use((req, res, next) => { res.setHeader('X-Robots-Tag', 'noindex, nofollow'); res.setHeader('Cache-Control', 'no-store'); next(); });

  // ----- setup / login -----
  router.get('/setup', async (req, res) => {
    if (await passwordSet()) return res.redirect(adminPath);
    const tok = await ensureSetupToken();
    res.send(A.setup({ adminPath }, { tokenRequired: !!tok }));
  });
  router.post('/setup', sec.limiter('admin-setup', 10, 15 * 60000), async (req, res) => {
    if (await passwordSet()) return res.redirect(adminPath);
    const tok = await ensureSetupToken();
    const { token, password, password2 } = req.body;
    if (tok && token !== tok) return res.send(A.setup({ adminPath }, { tokenRequired: true, error: 'Nieprawidłowy token. Sprawdź logi serwera.' }));
    if (!password || password.length < 10 || password !== password2) return res.send(A.setup({ adminPath }, { tokenRequired: !!tok, error: 'Hasło musi mieć min. 10 znaków i być powtórzone poprawnie.' }));
    await db.setSetting('admin_password', sec.hashPassword(password));
    setupToken = null;
    res.setHeader('Set-Cookie', await sec.createSessionCookie(req));
    res.redirect(adminPath);
  });
  router.get('/login', async (req, res) => {
    if (!(await passwordSet())) return res.redirect(adminPath + '/setup');
    if (await sec.hasSession(req)) return res.redirect(adminPath);
    res.send(A.login({ adminPath }, {}));
  });
  router.post('/login', sec.limiter('admin-login', 5, 15 * 60000), async (req, res) => {
    const s = await db.getSettings();
    if (!sec.checkPassword(String(req.body.password || ''), s.admin_password)) {
      await new Promise((r) => setTimeout(r, 800));
      return res.status(401).send(A.login({ adminPath }, { error: 'Nieprawidłowe hasło.' }));
    }
    res.setHeader('Set-Cookie', await sec.createSessionCookie(req));
    res.redirect(adminPath);
  });
  router.post('/logout', async (req, res) => { res.setHeader('Set-Cookie', sec.clearSessionCookie(req)); res.redirect(adminPath + '/login'); });

  // ----- auth gate -----
  router.use(async (req, res, next) => {
    if (!(await passwordSet())) return res.redirect(adminPath + '/setup');
    if (!(await sec.hasSession(req))) return res.redirect(adminPath + '/login');
    if (req.method === 'POST' && !req.is('multipart/form-data') && !(await sec.checkCsrf(req))) return res.status(403).send('CSRF');
    req.a = { adminPath, csrf: await sec.csrfToken(req) };
    next();
  });
  const csrfMultipart = async (req, res, next) => { if (!(await sec.checkCsrf(req))) return res.status(403).send('CSRF'); next(); };

  // ----- dashboard -----
  router.get('/', async (req, res) => {
    const day = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); return dayKey(d); };
    const sum = async (since) => db.one(`SELECT count(*)::int AS orders, coalesce(sum(total_grosze),0)::int AS revenue FROM orders WHERE status IN ('paid','fulfilled','new') AND status <> 'cancelled' AND created_at >= $1`, [since]);
    const [today, week, month] = await Promise.all([sum(day(0) + 'T00:00:00Z'), sum(day(6) + 'T00:00:00Z'), sum(day(29) + 'T00:00:00Z')]);
    const tv = await db.one('SELECT count(*)::int AS views, count(DISTINCT visitor)::int AS visitors FROM pageviews WHERE day=$1 AND NOT is_bot', [day(0)]);
    const mv = await db.one('SELECT count(DISTINCT visitor)::int AS visitors FROM pageviews WHERE day >= $1 AND NOT is_bot', [day(29)]);
    const days14 = Array.from({ length: 14 }, (_, i) => day(13 - i));
    const oRows = await db.all(`SELECT to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS d, count(*)::int AS n, coalesce(sum(total_grosze),0)::int AS rev FROM orders WHERE status <> 'cancelled' AND created_at >= $1 GROUP BY d`, [days14[0] + 'T00:00:00Z']);
    const vRows = await db.all(`SELECT day::text AS d, count(*) FILTER (WHERE NOT is_bot)::int AS n, count(*) FILTER (WHERE is_bot)::int AS bots FROM pageviews WHERE day >= $1 GROUP BY day`, [days14[0]]);
    const ordersSeries = days14.map((d) => { const r = oRows.find((x) => x.d === d); return { day: d, value: r ? r.rev : 0, n: r ? r.n : 0 }; });
    const viewsSeries = days14.map((d) => { const r = vRows.find((x) => x.d === d); return { day: d, value: r ? r.n : 0 }; });
    const bots = vRows.reduce((s, r) => s + r.bots, 0);
    const recentOrders = await db.all('SELECT id, number, customer_name, total_grosze, status, created_at FROM orders ORDER BY created_at DESC LIMIT 8');
    const topProducts = await db.all(`SELECT i->>'name_pl' AS name, sum((i->>'qty')::int)::int AS qty, sum((i->>'qty')::int * (i->>'price_grosze')::int)::int AS revenue
      FROM orders o, jsonb_array_elements(o.items) i WHERE o.status IN ('paid','fulfilled') AND o.created_at >= $1 GROUP BY 1 ORDER BY qty DESC LIMIT 6`, [day(29) + 'T00:00:00Z']);
    const topPages = await db.all('SELECT path, count(*)::int AS n FROM pageviews WHERE day >= $1 AND NOT is_bot GROUP BY path ORDER BY n DESC LIMIT 8', [day(29)]);
    const topRefs = await db.all('SELECT ref_host, count(*)::int AS n FROM pageviews WHERE day >= $1 AND NOT is_bot GROUP BY ref_host ORDER BY n DESC LIMIT 6', [day(29)]);
    const pending = await db.one("SELECT count(*)::int AS n FROM orders WHERE status IN ('new','paid')");
    const newReq = await db.one("SELECT count(*)::int AS n FROM requests WHERE status='new'");
    res.send(A.dashboard(req.a, {
      today: { ...today, views: tv.views, visitors: tv.visitors }, week, month,
      conversion: mv.visitors ? (month.orders / mv.visitors * 100).toFixed(1) : '0.0',
      pendingOrders: pending.n, ordersSeries, viewsSeries, series14: { orders: ordersSeries.reduce((s, x) => s + x.n, 0), bots },
      recentOrders, topProducts, topPages, topRefs, newRequests: newReq.n, stripe: payments.stripeEnabled(),
    }));
  });

  // ----- products -----
  router.get('/products', async (req, res) => {
    const products = await db.productsWithCover({ activeOnly: false, limit: 500 });
    res.send(A.productsList(req.a, { products }));
  });
  router.get('/products/new', async (req, res) => {
    const s = await db.getSettings();
    res.send(A.productForm(req.a, { p: { lead_days: parseInt(s.default_lead_days, 10) || 2, stock: 0, active: true, images: [] }, isNew: true }));
  });
  router.get('/products/:id(\\d+)', async (req, res) => {
    const p = await db.productById(req.params.id);
    if (!p) return res.status(404).send('Not found');
    res.send(A.productForm(req.a, { p, isNew: false }));
  });
  async function saveProduct(req, res, id) {
    const b = req.body;
    const price = parsePrice(b.price); const compare = parsePrice(b.compare);
    const name_pl = String(b.name_pl || '').trim();
    const list = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 30);
    const materials = list(b.materials); const colors = list(b.colors); const finishes = list(b.finishes);
    const draft = { ...b, id, price_grosze: price, compare_grosze: compare, stock: clampInt(b.stock, 0, 100000, 0), lead_days: clampInt(b.lead_days, 0, 365, 2), weight_g: b.weight_g ? clampInt(b.weight_g, 0, 100000, null) : null, fits: list(b.fits), materials, colors, finishes, active: !!b.active, images: [] };
    if (!name_pl || price == null) return res.status(400).send(A.productForm(req.a, { p: draft, isNew: !id, error: 'Nazwa (PL) i cena są wymagane.' }));
    let slug = slugify(b.slug || b.name_en || name_pl);
    const clash = await db.one('SELECT id FROM products WHERE slug=$1 AND id <> $2', [slug, id || 0]);
    if (clash) slug += '-' + randomToken(3).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4);
    const vals = [slug, name_pl, String(b.name_en || '').trim(), String(b.tagline_pl || '').trim(), String(b.tagline_en || '').trim(), price, compare, draft.stock, draft.lead_days, draft.active, draft.fits, materials[0] || '', colors[0] || '', draft.weight_g, b.desc_pl || '', b.desc_en || '', b.install_pl || '', b.install_en || '', b.print_pl || '', b.print_en || '', materials, colors, finishes];
    let pid = id;
    if (id) {
      await db.q(`UPDATE products SET slug=$1,name_pl=$2,name_en=$3,tagline_pl=$4,tagline_en=$5,price_grosze=$6,compare_grosze=$7,stock=$8,lead_days=$9,active=$10,fits=$11,material=$12,color=$13,weight_g=$14,desc_pl=$15,desc_en=$16,install_pl=$17,install_en=$18,print_pl=$19,print_en=$20,materials=$21,colors=$22,finishes=$23,updated_at=now() WHERE id=$24`, [...vals, id]);
    } else {
      const r = await db.one(`INSERT INTO products(slug,name_pl,name_en,tagline_pl,tagline_en,price_grosze,compare_grosze,stock,lead_days,active,fits,material,color,weight_g,desc_pl,desc_en,install_pl,install_en,print_pl,print_en,materials,colors,finishes)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) RETURNING id`, vals);
      pid = r.id;
    }
    // images: removals, order, new uploads
    const remove = String(b.remove_images || '').split(',').map((s) => parseInt(s, 10)).filter(Boolean);
    for (const rid of remove) { await db.q('DELETE FROM product_images WHERE product_id=$1 AND image_id=$2', [pid, rid]); await db.q('DELETE FROM images WHERE id=$1 AND NOT EXISTS (SELECT 1 FROM product_images WHERE image_id=$1) AND NOT EXISTS (SELECT 1 FROM hero_slides WHERE image_id=$1)', [rid]); }
    let order = [].concat(b['image_order[]'] || b.image_order || []).map((s) => parseInt(s, 10)).filter((n) => n && !remove.includes(n));
    let sort = 0;
    for (const iid of order) await db.q('UPDATE product_images SET sort=$1 WHERE product_id=$2 AND image_id=$3', [sort++, pid, iid]);
    for (const f of req.files || []) {
      const mime = sec.sniffImage(f.buffer);
      if (!mime) continue;
      const iid = await db.insertImage(mime, f.buffer);
      await db.q('INSERT INTO product_images(product_id,image_id,sort) VALUES($1,$2,$3)', [pid, iid, sort++]);
    }
    res.redirect(`${adminPath}/products/${pid}`);
  }
  router.post('/products/new', upload.array('photos', 12), csrfMultipart, (req, res) => saveProduct(req, res, null));
  router.post('/products/:id(\\d+)', upload.array('photos', 12), csrfMultipart, (req, res) => saveProduct(req, res, parseInt(req.params.id, 10)));
  router.post('/products/:id(\\d+)/toggle', async (req, res) => { await db.q('UPDATE products SET active = NOT active, updated_at=now() WHERE id=$1', [req.params.id]); res.redirect(adminPath + '/products'); });
  router.post('/products/:id(\\d+)/delete', async (req, res) => {
    const imgs = await db.all('SELECT image_id FROM product_images WHERE product_id=$1', [req.params.id]);
    await db.q('DELETE FROM products WHERE id=$1', [req.params.id]);
    for (const i of imgs) await db.q('DELETE FROM images WHERE id=$1 AND NOT EXISTS (SELECT 1 FROM product_images WHERE image_id=$1) AND NOT EXISTS (SELECT 1 FROM hero_slides WHERE image_id=$1)', [i.image_id]);
    res.redirect(adminPath + '/products');
  });
  router.post('/products/:id(\\d+)/duplicate', async (req, res) => {
    const p = await db.productById(req.params.id);
    if (!p) return res.redirect(adminPath + '/products');
    const slug = p.slug + '-kopia-' + randomToken(3).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4);
    const r = await db.one(`INSERT INTO products(slug,name_pl,name_en,tagline_pl,tagline_en,price_grosze,compare_grosze,stock,lead_days,active,fits,material,color,weight_g,desc_pl,desc_en,install_pl,install_en,print_pl,print_en,materials,colors,finishes)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,false,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING id`,
      [slug, p.name_pl + ' (kopia)', p.name_en ? p.name_en + ' (copy)' : '', p.tagline_pl, p.tagline_en, p.price_grosze, p.compare_grosze, p.stock, p.lead_days, p.fits, p.material, p.color, p.weight_g, p.desc_pl, p.desc_en, p.install_pl, p.install_en, p.print_pl, p.print_en, p.materials || [], p.colors || [], p.finishes || []]);
    let sort = 0;
    for (const iid of p.images) {
      const im = await db.one('SELECT mime, bytes FROM images WHERE id=$1', [iid]);
      const nid = await db.insertImage(im.mime, im.bytes);
      await db.q('INSERT INTO product_images(product_id,image_id,sort) VALUES($1,$2,$3)', [r.id, nid, sort++]);
    }
    res.redirect(`${adminPath}/products/${r.id}`);
  });

  // ----- orders -----
  router.get('/orders', async (req, res) => {
    const st = ['new', 'paid', 'fulfilled', 'cancelled'].includes(req.query.status) ? req.query.status : '';
    const orders = st ? await db.all('SELECT * FROM orders WHERE status=$1 ORDER BY created_at DESC LIMIT 300', [st]) : await db.all('SELECT * FROM orders ORDER BY created_at DESC LIMIT 300');
    res.send(A.ordersList(req.a, { orders, filter: st }));
  });
  router.get('/orders/:id(\\d+)', async (req, res) => {
    const o = await db.one('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!o) return res.status(404).send('Not found');
    res.send(A.orderDetail(req.a, { o }));
  });
  router.post('/orders/:id(\\d+)/status', async (req, res) => {
    const st = String(req.body.status || '');
    if (!['new', 'paid', 'fulfilled', 'cancelled'].includes(st)) return res.redirect(`${adminPath}/orders/${req.params.id}`);
    const o = await db.one('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!o) return res.redirect(adminPath + '/orders');
    await db.q('UPDATE orders SET status=$1, paid_at = CASE WHEN $1 IN (\'paid\',\'fulfilled\') AND paid_at IS NULL THEN now() ELSE paid_at END, updated_at=now() WHERE id=$2', [st, o.id]);
    if (st === 'paid' || st === 'fulfilled') await payments.countSold(o);
    if (st === 'cancelled' && o.status !== 'cancelled') for (const i of o.items) await db.q('UPDATE products SET stock = stock + $1 WHERE id=$2', [i.qty, i.id]);
    res.redirect(`${adminPath}/orders/${o.id}`);
  });
  router.post('/orders/:id(\\d+)/note', async (req, res) => { await db.q('UPDATE orders SET admin_note=$1, updated_at=now() WHERE id=$2', [String(req.body.admin_note || '').slice(0, 2000), req.params.id]); res.redirect(`${adminPath}/orders/${req.params.id}`); });

  // ----- hero slides -----
  router.get('/slides', async (req, res) => res.send(A.slides(req.a, { slides: await db.all('SELECT * FROM hero_slides ORDER BY sort, id') })));
  router.post('/slides/new', upload.array('photos', 12), csrfMultipart, async (req, res) => {
    const m = await db.one('SELECT coalesce(max(sort),-1)::int AS m FROM hero_slides'); let sort = m.m + 1;
    for (const f of req.files || []) { const mime = sec.sniffImage(f.buffer); if (!mime) continue; const iid = await db.insertImage(mime, f.buffer); await db.q('INSERT INTO hero_slides(image_id,sort) VALUES($1,$2)', [iid, sort++]); }
    res.redirect(adminPath + '/slides');
  });
  router.post('/slides/:id(\\d+)', async (req, res) => {
    const b = req.body;
    await db.q('UPDATE hero_slides SET title_pl=$1,title_en=$2,sub_pl=$3,sub_en=$4,active=$5 WHERE id=$6', [String(b.title_pl || '').slice(0, 120), String(b.title_en || '').slice(0, 120), String(b.sub_pl || '').slice(0, 200), String(b.sub_en || '').slice(0, 200), !!b.active, req.params.id]);
    res.redirect(adminPath + '/slides');
  });
  router.post('/slides/:id(\\d+)/move', async (req, res) => {
    const rows = await db.all('SELECT id FROM hero_slides ORDER BY sort, id');
    const i = rows.findIndex((r) => String(r.id) === req.params.id); const j = i + (req.body.dir === '-1' ? -1 : 1);
    if (i >= 0 && j >= 0 && j < rows.length) { [rows[i], rows[j]] = [rows[j], rows[i]]; for (let k = 0; k < rows.length; k++) await db.q('UPDATE hero_slides SET sort=$1 WHERE id=$2', [k, rows[k].id]); }
    res.redirect(adminPath + '/slides');
  });
  router.post('/slides/:id(\\d+)/delete', async (req, res) => {
    const s = await db.one('SELECT image_id FROM hero_slides WHERE id=$1', [req.params.id]);
    await db.q('DELETE FROM hero_slides WHERE id=$1', [req.params.id]);
    if (s) await db.q('DELETE FROM images WHERE id=$1 AND NOT EXISTS (SELECT 1 FROM product_images WHERE image_id=$1) AND NOT EXISTS (SELECT 1 FROM hero_slides WHERE image_id=$1)', [s.image_id]);
    res.redirect(adminPath + '/slides');
  });

  // ----- requests -----
  router.get('/requests', async (req, res) => res.send(A.requests(req.a, { requests: await db.all('SELECT * FROM requests ORDER BY created_at DESC LIMIT 300') })));
  router.post('/requests/:id(\\d+)/status', async (req, res) => { await db.q('UPDATE requests SET status=$1 WHERE id=$2', [req.body.status === 'done' ? 'done' : 'new', req.params.id]); res.redirect(adminPath + '/requests'); });

  // ----- settings -----
  router.get('/settings', async (req, res) => res.send(A.settings(req.a, { s: await db.getSettings(), stripe: payments.stripeEnabled(), saved: req.query.saved })));
  router.post('/settings', async (req, res) => {
    const b = req.body; const keys = ['shop_name', 'address', 'hours', 'phone', 'whatsapp', 'email', 'instagram', 'site_url', 'legal_name', 'nip', 'telegram_token', 'telegram_chat'];
    const obj = {};
    for (const k of keys) obj[k] = String(b[k] || '').trim().slice(0, 300);
    obj.site_url = obj.site_url.replace(/\/$/, '');
    obj.delivery_grosze = String(parsePrice(b.delivery) == null ? 0 : parsePrice(b.delivery));
    obj.default_lead_days = String(clampInt(b.default_lead_days, 0, 365, 2));
    await db.setSettings(obj);
    res.redirect(adminPath + '/settings?saved=1');
  });
  router.post('/password', async (req, res) => {
    const s = await db.getSettings();
    if (!sec.checkPassword(String(req.body.current || ''), s.admin_password)) return res.status(400).send(A.settings(req.a, { s, stripe: payments.stripeEnabled(), error: 'Obecne hasło jest nieprawidłowe.' }));
    if (!req.body.password || req.body.password.length < 10) return res.status(400).send(A.settings(req.a, { s, stripe: payments.stripeEnabled(), error: 'Nowe hasło: min. 10 znaków.' }));
    await db.setSetting('admin_password', sec.hashPassword(req.body.password));
    res.redirect(adminPath + '/settings?saved=1');
  });

  return router;
}

module.exports = { createAdminRouter };
