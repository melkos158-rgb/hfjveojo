import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/guards";
import { clientIp } from "@/lib/security/ratelimit";

export const dynamic = "force-dynamic";

/**
 * Admin diagnostic: how the hosting proxy passes the client address — the shape only, never an IP value.
 * Call it with `X-Forwarded-For: <test value>` and `X-Orv-Probe: <same value>`: if the test value comes out as the
 * address the rate limits use, visitors could fake their IP and dodge per-IP limits.
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!isAdmin(session)) return new Response("Not found", { status: 404 });
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
  const probe = req.headers.get("x-orv-probe") ?? "";
  const realIp = req.headers.get("x-real-ip");
  const used = clientIp(req);
  return Response.json(
    {
      xffCount: parts.length,
      firstIsProbe: probe ? parts[0] === probe : null,
      lastIsProbe: probe ? parts[parts.length - 1] === probe : null,
      realIpPresent: Boolean(realIp),
      realIpIsProbe: probe && realIp ? realIp === probe : null,
      realIpEqualsLastXff: realIp ? realIp === parts[parts.length - 1] : null,
      proxyHeaders: ["x-envoy-external-address", "cf-connecting-ip", "true-client-ip", "fly-client-ip", "x-railway-edge", "x-railway-request-id"].filter((h) => req.headers.get(h)),
      rateLimitIpIsProbe: probe ? used === probe : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
