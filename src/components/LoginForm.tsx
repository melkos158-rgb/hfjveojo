"use client";

import { useState } from "react";

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; devLink?: string };
      if (!res.ok) throw new Error(data.message ?? "Could not send the link");
      setSent(true);
      setDevLink(data.devLink ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (sent)
    return (
      <div className="mt-4 rounded-lg bg-green-50 px-3 py-3 text-sm text-green-800">
        Check your inbox — the link is valid for 20 minutes.
        {devLink ? (
          <p className="mt-2 break-all text-xs text-gray-600">
            Dev mode (no email provider configured): <a className="underline" href={devLink}>{devLink}</a>
          </p>
        ) : null}
      </div>
    );

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <input type="email" required className="field-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="btn-primary w-full" type="submit" disabled={busy}>
        {busy ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
