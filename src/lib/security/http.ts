import { AppError } from "@/lib/errors";

/**
 * Body-size guard for route handlers. `req.json()` has no limit of its own, so a large body would be
 * buffered in memory before validation. Checks Content-Length first; when absent, reads with a cap.
 */
export const MAX_JSON_BYTES = 64 * 1024; // intake forms, auth, events
export const MAX_FORM_BYTES = 3 * 1024 * 1024; // logo uploads (MAX_IMAGE_BYTES + multipart overhead)

export function assertContentLength(req: Request, maxBytes: number): void {
  const len = Number(req.headers.get("content-length"));
  if (Number.isFinite(len) && len > maxBytes) {
    throw new AppError(`Request body too large (max ${Math.round(maxBytes / 1024)} KB)`, 413, "payload_too_large");
  }
}

/** Parse a JSON body with a hard size cap (works with and without Content-Length). */
export async function readJsonBody<T = unknown>(req: Request, maxBytes = MAX_JSON_BYTES): Promise<T> {
  assertContentLength(req, maxBytes);
  const text = await req.text();
  if (text.length > maxBytes) throw new AppError(`Request body too large (max ${Math.round(maxBytes / 1024)} KB)`, 413, "payload_too_large");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AppError("Malformed JSON body", 400, "bad_json");
  }
}
