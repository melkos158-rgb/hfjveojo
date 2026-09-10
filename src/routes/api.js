'use strict';
const express = require('express');
const db = require('../db');
const { clampInt } = require('../util');
const sec = require('../security');
const { isSecure } = sec;
const payments = require('../payments');
const notify = require('../notify');
const geo = require('../geo');
const { url, LANGS } = require('../i18n');

const router = express.Router();
router.use(express.json({ limit: '64kb' }));

// ---------- anti-bot ----------
router.get('/challenge', sec.limiter('challenge', 60, 60000), async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(await sec.issueChallenge());
});
router.post('/verify', sec.limiter('verify', 30, 60000), async (req, res) => {
  const token = await sec.verifyPow(req.body || {});
  if (!token) return res.status(400).json({ error: 'bad_pow' });
  res.json({ token });
});

// ---------- cart data ----------
router.get('/cart', sec.limiter('cart', 120, 60000), async (req, res) => {
  const ids = String(req.query.ids || '').split(',').map((s) => parseInt(s, 10)).filter((n) => Number.isFinite(n) && n > 0).slice(0, 50);
  if (!ids.length) return res.json({ items: [] });
  const rows = await db.all(`SELECT p.id, p.slug, p.name_pl, p.name_en, p.price_grosze, p.stock, p.lead_days, p.active, p.material, p.color, p.materials, p.colors, p.finishes,
    (SELECT image_id FROM product_images pi WHERE pi.product_id=p.id ORDER BY sort LIMIT 1) AS cover FROM products p WHERE p.id = ANY($1)`, [ids]);
  for (const r of rows) {
    if (!(r.materials && r.materials.length)) r.materials = r.material ? [r.material] : [];
    if (!(r.colors && r.colors.length)) r.colors = r.color ? [r.color] : [];
    if (!r.finishes) r.finishes = [];
  }
  res.setHeader('Cache-Control', 'no-store');
  res.json({ items: rows });
});

// ---------- checkout ----------
const phoneOk = (p) => /^[+\d][\d\s\-()]{6,}$/.test(p);
router.post('/checkout', sec.limiter('checkout', 10, 10 * 60000), async (req, res) => {
  const b = req.body || {};
  const lang = LANGS.includes(b.lang) ? b.lang : 'pl';
  if (!(await sec.verifyHuman(req))) return res.status(400).json({ error: 'human' });
  const name = String(b.customer_name || '').trim().slice(0, 120);
  const phone = String(b.phone || '').trim().slice(0, 40);
  const email = String(b.email || '').trim().slice(0, 160);
  const method = b.delivery_method === 'delivery' ? 'delivery' : 'pickup';
  const details = String(b.address || '').trim().slice(0, 200); // optional extra (apartment, floor)
  const note = String(b.note || '').trim().slice(0, 800);
  const payment = b.payment === 'stripe' && payments.stripeEnabled() ? 'stripe' : 'pickup';
  if (!name || !phoneOk(phone)) return res.status(400).json({ error: 'fields' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'fields' });

  // delivery must be a point inside Chełm (validated server-side, never trusting the client)
  let lat = null, lng = null, address = details;
  if (method === 'delivery') {
    lat = parseFloat(b.lat); lng = parseFloat(b.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ error: 'location' });
    if (!geo.inChelm(lat, lng)) return res.status(400).json({ error: 'outside' });
    const geoAddr = await geo.reverseGeocode(lat, lng);
    address = [geoAddr, details].filter(Boolean).join(' — ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  const clean = (s) => String(s == null ? '' : s).trim().slice(0, 80);
  const wanted = Array.isArray(b.items) ? b.items.map((i) => ({ id: parseInt(i.id, 10), qty: clampInt(i.qty, 1, 20, 1), material: clean(i.material), color: clean(i.color), finish: clean(i.finish) })).filter((i) => i.id > 0).slice(0, 30) : [];
  if (!wanted.length) return res.status(400).json({ error: 'empty' });
  const rows = await db.all(`SELECT p.id, p.slug, p.name_pl, p.name_en, p.price_grosze, p.stock, p.lead_days, p.active, p.material, p.color, p.materials, p.colors, p.finishes,
    (SELECT image_id FROM product_images pi WHERE pi.product_id=p.id ORDER BY sort LIMIT 1) AS image FROM products p WHERE p.id = ANY($1) AND p.active`, [wanted.map((w) => w.id)]);
  const items = [];
  for (const w of wanted) {
    const p = rows.find((r) => r.id === w.id);
    if (!p) continue;
    const mats = (p.materials && p.materials.length) ? p.materials : (p.material ? [p.material] : []);
    const cols = (p.colors && p.colors.length) ? p.colors : (p.color ? [p.color] : []);
    const fins = p.finishes || [];
    // only accept a chosen option if it is one the product actually offers
    const pick = (val, opts) => (opts.length ? (opts.includes(val) ? val : opts[0]) : '');
    items.push({ id: p.id, slug: p.slug, name_pl: p.name_pl, name_en: p.name_en, price_grosze: p.price_grosze, qty: w.qty, lead_days: p.stock >= w.qty ? 0 : p.lead_days, image: p.image, material: pick(w.material, mats), color: pick(w.color, cols), finish: pick(w.finish, fins) });
  }
  if (!items.length) return res.status(400).json({ error: 'empty' });

  const settings = await db.getSettings();
  const subtotal = items.reduce((s, i) => s + i.price_grosze * i.qty, 0);
  const delivery = method === 'delivery' ? (parseInt(settings.delivery_grosze, 10) || 0) : 0;
  const total = subtotal + delivery;
  const number = await db.nextOrderNumber();
  const order = await db.one(`INSERT INTO orders(number,status,items,subtotal_grosze,delivery_grosze,total_grosze,customer_name,phone,email,delivery_method,address,note,lang,payment,lat,lng)
    VALUES($1,'new',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [number, JSON.stringify(items), subtotal, delivery, total, name, phone, email, method, address, note, lang, payment, lat, lng]);
  // reserve stock where we have it
  for (const i of items) await db.q('UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id=$2 AND stock > 0', [i.qty, i.id]);

  const siteUrl = (settings.site_url || `${isSecure(req) ? 'https' : 'http'}://${req.headers.host}`).replace(/\/$/, '');
  if (payment === 'stripe') {
    try {
      const redirect = await payments.createCheckoutSession(order, siteUrl);
      notify.newOrder(order);
      return res.json({ redirect });
    } catch (e) {
      console.error('Stripe checkout failed:', e.message);
      await db.q("UPDATE orders SET payment='pickup', updated_at=now() WHERE id=$1", [order.id]);
      order.payment = 'pickup';
    }
  }
  notify.newOrder(order);
  res.json({ redirect: url(lang, 'order', number) });
});

// ---------- part requests / contact ----------
router.post('/request', sec.limiter('request', 8, 10 * 60000), async (req, res) => {
  const b = req.body || {};
  if (!(await sec.verifyHuman(req))) return res.status(400).json({ error: 'human' });
  const kind = b.kind === 'contact' ? 'contact' : 'part';
  const model = String(b.scooter_model || '').trim().slice(0, 120);
  const part = String(b.part || '').trim().slice(0, 160);
  const contact = String(b.contact || '').trim().slice(0, 160);
  const message = String(b.message || '').trim().slice(0, 1500);
  if (!model || !contact || (kind === 'part' && !part) || (kind === 'contact' && !message)) return res.status(400).json({ error: 'fields' });
  const r = await db.one('INSERT INTO requests(kind,scooter_model,part,contact,message,lang) VALUES($1,$2,$3,$4,$5,$6) RETURNING *', [kind, model, part, contact, message, LANGS.includes(b.lang) ? b.lang : 'pl']);
  notify.newRequest(r);
  res.json({ ok: true });
});

module.exports = router;

// Stripe webhook needs the raw body — mounted separately in server.js
module.exports.webhook = async (req, res) => {
  try {
    const ok = await payments.handleWebhook(req.body, req.headers['stripe-signature']);
    res.status(ok ? 200 : 400).end();
  } catch (e) {
    console.error('webhook error:', e.message);
    res.status(400).end();
  }
};
