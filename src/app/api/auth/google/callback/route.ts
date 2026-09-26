import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { exchangeGoogleCode, googleEnabled, readGoogleState, GOOGLE_STATE_COOKIE } from "@/lib/auth/google";
import { upsertUserByEmail } from "@/lib/auth/magic";
import { setSessionCookie } from "@/lib/auth/session";
import { track } from "@/lib/analytics/events";
import { AUTH_EVENT_COOKIE } from "@/lib/auth/events";
import { appUrl, env } from "@/lib/env";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** Google sends the browser back here with ?code&state. Verifies state, reads the profile, signs the user in. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const fail = (message: string) => NextResponse.redirect(appUrl(`/login?error=${encodeURIComponent(message)}`));
  if (!googleEnabled()) return fail("Google sign-in is not set up yet.");
  const store = await cookies();
  const nonce = store.get(GOOGLE_STATE_COOKIE)?.value;
  store.set(GOOGLE_STATE_COOKIE, "", { httpOnly: true, path: "/api/auth/google", maxAge: 0 });
  try {
    if (url.searchParams.get("error")) return fail("Google sign-in was cancelled.");
    const code = url.searchParams.get("code") ?? "";
    const state = url.searchParams.get("state") ?? "";
    if (!code || !state) return fail("Google sign-in did not complete. Please try again.");
    const { next } = await readGoogleState(state, nonce);
    const profile = await exchangeGoogleCode(code);
    const user = await upsertUserByEmail(profile.email, profile.name);
    const firstLogin = !user.lastLoginAt;
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await setSessionCookie({ id: user.id, email: user.email, role: user.role, name: user.name });
    await track(firstLogin ? "sign_up" : "login", { userId: user.id, props: { method: "google" } });
    const res = NextResponse.redirect(appUrl(next));
    res.cookies.set(AUTH_EVENT_COOKIE, `${firstLogin ? "sign_up" : "login"}:google`, { maxAge: 60, path: "/", sameSite: "lax", secure: env().APP_ENV === "production" || env().APP_ENV === "staging" });
    return res;
  } catch (err) {
    log.warn("auth.google_failed", { error: (err as Error).message });
    return fail((err as Error).message || "Sign-in with Google failed.");
  }
}
