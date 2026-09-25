import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/guards";
import { safeEqual } from "@/lib/security/tokens";

/**
 * Who may see an order: the signed-in owner, an admin, or anyone holding the order's access token (magic order link).
 */
export async function loadOrderForViewer(orderId: string, token?: string | null) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { tool: true, outputs: { orderBy: { createdAt: "desc" } }, feedback: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!order) return null;
  const session = await getSession();
  const owner = session && order.userId && session.id === order.userId;
  const byToken = token ? safeEqual(order.accessToken, token) : false;
  if (!owner && !byToken && !isAdmin(session)) return null;
  return order;
}

export function publicOrderStatus(status: string): { label: string; tone: "gray" | "blue" | "amber" | "green" | "red" } {
  switch (status) {
    case "PENDING":
      return { label: "Awaiting payment confirmation", tone: "gray" };
    case "PAID":
      return { label: "Paid — queued", tone: "blue" };
    case "PROCESSING":
    case "RETRYING":
      return { label: "In progress", tone: "blue" };
    case "REVIEW":
      return { label: "In progress — quality check", tone: "amber" };
    case "COMPLETED":
      return { label: "Delivered", tone: "green" };
    case "FAILED":
      return { label: "Delayed — we're on it", tone: "red" };
    case "REFUNDED":
      return { label: "Refunded", tone: "gray" };
    case "CANCELED":
      return { label: "Cancelled", tone: "gray" };
    default:
      return { label: status, tone: "gray" };
  }
}
