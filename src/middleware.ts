import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "orv_session";
const ATTRIBUTION_COOKIE = "orv_attr";
const SESSION_ID_COOKIE = "orv_sid";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "ref", "exp", "variant"];

/**
 * 1) Admin gate: /admin/* requires a valid session whose role is ADMIN and whose email is in ADMIN_EMAILS.
 *    (Role/email are read from the signed cookie; the client can't forge them.)
 * 2) First-touch attribution: UTM/ref/experiment params are captured once into a cookie for later orders.
 * 3) Anonymous session id for funnel analytics (no PII).
 */
export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const res = NextResponse.next();

  if (!req.cookies.get(SESSION_ID_COOKIE)) {
    res.cookies.set(SESSION_ID_COOKIE, crypto.randomUUID(), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 180 * 24 * 3600 });
  }

  if (!req.cookies.get(ATTRIBUTION_COOKIE)) {
    const attr: Record<string, string> = {};
    for (const k of UTM_KEYS) {
      const v = url.searchParams.get(k);
      if (v) attr[k] = v.slice(0, 80);
    }
    const referrer = req.headers.get("referer");
    if (referrer) {
      try {
        const host = new URL(referrer).hostname;
        if (host && host !== url.hostname) attr.referrer = host.slice(0, 120);
      } catch {
        // ignore malformed referer
      }
    }
    if (Object.keys(attr).length > 0) {
      attr.landing = url.pathname.slice(0, 120);
      attr.firstSeen = new Date().toISOString();
      res.cookies.set(ATTRIBUTION_COOKIE, encodeURIComponent(JSON.stringify(attr)), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 90 * 24 * 3600 });
    }
  }

  if (url.pathname.startsWith("/admin")) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const secret = process.env.AUTH_SECRET ?? "";
    const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    let ok = false;
    if (token && secret) {
      try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
        ok = payload.role === "ADMIN" && typeof payload.email === "string" && admins.includes(payload.email.toLowerCase());
      } catch {
        ok = false;
      }
    }
    if (!ok) {
      const login = new URL("/login", req.url);
      login.searchParams.set("next", url.pathname);
      return NextResponse.redirect(login);
    }
    // This device belongs to the team: keep its browsing out of the visitor funnel (see INTERNAL_COOKIE).
    if (req.cookies.get("orv_internal")?.value !== "1") res.cookies.set("orv_internal", "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 365 * 24 * 3600 });
  }

  return res;
}

export const config = {
  // Static brand files, icons and the manifest need no cookies or auth checks.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/stripe/webhook|api/health|brand/|manifest.webmanifest|icon|apple-icon).*)"],
};
