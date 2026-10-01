"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ANALYTICS_CONSENT_KEY, setAnalyticsConsent } from "@/lib/ga";

/**
 * Cookie notice. The site always sets its own first-party cookies: sign-in (when you sign in), `orv_attr` (how you found
 * us, 90 days) and `orv_sid` (a random visit ID for our own statistics, 180 days). Without Google Analytics the notice is
 * informational. With GA on (production + NEXT_PUBLIC_GA_MEASUREMENT_ID) the visitor chooses: "Accept Google Analytics"
 * grants GA storage, "Decline" denies it (Consent Mode v2; GA storage is denied by default in the EEA/UK/CH until
 * accepted). The choice covers Google Analytics only. Whether the first-party cookies also need consent in the EEA is
 * an open legal question: docs/LEGAL_FLAGS.md.
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

  // On phones the notice is one short line, so it never covers the page's main button; the full text is on sm+.
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-xl border border-line bg-card px-3 py-2 text-xs shadow-lg sm:inset-x-4 sm:bottom-4 sm:p-4 sm:text-sm">
      {analytics ? (
        <div className="flex items-center gap-2 sm:block">
          <p className="flex-1 text-gray-700">
            <span className="sm:hidden">
              Allow Google Analytics? Our own cookies are always on. <a className="underline" href="/privacy">Privacy</a>
            </span>
            <span className="hidden sm:inline">
              We use a sign-in cookie and our own first-party cookies that remember how you found us and count visits with a
              random ID. If you accept, Google Analytics also measures which pages help people. No advertising trackers.
              See our <a className="underline" href="/privacy">privacy policy</a>.
            </span>
          </p>
          <div className="flex shrink-0 gap-2 sm:mt-3 sm:justify-end">
            <button type="button" onClick={() => close(false)} className="btn-secondary px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
              Decline
            </button>
            <button type="button" onClick={() => close(true)} className="btn-primary px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
              <span className="sm:hidden">Accept</span>
              <span className="hidden sm:inline">Accept Google Analytics</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 sm:block">
          <p className="flex-1 text-gray-700">
            <span className="sm:hidden">
              Only our own cookies, no ad trackers. <a className="underline" href="/privacy">Privacy</a>
            </span>
            <span className="hidden sm:inline">
              We use a sign-in cookie and our own first-party cookies: one remembers how you found us (90 days), the other
              counts visits with a random ID (6 months). No third-party or advertising trackers. See our{" "}
              <a className="underline" href="/privacy">privacy policy</a>.
            </span>
          </p>
          <div className="shrink-0 sm:mt-3 sm:flex sm:justify-end">
            <button type="button" onClick={() => close(null)} className="btn-primary px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
