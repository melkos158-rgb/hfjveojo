'use strict';

const LANGS = ['pl', 'en'];

// Path segments per language. Product/order routes take a param.
const PATHS = {
  pl: { home: '', shop: 'sklep', product: 'produkt', cart: 'koszyk', order: 'zamowienie', about: 'o-nas', contact: 'kontakt', faq: 'faq', terms: 'regulamin', privacy: 'polityka-prywatnosci' },
  en: { home: '', shop: 'shop', product: 'product', cart: 'cart', order: 'order', about: 'about', contact: 'contact', faq: 'faq', terms: 'terms', privacy: 'privacy' },
};

function url(lang, key, param) {
  const seg = PATHS[lang][key];
  let u = `/${lang}/` + (seg ? seg : '');
  if (param) u += '/' + encodeURIComponent(param);
  return u;
}

// Map a path segment back to a page key for the other language.
function keyForSegment(lang, seg) {
  const p = PATHS[lang];
  for (const k of Object.keys(p)) if (p[k] === seg) return k;
  return null;
}

const T = {
  pl: {
    lang_name: 'Polski', other_lang: 'English', html_lang: 'pl',
    brand_tag: 'Gotowe części 3D do hulajnóg · Chełm',
    nav_shop: 'Sklep', nav_about: 'O nas', nav_contact: 'Kontakt', nav_cart: 'Koszyk',
    search_ph: 'Szukaj: nazwa lub model hulajnogi',
    hero_title: 'Gotowe części 3D do Twojej hulajnogi',
    hero_sub: 'Drukujemy w Chełmie. Błotniki, mocowania, osłony — dopasowane do modelu, gotowe do montażu.',
    hero_cta: 'Zobacz sklep', hero_cta2: 'Nie ma Twojego modelu?',
    chelm_notice: 'Działamy w Chełmie: odbiór osobisty lub dostawa po mieście. Wysyłka po Polsce — wkrótce.',
    how_title: 'Jak to działa',
    how: [
      ['Wybierz część', 'Znajdź część do swojego modelu i zamów online — bez rejestracji.'],
      ['Drukujemy', 'Każdą sztukę drukujemy na zamówienie z PETG lub ASA. Zwykle 1–3 dni.'],
      ['Odbierz w Chełmie', 'Odbiór osobisty albo dostawa pod drzwi. Płatność online lub przy odbiorze.'],
    ],
    products_title: 'Części w sprzedaży', products_all: 'Wszystkie części',
    why_title: 'Dlaczego Ride Lab',
    why: [
      ['Dopasowane do modelu', 'Każda część jest mierzona na konkretnym modelu hulajnogi — bez zgadywania.'],
      ['Materiał na pogodę', 'PETG i ASA: odporne na wodę, sól i słońce. Nie kruszą się zimą.'],
      ['Wymiana, jeśli pęknie', 'Pękło w 30 dni normalnej jazdy? Drukujemy nową sztukę bez pytań.'],
      ['Lokalnie, bez wysyłki', 'Jesteśmy w Chełmie. Odbierasz osobiście albo dowozimy po mieście.'],
    ],
    req_title: 'Nie ma części do Twojej hulajnogi?',
    req_sub: 'Napisz, jaki masz model i czego potrzebujesz. Jeśli da się to wydrukować — zaprojektujemy i wycenimy. Bezpłatnie.',
    req_model: 'Model hulajnogi', req_model_ph: 'np. Kukirin G4 2025',
    req_part: 'Jaka część?', req_part_ph: 'np. tylny błotnik, uchwyt na telefon',
    req_contact: 'Telefon lub e-mail', req_msg: 'Wiadomość (opcjonalnie)',
    req_send: 'Wyślij zapytanie', req_ok: 'Dzięki! Odezwiemy się w ciągu 24 godzin.',
    faq_title: 'Najczęstsze pytania',
    contact_title: 'Kontakt', contact_hours: 'Godziny odbioru', contact_pickup: 'Adres odbioru', contact_phone: 'Telefon', contact_email: 'E-mail', contact_wa: 'Napisz na WhatsApp', contact_map: 'Pokaż na mapie',
    contact_form_title: 'Napisz do nas', contact_name: 'Imię', contact_msg: 'Wiadomość', contact_send: 'Wyślij', contact_ok: 'Wysłano. Odpowiemy najszybciej jak się da.',
    shop_title: 'Wszystkie części', shop_sub: 'Gotowe do montażu. Drukowane na zamówienie w Chełmie.',
    sort_new: 'Najnowsze', sort_cheap: 'Cena: rosnąco', sort_exp: 'Cena: malejąco', search_btn: 'Szukaj',
    shop_empty: 'Nic nie znaleźliśmy. Zostaw zapytanie — może wydrukujemy to dla Ciebie.',
    fits: 'Pasuje do', in_stock: 'W magazynie', made_to_order: 'Na zamówienie · {n} dni', sold: 'Sprzedano {n}', add_cart: 'Do koszyka', added: 'Dodano',
    crumb_home: 'Strona główna',
    badge_print: 'Druk 3D', badge_install: 'Łatwy montaż', badge_durable: 'Wytrzymały',
    vat_incl: 'Cena zawiera VAT', buy_now: 'Kup teraz', add_to_cart: 'Dodaj do koszyka',
    trust_pickup: 'Odbiór w Chełmie', trust_pickup_sub: 'lub dostawa po mieście',
    trust_time: 'Gotowe w {n} dni', trust_time_sub: 'drukujemy na zamówienie',
    trust_pay: 'Bezpieczna płatność', trust_pay_sub: 'online (Stripe) lub przy odbiorze',
    spec_title: 'Specyfikacja', spec_material: 'Materiał', spec_color: 'Kolor', spec_finish: 'Wykończenie', spec_weight: 'Waga', spec_lead: 'Czas realizacji', spec_warranty: 'Gwarancja', warranty_val: '30 dni wymiany', days: 'dni', stock_left: 'Sztuk w magazynie',
    opt_material: 'Rodzaj plastiku', opt_color: 'Kolor', opt_finish: 'Wykończenie', opt_available: 'Dostępne', opt_choose_note: 'Wybierz opcje przy każdej części w koszyku.',
    tab_desc: 'Opis', tab_install: 'Montaż', tab_print: 'Druk i materiał',
    similar: 'Podobne części', view_more: 'Zobacz więcej', out_of_stock: 'Chwilowo niedostępne',
    cart_title: 'Koszyk', cart_empty: 'Twój koszyk jest pusty.', go_shop: 'Przejdź do sklepu',
    col_product: 'Produkt', col_qty: 'Ilość', col_price: 'Cena', remove: 'Usuń',
    subtotal: 'Suma częściowa', delivery: 'Dostawa', total: 'Razem',
    form_title: 'Dane do zamówienia', f_name: 'Imię i nazwisko', f_phone: 'Telefon', f_email: 'E-mail (opcjonalnie)',
    f_delivery: 'Sposób odbioru', d_pickup: 'Odbiór osobisty w Chełmie — 0 zł', d_delivery: 'Dostawa po Chełmie — {price}', f_address: 'Adres dostawy (Chełm)', f_note: 'Uwagi do zamówienia',
    map_pick: 'Wskaż miejsce dostawy na mapie', map_change: 'Zmień lokalizację', map_confirm: 'Potwierdź lokalizację', map_close: 'Zamknij',
    map_hint: 'Kliknij na mapie lub przeciągnij pinezkę. Dostawa tylko w granicach Chełma.', map_outside: 'Poza Chełmem — dostawa tylko w granicach miasta.',
    map_chosen: 'Wybrane miejsce', map_required: 'Wskaż miejsce dostawy na mapie.', map_details: 'Szczegóły (mieszkanie, piętro, uwagi dla kuriera)',
    pay_online: 'Zapłać online', pay_pickup: 'Zamów — zapłacę przy odbiorze', pay_online_hint: 'Karta, BLIK, Apple Pay, Google Pay — przez Stripe.', pay_pickup_hint: 'Gotówka lub BLIK przy odbiorze.',
    legal_ok: 'Składając zamówienie akceptujesz {terms} i {privacy}.', terms: 'Regulamin', privacy: 'Politykę prywatności',
    bot_label: 'Nie jestem robotem', bot_checking: 'Sprawdzam…', bot_ok: 'Potwierdzono', bot_required: 'Zaznacz „Nie jestem robotem”.',
    err_generic: 'Coś poszło nie tak. Spróbuj ponownie.', err_fields: 'Uzupełnij wymagane pola.', err_stock: 'Brak wystarczającej ilości: {name}.',
    order_thanks: 'Dziękujemy za zamówienie!', order_no: 'Numer zamówienia', order_next: 'Co dalej?',
    order_next_text: 'Zadzwonimy lub napiszemy, gdy część będzie gotowa. Zwykle zajmuje to {n} dni robocze.',
    order_pickup_at: 'Odbiór', order_delivery_to: 'Dostawa na adres', order_paid: 'Opłacone online', order_unpaid: 'Płatność przy odbiorze', order_items: 'Zamówione części',
    order_verifying: 'Potwierdzamy płatność…', order_not_found: 'Nie znaleźliśmy takiego zamówienia.',
    footer_legal: 'Dane sprzedawcy', footer_rights: 'Wszystkie prawa zastrzeżone.',
    about_title: 'O nas',
    seo_home_title: 'Ride Lab — gotowe części 3D do hulajnóg elektrycznych, Chełm',
    seo_home_desc: 'Błotniki, mocowania i osłony do hulajnóg elektrycznych, drukowane w 3D w Chełmie. Dopasowane do modelu, gotowe do montażu. Odbiór osobisty lub dostawa po Chełmie.',
    seo_shop_title: 'Sklep — części 3D do hulajnóg | Ride Lab Chełm',
    seo_shop_desc: 'Wszystkie gotowe części 3D do hulajnóg elektrycznych. Drukowane na zamówienie w Chełmie, odbiór osobisty lub dostawa.',
    seo_product_suffix: ' — część 3D do hulajnogi | Ride Lab Chełm',
    hero_dots: 'Zdjęcie {n}',
    lang_switch: 'English', skip: 'Przejdź do treści',
  },
  en: {
    lang_name: 'English', other_lang: 'Polski', html_lang: 'en',
    brand_tag: 'Ready-made 3D-printed scooter parts · Chełm',
    nav_shop: 'Shop', nav_about: 'About', nav_contact: 'Contact', nav_cart: 'Cart',
    search_ph: 'Search: part name or scooter model',
    hero_title: 'Ready-made 3D-printed parts for your e-scooter',
    hero_sub: 'Printed in Chełm. Fenders, mounts, covers — fitted to your model, ready to bolt on.',
    hero_cta: 'See the shop', hero_cta2: "Don't see your model?",
    chelm_notice: "We're in Chełm: local pickup or delivery within the city. Shipping across Poland — coming soon.",
    how_title: 'How it works',
    how: [
      ['Pick a part', 'Find the part for your model and order online — no account needed.'],
      ['We print it', 'Every piece is printed to order in PETG or ASA. Usually 1–3 days.'],
      ['Pick up in Chełm', 'Collect it yourself or get it delivered in town. Pay online or at pickup.'],
    ],
    products_title: 'Parts for sale', products_all: 'All parts',
    why_title: 'Why Ride Lab',
    why: [
      ['Fitted to your model', 'Every part is measured on the actual scooter model — no guesswork.'],
      ['Weatherproof material', 'PETG and ASA: resistant to water, road salt and sun. No winter cracking.'],
      ['Replaced if it breaks', 'Cracked within 30 days of normal riding? We print a new one, no questions.'],
      ['Local, no shipping', "We're in Chełm. Pick it up yourself or we deliver in town."],
    ],
    req_title: "Don't see a part for your scooter?",
    req_sub: "Tell us your model and what you need. If it can be printed, we'll design and quote it. Free.",
    req_model: 'Scooter model', req_model_ph: 'e.g. Kukirin G4 2025',
    req_part: 'Which part?', req_part_ph: 'e.g. rear fender, phone mount',
    req_contact: 'Phone or e-mail', req_msg: 'Message (optional)',
    req_send: 'Send request', req_ok: "Thanks! We'll get back to you within 24 hours.",
    faq_title: 'Frequently asked questions',
    contact_title: 'Contact', contact_hours: 'Pickup hours', contact_pickup: 'Pickup address', contact_phone: 'Phone', contact_email: 'E-mail', contact_wa: 'Message on WhatsApp', contact_map: 'Show on map',
    contact_form_title: 'Write to us', contact_name: 'Name', contact_msg: 'Message', contact_send: 'Send', contact_ok: "Sent. We'll reply as soon as we can.",
    shop_title: 'All parts', shop_sub: 'Ready to install. Printed to order in Chełm.',
    sort_new: 'Newest', sort_cheap: 'Price: low to high', sort_exp: 'Price: high to low', search_btn: 'Search',
    shop_empty: "Nothing found. Leave a request — we might print it for you.",
    fits: 'Fits', in_stock: 'In stock', made_to_order: 'Made to order · {n} days', sold: '{n} sold', add_cart: 'Add to cart', added: 'Added',
    crumb_home: 'Home',
    badge_print: '3D printed', badge_install: 'Easy install', badge_durable: 'Durable',
    vat_incl: 'VAT included', buy_now: 'Buy now', add_to_cart: 'Add to cart',
    trust_pickup: 'Pickup in Chełm', trust_pickup_sub: 'or delivery in town',
    trust_time: 'Ready in {n} days', trust_time_sub: 'printed to order',
    trust_pay: 'Secure payment', trust_pay_sub: 'online (Stripe) or at pickup',
    spec_title: 'Specification', spec_material: 'Material', spec_color: 'Colour', spec_finish: 'Finish', spec_weight: 'Weight', spec_lead: 'Lead time', spec_warranty: 'Warranty', warranty_val: '30-day replacement', days: 'days', stock_left: 'Units in stock',
    opt_material: 'Plastic type', opt_color: 'Colour', opt_finish: 'Finish', opt_available: 'Available', opt_choose_note: 'Pick options for each part in the cart.',
    tab_desc: 'Description', tab_install: 'Installation', tab_print: 'Print & material',
    similar: 'Similar parts', view_more: 'View more', out_of_stock: 'Temporarily unavailable',
    cart_title: 'Cart', cart_empty: 'Your cart is empty.', go_shop: 'Go to the shop',
    col_product: 'Product', col_qty: 'Qty', col_price: 'Price', remove: 'Remove',
    subtotal: 'Subtotal', delivery: 'Delivery', total: 'Total',
    form_title: 'Order details', f_name: 'Full name', f_phone: 'Phone', f_email: 'E-mail (optional)',
    f_delivery: 'How to get it', d_pickup: 'Pickup in Chełm — 0 zł', d_delivery: 'Delivery in Chełm — {price}', f_address: 'Delivery address (Chełm)', f_note: 'Order notes',
    map_pick: 'Set delivery location on the map', map_change: 'Change location', map_confirm: 'Confirm location', map_close: 'Close',
    map_hint: 'Click the map or drag the pin. Delivery within Chełm only.', map_outside: 'Outside Chełm — delivery within the city only.',
    map_chosen: 'Chosen location', map_required: 'Please set the delivery location on the map.', map_details: 'Details (apartment, floor, notes for courier)',
    pay_online: 'Pay online', pay_pickup: 'Order — pay at pickup', pay_online_hint: 'Card, BLIK, Apple Pay, Google Pay — via Stripe.', pay_pickup_hint: 'Cash or BLIK when you collect.',
    legal_ok: 'By placing an order you accept the {terms} and {privacy}.', terms: 'Terms', privacy: 'Privacy Policy',
    bot_label: "I'm not a robot", bot_checking: 'Checking…', bot_ok: 'Verified', bot_required: 'Please tick "I\'m not a robot".',
    err_generic: 'Something went wrong. Please try again.', err_fields: 'Please fill in the required fields.', err_stock: 'Not enough stock: {name}.',
    order_thanks: 'Thank you for your order!', order_no: 'Order number', order_next: 'What happens next?',
    order_next_text: "We'll call or message you when the part is ready. Usually {n} business days.",
    order_pickup_at: 'Pickup', order_delivery_to: 'Delivery to', order_paid: 'Paid online', order_unpaid: 'Pay at pickup', order_items: 'Ordered parts',
    order_verifying: 'Confirming payment…', order_not_found: "We couldn't find that order.",
    footer_legal: 'Seller details', footer_rights: 'All rights reserved.',
    about_title: 'About us',
    seo_home_title: 'Ride Lab — ready-made 3D-printed e-scooter parts, Chełm',
    seo_home_desc: 'Fenders, mounts and covers for electric scooters, 3D-printed in Chełm. Fitted to your model, ready to install. Local pickup or delivery in Chełm.',
    seo_shop_title: 'Shop — 3D-printed scooter parts | Ride Lab Chełm',
    seo_shop_desc: 'All ready-made 3D-printed parts for electric scooters. Printed to order in Chełm, local pickup or delivery.',
    seo_product_suffix: ' — 3D-printed scooter part | Ride Lab Chełm',
    hero_dots: 'Photo {n}',
    lang_switch: 'Polski', skip: 'Skip to content',
  },
};

function t(lang, key, vars) {
  let s = (T[lang] && T[lang][key]) != null ? T[lang][key] : (T.pl[key] != null ? T.pl[key] : key);
  if (vars && typeof s === 'string') for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}

module.exports = { LANGS, PATHS, url, keyForSegment, t, T };
