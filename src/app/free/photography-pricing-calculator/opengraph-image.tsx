import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Free photography pricing calculator — ORVIONIS";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Static card (build time).
export default function Image() {
  return ogCard({
    eyebrow: "Free tool for photographers",
    title: "What to charge per job — from your real numbers.",
    subtitle: "Income goal, costs, taxes and the hours a job actually takes → the minimum per job and per hour, with a capacity check.",
    image: "img/hero-photographers.jpg",
    badge: "Free · no sign-up",
  });
}
