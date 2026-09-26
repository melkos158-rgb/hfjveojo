import { NextResponse } from "next/server";
import { consumeMagicLink } from "@/lib/auth/magic";
import { setSessionCookie } from "@/lib/auth/session";
import { appUrl, env } from "@/lib/env";
import { track } from "@/lib/analytics/events";
import { AUTH_EVENT_COOKIE } from "@/lib/auth/events";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  try {
    const { user, redirect, firstLogin } = await consumeMagicLink(token);
    await setSessionCookie({ id: user.id, email: user.email, role: user.role, name: user.name });
    await track(firstLogin ? "sign_up" : "login", { userId: user.id, props: { method: "email" } });
    const res = NextResponse.redirect(appUrl(redirect));
    res.cookies.set(AUTH_EVENT_COOKIE, `${firstLogin ? "sign_up" : "login"}:email`, { maxAge: 60, path: "/", sameSite: "lax", secure: env().APP_ENV === "production" || env().APP_ENV === "staging" });
    return res;
  } catch (err) {
    const msg = encodeURIComponent((err as Error).message || "Sign-in failed");
    return NextResponse.redirect(appUrl(`/login?error=${msg}`));
  }
}
