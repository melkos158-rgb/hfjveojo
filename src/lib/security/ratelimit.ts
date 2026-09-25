import { prisma } from "@/lib/db";
import { RateLimitedError } from "@/lib/errors";
import { sha256 } from "@/lib/security/tokens";

/**
 * Database-backed fixed-window rate limiter. Good enough for a single-region app with modest traffic;
 * swap for Redis/Upstash when requests/second matter.
 */
export async function rateLimit(opts: { key: string; limit: number; windowSeconds: number }): Promise<void> {
  const windowStart = new Date(Math.floor(Date.now() / (opts.windowSeconds * 1000)) * opts.windowSeconds * 1000);
  const row = await prisma.rateLimit.upsert({
    where: { key_windowStart: { key: opts.key, windowStart } },
    create: { key: opts.key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });
  if (row.count > opts.limit) throw new RateLimitedError();
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0] : req.headers.get("x-real-ip")) || "0.0.0.0";
  return ip.trim();
}

export function ipHash(req: Request): string {
  return sha256(clientIp(req)).slice(0, 32);
}

/** Opportunistic cleanup of old windows; call from the worker. */
export async function pruneRateLimits(olderThanHours = 24): Promise<number> {
  const res = await prisma.rateLimit.deleteMany({
    where: { windowStart: { lt: new Date(Date.now() - olderThanHours * 3600 * 1000) } },
  });
  return res.count;
}
