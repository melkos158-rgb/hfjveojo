import { describe, expect, it } from "vitest";
import type { OutputType } from "@prisma/client";
import { deliveredOutputs, lastDeliveredAt, outputsToDeliver } from "@/lib/orders/deliverables";

const at = (s: number) => new Date(Date.UTC(2026, 8, 26, 12, 0, s));
const out = (id: string, toolRunId: string | null, created: number, title: string, type: OutputType = "IMAGE", delivered?: number) => ({
  id,
  toolRunId,
  createdAt: at(created),
  title,
  type,
  deliveredAt: delivered === undefined ? null : at(delivered),
});

describe("which outputs reach the customer", () => {
  it("a delivery sends only the newest run, in generation order (v1 before v2, v9 before v10), then the newest link", () => {
    const outputs = [
      out("a1", "runA", 1, "Staged version 1"),
      out("a2", "runA", 2, "Staged version 2"),
      out("b2", "runB", 10, "Staged version 2"),
      out("b1", "runB", 10, "Staged version 1"), // same millisecond: the title decides
      out("bj", "runB", 11, "Staging details", "JSON"),
      out("l1", null, 5, "Your files", "LINK"),
      out("l2", null, 12, "Your files", "LINK"),
    ];
    expect(outputsToDeliver(outputs).map((o) => o.id)).toEqual(["b1", "b2", "bj", "l2"]);
    const many = [out("v10", "r", 1, "Clip 10", "MARKDOWN"), out("v9", "r", 1, "Clip 9", "MARKDOWN")];
    expect(outputsToDeliver(many).map((o) => o.id)).toEqual(["v9", "v10"]);
  });

  it("a concierge delivery without any run still sends its link", () => {
    expect(outputsToDeliver([out("l1", null, 1, "Your files", "LINK")]).map((o) => o.id)).toEqual(["l1"]);
    expect(outputsToDeliver([])).toEqual([]);
  });

  it("the order page shows the latest delivered set only, links last", () => {
    const outputs = [
      out("a1", "runA", 1, "Staged version 1", "IMAGE", 3),
      out("a2", "runA", 2, "Staged version 2", "IMAGE", 3),
      out("l1", null, 20, "Your files", "LINK", 30),
      out("b2", "runB", 21, "Staged version 2", "IMAGE", 30),
      out("b1", "runB", 20, "Staged version 1", "IMAGE", 30),
      out("c1", "runC", 40, "Staged version 1"), // generated, not delivered yet (e.g. a redo in REVIEW)
    ];
    expect(deliveredOutputs(outputs).map((o) => o.id)).toEqual(["b1", "b2", "l1"]);
    expect(lastDeliveredAt(outputs)?.toISOString()).toBe(at(30).toISOString());
    expect(deliveredOutputs([out("x", "r", 1, "X")])).toEqual([]);
    expect(lastDeliveredAt([out("x", "r", 1, "X")])).toBeNull();
  });
});
