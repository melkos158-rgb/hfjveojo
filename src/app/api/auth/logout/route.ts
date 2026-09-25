import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";
import { appUrl } from "@/lib/env";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.redirect(appUrl("/"), { status: 303 });
}
