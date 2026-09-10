(function () {
  'use strict';
  var lang = document.body.getAttribute('data-lang') || 'pl';
  var CART_KEY = 'rl_cart';

  // ---------- cart storage ----------
  function readCart() { try { var c = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); return Array.isArray(c) ? c : []; } catch (e) { return []; } }
  function writeCart(c) { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) { /* private mode */ } updateCount(c); }
  function updateCount(c) {
    c = c || readCart();
    var n = c.reduce(function (s, i) { return s + (i.qty || 0); }, 0);
    document.querySelectorAll('[data-cart-count]').forEach(function (el) { el.textContent = n; el.hidden = n === 0; });
  }
  function addToCart(id, qty) {
    var c = readCart(); var it = c.find(function (i) { return i.id === id; });
    if (it) it.qty = Math.min(20, it.qty + qty); else c.push({ id: id, qty: qty });
    writeCart(c);
  }
  function money(g) { var s = (g / 100).toFixed(2); return lang === 'pl' ? s.replace('.', ',') + ' zł' : s + ' zł'; }
  updateCount();

  document.addEventListener('click', function (e) {
    var add = e.target.closest('[data-add]'); var buy = e.target.closest('[data-buy]');
    if (add) {
      addToCart(parseInt(add.getAttribute('data-add'), 10), 1);
      var old = add.innerHTML; add.textContent = add.getAttribute('data-added') || (lang === 'pl' ? 'Dodano ✓' : 'Added ✓'); add.disabled = true;
      setTimeout(function () { add.innerHTML = old; add.disabled = false; }, 1200);
    }
    if (buy) {
      addToCart(parseInt(buy.getAttribute('data-buy'), 10), 1);
      location.href = '/' + lang + '/' + (lang === 'pl' ? 'koszyk' : 'cart');
    }
  });

  // ---------- proof-of-work bot check ----------
  function sha256hex(str) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }
  function leadingZeroBits(hex) { var n = 0; for (var i = 0; i < hex.length; i++) { var v = parseInt(hex[i], 16); if (v === 0) { n += 4; continue; } n += Math.clz32(v) - 28; break; } return n; }
  function solve(ch) {
    var counter = 0;
    function step() {
      var batch = [];
      for (var k = 0; k < 64; k++) batch.push((function (c) { return sha256hex(ch.nonce + ':' + c).then(function (h) { return { c: c, h: h }; }); })(counter++));
      return Promise.all(batch).then(function (rs) {
        for (var i = 0; i < rs.length; i++) if (leadingZeroBits(rs[i].h) >= ch.bits) return rs[i].c;
        if (counter > 5e6) throw new Error('give up');
        return step();
      });
    }
    return step();
  }
  document.querySelectorAll('[data-botbox]').forEach(function (box) {
    var cb = box.querySelector('[data-bot-check]'); var txt = box.querySelector('[data-bot-text]'); var hidden = box.querySelector('[data-human]');
    var label = txt.textContent;
    cb.addEventListener('change', function () {
      if (!cb.checked || box.classList.contains('ok')) return;
      box.classList.add('checking'); box.classList.remove('err'); txt.textContent = txt.getAttribute('data-checking');
      fetch('/api/challenge').then(function (r) { return r.json(); }).then(function (ch) {
        return solve(ch).then(function (counter) {
          return fetch('/api/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nonce: ch.nonce, ts: ch.ts, sig: ch.sig, counter: counter }) });
        });
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.token) throw new Error('no token');
        hidden.value = j.token; box.classList.remove('checking'); box.classList.add('ok'); txt.textContent = txt.getAttribute('data-ok');
        setTimeout(function () { box.classList.remove('ok'); hidden.value = ''; cb.checked = false; txt.textContent = label; }, 9 * 60 * 1000);
      }).catch(function () { box.classList.remove('checking'); box.classList.add('err'); cb.checked = false; txt.textContent = label; });
    });
  });
  function humanToken(form) {
    var cf = form.querySelector('[name="cf-turnstile-response"]'); if (cf) return cf.value;
    var h = form.querySelector('[data-human]'); return h ? h.value : '';
  }
  function showMsg(form, text, cls) { var m = form.querySelector('[data-msg]'); if (!m) return; m.textContent = text; m.className = 'form-msg ' + (cls || ''); m.hidden = false; }
  var MSG = {
    pl: { human: 'Zaznacz „Nie jestem robotem”.', fields: 'Uzupełnij wymagane pola.', generic: 'Coś poszło nie tak. Spróbuj ponownie.', rate: 'Za dużo prób. Odczekaj chwilę.' },
    en: { human: 'Please tick "I\'m not a robot".', fields: 'Please fill in the required fields.', generic: 'Something went wrong. Please try again.', rate: 'Too many attempts. Please wait a moment.' }
  }[lang];

  // ---------- request / contact forms ----------
  function wireSimpleForm(form, kind) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var token = humanToken(form);
      if (!token) return showMsg(form, MSG.human, 'err');
      var data = { kind: kind, lang: lang, human: token };
      form.querySelectorAll('input[name],textarea[name]').forEach(function (i) { data[i.name] = i.value; });
      var btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
      fetch('/api/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); })
        .then(function (x) {
          if (x.s === 200) { showMsg(form, form.getAttribute('data-ok'), 'ok'); form.querySelectorAll('input:not([type=hidden]):not([type=checkbox]),textarea').forEach(function (i) { i.value = ''; }); }
          else showMsg(form, x.s === 429 ? MSG.rate : (x.j.error === 'human' ? MSG.human : x.j.error === 'fields' ? MSG.fields : MSG.generic), 'err');
        }).catch(function () { showMsg(form, MSG.generic, 'err'); }).then(function () { btn.disabled = false; });
    });
  }
  document.querySelectorAll('[data-request-form]').forEach(function (f) { wireSimpleForm(f, 'part'); });
  document.querySelectorAll('[data-contact-form]').forEach(function (f) { wireSimpleForm(f, 'contact'); });

  // ---------- hero slides ----------
  var slides = document.querySelector('[data-slides]');
  if (slides) {
    var items = slides.querySelectorAll('[data-slide]'); var dots = slides.querySelectorAll('[data-dot]'); var cur = 0; var timer;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hTitle = document.querySelector('[data-hero-title]'); var hSub = document.querySelector('[data-hero-sub]');
    var defTitle = hTitle ? hTitle.getAttribute('data-default') : ''; var defSub = hSub ? hSub.getAttribute('data-default') : '';
    function show(i) {
      items[cur].classList.remove('on'); if (dots[cur]) dots[cur].setAttribute('aria-selected', 'false');
      cur = (i + items.length) % items.length; items[cur].classList.add('on'); if (dots[cur]) dots[cur].setAttribute('aria-selected', 'true');
      var t = items[cur].getAttribute('data-title'); var s = items[cur].getAttribute('data-sub');
      if (hTitle) hTitle.textContent = t || defTitle; if (hSub) hSub.textContent = s || defSub;
    }
    function start() { if (items.length > 1 && !reduce) timer = setInterval(function () { show(cur + 1); }, 6000); }
    dots.forEach(function (d) { d.addEventListener('click', function () { clearInterval(timer); show(parseInt(d.getAttribute('data-dot'), 10)); start(); }); });
    start();
  }

  // ---------- product gallery & tabs ----------
  var gal = document.querySelector('[data-gallery]');
  if (gal) {
    var main = gal.querySelector('[data-gallery-main]'); var thumbs = Array.prototype.slice.call(gal.querySelectorAll('[data-thumb]')); var gi = 0;
    function go(i) { if (!thumbs.length) return; gi = (i + thumbs.length) % thumbs.length; main.src = thumbs[gi].getAttribute('data-thumb'); thumbs.forEach(function (t, k) { t.classList.toggle('on', k === gi); }); }
    thumbs.forEach(function (t, i) { t.addEventListener('click', function () { go(i); }); });
    var prev = gal.querySelector('[data-gprev]'); var next = gal.querySelector('[data-gnext]');
    if (prev) prev.addEventListener('click', function () { go(gi - 1); });
    if (next) next.addEventListener('click', function () { go(gi + 1); });
    var x0 = null;
    main.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    main.addEventListener('touchend', function (e) { if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(gi + (dx < 0 ? 1 : -1)); x0 = null; });
  }
  var tabs = document.querySelector('[data-tabs]');
  if (tabs) {
    tabs.querySelectorAll('[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () {
        tabs.querySelectorAll('[data-tab]').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
        tabs.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== b.getAttribute('data-tab'); });
      });
    });
  }

  // ---------- cart page ----------
  var cartPage = document.querySelector('[data-cart-page]');
  if (cartPage) {
    var itemsEl = cartPage.querySelector('[data-cart-items]'); var emptyEl = cartPage.querySelector('[data-cart-empty]'); var side = cartPage.querySelector('[data-cart-side]');
    var form = cartPage.querySelector('[data-checkout-form]'); var deliveryG = parseInt(cartPage.getAttribute('data-delivery-grosze'), 10) || 0;
    var products = {};
    var addrLabel = form.querySelector('[data-address]');
    function deliveryMethod() { var r = form.querySelector('input[name="delivery_method"]:checked'); return r ? r.value : 'pickup'; }
    form.querySelectorAll('input[name="delivery_method"]').forEach(function (r) { r.addEventListener('change', function () { addrLabel.hidden = deliveryMethod() !== 'delivery'; addrLabel.querySelector('input').required = !addrLabel.hidden; renderTotals(); }); });
    function renderTotals() {
      var c = readCart(); var sub = 0;
      c.forEach(function (i) { var p = products[i.id]; if (p) sub += p.price_grosze * i.qty; });
      var d = deliveryMethod() === 'delivery' ? deliveryG : 0;
      cartPage.querySelector('[data-subtotal]').textContent = money(sub);
      cartPage.querySelector('[data-delivery]').textContent = money(d);
      cartPage.querySelector('[data-total]').textContent = money(sub + d);
    }
    function render() {
      var c = readCart().filter(function (i) { return products[i.id] && products[i.id].active; });
      writeCart(c);
      if (!c.length) { itemsEl.innerHTML = ''; emptyEl.hidden = false; side.hidden = true; return; }
      emptyEl.hidden = true; side.hidden = false;
      itemsEl.innerHTML = c.map(function (i) {
        var p = products[i.id]; var nm = (lang === 'en' && p.name_en) ? p.name_en : p.name_pl;
        var sub = p.stock >= i.qty ? (lang === 'pl' ? 'W magazynie' : 'In stock') : (lang === 'pl' ? 'Na zamówienie · ' + p.lead_days + ' dni' : 'Made to order · ' + p.lead_days + ' days');
        return '<div class="ci" data-id="' + p.id + '">' +
          (p.cover ? '<img src="/img/' + p.cover + '" alt="">' : '<div></div>') +
          '<div><div class="ci-name">' + esc(nm) + '</div><div class="ci-sub">' + sub + ' · ' + money(p.price_grosze) + '</div></div>' +
          '<div class="ci-right"><div class="qty"><button type="button" data-dec aria-label="-">−</button><span>' + i.qty + '</span><button type="button" data-inc aria-label="+">+</button></div>' +
          '<div class="ci-price">' + money(p.price_grosze * i.qty) + '</div><button type="button" class="rm" data-rm>' + (lang === 'pl' ? 'usuń' : 'remove') + '</button></div></div>';
      }).join('');
      renderTotals();
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    itemsEl.addEventListener('click', function (e) {
      var row = e.target.closest('.ci'); if (!row) return; var id = parseInt(row.getAttribute('data-id'), 10);
      var c = readCart(); var it = c.find(function (i) { return i.id === id; }); if (!it) return;
      if (e.target.closest('[data-inc]')) it.qty = Math.min(20, it.qty + 1);
      if (e.target.closest('[data-dec]')) it.qty = Math.max(1, it.qty - 1);
      if (e.target.closest('[data-rm]')) c = c.filter(function (i) { return i.id !== id; });
      writeCart(c); render();
    });
    var ids = readCart().map(function (i) { return i.id; });
    if (ids.length) {
      fetch('/api/cart?ids=' + ids.join(',')).then(function (r) { return r.json(); }).then(function (j) { j.items.forEach(function (p) { products[p.id] = p; }); render(); }).catch(function () { render(); });
    } else render();

    var payMode = 'pickup';
    form.querySelectorAll('[data-pay]').forEach(function (b) { b.addEventListener('click', function () { payMode = b.getAttribute('data-pay'); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var token = humanToken(form); if (!token) return showMsg(form, MSG.human, 'err');
      var c = readCart(); if (!c.length) return;
      var data = { lang: lang, human: token, payment: payMode, items: c };
      form.querySelectorAll('input[name],textarea[name]').forEach(function (i) { if (i.type === 'radio') { if (i.checked) data[i.name] = i.value; } else data[i.name] = i.value; });
      form.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
      fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); })
        .then(function (x) {
          if (x.s === 200 && x.j.redirect) { writeCart([]); location.href = x.j.redirect; return; }
          showMsg(form, x.s === 429 ? MSG.rate : (x.j.error === 'human' ? MSG.human : x.j.error === 'fields' ? MSG.fields : MSG.generic), 'err');
          form.querySelectorAll('button').forEach(function (b) { b.disabled = false; });
        }).catch(function () { showMsg(form, MSG.generic, 'err'); form.querySelectorAll('button').forEach(function (b) { b.disabled = false; }); });
    });
  }
})();
