"use client";

import { useEffect, useState } from "react";

/**
 * Minimal consent notice. The site sets only functional cookies (session, first-touch attribution, anonymous
 * session id) and no third-party trackers. Whether a consent banner is legally required for that in the
 * founder's jurisdiction is flagged in docs/LEGAL_FLAGS.md — this banner errs on the side of transparency.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem("orv_consent")) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const accept = () => {
    try {
      window.localStorage.setItem("orv_consent", new Date().toISOString());
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-xl border border-line bg-white p-4 text-sm shadow-lg">
      <p className="text-gray-700">
        We use only essential cookies: to keep you signed in, remember where you came from, and count visits without
        identifying you. No advertising trackers. See our <a className="underline" href="/privacy">privacy policy</a>.
      </p>
      <div className="mt-3 flex justify-end">
        <button type="button" onClick={accept} className="btn-primary px-4 py-2">
          Got it
        </button>
      </div>
    </div>
  );
}
