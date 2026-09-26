"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { findFairHousingMatches } from "@/lib/tools/qa";
import { trackClient } from "@/components/Analytics";

const LIMITS = [
  { value: 500, label: "500 (short MLS field)" },
  { value: 1000, label: "1,000 (most MLS boards)" },
  { value: 1500, label: "1,500" },
  { value: 2500, label: "2,500 (long form)" },
];

const DEMO =
  "Perfect for families! This safe neighborhood home has a master bedroom with a walk-in closet, a renovated kitchen and a big backyard. Walking distance to church and schools. Great for young professionals too.";

/** Free fair-housing + length checker for listing copy. Runs entirely in the browser — nothing you paste is sent anywhere. */
export function FairHousingChecker() {
  const [text, setText] = useState("");
  const [limit, setLimit] = useState(1000);
  const tracked = useRef(false);
  const matches = useMemo(() => findFairHousingMatches(text), [text]);
  const risks = matches.filter((m) => m.rule.severity === "risk");
  const styles = matches.filter((m) => m.rule.severity === "style");
  const over = text.length - limit;

  useEffect(() => {
    if (text.length > 40 && !tracked.current) {
      tracked.current = true;
      trackClient("free_tool_used", { tool: "fair-housing-checker" });
    }
  }, [text]);

  // Highlighted copy: the text with each match wrapped in <mark>.
  const pieces: Array<{ t: string; mark?: "risk" | "style" }> = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start < cursor) continue; // overlapping rule — first one wins
    if (m.start > cursor) pieces.push({ t: text.slice(cursor, m.start) });
    pieces.push({ t: text.slice(m.start, m.end), mark: m.rule.severity });
    cursor = m.end;
  }
  if (cursor < text.length) pieces.push({ t: text.slice(cursor) });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="fh-text" className="field-label mb-0">
            Your listing description
          </label>
          <button type="button" className="text-xs font-semibold text-accent hover:underline" onClick={() => setText(DEMO)}>
            Try a demo text
          </button>
        </div>
        <textarea
          id="fh-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder="Paste the description you are about to publish…"
          className="field-input mt-2 w-full font-normal"
          spellCheck={false}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <label htmlFor="fh-limit" className="text-gray-500">
            Character limit
          </label>
          <select id="fh-limit" value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="field-input w-auto py-1.5 text-sm">
            {LIMITS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <span className={`ml-auto font-semibold ${over > 0 ? "text-red-500" : "text-gray-500"}`}>
            {text.length.toLocaleString()} / {limit.toLocaleString()}
            {over > 0 ? ` — ${over.toLocaleString()} over` : ""}
          </span>
        </div>
        <p className="mt-3 text-xs text-gray-500">Runs in your browser. Nothing you paste is stored or sent to us.</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Result</h2>
          {text.length === 0 ? (
            <span className="badge bg-gray-100 text-gray-700">Waiting for text</span>
          ) : risks.length === 0 && over <= 0 ? (
            <span className="badge bg-green-50 text-green-700">No risky phrases, within limit</span>
          ) : (
            <span className="badge bg-red-50 text-red-700">
              {risks.length} risk{risks.length === 1 ? "" : "s"}
              {over > 0 ? " · too long" : ""}
            </span>
          )}
        </div>

        {text.length > 0 ? (
          <div className="mt-4 rounded-lg border border-line bg-bg p-3 text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
            {pieces.map((p, i) =>
              p.mark ? (
                <mark key={i} className={`rounded px-0.5 ${p.mark === "risk" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                  {p.t}
                </mark>
              ) : (
                <span key={i}>{p.t}</span>
              ),
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">Flagged phrases are highlighted here with a rewrite hint for each one.</p>
        )}

        {matches.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {[...risks, ...styles].map((m, i) => (
              <li key={`${m.start}-${i}`} className="rounded-lg border border-line p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`badge ${m.rule.severity === "risk" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{m.rule.severity === "risk" ? "Risk" : "Style"}</span>
                  <span className="font-semibold text-fg">“{m.text}”</span>
                  <span className="text-xs text-gray-500">{m.rule.basis}</span>
                </div>
                <p className="mt-1 text-gray-600">{m.rule.hint}</p>
              </li>
            ))}
          </ul>
        ) : null}

        {over > 0 ? (
          <p className="mt-4 rounded-lg border border-line p-3 text-sm text-gray-600">
            Cut {over.toLocaleString()} characters: drop the adjectives first (“stunning”, “must-see”), then merge the two shortest sentences.
          </p>
        ) : null}

        <div className="mt-6 rounded-xl border border-accent/40 bg-accent/10 p-4">
          <div className="font-semibold text-fg">Want it written for you?</div>
          <p className="mt-1 text-sm text-gray-600">
            Send the facts, get an MLS description within your limit plus a long version, three captions and hashtags — every draft passes this check before it is delivered. $9, about 5 minutes.
          </p>
          <Link href="/tools/listing-description" className="btn-primary mt-3" onClick={() => trackClient("cta_click", { from: "fair-housing-checker" })}>
            Write my listing — $9
          </Link>
        </div>
      </div>
    </div>
  );
}
