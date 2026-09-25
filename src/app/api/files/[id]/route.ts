import { getFileBuffer, verifyFileToken } from "@/lib/storage";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

/** Serves a stored file when the signed token is valid (or the viewer is an admin). */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const t = new URL(req.url).searchParams.get("t") ?? "";
  const session = await getSession();
  if (!verifyFileToken(id, t) && !isAdmin(session)) return new Response("Forbidden", { status: 403 });
  const res = await getFileBuffer(id);
  if (!res) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(res.data), {
    headers: {
      "Content-Type": res.file.mime,
      "Content-Length": String(res.data.length),
      "Content-Disposition": `attachment; filename="${res.file.name.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
