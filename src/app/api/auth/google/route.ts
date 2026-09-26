import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createGoogleState, googleAuthUrl, googleEnabled, GOOGLE_STATE_COOKIE } from "@/lib/auth/google";
import { randomToken } from "@/lib/security/tokens";
import { appUrl, env } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Starts "Sign in with Google": sets a one-time nonce cookie and sends the browser to Google. */
export async function GET(req: Request) {
  if (!googleEnabled()) return NextResponse.redirect(appUrl("/login?error=" + encodeURIComponent("Google sign-in is not set up yet.")));
  const next = new URL(req.url).searchParams.get("next") ?? undefined;
  const nonce = randomToken(16);
  const state = await createGoogleState(next, nonce);
  const store = await cookies();
  store.set(GOOGLE_STATE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: env().APP_ENV === "production" || env().APP_ENV === "staging",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return NextResponse.redirect(googleAuthUrl(state));
}
