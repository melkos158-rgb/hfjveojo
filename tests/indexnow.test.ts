import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  INDEXNOW_ENDPOINT,
  INDEXNOW_KEY,
  INDEXNOW_RETRY_MS,
  INDEXNOW_SETTING,
  indexNowPayload,
  indexNowUrls,
  keyFileLive,
  RETIRED_PATHS,
  maybeSubmitIndexNow,
  publicOrigin,
  shouldSubmit,
  submitIndexNow,
  validIndexNowKey,
  type IndexNowRecord,
} from "@/lib/seo/indexnow";
import { CONTENT_UPDATED, contentVersion, guideLastModified, PAGE_UPDATED, pageLastModified, sitemapEntries } from "@/lib/seo/sitemap-entries";
import sitemap from "@/app/sitemap";
import { GUIDES } from "@/config/guides";

const APP = "https://orvionis.com";
const KEY_URL = `${APP}/${INDEXNOW_KEY}.txt`;
const VERSION = contentVersion().toISOString();

function fakeDb(initial: IndexNowRecord | null = null) {
  let value: IndexNowRecord | null = initial;
  const writes: IndexNowRecord[] = [];
  return {
    writes,
    current: () => value,
    setting: {
      findUnique: async ({ where }: { where: { key: string } }) => (where.key === INDEXNOW_SETTING && value ? { value } : null),
      upsert: async (args: { where: { key: string }; create: { key: string; value: IndexNowRecord } }) => {
        expect(args.where.key).toBe(INDEXNOW_SETTING);
        value = args.create.value;
        writes.push(value);
        return value;
      },
    },
  };
}

function fakeFetch(opts: { keyBody?: string; keyStatus?: number; submitStatus?: number; submitThrows?: boolean; keyThrows?: boolean } = {}) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const impl = async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (url === INDEXNOW_ENDPOINT) {
      if (opts.submitThrows) throw new Error("network down");
      return { status: opts.submitStatus ?? 202, text: async () => "" };
    }
    if (opts.keyThrows) throw new Error("timeout");
    return { status: opts.keyStatus ?? 200, text: async () => opts.keyBody ?? `${INDEXNOW_KEY}\n` };
  };
  return { impl, calls };
}

const prod = (extra: Partial<Parameters<typeof maybeSubmitIndexNow>[0]> = {}) => ({ disabled: false, appEnv: "production", appUrl: APP, ...extra });

describe("indexnow: key and key file", () => {
  it("serves the key at the site root as a plain file (public/<key>.txt)", () => {
    const file = path.join(process.cwd(), "public", `${INDEXNOW_KEY}.txt`);
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, "utf8")).toBe(INDEXNOW_KEY);
  });

  it("uses a key the protocol accepts (8–128 of a–z, A–Z, 0–9, dash)", () => {
    expect(validIndexNowKey(INDEXNOW_KEY)).toBe(true);
    expect(validIndexNowKey("short")).toBe(false);
    expect(validIndexNowKey("has space in it")).toBe(false);
    expect(validIndexNowKey("x".repeat(129))).toBe(false);
  });
});

describe("indexnow: payload", () => {
  it("speaks only for a public https host", () => {
    expect(publicOrigin(APP)?.hostname).toBe("orvionis.com");
    expect(publicOrigin("http://orvionis.com")).toBeNull();
    expect(publicOrigin("https://localhost:3000")).toBeNull();
    expect(publicOrigin("https://127.0.0.1")).toBeNull();
    expect(publicOrigin("https://intranet")).toBeNull();
    expect(publicOrigin("not a url")).toBeNull();
    expect(publicOrigin(undefined)).toBeNull();
  });

  it("builds host, key location and a de-duplicated same-host URL list", () => {
    const p = indexNowPayload(APP, [`${APP}/`, `${APP}/pricing`, `${APP}/pricing`, "https://www.orvionis.com/tools", "http://orvionis.com/free", "https://example.com/x", "bad"]);
    expect(p).toEqual({ host: "orvionis.com", key: INDEXNOW_KEY, keyLocation: KEY_URL, urlList: [`${APP}/`, `${APP}/pricing`] });
  });

  it("returns nothing to send for local setups or an empty list", () => {
    expect(indexNowPayload("http://localhost:3000", ["http://localhost:3000/"])).toBeNull();
    expect(indexNowPayload(APP, ["https://example.com/"])).toBeNull();
    expect(indexNowPayload(APP, [`${APP}/`], "bad key")).toBeNull();
  });
});

describe("indexnow: when to submit", () => {
  const now = new Date("2026-09-27T12:00:00Z");
  const rec = (over: Partial<IndexNowRecord>): IndexNowRecord => ({ version: VERSION, status: 202, ok: true, at: now.toISOString(), count: 21, ...over });

  it("submits a content version once", () => {
    expect(shouldSubmit(null, VERSION, now)).toBe(true);
    expect(shouldSubmit(rec({}), VERSION, now)).toBe(false);
    expect(shouldSubmit(rec({ version: "2026-09-01T00:00:00.000Z" }), VERSION, now)).toBe(true);
  });

  it("retries a failed version at most every 6 hours", () => {
    const failed = rec({ ok: false, status: 429, at: new Date(now.getTime() - INDEXNOW_RETRY_MS + 60_000).toISOString() });
    expect(shouldSubmit(failed, VERSION, now)).toBe(false);
    expect(shouldSubmit({ ...failed, at: new Date(now.getTime() - INDEXNOW_RETRY_MS).toISOString() }, VERSION, now)).toBe(true);
    expect(shouldSubmit({ ...failed, at: "garbage" }, VERSION, now)).toBe(true);
  });
});

describe("indexnow: HTTP", () => {
  it("POSTs the JSON payload to the shared endpoint; 200 and 202 count as accepted", async () => {
    const payload = indexNowPayload(APP, [`${APP}/`])!;
    for (const [status, ok] of [
      [200, true],
      [202, true],
      [400, false],
      [403, false],
      [422, false],
      [429, false],
    ] as const) {
      const f = fakeFetch({ submitStatus: status });
      expect(await submitIndexNow(payload, f.impl)).toEqual({ status, ok });
      expect(f.calls).toHaveLength(1);
      expect(f.calls[0].url).toBe("https://api.indexnow.org/indexnow");
      expect(f.calls[0].init?.method).toBe("POST");
      expect((f.calls[0].init?.headers as Record<string, string>)["content-type"]).toBe("application/json; charset=utf-8");
      expect(JSON.parse(String(f.calls[0].init?.body))).toEqual(payload);
    }
  });

  it("treats the key file as live only when it holds exactly the key", async () => {
    expect(await keyFileLive(KEY_URL, INDEXNOW_KEY, fakeFetch().impl)).toBe(true);
    expect(await keyFileLive(KEY_URL, INDEXNOW_KEY, fakeFetch({ keyBody: "<html>404</html>" }).impl)).toBe(false);
    expect(await keyFileLive(KEY_URL, INDEXNOW_KEY, fakeFetch({ keyStatus: 404 }).impl)).toBe(false);
    expect(await keyFileLive(KEY_URL, INDEXNOW_KEY, fakeFetch({ keyThrows: true }).impl)).toBe(false);
  });
});

describe("indexnow: hourly maintenance step", () => {
  const now = new Date("2026-09-27T12:00:00Z");

  it("does nothing outside production, when disabled, or without a public host", async () => {
    const f = fakeFetch();
    const db = fakeDb();
    expect(await maybeSubmitIndexNow(prod({ disabled: true, db, fetchImpl: f.impl }))).toEqual({ skipped: "disabled" });
    expect(await maybeSubmitIndexNow(prod({ appEnv: "development", db, fetchImpl: f.impl }))).toEqual({ skipped: "not production" });
    expect(await maybeSubmitIndexNow(prod({ appEnv: "staging", db, fetchImpl: f.impl }))).toEqual({ skipped: "not production" });
    expect(await maybeSubmitIndexNow(prod({ appUrl: "http://localhost:3000", db, fetchImpl: f.impl }))).toEqual({ skipped: "no public host" });
    expect(f.calls).toHaveLength(0);
    expect(db.writes).toHaveLength(0);
  });

  it("checks the key file, submits every sitemap URL and the retired old-site pages once, and records the result", async () => {
    const f = fakeFetch();
    const db = fakeDb();
    const expected = indexNowUrls(APP);
    expect(expected).toHaveLength(sitemapEntries(APP).length + RETIRED_PATHS.length);
    const out = await maybeSubmitIndexNow(prod({ db, fetchImpl: f.impl, now }));
    expect(out).toEqual({ submitted: expected.length, status: 202, ok: true });
    expect(f.calls.map((c) => c.url)).toEqual([KEY_URL, INDEXNOW_ENDPOINT]);
    const body = JSON.parse(String(f.calls[1].init?.body));
    expect(body.host).toBe("orvionis.com");
    expect(body.keyLocation).toBe(KEY_URL);
    expect(body.urlList).toEqual(expected);
    expect(body.urlList).toContain(`${APP}/tools/virtual-staging`);
    expect(body.urlList).toContain(`${APP}/guides/virtual-staging-cost`);
    expect(body.urlList).toContain(`${APP}/pl/sklep`);
    expect(body.urlList.every((u: string) => new URL(u).host === "orvionis.com")).toBe(true);
    expect(db.current()).toEqual({ version: VERSION, status: 202, ok: true, at: now.toISOString(), count: expected.length });

    // The next hourly run sends nothing: same content version.
    const again = fakeFetch();
    expect(await maybeSubmitIndexNow(prod({ db, fetchImpl: again.impl, now: new Date(now.getTime() + 3600_000) }))).toEqual({ skipped: "up to date" });
    expect(again.calls).toHaveLength(0);
  });

  it("waits for the key file without recording an attempt", async () => {
    const f = fakeFetch({ keyStatus: 404 });
    const db = fakeDb();
    expect(await maybeSubmitIndexNow(prod({ db, fetchImpl: f.impl, now }))).toEqual({ skipped: "key file not live" });
    expect(f.calls.map((c) => c.url)).toEqual([KEY_URL]);
    expect(db.writes).toHaveLength(0);
  });

  it("records a refusal or a network error and retries it after 6 hours only", async () => {
    const db = fakeDb();
    expect(await maybeSubmitIndexNow(prod({ db, fetchImpl: fakeFetch({ submitStatus: 429 }).impl, now }))).toMatchObject({ status: 429, ok: false });
    expect(db.current()).toMatchObject({ ok: false, status: 429 });

    const soon = fakeFetch();
    expect(await maybeSubmitIndexNow(prod({ db, fetchImpl: soon.impl, now: new Date(now.getTime() + 3600_000) }))).toEqual({ skipped: "up to date" });
    expect(soon.calls).toHaveLength(0);

    const later = new Date(now.getTime() + INDEXNOW_RETRY_MS);
    expect(await maybeSubmitIndexNow(prod({ db, fetchImpl: fakeFetch({ submitThrows: true }).impl, now: later }))).toMatchObject({ status: 0, ok: false });
    expect(db.current()).toMatchObject({ ok: false, status: 0, at: later.toISOString() });
  });
});

describe("indexnow: only what changed after an accepted submission", () => {
  it("sends the URLs newer than the last accepted version, without the retired pages", async () => {
    const older = new Date(contentVersion().getTime() - 24 * 3600_000);
    const db = fakeDb({ version: older.toISOString(), status: 202, ok: true, at: "2026-09-27T12:00:00.000Z", count: 37 });
    const f = fakeFetch();
    const expected = sitemapEntries(APP)
      .filter((e) => (e.lastModified as Date).getTime() > older.getTime())
      .map((e) => e.url);
    expect(expected.length).toBeGreaterThan(0);
    expect(expected.length).toBeLessThan(sitemapEntries(APP).length);
    const out = await maybeSubmitIndexNow(prod({ db, fetchImpl: f.impl, now: new Date("2026-09-28T12:00:00Z") }));
    expect(out).toEqual({ submitted: expected.length, status: 202, ok: true });
    const body = JSON.parse(String(f.calls[1].init?.body));
    expect(body.urlList).toEqual(expected);
    expect(body.urlList).toContain(`${APP}/guides`);
    expect(body.urlList.some((u: string) => u.includes("/pl"))).toBe(false);
    expect(db.current()).toMatchObject({ version: VERSION, ok: true, count: expected.length });
  });

  it("sends everything again when the last attempt was refused", async () => {
    const db = fakeDb({ version: "2026-09-20T00:00:00.000Z", status: 429, ok: false, at: "2026-09-20T00:00:00.000Z", count: 37 });
    const f = fakeFetch();
    const out = await maybeSubmitIndexNow(prod({ db, fetchImpl: f.impl, now: new Date("2026-09-28T12:00:00Z") }));
    expect(out).toMatchObject({ submitted: indexNowUrls(APP).length, ok: true });
  });
});

describe("indexnow: retired old-site pages", () => {
  it("lists only paths that no live page or tool uses", () => {
    const live = new Set(sitemapEntries(APP).map((e) => new URL(e.url).pathname));
    for (const p of RETIRED_PATHS) {
      expect(p.startsWith("/pl") || p.startsWith("/en")).toBe(true);
      expect(live.has(p)).toBe(false);
    }
    expect(indexNowUrls(`${APP}/`)).toEqual(indexNowUrls(APP));
  });
});

describe("sitemap: shared URL list", () => {
  it("serves the same entries IndexNow submits, every guide included", () => {
    const entries = sitemap();
    expect(entries.map((e) => e.url)).toEqual(sitemapEntries().map((e) => e.url));
    for (const g of GUIDES) expect(entries.some((e) => e.url.endsWith(`/guides/${g.slug}`))).toBe(true);
  });

  it("dates guides by their own update day, the hub by the newest guide, listed pages by PAGE_UPDATED and everything else by CONTENT_UPDATED", () => {
    const entries = sitemapEntries(APP);
    const at = (path: string) => (entries.find((e) => e.url === `${APP}${path}`)?.lastModified as Date).toISOString();
    for (const g of GUIDES) {
      expect(at(`/guides/${g.slug}`)).toBe(guideLastModified(g).toISOString());
      expect(guideLastModified(g).getTime()).toBeGreaterThanOrEqual(CONTENT_UPDATED.getTime());
    }
    const newestGuide = Math.max(...GUIDES.map((g) => guideLastModified(g).getTime()), CONTENT_UPDATED.getTime());
    expect(at("/guides")).toBe(new Date(newestGuide).toISOString());
    for (const p of Object.keys(PAGE_UPDATED)) {
      expect(at(p)).toBe(pageLastModified(p).toISOString());
      expect(pageLastModified(p).getTime()).toBeGreaterThan(CONTENT_UPDATED.getTime());
    }
    expect(at("/free/fair-housing-checker")).toBe(CONTENT_UPDATED.toISOString());
    expect(at("/tools/listing-description")).toBe(CONTENT_UPDATED.toISOString());
    expect(pageLastModified("/tools/listing-description").toISOString()).toBe(CONTENT_UPDATED.toISOString());
    const newest = Math.max(newestGuide, ...Object.keys(PAGE_UPDATED).map((p) => pageLastModified(p).getTime()));
    expect(contentVersion(entries).toISOString()).toBe(new Date(newest).toISOString());
    expect(guideLastModified({ updated: "not a date" }).toISOString()).toBe(CONTENT_UPDATED.toISOString());
    expect(guideLastModified({ updated: "2026-01-01" }).toISOString()).toBe(CONTENT_UPDATED.toISOString());
    expect(guideLastModified({ updated: "2026-09-28T13:00:00Z" }).toISOString()).toBe("2026-09-28T13:00:00.000Z");
  });

  it("after an accepted submission, a newer lastmod (even on the same day) resubmits only the newer pages", async () => {
    // Production on 28 Sep: the 06:00 UTC submission was accepted at version 28 Sep 00:00, and the calculator page
    // (PAGE_UPDATED, 12:45 UTC) changed the same afternoon; only that URL went out at 14:00.
    const entries = sitemapEntries(APP);
    const times = [...new Set(entries.map((e) => (e.lastModified as Date).getTime()))].sort((a, b) => a - b);
    expect(times.length).toBeGreaterThan(1);
    const before = new Date(times[times.length - 2]); // the previous content version
    const expected = entries.filter((e) => (e.lastModified as Date).getTime() > before.getTime()).map((e) => e.url);
    expect(expected.length).toBeGreaterThan(0);
    expect(expected.length).toBeLessThan(entries.length);
    const db = fakeDb({ version: before.toISOString(), status: 200, ok: true, at: before.toISOString(), count: 3 });
    const f = fakeFetch();
    const out = await maybeSubmitIndexNow(prod({ db, fetchImpl: f.impl, now: new Date(contentVersion(entries).getTime() + 3600_000) }));
    expect(JSON.parse(String(f.calls[1].init?.body)).urlList).toEqual(expected);
    expect(out).toEqual({ submitted: expected.length, status: 202, ok: true });
    expect(db.current()).toMatchObject({ version: VERSION, ok: true, count: expected.length });
  });
});
