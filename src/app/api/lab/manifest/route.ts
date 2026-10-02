import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/errors";
import { signedFileUrl } from "@/lib/storage";
import { ipHash, rateLimit } from "@/lib/security/ratelimit";
import { LAB_SETTING, labManifest, parseLabRecord } from "@/lib/ops/lab";
import { LAB_REQUESTS } from "@/content/lab-requests";

export const dynamic = "force-dynamic";

/**
 * The marketing lab's finished runs (stock photos staged in production, src/lib/ops/lab.ts) as a JSON list of
 * {name, url} with week-long signed download links, read by the media bridge. Lists lab files only — never orders.
 */
export async function GET(req: Request) {
  try {
    await rateLimit({ key: `lab-manifest:${ipHash(req)}`, limit: 30, windowSeconds: 3600 });
    const row = await prisma.setting.findUnique({ where: { key: LAB_SETTING } });
    const list = labManifest(parseLabRecord(row?.value), LAB_REQUESTS, (fileId) => signedFileUrl(fileId, 7 * 24 * 3600));
    return Response.json(list, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}
