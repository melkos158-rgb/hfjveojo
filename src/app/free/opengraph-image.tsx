import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Free tools from ORVIONIS";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "Free tools",
    title: "Useful on their own. No sign-up.",
    subtitle: "A fair-housing checker for listing copy and a photography pricing calculator — each runs in your browser and does one job well.",
    image: "img/hero-home.jpg",
    badge: "Free",
  });
}
