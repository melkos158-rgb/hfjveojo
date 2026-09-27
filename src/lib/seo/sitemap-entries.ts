import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { allTools } from "@/lib/tools/registry";
import { GUIDES } from "@/config/guides";

/**
 * Bump when page content changes materially. It is every URL's sitemap `lastmod`, and a new value makes the next hourly
 * maintenance notify IndexNow again (src/lib/seo/indexnow.ts). A lastmod that changes on every request makes crawlers
 * ignore it.
 */
export const CONTENT_UPDATED = new Date("2026-09-27T00:00:00Z");

/** The public, indexable URLs: /sitemap.xml and the IndexNow submission read the same list. */
export function sitemapEntries(baseUrl: string = site.url): MetadataRoute.Sitemap {
  const now = CONTENT_UPDATED;
  const staticPages = [
    "",
    "/tools",
    "/pricing",
    "/real-estate",
    "/photographers",
    "/free",
    "/free/fair-housing-checker",
    "/free/photography-pricing-calculator",
    "/guides",
    ...GUIDES.map((g) => `/guides/${g.slug}`),
    "/contact",
    "/terms",
    "/privacy",
    "/refund-policy",
  ];
  return [
    ...staticPages.map((p) => ({ url: `${baseUrl}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...allTools()
      .filter((t) => t.active !== false)
      .map((t) => ({ url: `${baseUrl}/tools/${t.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
}
