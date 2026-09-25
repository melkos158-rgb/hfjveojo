import { site } from "@/config/site";

/** Shown only while legal identity fields still contain VERIFY placeholders — a reminder to a human, never shipped silently. */
export function LegalNotice() {
  const unverified = Object.values(site.legal).some((v) => typeof v === "string" && v.includes("VERIFY"));
  if (!unverified) return null;
  return (
    <div className="my-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <strong>Draft for human verification.</strong> Company identity, governing law and consumer-law wording in this page are placeholders
      (see docs/LEGAL_FLAGS.md). Update <code>src/config/site.ts</code> before launch.
    </div>
  );
}
