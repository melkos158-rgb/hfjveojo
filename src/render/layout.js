'use strict';
const { esc } = require('../util');
const { url, t } = require('../i18n');

const FONTS = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,500;0,600;0,700;1,800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap';

function icon(name) {
  const I = {
    cart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 2-1.5L21 8H7"/><circle cx="10" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg>',
    search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>',
    wa: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4.1c1.7.7 2.1.6 2.8.5a2.4 2.4 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c0-.1-.2-.2-.5-.3z"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    pin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    shield: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8.3-8 9-4.5-.7-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    print: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>',
    wrench: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0 5 5L13 18l-3-3 6.7-6.7z"/><path d="M3 21l7-7"/></svg>',
    bolt: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
    arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    heart: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7.2-4.5-9.2-8.6C1.1 7.8 3.2 4.5 6.6 4.5c2 0 3.5 1.1 4.4 2.4l1 1.4 1-1.4c.9-1.3 2.4-2.4 4.4-2.4 3.4 0 5.5 3.3 3.8 6.9C19.2 15.5 12 20 12 20z"/></svg>',
  };
  return I[name] || '';
}

function page(ctx, o) {
  const { lang, settings } = ctx;
  const L = (k, v) => t(lang, k, v);
  const site = (ctx.origin || settings.site_url || '').replace(/\/$/, '');
  const canonical = site + (o.canonicalPath || ctx.path);
  const alt = site + (o.altPath || ctx.altPath);
  const other = lang === 'pl' ? 'en' : 'pl';
  const ogImg = o.ogImage ? (o.ogImage.startsWith('http') ? o.ogImage : site + o.ogImage) : '';
  const wa = settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}` : '';
  const year = new Date().getFullYear();
  const jsonld = o.jsonld ? `<script type="application/ld+json">${JSON.stringify(o.jsonld).replace(/</g, '\\u003c')}</script>` : '';
  const legal = [settings.legal_name, settings.nip ? 'NIP ' + settings.nip : '', settings.address].filter(Boolean).join(' · ');

  return `<!doctype html>
<html lang="${L('html_lang')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc || '')}">
${o.noindex ? '<meta name="robots" content="noindex, nofollow">' : '<meta name="robots" content="index, follow">'}
${site ? `<link rel="canonical" href="${esc(canonical)}">
<link rel="alternate" hreflang="${lang}" href="${esc(canonical)}">
<link rel="alternate" hreflang="${other}" href="${esc(alt)}">
<link rel="alternate" hreflang="x-default" href="${esc(site + (lang === 'pl' ? (o.canonicalPath || ctx.path) : (o.altPath || ctx.altPath)))}">` : ''}
<meta property="og:type" content="${o.ogType || 'website'}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc || '')}">
<meta property="og:site_name" content="${esc(settings.shop_name)}">
<meta property="og:locale" content="${lang === 'pl' ? 'pl_PL' : 'en_GB'}">
${ogImg ? `<meta property="og:image" content="${esc(ogImg)}"><meta name="twitter:card" content="summary_large_image">` : ''}
<meta name="theme-color" content="#0B0B0C">
<link rel="icon" href="/static/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="/static/site.css?v=3">
${jsonld}
</head>
<body data-lang="${lang}"${o.bodyClass ? ` class="${o.bodyClass}"` : ''}>
<a class="skip" href="#main">${L('skip')}</a>
<header class="nav">
  <div class="wrap nav-in">
    <a href="${url(lang, 'home')}" class="mark" aria-label="${esc(settings.shop_name)}">RIDE<em>LAB</em><small>${esc(L('brand_tag'))}</small></a>
    <nav class="nav-links" aria-label="Menu">
      <a href="${url(lang, 'shop')}"${ctx.key === 'shop' ? ' aria-current="page"' : ''}>${L('nav_shop')}</a>
      <a href="${url(lang, 'about')}"${ctx.key === 'about' ? ' aria-current="page"' : ''}>${L('nav_about')}</a>
      <a href="${url(lang, 'contact')}"${ctx.key === 'contact' ? ' aria-current="page"' : ''}>${L('nav_contact')}</a>
    </nav>
    <form class="nav-search" action="${url(lang, 'shop')}" method="get" role="search">
      ${icon('search')}<input type="search" name="q" placeholder="${esc(L('search_ph'))}" value="${esc(ctx.q || '')}" aria-label="${esc(L('search_ph'))}">
    </form>
    <div class="nav-right">
      <a class="lang" href="${esc(ctx.altPath)}" hreflang="${other}" lang="${other}">${L('lang_switch')}</a>
      <a class="cart-btn" href="${url(lang, 'cart')}" aria-label="${L('nav_cart')}">${icon('cart')}<span class="cart-count" data-cart-count hidden>0</span></a>
    </div>
  </div>
</header>
<main id="main">
${o.body}
</main>
<footer class="foot">
  <div class="wrap foot-in">
    <div class="foot-brand">
      <span class="mark">RIDE<em>LAB</em></span>
      <p>${esc(L('brand_tag'))}</p>
      ${legal ? `<p class="foot-legal">${esc(legal)}</p>` : ''}
    </div>
    <div class="foot-col">
      <a href="${url(lang, 'shop')}">${L('nav_shop')}</a>
      <a href="${url(lang, 'about')}">${L('nav_about')}</a>
      <a href="${url(lang, 'faq')}">FAQ</a>
      <a href="${url(lang, 'contact')}">${L('nav_contact')}</a>
    </div>
    <div class="foot-col">
      <a href="${url(lang, 'terms')}">${L('terms')}</a>
      <a href="${url(lang, 'privacy')}">${lang === 'pl' ? 'Polityka prywatności' : 'Privacy Policy'}</a>
      ${settings.phone ? `<a href="tel:${esc(settings.phone.replace(/\s/g, ''))}">${esc(settings.phone)}</a>` : ''}
      ${wa ? `<a href="${wa}" rel="noopener" target="_blank" class="wa-link">${icon('wa')} WhatsApp</a>` : ''}
      ${settings.instagram ? `<a href="https://instagram.com/${esc(settings.instagram.replace('@', ''))}" rel="noopener" target="_blank">Instagram</a>` : ''}
    </div>
  </div>
  <div class="wrap foot-bottom"><span>© ${year} ${esc(settings.shop_name)} · Chełm. ${L('footer_rights')}</span></div>
</footer>
${wa ? `<a class="wa-float" href="${wa}" rel="noopener" target="_blank" aria-label="WhatsApp">${icon('wa')}</a>` : ''}
<script src="/static/site.js?v=3" defer></script>
${o.extraScripts || ''}
</body>
</html>`;
}

module.exports = { page, icon };
