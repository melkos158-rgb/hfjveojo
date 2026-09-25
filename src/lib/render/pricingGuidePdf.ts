import { createElement as h } from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

/**
 * Branded A4 pricing guide rendered with @react-pdf/renderer (pure JS — no headless browser needed).
 * Written with createElement so it runs identically in Next.js route handlers and the tsx worker.
 */

export type PricingGuideDoc = {
  brand: { studioName: string; photographerName: string; color: string; website?: string; instagram?: string; location: string };
  coverTitle: string;
  tagline: string;
  about: string;
  philosophy: string;
  packages: Array<{ name: string; price: string; description: string; includes: string[] }>;
  addOns: Array<{ name: string; price: string; description: string }>;
  process: Array<{ title: string; text: string }>;
  faq: Array<{ q: string; a: string }>;
  policies: string[];
  cta: string;
};

function styles(color: string) {
  return StyleSheet.create({
    page: { padding: 48, fontFamily: "Helvetica", fontSize: 11, color: "#1f1f1f", lineHeight: 1.45 },
    cover: { padding: 48, fontFamily: "Helvetica", justifyContent: "center", height: "100%" },
    coverBand: { backgroundColor: color, height: 10, marginBottom: 32 },
    coverStudio: { fontSize: 14, letterSpacing: 3, textTransform: "uppercase", color: "#666", marginBottom: 14 },
    coverTitle: { fontSize: 36, fontFamily: "Helvetica-Bold", color: "#111", marginBottom: 12 },
    coverTagline: { fontSize: 14, color: "#444", marginBottom: 40 },
    coverMeta: { fontSize: 11, color: "#666" },
    h1: { fontSize: 22, fontFamily: "Helvetica-Bold", color, marginBottom: 12 },
    h2: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 4, color: "#111" },
    p: { marginBottom: 8 },
    small: { fontSize: 9, color: "#777" },
    pkg: { borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 6, padding: 14, marginBottom: 12 },
    pkgHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    pkgName: { fontSize: 15, fontFamily: "Helvetica-Bold" },
    pkgPrice: { fontSize: 15, fontFamily: "Helvetica-Bold", color },
    li: { flexDirection: "row", marginBottom: 3 },
    bullet: { width: 12, color },
    liText: { flex: 1 },
    footer: { position: "absolute", bottom: 24, left: 48, right: 48, fontSize: 8, color: "#999", flexDirection: "row", justifyContent: "space-between" },
  });
}

function footer(s: ReturnType<typeof styles>, brand: PricingGuideDoc["brand"]) {
  return h(View, { key: "footer", style: s.footer, fixed: true }, [
    h(Text, { key: "a" }, `${brand.studioName} · ${brand.location}`),
    h(Text, { key: "b" }, [brand.website, brand.instagram].filter(Boolean).join(" · ")),
  ]);
}

function bullets(s: ReturnType<typeof styles>, items: string[]) {
  return items.map((t, i) =>
    h(View, { key: i, style: s.li }, [h(Text, { key: "b", style: s.bullet }, "•"), h(Text, { key: "t", style: s.liText }, t)]),
  );
}

export function buildPricingGuideDocument(doc: PricingGuideDoc) {
  const s = styles(doc.brand.color);
  const year = new Date().getFullYear();

  const cover = h(Page, { size: "A4", style: s.cover, key: "cover" }, [
    h(View, { key: "band", style: s.coverBand }),
    h(Text, { key: "studio", style: s.coverStudio }, doc.brand.studioName),
    h(Text, { key: "title", style: s.coverTitle }, doc.coverTitle),
    h(Text, { key: "tag", style: s.coverTagline }, doc.tagline),
    h(Text, { key: "meta", style: s.coverMeta }, `${doc.brand.photographerName} · ${doc.brand.location} · ${year}`),
  ]);

  const about = h(Page, { size: "A4", style: s.page, key: "about" }, [
    h(Text, { key: "h", style: s.h1 }, `Hello, I'm ${doc.brand.photographerName}`),
    h(Text, { key: "p1", style: s.p }, doc.about),
    h(Text, { key: "h2", style: s.h2 }, "How I work"),
    h(Text, { key: "p2", style: s.p }, doc.philosophy),
    footer(s, doc.brand),
  ]);

  const packages = h(Page, { size: "A4", style: s.page, key: "packages" }, [
    h(Text, { key: "h", style: s.h1 }, "Packages"),
    ...doc.packages.map((p, i) =>
      h(View, { key: i, style: s.pkg, wrap: false }, [
        h(View, { key: "head", style: s.pkgHead }, [
          h(Text, { key: "n", style: s.pkgName }, p.name),
          h(Text, { key: "pr", style: s.pkgPrice }, p.price),
        ]),
        h(Text, { key: "d", style: s.p }, p.description),
        ...bullets(s, p.includes),
      ]),
    ),
    ...(doc.addOns.length > 0
      ? [
          h(Text, { key: "ah", style: s.h2 }, "Add-ons"),
          ...doc.addOns.map((a, i) =>
            h(View, { key: `a${i}`, style: s.li }, [
              h(Text, { key: "b", style: s.bullet }, "+"),
              h(Text, { key: "t", style: s.liText }, `${a.name} — ${a.price}. ${a.description}`),
            ]),
          ),
        ]
      : []),
    footer(s, doc.brand),
  ]);

  const process = h(Page, { size: "A4", style: s.page, key: "process" }, [
    h(Text, { key: "h", style: s.h1 }, "What happens next"),
    ...doc.process.flatMap((st, i) => [
      h(Text, { key: `t${i}`, style: s.h2 }, `${i + 1}. ${st.title}`),
      h(Text, { key: `p${i}`, style: s.p }, st.text),
    ]),
    h(Text, { key: "fh", style: s.h1 }, "Questions you might have"),
    ...doc.faq.flatMap((f, i) => [
      h(Text, { key: `q${i}`, style: s.h2 }, f.q),
      h(Text, { key: `a${i}`, style: s.p }, f.a),
    ]),
    footer(s, doc.brand),
  ]);

  const closing = h(Page, { size: "A4", style: s.page, key: "closing" }, [
    h(Text, { key: "h", style: s.h1 }, "The fine print"),
    ...bullets(s, doc.policies),
    h(Text, { key: "cta", style: { ...s.h2, marginTop: 28, color: doc.brand.color } }, doc.cta),
    h(
      Text,
      { key: "contact", style: s.p },
      [doc.brand.website, doc.brand.instagram].filter(Boolean).join("  ·  ") || `${doc.brand.studioName}, ${doc.brand.location}`,
    ),
    h(Text, { key: "note", style: { ...s.small, marginTop: 40 } }, "Prices valid for bookings made this year. Travel and taxes may apply where noted."),
    footer(s, doc.brand),
  ]);

  return h(Document, { title: `${doc.brand.studioName} — ${doc.coverTitle}`, author: doc.brand.photographerName }, [
    cover,
    about,
    packages,
    process,
    closing,
  ]);
}

export async function renderPricingGuidePdf(doc: PricingGuideDoc): Promise<Buffer> {
  // renderToBuffer expects a React element of <Document>; the cast keeps @react-pdf's types happy with createElement.
  const element = buildPricingGuideDocument(doc) as unknown as Parameters<typeof renderToBuffer>[0];
  return renderToBuffer(element);
}
