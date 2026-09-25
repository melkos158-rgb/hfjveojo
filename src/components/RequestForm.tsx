"use client";

import { useState } from "react";

const PROFESSIONS = [
  { value: "real-estate", label: "Real-estate agent / RE videographer" },
  { value: "photography", label: "Photographer" },
  { value: "contractor", label: "Contractor / trades" },
  { value: "other", label: "Something else" },
] as const;

type Profession = (typeof PROFESSIONS)[number]["value"];

function guessProfession(topic?: string): Profession {
  if (!topic) return "real-estate";
  if (topic.startsWith("contract")) return "contractor";
  if (topic.startsWith("photo")) return "photography";
  if (topic.startsWith("real")) return "real-estate";
  return "other";
}

/** Demand capture: what result would you pay for? Posts to /api/requests (rate-limited, honeypot). */
export function RequestForm({ topic }: { topic?: string }) {
  const [profession, setProfession] = useState<Profession>(guessProfession(topic));
  const [email, setEmail] = useState("");
  const [need, setNeed] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const website = (new FormData(e.currentTarget).get("website") as string) ?? "";
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, profession, need, topic, website }),
      });
      if (!res.ok) throw new Error(((await res.json()) as { message?: string }).message ?? "Could not send your request");
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
        Got it — thank you. Requests decide what gets built next; if you left an email, you will hear from us when this exists (or sooner with a question).
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div>
        <label className="field-label" htmlFor="rq-profession">
          You are a
        </label>
        <select id="rq-profession" className="field-input" value={profession} onChange={(e) => setProfession(e.target.value as Profession)}>
          {PROFESSIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="rq-need">
          What should go in, and what should come out?
        </label>
        <textarea
          id="rq-need"
          className="field-input"
          rows={4}
          required
          minLength={8}
          maxLength={2000}
          value={need}
          onChange={(e) => setNeed(e.target.value)}
          placeholder="Example: I send a voice note and 6 photos from the job site → I get a one-page proposal with a price the client can sign."
        />
        <p className="field-help">One sentence is enough. Mention what you pay for it today, if anything.</p>
      </div>
      <div>
        <label className="field-label" htmlFor="rq-email">
          Email <span className="font-normal text-gray-500">(optional — only to tell you when it exists)</span>
        </label>
        <input id="rq-email" type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
