import { findToolBySlug } from "@/lib/tools/definitions";
import { formatUsd } from "@/lib/ai/pricing";
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "ORVIONIS — a done-for-you deliverable, priced per result";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Hero photo per tool category (JPEG twins of the landing heroes; the OG renderer does not decode WebP). */
const HERO_BY_CATEGORY: Record<string, string> = {
  "real-estate": "img/hero-real-estate.jpg",
  photography: "img/hero-photographers.jpg",
};

/** Per-tool share card, rendered on demand (tool pages are dynamic; bots fetch this rarely). */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const def = findToolBySlug(slug);
  if (!def) {
    return ogCard({ eyebrow: "Tools", title: "Tool not found", subtitle: "Browse every tool at /tools." });
  }
  const timing = def.fulfillment === "AUTO" ? "delivered in minutes" : `delivered in ${def.sla.deliveryHours} hours`;
  return ogCard({
    eyebrow: `${def.category.replace("-", " ")} · ${timing}`,
    title: def.name,
    subtitle: def.tagline,
    image: HERO_BY_CATEGORY[def.category],
    badge: `${formatUsd(def.pricing.priceCents)} · no subscription`,
  });
}
