import { PHOTO_CHECK, photoIssues, photoStats, type PhotoIssue } from "@/lib/photo-check";

export type PhotoCheckResult = { issues: PhotoIssue[]; width: number; height: number };

/**
 * Runs the upload check (src/lib/photo-check.ts) on a photo the visitor picked: decodes it in the browser, draws a copy
 * at most PHOTO_CHECK.maxSide px on its long edge and measures that. Returns null when the browser can't decode the
 * file, so an unusual format gets no warning rather than a wrong one.
 */
export async function checkPhotoFile(file: Blob): Promise<PhotoCheckResult | null> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return null;
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, PHOTO_CHECK.maxSide / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);
    const stats = photoStats(w, h, ctx.getImageData(0, 0, w, h).data);
    return { issues: photoIssues({ width, height, stats }), width, height };
  } catch {
    return null;
  } finally {
    bitmap?.close();
  }
}
