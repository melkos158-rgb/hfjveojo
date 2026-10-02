import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { STYLE_GALLERY } from "@/lib/tools/samples/virtual-staging";
import { STYLES } from "@/lib/tools/definitions/virtual-staging";
import { GUIDES } from "@/config/guides";

describe("style gallery (one room, six styles)", () => {
  it("shows every style the tool sells, in the order of the style picker", () => {
    expect(STYLE_GALLERY.styles.map((s) => s.label.toLowerCase())).toEqual([...STYLES]);
  });

  it("points at real files under public/ with alt text", () => {
    for (const img of [STYLE_GALLERY.before, ...STYLE_GALLERY.styles.map((s) => s.image)]) {
      expect(existsSync(join(process.cwd(), "public", img.src))).toBe(true);
      expect(existsSync(join(process.cwd(), "public", img.thumb))).toBe(true);
      expect(img.alt.length).toBeGreaterThan(40);
    }
  });

  it("links to a published guide", () => {
    const slug = STYLE_GALLERY.link?.href.replace("/guides/", "");
    expect(GUIDES.some((g) => g.slug === slug)).toBe(true);
    expect(existsSync(join(process.cwd(), "src/app/guides", slug ?? "-", "page.tsx"))).toBe(true);
  });
});
