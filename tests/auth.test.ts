import { beforeAll, describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";
import { issueMagicLink, consumeMagicLink, upsertUserByEmail } from "@/lib/auth/magic";
import { signPayload, verifyPayload } from "@/lib/security/tokens";
import { resetDatabase } from "./helpers";

describe("auth", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("signs and verifies session tokens; tampering fails", async () => {
    const token = await createSessionToken({ id: "u1", email: "a@b.co", role: "CUSTOMER" });
    const s = await verifySessionToken(token);
    expect(s?.id).toBe("u1");
    expect(await verifySessionToken(token.slice(0, -2) + "xx")).toBeNull();
  });

  it("magic links are single-use and admin role comes from ADMIN_EMAILS only", async () => {
    const { url } = await issueMagicLink("admin@example.com", "/admin");
    const token = new URL(url).searchParams.get("token")!;
    const { user, redirect } = await consumeMagicLink(token);
    expect(user.role).toBe("ADMIN");
    expect(redirect).toBe("/admin");
    await expect(consumeMagicLink(token)).rejects.toThrow();
    const customer = await upsertUserByEmail("someone@else.com");
    expect(customer.role).toBe("CUSTOMER");
  });

  it("signed payloads expire", () => {
    const t = signPayload({ f: "file1" }, 60);
    expect(verifyPayload<{ f: string }>(t)?.f).toBe("file1");
    const expired = signPayload({ f: "file1" }, -10);
    expect(verifyPayload(expired)).toBeNull();
  });
});
