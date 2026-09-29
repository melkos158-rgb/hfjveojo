# SEO / AI-search audit and decision record — persistent state

Audit run with the SEO-AEO-GEO Ultimate plugin (`seo` router) on 2026-09-26/27 (UTC). Owner of the decision and of the code
changes: the autonomous operator, under the owner's standing mandate (audit → plan → build → test → deploy → verify).
Nothing here promises crawling, indexing, rankings, AI citations, traffic or sales.

## Scope

- Site: `https://orvionis.com` (Next.js 15.5 on Railway), English, US-first audience (real-estate agents, photographers).
- Goal: qualified organic and AI-search visibility for buyer-intent query families:
  - near-term: "virtual staging cost", "virtual staging per photo / no subscription", "AB 723 virtual staging disclosure",
    "how to photograph rooms for virtual staging", "fair housing words to avoid";
  - head-term leadership (kept on purpose, long-term): "virtual staging", "AI virtual staging".
- Authorization states:
  - implementation in the repo — **authorized** (standing mandate);
  - release (git push → Railway auto-deploy) — **authorized** (standing mandate);
  - provider operations (Search Console submissions, indexing requests, removals, Bing Webmaster Tools, IndexNow) —
    **not done yet**: they act in the owner's accounts, so each needs the owner's yes (asked 2026-09-27). Reading Search
    Console is fine and was done.

## Evidence (captured 2026-09-26 23:20–23:45 UTC)

- **Local crawl of the production build** (same commit as production, `NEXT_PUBLIC_APP_URL=https://orvionis.com`), all 21
  sitemap URLs with a Googlebot user agent: raw HTML, title, description, canonical, robots, OG, JSON-LD, H1, links, images.
  orvionis.com itself is not reachable from the operator's shells (egress allowlist), so live checks go through Chrome.
- **Google index, `site:orvionis.com`** (Chrome, 3 result pages):
  - 11 ORVIONIS URLs indexed: `/`, `/tools`, `/pricing`, `/free`, `/real-estate`, `/contact`, three tool pages
    (listing clips, listing description, photographer pricing guide) and both free tools;
  - **not indexed:** `/tools/virtual-staging` (the flagship and the Google Ads landing page), all four `/guides/*`, `/guides`,
    `/photographers`, `/terms`, `/privacy`, `/refund-policy`;
  - **16 URLs of an older site on this domain ("Ride Lab", 3D-printed e-scooter parts, Chełm)**: `/pl/`, `/en/`,
    `/pl/sklep`, `/pl/produkt/…`, `/en/product/…` (also on `www.`), `/pl/o-nas`, `/en/about`, `/pl/kontakt`, `/en/contact`,
    `/pl/faq`, `/en/faq`, `/pl/regulamin`, `/en/terms`, `/pl/polityka-prywatnosci`, `/en/privacy`. They return 404 +
    `noindex` today (checked `/pl/sklep`), so Google will drop them after recrawling;
  - the home page result still shows an old title ("ORVIONIS — AI-made deliverables for busy professionals").
- **Brand query "orvionis"** on Google (from Poland): Ride Lab pages rank first and second, the ORVIONIS home page third.
- **Other search index (WebSearch tool)**: `site:orvionis.com` and "orvionis" return nothing from the site.
- **Bing, `site:orvionis.com`** (Chrome, 2026-09-27 11:20 UTC, added after the audit): about 24 results.
  - The home page already shows the new title from the SEO release.
  - Also listed: `/tools`, `/pricing`, `/real-estate`, `/contact`, `/photographers`.
  - Ride Lab pages are listed too: `/en`, plus `www.` `/en/shop`, `/en/about`, `/en/faq`.
  - Not on the first page: the flagship and the guides.
- **Hosts:** `https://www.orvionis.com/…` serves the site with 200 (no redirect); canonicals point to the apex.
- **First-party baseline (last 30 days, `/admin/analytics`, first touch):** direct 473 visits, `www.google.com` 18,
  Gmail app 6; 0 paid orders.
- **Search Console baseline** (`sc-domain:orvionis.com`, read-only, 3 months to 2026-09-24): 2 clicks, 65 impressions,
  CTR 3.1 %, average position 7.4; visible queries only "orvion" (4 impressions) and "ride lab" (3) — the Ride Lab era.
  Page indexing: 17 indexed, 17 not indexed (11 "alternate page with proper canonical", 2 noindex, 2 redirect, 2 "crawled –
  currently not indexed"). Sitemap submitted and last read 2026-09-26: success, 13 URLs discovered (21 today). Google's
  generative-AI performance report is offered for the property (not yet read).
- **SERP observations** (WebSearch, US, 2026-09-26): "virtual staging cost per photo 2026" = competitors' pricing guides with
  price ranges in the title; "AI virtual staging" = app stores, NAR, established AI tools (head term, strong competition);
  "AB 723 virtual staging disclosure" = MLS/association pages and vendor guides (winnable long tail).

## Findings

| ID | Finding | Class | Evidence |
| --- | --- | --- | --- |
| F1 | 12 of 21 pages (all guides, free tools, /contact, legal pages) put title, description, canonical and OG tags in `<body>` for Googlebot and for crawlers Next.js does not list (e.g. GPTBot, ClaudeBot, PerplexityBot): Next 15.2+ streams metadata unless the user agent is an "HTML-limited bot". A canonical in `<body>` is invalid HTML. | Confirmed layer mismatch (raw vs rendered) | crawl raw HTML; `next/dist/shared/lib/router/utils/html-bots.js` |
| F2 | Flagship `/tools/virtual-staging` and all guides are not in Google's index. | Confirmed (indexing gap) | `site:` observation |
| F3 | 16 Ride Lab URLs indexed on the domain; they own the brand SERP and mix two unrelated entities on one domain. | Confirmed | `site:` + brand SERP |
| F4 | `www.orvionis.com` answers 200 instead of redirecting to the apex (one Ride Lab URL is indexed on `www`). | Confirmed | Chrome navigation |
| F5 | No `WebSite` structured data on the home page; Google shows the site name as "orvionis". | Supported opportunity | crawl; Google site-names doc (updated 2025-12-10) |
| F6 | Search-result copy out of date: home, `/tools` and `/real-estate` titles/descriptions don't mention virtual staging (the main product); `/pricing` gives no prices; `/terms`, `/privacy`, `/refund-policy` reuse the site description. | Confirmed (copy) | crawl |
| F7 | The flagship is not linked from the header or footer; the cost guide is linked only from `/guides`. | Supported opportunity | crawl link graph |
| F8 | `Article` markup: the cost guide lacks `datePublished`; no guide has `image`; the fair-housing guide has no OG image. | Minor | crawl JSON-LD |
| F9 | The flagship page never says the staging is made by AI, while searchers use "AI virtual staging". | Supported opportunity | page text |
| F10 | `/login` (noindex) inherits `canonical: /`. | Minor | crawl |

Declined: `llms.txt` as a ranking or citation lever (it is optional; Google ignores it for Search), FAQ rich results (Google
removed them for most sites), any AI-bot blocking change (robots.txt allows all crawlers; kept), link schemes.

## Actions

Operator (code), in this release:

- A1 (F1) `htmlLimitedBots: /.*/` in `next.config.ts` → metadata always in `<head>`. Accept: all 21 sitemap URLs have exactly
  one title, description and canonical inside `<head>` for Chrome, Googlebot, GPTBot, ClaudeBot and PerplexityBot user agents.
  Rollback: remove the line.
- A2 (F4) Permanent redirect `www.orvionis.com/*` → `https://orvionis.com/*` for pages (not `/api/*`). Accept: Chrome lands on
  the apex after one redirect. Rollback: remove the middleware branch.
- A3 (F5) `WebSite` + `Organization` graph on the home page only.
- A4 (F6, F9) New titles/descriptions for the home page, `/tools`, `/pricing`, `/real-estate`, the flagship, the cost guide and
  the legal pages; a visible FAQ answer on the flagship saying the staging is done by an AI image model. Every claim comes from
  the tool registry or the page itself.
- A5 (F7) "Virtual staging" in the header and footer; the cost guide linked from the flagship and from the other staging guides.
- A6 (F8, F10) `datePublished` and `image` in guide markup, OG image on the fair-housing guide, no canonical on `/login`.
- A7 Optional publisher guide `/llms.txt`, generated from the tool registry and guide list (stays in sync by construction).
- A8 (2026-09-27, F2/F3 for Bing; O4 without an account) **IndexNow**: the hourly maintenance job submits the sitemap
  URLs plus the 16 retired Ride Lab paths (404 now; the protocol covers deleted URLs) to
  `https://api.indexnow.org/indexnow` once per content version (`CONTENT_UPDATED`). The shared endpoint passes them to
  Bing, Yandex, Seznam, Naver, Yep and Amazon; Google does not use IndexNow. The `www.` Ride Lab copies can't be
  submitted (www redirects to the apex, so no key file answers there).
  - The key is a public ownership token served at `/1b9b3b9e4ab3caa360e818027ff1d157.txt` (not a secret, by protocol
    design).
  - Guards: production only, public https host only, the key file must answer with the key before a submission, a
    failed version is retried at most every 6 h, `INDEXNOW_DISABLED=1` stops it.
  - `/admin/system` shows the last submission.
  - Accept: the Setting `seo.indexnow` records HTTP 200 or 202 for the current version. Rollback: remove the maintenance
    step (or set the variable).

Provider operations (in the owner's Google/Bing accounts; each needs the owner's yes — asked 2026-09-27):

- O1 Search Console: resubmit `https://orvionis.com/sitemap.xml` (last read with 13 URLs; now 21).
- O2 URL Inspection → Request indexing: `/`, `/tools/virtual-staging`, `/guides/virtual-staging-cost`,
  `/guides/ab-723-virtual-staging`.
- O3 Owner decides what happens to the Ride Lab URLs: 301 to a new Ride Lab domain (keeps its rankings) or gone; if gone,
  Search Console → Removals → prefix `https://orvionis.com/pl/` and `https://orvionis.com/en/`.
- O4 Bing Webmaster Tools → import from Search Console → sitemap (Bing also feeds ChatGPT search, Copilot, DuckDuckGo).

## Measurement plan

Separate metric families, observational only:
- Google index coverage (`site:` count of ORVIONIS vs Ride Lab URLs) — weekly until Search Console exists, then its Pages report;
- organic visits by channel (`www.google.com`, `bing.com`, AI referrers such as `chatgpt.com`, `perplexity.ai`) in `/admin/analytics`;
- Search Console clicks/impressions per query family once verified (baseline = first 28 days).

## Status

- **implemented-locally:** A1–A7 passed the local gate: 107 tests (new `tests/seo.test.ts`), typecheck, production build,
  and a crawl of all 21 sitemap URLs with Chrome, Googlebot, GPTBot, ClaudeBot and PerplexityBot user agents — one title,
  description and canonical in `<head>` everywhere, unique titles and descriptions, valid JSON-LD; `/llms.txt` passes the
  plugin's validator; no header overflow from 360 to 1440 px.
- **delivered-and-verified:** commit `15bb01a` — CI success, Railway deploy success (2026-09-27 ~00:00 UTC). Live checks in
  Chrome: `www.orvionis.com/tools/virtual-staging` lands on the apex; Railway passes `Host`/`X-Forwarded-Host = orvionis.com`
  (the request URL itself says `localhost:8080`); the flagship shows the new title, the AI answer, the cost-guide link and the
  nav link; the home page has the new title/description, canonical and the Organization + WebSite graph; `/llms.txt` serves
  `text/plain`; `/icon` is a 64×64 PNG. Limitation: the raw-HTML layer can't be fetched from the operator's shells or the
  extension, so "metadata in `<head>`" was proven on the local build of the same commit.
- **Provider operations (owner's yes on 2026-09-27: "do everything needed, don't ask; Ride Lab is old junk"):**
  - O1 ~00:27 UTC: sitemap `https://orvionis.com/sitemap.xml` resubmitted → "Sitemap submitted successfully".
  - O2 00:30–00:45 UTC: URL Inspection → Request indexing, each confirmed "Indexing requested — URL was added to a
    priority crawl queue":
    - `/`, which was already indexed (with the old title);
    - `/tools/virtual-staging`, `/guides/virtual-staging-cost`, `/guides/ab-723-virtual-staging`,
      `/guides/photographing-rooms-for-virtual-staging`, `/guides/fair-housing-words-to-avoid`, `/guides` and
      `/photographers` — none of them were on Google ("discovered – currently not indexed" or "unknown to Google").
  - O3 ~00:50 UTC: Removals → Temporarily remove URL → "Remove all URLs with this prefix" for `https://orvionis.com/pl/`
    and `https://orvionis.com/en/` (Google applies it to www/non-www and http/https) → status "Processing request".
    It hides them for about 6 months; the pages already answer 404, so Google drops them for good on recrawl.
  - O4 Bing Webmaster Tools: not signed in on the owner's browser; signing in or creating that account is the owner's
    step (1 minute: bing.com/webmasters → sign in with Google → Import from Google Search Console).
- **A8 IndexNow, implemented-locally (2026-09-27 11:20 UTC):** 122 tests (15 new in `tests/indexnow.test.ts`),
  typecheck, production build. The local production server serves the key file (200, `text/plain`, exact key) and the
  unchanged 21-URL sitemap; all 16 retired paths answer 404 (the two trailing-slash forms 308 → 404). Production
  submission: recorded on `/admin/system` after the first hourly maintenance on the new deploy.
- **A8 released:** commit `d02d8aa`, Railway success 11:22 UTC. CI tests and build passed, but the gitleaks job flagged the
  key constant (generic high-entropy "key" rule, a false positive for a public token). That exact value is now allowlisted
  in `.gitleaks.toml`, with the reason (`814da1f`, CI green).
- **A8 delivered-and-verified:** `/admin/system` (17:05 UTC) shows **HTTP 202 · accepted**: 37 URLs (the sitemap plus the
  retired Ride Lab pages) submitted 2026-09-27 12:00 by the first hourly maintenance on the new deploy. 202 means received,
  with the key check pending; the key file answers on production. Outcome pending: Bing recrawl. Check `site:orvionis.com`
  on Bing against the 27 Sep baseline in 2–7 days.
- **2026-09-28, E10 content + A8 refinement:**
  - New guide `/guides/which-rooms-to-virtually-stage`, built on NAR's 2025 staging survey: the press release of May 6, 2025 is quoted for every figure, and the photo plan is marked as our own recommendation. Article markup; linked from the cost guide (cost guide `updated` 2026-09-28).
  - Sitemap `lastmod` is now per guide: its own `updated` date, never older than `CONTENT_UPDATED`. The `/guides` hub carries the newest guide date; everything else keeps `CONTENT_UPDATED`.
  - IndexNow follows the newest lastmod. After an accepted submission it sends only the newer URLs (protocol: changed content only).
  - 125 tests; production build; local check: head metadata, canonical, all figures on the page, 22 sitemap URLs with the new dates, `llms.txt` and the hub list the guide, no horizontal overflow at 390 / 1280 px.
- **Incremental IndexNow verified (2026-09-28 11:20 UTC):** `/admin/system` shows **HTTP 200 · accepted** for **3 URLs**
  (the new guide, the cost guide, `/guides`) submitted at 06:00. 200 means submitted, key verified, versus 202 on the first
  run. First-party channels: `www.google.com` 19 first-touch visits (+1 since 27 Sep); Bing `site:` still about 24 results
  at 05:10.
- **First organic signal (Search Console, last 24 h, read 2026-09-28 ≈ 11:40 UTC; the owner shared the same view):** 11 impressions, 0 clicks.
  - Queries (impressions, average position):
    - "photography pricing calculator" 3, 7.3;
    - "real estate photography pricing calculator" 2, 14.5;
    - "wedding photography price calculator" 1, 29;
    - "photo licensing fee calculator" 1, 79;
    - "how much does virtual staging cost" 1, 91;
    - "virtual staging cost" 1, 97.
  - Pages (average position):
    - `/free/photography-pricing-calculator` 22.7;
    - `/guides/ab-723-virtual-staging` 4.0 (for a query Google does not show);
    - `/guides/fair-housing-words-to-avoid` 8.0;
    - `/guides/virtual-staging-cost` 94.
  - Three guides that were "not on Google" on 27 Sep now show in results, a day and a half after the indexing requests. The 7-day report still ends on 25 Sep (39 impressions, only "ride lab").
  - Done 28 Sep (s46): the calculator page now serves its query family. It is not the E8 landing page.
    - Title "Photography pricing calculator: real estate & wedding rates"; a 157-character description.
    - A real estate example preset ($273 floor per shoot), with the active preset highlighted.
    - A "Market check" section:
      - weddings: The Knot 2026 Real Weddings Study, $3,000 average, quartiles, regions, guest counts;
      - real estate: Thumbtack hourly ranges, plus published rate cards at $150–$350 per standard package;
      - "what it means" arithmetic tied to the calculator examples.
    - "Floor vs. market" advice with a path to the $29 guide; two market FAQs (6 in FAQPage).
    - Its own sitemap lastmod through `PAGE_UPDATED`, so IndexNow resubmits only this URL.
    - Measure: Search Console position and CTR for "photography pricing calculator" (7.3), "real estate photography pricing calculator" (14.5) and "wedding photography price calculator" (29), weekly from 5 Oct.
  - **Delivered-and-verified:** `c2938ca`. Its Railway build passed `npm run build` but failed at the image push. The empty commit `42f101d` redeployed it: Railway success at 13:13 UTC, and CI was green for both.
    - Live checks: `/api/health` ok; the calculator page serves the new title, the real estate preset and the market section.
    - `/sitemap.xml` dates the calculator `2026-09-28T12:45:00.000Z`.
    - Verified at 17:05: `/admin/system` shows **HTTP 200 · accepted, 1 URL on 2026-09-28 14:00**. Only the calculator was resubmitted, as designed.
  - **Provider operations, 28 Sep ≈ 13:20 UTC** (under the owner's standing yes for Search Console):
    - URL Inspection → Request indexing for `/free/photography-pricing-calculator`: it was "URL is on Google", and the request was confirmed.
    - The same for `/guides/which-rooms-to-virtually-stage`: it was "URL is not on Google: unknown to Google", with no sitemap listing it yet. Request confirmed.
    - Sitemap resubmitted → "Sitemap submitted", 22 pages found (Google had read it on 28 Sep with 21).
    - The Overview chart shows 2 web-search clicks in the last 3 months (mid-August and about 25 Sep).
- **2026-09-29, sixth guide:** `/guides/photography-pricing-guide-checklist` (photographers), with Article markup and links to the calculator and the $29 tool.
  - The $29 tool page gained two related links (guide, calculator), so it gets its own lastmod through `PAGE_UPDATED`; tool URLs now read that map too.
  - Local check: title, a 156-character description, canonical, Article JSON-LD; the sitemap dates the guide, `/guides` and the tool page 29 Sep; `llms.txt` and the hub list it; no horizontal overflow at 390 px.
- **2026-09-29 05:10 UTC check:**
  - IndexNow: **HTTP 200 · 3 URLs at 01:00** (the sixth guide, `/guides`, the $29 tool page).
  - Search Console, last 24 h: 1 click, 23 impressions, average position 24.4.
    - Queries: "virtual staging pricing" 2, "photography pricing calculator" 1, "real estate photography pricing calculator" 1, "photo licensing fee calculator" 1, "how much does virtual staging cost" 1, "virtual staging cost" 1.
    - Staging-price queries now appear alongside the calculator family.
  - First-party: `www.google.com` first-touch visits went from 20 to 25 overnight.
  - Indexing requested for `/guides/photography-pricing-guide-checklist` ("unknown to Google" before the request).
  - `/guides/which-rooms-to-virtually-stage` is still "unknown to Google", with yesterday's request pending.
- **provider-outcome-pending:** crawling/indexing of the requested URLs, the new home title in results, the Ride Lab
  removals ("Processing" → "Approved"), Bing coverage. Check Search Console → Pages/Removals and `site:orvionis.com` in
  2–7 days.
- Coverage ledger (27 lanes, validated): `docs/seo/orchestration-ledger.json`.
- Next check: weekly `site:orvionis.com` and Search Console Pages/Performance; first-party channels `www.google.com`,
  `bing.com` and AI referrers.
