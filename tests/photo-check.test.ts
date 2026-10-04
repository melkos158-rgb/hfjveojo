import { describe, expect, it } from "vitest";
import path from "node:path";
import sharp from "sharp";
import { PHOTO_CHECK, photoIssueText, photoIssues, photoStats } from "@/lib/photo-check";

/** Deterministic grey texture with sharp edges (a stand-in for a detailed, in-focus photo). */
function texture(w: number, h: number, gain = 1): Uint8ClampedArray {
  const out = new Uint8ClampedArray(w * h * 4);
  let seed = 12345;
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // 8 px tiles of random grey plus a little noise: hard edges between tiles
      const tile = ((Math.floor(x / 8) * 73856093) ^ (Math.floor(y / 8) * 19349663)) & 255;
      const v = Math.min(255, (tile * 0.8 + rand() * 40) * gain);
      const p = (y * w + x) * 4;
      out[p] = out[p + 1] = out[p + 2] = v;
      out[p + 3] = 255;
    }
  }
  return out;
}

/** Box blur, repeated: a stand-in for an out-of-focus photo. */
function blur(src: Uint8ClampedArray, w: number, h: number, passes: number): Uint8ClampedArray {
  let a = src;
  for (let k = 0; k < passes; k++) {
    const b = new Uint8ClampedArray(a.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let s = 0;
        let n = 0;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const xx = Math.min(w - 1, Math.max(0, x + dx));
            const yy = Math.min(h - 1, Math.max(0, y + dy));
            s += a[(yy * w + xx) * 4];
            n++;
          }
        }
        const p = (y * w + x) * 4;
        b[p] = b[p + 1] = b[p + 2] = s / n;
        b[p + 3] = 255;
      }
    }
    a = b;
  }
  return a;
}

/** Decode a real photo the way the browser check sees it: at most 512 px on the long edge, RGBA. */
async function realPhoto(file: string, edit?: (img: sharp.Sharp) => sharp.Sharp) {
  const src = path.join(process.cwd(), "public", "img", file);
  const meta = await sharp(src).metadata();
  let img = sharp(src);
  if (edit) img = edit(img);
  const raw = await sharp(await img.toBuffer())
    .resize({ width: PHOTO_CHECK.maxSide, height: PHOTO_CHECK.maxSide, fit: "inside", kernel: "lanczos3" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const stats = photoStats(raw.info.width, raw.info.height, raw.data);
  return { stats, issues: photoIssues({ width: meta.width ?? 0, height: meta.height ?? 0, stats }) };
}

describe("photo upload check", () => {
  it("passes a sharp, bright photo and flags a blurred, a dark and a small one", () => {
    const w = 400;
    const h = 300;
    const sharpTex = texture(w, h);
    const ok = photoStats(w, h, sharpTex);
    expect(photoIssues({ width: 2000, height: 1500, stats: ok })).toEqual([]);

    const soft = photoStats(w, h, blur(sharpTex, w, h, 3));
    expect(soft.sharpness).toBeLessThan(PHOTO_CHECK.minSharpness);
    expect(photoIssues({ width: 2000, height: 1500, stats: soft })).toEqual(["blurry"]);

    // dark but in focus: the contrast stretch keeps it from reading as blurry
    const dim = photoStats(w, h, texture(w, h, 0.25));
    expect(dim.meanLuma).toBeLessThan(PHOTO_CHECK.darkMeanLuma);
    expect(photoIssues({ width: 2000, height: 1500, stats: dim })).toEqual(["dark"]);

    expect(photoIssues({ width: 640, height: 480, stats: ok })).toEqual(["small"]);
  });

  it("scores a featureless frame as not sharp instead of dividing by zero", () => {
    const flat = new Uint8ClampedArray(64 * 48 * 4).fill(200);
    const s = photoStats(64, 48, flat);
    expect(s.sharpness).toBe(0);
    expect(s.meanLuma).toBeCloseTo(200 / 255, 2);
  });

  it("passes the real empty-room photos on the site and flags blurred or darkened copies of them", async () => {
    for (const file of ["sample-staging-before.jpg", "styles/living-room-empty.webp"]) {
      const real = await realPhoto(file);
      expect(real.issues, file).toEqual([]);
      expect(real.stats.sharpness, file).toBeGreaterThan(PHOTO_CHECK.minSharpness * 2);

      const blurred = await realPhoto(file, (img) => img.blur(4));
      expect(blurred.issues, `${file} blurred`).toContain("blurry");

      const darkened = await realPhoto(file, (img) => img.linear(0.3, 0));
      expect(darkened.issues, `${file} darkened`).toEqual(["dark"]);
    }
  });

  it("explains each warning in plain words, with the photo's size for a small one", () => {
    expect(photoIssueText("small", 640, 480)).toContain("640 × 480 px");
    expect(photoIssueText("dark", 0, 0)).toContain("lights on");
    expect(photoIssueText("blurry", 0, 0)).toContain("can't sharpen");
  });
});
