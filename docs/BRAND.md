# ORVIONIS brand

The official ORVIONIS brand mark was supplied by the owner on 2026-09-26. It is the single visual identity of the brand. There is no other logo, no text monogram and no alternative symbol. The mark contains no lettering, so wherever the name is needed the word **ORVIONIS** is set next to it in text. The mark is never replaced by the name.

## Colours

| Role | Value | Use |
| --- | --- | --- |
| Background | `#08090D` | page canvas, email header, app-icon tiles, Stripe brand colour, browser theme colour |
| Accent | `#8B5CF6` | buttons, highlights, Stripe accent colour |
| Accent gradient partner | `#D946EF` | only in the existing primary-CTA gradient (already part of the site's UI) |
| Link on white | `#7C3AED` | email footer links only — `#8B5CF6` on white misses the 4.5:1 contrast for small text |

The mark itself carries its own black / violet / magenta rendering. It is never recoloured.

## Assets (`public/brand/`, served at `https://orvionis.com/brand/…`)

| File | Size | What it is | Where it is used |
| --- | --- | --- | --- |
| `orvionis-logo-original.png` | 1254² | the file exactly as supplied, transparent | master for every derivative (press kit) |
| `orvionis-logo-1024.png`, `orvionis-logo-512.png` | 1024², 512² | primary logo: the full mark with its original breathing room, transparent | Organization JSON-LD logo (search), downloads |
| `orvionis-mark-{32,48,64,96,128,192,256,512}.png` | | the mark cropped to the drawing (4 % padding), transparent | UI; `-96` in emails, `-128` in Open Graph cards, `-512` uploaded to Stripe as Icon and Logo |
| `orvionis-mark-{48,64,128}.webp` | | same, WebP | site UI via `<BrandMark>` (2× files: 24 / 32 / 64 px displays) |
| `orvionis-mark-on-dark-512.png` | 512² | the mark on `#08090D`, opaque | avatars / social profiles |
| `favicon-{16,32,48,64}.png`, `/favicon.ico` (16+32+48) | | transparent mark, tight crop | browser tabs (`/icon` route = `favicon-64.png`) |
| `apple-touch-icon.png` | 180² | the mark on `#08090D` (iOS allows no transparency) | `/apple-icon` route |
| `icon-192.png`, `icon-512.png` | | the mark on a rounded `#08090D` tile | web app manifest (`purpose: any`) |
| `icon-maskable-512.png` | 512² | the mark inside the 80 % safe zone on `#08090D` | web app manifest (`purpose: maskable`, Android adaptive icons) |
| `extension/icon-{16,32,48,128}.png` | | transparent mark; 128 = 96 px artwork + 16 px padding (Chrome guideline) | browser extension (none exists yet — ready for its `manifest.json`) |

**Small sizes** (16–48 px) use the same mark, only resampled from the master and cropped tighter. No simplified redraw was needed: at 16 px the silhouette stays recognisable on light and dark browser UIs.

**Vector format.** The mark is raster artwork with gradients and glow. An SVG would need a vector redraw, which would change the design, so none is shipped. If a platform ever requires SVG (for example a single-colour Safari pinned-tab icon), have a designer redraw it from the master. Do not auto-trace it.

Regenerate every derivative from the master with `pip install pillow && python3 scripts/brand_assets.py`. The script only crops (drawing bounding box plus 4 % padding) and resamples (LANCZOS); it never redraws the mark.

## Where the mark appears

- **Site:** navbar (32 px, next to the name), footer (24 px), sign-in page (48 px), 404 page and the error page (64 px), admin console header (36 px). All placements go through `src/components/BrandMark.tsx`, with paths in `src/config/brand.ts`.
- **Browser / devices:** `/favicon.ico`, `/icon` (`src/app/icon.tsx`), `/apple-icon`, `/manifest.webmanifest` (`src/app/manifest.ts`, theme colour `#08090D`).
- **Search / social:** every Open Graph card (`src/lib/og.tsx`, 52 px mark next to the name; X/Twitter uses the same `summary_large_image`), and the Organization JSON-LD on the home page (`logo` = `orvionis-logo-512.png`).
- **Email:** every HTML email (sign-in link, order confirmation, delivery, redo) is framed by `src/lib/email/layout.ts`: the mark and the name on `#08090D`, then a footer with the site and support address. Admin notifications stay plain text.
- **Stripe** (live account `acct_1UIuDZGsFrMfnr38`, Settings → Business → Branding): Icon and Logo = `orvionis-mark-512.png`, brand colour `#08090D`, accent `#8B5CF6`, public name ORVIONIS. Uploaded and saved 2026-09-26. `/admin/system` shows name, icon, logo and colours per mode. Stripe switched on "Prefer logo over icon" when the logo was uploaded. Checkout therefore shows the mark itself; untick it to show the small icon plus the name ORVIONIS instead.
- **Not branded on purpose:** customer deliverables. The photographer pricing-guide PDF carries the customer's own studio brand, and staged photos carry only the "Virtually staged" disclosure label.
