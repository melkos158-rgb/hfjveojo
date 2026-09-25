"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** First-party page-view beacon. No third-party scripts; the server records the event with the anonymous session id. */
export function Analytics() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    const body = JSON.stringify({ name: "page_view", path: pathname, referrer: document.referrer || null });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
      } else {
        void fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
      }
    } catch {
      // analytics must never break the page
    }
  }, [pathname]);
  return null;
}

export function trackClient(name: string, props?: Record<string, unknown>) {
  try {
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, path: window.location.pathname, props }),
      keepalive: true,
    });
  } catch {
    // ignore
  }
}
