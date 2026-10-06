import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "ORVIONIS for real-estate photographers — 25 rooms of virtual staging for $149, no logo on the photos";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Static card (rendered at build time) — keep the price in sync with the Pro credits product ($149) and the page metadata.
export default function Image() {
  return ogCard({
    eyebrow: "For real-estate photographers",
    title: "Virtual staging with every shoot, about $6 a room.",
    subtitle: "25 rooms for $149 with Pro credits: two staged versions per room, no logo, no subscription.",
    image: "img/sample-virtual-staging-og.jpg",
    badge: "$149 one-time",
  });
}
