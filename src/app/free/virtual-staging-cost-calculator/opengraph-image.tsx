import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Free virtual staging cost calculator — ORVIONIS";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Static card (build time).
export default function Image() {
  return ogCard({
    eyebrow: "Free tool for real estate agents",
    title: "What virtual staging costs for your listing.",
    subtitle: "Nine companies side by side: design services, pay-per-photo AI and a subscription, from published prices.",
    image: "img/hero-real-estate.jpg",
    badge: "Free · no sign-up",
  });
}
