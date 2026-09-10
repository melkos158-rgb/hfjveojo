'use strict';
const db = require('./db');
const { money } = require('./util');

async function telegram(text) {
  try {
    const s = await db.getSettings();
    const token = s.telegram_token || process.env.TELEGRAM_BOT_TOKEN; const chat = s.telegram_chat || process.env.TELEGRAM_CHAT_ID;
    if (!token || !chat) return;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
    });
  } catch (e) { console.error('telegram notify failed:', e.message); }
}

function newOrder(o) {
  const items = o.items.map((i) => `• ${i.name_pl} × ${i.qty}`).join('\n');
  return telegram(`🛒 Nowe zamówienie ${o.number}\n${items}\nRazem: ${money(o.total_grosze, 'pl')}\n${o.delivery_method === 'delivery' ? 'Dostawa: ' + o.address : 'Odbiór osobisty'}\nPłatność: ${o.payment === 'stripe' ? 'online' : 'przy odbiorze'}\n${o.customer_name} · ${o.phone}${o.note ? '\nUwagi: ' + o.note : ''}`);
}
function newRequest(r) {
  return telegram(r.kind === 'contact' ? `✉️ Kontakt od ${r.scooter_model}\n${r.contact}\n${r.message}` : `🔧 Zapytanie o część\nModel: ${r.scooter_model}\nCzęść: ${r.part}\nKontakt: ${r.contact}${r.message ? '\n' + r.message : ''}`);
}
function paid(o) { return telegram(`✅ Opłacone online: ${o.number} — ${money(o.total_grosze, 'pl')}`); }

module.exports = { newOrder, newRequest, paid };
