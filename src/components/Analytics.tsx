"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gaEvent } from "@/lib/ga";

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

/** Our event names → GA4 event names (only product events worth a GA report; first-party keeps everything). */
const GA_EVENT_NAMES: Record<string, string> = {
  intake_started: "tool_started",
  free_tool_used: "free_tool_used",
  preview_requested: "preview_requested",
  preview_shown: "preview_shown",
  file_download: "file_download",
};

/** Only short, non-personal values go to GA. */
function gaSafe(props?: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props ?? {})) {
    if (!/^(tool|from|kind|again)$/.test(k)) continue;
    if (typeof v === "number" || typeof v === "boolean") out[k] = v;
    else if (typeof v === "string") out[k] = v.slice(0, 60);
  }
  return out;
}

/** First-party event (authoritative, /admin/analytics) + the matching GA4 event when GA is on. */
export function trackClient(name: string, props?: Record<string, unknown>) {
  if (GA_EVENT_NAMES[name]) gaEvent(GA_EVENT_NAMES[name], gaSafe(props));
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
