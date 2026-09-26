import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ATTRIBUTION_COOKIE, attributionFromUrl, nextAttribution, parseAttributionCookie, serializeAttribution } from "@/lib/analytics/attribution";

const SESSION_COOKIE = "orv_session";
const SESSION_ID_COOKIE = "orv_sid";

/**
 * 1) Admin gate: /admin/* requires a valid session whose role is ADMIN and whose email is in ADMIN_EMAILS.
 *    (Role/email are read from the signed cookie; the client can't forge them.)
 * 2) Attribution: UTM/ref/experiment params are captured once into a cookie for later orders (first touch), and a
 *    Google Ads click (gclid) replaces it so ad spend is credited — see src/lib/analytics/attribution.ts.
 * 3) Anonymous session id for funnel analytics (no PII).
 */
export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const res = NextResponse.next();
  // Behind Railway's proxy the app sees plain http; the visitor's scheme is in x-forwarded-proto. Cookies set over
  // HTTPS are marked Secure so they are never sent over an unencrypted connection.
  const secure = req.headers.get("x-forwarded-proto") === "https" || url.protocol === "https:";

  if (!req.cookies.get(SESSION_ID_COOKIE)) {
    res.cookies.set(SESSION_ID_COOKIE, crypto.randomUUID(), { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 180 * 24 * 3600 });
  }

  const incoming = attributionFromUrl(url, req.headers.get("referer"));
  if (incoming) {
    const next = nextAttribution(parseAttributionCookie(req.cookies.get(ATTRIBUTION_COOKIE)?.value), incoming);
    if (next) res.cookies.set(ATTRIBUTION_COOKIE, serializeAttribution(next), { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 90 * 24 * 3600 });
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
    if (req.cookies.get("orv_internal")?.value !== "1") res.cookies.set("orv_internal", "1", { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 365 * 24 * 3600 });
  }

  return res;
}

export const config = {
  // Static brand files, icons and the manifest need no cookies or auth checks.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/stripe/webhook|api/health|brand/|manifest.webmanifest|icon|apple-icon).*)"],
};
