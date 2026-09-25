import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { site } from "@/config/site";

/** Open Graph card size (Facebook/LinkedIn/X/WhatsApp all accept 1200×630). */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export type OgCardOptions = {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Path under /public (JPEG or PNG). WebP is avoided on purpose — the OG renderer does not decode it reliably. */
  image?: string;
  /** Right-hand pill, e.g. "$49 per listing". */
  badge?: string;
};

async function publicImageDataUri(rel: string): Promise<string | null> {
  try {
    const abs = path.join(process.cwd(), "public", rel);
    const buf = await readFile(abs);
    const mime = rel.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null; // never fail the whole card because of a missing picture
  }
}

/**
 * Branded social-share card. Rendered once at build time by the `opengraph-image.tsx` route files,
 * so it costs nothing at request time. Every multi-child element uses `display: flex` (renderer rule).
 */
export async function ogCard(opts: OgCardOptions): Promise<ImageResponse> {
  const img = opts.image ? await publicImageDataUri(opts.image) : null;
  const host = site.url.replace(/^https?:\/\//, "");
  const textWidth = img ? 660 : 1200;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #08090d 0%, #11131a 100%)",
          color: "#f5f5f7",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: textWidth,
            padding: "52px 56px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 18, height: 18, borderRadius: 9999, background: "linear-gradient(135deg, #8b5cf6, #d946ef)" }} />
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 5 }}>{site.name}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 20, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 3 }}>{opts.eyebrow}</div>
            <div style={{ fontSize: img ? 50 : 60, fontWeight: 800, lineHeight: 1.1 }}>{opts.title}</div>
            <div style={{ fontSize: 25, color: "#a1a1aa", lineHeight: 1.35 }}>{opts.subtitle}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 22, color: "#8a8a93" }}>
            <div>{host}</div>
            {opts.badge ? (
              <div style={{ background: "linear-gradient(135deg, #8b5cf6, #d946ef)", color: "#ffffff", padding: "8px 18px", borderRadius: 999, fontWeight: 700 }}>{opts.badge}</div>
            ) : null}
          </div>
        </div>

        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" width={OG_SIZE.width - textWidth} height={OG_SIZE.height} style={{ objectFit: "cover" }} />
        ) : null}
      </div>
    ),
    { ...OG_SIZE },
  );
}
