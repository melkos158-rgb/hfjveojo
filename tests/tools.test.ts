import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { allTools, getToolBySlug } from "@/lib/tools/registry";
import { validateVideoLink } from "@/lib/security/files";
import { checkFairHousing, checkNoPlaceholders, findFairHousingMatches } from "@/lib/tools/qa";
import { parsePackages } from "@/lib/tools/definitions/photo-pricing-guide";
import { SAMPLE_MLS_DESCRIPTION } from "@/lib/tools/samples/listing-description";
import { sampleListingClipsIntake, sampleListingDescriptionIntake, samplePricingGuideIntake } from "./helpers";

describe("tool registry", () => {
  it("has unique ids, slugs and SKUs and complete landing copy", () => {
    const tools = allTools();
    expect(tools.length).toBeGreaterThanOrEqual(3);
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
      // the result-first card copy every tool must carry
      expect(t.io.input.length).toBeGreaterThan(5);
      expect(t.io.output.length).toBeGreaterThan(5);
      expect(t.io.processingTime.length).toBeGreaterThan(2);
      expect(t.io.ctaLabel.length).toBeGreaterThan(2);
    }
  });

  it("every live tool shows a finished sample that passes the same checks as a real delivery", () => {
    for (const t of allTools().filter((x) => x.active !== false)) {
      const sample = t.landing.sample;
      expect(sample, `${t.slug} has no sample`).toBeDefined();
      if (!sample) continue;
      expect(sample.input.length).toBeGreaterThan(2);
      expect(sample.output.length).toBeGreaterThan(2);
      const text = [sample.label, ...sample.input, ...sample.output.flatMap((b) => [b.heading ?? "", b.text ?? "", ...(b.bullets ?? [])]), sample.note ?? ""].join("\n");
      expect(checkNoPlaceholders(text)).toEqual([]);
      expect(checkFairHousing(text)).toEqual([]);
      if (sample.collapseAfter !== undefined) expect(sample.collapseAfter).toBeLessThan(sample.output.length);
      if (sample.preview) {
        expect(existsSync(join(process.cwd(), "public", sample.preview.image))).toBe(true);
        if (sample.preview.href) expect(existsSync(join(process.cwd(), "public", sample.preview.href))).toBe(true);
      }
      if (t.seo.ogImage) {
        expect(t.seo.ogImage).toMatch(/\.(jpe?g|png)$/i); // the OG renderer cannot decode WebP
        expect(existsSync(join(process.cwd(), "public", t.seo.ogImage))).toBe(true);
      }
    }
    expect(SAMPLE_MLS_DESCRIPTION.length).toBeLessThanOrEqual(1000);
    expect(SAMPLE_MLS_DESCRIPTION.length).toBeGreaterThanOrEqual(400);
  });

  it("pricing guide strips model-added step numbers from process titles", async () => {
    const { normalizeProcessTitle } = await import("@/lib/tools/definitions/photo-pricing-guide");
    expect(normalizeProcessTitle("1. Get in Touch")).toBe("Get in Touch");
    expect(normalizeProcessTitle("Step 2 — Booking")).toBe("Booking");
    expect(normalizeProcessTitle("3) Planning")).toBe("Planning");
    expect(normalizeProcessTitle("Wedding day")).toBe("Wedding day");
  });

  it("hand-written tool links in pages and config point at real slugs", () => {
    const slugs = new Set(allTools().map((t) => t.slug));
    for (const file of ["src/app/page.tsx", "src/config/categories.ts", "src/components/VerticalLanding.tsx"]) {
      const src = readFileSync(join(process.cwd(), file), "utf8");
      for (const m of src.matchAll(/["'`]\/tools\/([a-z0-9-]+)(?:[#?"'`])/g)) {
        expect(slugs.has(m[1]), `${file} links to /tools/${m[1]} which is not a tool`).toBe(true);
      }
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

    const desc = getToolBySlug("listing-description")!;
    expect(desc.intake.schema.safeParse(sampleListingDescriptionIntake).success).toBe(true);
    expect(desc.intake.schema.safeParse({ ...sampleListingDescriptionIntake, features: "short" }).success).toBe(false);
    expect(desc.intake.schema.safeParse({ ...sampleListingDescriptionIntake, mlsLimit: "999" }).success).toBe(false);

    const staging = getToolBySlug("virtual-staging")!;
    expect(staging.intake.schema.safeParse({ photoFileId: "clx123", roomType: "bedroom", style: "coastal" }).success).toBe(true);
    expect(staging.intake.schema.safeParse({ photoFileId: "", roomType: "bedroom", style: "coastal" }).success).toBe(false);
    expect(staging.intake.schema.safeParse({ photoFileId: "clx123", roomType: "garage", style: "coastal" }).success).toBe(false);
    expect(staging.intake.schema.safeParse({ photoFileId: "clx123", style: "art deco" }).success).toBe(false);
  });

  it("virtual staging prompt keeps the architecture fixed and carries the customer's notes", async () => {
    const { stagingPrompt } = await import("@/lib/tools/definitions/virtual-staging");
    const p = stagingPrompt({ roomType: "home office", style: "scandinavian", notes: "keep the fireplace visible" });
    expect(p).toContain("home office");
    expect(p).toContain("scandinavian");
    expect(p).toContain("ONLY freestanding, movable furniture");
    // the two failure modes seen in production test order #5: an added chandelier and an added built-in bookcase
    expect(p).toMatch(/no ceiling lights, chandeliers, pendant lights/);
    expect(p).toMatch(/no built-in shelving/);
    expect(p).toMatch(/do not crop, zoom, reframe/);
    expect(p).toContain("no people");
    expect(p).toContain("Customer notes: keep the fireplace visible");
    expect(stagingPrompt({ roomType: "bedroom", style: "modern", notes: "" })).not.toContain("Customer notes");
  });

  it("image edits keep the photo's proportions on models that allow any size", async () => {
    const { editSizeFor, wantsInputFidelity, supportsArbitrarySize } = await import("@/lib/ai/image-size");
    expect(supportsArbitrarySize("gpt-image-2")).toBe(true);
    expect(supportsArbitrarySize("gpt-image-2.5-flare")).toBe(true);
    expect(supportsArbitrarySize("gpt-image-1")).toBe(false);
    expect(editSizeFor("gpt-image-2", 1500, 1000)).toBe("1536x1024"); // 3:2 listing photo
    expect(editSizeFor("gpt-image-2", 1024, 688)).toBe("1536x1040"); // the sample photo (1.488:1) — nearest multiple of 16
    expect(editSizeFor("gpt-image-2", 4032, 3024)).toBe("1536x1152"); // 4:3 phone photo
    expect(editSizeFor("gpt-image-2", 3024, 4032)).toBe("1152x1536"); // portrait
    expect(editSizeFor("gpt-image-2", 1920, 1080)).toBe("1536x864"); // 16:9
    expect(editSizeFor("gpt-image-2", 6000, 1000)).toBe("1536x512"); // clamped to 3:1
    expect(editSizeFor("gpt-image-2")).toBe("1536x1024");
    for (const s of ["1536x1024", "1536x1040", "1536x1152", "1152x1536", "1536x864", "1536x512"]) {
      const [w, h] = s.split("x").map(Number);
      expect(w % 16).toBe(0);
      expect(h % 16).toBe(0);
    }
    expect(editSizeFor("gpt-image-1", 4032, 3024)).toBe("auto");
    expect(wantsInputFidelity("gpt-image-1")).toBe(true);
    expect(wantsInputFidelity("gpt-image-1.5")).toBe(true);
    expect(wantsInputFidelity("gpt-image-1-mini")).toBe(false);
    expect(wantsInputFidelity("gpt-image-2")).toBe(false);
  });

  it("staging input photos are auto-rotated from EXIF and capped at 2048 px", async () => {
    const sharp = (await import("sharp")).default;
    const { prepareInputPhoto } = await import("@/lib/tools/definitions/virtual-staging");
    // a 3000×1000 landscape image stored with EXIF orientation 6 (rotate 90°) is a 1000×3000 portrait on screen
    const raw = await sharp({ create: { width: 3000, height: 1000, channels: 3, background: "#c8b89a" } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    const out = await prepareInputPhoto(raw, "image/jpeg");
    expect(out.mime).toBe("image/jpeg");
    expect(out.width).toBe(683);
    expect(out.height).toBe(2048);
    const meta = await sharp(out.data).metadata();
    expect([meta.width, meta.height]).toEqual([683, 2048]);
    expect(meta.orientation === undefined || meta.orientation === 1).toBe(true);
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
    expect(checkFairHousing("A quiet street for mature adults only").length).toBe(1); // overlapping rules collapse to one span
    expect(checkFairHousing("Quartz island and a covered patio.")).toEqual([]);
    expect(checkFairHousing("Mature maples shade the deck; corner of Christiansen Ave.")).toEqual([]);
    // style-only phrases advise but never block a delivery
    expect(checkFairHousing("Master bedroom with a walk-in closet")).toEqual([]);
    const matches = findFairHousingMatches("Perfect for families. Master suite upstairs. No kids.");
    expect(matches.map((m) => [m.text, m.rule.severity])).toEqual([
      ["Perfect for families", "risk"],
      ["Master suite", "style"],
      ["No kids", "risk"],
    ]);
    expect(matches[0].start).toBe(0);
    expect(matches[0].end).toBe("Perfect for families".length);
    for (const m of matches) expect(m.rule.hint.length).toBeGreaterThan(10);
  });
});
