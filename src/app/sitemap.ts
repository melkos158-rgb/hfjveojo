import type { MetadataRoute } from "next";
import { sitemapEntries } from "@/lib/seo/sitemap-entries";

export const dynamic = "force-dynamic";

/** URL list and lastmod live in src/lib/seo/sitemap-entries.ts (shared with the IndexNow submission). */
export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries();
}
