import { describe, expect, it } from "vitest";
import { costMicros, microsToCents, formatUsd } from "@/lib/ai/pricing";

describe("AI pricing", () => {
  it("computes cost in micro-dollars for a known model", () => {
    // gpt-4.1-mini: $0.40 in / $1.60 out per 1M tokens → 1000 in + 500 out = 0.0004 + 0.0008 = 0.0012 USD = 1200 µ$
    expect(costMicros("gpt-4.1-mini", 1000, 500)).toBe(1200);
  });
  it("over-estimates unknown models using the fallback rate", () => {
    const unknown = costMicros("some-new-model", 1000, 1000);
    const known = costMicros("gpt-4.1", 1000, 1000);
    expect(unknown).toBeGreaterThan(known);
  });
  it("converts and formats", () => {
    expect(microsToCents(10_000)).toBe(1);
    expect(formatUsd(4900)).toBe("$49.00");
  });
});
