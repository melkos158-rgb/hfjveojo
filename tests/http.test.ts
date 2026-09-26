import { describe, expect, it } from "vitest";
import { readJsonBody, assertContentLength } from "@/lib/security/http";
import { AppError } from "@/lib/errors";

describe("body-size guard", () => {
  it("rejects oversized bodies by Content-Length and by actual size, accepts small JSON", async () => {
    const big = new Request("http://x/", { method: "POST", headers: { "content-length": String(200 * 1024) }, body: "{}" });
    expect(() => assertContentLength(big, 64 * 1024)).toThrow(AppError);
    const chunky = new Request("http://x/", { method: "POST", body: JSON.stringify({ a: "x".repeat(100_000) }) });
    await expect(readJsonBody(chunky, 64 * 1024)).rejects.toMatchObject({ status: 413 });
    const ok = new Request("http://x/", { method: "POST", body: JSON.stringify({ email: "a@b.co" }) });
    expect(await readJsonBody<{ email: string }>(ok)).toEqual({ email: "a@b.co" });
    const bad = new Request("http://x/", { method: "POST", body: "{not json" });
    await expect(readJsonBody(bad)).rejects.toMatchObject({ status: 400 });
  });
});
