"use client";

import { useState } from "react";

export function FeedbackForm({ orderId, token }: { orderId: string; token?: string }) {
  const [rating, setRating] = useState<number>(0);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/feedback${token ? `?t=${encodeURIComponent(token)}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: rating || null, text }),
      });
      if (!res.ok) throw new Error(((await res.json()) as { message?: string }).message ?? "Could not send feedback");
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) return <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Thank you — your feedback goes straight to the person who made this.</p>;

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`} className={`text-2xl ${n <= rating ? "text-accent" : "text-gray-300"}`}>
            ★
          </button>
        ))}
      </div>
      <textarea className="field-input" rows={3} required minLength={3} placeholder="What worked? What would make this worth more to you?" value={text} onChange={(e) => setText(e.target.value)} />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button type="submit" className="btn-secondary" disabled={busy}>
        {busy ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
