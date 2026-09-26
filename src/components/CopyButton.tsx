"use client";

import { useState } from "react";

/** Copies text to the clipboard and confirms briefly. */
export function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`btn-secondary px-3 py-1 text-xs ${className}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          // clipboard blocked: the text is still selectable
        }
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}
