import { beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { resetDatabase } from "./helpers";
import { KEYED_IP_HASH_SINCE, dropLegacyIpData, hashIp, ipHash } from "@/lib/security/ratelimit";
import { referrerOrigin } from "@/lib/analytics/attribution";
import { assertPreviewQuota } from "@/lib/tools/preview";

/** What the privacy policy promises about IP addresses and referrers, checked against the code. */
describe("privacy: IP addresses are stored only as keyed hashes", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("hashes with the server secret: stable, 128-bit, and not the plain (reversible) SHA-256", () => {
    const h = hashIp("203.0.113.7");
    expect(h).toMatch(/^[0-9a-f]{32}$/);
    expect(hashIp("203.0.113.7")).toBe(h);
    expect(hashIp(" 203.0.113.7 ")).toBe(h);
    expect(hashIp("203.0.113.8")).not.toBe(h);
    expect(h).not.toBe(createHash("sha256").update("203.0.113.7").digest("hex").slice(0, 32));
  });

  it("reads the first X-Forwarded-For address of the request", () => {
    const req = new Request("https://orvionis.com/api/events", { headers: { "x-forwarded-for": "198.51.100.4, 10.0.0.1" } });
    expect(ipHash(req)).toBe(hashIp("198.51.100.4"));
  });

  it("rate-limit rows never contain the raw address (free preview quota)", async () => {
    await assertPreviewQuota("192.0.2.77");
    const rows = await prisma.rateLimit.findMany({ select: { key: true } });
    expect(rows.map((r) => r.key)).toContain(`preview:${hashIp("192.0.2.77")}`);
    expect(rows.some((r) => r.key.includes("192.0.2.77"))).toBe(false);
  });

  it("maintenance drops the older unkeyed hashes and raw-IP rate-limit rows, then stops after a week", async () => {
    const before = new Date(KEYED_IP_HASH_SINCE.getTime() - 3600_000);
    const after = new Date(KEYED_IP_HASH_SINCE.getTime() + 3600_000);
    await prisma.event.create({ data: { name: "page_view", ipHash: "legacy-hash", createdAt: before } });
    await prisma.event.create({ data: { name: "page_view", ipHash: hashIp("192.0.2.1"), createdAt: after } });
    await prisma.rateLimit.create({ data: { key: "auth:192.0.2.1", windowStart: before, count: 1 } });

    const res = await dropLegacyIpData(new Date(KEYED_IP_HASH_SINCE.getTime() + 2 * 3600_000));
    expect(res.events).toBe(1);
    expect(res.rateLimits).toBeGreaterThanOrEqual(1);
    const events = await prisma.event.findMany({ orderBy: { createdAt: "asc" }, select: { ipHash: true } });
    expect(events.map((e) => e.ipHash)).toEqual([null, hashIp("192.0.2.1")]);
    expect(await prisma.rateLimit.count({ where: { key: "auth:192.0.2.1" } })).toBe(0);

    expect(await dropLegacyIpData(new Date(KEYED_IP_HASH_SINCE.getTime() + 8 * 24 * 3600_000))).toEqual({ events: 0, rateLimits: 0 });
  });
});

describe("privacy: referrers are kept as the site only", () => {
  it("drops the path and query of the referring page", () => {
    expect(referrerOrigin("https://www.google.com/search?q=jane+doe+email")).toBe("https://www.google.com");
    expect(referrerOrigin("http://example.org/some/path#frag")).toBe("http://example.org");
  });

  it("ignores empty, malformed and non-web referrers", () => {
    expect(referrerOrigin(null)).toBeNull();
    expect(referrerOrigin("")).toBeNull();
    expect(referrerOrigin("not a url")).toBeNull();
    expect(referrerOrigin("android-app://com.google.android.gm/")).toBeNull();
  });
});
