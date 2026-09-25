import { NextResponse } from "next/server";
import { consumeMagicLink } from "@/lib/auth/magic";
import { setSessionCookie } from "@/lib/auth/session";
import { appUrl } from "@/lib/env";
import { track } from "@/lib/analytics/events";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  try {
    const { user, redirect } = await consumeMagicLink(token);
    await setSessionCookie({ id: user.id, email: user.email, role: user.role, name: user.name });
    await track("login", { userId: user.id });
    return NextResponse.redirect(appUrl(redirect));
  } catch (err) {
    const msg = encodeURIComponent((err as Error).message || "Sign-in failed");
    return NextResponse.redirect(appUrl(`/login?error=${msg}`));
  }
}
