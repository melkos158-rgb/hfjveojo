/**
 * Google Analytics 4 helpers for client components. GA is a traffic/marketing view only — revenue, orders and costs
 * come from our own database (/admin/analytics). Everything here is a no-op when GA is not loaded (no measurement
 * ID, not production, script blocked), so analytics can never break the site. Never pass personal data (emails,
 * names, order tokens, file URLs) in params.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** EEA + UK + Switzerland: analytics storage starts "denied" there until the visitor accepts (Consent Mode v2). */
export const CONSENT_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IE", "IT", "LV", "LI", "LT", "LU",
  "MT", "NL", "NO", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "GB", "CH",
];

export const ANALYTICS_CONSENT_KEY = "orv_analytics"; // "granted" | "denied"

/** A GA4 measurement id, validated so an env value can never inject script. */
export function validGaId(id: string | undefined | null): string | null {
  return id && /^G-[A-Z0-9]{4,20}$/.test(id.trim()) ? id.trim() : null;
}

/**
 * Inline snippet rendered by the root layout before hydration, so `window.gtag` exists before any component effect
 * runs. Consent Mode v2: ads storage always denied; analytics storage denied by default in the EEA/UK/CH and granted
 * elsewhere, then the visitor's saved choice. Page views are sent by hand (see GoogleAnalytics.tsx).
 */
export function gaInitScript(id: string): string {
  return [
    "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;",
    "gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted',wait_for_update:500});",
    `gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',region:${JSON.stringify(CONSENT_REGIONS)}});`,
    `try{var c=localStorage.getItem(${JSON.stringify(ANALYTICS_CONSENT_KEY)});if(c==='granted'||c==='denied')gtag('consent','update',{analytics_storage:c});}catch(e){}`,
    "gtag('js',new Date());",
    `gtag('config',${JSON.stringify(id)},{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});`,
  ].join("");
}

export function gaReady(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

export function gaEvent(name: string, params: Record<string, unknown> = {}): void {
  try {
    if (gaReady()) window.gtag!("event", name, params);
  } catch {
    // analytics must never break the page
  }
}

/** Send an event, then run `then` once GA confirms or after a short timeout (used right before leaving for Stripe). */
export function gaEventThen(name: string, params: Record<string, unknown>, then: () => void, timeoutMs = 700): void {
  if (!gaReady()) return then();
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    then();
  };
  try {
    window.gtag!("event", name, { ...params, event_callback: finish, event_timeout: timeoutMs });
  } catch {
    finish();
    return;
  }
  setTimeout(finish, timeoutMs + 150);
}

/** Run once per browser for a key (e.g. one purchase event per order), even across reloads. */
export function gaOnce(key: string, fn: () => void): void {
  try {
    const k = `orv_ga_${key}`;
    if (window.localStorage.getItem(k)) return;
    fn();
    window.localStorage.setItem(k, "1");
  } catch {
    fn();
  }
}

/**
 * The page URL GA may see: campaign parameters kept, everything else in the query dropped (order links carry
 * access tokens), order ids collapsed so reports group by page type.
 */
export function sanitizedLocation(origin: string, pathname: string, search: string): string {
  const u = new URL(pathname.replace(/^\/orders\/[^/]+/, "/orders/:id"), origin);
  const params = new URLSearchParams(search);
  for (const [k, v] of params) {
    if (/^(utm_(source|medium|campaign|content|term)|gclid|ref|exp|variant)$/.test(k)) u.searchParams.set(k, v.slice(0, 100));
  }
  return u.toString();
}

export function setAnalyticsConsent(granted: boolean): void {
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, granted ? "granted" : "denied");
  } catch {
    // ignore
  }
  try {
    window.gtag?.("consent", "update", { analytics_storage: granted ? "granted" : "denied" });
  } catch {
    // ignore
  }
}

/** GA4 ecommerce item for a tool (no personal data). */
export function gaItem(tool: { slug: string; name: string }, priceCents: number) {
  return { item_id: tool.slug, item_name: tool.name, item_category: "tool", price: priceCents / 100, quantity: 1 };
}
