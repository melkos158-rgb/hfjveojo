'use strict';
const { esc, money, fmtDate, fmtDay } = require('../util');

function layout(a, o) {
  const P = a.adminPath;
  const nav = [
    ['', 'Dashboard'], ['/products', 'Produkty'], ['/orders', 'Zamówienia'], ['/slides', 'Strona główna'], ['/requests', 'Zapytania'], ['/settings', 'Ustawienia'],
  ];
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)} · Ride Lab panel</title><meta name="robots" content="noindex, nofollow">
<link rel="icon" href="/static/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/static/admin.css?v=3"></head>
<body class="admin">
${o.bare ? '' : `<header class="a-top"><a class="mark" href="${P}">RIDE<em>LAB</em> <small>panel</small></a>
<nav>${nav.map(([h, l]) => `<a href="${P}${h}"${o.section === (h || '/') ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
<div class="a-top-right"><a href="/pl/" target="_blank" rel="noopener">Sklep ↗</a><form method="post" action="${P}/logout"><input type="hidden" name="_csrf" value="${esc(a.csrf || '')}"><button class="link" type="submit">Wyloguj</button></form></div></header>`}
<main class="a-main">${o.flash ? `<div class="flash ${o.flash.type || 'ok'}">${esc(o.flash.text)}</div>` : ''}${o.body}</main>
<script src="/static/admin.js?v=3" defer></script></body></html>`;
}

const csrf = (a) => `<input type="hidden" name="_csrf" value="${esc(a.csrf)}">`;

function setup(a, { error, tokenRequired }) {
  return layout(a, { title: 'Ustaw hasło', bare: true, body: `<div class="auth"><h1>Pierwsze uruchomienie</h1>
<p>Ustaw hasło administratora. ${tokenRequired ? 'Token jednorazowy znajdziesz w logach serwera (Railway → Deploy Logs, linia <code>ADMIN SETUP TOKEN</code>).' : ''}</p>
${error ? `<p class="err">${esc(error)}</p>` : ''}
<form method="post" action="${a.adminPath}/setup">
${tokenRequired ? '<label>Token z logów<input name="token" required autocomplete="off"></label>' : ''}
<label>Nowe hasło (min. 10 znaków)<input name="password" type="password" required minlength="10" autocomplete="new-password"></label>
<label>Powtórz hasło<input name="password2" type="password" required minlength="10" autocomplete="new-password"></label>
<button class="btn" type="submit">Zapisz i zaloguj</button></form></div>` });
}

function login(a, { error }) {
  return layout(a, { title: 'Logowanie', bare: true, body: `<div class="auth"><h1>Panel Ride Lab</h1>
${error ? `<p class="err">${esc(error)}</p>` : ''}
<form method="post" action="${a.adminPath}/login">
<label>Hasło<input name="password" type="password" required autocomplete="current-password" autofocus></label>
<button class="btn" type="submit">Zaloguj</button></form></div>` });
}

// ---------- charts ----------
function barChart(series, { label, fmt = (v) => v, height = 160 }) {
  // series: [{day, value}] — two-tone bars, one scale, labels every other day
  const w = 640, padL = 62, padB = 26, padT = 10;
  const max = Math.max(1, ...series.map((s) => s.value));
  const nice = niceMax(max);
  const bw = (w - padL - 8) / series.length;
  const y = (v) => padT + (height - padT - padB) * (1 - v / nice);
  const ticks = [0, nice / 2, nice];
  return `<svg class="chart" viewBox="0 0 ${w} ${height}" role="img" aria-label="${esc(label)}">
  ${ticks.map((tv) => `<line x1="${padL}" x2="${w - 4}" y1="${y(tv)}" y2="${y(tv)}" class="grid"/><text x="${padL - 6}" y="${y(tv) + 4}" class="tick" text-anchor="end">${esc(fmt(tv))}</text>`).join('')}
  ${series.map((s, i) => { const x = padL + i * bw + bw * 0.15; const h = Math.max(0, y(0) - y(s.value)); return `<rect x="${x.toFixed(1)}" y="${y(s.value).toFixed(1)}" width="${(bw * 0.7).toFixed(1)}" height="${h.toFixed(1)}" rx="2" class="bar${i === series.length - 1 ? ' last' : ''}"><title>${esc(fmtDay(s.day, 'pl'))}: ${esc(fmt(s.value))}</title></rect>${i % 2 === series.length % 2 ? `<text x="${(x + bw * 0.35).toFixed(1)}" y="${height - 8}" class="tick" text-anchor="middle">${esc(fmtDay(s.day, 'pl'))}</text>` : ''}`; }).join('')}
</svg>`;
}
function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; const n = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10; return n * p; }

const STATUS = { new: ['Nowe', 'st-new'], paid: ['Opłacone', 'st-paid'], fulfilled: ['Wydane', 'st-done'], cancelled: ['Anulowane', 'st-cancel'] };
const stPill = (s) => { const [l, c] = STATUS[s] || [s, '']; return `<span class="pill ${c}">${l}</span>`; };

function dashboard(a, s) {
  const tile = (v, l, sub) => `<div class="tile"><div class="tile-v">${v}</div><div class="tile-l">${l}</div>${sub ? `<div class="tile-s">${sub}</div>` : ''}</div>`;
  return layout(a, { title: 'Dashboard', section: '/', body: `
<h1>Dashboard</h1>
<div class="tiles">
  ${tile(s.today.orders, 'Zamówienia dziś', money(s.today.revenue, 'pl'))}
  ${tile(money(s.week.revenue, 'pl'), 'Przychód 7 dni', s.week.orders + ' zam.')}
  ${tile(money(s.month.revenue, 'pl'), 'Przychód 30 dni', s.month.orders + ' zam.')}
  ${tile(s.today.views, 'Odsłony dziś', s.today.visitors + ' odwiedzających')}
  ${tile(s.conversion + '%', 'Konwersja 30 dni', 'zamówienia ÷ odwiedzający')}
  ${tile(s.pendingOrders, 'Do realizacji', 'nowe + opłacone')}
</div>
<div class="two">
  <section class="panel"><h2>Zamówienia i przychód — 14 dni</h2>${barChart(s.ordersSeries, { label: 'Przychód dzienny', fmt: (v) => Math.round(v / 100) + ' zł' })}<p class="muted">Słupki = przychód (zł). Łącznie ${s.series14.orders} zamówień.</p></section>
  <section class="panel"><h2>Odsłony — 14 dni (bez botów)</h2>${barChart(s.viewsSeries, { label: 'Odsłony dzienne' })}<p class="muted">Boty i crawlery (Google itd.) w tym okresie: ${s.series14.bots}.</p></section>
</div>
<div class="two">
  <section class="panel"><h2>Ostatnie zamówienia</h2>
    ${s.recentOrders.length ? `<table class="tbl"><thead><tr><th>Nr</th><th>Klient</th><th>Kwota</th><th>Status</th><th>Data</th></tr></thead><tbody>
    ${s.recentOrders.map((o) => `<tr><td><a href="${a.adminPath}/orders/${o.id}">${esc(o.number)}</a></td><td>${esc(o.customer_name)}</td><td>${money(o.total_grosze, 'pl')}</td><td>${stPill(o.status)}</td><td class="muted">${esc(fmtDate(o.created_at, 'pl'))}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Jeszcze nic. Pierwsze zamówienie pojawi się tutaj.</p>'}
  </section>
  <section class="panel"><h2>Najlepiej sprzedające się</h2>
    ${s.topProducts.length ? `<table class="tbl"><thead><tr><th>Produkt</th><th>Szt.</th><th>Przychód</th></tr></thead><tbody>${s.topProducts.map((p) => `<tr><td>${esc(p.name)}</td><td>${p.qty}</td><td>${money(p.revenue, 'pl')}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Brak sprzedaży w ostatnich 30 dniach.</p>'}
    <h2 style="margin-top:22px">Najczęściej odwiedzane (30 dni)</h2>
    <table class="tbl"><tbody>${s.topPages.map((p) => `<tr><td><code>${esc(p.path)}</code></td><td>${p.n}</td></tr>`).join('') || '<tr><td class="muted">Brak danych</td></tr>'}</tbody></table>
    <h2 style="margin-top:22px">Źródła ruchu (30 dni)</h2>
    <table class="tbl"><tbody>${s.topRefs.map((r) => `<tr><td>${esc(r.ref_host || 'bezpośrednio / brak')}</td><td>${r.n}</td></tr>`).join('') || '<tr><td class="muted">Brak danych</td></tr>'}</tbody></table>
  </section>
</div>
${s.newRequests ? `<p class="flash ok">Masz ${s.newRequests} nowych zapytań o części. <a href="${a.adminPath}/requests">Zobacz →</a></p>` : ''}
${!s.stripe ? `<p class="flash warn">Stripe nie jest skonfigurowany — klienci mogą zamawiać tylko z płatnością przy odbiorze. Dodaj zmienną <code>STRIPE_SECRET_KEY</code> w Railway, żeby włączyć płatności online.</p>` : ''}
` });
}

function productsList(a, { products }) {
  return layout(a, { title: 'Produkty', section: '/products', body: `
<div class="head-row"><h1>Produkty <span class="muted">(${products.length})</span></h1><a class="btn" href="${a.adminPath}/products/new">+ Nowy produkt</a></div>
<table class="tbl products">
<thead><tr><th></th><th>Nazwa</th><th>Cena</th><th>Stan</th><th>Sprzedano</th><th>Aktywny</th><th></th></tr></thead>
<tbody>${products.map((p) => `<tr class="${p.active ? '' : 'off'}">
<td>${p.cover ? `<img class="thumb" src="/img/${p.cover}" alt="">` : '<span class="thumb none"></span>'}</td>
<td><a href="${a.adminPath}/products/${p.id}"><b>${esc(p.name_pl)}</b></a><br><span class="muted">${esc(p.name_en)}</span><br><code class="muted">/${esc(p.slug)}</code></td>
<td>${money(p.price_grosze, 'pl')}</td>
<td class="${p.stock === 0 ? 'warn-t' : ''}">${p.stock} szt · ${p.lead_days} dni</td>
<td>${p.sold_count}</td>
<td><form method="post" action="${a.adminPath}/products/${p.id}/toggle">${csrf(a)}<button class="toggle ${p.active ? 'on' : ''}" type="submit" aria-label="Aktywny">${p.active ? 'TAK' : 'NIE'}</button></form></td>
<td class="actions"><a href="${a.adminPath}/products/${p.id}">Edytuj</a>
<form method="post" action="${a.adminPath}/products/${p.id}/duplicate">${csrf(a)}<button class="link" type="submit">Duplikuj</button></form>
<form method="post" action="${a.adminPath}/products/${p.id}/delete" data-confirm="Usunąć „${esc(p.name_pl)}”? Tej operacji nie da się cofnąć.">${csrf(a)}<button class="link danger" type="submit">Usuń</button></form></td>
</tr>`).join('') || '<tr><td colspan="7" class="muted">Brak produktów. Dodaj pierwszy.</td></tr>'}</tbody></table>` });
}

function productForm(a, { p, isNew, error }) {
  const P = a.adminPath; const v = (k) => esc(p[k] == null ? '' : p[k]);
  const zl = (g) => g == null ? '' : (g / 100).toFixed(2).replace('.', ',');
  const ta = (k, label, rows = 6) => `<label>${label}<textarea name="${k}" rows="${rows}">${v(k)}</textarea></label>`;
  return layout(a, { title: isNew ? 'Nowy produkt' : p.name_pl, section: '/products', body: `
<div class="head-row"><h1>${isNew ? 'Nowy produkt' : esc(p.name_pl)}</h1>${!isNew ? `<a class="btn ghost" href="/pl/produkt/${esc(p.slug)}" target="_blank" rel="noopener">Podgląd w sklepie ↗</a>` : ''}</div>
${error ? `<p class="err">${esc(error)}</p>` : ''}
<form method="post" action="${P}/products/${isNew ? 'new' : p.id}" class="pform" enctype="multipart/form-data" data-product-form>
${csrf(a)}
<div class="two-col">
<section class="panel">
  <h2>Podstawowe</h2>
  <div class="row2"><label>Nazwa (PL) *<input name="name_pl" required value="${v('name_pl')}"></label><label>Name (EN)<input name="name_en" value="${v('name_en')}"></label></div>
  <div class="row2"><label>Podtytuł (PL)<input name="tagline_pl" value="${v('tagline_pl')}" placeholder="np. Mocniejszy. Czystszy."></label><label>Tagline (EN)<input name="tagline_en" value="${v('tagline_en')}"></label></div>
  <label>Adres URL (slug)<input name="slug" value="${v('slug')}" placeholder="auto z nazwy EN/PL" pattern="[a-z0-9-]*"></label>
  <div class="row3">
    <label>Cena (zł) *<input name="price" required inputmode="decimal" value="${zl(p.price_grosze)}"></label>
    <label>Stara cena (zł)<input name="compare" inputmode="decimal" value="${zl(p.compare_grosze)}" placeholder="przekreślona"></label>
    <label>Stan magazynowy<input name="stock" type="number" min="0" value="${p.stock == null ? 0 : p.stock}"></label>
  </div>
  <div class="row3">
    <label>Czas realizacji (dni)<input name="lead_days" type="number" min="0" value="${p.lead_days == null ? 2 : p.lead_days}"></label>
    <label>Waga (g)<input name="weight_g" type="number" min="0" value="${v('weight_g')}"></label>
    <label class="check"><input type="checkbox" name="active" ${p.active !== false ? 'checked' : ''}> Widoczny w sklepie</label>
  </div>
  <h2>Specyfikacja</h2>
  <label>Pasuje do (modele, po przecinku)<input name="fits" value="${esc((p.fits || []).join(', '))}" placeholder="Kukirin G4 2025, Kukirin G4"></label>
  <div class="row2"><label>Materiał<input name="material" value="${v('material')}" placeholder="PETG"></label><label>Kolor<input name="color" value="${v('color')}" placeholder="Czarny mat"></label></div>
</section>
<section class="panel">
  <h2>Zdjęcia</h2>
  <p class="muted">Pierwsze zdjęcie = okładka. Przeciągnij, żeby zmienić kolejność. Zdjęcia są zmniejszane w przeglądarce do 1600 px.</p>
  <div class="photos" data-photos>${(p.images || []).map((id) => `<div class="photo" draggable="true" data-image="${id}"><img src="/img/${id}" alt=""><button type="button" class="x" data-remove-image aria-label="Usuń">×</button><input type="hidden" name="image_order[]" value="${id}"></div>`).join('')}</div>
  <input type="hidden" name="remove_images" data-remove-list value="">
  <label class="upload"><input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple data-photo-input><span>+ Dodaj zdjęcia</span></label>
  <div class="photo-preview" data-photo-preview></div>
</section>
</div>
<div class="two-col">
<section class="panel"><h2>Treść — polski</h2>
  ${ta('desc_pl', 'Opis (PL) — akapity, „- ” dla listy, **pogrubienie**', 9)}
  ${ta('install_pl', 'Montaż (PL)', 6)}
  ${ta('print_pl', 'Druk i materiał (PL)', 5)}
</section>
<section class="panel"><h2>Content — English <span class="muted">(puste = pokaże się PL)</span></h2>
  ${ta('desc_en', 'Description (EN)', 9)}
  ${ta('install_en', 'Installation (EN)', 6)}
  ${ta('print_en', 'Print & material (EN)', 5)}
</section>
</div>
<div class="sticky-save"><button class="btn" type="submit">${isNew ? 'Utwórz produkt' : 'Zapisz zmiany'}</button><a class="btn ghost" href="${P}/products">Anuluj</a></div>
</form>` });
}

function ordersList(a, { orders, filter }) {
  const P = a.adminPath;
  const tabs = [['', 'Wszystkie'], ['new', 'Nowe'], ['paid', 'Opłacone'], ['fulfilled', 'Wydane'], ['cancelled', 'Anulowane']];
  return layout(a, { title: 'Zamówienia', section: '/orders', body: `
<h1>Zamówienia</h1>
<div class="tabs">${tabs.map(([k, l]) => `<a href="${P}/orders${k ? '?status=' + k : ''}"${(filter || '') === k ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</div>
<table class="tbl"><thead><tr><th>Nr</th><th>Klient</th><th>Pozycje</th><th>Odbiór</th><th>Kwota</th><th>Płatność</th><th>Status</th><th>Data</th></tr></thead>
<tbody>${orders.map((o) => `<tr><td><a href="${P}/orders/${o.id}"><b>${esc(o.number)}</b></a></td><td>${esc(o.customer_name)}<br><span class="muted">${esc(o.phone)}</span></td>
<td>${(o.items || []).map((i) => `${esc(i.name_pl)} × ${i.qty}`).join('<br>')}</td><td>${o.delivery_method === 'delivery' ? 'Dostawa' : 'Odbiór'}</td>
<td>${money(o.total_grosze, 'pl')}</td><td>${o.payment === 'stripe' ? 'Stripe' : 'Przy odbiorze'}</td><td>${stPill(o.status)}</td><td class="muted">${esc(fmtDate(o.created_at, 'pl'))}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">Brak zamówień.</td></tr>'}</tbody></table>` });
}

function orderDetail(a, { o }) {
  const P = a.adminPath;
  const btn = (st, label, cls = '') => o.status === st ? '' : `<form method="post" action="${P}/orders/${o.id}/status">${csrf(a)}<input type="hidden" name="status" value="${st}"><button class="btn ${cls}" type="submit">${label}</button></form>`;
  return layout(a, { title: o.number, section: '/orders', body: `
<div class="head-row"><h1>${esc(o.number)} ${stPill(o.status)}</h1><a class="btn ghost" href="${P}/orders">← Zamówienia</a></div>
<div class="two-col">
<section class="panel"><h2>Klient</h2>
<dl class="dl"><dt>Imię</dt><dd>${esc(o.customer_name)}</dd><dt>Telefon</dt><dd><a href="tel:${esc(o.phone)}">${esc(o.phone)}</a></dd><dt>E-mail</dt><dd>${esc(o.email || '—')}</dd>
<dt>Odbiór</dt><dd>${o.delivery_method === 'delivery' ? 'Dostawa: ' + esc(o.address) : 'Odbiór osobisty'}</dd><dt>Uwagi</dt><dd>${esc(o.note || '—')}</dd>
<dt>Płatność</dt><dd>${o.payment === 'stripe' ? 'Stripe online' + (o.paid_at ? ' — opłacone ' + esc(fmtDate(o.paid_at, 'pl')) : ' — <b class="warn-t">nieopłacone</b>') : 'Przy odbiorze'}</dd>
<dt>Język</dt><dd>${o.lang}</dd><dt>Złożone</dt><dd>${esc(fmtDate(o.created_at, 'pl'))}</dd></dl>
</section>
<section class="panel"><h2>Pozycje</h2>
<table class="tbl"><tbody>${(o.items || []).map((i) => `<tr><td>${esc(i.name_pl)}</td><td>× ${i.qty}</td><td>${money(i.price_grosze * i.qty, 'pl')}</td></tr>`).join('')}
<tr><td>Dostawa</td><td></td><td>${money(o.delivery_grosze, 'pl')}</td></tr><tr class="total"><td><b>Razem</b></td><td></td><td><b>${money(o.total_grosze, 'pl')}</b></td></tr></tbody></table>
<h2 style="margin-top:20px">Zmień status</h2>
<div class="btn-row">${btn('paid', 'Opłacone')}${btn('fulfilled', 'Wydane klientowi')}${btn('new', 'Nowe', 'ghost')}${btn('cancelled', 'Anuluj', 'ghost danger')}</div>
<form method="post" action="${P}/orders/${o.id}/note" class="form-inline">${csrf(a)}<label>Notatka wewnętrzna<textarea name="admin_note" rows="3">${esc(o.admin_note || '')}</textarea></label><button class="btn ghost" type="submit">Zapisz notatkę</button></form>
</section></div>` });
}

function slides(a, { slides }) {
  const P = a.adminPath;
  return layout(a, { title: 'Strona główna', section: '/slides', body: `
<h1>Zdjęcia na stronie głównej</h1>
<p class="muted">Zmieniają się automatycznie co 6 sekund. Kolejność — strzałkami. Tytuł i podtytuł są opcjonalne (nadpisują tekst nad zdjęciem).</p>
<div class="slides">${slides.map((s, i) => `<div class="slide-row ${s.active ? '' : 'off'}">
<img src="/img/${s.image_id}" alt="">
<form method="post" action="${P}/slides/${s.id}" class="slide-form">${csrf(a)}
<div class="row2"><label>Tytuł PL<input name="title_pl" value="${esc(s.title_pl)}"></label><label>Title EN<input name="title_en" value="${esc(s.title_en)}"></label></div>
<div class="row2"><label>Podtytuł PL<input name="sub_pl" value="${esc(s.sub_pl)}"></label><label>Subtitle EN<input name="sub_en" value="${esc(s.sub_en)}"></label></div>
<div class="btn-row"><label class="check"><input type="checkbox" name="active" ${s.active ? 'checked' : ''}> Aktywne</label><button class="btn ghost" type="submit">Zapisz</button></div>
</form>
<div class="slide-actions">
<form method="post" action="${P}/slides/${s.id}/move">${csrf(a)}<input type="hidden" name="dir" value="-1"><button class="link" ${i === 0 ? 'disabled' : ''} type="submit">↑</button></form>
<form method="post" action="${P}/slides/${s.id}/move">${csrf(a)}<input type="hidden" name="dir" value="1"><button class="link" ${i === slides.length - 1 ? 'disabled' : ''} type="submit">↓</button></form>
<form method="post" action="${P}/slides/${s.id}/delete" data-confirm="Usunąć to zdjęcie?">${csrf(a)}<button class="link danger" type="submit">Usuń</button></form>
</div></div>`).join('') || '<p class="muted">Brak zdjęć — pokazuje się grafika domyślna.</p>'}</div>
<section class="panel"><h2>Dodaj zdjęcia</h2>
<form method="post" action="${P}/slides/new" enctype="multipart/form-data" data-slide-form>${csrf(a)}
<label class="upload"><input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple required data-photo-input><span>+ Wybierz zdjęcia (najlepiej poziome, 16:9)</span></label>
<div class="photo-preview" data-photo-preview></div>
<button class="btn" type="submit">Dodaj</button></form></section>` });
}

function requests(a, { requests }) {
  const P = a.adminPath;
  return layout(a, { title: 'Zapytania', section: '/requests', body: `
<h1>Zapytania o części i kontakt</h1>
<p class="muted">To, o co pytają ludzie w Chełmie. Jeśli ten sam model pojawia się kilka razy — warto zrobić do niego część.</p>
<table class="tbl"><thead><tr><th>Data</th><th>Typ</th><th>Model / imię</th><th>Część</th><th>Kontakt</th><th>Wiadomość</th><th>Status</th></tr></thead>
<tbody>${requests.map((r) => `<tr class="${r.status === 'done' ? 'off' : ''}"><td class="muted">${esc(fmtDate(r.created_at, 'pl'))}</td><td>${r.kind === 'contact' ? 'Kontakt' : 'Część'}</td><td><b>${esc(r.scooter_model)}</b></td><td>${esc(r.part)}</td><td>${esc(r.contact)}</td><td class="wrap-t">${esc(r.message)}</td>
<td><form method="post" action="${P}/requests/${r.id}/status">${csrf(a)}<input type="hidden" name="status" value="${r.status === 'done' ? 'new' : 'done'}"><button class="link" type="submit">${r.status === 'done' ? 'Odpowiedziano ✓' : 'Oznacz jako odpowiedziane'}</button></form></td></tr>`).join('') || '<tr><td colspan="7" class="muted">Brak zapytań.</td></tr>'}</tbody></table>` });
}

function settings(a, { s, stripe, error, saved }) {
  const P = a.adminPath; const v = (k) => esc(s[k] || '');
  return layout(a, { title: 'Ustawienia', section: '/settings', flash: saved ? { text: 'Zapisano.' } : null, body: `
<h1>Ustawienia</h1>
${error ? `<p class="err">${esc(error)}</p>` : ''}
<form method="post" action="${P}/settings" class="pform">${csrf(a)}
<div class="two-col">
<section class="panel"><h2>Sklep i kontakt</h2>
<label>Nazwa sklepu<input name="shop_name" value="${v('shop_name')}"></label>
<label>Adres odbioru (Chełm)<input name="address" value="${v('address')}" placeholder="ul. Przykładowa 1, 22-100 Chełm"></label>
<label>Godziny odbioru<input name="hours" value="${v('hours')}"></label>
<div class="row2"><label>Telefon<input name="phone" value="${v('phone')}"></label><label>WhatsApp (sam numer, np. 48600000000)<input name="whatsapp" value="${v('whatsapp')}"></label></div>
<div class="row2"><label>E-mail<input name="email" type="email" value="${v('email')}"></label><label>Instagram (nazwa)<input name="instagram" value="${v('instagram')}"></label></div>
<label>Adres strony (SITE_URL, do sitemap i linków)<input name="site_url" value="${v('site_url')}" placeholder="https://twojadomena.pl"></label>
</section>
<section class="panel"><h2>Sprzedaż</h2>
<div class="row2"><label>Dostawa po Chełmie (zł)<input name="delivery" inputmode="decimal" value="${((Number(s.delivery_grosze) || 0) / 100).toFixed(2).replace('.', ',')}"></label><label>Domyślny czas realizacji (dni)<input name="default_lead_days" type="number" min="0" value="${v('default_lead_days')}"></label></div>
<h2>Dane do Regulaminu</h2>
<label>Pełna nazwa sprzedawcy (firma / imię i nazwisko)<input name="legal_name" value="${v('legal_name')}"></label>
<label>NIP<input name="nip" value="${v('nip')}"></label>
<h2>Płatności</h2>
<p>Stripe: ${stripe ? '<span class="pill st-paid">skonfigurowany</span>' : '<span class="pill st-new">brak klucza</span> — dodaj <code>STRIPE_SECRET_KEY</code> w Railway → Variables.'}</p>
<h2>Powiadomienia Telegram (opcjonalnie)</h2>
<p class="muted">Bot wyśle wiadomość przy każdym nowym zamówieniu i zapytaniu. Token bota z @BotFather, chat ID z @userinfobot.</p>
<div class="row2"><label>Token bota<input name="telegram_token" value="${v('telegram_token')}" autocomplete="off"></label><label>Chat ID<input name="telegram_chat" value="${v('telegram_chat')}"></label></div>
</section></div>
<div class="sticky-save"><button class="btn" type="submit">Zapisz ustawienia</button></div>
</form>
<section class="panel" style="max-width:520px"><h2>Zmiana hasła</h2>
<form method="post" action="${P}/password">${csrf(a)}
<label>Obecne hasło<input name="current" type="password" required autocomplete="current-password"></label>
<label>Nowe hasło (min. 10 znaków)<input name="password" type="password" required minlength="10" autocomplete="new-password"></label>
<button class="btn ghost" type="submit">Zmień hasło</button></form></section>` });
}

module.exports = { setup, login, dashboard, productsList, productForm, ordersList, orderDetail, slides, requests, settings };
