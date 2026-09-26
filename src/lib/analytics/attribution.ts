/**
 * Visit attribution: where a visitor came from, captured by the middleware into a first-party cookie and stored with
 * their order. Pure functions (no database), so the Edge middleware and the server share one implementation.
 *
 * Rules:
 * - First touch wins: campaign parameters / referrer of the first tracked visit are kept for 90 days.
 * - Except a paid ad click (a Google Ads click id: gclid / gbraid / wbraid): it replaces the older attribution, so the
 *   money spent on the ad is credited with the sale. The older source is kept as `firstTouch`.
 * - The click id is what lets us report a sale back to Google Ads (offline conversion import, see
 *   src/lib/ads/googleConversions.ts). It is a campaign parameter, not personal data we collect ourselves.
 */

export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  /** The search keyword when the ad's final URL suffix passes `utm_term={keyword}`. */
  utm_term?: string;
  ref?: string;
  landing?: string;
  referrer?: string;
  exp?: string; // experiment key
  variant?: string; // variant key
  firstSeen?: string;
  /** Google Ads click ids (auto-tagging). gbraid / wbraid replace gclid on some iOS traffic. */
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  /** When the paid click happened (ISO); required when the sale is reported to Google Ads. */
  clickAt?: string;
  /** Source of the earlier first touch that a paid click replaced. */
  firstTouch?: string;
};

export const ATTRIBUTION_COOKIE = "orv_attr";

/** Campaign parameters kept from the landing URL (values are cut to 80 characters). */
export const CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref", "exp", "variant"] as const;
export const CLICK_ID_KEYS = ["gclid", "gbraid", "wbraid"] as const;

/** Google click ids are URL-safe base64-ish tokens; anything else is ignored (never stored, never echoed). */
const CLICK_ID_RE = /^[A-Za-z0-9_-]{10,250}$/;

export function sourceOf(attr: unknown): string {
  const a = (attr ?? {}) as Record<string, string | undefined>;
  if (a.utm_source) return a.utm_source;
  if (a.gclid || a.gbraid || a.wbraid) return "google";
  return a.ref || a.referrer || "direct";
}

export function isPaidClick(attr: Attribution | null | undefined): boolean {
  return Boolean(attr && (attr.gclid || attr.gbraid || attr.wbraid));
}

/** Attribution carried by one request (landing URL + referrer), or null when it carries none. */
export function attributionFromUrl(url: URL, referrer: string | null, now: Date = new Date()): Attribution | null {
  const attr: Attribution = {};
  let any = false;
  for (const k of CAMPAIGN_KEYS) {
    const v = url.searchParams.get(k);
    if (v) {
      attr[k] = v.slice(0, 80);
      any = true;
    }
  }
  for (const k of CLICK_ID_KEYS) {
    const v = url.searchParams.get(k)?.trim();
    if (v && CLICK_ID_RE.test(v)) {
      attr[k] = v;
      any = true;
    }
  }
  if (referrer) {
    try {
      const host = new URL(referrer).hostname;
      if (host && host !== url.hostname && !host.endsWith(`.${url.hostname}`)) {
        attr.referrer = host.slice(0, 120);
        any = true;
      }
    } catch {
      // ignore a malformed referer
    }
  }
  if (!any) return null;
  attr.landing = url.pathname.slice(0, 120);
  attr.firstSeen = now.toISOString();
  if (isPaidClick(attr)) attr.clickAt = now.toISOString();
  return attr;
}

/**
 * What the attribution cookie should become after this request, or null to leave it untouched: the first attributed
 * visit sets it; later visits keep it, unless the new visit is a paid ad click.
 */
export function nextAttribution(existing: Attribution | null, incoming: Attribution | null): Attribution | null {
  if (!incoming) return null;
  if (!existing) return incoming;
  if (!isPaidClick(incoming)) return null;
  // The same click reloaded (e.g. back button to the landing URL) must not reset the click time.
  if (incoming.gclid && incoming.gclid === existing.gclid) return null;
  return { ...incoming, firstTouch: existing.firstTouch ?? sourceOf(existing) };
}

/**
 * The referring site only (scheme + host), never the full referring URL: a referrer's path or query can carry
 * someone's personal data (search terms, email links). Non-http(s) or malformed values are dropped.
 */
export function referrerOrigin(ref: string | null | undefined): string | null {
  if (!ref) return null;
  try {
    const u = new URL(ref);
    return u.protocol === "http:" || u.protocol === "https:" ? u.origin.slice(0, 120) : null;
  } catch {
    return null;
  }
}

export function parseAttributionCookie(raw: string | undefined): Attribution | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Attribution;
    return typeof parsed === "object" && parsed && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function serializeAttribution(attr: Attribution): string {
  return encodeURIComponent(JSON.stringify(attr));
}
