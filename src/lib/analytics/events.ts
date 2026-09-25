import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";

export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  ref?: string;
  landing?: string;
  referrer?: string;
  exp?: string; // experiment key
  variant?: string; // variant key
  firstSeen?: string;
};

export const ATTRIBUTION_COOKIE = "orv_attr";
export const SESSION_ID_COOKIE = "orv_sid";

export type TrackInput = {
  sessionId?: string | null;
  userId?: string | null;
  orderId?: string | null;
  experimentId?: string | null;
  path?: string | null;
  referrer?: string | null;
  utm?: Attribution | null;
  props?: Record<string, unknown>;
  ipHash?: string | null;
  userAgent?: string | null;
};

/** Persist a product event. Never throws — analytics must not break checkout. */
export async function track(name: string, input: TrackInput = {}): Promise<void> {
  try {
    await prisma.event.create({
      data: {
        name,
        sessionId: input.sessionId ?? undefined,
        userId: input.userId ?? undefined,
        orderId: input.orderId ?? undefined,
        experimentId: input.experimentId ?? undefined,
        path: input.path ?? undefined,
        referrer: input.referrer ?? undefined,
        utm: (input.utm as object) ?? undefined,
        props: (input.props as object) ?? undefined,
        ipHash: input.ipHash ?? undefined,
        userAgent: input.userAgent?.slice(0, 300) ?? undefined,
      },
    });
  } catch (err) {
    log.warn("track.failed", { name, error: (err as Error).message });
  }
}

export function parseAttributionCookie(raw: string | undefined): Attribution | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Attribution;
    return typeof parsed === "object" && parsed ? parsed : null;
  } catch {
    return null;
  }
}

/** Build first-touch attribution from a request URL + referrer (used by middleware). */
export function attributionFromUrl(url: URL, referrer: string | null): Attribution | null {
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "ref", "exp", "variant"] as const;
  const attr: Attribution = {};
  let any = false;
  for (const k of keys) {
    const v = url.searchParams.get(k);
    if (v) {
      attr[k] = v.slice(0, 80);
      any = true;
    }
  }
  if (referrer) {
    try {
      const host = new URL(referrer).hostname;
      if (host && !host.endsWith(url.hostname)) {
        attr.referrer = host.slice(0, 120);
        any = true;
      }
    } catch {
      // ignore
    }
  }
  if (!any) return null;
  attr.landing = url.pathname.slice(0, 120);
  attr.firstSeen = new Date().toISOString();
  return attr;
}
