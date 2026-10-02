import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  LAB_MAX_ATTEMPTS,
  LAB_RETRY_AFTER_MS,
  LAB_RUNS_PER_DAY,
  LAB_SETTING,
  isAllowedLabUrl,
  labKey,
  labManifest,
  labRuns,
  parseLabRecord,
  runLabOnce,
  type LabDeps,
  type LabRecord,
} from "@/lib/ops/lab";
import { LAB_REQUESTS, type LabRequest } from "@/content/lab-requests";
import { STYLES, VIRTUAL_STAGING_VARIATIONS, stagingPrompt } from "@/lib/tools/definitions/virtual-staging";
import { AiBudgetExceededError, type AiCallContext, type ImageEditCall } from "@/lib/ai";
import type { PutFileInput } from "@/lib/storage";

const REQ: LabRequest[] = [
  { id: "room-a", imageUrl: "https://images.pexels.com/photos/1/pexels-photo-1.jpeg?w=2048", roomType: "living room", styles: ["modern", "coastal"], credit: "test" },
  { id: "room-b", imageUrl: "https://images.unsplash.com/photo-2?w=2048", roomType: "bedroom", styles: ["luxury"], notes: "keep the window", credit: "test" },
];

const jpeg = (w: number, h: number) => sharp({ create: { width: w, height: h, channels: 3, background: "#c8b8a0" } }).jpeg().toBuffer();
const png = (w: number, h: number) => sharp({ create: { width: w, height: h, channels: 3, background: "#806040" } }).png().toBuffer();

function fakeDb(initial: unknown = null) {
  let value: unknown = initial;
  const writes: LabRecord[] = [];
  return {
    writes,
    get value() {
      return value as LabRecord;
    },
    setting: {
      async findUnique({ where }: { where: { key: string } }) {
        expect(where.key).toBe(LAB_SETTING);
        return value === null ? null : { value };
      },
      async upsert(args: { where: { key: string }; create: { key: string; value: LabRecord }; update: { value: LabRecord } }) {
        expect(args.where.key).toBe(LAB_SETTING);
        value = JSON.parse(JSON.stringify(args.update.value));
        writes.push(value as LabRecord);
        return {};
      },
    },
  };
}

function harness(over: Partial<LabDeps> = {}, initial: unknown = null) {
  const db = fakeDb(initial);
  const puts: PutFileInput[] = [];
  const edits: Array<{ call: ImageEditCall; ctx: AiCallContext }> = [];
  const fetched: string[] = [];
  let clock = new Date("2026-10-02T14:00:00Z");
  let n = 0;
  const deps: Partial<LabDeps> = {
    appEnv: "production",
    requests: REQ,
    db,
    now: () => clock,
    fetchImage: async (url) => {
      fetched.push(url);
      return jpeg(300, 200);
    },
    edit: async (call, ctx) => {
      edits.push({ call, ctx });
      return { images: [await png(300, 200), await png(300, 200)], costMicros: 110_000 };
    },
    put: async (input) => {
      puts.push(input);
      return { id: `file${++n}` };
    },
    spendTodayMicros: async () => 0,
    labCallsToday: async () => 0,
    ordersInProgress: async () => 0,
    dailyBudgetCents: 500,
    imageCostCents: 5,
    ...over,
  };
  return { db, puts, edits, fetched, deps, advance: (ms: number) => (clock = new Date(clock.getTime() + ms)) };
}

describe("lab URL allowlist", () => {
  it("accepts only https on the two stock-photo CDNs", () => {
    expect(isAllowedLabUrl("https://images.pexels.com/photos/3958955/pexels-photo-3958955.jpeg?w=2048")).toBe(true);
    expect(isAllowedLabUrl("https://images.unsplash.com/photo-1668910242969-bd2933e7a5cf?w=2048&q=85")).toBe(true);
    expect(isAllowedLabUrl("http://images.pexels.com/photos/1/a.jpeg")).toBe(false);
    expect(isAllowedLabUrl("https://images.pexels.com.evil.example/a.jpeg")).toBe(false);
    expect(isAllowedLabUrl("https://images.pexels.com@evil.example/a.jpeg")).toBe(false);
    expect(isAllowedLabUrl("https://evil.example/?u=https://images.pexels.com/a.jpeg")).toBe(false);
    expect(isAllowedLabUrl("https://images.pexels.com:8443/a.jpeg")).toBe(false);
    expect(isAllowedLabUrl("not a url")).toBe(false);
  });
});

describe("the request list", () => {
  it("has unique, file-safe ids, allowed URLs and valid styles", () => {
    const ids = LAB_REQUESTS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of LAB_REQUESTS) {
      expect(r.id).toMatch(/^[a-z0-9-]+$/);
      expect(isAllowedLabUrl(r.imageUrl)).toBe(true);
      expect(r.styles.length).toBeGreaterThan(0);
      expect(new Set(r.styles).size).toBe(r.styles.length);
      for (const s of r.styles) expect(STYLES).toContain(s);
      expect(r.credit).toMatch(/licen[cs]e/i);
    }
  });
});

describe("labRuns", () => {
  it("skips finished runs, waits out a retry delay and gives up after the last attempt", () => {
    const now = new Date("2026-10-02T14:00:00Z");
    const record: LabRecord = {
      sources: {},
      results: { [labKey("room-a", "modern")]: { files: [{ id: "f", name: "x.jpg" }], at: "", costMicros: 0 } },
      failures: {
        [labKey("room-a", "coastal")]: { attempts: 1, lastAt: new Date(now.getTime() - 60_000).toISOString(), error: "x" },
        [labKey("room-b", "luxury")]: { attempts: LAB_MAX_ATTEMPTS, lastAt: "2026-10-01T00:00:00Z", error: "x" },
      },
    };
    const { remaining, ready } = labRuns(REQ, record, now);
    expect(remaining.map((r) => r.key)).toEqual(["room-a:coastal"]);
    expect(ready).toEqual([]);
    expect(labRuns(REQ, record, new Date(now.getTime() + LAB_RETRY_AFTER_MS)).ready.map((r) => r.key)).toEqual(["room-a:coastal"]);
  });

  it("parses a missing or malformed record as empty", () => {
    expect(parseLabRecord(null)).toEqual({ sources: {}, results: {}, failures: {} });
    expect(parseLabRecord({ results: { k: { files: "nope" } }, sources: [1] })).toEqual({ sources: {}, results: {}, failures: {} });
  });
});

describe("runLabOnce", () => {
  it("does nothing outside production", async () => {
    const h = harness({ appEnv: "development" });
    expect(await runLabOnce(h.deps)).toEqual({ skipped: "not production" });
    expect(h.edits).toHaveLength(0);
  });

  it("stages one run with the customer pipeline and stores the source once", async () => {
    const h = harness();
    expect(await runLabOnce(h.deps)).toEqual({ ran: "room-a:modern", files: 2, costMicros: 110_000 });
    expect(h.edits).toHaveLength(1);
    const { call, ctx } = h.edits[0];
    expect(ctx).toEqual({ purpose: "lab", toolId: "virtual-staging" });
    expect(call.n).toBe(VIRTUAL_STAGING_VARIATIONS);
    expect(call.size).toBe("auto");
    expect(call.prompt).toBe(stagingPrompt({ roomType: "living room", style: "modern", notes: "" }));
    expect([call.inputWidth, call.inputHeight]).toEqual([300, 200]);
    expect(h.puts.map((p) => [p.kind, p.name, p.mime, p.expiresInDays])).toEqual([
      ["INPUT", "lab-room-a-source.jpg", "image/jpeg", 365],
      ["OUTPUT", "lab-room-a-modern-v1.jpg", "image/jpeg", 365],
      ["OUTPUT", "lab-room-a-modern-v2.jpg", "image/jpeg", 365],
    ]);
    const rec = h.db.value;
    expect(rec.sources["room-a"]).toEqual({ id: "file1", name: "lab-room-a-source.jpg" });
    expect(rec.results["room-a:modern"].files.map((f) => f.id)).toEqual(["file2", "file3"]);
    expect(rec.leaseUntil).toBeUndefined();
    // The lease was taken before the run started.
    expect(h.db.writes[0].leaseUntil).toBeDefined();

    // The next style of the same photo reuses the stored source; notes reach the prompt like a customer's.
    expect(await runLabOnce(h.deps)).toMatchObject({ ran: "room-a:coastal" });
    expect(h.puts.filter((p) => p.kind === "INPUT")).toHaveLength(1);
    expect(await runLabOnce(h.deps)).toMatchObject({ ran: "room-b:luxury" });
    expect(h.edits[2].call.prompt).toContain("Customer notes: keep the window");
    expect(await runLabOnce(h.deps)).toEqual({ skipped: "nothing to do" });
    expect(h.edits).toHaveLength(3);
  });

  it("never runs while a paid order is in progress, over its budget share, past the daily cap or under a lease", async () => {
    expect(await runLabOnce(harness({ ordersInProgress: async () => 1 }).deps)).toEqual({ skipped: "order in progress" });
    // 35% of $5 = 175 cents; a run is estimated at 11 cents.
    expect(await runLabOnce(harness({ spendTodayMicros: async () => 165 * 10_000 }).deps)).toEqual({ skipped: "budget" });
    expect(await runLabOnce(harness({ spendTodayMicros: async () => 160 * 10_000 }).deps)).toMatchObject({ ran: "room-a:modern" });
    expect(await runLabOnce(harness({ labCallsToday: async () => LAB_RUNS_PER_DAY }).deps)).toEqual({ skipped: "daily runs" });
    const leased = harness({}, { leaseUntil: "2026-10-02T14:05:00Z" });
    expect(await runLabOnce(leased.deps)).toEqual({ skipped: "busy" });
    expect(leased.edits).toHaveLength(0);
    const expired = harness({}, { leaseUntil: "2026-10-02T13:55:00Z" });
    expect(await runLabOnce(expired.deps)).toMatchObject({ ran: "room-a:modern" });
  });

  it("records a failure, retries after the delay and gives up after the last attempt", async () => {
    const h = harness({
      fetchImage: async () => {
        throw new Error("photo download failed: HTTP 404");
      },
      requests: [REQ[1]],
    });
    expect(await runLabOnce(h.deps)).toEqual({ failed: "room-b:luxury", error: "photo download failed: HTTP 404" });
    expect(h.db.value.failures["room-b:luxury"].attempts).toBe(1);
    expect(h.db.value.leaseUntil).toBeUndefined();
    expect(await runLabOnce(h.deps)).toEqual({ skipped: "waiting" });
    for (let i = 2; i <= LAB_MAX_ATTEMPTS; i++) {
      h.advance(LAB_RETRY_AFTER_MS);
      expect(await runLabOnce(h.deps)).toMatchObject({ failed: "room-b:luxury" });
    }
    h.advance(LAB_RETRY_AFTER_MS);
    expect(await runLabOnce(h.deps)).toEqual({ skipped: "nothing to do" });
    expect(h.edits).toHaveLength(0);
  });

  it("does not count the AI budget cap or kill switch as a failed attempt", async () => {
    const h = harness({
      edit: async () => {
        throw new AiBudgetExceededError("AI kill switch is on");
      },
    });
    expect(await runLabOnce(h.deps)).toEqual({ skipped: "budget" });
    expect(h.db.value.failures).toEqual({});
    expect(h.db.value.leaseUntil).toBeUndefined();
  });
});

describe("labManifest", () => {
  it("lists sources and finished versions under lab/<id>/ with signed URLs", () => {
    const record: LabRecord = {
      sources: { "room-a": { id: "s1", name: "lab-room-a-source.jpg" } },
      results: { "room-a:coastal": { files: [{ id: "c1", name: "lab-room-a-coastal-v1.jpg" }, { id: "c2", name: "lab-room-a-coastal-v2.jpg" }], at: "", costMicros: 0 } },
      failures: {},
    };
    expect(labManifest(record, REQ, (id) => `https://orvionis.com/api/files/${id}?t=x`)).toEqual([
      { name: "lab/room-a/lab-room-a-source.jpg", url: "https://orvionis.com/api/files/s1?t=x" },
      { name: "lab/room-a/lab-room-a-coastal-v1.jpg", url: "https://orvionis.com/api/files/c1?t=x" },
      { name: "lab/room-a/lab-room-a-coastal-v2.jpg", url: "https://orvionis.com/api/files/c2?t=x" },
    ]);
  });
});
