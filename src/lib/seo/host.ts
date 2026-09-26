/**
 * One public hostname for search engines and visitors: requests for `www.<apex>` are sent to the apex (the host in
 * NEXT_PUBLIC_APP_URL, which every canonical already uses). Pure, so the middleware and tests share it.
 */
type HeaderReader = { get(name: string): string | null };

function hostsOf(headers: HeaderReader): string[] {
  // Behind Railway's proxy the request URL can carry an internal host, so read the forwarded and the plain Host header.
  return [headers.get("x-forwarded-host"), headers.get("host")]
    .flatMap((v) => (v ?? "").split(","))
    .map((h) => h.trim().toLowerCase().replace(/:\d+$/, ""))
    .filter(Boolean);
}

/** The absolute URL to redirect to, or null when the request is already on the canonical host (or must not move). */
export function canonicalHostRedirect(
  headers: HeaderReader,
  pathname: string,
  search: string,
  appUrl: string | undefined = process.env.NEXT_PUBLIC_APP_URL,
): string | null {
  let apex: URL;
  try {
    if (!appUrl) return null;
    apex = new URL(appUrl);
  } catch {
    return null;
  }
  if (apex.hostname.startsWith("www.") || apex.hostname === "localhost") return null;
  // Webhooks (Stripe) and OAuth callbacks are never redirected: their senders don't follow redirects.
  if (pathname.startsWith("/api/")) return null;
  if (!hostsOf(headers).includes(`www.${apex.hostname}`)) return null;
  return `${apex.origin}${pathname}${search}`;
}
