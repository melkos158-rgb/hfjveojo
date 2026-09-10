'use strict';
const { esc, textToHtml, money } = require('../util');
const { url, t } = require('../i18n');
const { icon } = require('./layout');
const { TURNSTILE_SITE } = require('../security');

const name = (p, lang) => (lang === 'en' && p.name_en) ? p.name_en : p.name_pl;
const tagline = (p, lang) => (lang === 'en' && p.tagline_en) ? p.tagline_en : p.tagline_pl;
const field = (p, base, lang) => (lang === 'en' && p[base + '_en']) ? p[base + '_en'] : p[base + '_pl'];
const img = (id, w) => `/img/${id}${w ? '?w=' + w : ''}`;

function productCard(ctx, p) {
  const { lang } = ctx; const L = (k, v) => t(lang, k, v);
  const href = url(lang, 'product', p.slug);
  const avail = p.stock > 0 ? `<span class="avail ok">${L('in_stock')}</span>` : `<span class="avail">${L('made_to_order', { n: p.lead_days })}</span>`;
  return `<article class="card">
  <a class="card-art" href="${href}">${p.cover ? `<img src="${img(p.cover)}" alt="${esc(name(p, lang))}" loading="lazy" width="800" height="600">` : '<span class="noimg">' + icon('print') + '</span>'}
    ${p.compare_grosze && p.compare_grosze > p.price_grosze ? `<span class="sale">-${Math.round(100 - p.price_grosze / p.compare_grosze * 100)}%</span>` : ''}
  </a>
  <div class="card-body">
    <a class="card-name" href="${href}">${esc(name(p, lang))}</a>
    ${p.fits && p.fits.length ? `<div class="card-fit">${L('fits')}: ${esc(p.fits.slice(0, 2).join(', '))}</div>` : ''}
    <div class="card-row">
      <div class="price">${money(p.price_grosze, lang)}${p.compare_grosze && p.compare_grosze > p.price_grosze ? ` <s>${money(p.compare_grosze, lang)}</s>` : ''}</div>
      ${avail}
    </div>
    <div class="card-row">
      ${p.sold_count > 0 ? `<span class="sold">${L('sold', { n: p.sold_count })}</span>` : '<span></span>'}
      <button class="btn btn-sm btn-primary" type="button" data-add="${p.id}" data-name="${esc(name(p, lang))}">${L('add_cart')}</button>
    </div>
  </div>
</article>`;
}

const chelmNotice = (ctx) => `<div class="wrap"><p class="notice">${icon('pin')}<span>${t(ctx.lang, 'chelm_notice')}</span></p></div>`;

function botBox(ctx) {
  const L = (k) => t(ctx.lang, k);
  if (TURNSTILE_SITE) {
    return `<div class="cf-turnstile" data-sitekey="${esc(TURNSTILE_SITE)}" data-theme="dark"></div><script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>`;
  }
  return `<label class="botbox" data-botbox>
  <input type="checkbox" data-bot-check aria-describedby="bot-hint">
  <span class="botbox-mark" aria-hidden="true"></span>
  <span class="botbox-text" data-bot-text data-checking="${esc(L('bot_checking'))}" data-ok="${esc(L('bot_ok'))}">${L('bot_label')}</span>
  <input type="hidden" name="human" data-human>
  <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
</label>`;
}

// ---------------- HOME ----------------
function home(ctx, { slides, products, settings }) {
  const { lang } = ctx; const L = (k, v) => t(lang, k, v);
  const how = L('how'); const why = L('why');
  const hero = slides.length ? `<div class="hero-slides" data-slides>
    ${slides.map((s, i) => { const st = (lang === 'en' && s.title_en) ? s.title_en : s.title_pl; const ss = (lang === 'en' && s.sub_en) ? s.sub_en : s.sub_pl; return `<figure class="slide${i === 0 ? ' on' : ''}" data-slide data-title="${esc(st)}" data-sub="${esc(ss)}">
      <img src="${img(s.image_id)}" alt="" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} width="1600" height="900">
    </figure>`; }).join('')}
    ${slides.length > 1 ? `<div class="dots" role="tablist">${slides.map((s, i) => `<button type="button" role="tab" aria-selected="${i === 0}" aria-label="${L('hero_dots', { n: i + 1 })}" data-dot="${i}"></button>`).join('')}</div>` : ''}
  </div>` : `<div class="hero-fallback"></div>`;

  const jsonld = {
    '@context': 'https://schema.org', '@type': 'LocalBusiness', name: settings.shop_name,
    description: L('seo_home_desc'), url: settings.site_url || undefined, telephone: settings.phone || undefined,
    address: { '@type': 'PostalAddress', addressLocality: 'Chełm', addressCountry: 'PL', streetAddress: settings.address || undefined },
    priceRange: 'zł', openingHours: settings.hours || undefined,
  };

  return {
    jsonld,
    body: `
<section class="hero">
  ${hero}
  <div class="hero-scrim"></div>
  <div class="wrap hero-in">
    <p class="eyebrow">${L('brand_tag')}</p>
    <h1 data-hero-title data-default="${esc(L('hero_title'))}">${esc(slides[0] && ((lang === 'en' && slides[0].title_en) || slides[0].title_pl) ? ((lang === 'en' && slides[0].title_en) || slides[0].title_pl) : L('hero_title'))}</h1>
    <p class="hero-sub" data-hero-sub data-default="${esc(L('hero_sub'))}">${esc(slides[0] && ((lang === 'en' && slides[0].sub_en) || slides[0].sub_pl) ? ((lang === 'en' && slides[0].sub_en) || slides[0].sub_pl) : L('hero_sub'))}</p>
    <div class="hero-cta">
      <a href="${url(lang, 'shop')}" class="btn btn-primary">${L('hero_cta')}</a>
      <a href="#request" class="btn btn-outline">${L('hero_cta2')}</a>
    </div>
  </div>
</section>
${chelmNotice(ctx)}

<section class="wrap sec">
  <div class="sec-head"><h2>${L('how_title')}</h2></div>
  <div class="steps">
    ${how.map(([h, p], i) => `<div class="step"><span class="step-n">${String(i + 1).padStart(2, '0')}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('')}
  </div>
</section>

<section class="wrap sec" id="products">
  <div class="sec-head"><h2>${L('products_title')}</h2><a class="sec-link" href="${url(lang, 'shop')}">${L('products_all')} →</a></div>
  ${products.length ? `<div class="grid">${products.map((p) => productCard(ctx, p)).join('')}</div>` : `<p class="empty">${L('shop_empty')}</p>`}
</section>

<div class="band"><section class="wrap sec">
  <div class="sec-head"><h2>${L('why_title')}</h2></div>
  <div class="why">
    ${why.map(([h, p]) => `<div class="why-item"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('')}
  </div>
</section></div>

<section class="wrap sec" id="request">
  <div class="req">
    <div>
      <h2>${L('req_title')}</h2>
      <p class="sec-note">${L('req_sub')}</p>
    </div>
    ${requestForm(ctx)}
  </div>
</section>

<section class="wrap sec">
  <div class="sec-head"><h2>${L('faq_title')}</h2><a class="sec-link" href="${url(lang, 'faq')}">FAQ →</a></div>
  ${faqList(ctx, settings, 4)}
</section>

<section class="wrap sec">
  <div class="contact-strip">
    <div>${icon('pin')}<div><b>${L('contact_pickup')}</b><span>${esc(settings.address)}</span></div></div>
    <div>${icon('clock')}<div><b>${L('contact_hours')}</b><span>${esc(settings.hours)}</span></div></div>
    <div>${icon('shield')}<div><b>${L('contact_phone')}</b><span><a href="tel:${esc(settings.phone.replace(/\s/g, ''))}">${esc(settings.phone)}</a></span></div></div>
  </div>
</section>`,
  };
}

function requestForm(ctx) {
  const L = (k) => t(ctx.lang, k);
  return `<form class="form" data-request-form data-ok="${esc(L('req_ok'))}">
  <label>${L('req_model')}<input name="scooter_model" required maxlength="120" placeholder="${esc(L('req_model_ph'))}"></label>
  <label>${L('req_part')}<input name="part" required maxlength="160" placeholder="${esc(L('req_part_ph'))}"></label>
  <label>${L('req_contact')}<input name="contact" required maxlength="160"></label>
  <label>${L('req_msg')}<textarea name="message" rows="3" maxlength="1500"></textarea></label>
  ${botBox(ctx)}
  <button class="btn btn-primary" type="submit">${L('req_send')}</button>
  <p class="form-msg" data-msg hidden></p>
</form>`;
}

// ---------------- FAQ ----------------
function faqItems(lang, settings) {
  const price = money(settings.delivery_grosze, lang);
  return lang === 'pl' ? [
    ['Czy części są wytrzymałe?', 'Tak. Drukujemy z PETG lub ASA, grubymi ścianami i wysokim wypełnieniem. To materiały odporne na wodę, mróz i UV — używane też w częściach samochodowych. Jeśli część pęknie w ciągu 30 dni normalnej jazdy, drukujemy nową bez pytań.'],
    ['Jak długo czekam na zamówienie?', 'Większość części mamy gotowe w 1–3 dni robocze. Czas realizacji jest podany przy każdym produkcie. Gdy część jest gotowa, dzwonimy albo piszemy.'],
    ['Jak odbieram?', `Osobiście w Chełmie (adres i godziny w zakładce Kontakt) albo z dostawą po Chełmie za ${price}. Wysyłkę po Polsce planujemy — na razie działamy lokalnie.`],
    ['Jak mogę zapłacić?', 'Online kartą, BLIK-iem, Apple Pay lub Google Pay przez Stripe — albo gotówką / BLIK-iem przy odbiorze. Nie zakładasz konta, nie podajesz danych karty u nas.'],
    ['Co jeśli część nie pasuje?', 'Skontaktuj się z nami — dopasujemy albo zwrócimy pieniądze. Jako konsument masz też ustawowe 14 dni na odstąpienie od umowy.'],
    ['Zrobicie część do innego modelu?', 'Tak. Zostaw zapytanie z modelem hulajnogi i opisem części. Wycena jest darmowa, a jeśli część trafi do sklepu, dostajesz ją jako pierwszy.'],
  ] : [
    ['Are the parts durable?', 'Yes. We print in PETG or ASA with thick walls and high infill — materials resistant to water, frost and UV, also used in automotive parts. If a part cracks within 30 days of normal riding, we print a new one, no questions asked.'],
    ['How long does it take?', 'Most parts are ready within 1–3 business days. The lead time is shown on every product. We call or message you when it is ready.'],
    ['How do I get it?', `Pick it up in Chełm (address and hours on the Contact page) or have it delivered within Chełm for ${price}. Shipping across Poland is planned — for now we work locally.`],
    ['How can I pay?', 'Online by card, BLIK, Apple Pay or Google Pay via Stripe — or in cash / BLIK at pickup. No account, and we never see your card details.'],
    ["What if it doesn't fit?", 'Contact us — we will adjust it or refund you. As a consumer you also have the statutory 14-day right of withdrawal.'],
    ['Can you make a part for another model?', 'Yes. Leave a request with your scooter model and a description of the part. Quotes are free, and if the part makes it to the shop you get it first.'],
  ];
}
function faqList(ctx, settings, limit) {
  const items = faqItems(ctx.lang, settings).slice(0, limit || 99);
  return `<div class="faq">${items.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
}
function faqPage(ctx, settings) {
  const L = (k) => t(ctx.lang, k);
  const items = faqItems(ctx.lang, settings);
  const jsonld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  return { jsonld, body: `<section class="wrap sec narrow"><h1>${L('faq_title')}</h1>${faqList(ctx, settings)}</section>` };
}

// ---------------- SHOP ----------------
function shop(ctx, { products, q, sort }) {
  const { lang } = ctx; const L = (k) => t(lang, k);
  const opt = (v, label) => `<option value="${v}"${sort === v ? ' selected' : ''}>${label}</option>`;
  return `<section class="wrap sec">
  <div class="sec-head"><div><h1>${L('shop_title')}</h1><p class="sec-note">${L('shop_sub')}</p></div></div>
  <form class="toolbar" method="get" action="${url(lang, 'shop')}">
    <div class="search">${icon('search')}<input type="search" name="q" value="${esc(q || '')}" placeholder="${esc(L('search_ph'))}" aria-label="${esc(L('search_ph'))}"></div>
    <select name="sort" aria-label="Sort" onchange="this.form.submit()">${opt('new', L('sort_new'))}${opt('cheap', L('sort_cheap'))}${opt('exp', L('sort_exp'))}</select>
    <button class="btn btn-outline btn-sm" type="submit">${L('search_btn')}</button>
  </form>
  ${products.length ? `<div class="grid">${products.map((p) => productCard(ctx, p)).join('')}</div>` : `<p class="empty">${L('shop_empty')} <a href="${url(lang, 'home')}#request">${L('hero_cta2')}</a></p>`}
</section>
${chelmNotice(ctx)}`;
}

// ---------------- PRODUCT ----------------
function product(ctx, { p, similar, settings }) {
  const { lang } = ctx; const L = (k, v) => t(lang, k, v);
  const n = name(p, lang); const tg = tagline(p, lang);
  const gallery = p.images.length ? `<div class="gallery" data-gallery>
    <div class="gallery-main"><img src="${img(p.images[0])}" alt="${esc(n)}" data-gallery-main width="1200" height="900" fetchpriority="high">
      ${p.images.length > 1 ? `<button class="g-prev" type="button" data-gprev aria-label="Previous">‹</button><button class="g-next" type="button" data-gnext aria-label="Next">›</button>` : ''}
    </div>
    ${p.images.length > 1 ? `<div class="thumbs">${p.images.map((id, i) => `<button type="button" class="${i === 0 ? 'on' : ''}" data-thumb="${img(id)}" aria-label="Photo ${i + 1}"><img src="${img(id)}" alt="" loading="lazy" width="200" height="150"></button>`).join('')}</div>` : ''}
  </div>` : `<div class="gallery"><div class="gallery-main noimg">${icon('print')}</div></div>`;

  const materials = (p.materials && p.materials.length) ? p.materials : (p.material ? [p.material] : []);
  const colors = (p.colors && p.colors.length) ? p.colors : (p.color ? [p.color] : []);
  const finishes = (p.finishes && p.finishes.length) ? p.finishes : [];
  const spec = [
    p.fits && p.fits.length ? [L('fits'), p.fits.join(', ')] : null,
    materials.length ? [L('spec_material'), materials.join(', ')] : null,
    colors.length ? [L('spec_color'), colors.join(', ')] : null,
    finishes.length ? [L('spec_finish'), finishes.join(', ')] : null,
    p.weight_g ? [L('spec_weight'), p.weight_g + ' g'] : null,
    [L('spec_lead'), p.stock > 0 ? L('in_stock') : `${p.lead_days} ${L('days')}`],
    [L('spec_warranty'), L('warranty_val')],
  ].filter(Boolean);

  const tabs = [['desc', L('tab_desc')], ['install', L('tab_install')], ['print', L('tab_print')]].filter(([k]) => field(p, k, lang));

  const jsonld = {
    '@context': 'https://schema.org', '@type': 'Product', name: n, description: (field(p, 'desc', lang) || tg || n).slice(0, 300),
    image: p.images.map((id) => (settings.site_url || '') + img(id)), sku: p.slug, brand: { '@type': 'Brand', name: settings.shop_name },
    material: p.material || undefined,
    offers: { '@type': 'Offer', priceCurrency: 'PLN', price: (p.price_grosze / 100).toFixed(2), availability: p.active ? (p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/MadeToOrder') : 'https://schema.org/OutOfStock', url: (settings.site_url || '') + url(lang, 'product', p.slug), itemCondition: 'https://schema.org/NewCondition', areaServed: 'Chełm, PL' },
  };

  return {
    jsonld, ogImage: p.images[0] ? img(p.images[0]) : '',
    body: `<section class="wrap sec product">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="${url(lang, 'home')}">${L('crumb_home')}</a> › <a href="${url(lang, 'shop')}">${L('nav_shop')}</a> › <span>${esc(n)}</span></nav>
  <div class="p-head">
    <h1>${esc(n)}</h1>
    ${tg ? `<p class="p-tag">${esc(tg)}</p>` : ''}
    <div class="badges"><span>${icon('print')} ${L('badge_print')}</span><span>${icon('wrench')} ${L('badge_install')}</span><span>${icon('shield')} ${L('badge_durable')}</span></div>
  </div>
  <div class="p-grid">
    <div class="p-left">
      ${gallery}
    </div>
    <div class="p-tabs" data-tabs>
      <div class="tab-bar" role="tablist">${tabs.map(([k, l], i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-tab="${k}">${l}</button>`).join('')}</div>
      ${tabs.map(([k], i) => `<div class="tab-panel prose" data-panel="${k}"${i ? ' hidden' : ''}>${textToHtml(field(p, k, lang))}</div>`).join('')}
    </div>
    <aside class="p-buy">
      <div class="p-price">
        <div><span class="big">${money(p.price_grosze, lang)}</span>${p.compare_grosze && p.compare_grosze > p.price_grosze ? ` <s>${money(p.compare_grosze, lang)}</s>` : ''}<small>${L('vat_incl')}</small></div>
      </div>
      ${p.active ? `<button class="btn btn-primary btn-block" type="button" data-add="${p.id}" data-name="${esc(n)}">${icon('cart')} ${L('add_to_cart')}</button>
      <button class="btn btn-outline btn-block" type="button" data-buy="${p.id}" data-name="${esc(n)}">${icon('bolt')} ${L('buy_now')}</button>` : `<p class="empty">${L('out_of_stock')}</p>`}
      <ul class="trust">
        <li>${icon('pin')}<div><b>${L('trust_pickup')}</b><span>${L('trust_pickup_sub')}</span></div></li>
        <li>${icon('clock')}<div><b>${p.stock > 0 ? L('in_stock') : L('trust_time', { n: p.lead_days })}</b><span>${L('trust_time_sub')}</span></div></li>
        <li>${icon('shield')}<div><b>${L('trust_pay')}</b><span>${L('trust_pay_sub')}</span></div></li>
      </ul>
      <h3 class="spec-title">${L('spec_title')}</h3>
      <dl class="spec">${spec.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      ${p.stock > 0 && p.stock <= 5 ? `<p class="stock-note">${L('stock_left')}: ${p.stock}</p>` : ''}
    </aside>
  </div>
</section>
${chelmNotice(ctx)}
${similar.length ? `<section class="wrap sec"><div class="sec-head"><h2>${L('similar')}</h2><a class="sec-link" href="${url(lang, 'shop')}">${L('view_more')} →</a></div><div class="grid">${similar.map((s) => productCard(ctx, s)).join('')}</div></section>` : ''}`,
  };
}

// ---------------- CART ----------------
function cart(ctx, { settings, stripeEnabled }) {
  const { lang } = ctx; const L = (k, v) => t(lang, k, v);
  const dprice = money(settings.delivery_grosze, lang);
  return `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<section class="wrap sec cart" data-cart-page data-delivery-grosze="${settings.delivery_grosze}" data-lang="${lang}" data-shop-url="${url(lang, 'shop')}" data-order-url="${url(lang, 'order')}">
  <h1>${L('cart_title')}</h1>
  <div class="map-modal" data-map-modal hidden>
    <div class="map-card">
      <div class="map-head"><b>${L('map_pick')}</b><button type="button" class="map-x" data-map-close aria-label="${L('map_close')}">×</button></div>
      <p class="map-hint">${L('map_hint')}</p>
      <div class="map-canvas" data-map></div>
      <p class="map-err" data-map-err hidden>${L('map_outside')}</p>
      <div class="map-actions"><button type="button" class="btn btn-outline btn-sm" data-map-close>${L('map_close')}</button><button type="button" class="btn btn-primary btn-sm" data-map-confirm disabled>${L('map_confirm')}</button></div>
    </div>
  </div>
  <div class="cart-grid">
    <div>
      <div data-cart-items class="cart-items"></div>
      <p class="empty" data-cart-empty hidden>${L('cart_empty')} <a href="${url(lang, 'shop')}">${L('go_shop')}</a></p>
    </div>
    <aside class="cart-side" data-cart-side hidden>
      <div class="totals">
        <div><span>${L('subtotal')}</span><b data-subtotal>0</b></div>
        <div><span>${L('delivery')}</span><b data-delivery>0</b></div>
        <div class="total"><span>${L('total')}</span><b data-total>0</b></div>
      </div>
      <form class="form" data-checkout-form>
        <h2>${L('form_title')}</h2>
        <label>${L('f_name')}<input name="customer_name" required maxlength="120" autocomplete="name"></label>
        <label>${L('f_phone')}<input name="phone" required maxlength="40" autocomplete="tel" inputmode="tel"></label>
        <label>${L('f_email')}<input name="email" type="email" maxlength="160" autocomplete="email"></label>
        <fieldset><legend>${L('f_delivery')}</legend>
          <label class="radio"><input type="radio" name="delivery_method" value="pickup" checked><span>${L('d_pickup')}</span></label>
          <label class="radio"><input type="radio" name="delivery_method" value="delivery"><span>${L('d_delivery', { price: dprice })}</span></label>
        </fieldset>
        <div class="deliv-box" data-address hidden>
          <input type="hidden" name="lat" data-lat>
          <input type="hidden" name="lng" data-lng>
          <button type="button" class="btn btn-outline btn-block map-pick-btn" data-map-open>${icon('pin')} <span>${L('map_pick')}</span></button>
          <div class="deliv-chosen" data-chosen hidden>${icon('pin')}<div><b>${L('map_chosen')}</b><span data-chosen-text></span></div><button type="button" class="linklike" data-map-open>${L('map_change')}</button></div>
          <label>${L('map_details')}<input name="address" maxlength="200" autocomplete="street-address"></label>
        </div>
        <label>${L('f_note')}<textarea name="note" rows="2" maxlength="800"></textarea></label>
        ${botBox(ctx)}
        <div class="pay-buttons">
          ${stripeEnabled ? `<button class="btn btn-primary btn-block" type="submit" data-pay="stripe">${L('pay_online')}</button><small>${L('pay_online_hint')}</small>` : ''}
          <button class="btn ${stripeEnabled ? 'btn-outline' : 'btn-primary'} btn-block" type="submit" data-pay="pickup">${L('pay_pickup')}</button><small>${L('pay_pickup_hint')}</small>
        </div>
        <p class="legal">${L('legal_ok', { terms: `<a href="${url(lang, 'terms')}">${L('terms')}</a>`, privacy: `<a href="${url(lang, 'privacy')}">${L('privacy')}</a>` })}</p>
        <p class="form-msg" data-msg hidden></p>
      </form>
    </aside>
  </div>
</section>`;
}

// ---------------- ORDER SUCCESS ----------------
function orderPage(ctx, { order, settings, verifying }) {
  const { lang } = ctx; const L = (k, v) => t(lang, k, v);
  if (!order) return `<section class="wrap sec narrow"><h1>${L('order_not_found')}</h1></section>`;
  const items = order.items || [];
  const lead = Math.max(1, ...items.map((i) => i.lead_days || 1));
  const paid = order.status === 'paid' || order.status === 'fulfilled';
  return `<section class="wrap sec narrow order" ${verifying ? `data-verify-order="${esc(order.number)}"` : ''}>
  <p class="eyebrow">${L('order_no')}</p>
  <h1>${esc(order.number)}</h1>
  <p class="lede">${L('order_thanks')}</p>
  ${verifying && !paid ? `<p class="notice">${L('order_verifying')}</p>` : ''}
  <div class="order-box">
    <h2>${L('order_items')}</h2>
    <table class="order-table"><tbody>
      ${items.map((i) => { const opts = [i.material, i.color, i.finish].filter(Boolean).join(' · '); return `<tr><td>${esc(lang === 'en' && i.name_en ? i.name_en : i.name_pl)} × ${i.qty}${opts ? `<br><span class="muted" style="font-size:12px">${esc(opts)}</span>` : ''}</td><td>${money(i.price_grosze * i.qty, lang)}</td></tr>`; }).join('')}
      <tr><td>${L('delivery')}</td><td>${money(order.delivery_grosze, lang)}</td></tr>
      <tr class="total"><td>${L('total')}</td><td>${money(order.total_grosze, lang)}</td></tr>
    </tbody></table>
    <p class="pay-state ${paid ? 'ok' : ''}">${paid ? icon('check') + ' ' + L('order_paid') : L('order_unpaid')}</p>
  </div>
  <div class="order-box">
    <h2>${L('order_next')}</h2>
    <p>${L('order_next_text', { n: lead })}</p>
    ${order.delivery_method === 'delivery' ? `<p><b>${L('order_delivery_to')}:</b> ${esc(order.address)}${order.lat && order.lng ? ` · <a href="https://www.google.com/maps/search/?api=1&query=${order.lat},${order.lng}" target="_blank" rel="noopener">${L('contact_map')} →</a>` : ''}</p>` : `<p><b>${L('order_pickup_at')}:</b> ${esc(settings.address)}<br><span class="muted">${esc(settings.hours)}</span></p>`}
    <p><b>${L('contact_phone')}:</b> <a href="tel:${esc(settings.phone.replace(/\s/g, ''))}">${esc(settings.phone)}</a></p>
  </div>
</section>`;
}

// ---------------- STATIC PAGES ----------------
function about(ctx, settings) {
  const pl = ctx.lang === 'pl';
  return `<section class="wrap sec narrow prose">
  <h1>${pl ? 'O nas' : 'About us'}</h1>
  ${pl ? `
  <p class="lede">Ride Lab to mała pracownia druku 3D w Chełmie. Robimy części do hulajnóg elektrycznych, których nie da się kupić w sklepie — albo da się, ale za dużo i nie w tym rozmiarze.</p>
  <p>Zaczęło się od pękniętego błotnika. Producent nie sprzedawał go osobno, a zamiennik z internetu nie pasował. Więc zaprojektowaliśmy własny, wydrukowaliśmy, wytrzymał zimę. Potem poprosił znajomy. Potem znajomy znajomego.</p>
  <h2>Co robimy inaczej</h2>
  <ul>
    <li><strong>Mierzymy na prawdziwej hulajnodze.</strong> Każdą część projektujemy pod konkretny model i sprawdzamy montaż, zanim trafi do sklepu.</li>
    <li><strong>Materiał do jazdy, nie do zabawy.</strong> PETG i ASA — odporne na wodę, sól drogową, mróz i słońce. Nie PLA, które kruszy się po jednej zimie.</li>
    <li><strong>Lokalnie.</strong> Jesteśmy w Chełmie. Odbierasz osobiście, dowozimy po mieście, a jak coś nie pasuje — przyjeżdżasz i poprawiamy na miejscu.</li>
  </ul>
  <h2>Nie ma Twojej części?</h2>
  <p>Zostaw <a href="${url('pl', 'home')}#request">zapytanie</a> z modelem hulajnogi. Jeśli da się to wydrukować, zaprojektujemy i wycenimy — bezpłatnie.</p>
  ` : `
  <p class="lede">Ride Lab is a small 3D-printing workshop in Chełm, Poland. We make parts for electric scooters that you can't buy in a shop — or can, but overpriced and in the wrong size.</p>
  <p>It started with a cracked fender. The manufacturer didn't sell it separately and the replacement from the internet didn't fit. So we designed our own, printed it, and it survived the winter. Then a friend asked. Then a friend of a friend.</p>
  <h2>What we do differently</h2>
  <ul>
    <li><strong>We measure on the real scooter.</strong> Every part is designed for a specific model and test-fitted before it goes on sale.</li>
    <li><strong>Material for riding, not for toys.</strong> PETG and ASA — resistant to water, road salt, frost and sun. Not PLA, which crumbles after one winter.</li>
    <li><strong>Local.</strong> We're in Chełm. Pick it up yourself, we deliver in town, and if something doesn't fit — come over and we fix it on the spot.</li>
  </ul>
  <h2>Don't see your part?</h2>
  <p>Leave a <a href="${url('en', 'home')}#request">request</a> with your scooter model. If it can be printed, we design and quote it — free.</p>
  `}
</section>`;
}

function contact(ctx, settings) {
  const { lang } = ctx; const L = (k) => t(lang, k);
  const wa = settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}` : '';
  const map = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(settings.address + ', Chełm');
  return `<section class="wrap sec">
  <h1>${L('contact_title')}</h1>
  <div class="contact-grid">
    <div class="contact-info">
      <div>${icon('pin')}<div><b>${L('contact_pickup')}</b><span>${esc(settings.address)}</span><a href="${map}" target="_blank" rel="noopener">${L('contact_map')} →</a></div></div>
      <div>${icon('clock')}<div><b>${L('contact_hours')}</b><span>${esc(settings.hours)}</span></div></div>
      <div>${icon('shield')}<div><b>${L('contact_phone')}</b><span><a href="tel:${esc(settings.phone.replace(/\s/g, ''))}">${esc(settings.phone)}</a></span>${wa ? `<a href="${wa}" target="_blank" rel="noopener">${L('contact_wa')} →</a>` : ''}</div></div>
      <div>${icon('bolt')}<div><b>${L('contact_email')}</b><span><a href="mailto:${esc(settings.email)}">${esc(settings.email)}</a></span></div></div>
    </div>
    <form class="form" data-contact-form data-ok="${esc(L('contact_ok'))}">
      <h2>${L('contact_form_title')}</h2>
      <label>${L('contact_name')}<input name="scooter_model" required maxlength="120"></label>
      <label>${L('req_contact')}<input name="contact" required maxlength="160"></label>
      <label>${L('contact_msg')}<textarea name="message" rows="4" required maxlength="1500"></textarea></label>
      ${botBox(ctx)}
      <button class="btn btn-primary" type="submit">${L('contact_send')}</button>
      <p class="form-msg" data-msg hidden></p>
    </form>
  </div>
</section>
${chelmNotice(ctx)}`;
}

function terms(ctx, settings) {
  const pl = ctx.lang === 'pl';
  const seller = settings.legal_name || settings.shop_name;
  const nip = settings.nip ? (pl ? `, NIP ${settings.nip}` : `, tax ID (NIP) ${settings.nip}`) : '';
  const d = money(settings.delivery_grosze, ctx.lang);
  return `<section class="wrap sec narrow prose legal">
${pl ? `
<h1>Regulamin sklepu</h1>
<p class="muted">Obowiązuje od 1 września 2026 r.</p>
<h2>§1. Postanowienia ogólne</h2>
<p>1. Sklep internetowy Ride Lab (dalej „Sklep”) prowadzony jest przez ${esc(seller)}${esc(nip)}, z siedzibą: ${esc(settings.address)} (dalej „Sprzedawca”). Kontakt: ${esc(settings.email)}, tel. ${esc(settings.phone)}.</p>
<p>2. Regulamin określa zasady składania zamówień na produkty fizyczne — części do hulajnóg elektrycznych wytwarzane metodą druku 3D — oraz zasady ich odbioru, płatności, reklamacji i odstąpienia od umowy.</p>
<p>3. Do korzystania ze Sklepu nie jest wymagane założenie konta.</p>
<h2>§2. Zamówienia</h2>
<p>1. Zamówienie składa się, dodając produkty do koszyka, podając imię i nazwisko, numer telefonu (opcjonalnie e-mail), wybierając sposób odbioru i potwierdzając zamówienie.</p>
<p>2. Umowa sprzedaży zostaje zawarta z chwilą potwierdzenia zamówienia przez Sklep (wyświetlenie numeru zamówienia). Sprzedawca może skontaktować się z Klientem w celu potwierdzenia szczegółów.</p>
<p>3. Produkty są wytwarzane na zamówienie. Orientacyjny czas realizacji jest podany przy każdym produkcie; Sprzedawca informuje Klienta o gotowości produktu telefonicznie lub wiadomością.</p>
<h2>§3. Ceny i płatności</h2>
<p>1. Ceny podane są w złotych polskich (PLN) i zawierają podatek VAT. Cena wiążąca to cena z chwili złożenia zamówienia.</p>
<p>2. Dostępne formy płatności: (a) płatność online za pośrednictwem operatora Stripe (karta, BLIK, Apple Pay, Google Pay); (b) płatność gotówką lub BLIK-iem przy odbiorze.</p>
<p>3. Sprzedawca nie przechowuje danych kart płatniczych — płatności online obsługuje Stripe Payments Europe, Ltd.</p>
<h2>§4. Realizacja, odbiór i dostawa</h2>
<p>1. Sklep działa lokalnie na terenie miasta Chełm. Zamówienia można odebrać osobiście pod adresem ${esc(settings.address)} w godzinach: ${esc(settings.hours)}, albo skorzystać z dostawy na terenie Chełma w cenie ${d}.</p>
<p>2. Wysyłka kurierska poza Chełm nie jest obecnie oferowana.</p>
<h2>§5. Odstąpienie od umowy</h2>
<p>1. Konsument ma prawo odstąpić od umowy bez podania przyczyny w terminie 14 dni od dnia odbioru produktu, składając oświadczenie (e-mail lub pisemnie). Produkt należy zwrócić w stanie niezmienionym, w ciągu 14 dni od złożenia oświadczenia.</p>
<p>2. Zwrot płatności następuje w ciągu 14 dni od otrzymania oświadczenia, tą samą metodą, którą dokonano płatności, chyba że Konsument wyraźnie zgodzi się na inną.</p>
<p>3. Prawo odstąpienia nie przysługuje w przypadku produktów wykonanych według indywidualnej specyfikacji Konsumenta (np. części projektowane na zamówienie pod niestandardowy model), zgodnie z art. 38 pkt 3 ustawy o prawach konsumenta.</p>
<h2>§6. Reklamacje i gwarancja wymiany</h2>
<p>1. Sprzedawca odpowiada za zgodność produktu z umową na zasadach określonych w ustawie o prawach konsumenta. Reklamację można złożyć e-mailem lub osobiście; Sprzedawca rozpatruje ją w ciągu 14 dni.</p>
<p>2. Niezależnie od uprawnień ustawowych Sprzedawca oferuje 30-dniową gwarancję wymiany: jeśli produkt pęknie w ciągu 30 dni od odbioru podczas normalnego użytkowania, Sprzedawca nieodpłatnie wykona nową sztukę.</p>
<h2>§7. Dane osobowe</h2>
<p>Administratorem danych osobowych jest Sprzedawca. Zasady przetwarzania danych opisuje <a href="${url('pl', 'privacy')}">Polityka prywatności</a>.</p>
<h2>§8. Postanowienia końcowe</h2>
<p>1. W sprawach nieuregulowanych stosuje się przepisy prawa polskiego, w szczególności Kodeksu cywilnego i ustawy o prawach konsumenta.</p>
<p>2. Konsument może skorzystać z pozasądowych sposobów rozpatrywania reklamacji, m.in. platformy ODR: <a href="https://ec.europa.eu/consumers/odr" rel="noopener" target="_blank">ec.europa.eu/consumers/odr</a>.</p>
<p>3. Sprzedawca może zmienić Regulamin; zamówienia złożone przed zmianą realizowane są na dotychczasowych zasadach.</p>
` : `
<h1>Terms of Sale</h1>
<p class="muted">Effective 1 September 2026. The Polish version (Regulamin) is the binding text.</p>
<h2>1. General</h2>
<p>The Ride Lab shop is operated by ${esc(seller)}${esc(nip)}, ${esc(settings.address)} (the "Seller"). Contact: ${esc(settings.email)}, tel. ${esc(settings.phone)}. These terms cover orders for physical 3D-printed electric-scooter parts, their pickup, payment, complaints and withdrawal. No account is required.</p>
<h2>2. Orders</h2>
<p>An order is placed by adding products to the cart, providing your name and phone (e-mail optional), choosing pickup or delivery, and confirming. The contract is concluded when the shop displays an order number. Products are made to order; the indicative lead time is shown on each product and we notify you by phone or message when it is ready.</p>
<h2>3. Prices and payment</h2>
<p>Prices are in Polish złoty (PLN) and include VAT. Payment: (a) online via Stripe (card, BLIK, Apple Pay, Google Pay); (b) cash or BLIK at pickup. We never store card details — online payments are processed by Stripe Payments Europe, Ltd.</p>
<h2>4. Pickup and delivery</h2>
<p>We operate locally in Chełm. Orders can be collected at ${esc(settings.address)} (${esc(settings.hours)}) or delivered within Chełm for ${d}. Courier shipping outside Chełm is not currently offered.</p>
<h2>5. Right of withdrawal</h2>
<p>Consumers may withdraw from the contract without giving a reason within 14 days of receiving the product by sending a statement (e-mail or in writing), and must return the product unchanged within 14 days of that statement. Refunds are made within 14 days using the original payment method. The right of withdrawal does not apply to products made to the consumer's individual specification (Art. 38(3) of the Polish Consumer Rights Act).</p>
<h2>6. Complaints and replacement guarantee</h2>
<p>The Seller is liable for conformity of the product under the Polish Consumer Rights Act; complaints are handled within 14 days. Additionally, if a product cracks within 30 days of pickup during normal use, the Seller prints a replacement free of charge.</p>
<h2>7. Personal data</h2>
<p>The Seller is the data controller. See the <a href="${url('en', 'privacy')}">Privacy Policy</a>.</p>
<h2>8. Final provisions</h2>
<p>Polish law applies. Consumers may use the EU ODR platform: <a href="https://ec.europa.eu/consumers/odr" rel="noopener" target="_blank">ec.europa.eu/consumers/odr</a>.</p>
`}
</section>`;
}

function privacy(ctx, settings) {
  const pl = ctx.lang === 'pl';
  const seller = settings.legal_name || settings.shop_name;
  return `<section class="wrap sec narrow prose legal">
${pl ? `
<h1>Polityka prywatności</h1>
<h2>1. Administrator danych</h2>
<p>Administratorem danych osobowych jest ${esc(seller)}, ${esc(settings.address)}, e-mail: ${esc(settings.email)}.</p>
<h2>2. Jakie dane zbieramy i po co</h2>
<ul>
<li><strong>Zamówienia:</strong> imię i nazwisko, telefon, e-mail (opcjonalnie), adres dostawy (jeśli wybrano dostawę), treść uwag. Cel: realizacja umowy sprzedaży (art. 6 ust. 1 lit. b RODO), obowiązki księgowe (lit. c), dochodzenie roszczeń (lit. f). Okres: 5 lat od końca roku podatkowego.</li>
<li><strong>Zapytania i kontakt:</strong> podane dane kontaktowe i treść wiadomości. Cel: odpowiedź na zapytanie (lit. f). Okres: do 12 miesięcy.</li>
<li><strong>Płatności online:</strong> obsługuje Stripe Payments Europe, Ltd. (Irlandia) jako niezależny administrator — nie otrzymujemy danych karty. Polityka Stripe: stripe.com/privacy.</li>
<li><strong>Statystyki odwiedzin:</strong> zapisujemy adres strony, język, stronę odsyłającą oraz skrót (hash) adresu IP i przeglądarki — bez identyfikacji osoby. Cel: statystyka ruchu (lit. f). Okres: 90 dni.</li>
</ul>
<h2>3. Pliki cookie i pamięć przeglądarki</h2>
<p>Sklep nie używa cookies marketingowych ani śledzących. Używamy wyłącznie: pamięci przeglądarki (localStorage) do przechowywania zawartości koszyka i wybranego języka oraz cookie sesji dla panelu administracyjnego. Nie wymagają one zgody.</p>
<h2>4. Odbiorcy danych</h2>
<p>Hosting: Railway Corp. (serwery w UE — region EU West). Płatności: Stripe. Dane nie są sprzedawane ani przekazywane innym podmiotom.</p>
<h2>5. Twoje prawa</h2>
<p>Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia, sprzeciwu oraz skargi do Prezesa UODO. Kontakt: ${esc(settings.email)}.</p>
` : `
<h1>Privacy Policy</h1>
<h2>1. Data controller</h2>
<p>${esc(seller)}, ${esc(settings.address)}, e-mail: ${esc(settings.email)}.</p>
<h2>2. What we collect and why</h2>
<ul>
<li><strong>Orders:</strong> name, phone, e-mail (optional), delivery address (if chosen), notes. Purpose: performing the sales contract (Art. 6(1)(b) GDPR), accounting obligations (c), legal claims (f). Retention: 5 years from the end of the tax year.</li>
<li><strong>Requests and contact:</strong> the contact details and message you provide. Purpose: replying (f). Retention: up to 12 months.</li>
<li><strong>Online payments:</strong> processed by Stripe Payments Europe, Ltd. (Ireland) as an independent controller — we never receive card data. See stripe.com/privacy.</li>
<li><strong>Visit statistics:</strong> page path, language, referrer and a hash of IP + browser — no personal identification. Purpose: traffic statistics (f). Retention: 90 days.</li>
</ul>
<h2>3. Cookies and browser storage</h2>
<p>No marketing or tracking cookies. We only use browser storage (localStorage) for your cart and language, and a session cookie for the admin panel. These do not require consent.</p>
<h2>4. Recipients</h2>
<p>Hosting: Railway Corp. (EU servers — EU West region). Payments: Stripe. Data is not sold or shared with other parties.</p>
<h2>5. Your rights</h2>
<p>Access, rectification, erasure, restriction, portability, objection, and the right to lodge a complaint with the Polish supervisory authority (UODO). Contact: ${esc(settings.email)}.</p>
`}
</section>`;
}

module.exports = { home, shop, product, cart, orderPage, about, contact, faqPage, terms, privacy, productCard, name };
