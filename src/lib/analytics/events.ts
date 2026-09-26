import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";

export { ATTRIBUTION_COOKIE, attributionFromUrl, parseAttributionCookie, sourceOf, type Attribution } from "@/lib/analytics/attribution";
import type { Attribution } from "@/lib/analytics/attribution";

export const SESSION_ID_COOKIE = "orv_sid";
/**
 * Set on every device where an admin opened /admin (1 year, survives signing out): the owner's and operator's own
 * browsing, previews and test checkouts then never count as visitor traffic in the funnel.
 */
export const INTERNAL_COOKIE = "orv_internal";

/** True for the owner's/operator's own devices (internal cookie) or any signed-in admin. */
export function isInternalVisitor(cookieValue: string | undefined, role?: string | null): boolean {
  return cookieValue === "1" || role === "ADMIN";
}

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
