'use strict';
const crypto = require('crypto');
const { hmac, safeEqual, sha256, randomToken, parseCookies, cookie, clientIp } = require('./util');
const db = require('./db');

// ---------- rate limiting (in-memory, per process) ----------
const buckets = new Map();
function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.reset < now) { b = { n: 0, reset: now + windowMs }; buckets.set(key, b); }
  b.n++;
  return b.n <= limit;
}
setInterval(() => { const now = Date.now(); for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k); }, 60000).unref();

function limiter(name, limit, windowMs) {
  return (req, res, next) => {
    if (!rateLimit(name + ':' + clientIp(req), limit, windowMs)) return res.status(429).json({ error: 'rate_limited' });
    next();
  };
}

// ---------- bot detection by UA (for analytics only, never blocks) ----------
const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|embedly|quora link preview|pinterest|whatsapp|telegram|discord|preview|curl|wget|python-requests|httpclient|headless|lighthouse|gtmetrix|pingdom|uptime/i;
const isBotUA = (ua) => !ua || BOT_RE.test(ua);

// ---------- proof-of-work "I'm not a robot" ----------
// 1. GET /api/challenge → { nonce, ts, sig, bits }
// 2. Browser finds counter such that sha256(nonce + ':' + counter) has `bits` leading zero bits
// 3. POST /api/verify {nonce, ts, sig, counter} → { token } valid 10 minutes
const POW_BITS = 18; // ~0.2–0.8 s in a modern browser
async function tokenSecret() { return db.ensureSecret('token_secret'); }

async function issueChallenge() {
  const nonce = randomToken(16); const ts = Date.now();
  const sig = hmac(await tokenSecret(), `c:${nonce}:${ts}`);
  return { nonce, ts, sig, bits: POW_BITS };
}
function leadingZeroBits(hex) {
  let n = 0;
  for (const ch of hex) {
    const v = parseInt(ch, 16);
    if (v === 0) { n += 4; continue; }
    n += Math.clz32(v) - 28; break;
  }
  return n;
}
async function verifyPow({ nonce, ts, sig, counter }) {
  if (!nonce || !ts || !sig || counter == null) return null;
  const secret = await tokenSecret();
  if (!safeEqual(sig, hmac(secret, `c:${nonce}:${ts}`))) return null;
  if (Date.now() - Number(ts) > 5 * 60 * 1000) return null;
  if (leadingZeroBits(sha256(`${nonce}:${counter}`)) < POW_BITS) return null;
  return issueToken(secret);
}
function issueToken(secret) {
  const exp = Date.now() + 10 * 60 * 1000; const r = randomToken(8);
  return `${exp}.${r}.${hmac(secret, `t:${exp}:${r}`)}`;
}
async function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const [exp, r, sig] = token.split('.');
  if (!exp || !r || !sig) return false;
  if (Number(exp) < Date.now()) return false;
  return safeEqual(sig, hmac(await tokenSecret(), `t:${exp}:${r}`));
}

// Optional Cloudflare Turnstile (set TURNSTILE_SITE_KEY + TURNSTILE_SECRET to use instead of PoW)
const TURNSTILE_SITE = process.env.TURNSTILE_SITE_KEY || '';
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET || '';
async function verifyTurnstile(response, ip) {
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret: TURNSTILE_SECRET, response, remoteip: ip }),
    });
    const j = await r.json();
    return !!j.success;
  } catch { return false; }
}
// Unified check used by every action endpoint.
async function verifyHuman(req) {
  const body = req.body || {};
  if (body.website) return false; // honeypot filled
  if (TURNSTILE_SITE && TURNSTILE_SECRET) return verifyTurnstile(body['cf-turnstile-response'] || body.turnstile, clientIp(req));
  return verifyToken(body.human);
}

// ---------- admin auth ----------
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `scrypt:${salt}:${h}`;
}
function checkPassword(pw, stored) {
  if (!stored || !stored.startsWith('scrypt:')) return false;
  const [, salt, h] = stored.split(':');
  const c = crypto.scryptSync(pw, salt, 64).toString('hex');
  return safeEqual(c, h);
}
const SESSION_COOKIE = 'rl_admin';
async function sessionSecret() { return db.ensureSecret('session_secret'); }
async function createSessionCookie(req) {
  const exp = Date.now() + 7 * 24 * 3600 * 1000; const r = randomToken(12);
  const v = `${exp}.${r}.${hmac(await sessionSecret(), `s:${exp}:${r}`)}`;
  return cookie(SESSION_COOKIE, v, { maxAge: 7 * 24 * 3600, secure: isSecure(req), path: '/' });
}
async function hasSession(req) {
  const v = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!v) return false;
  const [exp, r, sig] = v.split('.');
  if (!exp || !r || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, hmac(await sessionSecret(), `s:${exp}:${r}`));
}
function clearSessionCookie(req) { return cookie(SESSION_COOKIE, '', { maxAge: 0, secure: isSecure(req) }); }
const isSecure = (req) => (req.headers['x-forwarded-proto'] || req.protocol) === 'https';

// CSRF for admin forms: double-submit token bound to the session cookie
async function csrfToken(req) {
  const v = parseCookies(req.headers.cookie)[SESSION_COOKIE] || '';
  return hmac(await sessionSecret(), `csrf:${v}`);
}
async function checkCsrf(req) {
  const t = (req.body && req.body._csrf) || req.headers['x-csrf'];
  return !!t && safeEqual(t, await csrfToken(req));
}

// ---------- headers ----------
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (isSecure(req)) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: blob: https://*.tile.openstreetmap.org; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src https://fonts.gstatic.com; " +
    "script-src 'self' https://challenges.cloudflare.com https://cdnjs.cloudflare.com; frame-src https://challenges.cloudflare.com https://checkout.stripe.com; connect-src 'self'; form-action 'self' https://checkout.stripe.com; base-uri 'self'; object-src 'none'");
  next();
}

// Image magic bytes
function sniffImage(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}

module.exports = { rateLimit, limiter, isBotUA, issueChallenge, verifyPow, verifyHuman, TURNSTILE_SITE, hashPassword, checkPassword, createSessionCookie, hasSession, clearSessionCookie, csrfToken, checkCsrf, securityHeaders, sniffImage, isSecure };
