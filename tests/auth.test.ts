import { beforeAll, describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";
import { issueMagicLink, consumeMagicLink, upsertUserByEmail } from "@/lib/auth/magic";
import { signPayload, verifyPayload } from "@/lib/security/tokens";
import { createGoogleState, readGoogleState, googleAuthUrl, googleRedirectUri } from "@/lib/auth/google";
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

  it("google sign-in: state is bound to the browser nonce, next path is sanitised, redirect URI is fixed", async () => {
    expect(googleRedirectUri()).toBe("http://localhost:3000/api/auth/google/callback");
    const state = await createGoogleState("/orders/abc?t=1", "nonce-1");
    expect((await readGoogleState(state, "nonce-1")).next).toBe("/orders/abc?t=1");
    await expect(readGoogleState(state, "nonce-2")).rejects.toThrow(); // another browser
    await expect(readGoogleState(state + "x", "nonce-1")).rejects.toThrow(); // tampered
    expect((await readGoogleState(await createGoogleState("https://evil.example", "n"), "n")).next).toBe("/dashboard");
    expect((await readGoogleState(await createGoogleState("//evil.example", "n"), "n")).next).toBe("/dashboard");
    const url = new URL(googleAuthUrl(state));
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/auth/google/callback");
    expect(url.searchParams.get("scope")).toBe("openid email profile");
    expect(url.searchParams.get("state")).toBe(state);
  });

  it("signed payloads expire", () => {
    const t = signPayload({ f: "file1" }, 60);
    expect(verifyPayload<{ f: string }>(t)?.f).toBe("file1");
    const expired = signPayload({ f: "file1" }, -10);
    expect(verifyPayload(expired)).toBeNull();
  });
});
