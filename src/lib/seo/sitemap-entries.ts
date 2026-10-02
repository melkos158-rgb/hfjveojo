import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { allTools } from "@/lib/tools/registry";
import { GUIDES, type Guide } from "@/config/guides";

/**
 * Bump when page content changes materially across the site. It is the sitemap `lastmod` of every page except:
 * - the guides, which carry their own `updated` date (never older than this);
 * - the /guides hub, which carries the newest guide date;
 * - single pages listed in PAGE_UPDATED.
 * A lastmod that changes on every request makes crawlers ignore it. The newest lastmod is the content version that
 * IndexNow submissions follow (src/lib/seo/indexnow.ts).
 */
export const CONTENT_UPDATED = new Date("2026-09-27T00:00:00Z");

/**
 * Single pages whose content changed after CONTENT_UPDATED, with when they changed: a day (YYYY-MM-DD) or, when
 * something else already moved the content version that day, a UTC time (YYYY-MM-DDTHH:MM:SSZ), so the version moves
 * again. Only that page's lastmod moves, so crawlers and the incremental IndexNow submission see exactly which page is
 * new. Never use a time later than the deploy.
 */
export const PAGE_UPDATED: Record<string, string> = {
  "/free/photography-pricing-calculator": "2026-09-28T12:45:00Z",
  "/tools/photographer-pricing-guide": "2026-09-29",
  "/free/virtual-staging-cost-calculator": "2026-10-01T23:16:00Z",
  "/free": "2026-09-29T15:00:00Z",
  "/real-estate": "2026-09-29T15:00:00Z",
  // 1 Oct 23:16 UTC (70e12eb): free first photo, volume prices, real before/after first screen
  "/tools/virtual-staging": "2026-10-01T23:16:00Z",
  "/pricing": "2026-10-01T23:16:00Z",
  "/privacy": "2026-10-01T23:16:00Z",
};

const later = (a: Date, b: Date) => (b.getTime() > a.getTime() ? b : a);

/** A date's lastmod: the given day or UTC time, or the site-wide date when that is newer or the value is invalid. */
function lastModifiedFrom(value: string): Date {
  const own = new Date(value.includes("T") ? value : `${value}T00:00:00Z`);
  return Number.isNaN(own.getTime()) ? CONTENT_UPDATED : later(CONTENT_UPDATED, own);
}

/** A guide's lastmod: its own `updated` day, or the site-wide date when that is newer. */
export function guideLastModified(g: Pick<Guide, "updated">): Date {
  return lastModifiedFrom(g.updated);
}

/** A non-guide page's lastmod: its PAGE_UPDATED value when listed (never older than CONTENT_UPDATED), else CONTENT_UPDATED. */
export function pageLastModified(path: string): Date {
  const own = PAGE_UPDATED[path];
  return own ? lastModifiedFrom(own) : CONTENT_UPDATED;
}

/** The public, indexable URLs: /sitemap.xml and the IndexNow submission read the same list. */
export function sitemapEntries(baseUrl: string = site.url): MetadataRoute.Sitemap {
  const hub = GUIDES.reduce((d, g) => later(d, guideLastModified(g)), CONTENT_UPDATED);
  const page = (p: string, lastModified: Date) => ({ url: `${baseUrl}${p}`, lastModified, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 });
  return [
    ...["", "/tools", "/pricing", "/real-estate", "/photographers", "/free", "/free/fair-housing-checker", "/free/virtual-staging-cost-calculator", "/free/photography-pricing-calculator"].map((p) =>
      page(p, pageLastModified(p)),
    ),
    page("/guides", hub),
    ...GUIDES.map((g) => page(`/guides/${g.slug}`, guideLastModified(g))),
    ...["/contact", "/terms", "/privacy", "/refund-policy"].map((p) => page(p, pageLastModified(p))),
    ...allTools()
      .filter((t) => t.active !== false)
      .map((t) => ({ url: `${baseUrl}/tools/${t.slug}`, lastModified: pageLastModified(`/tools/${t.slug}`), changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
}

/** The newest lastmod in the sitemap: a new or updated guide moves it forward, and so does a CONTENT_UPDATED bump. */
export function contentVersion(entries: MetadataRoute.Sitemap = sitemapEntries()): Date {
  return entries.reduce((d, e) => (e.lastModified instanceof Date ? later(d, e.lastModified) : d), CONTENT_UPDATED);
}
