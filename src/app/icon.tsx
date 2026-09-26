import { readFile } from "node:fs/promises";
import path from "node:path";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * Favicon: the official ORVIONIS mark (transparent, cropped to the drawing), prepared from the owner's master file —
 * see docs/BRAND.md. /favicon.ico (16/32/48) carries the same mark for browsers that ask for it directly.
 */
export default async function Icon() {
  const png = await readFile(path.join(process.cwd(), "public", "brand", "favicon-64.png"));
  return new Response(new Uint8Array(png), { headers: { "Content-Type": contentType } });
}
