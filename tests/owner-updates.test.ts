import { describe, expect, it } from "vitest";
import {
  OWNER_UPDATES_PER_RUN,
  OWNER_UPDATES_SETTING,
  parseOwnerUpdatesRecord,
  pendingOwnerUpdates,
  sendPendingOwnerUpdates,
  type OwnerUpdatesRecord,
} from "@/lib/ops/owner-updates";
import { OWNER_UPDATES, type OwnerUpdate } from "@/content/owner-updates";

function fakeDb(initial: unknown = null) {
  let value: unknown = initial;
  const writes: OwnerUpdatesRecord[] = [];
  return {
    writes,
    get value() {
      return value;
    },
    setting: {
      async findUnique({ where }: { where: { key: string } }) {
        expect(where.key).toBe(OWNER_UPDATES_SETTING);
        return value === null ? null : { value };
      },
      async upsert(args: { where: { key: string }; create: { key: string; value: OwnerUpdatesRecord }; update: { value: OwnerUpdatesRecord } }) {
        expect(args.where.key).toBe(OWNER_UPDATES_SETTING);
        value = args.update.value;
        writes.push(args.update.value);
        return {};
      },
    },
  };
}

function fakeSend(failFor: (to: string, subject: string) => boolean = () => false) {
  const sent: Array<{ to: string; subject: string; text: string }> = [];
  const send = async (msg: { to: string; subject: string; text: string }) => {
    if (failFor(msg.to, msg.subject)) throw new Error("Resend error 500");
    sent.push(msg);
    return { id: "x" };
  };
  return { sent, send };
}

const U = (id: string): OwnerUpdate => ({ id, subject: `Subject ${id}`, text: `Body ${id}` });
const base = { appEnv: "production", recipients: ["owner@example.com"], brand: "ORVIONIS", now: new Date("2026-09-29T20:00:00Z") };

describe("owner email updates", () => {
  it("sends nothing outside production or without an admin address", async () => {
    const db = fakeDb();
    const { sent, send } = fakeSend();
    expect(await sendPendingOwnerUpdates({ ...base, appEnv: "development", updates: [U("a")], db, send })).toEqual({ skipped: "not production" });
    expect(await sendPendingOwnerUpdates({ ...base, recipients: [], updates: [U("a")], db, send })).toEqual({ skipped: "no admin email" });
    expect(sent).toHaveLength(0);
    expect(db.writes).toHaveLength(0);
  });

  it("emails each update once, with the brand prefix, and records it", async () => {
    const db = fakeDb();
    const { sent, send } = fakeSend();
    const updates = [U("a"), U("b")];
    expect(await sendPendingOwnerUpdates({ ...base, updates, db, send })).toEqual({ sent: ["a", "b"], failed: null });
    expect(sent.map((m) => [m.to, m.subject])).toEqual([
      ["owner@example.com", "[ORVIONIS] Subject a"],
      ["owner@example.com", "[ORVIONIS] Subject b"],
    ]);
    expect(db.value).toEqual({ sent: ["a", "b"], at: "2026-09-29T20:00:00.000Z" });
    // A restart or redeploy with the same list sends nothing again.
    expect(await sendPendingOwnerUpdates({ ...base, updates, db, send })).toEqual({ skipped: "nothing new" });
    expect(sent).toHaveLength(2);
    // A newer deploy with one more entry sends only that one.
    expect(await sendPendingOwnerUpdates({ ...base, updates: [...updates, U("c")], db, send })).toEqual({ sent: ["c"], failed: null });
    expect(sent.map((m) => m.subject).at(-1)).toBe("[ORVIONIS] Subject c");
  });

  it("does not record an update nobody received, and retries it before newer ones", async () => {
    const db = fakeDb();
    let down = true;
    const { sent, send } = fakeSend(() => down);
    const updates = [U("a"), U("b")];
    expect(await sendPendingOwnerUpdates({ ...base, updates, db, send })).toEqual({ sent: [], failed: "a" });
    expect(db.writes).toHaveLength(0);
    down = false;
    expect(await sendPendingOwnerUpdates({ ...base, updates, db, send })).toEqual({ sent: ["a", "b"], failed: null });
    expect(sent.map((m) => m.subject)).toEqual(["[ORVIONIS] Subject a", "[ORVIONIS] Subject b"]);
  });

  it("counts an update as sent when at least one admin received it", async () => {
    const db = fakeDb();
    const { sent, send } = fakeSend((to) => to === "second@example.com");
    const out = await sendPendingOwnerUpdates({ ...base, recipients: ["owner@example.com", "second@example.com"], updates: [U("a")], db, send });
    expect(out).toEqual({ sent: ["a"], failed: null });
    expect(sent.map((m) => m.to)).toEqual(["owner@example.com"]);
  });

  it("sends a backlog a few at a time", async () => {
    const db = fakeDb();
    const { sent, send } = fakeSend();
    const updates = Array.from({ length: OWNER_UPDATES_PER_RUN + 2 }, (_, i) => U(`u${i}`));
    const first = await sendPendingOwnerUpdates({ ...base, updates, db, send });
    expect("sent" in first && first.sent).toHaveLength(OWNER_UPDATES_PER_RUN);
    const second = await sendPendingOwnerUpdates({ ...base, updates, db, send });
    expect("sent" in second && second.sent).toHaveLength(2);
    expect(sent).toHaveLength(OWNER_UPDATES_PER_RUN + 2);
  });

  it("reads a stored record defensively", () => {
    expect(parseOwnerUpdatesRecord(null)).toEqual({ sent: [] });
    expect(parseOwnerUpdatesRecord({ sent: ["a", 3, null, "b"] })).toEqual({ sent: ["a", "b"] });
    expect(pendingOwnerUpdates([U("a"), U("b")], ["a"]).map((u) => u.id)).toEqual(["b"]);
  });

  it("the committed updates are well-formed and carry no personal data", () => {
    const ids = OWNER_UPDATES.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const u of OWNER_UPDATES) {
      expect(u.id).toMatch(/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/);
      expect(u.subject.length).toBeGreaterThan(0);
      expect(u.subject.length).toBeLessThanOrEqual(120);
      expect(u.text.trim().length).toBeGreaterThan(0);
      // The repository is public: no email addresses or phone-number-like digit runs in what gets committed here.
      expect(`${u.subject}\n${u.text}`).not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
      expect(`${u.subject}\n${u.text}`).not.toMatch(/\+?\d[\d\s()-]{8,}\d/);
    }
  });
});
