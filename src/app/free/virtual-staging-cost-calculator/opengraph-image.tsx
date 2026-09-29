import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Free virtual staging cost calculator — ORVIONIS";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Static card (build time).
export default function Image() {
  return ogCard({
    eyebrow: "Free tool for real estate agents",
    title: "What virtual staging costs for your listing.",
    subtitle: "Human editors, AI subscriptions and pay-per-photo AI side by side, from published prices.",
    image: "img/hero-real-estate.jpg",
    badge: "Free · no sign-up",
  });
}
