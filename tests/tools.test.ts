import { describe, expect, it } from "vitest";
import { allTools, getToolBySlug } from "@/lib/tools/registry";
import { validateVideoLink } from "@/lib/security/files";
import { checkFairHousing, checkNoPlaceholders } from "@/lib/tools/qa";
import { parsePackages } from "@/lib/tools/definitions/photo-pricing-guide";
import { sampleListingClipsIntake, samplePricingGuideIntake } from "./helpers";

describe("tool registry", () => {
  it("has unique ids, slugs and SKUs and complete landing copy", () => {
    const tools = allTools();
    expect(tools.length).toBeGreaterThanOrEqual(2);
    expect(new Set(tools.map((t) => t.id)).size).toBe(tools.length);
    expect(new Set(tools.map((t) => t.slug)).size).toBe(tools.length);
    expect(new Set(tools.map((t) => t.pricing.sku)).size).toBe(tools.length);
    for (const t of tools) {
      expect(t.pricing.priceCents).toBeGreaterThan(0);
      expect(t.landing.bullets.length).toBeGreaterThan(2);
      expect(t.landing.faq.length).toBeGreaterThan(2);
      expect(t.seo.title.length).toBeLessThanOrEqual(80);
      // every UI field must exist in the zod schema
      const keys = Object.keys((t.intake.schema as unknown as { shape: Record<string, unknown> }).shape);
      for (const f of t.intake.fields) expect(keys).toContain(f.key);
    }
  });

  it("validates intake: accepts good input, rejects bad input", () => {
    const clips = getToolBySlug("listing-clips")!;
    expect(clips.intake.schema.safeParse(sampleListingClipsIntake).success).toBe(true);
    expect(clips.intake.schema.safeParse({ ...sampleListingClipsIntake, videoLink: "https://evil.example.com/x" }).success).toBe(false);
    expect(clips.intake.schema.safeParse({ ...sampleListingClipsIntake, agentName: "" }).success).toBe(false);

    const guide = getToolBySlug("photographer-pricing-guide")!;
    expect(guide.intake.schema.safeParse(samplePricingGuideIntake).success).toBe(true);
    expect(guide.intake.schema.safeParse({ ...samplePricingGuideIntake, brandColor: "red" }).success).toBe(false);
  });
});

describe("input validation helpers", () => {
  it("accepts known video hosts and rejects others", () => {
    expect(validateVideoLink("https://youtu.be/abc")).toContain("youtu.be");
    expect(validateVideoLink("https://www.dropbox.com/s/x/y.mp4?dl=0")).toContain("dropbox.com");
    expect(() => validateVideoLink("not a url")).toThrow();
    expect(() => validateVideoLink("ftp://drive.google.com/x")).toThrow();
    expect(() => validateVideoLink("https://random-host.io/video.mp4")).toThrow();
  });

  it("parses package lines with | and — separators", () => {
    const p = parsePackages("Essentials | $2,400 | 6 hours\nFull Day — $3,800 — 10 hours");
    expect(p).toHaveLength(2);
    expect(p[0]).toEqual({ name: "Essentials", price: "$2,400", includes: "6 hours" });
    expect(p[1].price).toBe("$3,800");
  });
});

describe("quality rules", () => {
  it("flags placeholders and fair-housing phrases", () => {
    expect(checkNoPlaceholders("Welcome [insert name] to Lorem ipsum").length).toBeGreaterThanOrEqual(2);
    expect(checkNoPlaceholders("A clean, specific caption.")).toEqual([]);
    expect(checkFairHousing("Perfect for families near the church").length).toBeGreaterThan(0);
    expect(checkFairHousing("Quartz island and a covered patio.")).toEqual([]);
  });
});
