"use client";

import { useEffect } from "react";
import { gaEvent, gaItem, gaOnce } from "@/lib/ga";
import { trackClient } from "@/components/Analytics";

type Tool = { slug: string; name: string };

/** GA4 view_item for a tool page (our "tool_open"). */
export function GaViewItem({ tool, priceCents, currency }: { tool: Tool; priceCents: number; currency: string }) {
  useEffect(() => {
    gaEvent("view_item", { currency: currency.toUpperCase(), value: priceCents / 100, items: [gaItem(tool, priceCents)] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool.slug, tool.name, priceCents, currency]);
  return null;
}

/**
 * GA4 purchase for a paid order — once per order per browser, with our order id as transaction_id and the amount
 * Stripe charged. Rendered only for real (non-test) paid orders. `completed` also reports tool_completed once.
 */
export function GaPurchase({ orderId, tool, amountCents, currency, completed }: { orderId: string; tool: Tool; amountCents: number; currency: string; completed?: boolean }) {
  useEffect(() => {
    gaOnce(`purchase_${orderId}`, () =>
      gaEvent("purchase", { transaction_id: orderId, currency: currency.toUpperCase(), value: amountCents / 100, items: [gaItem(tool, amountCents)] }),
    );
    if (completed) gaOnce(`completed_${orderId}`, () => gaEvent("tool_completed", { tool: tool.slug }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, tool.slug, tool.name, amountCents, currency, completed]);
  return null;
}

/** A download link that reports file_download (first-party + GA) without ever sending the signed URL. */
export function TrackedDownload({ href, tool, kind, className, children, download }: { href: string; tool: string; kind: string; className?: string; children: React.ReactNode; download?: boolean }) {
  return (
    <a href={href} className={className} download={download} target={download ? undefined : "_blank"} rel={download ? undefined : "noopener noreferrer"} onClick={() => trackClient("file_download", { tool, kind })}>
      {children}
    </a>
  );
}
