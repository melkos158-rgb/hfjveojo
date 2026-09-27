import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { CONTENT_UPDATED, sitemapEntries } from "@/lib/seo/sitemap-entries";

/**
 * IndexNow tells Bing and the other IndexNow engines (Yandex, Seznam, Naver, Yep, Amazon) which URLs are new or changed,
 * so they crawl them without waiting to find them. One submission to the shared endpoint reaches all of them. Google does
 * not take part: Search Console covers Google. Protocol: https://www.indexnow.org/documentation
 *
 * INDEXNOW_KEY is not a secret. It is a public ownership token that must be served at https://<host>/<key>.txt
 * (public/<key>.txt), where the engines read it to check that the submitter controls the site.
 *
 * The hourly maintenance job calls maybeSubmitIndexNow(): it submits the sitemap URLs (plus the retired old-site paths)
 * once per CONTENT_UPDATED value, in production only, after checking that the key file is live. The protocol asks for
 * submissions only when content changes, so nothing is resent while the version stays the same.
 */
export const INDEXNOW_KEY = "1b9b3b9e4ab3caa360e818027ff1d157";
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const INDEXNOW_SETTING = "seo.indexnow";
/** A failed submission for the same content version is retried at most this often. */
export const INDEXNOW_RETRY_MS = 6 * 3600_000;
/**
 * Pages of the old site on this domain (Ride Lab) that search engines still list and that answer 404 now. The protocol
 * covers deleted URLs too, so they go with the submission and the engines recrawl and drop them sooner. (Their `www.`
 * copies can't be submitted: www redirects to the apex, so no key file answers there.)
 */
export const RETIRED_PATHS = [
  "/pl/",
  "/pl",
  "/en/",
  "/en",
  "/pl/sklep",
  "/en/shop",
  "/pl/o-nas",
  "/en/about",
  "/pl/kontakt",
  "/en/contact",
  "/pl/faq",
  "/en/faq",
  "/pl/regulamin",
  "/en/terms",
  "/pl/polityka-prywatnosci",
  "/en/privacy",
];

/** Everything one submission covers: the live sitemap URLs plus the retired paths on the same host. */
export function indexNowUrls(baseUrl: string): string[] {
  const base = baseUrl.replace(/\/+$/, "");
  return [...sitemapEntries(base).map((e) => e.url), ...RETIRED_PATHS.map((p) => `${base}${p}`)];
}

export type IndexNowPayload = { host: string; key: string; keyLocation: string; urlList: string[] };
export type IndexNowRecord = { version: string; status: number; ok: boolean; at: string; count: number };
export type IndexNowOutcome =
  | { submitted: number; status: number; ok: boolean }
  | { skipped: "disabled" | "not production" | "no public host" | "up to date" | "key file not live" };

type FetchLike = (input: string, init?: RequestInit) => Promise<Pick<Response, "status" | "text">>;
type SettingStore = {
  setting: {
    findUnique(args: { where: { key: string } }): Promise<{ value: unknown } | null>;
    upsert(args: { where: { key: string }; create: { key: string; value: IndexNowRecord }; update: { value: IndexNowRecord } }): Promise<unknown>;
  };
};

/** The key format the protocol accepts: 8–128 characters of a–z, A–Z, 0–9 and dashes. */
export function validIndexNowKey(key: string): boolean {
  return /^[A-Za-z0-9-]{8,128}$/.test(key);
}

/** The origin a submission may speak for: a public https host, never localhost or a bare IP. */
export function publicOrigin(appUrl: string | undefined): URL | null {
  if (!appUrl) return null;
  let u: URL;
  try {
    u = new URL(appUrl);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || /^[\d.]+$/.test(host) || host.includes(":") || !host.includes(".")) return null;
  return u;
}

/** Builds the POST body. URLs on other hosts are dropped (the engines reject a list that mixes hosts). */
export function indexNowPayload(appUrl: string | undefined, urls: string[], key: string = INDEXNOW_KEY): IndexNowPayload | null {
  const origin = publicOrigin(appUrl);
  if (!origin || !validIndexNowKey(key)) return null;
  const urlList = [
    ...new Set(
      urls.filter((raw) => {
        try {
          const u = new URL(raw);
          return u.protocol === "https:" && u.hostname.toLowerCase() === origin.hostname.toLowerCase();
        } catch {
          return false;
        }
      }),
    ),
  ];
  if (urlList.length === 0) return null;
  return { host: origin.hostname.toLowerCase(), key, keyLocation: `${origin.origin}/${key}.txt`, urlList: urlList.slice(0, 10_000) };
}

/** Submit only when this content version was never submitted, or its last attempt failed long enough ago. */
export function shouldSubmit(stored: IndexNowRecord | null, version: string, now: Date): boolean {
  if (!stored || stored.version !== version) return true;
  if (stored.ok) return false;
  const last = Date.parse(stored.at);
  return !Number.isFinite(last) || now.getTime() - last >= INDEXNOW_RETRY_MS;
}

/** 200 = submitted, 202 = received with the key check pending. 400/403/422/429 are failures. */
export async function submitIndexNow(payload: IndexNowPayload, fetchImpl: FetchLike = fetch): Promise<{ status: number; ok: boolean }> {
  const res = await fetchImpl(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });
  return { status: res.status, ok: res.status === 200 || res.status === 202 };
}

/** The engines fetch keyLocation to verify ownership; checking it first avoids a 403 while a deploy is still switching over. */
export async function keyFileLive(keyLocation: string, key: string, fetchImpl: FetchLike = fetch): Promise<boolean> {
  try {
    const res = await fetchImpl(keyLocation, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(10_000) });
    return res.status === 200 && (await res.text()).trim() === key;
  } catch {
    return false;
  }
}

export async function maybeSubmitIndexNow(
  opts: { appEnv?: string; appUrl?: string; disabled?: boolean; now?: Date; fetchImpl?: FetchLike; db?: SettingStore; urls?: string[] } = {},
): Promise<IndexNowOutcome> {
  const disabled = opts.disabled ?? env().INDEXNOW_DISABLED;
  if (disabled) return { skipped: "disabled" };
  const appEnv = opts.appEnv ?? env().APP_ENV;
  if (appEnv !== "production") return { skipped: "not production" };
  const appUrl = opts.appUrl ?? env().NEXT_PUBLIC_APP_URL;
  const payload = indexNowPayload(appUrl, opts.urls ?? indexNowUrls(appUrl));
  if (!payload) return { skipped: "no public host" };

  const db = opts.db ?? prisma;
  const now = opts.now ?? new Date();
  const fetchImpl = opts.fetchImpl ?? fetch;
  const version = CONTENT_UPDATED.toISOString();
  const row = await db.setting.findUnique({ where: { key: INDEXNOW_SETTING } });
  const stored = (row?.value ?? null) as IndexNowRecord | null;
  if (!shouldSubmit(stored, version, now)) return { skipped: "up to date" };
  // Not recorded as an attempt: the next hourly run simply checks again.
  if (!(await keyFileLive(payload.keyLocation, payload.key, fetchImpl))) return { skipped: "key file not live" };

  const result = await submitIndexNow(payload, fetchImpl).catch(() => ({ status: 0, ok: false }));
  const value: IndexNowRecord = { version, status: result.status, ok: result.ok, at: now.toISOString(), count: payload.urlList.length };
  await db.setting.upsert({ where: { key: INDEXNOW_SETTING }, create: { key: INDEXNOW_SETTING, value }, update: { value } });
  return { submitted: payload.urlList.length, status: result.status, ok: result.ok };
}
