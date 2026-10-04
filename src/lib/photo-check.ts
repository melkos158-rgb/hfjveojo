/**
 * Upload check for room photos (virtual staging): warns before payment when a photo is likely to stage badly. It never
 * blocks an order — the customer can replace the photo or go ahead. Runs in the browser on a copy downscaled to
 * PHOTO_CHECK.maxSide; nothing extra is uploaded or stored.
 *
 * Thresholds come from 11 real empty-room photos (the 3–4 Oct lab sources and stock photos), measured at 512 px:
 *  - sharpness (Laplacian variance of the luma stretched to its 1st–99th percentile): sharp originals 420–1214; a
 *    Gaussian blur of 1.5 px per 1000 px 65–164; 2 px per 1000 px 33–84. Stretching first keeps dark or low-contrast
 *    photos from reading as blurry (35 % brightness changed the score by under 5 %).
 *  - mean luma (Rec. 709 on the encoded values, 0–1): originals 0.52–0.76; the same photos at 35 % brightness 0.18–0.26.
 *  - size: the lab staged a 480 px photo cleanly, so "small" only warns below 800 px on the long edge.
 */
export type PhotoIssue = "small" | "dark" | "blurry";

export const PHOTO_CHECK = { maxSide: 512, minLongEdge: 800, darkMeanLuma: 0.3, minSharpness: 100 } as const;

export type PhotoStats = { meanLuma: number; sharpness: number };

/** Mean luma (0–1) and contrast-normalised sharpness of an RGBA pixel buffer (already downscaled). */
export function photoStats(width: number, height: number, rgba: ArrayLike<number>): PhotoStats {
  const n = width * height;
  if (n <= 0) return { meanLuma: 0, sharpness: 0 };
  const luma = new Float32Array(n);
  const hist = new Uint32Array(256);
  let sum = 0;
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const v = 0.2126 * rgba[p] + 0.7152 * rgba[p + 1] + 0.0722 * rgba[p + 2];
    luma[i] = v;
    sum += v;
    hist[Math.min(255, Math.round(v))]++;
  }
  const percentile = (q: number) => {
    const target = q * n;
    let acc = 0;
    for (let v = 0; v < 256; v++) {
      acc += hist[v];
      if (acc >= target) return v;
    }
    return 255;
  };
  const lo = percentile(0.01);
  const hi = percentile(0.99);
  // A featureless frame (one flat colour) has nothing to judge sharpness by; it scores 0.
  if (hi - lo < 8 || width < 3 || height < 3) return { meanLuma: sum / n / 255, sharpness: 0 };
  const scale = 255 / (hi - lo);
  const stretched = new Float32Array(n);
  for (let i = 0; i < n; i++) stretched[i] = Math.min(255, Math.max(0, (luma[i] - lo) * scale));
  let s1 = 0;
  let s2 = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap = stretched[i - 1] + stretched[i + 1] + stretched[i - width] + stretched[i + width] - 4 * stretched[i];
      s1 += lap;
      s2 += lap * lap;
      count++;
    }
  }
  const mean = s1 / count;
  return { meanLuma: sum / n / 255, sharpness: s2 / count - mean * mean };
}

/** Which warnings a photo gets. `width`/`height` are the photo's own size, not the downscaled copy's. */
export function photoIssues(p: { width: number; height: number; stats: PhotoStats }): PhotoIssue[] {
  const issues: PhotoIssue[] = [];
  if (Math.max(p.width, p.height) < PHOTO_CHECK.minLongEdge) issues.push("small");
  if (p.stats.meanLuma < PHOTO_CHECK.darkMeanLuma) issues.push("dark");
  if (p.stats.sharpness < PHOTO_CHECK.minSharpness) issues.push("blurry");
  return issues;
}

/** The note shown under the photo in the order form. */
export function photoIssueText(issue: PhotoIssue, width: number, height: number): string {
  switch (issue) {
    case "small":
      return `Small photo (${width} × ${height} px). It will still be staged, but details may look soft — the original from the camera or the listing gives a sharper result.`;
    case "dark":
      return "This photo is quite dark. Staging keeps the photo's own light, so the furniture will look dark too — a brighter shot (lights on, blinds open) stages better.";
    case "blurry":
      return "This photo looks blurry. Staging can't sharpen it, so the room will stay soft — a steadier shot stages better.";
  }
}
