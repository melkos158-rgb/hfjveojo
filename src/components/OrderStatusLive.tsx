"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Polls the order status while it is in flight and refreshes the server-rendered page on change. */
export function OrderStatusLive({ orderId, token, initialStatus }: { orderId: string; token?: string; initialStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const active = ["PENDING", "PAID", "PROCESSING", "RETRYING", "REVIEW"].includes(status);
    if (!active) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}${token ? `?t=${encodeURIComponent(token)}` : ""}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { status: string };
        if (data.status !== status) {
          setStatus(data.status);
          router.refresh();
        }
      } catch {
        // ignore transient errors
      }
    }, 5000);
    return () => clearInterval(id);
  }, [orderId, token, status, router]);

  return null;
}
