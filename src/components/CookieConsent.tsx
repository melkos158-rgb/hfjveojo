"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ANALYTICS_CONSENT_KEY, setAnalyticsConsent } from "@/lib/ga";

/**
 * Consent notice. Without Google Analytics the site sets only functional cookies (session, first-touch attribution,
 * anonymous session id) and the notice is informational. With GA on (production + NEXT_PUBLIC_GA_MEASUREMENT_ID),
 * the visitor chooses: "Accept analytics" grants GA storage, "Essential only" denies it (Consent Mode v2; GA storage
 * is denied by default in the EEA/UK/CH until accepted). See docs/LEGAL_FLAGS.md.
 */
export function CookieConsent({ analytics = false }: { analytics?: boolean }) {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const decided = analytics ? window.localStorage.getItem(ANALYTICS_CONSENT_KEY) : window.localStorage.getItem("orv_consent");
      if (!decided) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [analytics]);

  // Admin and checkout-return pages are not the place for a banner; the notice is on every public page anyway.
  if (!visible || pathname?.startsWith("/admin") || pathname?.startsWith("/checkout")) return null;

  const close = (granted: boolean | null) => {
    try {
      window.localStorage.setItem("orv_consent", new Date().toISOString());
    } catch {
      // ignore
    }
    if (granted !== null) setAnalyticsConsent(granted);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-xl border border-line bg-card p-4 text-sm shadow-lg">
      {analytics ? (
        <>
          <p className="text-gray-700">
            We use essential cookies to keep you signed in and remember where you came from, and — if you accept — Google
            Analytics to see which pages help people. No advertising trackers. See our <a className="underline" href="/privacy">privacy policy</a>.
          </p>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => close(false)} className="btn-secondary px-4 py-2">
              Essential only
            </button>
            <button type="button" onClick={() => close(true)} className="btn-primary px-4 py-2">
              Accept analytics
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-gray-700">
            We use only essential cookies: to keep you signed in, remember where you came from, and count visits without
            identifying you. No advertising trackers. See our <a className="underline" href="/privacy">privacy policy</a>.
          </p>
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={() => close(null)} className="btn-primary px-4 py-2">
              Got it
            </button>
          </div>
        </>
      )}
    </div>
  );
}
