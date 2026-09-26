import { AppError } from "@/lib/errors";

/**
 * Upload validation: never trust the client's declared MIME type. Sniff magic bytes and enforce size caps.
 * V1 accepts small images only (logos for branded documents). Videos are accepted as links, not uploads.
 */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB — room photos for staging; logos are far smaller

const signatures: Array<{ mime: string; ext: string; test: (b: Buffer) => boolean }> = [
  { mime: "image/png", ext: "png", test: (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: "image/jpeg", ext: "jpg", test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/webp", ext: "webp", test: (b) => b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
];

export function sniffImage(buf: Buffer): { mime: string; ext: string } {
  if (buf.length === 0) throw new AppError("Empty file", 400, "empty_file");
  if (buf.length > MAX_IMAGE_BYTES) throw new AppError("Image larger than 8 MB", 413, "file_too_large");
  const hit = signatures.find((s) => s.test(buf));
  if (!hit) throw new AppError("Only PNG, JPEG or WebP images are accepted", 415, "unsupported_type");
  return hit;
}

export function safeFileName(name: string, fallbackExt: string): string {
  const base = name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 80);
  return base.includes(".") ? base : `${base || "file"}.${fallbackExt}`;
}

/** Accept only http(s) links from known video hosts / file-sharing services for concierge intake. */
const allowedVideoHosts = [
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  "drive.google.com",
  "dropbox.com",
  "wetransfer.com",
  "we.tl",
  "icloud.com",
  "onedrive.live.com",
  "1drv.ms",
  "instagram.com",
  "tiktok.com",
  "facebook.com",
  "fb.watch",
  "zillow.com",
  "realtor.com",
  "redfin.com",
];

export function validateVideoLink(url: string): string {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    throw new AppError("Please paste a full link starting with https://", 400, "invalid_link");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new AppError("Link must be http(s)", 400, "invalid_link");
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const ok = allowedVideoHosts.some((h) => host === h || host.endsWith(`.${h}`));
  if (!ok) {
    throw new AppError(
      "Please share the video via YouTube (unlisted), Google Drive, Dropbox, WeTransfer, Vimeo or a listing page link",
      400,
      "unsupported_host",
    );
  }
  return u.toString();
}
