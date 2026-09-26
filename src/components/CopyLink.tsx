"use client";

import { useState } from "react";

/** Shows a private URL and copies it — the fallback that keeps an order reachable even if the email never arrives. */
export function CopyLink({ url, label = "Your private order link" }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked (http, permissions) — the text stays selectable below
    }
  };
  return (
    <div className="rounded-lg border border-line bg-bg p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate text-xs text-fg select-all">{url}</code>
        <button type="button" onClick={copy} className="btn-secondary px-3 py-1.5 text-xs">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-500">Bookmark it or paste it somewhere safe — it opens this order without signing in.</p>
    </div>
  );
}
