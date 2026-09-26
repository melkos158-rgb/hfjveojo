import { SignJWT, jwtVerify } from "jose";
import { env, appUrl } from "@/lib/env";
import { AppError } from "@/lib/errors";

/**
 * "Sign in with Google" (OpenID Connect, authorization-code flow). No password, no email delivery involved —
 * the fallback that keeps sign-in working when the mail domain is not verified yet.
 * Redirect URI registered in Google Cloud: <APP_URL>/api/auth/google/callback.
 */
export const GOOGLE_STATE_COOKIE = "orv_google_state";
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

export function googleEnabled(): boolean {
  const e = env();
  return Boolean(e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri(): string {
  return appUrl("/api/auth/google/callback");
}

function key(): Uint8Array {
  return new TextEncoder().encode(env().AUTH_SECRET);
}

/** Short-lived signed state: binds the callback to this browser (cookie) and carries the post-login path. */
export async function createGoogleState(next: string | undefined, nonce: string): Promise<string> {
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next.slice(0, 200) : "/dashboard";
  return new SignJWT({ next: safeNext, nonce }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("10m").sign(key());
}

export async function readGoogleState(state: string, nonceFromCookie: string | undefined): Promise<{ next: string }> {
  try {
    const { payload } = await jwtVerify(state, key(), { algorithms: ["HS256"] });
    if (!nonceFromCookie || payload.nonce !== nonceFromCookie) throw new Error("nonce mismatch");
    return { next: typeof payload.next === "string" ? payload.next : "/dashboard" };
  } catch {
    throw new AppError("Sign-in with Google expired or was tampered with. Please try again.", 400, "google_state_invalid");
  }
}

export function googleAuthUrl(state: string): string {
  const e = env();
  const params = new URLSearchParams({
    client_id: e.GOOGLE_CLIENT_ID,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    access_type: "online",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export type GoogleProfile = { email: string; name: string | null; sub: string };

/** Exchange the code and read the verified profile. Only verified Google emails are accepted. */
export async function exchangeGoogleCode(code: string): Promise<GoogleProfile> {
  const e = env();
  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: e.GOOGLE_CLIENT_ID,
      client_secret: e.GOOGLE_CLIENT_SECRET,
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    throw new AppError(`Google did not accept the sign-in (${tokenRes.status}). Please try again.`, 502, "google_token_failed");
  }
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) throw new AppError("Google returned no access token.", 502, "google_token_missing");
  const infoRes = await fetch(USERINFO_ENDPOINT, { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  if (!infoRes.ok) throw new AppError("Could not read your Google profile.", 502, "google_userinfo_failed");
  const info = (await infoRes.json()) as { sub?: string; email?: string; email_verified?: boolean; name?: string };
  if (!info.email || !info.sub) throw new AppError("Google did not share an email address.", 400, "google_no_email");
  if (info.email_verified === false) throw new AppError("This Google account's email is not verified.", 400, "google_email_unverified");
  return { email: info.email, name: info.name ?? null, sub: info.sub };
}
