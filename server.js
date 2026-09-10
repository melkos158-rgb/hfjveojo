'use strict';
// Ride Lab — shop for ready-made 3D-printed e-scooter parts (Chełm, PL). See PLAN.md.
const path = require('path');
const express = require('express');
const db = require('./src/db');
const { securityHeaders } = require('./src/security');
const publicRoutes = require('./src/routes/public');
const apiRoutes = require('./src/routes/api');
const { createAdminRouter } = require('./src/routes/admin');

const PORT = process.env.PORT || 3000;
let ADMIN_PATH = process.env.ADMIN_PATH || '/admin';
if (!ADMIN_PATH.startsWith('/')) ADMIN_PATH = '/' + ADMIN_PATH;
ADMIN_PATH = ADMIN_PATH.replace(/\/+$/, '');

async function main() {
  await db.migrate();
  if (process.env.SITE_URL) await db.setSetting('site_url', process.env.SITE_URL.replace(/\/$/, ''));

  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(securityHeaders);

  app.get('/healthz', (req, res) => res.type('text/plain').send('ok'));
  app.use('/static', express.static(path.join(__dirname, 'public'), { maxAge: '7d', etag: true }));

  // Stripe webhook needs the raw body, so it is mounted before any JSON parser.
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json', limit: '1mb' }), apiRoutes.webhook);
  app.use('/api', apiRoutes);
  app.use(ADMIN_PATH, createAdminRouter(ADMIN_PATH));
  app.use(publicRoutes);

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) return;
    if (req.path.startsWith('/api/')) return res.status(500).json({ error: 'server' });
    res.status(500).type('text/plain').send('Server error');
  });

  // keep analytics table small
  const cleanup = () => db.q("DELETE FROM pageviews WHERE day < (now() - interval '90 days')::date").catch(() => {});
  setInterval(cleanup, 24 * 3600 * 1000).unref(); cleanup();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ride-lab listening on ${PORT} — admin at ${ADMIN_PATH}${ADMIN_PATH === '/admin' ? ' (set ADMIN_PATH to hide it)' : ''}`);
  });
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
