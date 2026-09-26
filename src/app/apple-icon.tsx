import { readFile } from "node:fs/promises";
import path from "node:path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon (iOS/Android): the official mark on the brand background #08090D (iOS does not allow transparency). */
export default async function AppleIcon() {
  const png = await readFile(path.join(process.cwd(), "public", "brand", "apple-touch-icon.png"));
  return new Response(new Uint8Array(png), { headers: { "Content-Type": contentType } });
}
