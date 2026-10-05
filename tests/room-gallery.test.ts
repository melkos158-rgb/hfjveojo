import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ROOM_EXAMPLES } from "@/content/room-examples";
import { ROOM_TYPES } from "@/lib/tools/definitions/virtual-staging";

const file = (src: string) => path.join(process.cwd(), "public", src.replace(/^\//, ""));

describe("room gallery on the which-rooms guide", () => {
  it("shows five distinct rooms, each a room type the order form sells", () => {
    expect(ROOM_EXAMPLES).toHaveLength(5);
    expect(new Set(ROOM_EXAMPLES.map((r) => r.key)).size).toBe(5);
    for (const r of ROOM_EXAMPLES) expect(ROOM_TYPES as readonly string[]).toContain(r.roomType);
  });

  it("has every image on disk at the size it declares, with alt text", async () => {
    for (const r of ROOM_EXAMPLES) {
      for (const img of [r.before, r.after]) {
        expect(fs.existsSync(file(img.src)), img.src).toBe(true);
        const meta = await sharp(file(img.src)).metadata();
        expect([meta.width, meta.height], img.src).toEqual([img.width, img.height]);
        expect(img.alt.length, img.src).toBeGreaterThan(20);
        expect(fs.statSync(file(img.src)).size, img.src).toBeLessThan(250 * 1024);
      }
      expect(fs.existsSync(file(r.thumb)), r.thumb).toBe(true);
    }
  });

  it("says what was added and what stayed for each room, and credits the stock photo", () => {
    for (const r of ROOM_EXAMPLES) {
      expect(r.added.length, r.key).toBeGreaterThan(10);
      expect(r.kept.length, r.key).toBeGreaterThan(10);
      expect(r.pexelsId, r.key).toBeGreaterThan(0);
    }
  });
});
