/**
 * The official ORVIONIS brand mark (supplied by the owner on 2026-09-26) and every derived asset. One symbol, no
 * wordmark inside it: where the name is needed, the text "ORVIONIS" sits next to the mark. Never swap the mark for a
 * text monogram or a different symbol. Sources, sizes and usage rules: docs/BRAND.md. All paths are under /public.
 */
export const brand = {
  colors: { background: "#08090D", accent: "#8B5CF6" },
  /** The file exactly as supplied (1254 px, transparent). Master for every derivative. */
  original: "/brand/orvionis-logo-original.png",
  /** Primary logo: the full mark with its original breathing room, transparent. */
  logo: { 512: "/brand/orvionis-logo-512.png", 1024: "/brand/orvionis-logo-1024.png" },
  /** The mark cropped to the drawing (4 % padding), transparent — for UI sizes. */
  mark: {
    32: "/brand/orvionis-mark-32.png",
    48: "/brand/orvionis-mark-48.png",
    64: "/brand/orvionis-mark-64.png",
    96: "/brand/orvionis-mark-96.png",
    128: "/brand/orvionis-mark-128.png",
    192: "/brand/orvionis-mark-192.png",
    256: "/brand/orvionis-mark-256.png",
    512: "/brand/orvionis-mark-512.png",
    webp48: "/brand/orvionis-mark-48.webp",
    webp64: "/brand/orvionis-mark-64.webp",
    webp128: "/brand/orvionis-mark-128.webp",
  },
  /** The mark on the #08090D background — app icons and avatars, where transparency is not allowed or would vanish. */
  onDark512: "/brand/orvionis-mark-on-dark-512.png",
  favicon: { 16: "/brand/favicon-16.png", 32: "/brand/favicon-32.png", 48: "/brand/favicon-48.png", 64: "/brand/favicon-64.png" },
  appIcon: { 192: "/brand/icon-192.png", 512: "/brand/icon-512.png", maskable512: "/brand/icon-maskable-512.png", apple180: "/brand/apple-touch-icon.png" },
} as const;
