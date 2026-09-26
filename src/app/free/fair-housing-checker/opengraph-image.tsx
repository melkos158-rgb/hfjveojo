import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Free fair housing checker for listing descriptions — ORVIONIS";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Static card (build time). Shared on Reddit / Facebook groups, so it must say what the tool does and that it is free.
export default function Image() {
  return ogCard({
    eyebrow: "Free tool for agents",
    title: "Fair housing checker for listing copy.",
    subtitle: "Paste your remarks: risky phrases highlighted with a rewrite hint, plus a live character count for your MLS limit.",
    image: "img/hero-real-estate.jpg",
    badge: "Free · runs in your browser",
  });
}
