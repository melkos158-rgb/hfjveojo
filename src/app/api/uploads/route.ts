import { putFile } from "@/lib/storage";
import { sniffImage, safeFileName } from "@/lib/security/files";
import { errorResponse, AppError } from "@/lib/errors";
import { rateLimit, ipHash } from "@/lib/security/ratelimit";
import { getSession } from "@/lib/auth/session";
import { assertContentLength, MAX_FORM_BYTES } from "@/lib/security/http";

/** Small image uploads (logos). Content is sniffed, size-capped, stored with a retention window. */
export async function POST(req: Request) {
  try {
    await rateLimit({ key: `upload:${ipHash(req)}`, limit: 20, windowSeconds: 600 });
    assertContentLength(req, MAX_FORM_BYTES);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new AppError("No file", 400, "no_file");
    const buf = Buffer.from(await file.arrayBuffer());
    const { mime, ext } = sniffImage(buf);
    const session = await getSession();
    const row = await putFile({ kind: "INPUT", name: safeFileName(file.name || `logo.${ext}`, ext), mime, data: buf, userId: session?.id ?? null });
    return Response.json({ fileId: row.id, name: row.name, sizeBytes: row.sizeBytes });
  } catch (err) {
    return errorResponse(err);
  }
}
