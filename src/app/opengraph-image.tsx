import { site } from "@/config/site";
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = `${site.name} — ${site.tagline}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "Done-for-you, priced per result",
    title: "Send us what you have. Get the finished thing back — in hours.",
    subtitle: "Listing clips for real-estate agents. Pricing guides for photographers. Pay once, keep the files.",
    badge: "No subscription",
  });
}
