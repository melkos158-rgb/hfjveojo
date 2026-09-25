import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "ORVIONIS for real-estate agents — your walkthrough video cut into listing clips, delivered in 48 hours";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Static card (rendered at build time) — keep the price in sync with the Listing Clips product ($49) and the page metadata.
export default function Image() {
  return ogCard({
    eyebrow: "For real-estate agents",
    title: "Your walkthrough, cut into 5 listing clips.",
    subtitle: "Price, beds/baths and your branding on screen, captions written for you. Delivered in 48 hours.",
    image: "img/hero-real-estate.jpg",
    badge: "$49 per listing",
  });
}
