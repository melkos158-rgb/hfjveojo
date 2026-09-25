import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "ORVIONIS for photographers — a branded PDF pricing guide written from your real packages";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Static card (rendered at build time) — keep the price in sync with the Pricing Guide product ($29) and the page metadata.
export default function Image() {
  return ogCard({
    eyebrow: "For photographers",
    title: "A pricing guide that reads like you wrote it on a good day.",
    subtitle: "Answer ten questions. Get a branded PDF with your packages, prices, process and FAQ — ready to send to the next enquiry.",
    image: "img/hero-photographers.jpg",
    badge: "$29 one-time",
  });
}
