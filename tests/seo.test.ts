import { beforeAll, describe, expect, it } from "vitest";
import { canonicalHostRedirect } from "@/lib/seo/host";
import nextConfig from "../next.config";
import { GUIDES } from "@/config/guides";
import { resetDatabase } from "./helpers";
import { GET as llmsTxt } from "@/app/llms.txt/route";
import { liveCatalog } from "@/lib/tools/catalog";
import { site } from "@/config/site";

const headers = (h: Record<string, string>) => new Headers(h);
const APP = "https://orvionis.com";

describe("seo: one public host (www → apex)", () => {
  it("redirects page requests on www to the same path and query on the apex", () => {
    expect(canonicalHostRedirect(headers({ host: "www.orvionis.com" }), "/tools/virtual-staging", "?gclid=abc", APP)).toBe(
      "https://orvionis.com/tools/virtual-staging?gclid=abc",
    );
    expect(canonicalHostRedirect(headers({ host: "WWW.ORVIONIS.COM:443" }), "/", "", APP)).toBe("https://orvionis.com/");
  });

  it("reads the forwarded host when the proxy rewrites Host", () => {
    expect(canonicalHostRedirect(headers({ host: "10.0.0.5:8080", "x-forwarded-host": "www.orvionis.com" }), "/pricing", "", APP)).toBe(
      "https://orvionis.com/pricing",
    );
  });

  it("leaves the apex, API routes (webhooks, OAuth callbacks) and local setups alone", () => {
    expect(canonicalHostRedirect(headers({ host: "orvionis.com" }), "/pricing", "", APP)).toBeNull();
    expect(canonicalHostRedirect(headers({ host: "www.orvionis.com" }), "/api/stripe/webhook", "", APP)).toBeNull();
    expect(canonicalHostRedirect(headers({ host: "www.orvionis.com" }), "/api/auth/google/callback", "?code=x", APP)).toBeNull();
    expect(canonicalHostRedirect(headers({ host: "www.localhost" }), "/", "", "http://localhost:3000")).toBeNull();
    expect(canonicalHostRedirect(headers({ host: "www.orvionis.com" }), "/", "", "https://www.orvionis.com")).toBeNull();
    expect(canonicalHostRedirect(headers({ host: "www.orvionis.com" }), "/", "", undefined)).toBeNull();
    expect(canonicalHostRedirect(headers({ host: "notorvionis.com" }), "/", "", APP)).toBeNull();
  });
});

describe("seo: metadata is never streamed into <body>", () => {
  it("treats every user agent as HTML-limited, crawlers and browsers alike", () => {
    const re = nextConfig.htmlLimitedBots;
    expect(re).toBeInstanceOf(RegExp);
    for (const ua of [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)",
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
    ]) {
      expect(re!.test(ua)).toBe(true);
    }
  });
});

describe("seo: /llms.txt is built from the live catalog and the guide list", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("has a page for every guide in the list, and every guide's tool exists", async () => {
    const { existsSync } = await import("node:fs");
    const path = await import("node:path");
    const { allTools } = await import("@/lib/tools/registry");
    const slugs = new Set(allTools().map((t) => t.slug));
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(GUIDES.length);
    for (const g of GUIDES) {
      expect(existsSync(path.join(process.cwd(), "src/app/guides", g.slug, "page.tsx")), g.slug).toBe(true);
      expect(g.updated, g.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (g.tool) expect(slugs.has(g.tool.slug), `${g.slug} → ${g.tool.slug}`).toBe(true);
    }
  });

  it("has a page for every free tool, and lists each one in the sitemap", async () => {
    const { existsSync } = await import("node:fs");
    const path = await import("node:path");
    const { FREE_TOOLS } = await import("@/config/free-tools");
    const { sitemapEntries } = await import("@/lib/seo/sitemap-entries");
    const urls = new Set(sitemapEntries(site.url).map((e) => e.url));
    for (const t of FREE_TOOLS) {
      expect(existsSync(path.join(process.cwd(), "src/app", t.href, "page.tsx")), t.href).toBe(true);
      expect(urls.has(`${site.url}${t.href}`), t.href).toBe(true);
    }
  });

  it("lists every live tool with its price, and every guide, as absolute links", async () => {
    const res = await llmsTxt();
    expect(res.headers.get("content-type")).toContain("text/plain");
    const body = await res.text();
    expect(body.startsWith(`# ${site.name}\n\n> `)).toBe(true);
    const catalog = await liveCatalog();
    expect(catalog.length).toBeGreaterThan(0);
    for (const c of catalog) expect(body).toContain(`](${site.url}/tools/${c.def.slug}): $${(c.priceCents / 100).toFixed(0)}`);
    for (const g of GUIDES) expect(body).toContain(`[${g.title}](${site.url}/guides/${g.slug})`);
    expect(body).toContain("per photo");
    // Never internal or private surfaces.
    expect(body).not.toMatch(/\/(admin|api|dashboard|orders|checkout|login)\b/);
  });
});
