'use strict';
const crypto = require('crypto');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const escAttr = esc;

// Minimal markdown-ish text → HTML: paragraphs, line breaks, "- " bullets, **bold**
function textToHtml(s) {
  if (!s) return '';
  const blocks = String(s).replace(/\r\n/g, '\n').split(/\n{2,}/);
  return blocks.map((b) => {
    const lines = b.split('\n');
    if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
      return '<ul>' + lines.map((l) => '<li>' + inline(l.replace(/^\s*[-•]\s+/, '')) + '</li>').join('') + '</ul>';
    }
    return '<p>' + lines.map(inline).join('<br>') + '</p>';
  }).join('');
  function inline(l) {
    return esc(l).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }
}

const PL_MAP = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' };
function slugify(s) {
  return String(s || '').toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => PL_MAP[c])
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'item';
}

function money(grosze, lang) {
  const n = (Number(grosze || 0) / 100);
  const s = n.toFixed(2);
  return lang === 'pl' ? s.replace('.', ',') + ' zł' : s + ' zł';
}

function parsePrice(v) {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(',', '.').replace(/[^\d.]/g, ''));
  if (!isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

const randomToken = (bytes = 24) => crypto.randomBytes(bytes).toString('base64url');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const hmac = (secret, s) => crypto.createHmac('sha256', secret).update(s).digest('base64url');
function safeEqual(a, b) {
  const A = Buffer.from(String(a)); const B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

function parseCookies(header) {
  const out = {};
  (header || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function cookie(name, value, opts = {}) {
  let c = `${name}=${encodeURIComponent(value)}; Path=${opts.path || '/'}`;
  if (opts.maxAge != null) c += `; Max-Age=${opts.maxAge}`;
  if (opts.httpOnly !== false) c += '; HttpOnly';
  c += `; SameSite=${opts.sameSite || 'Lax'}`;
  if (opts.secure) c += '; Secure';
  return c;
}

const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);
function fmtDate(d, lang) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-GB', { timeZone: 'Europe/Warsaw', dateStyle: 'medium', timeStyle: 'short' });
}
function fmtDay(d, lang) {
  const dt = new Date(d);
  return dt.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', { timeZone: 'Europe/Warsaw', day: 'numeric', month: 'short' });
}

const clampInt = (v, min, max, def) => {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
};

function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (xf) return String(xf).split(',')[0].trim();
  return req.socket.remoteAddress || '0.0.0.0';
}

module.exports = { esc, escAttr, textToHtml, slugify, money, parsePrice, randomToken, sha256, hmac, safeEqual, parseCookies, cookie, dayKey, fmtDate, fmtDay, clampInt, clientIp };
