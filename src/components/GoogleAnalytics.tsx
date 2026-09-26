"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { gaEvent, sanitizedLocation } from "@/lib/ga";

import { AUTH_EVENT_COOKIE } from "@/lib/auth/events";

/**
 * GA4 page views and sign-in events. The gtag snippet itself is rendered by the root layout (production only, when
 * NEXT_PUBLIC_GA_MEASUREMENT_ID is set). Page views are sent by hand with a sanitised URL — order links carry access
 * tokens — so in GA turn off "page changes based on browser history events" in Enhanced measurement, or client-side
 * navigations are counted twice (docs/ANALYTICS.md).
 */
export function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <GaPageViews />
    </Suspense>
  );
}

function GaPageViews() {
  const pathname = usePathname();
  const search = useSearchParams();
  const query = search?.toString() ?? "";

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    gaEvent("page_view", { page_location: sanitizedLocation(window.location.origin, pathname, query), page_title: document.title });
  }, [pathname, query]);

  useEffect(() => {
    try {
      const m = document.cookie.match(new RegExp(`(?:^|; )${AUTH_EVENT_COOKIE}=([^;]+)`));
      if (!m) return;
      document.cookie = `${AUTH_EVENT_COOKIE}=; Max-Age=0; path=/`;
      const [kind, method] = decodeURIComponent(m[1]).split(":");
      if ((kind === "sign_up" || kind === "login") && (method === "email" || method === "google")) gaEvent(kind, { method });
    } catch {
      // ignore
    }
  }, [pathname]);

  return null;
}
