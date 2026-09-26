"use client";

import { useRef, useState } from "react";
import type { IntakeField } from "@/lib/tools/types";
import { trackClient } from "@/components/Analytics";

type Props = {
  toolSlug: string;
  fields: IntakeField[];
  ctaLabel: string;
  priceLabel: string;
  deliveryPromise: string;
  initialEmail?: string;
};

/**
 * Renders any tool's intake from its field definitions and hands off to Stripe Checkout.
 * Price is displayed only — the server prices the order from the Product table.
 */
export function IntakeForm({ toolSlug, fields, ctaLabel, priceLabel, deliveryPromise, initialEmail }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.type === "color" ? "#3b5bfd" : f.options?.[0]?.value ?? ""])),
  );
  const [email, setEmail] = useState(initialEmail ?? "");
  const [uploading, setUploading] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, { url: string; name: string; sizeKb: number }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const onFocus = () => {
    if (!started.current) {
      started.current = true;
      trackClient("intake_started", { tool: toolSlug });
    }
  };

  const set = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
  const upload = async (key: string, file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`That photo is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 8 MB. Export it as a JPG at 2,000–3,000 px wide and try again.`);
      return;
    }
    setUploading(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = (await res.json()) as { fileId?: string; message?: string };
      if (!res.ok || !data.fileId) throw new Error(data.message ?? "Upload failed");
      set(key, data.fileId);
      setPreviews((prev) => {
        if (prev[key]) URL.revokeObjectURL(prev[key].url);
        return { ...prev, [key]: { url: URL.createObjectURL(file), name: file.name, sizeKb: Math.round(file.size / 1024) } };
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tools/${toolSlug}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, intake: values }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; message?: string };
      if (!res.ok || !data.checkoutUrl) throw new Error(data.message ?? "Could not start checkout");
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} onFocus={onFocus} className="card space-y-5" id="order">
      <div>
        <h2 className="text-xl font-bold">Start your order</h2>
        <p className="mt-1 text-sm text-gray-600">
          {priceLabel} · {deliveryPromise} · Secure payment via Stripe on the next step.
        </p>
      </div>

      {fields.map((f) => (
        <div key={f.key}>
          <label className="field-label" htmlFor={`f-${f.key}`}>
            {f.label}
            {f.required ? <span className="text-red-500"> *</span> : null}
          </label>
          {f.type === "textarea" ? (
            <textarea
              id={`f-${f.key}`}
              className="field-input"
              rows={f.rows ?? 3}
              required={f.required}
              placeholder={f.placeholder}
              value={values[f.key] ?? ""}
              onChange={(e) => set(f.key, e.target.value)}
            />
          ) : f.type === "select" ? (
            <select id={`f-${f.key}`} className="field-input" value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : f.type === "image" ? (
            <div>
              <div className="flex items-center gap-3">
                <input
                  id={`f-${f.key}`}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="text-sm"
                  onChange={(e) => upload(f.key, e.target.files?.[0])}
                />
                {uploading === f.key ? <span className="text-xs text-gray-500">Uploading…</span> : values[f.key] ? <span className="text-xs text-green-600">Uploaded ✓</span> : null}
              </div>
              {previews[f.key] ? (
                <div className="mt-3 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previews[f.key].url} alt="" className="h-20 w-28 rounded-lg border border-line object-cover" />
                  <div className="text-xs text-gray-500">
                    <div className="max-w-[16rem] truncate text-fg">{previews[f.key].name}</div>
                    <div>{previews[f.key].sizeKb} KB · uploaded, ready to go</div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : f.type === "color" ? (
            <div className="flex items-center gap-3">
              <input id={`f-${f.key}`} type="color" value={values[f.key] || "#3b5bfd"} onChange={(e) => set(f.key, e.target.value)} className="h-10 w-16 cursor-pointer rounded border border-line" />
              <span className="text-xs text-gray-500">{values[f.key]}</span>
            </div>
          ) : (
            <input
              id={`f-${f.key}`}
              type={f.type === "number" ? "number" : f.type === "url" ? "url" : "text"}
              step={f.type === "number" ? "any" : undefined}
              className="field-input"
              required={f.required}
              placeholder={f.placeholder}
              value={values[f.key] ?? ""}
              onChange={(e) => set(f.key, e.target.value)}
            />
          )}
          {f.help ? <p className="field-help">{f.help}</p> : null}
        </div>
      ))}

      <div>
        <label className="field-label" htmlFor="f-email">
          Your email (for the order page and delivery) <span className="text-red-500">*</span>
        </label>
        <input id="f-email" type="email" required className="field-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <button type="submit" className="btn-primary w-full" disabled={submitting || uploading !== null}>
        {submitting ? "Redirecting to secure checkout…" : ctaLabel}
      </button>
      <p className="text-center text-xs text-gray-500">
        By ordering you agree to our <a className="underline" href="/terms">Terms</a> and <a className="underline" href="/refund-policy">Refund Policy</a>.
      </p>
    </form>
  );
}
