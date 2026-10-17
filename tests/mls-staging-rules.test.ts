import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { GUIDES } from "@/config/guides";
import { DISCLOSURE_LABEL, MLS_RULES, ORIGINAL_LABEL, boardsDisclosingIn, boardsRequiringOriginal } from "@/content/mls-staging-rules";

describe("MLS staging rules table", () => {
  it("has one row per board, each with a source, a check date and its rule in words", () => {
    expect(MLS_RULES.length).toBeGreaterThanOrEqual(10);
    expect(new Set(MLS_RULES.map((r) => r.slug)).size).toBe(MLS_RULES.length);
    for (const r of MLS_RULES) {
      expect(r.source.url, r.slug).toMatch(/^https:\/\//);
      for (const s of r.extraSources ?? []) expect(s.url, r.slug).toMatch(/^https:\/\//);
      expect(r.checked, r.slug).toMatch(/^2026-\d{2}-\d{2}$/);
      expect(r.discloseText.length, r.slug).toBeGreaterThan(10);
      expect(r.originalText.length, r.slug).toBeGreaterThan(5);
      for (const d of r.disclose) expect(Object.keys(DISCLOSURE_LABEL), r.slug).toContain(d);
      expect(Object.keys(ORIGINAL_LABEL), r.slug).toContain(r.original);
      if (r.guide) expect(existsSync(path.join(process.cwd(), "src/app", r.guide, "page.tsx")), `${r.slug} → ${r.guide}`).toBe(true);
    }
  });

  it("groups boards by where they disclose and whether the original must follow, from the rows", () => {
    expect(boardsDisclosingIn("photo").every((r) => r.disclose.includes("photo"))).toBe(true);
    expect(boardsRequiringOriginal().map((r) => r.slug)).toEqual(MLS_RULES.filter((r) => r.original === "required").map((r) => r.slug));
    // Stellar bans words on photos, so it must never be grouped with the on-photo boards.
    expect(boardsDisclosingIn("photo").some((r) => r.slug === "stellar")).toBe(false);
  });

  it("is listed as a guide whose title counts the rows, and the page reads the table instead of hard-coding it", () => {
    const guide = GUIDES.find((g) => g.slug === "virtual-staging-rules-by-mls");
    expect(guide?.title).toContain(`${MLS_RULES.length} boards`);
    const page = readFileSync(path.join(process.cwd(), "src/app/guides/virtual-staging-rules-by-mls/page.tsx"), "utf8");
    expect(page).toContain("MLS_RULES.map");
    expect(page).not.toMatch(/what \d+ boards/);
  });
});
