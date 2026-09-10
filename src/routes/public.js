'use strict';
const express = require('express');
const db = require('../db');
const { esc, sha256, dayKey, parseCookies, cookie, clientIp } = require('../util');
const { LANGS, PATHS, url, t } = require('../i18n');
const { page } = require('../render/layout');
const pages = require('../render/pages');
const { isBotUA, isSecure } = require('../security');
const { stripeEnabled, confirmFromSession } = require('../payments');
const notify = require('../notify');

const router = express.Router();

// ---------- images ----------
router.get('/img/:id(\\d+)', async (req, res) => {
  const r = await db.one('SELECT mime, bytes FROM images WHERE id=$1', [req.params.id]);
  if (!r) return res.status(404).end();
  res.setHeader('Content-Type', r.mime);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.end(r.bytes);
});

// ---------- root redirect ----------
router.get('/', (req, res) => {
  const c = parseCookies(req.headers.cookie).rl_lang;
  let lang = LANGS.includes(c) ? c : null;
  if (!lang) {
    const al = String(req.headers['accept-language'] || '').toLowerCase();
    lang = al.startsWith('en') && !al.includes('pl') ? 'en' : 'pl';
  }
  res.redirect(302, `/${lang}/`);
});

// ---------- sitemap & robots ----------
router.get('/robots.txt', async (req, res) => {
  const s = await db.getSettings();
  const site = (s.site_url || '').replace(/\/$/, '');
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\n${site ? `Sitemap: ${site}/sitemap.xml\n` : ''}`);
});
router.get('/sitemap.xml', async (req, res) => {
  const s = await db.getSettings();
  const site = (s.site_url || `${isSecure(req) ? 'https' : 'http'}://${req.headers.host}`).replace(/\/$/, '');
  const products = await db.all('SELECT slug, updated_at FROM products WHERE active ORDER BY created_at DESC');
  const entries = [];
  const add = (key, param, lastmod) => {
    for (const lang of LANGS) {
      const loc = site + url(lang, key, param);
      const alts = LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(site + url(l, key, param))}"/>`).join('');
      entries.push(`<url><loc>${esc(loc)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}${alts}<xhtml:link rel="alternate" hreflang="x-default" href="${esc(site + url('pl', key, param))}"/></url>`);
    }
  };
  for (const k of ['home', 'shop', 'about', 'contact', 'faq', 'terms', 'privacy']) add(k);
  for (const p of products) add('product', p.slug, p.updated_at);
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>`);
});

// ---------- pageview tracking (fire-and-forget) ----------
function track(req, lang) {
  try {
    const ua = req.headers['user-agent'] || '';
    const ip = clientIp(req);
    const visitor = sha256(`${dayKey()}|${ip}|${ua}`).slice(0, 24);
    let refHost = null;
    try { const r = req.headers.referer; if (r) { const h = new URL(r).hostname; if (h !== req.headers.host) refHost = h; } } catch { /* ignore */ }
    db.q('INSERT INTO pageviews(day,path,lang,ref_host,is_bot,visitor) VALUES($1,$2,$3,$4,$5,$6)', [dayKey(), req.path.slice(0, 200), lang, refHost, isBotUA(ua), visitor]).catch(() => {});
  } catch { /* never break a page over analytics */ }
}

// ---------- language pages ----------
async function ctxFor(req, res, lang, key, param, altParam) {
  const settings = await db.getSettings();
  const other = lang === 'pl' ? 'en' : 'pl';
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const origin = (settings.site_url || `${isSecure(req) ? 'https' : 'http'}://${req.headers.host}`).replace(/\/$/, '');
  const ctx = { lang, settings, origin, key, path: url(lang, key, param) + (key === 'shop' ? qs : ''), altPath: url(other, key, altParam || param) + (key === 'shop' ? qs : ''), q: req.query.q || '' };
  res.setHeader('Set-Cookie', cookie('rl_lang', lang, { maxAge: 365 * 24 * 3600, secure: isSecure(req), httpOnly: false }));
  return ctx;
}
const send = (res, html) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.send(html); };

router.get('/:lang(pl|en)/', async (req, res) => {
  const lang = req.params.lang;
  if (!req.path.endsWith('/')) return res.redirect(301, `/${lang}/`);
  const ctx = await ctxFor(req, res, lang, 'home');
  const [slides, products] = await Promise.all([
    db.all('SELECT * FROM hero_slides WHERE active ORDER BY sort, id'),
    db.productsWithCover({ limit: 8 }),
  ]);
  const out = pages.home(ctx, { slides, products, settings: ctx.settings });
  track(req, lang);
  send(res, page(ctx, { title: t(lang, 'seo_home_title'), desc: t(lang, 'seo_home_desc'), jsonld: out.jsonld, ogImage: slides[0] ? `/img/${slides[0].image_id}` : '', body: out.body }));
});

router.get('/:lang(pl|en)/:seg', async (req, res, next) => {
  const lang = req.params.lang; const seg = req.params.seg; const P = PATHS[lang];
  const settings = await db.getSettings();
  const noindex = { cart: true };
  const L = (k) => t(lang, k);
  let key = Object.keys(P).find((k) => P[k] === seg && P[k] !== '');
  if (!key) return next();
  const ctx = await ctxFor(req, res, lang, key);
  let body, title, desc, jsonld;
  switch (key) {
    case 'shop': {
      const sort = ['new', 'cheap', 'exp'].includes(req.query.sort) ? req.query.sort : 'new';
      const q = String(req.query.q || '').slice(0, 80);
      const products = await db.productsWithCover({ search: q, sort });
      body = pages.shop(ctx, { products, q, sort }); title = L('seo_shop_title'); desc = L('seo_shop_desc'); break;
    }
    case 'cart': body = pages.cart(ctx, { settings, stripeEnabled: stripeEnabled() }); title = `${L('cart_title')} · ${settings.shop_name}`; desc = ''; break;
    case 'about': body = pages.about(ctx, settings); title = `${L('about_title')} · ${settings.shop_name} Chełm`; desc = L('seo_home_desc'); break;
    case 'contact': body = pages.contact(ctx, settings); title = `${L('contact_title')} · ${settings.shop_name} Chełm`; desc = `${settings.address} · ${settings.phone}`; break;
    case 'faq': { const out = pages.faqPage(ctx, settings); body = out.body; jsonld = out.jsonld; title = `FAQ · ${settings.shop_name}`; desc = L('seo_home_desc'); break; }
    case 'terms': body = pages.terms(ctx, settings); title = `${L('terms')} · ${settings.shop_name}`; desc = ''; break;
    case 'privacy': body = pages.privacy(ctx, settings); title = `${lang === 'pl' ? 'Polityka prywatności' : 'Privacy Policy'} · ${settings.shop_name}`; desc = ''; break;
    default: return next();
  }
  track(req, lang);
  send(res, page(ctx, { title, desc, jsonld, noindex: !!noindex[key], body }));
});

router.get('/:lang(pl|en)/:seg/:param', async (req, res, next) => {
  const lang = req.params.lang; const { seg, param } = req.params; const P = PATHS[lang];
  const settings = await db.getSettings(); const L = (k) => t(lang, k);
  if (seg === P.product) {
    const p = await db.productBySlug(param);
    if (!p || (!p.active && !req.query.preview)) return next();
    const ctx = await ctxFor(req, res, lang, 'product', param);
    const similar = (await db.productsWithCover({ limit: 5 })).filter((s) => s.id !== p.id).slice(0, 4);
    const out = pages.product(ctx, { p, similar, settings });
    track(req, lang);
    const n = pages.name(p, lang);
    return send(res, page(ctx, { title: n + L('seo_product_suffix'), desc: ((lang === 'en' && p.tagline_en) || p.tagline_pl || '') + ' ' + (p.fits.length ? L('fits') + ': ' + p.fits.join(', ') + '. ' : '') + L('chelm_notice'), jsonld: out.jsonld, ogImage: out.ogImage, ogType: 'product', body: out.body, noindex: !p.active }));
  }
  if (seg === P.order) {
    let o = await db.one('SELECT * FROM orders WHERE number=$1', [param]);
    const ctx = await ctxFor(req, res, lang, 'order', param);
    if (o && req.query.session_id && o.status === 'new' && o.payment === 'stripe') {
      const before = o.status;
      o = await confirmFromSession(o, String(req.query.session_id));
      if (before !== o.status) notify.paid(o);
    }
    return send(res, page(ctx, { title: `${L('order_no')} ${param}`, desc: '', noindex: true, body: pages.orderPage(ctx, { order: o, settings, verifying: false }) }));
  }
  next();
});

// 404
router.use(async (req, res) => {
  const lang = LANGS.includes(req.path.split('/')[1]) ? req.path.split('/')[1] : 'pl';
  const settings = await db.getSettings();
  const ctx = { lang, settings, key: '404', path: req.path, altPath: `/${lang === 'pl' ? 'en' : 'pl'}/`, q: '' };
  res.status(404);
  send(res, page(ctx, { title: '404', desc: '', noindex: true, body: `<section class="wrap sec narrow"><h1>404</h1><p>${lang === 'pl' ? 'Nie ma takiej strony.' : 'Page not found.'} <a href="${url(lang, 'shop')}">${t(lang, 'go_shop')}</a></p></section>` }));
});

module.exports = router;
