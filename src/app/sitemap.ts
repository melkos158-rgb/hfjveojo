import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { allTools } from "@/lib/tools/registry";

export const dynamic = "force-dynamic";

/** Bump when page content changes materially; a lastmod that changes on every request makes crawlers ignore it. */
const CONTENT_UPDATED = new Date("2026-09-26T00:00:00Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = CONTENT_UPDATED;
  const staticPages = ["", "/tools", "/pricing", "/real-estate", "/photographers", "/free", "/free/fair-housing-checker", "/free/photography-pricing-calculator", "/contact", "/terms", "/privacy", "/refund-policy"];
  return [
    ...staticPages.map((p) => ({ url: `${site.url}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...allTools()
      .filter((t) => t.active !== false)
      .map((t) => ({ url: `${site.url}/tools/${t.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
}
