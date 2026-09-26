import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { allTools } from "@/lib/tools/registry";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages = ["", "/tools", "/pricing", "/real-estate", "/photographers", "/free/fair-housing-checker", "/contact", "/terms", "/privacy", "/refund-policy"];
  return [
    ...staticPages.map((p) => ({ url: `${site.url}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...allTools()
      .filter((t) => t.active !== false)
      .map((t) => ({ url: `${site.url}/tools/${t.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
}
