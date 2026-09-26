import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { safeEqual } from "@/lib/security/tokens";
import { site } from "@/config/site";
import { CopyLink } from "@/components/CopyLink";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thanks — order received", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ order?: string; t?: string }> };

/**
 * Stripe redirects here after checkout. This page NEVER marks the order paid — the webhook does.
 * It only shows the current state and links to the order page (which polls).
 */
export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { order: orderId, t } = await searchParams;
  if (!orderId || !t) redirect("/");
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { tool: true } });
  if (!order || !safeEqual(order.accessToken, t)) redirect("/");
  const orderPath = `/orders/${order.id}?t=${encodeURIComponent(order.accessToken)}`;

  return (
    <div className="container-x max-w-2xl py-16">
      <div className="card">
        <p className="eyebrow">Order #{order.number}</p>
        <h1 className="mt-2 text-2xl font-bold">Thanks — we&apos;re on it.</h1>
        <p className="mt-3 text-gray-700">
          {order.status === "PENDING"
            ? "Your payment is being confirmed by Stripe. This usually takes a few seconds."
            : "Payment confirmed. Your order is in the queue."}{" "}
          You&apos;ll get an email at <span className="font-semibold">{order.customerEmail}</span> with your private order page.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={orderPath} className="btn-primary">
            Open my order page
          </Link>
          <Link href="/tools" className="btn-secondary">
            Back to tools
          </Link>
        </div>
        <div className="mt-6">
          <CopyLink url={`${site.url}${orderPath}`} />
        </div>
      </div>
    </div>
  );
}
