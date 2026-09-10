'use strict';
const db = require('./db');
const { url } = require('./i18n');

const KEY = process.env.STRIPE_SECRET_KEY || '';
let stripe = null;
if (KEY) {
  try { stripe = require('stripe')(KEY, { apiVersion: '2024-06-20' }); } catch (e) { console.error('Stripe init failed:', e.message); }
}
const stripeEnabled = () => !!stripe;

async function createCheckoutSession(order, siteUrl) {
  const lang = order.lang === 'en' ? 'en' : 'pl';
  const line_items = order.items.map((i) => ({
    quantity: i.qty,
    price_data: {
      currency: 'pln', unit_amount: i.price_grosze,
      product_data: { name: (lang === 'en' && i.name_en ? i.name_en : i.name_pl) + ([i.material, i.color, i.finish].filter(Boolean).length ? ' (' + [i.material, i.color, i.finish].filter(Boolean).join(', ') + ')' : ''), images: i.image ? [siteUrl + '/img/' + i.image] : undefined },
    },
  }));
  if (order.delivery_grosze > 0) {
    line_items.push({ quantity: 1, price_data: { currency: 'pln', unit_amount: order.delivery_grosze, product_data: { name: lang === 'en' ? 'Delivery in Chełm' : 'Dostawa po Chełmie' } } });
  }
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items,
    locale: lang,
    customer_email: order.email || undefined,
    client_reference_id: order.number,
    metadata: { order_number: order.number },
    phone_number_collection: { enabled: false },
    success_url: `${siteUrl}${url(lang, 'order', order.number)}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}${url(lang, 'cart')}`,
    // payment methods (card, BLIK, P24, Apple/Google Pay) come from the Stripe Dashboard settings
  });
  await db.q('UPDATE orders SET stripe_session_id=$1, updated_at=now() WHERE id=$2', [session.id, order.id]);
  return session.url;
}

async function markPaid(order) {
  if (order.status !== 'new') return order;
  await db.q('UPDATE orders SET status=$1, paid_at=now(), updated_at=now() WHERE id=$2', ['paid', order.id]);
  await countSold(order);
  order.status = 'paid';
  return order;
}
async function countSold(order) {
  const r = await db.one('SELECT counted FROM orders WHERE id=$1', [order.id]);
  if (r && r.counted) return;
  for (const i of order.items) await db.q('UPDATE products SET sold_count = sold_count + $1 WHERE id=$2', [i.qty, i.id]);
  await db.q('UPDATE orders SET counted=true WHERE id=$1', [order.id]);
}

// Called from the order page when Stripe redirects back with session_id.
async function confirmFromSession(order, sessionId) {
  if (!stripe || !sessionId || order.payment !== 'stripe') return order;
  if (order.stripe_session_id && order.stripe_session_id !== sessionId) return order;
  try {
    const s = await stripe.checkout.sessions.retrieve(sessionId);
    if (s && s.payment_status === 'paid' && (s.client_reference_id === order.number || (s.metadata && s.metadata.order_number === order.number))) return markPaid(order);
  } catch (e) { console.error('Stripe session verify failed:', e.message); }
  return order;
}

// Optional webhook (set STRIPE_WEBHOOK_SECRET). Handles checkout.session.completed.
async function handleWebhook(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return false;
  const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const s = event.data.object;
    if (s.payment_status === 'paid') {
      const number = s.client_reference_id || (s.metadata && s.metadata.order_number);
      const o = number ? await db.one('SELECT * FROM orders WHERE number=$1', [number]) : null;
      if (o) await markPaid(o);
    }
  }
  return true;
}

module.exports = { stripeEnabled, createCheckoutSession, confirmFromSession, handleWebhook, markPaid, countSold };
