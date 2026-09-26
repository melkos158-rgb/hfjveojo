import { createHmac } from "node:crypto";
import { prisma } from "@/lib/db";
import { RateLimitedError } from "@/lib/errors";
import { env } from "@/lib/env";

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

/** The visitor's IP as seen through Railway's proxy. Never store it: use `ipHash` for rate-limit keys and analytics. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0] : req.headers.get("x-real-ip")) || "0.0.0.0";
  return ip.trim();
}

/**
 * Keyed, truncated hash of an IP address (HMAC-SHA256 with the server's SIGNING_SECRET, 128 bits). The same IP always
 * gives the same value, so rate limits and abuse checks still work, but without the secret the value can't be turned
 * back into the address (a plain SHA-256 of an IPv4 address can be reversed by trying all 2^32 addresses). This is
 * what the privacy policy promises: IP addresses are stored only as a hash.
 */
export function hashIp(ip: string): string {
  return createHmac("sha256", env().SIGNING_SECRET).update(`ip-v1:${ip.trim()}`).digest("hex").slice(0, 32);
}

export function ipHash(req: Request): string {
  return hashIp(clientIp(req));
}

/** Opportunistic cleanup of old windows; call from the worker. */
export async function pruneRateLimits(olderThanHours = 24): Promise<number> {
  const res = await prisma.rateLimit.deleteMany({
    where: { windowStart: { lt: new Date(Date.now() - olderThanHours * 3600 * 1000) } },
  });
  return res.count;
}

/**
 * IP addresses have been stored only as keyed hashes since this moment. Older analytics events carry a plain SHA-256
 * of the IP (reversible for IPv4 by trying every address) and older rate-limit rows use the raw address in their key.
 * The hourly maintenance drops both for a week after the switch; after that there is nothing left to drop.
 */
export const KEYED_IP_HASH_SINCE = new Date("2026-09-26T22:00:00Z");

export async function dropLegacyIpData(now: Date = new Date()): Promise<{ events: number; rateLimits: number }> {
  if (now.getTime() > KEYED_IP_HASH_SINCE.getTime() + 7 * 24 * 3600 * 1000) return { events: 0, rateLimits: 0 };
  const cutoff = now < KEYED_IP_HASH_SINCE ? now : KEYED_IP_HASH_SINCE;
  const events = await prisma.event.updateMany({ where: { createdAt: { lt: cutoff }, ipHash: { not: null } }, data: { ipHash: null } });
  // Resetting these counters once is harmless: they only exist to slow down abuse.
  const rateLimits = await prisma.rateLimit.deleteMany({ where: { windowStart: { lt: cutoff } } });
  return { events: events.count, rateLimits: rateLimits.count };
}
