"use client";

import { useEffect, useRef, useState } from "react";
import type { IntakeField } from "@/lib/tools/types";
import { trackClient } from "@/components/Analytics";
import { gaEventThen, gaItem as toGaItem } from "@/lib/ga";

type Props = {
  toolSlug: string;
  fields: IntakeField[];
  ctaLabel: string;
  priceLabel: string;
  deliveryPromise: string;
  initialEmail?: string;
  /** Tools with a free preview (virtual staging) show a "see it first" button once the photo is uploaded. */
  preview?: { label: string };
  /** Admins on a live site may pay in the Stripe sandbox (test card) to test the whole flow without real money. */
  adminSandbox?: boolean;
  /** For the GA4 begin_checkout event (no personal data). */
  gaItem?: { name: string; priceCents: number; currency: string };
  /**
   * Tools priced per unit (a "rooms" field: one unit per photo). Display only — the server prices the order.
   * `ctaMany` may use {n} and {total}.
   */
  perUnit?: { unitCents: number; one: string; many: string; ctaMany?: string };
  /**
   * Admin use (orders paid on a marketplace): submit the validated intake to this callback instead of starting a
   * Stripe checkout. The email field and the terms line are hidden; `extraFields` renders above the button.
   */
  onSubmitIntake?: (p: { email: string; intake: Record<string, string> }) => Promise<void>;
  extraFields?: React.ReactNode;
  heading?: string;
  submitLabel?: string;
};

type ReadyPreview = { image: string; width?: number; height?: number; caption?: string };

/** One photo of a "rooms" field: uploading until it has a fileId; roomType "" until the customer picks one. */
type RoomItem = { id: string; fileId: string | null; roomType: string; url: string; name: string; sizeKb: number };

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const money = (cents: number) => `$${(cents / 100).toFixed(2).replace(/\.00$/, "")}`;

function initialValue(f: IntakeField): string {
  if (f.type === "color") return "#3b5bfd";
  if (f.type === "rooms") return "[]";
  return f.options?.[0]?.value ?? "";
}

/**
 * Renders any tool's intake from its field definitions and hands off to Stripe Checkout.
 * Price is displayed only — the server prices the order from the Product table.
 */
export function IntakeForm({ toolSlug, fields, ctaLabel, priceLabel, deliveryPromise, initialEmail, preview, adminSandbox, gaItem, perUnit, onSubmitIntake, extraFields, heading, submitLabel }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.key, initialValue(f)])));
  const [email, setEmail] = useState(initialEmail ?? "");
  const [uploading, setUploading] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, { url: string; name: string; sizeKb: number }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sandbox, setSandbox] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const imageKey = fields.find((f) => f.type === "image")?.key;
  const roomsField = fields.find((f) => f.type === "rooms");
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const roomsRef = useRef<RoomItem[]>([]);
  const [missingType, setMissingType] = useState<string | null>(null);
  // The last good preview stays on screen while a new one is made or if a re-preview is refused.
  const [pvReady, setPvReady] = useState<ReadyPreview | null>(null);
  const [pvSince, setPvSince] = useState<number | null>(null);
  const [pvError, setPvError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pvRequest = useRef(0);

  const uploadedRooms = rooms.filter((r) => r.fileId);
  const quantity = roomsField ? Math.max(1, uploadedRooms.length) : 1;
  const hasPhoto = roomsField ? uploadedRooms.length > 0 && Boolean(uploadedRooms[0].roomType) : imageKey ? Boolean(values[imageKey]) : false;
  const firstRoomFileId = uploadedRooms[0]?.fileId ?? null;

  useEffect(() => {
    if (pvSince === null) return;
    const t = setInterval(() => setElapsed(Math.round((Date.now() - pvSince) / 1000)), 1000);
    return () => clearInterval(t);
  }, [pvSince]);

  // The rooms field travels as JSON in the intake (validated and normalised on the server).
  useEffect(() => {
    roomsRef.current = rooms;
    if (!roomsField) return;
    const payload = JSON.stringify(rooms.filter((r) => r.fileId && r.roomType).map((r) => ({ photoFileId: r.fileId, roomType: r.roomType })));
    setValues((prev) => (prev[roomsField.key] === payload ? prev : { ...prev, [roomsField.key]: payload }));
  }, [rooms, roomsField]);

  // The preview shows the first photo: a different first photo gets its own preview.
  useEffect(() => {
    pvRequest.current++;
    setPvReady(null);
    setPvError(null);
    setPvSince(null);
  }, [firstRoomFileId]);

  useEffect(
    () => () => {
      for (const r of roomsRef.current) URL.revokeObjectURL(r.url);
    },
    [],
  );

  function resetPreview() {
    pvRequest.current++; // a preview still in flight is for the old photo: drop it when it arrives
    setPvReady(null);
    setPvError(null);
    setPvSince(null);
  }

  const requestPreview = async () => {
    const req = ++pvRequest.current;
    setError(null);
    setPvError(null);
    setElapsed(0);
    setPvSince(Date.now());
    trackClient("preview_requested", { tool: toolSlug, again: pvReady ? 1 : 0 });
    try {
      const res = await fetch(`/api/tools/${toolSlug}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake: values }),
      });
      const data = (await res.json()) as { image?: string; width?: number; height?: number; caption?: string; message?: string };
      if (!res.ok || !data.image) throw new Error(data.message ?? "The preview could not be made right now.");
      if (req !== pvRequest.current) return;
      setPvReady({ image: data.image, width: data.width, height: data.height, caption: data.caption });
      trackClient("preview_shown", { tool: toolSlug });
    } catch (err) {
      if (req === pvRequest.current) setPvError((err as Error).message);
    } finally {
      if (req === pvRequest.current) setPvSince(null);
    }
  };

  const onFocus = () => {
    if (!started.current) {
      started.current = true;
      trackClient("intake_started", { tool: toolSlug });
    }
  };

  const set = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const tooBig = (file: File) => `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 8 MB. Export it as a JPG at 2,000–3,000 px wide and try again.`;

  async function sendUpload(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const data = (await res.json()) as { fileId?: string; message?: string };
    if (!res.ok || !data.fileId) throw new Error(data.message ?? "Upload failed");
    return data.fileId;
  }

  const upload = async (key: string, file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(tooBig(file));
      return;
    }
    setUploading(key);
    try {
      const fileId = await sendUpload(file);
      set(key, fileId);
      if (key === imageKey) resetPreview(); // a new photo gets its own preview
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

  /** Several photos at once, uploaded one after the other; the first photo of the order defaults to the first room type. */
  const addRoomPhotos = async (field: IntakeField, list: FileList | null) => {
    if (!list || list.length === 0) return;
    setError(null);
    const max = field.max ?? 6;
    const free = max - roomsRef.current.length;
    const files = Array.from(list);
    const problems: string[] = [];
    if (files.length > free) problems.push(`Up to ${max} photos per order — ${files.length - Math.max(0, free)} not added.`);
    setUploading(field.key);
    try {
      for (const file of files.slice(0, Math.max(0, free))) {
        if (file.size > MAX_UPLOAD_BYTES) {
          problems.push(tooBig(file));
          continue;
        }
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const item: RoomItem = {
          id,
          fileId: null,
          roomType: roomsRef.current.length === 0 ? (field.options?.[0]?.value ?? "") : "",
          url: URL.createObjectURL(file),
          name: file.name,
          sizeKb: Math.round(file.size / 1024),
        };
        roomsRef.current = [...roomsRef.current, item];
        setRooms(roomsRef.current);
        try {
          const fileId = await sendUpload(file);
          roomsRef.current = roomsRef.current.map((r) => (r.id === id ? { ...r, fileId } : r));
        } catch (err) {
          URL.revokeObjectURL(item.url);
          roomsRef.current = roomsRef.current.filter((r) => r.id !== id);
          problems.push(`${file.name}: ${(err as Error).message}`);
        }
        setRooms(roomsRef.current);
      }
    } finally {
      setUploading(null);
      if (problems.length) setError(problems.join(" "));
    }
  };

  const setRoomType = (id: string, roomType: string) => {
    if (missingType === id) setMissingType(null);
    roomsRef.current = roomsRef.current.map((r) => (r.id === id ? { ...r, roomType } : r));
    setRooms(roomsRef.current);
  };

  const removeRoom = (id: string) => {
    const gone = roomsRef.current.find((r) => r.id === id);
    if (gone) URL.revokeObjectURL(gone.url);
    roomsRef.current = roomsRef.current.filter((r) => r.id !== id);
    setRooms(roomsRef.current);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (roomsField) {
      if (roomsField.required && uploadedRooms.length === 0) {
        setError("Upload at least one room photo.");
        return;
      }
      const untyped = uploadedRooms.find((r) => !r.roomType);
      if (untyped) {
        setMissingType(untyped.id);
        setError("Choose the room type for each photo — it tells the stager which furniture belongs there.");
        document.getElementById(`room-type-${untyped.id}`)?.focus();
        return;
      }
    }
    setSubmitting(true);
    if (onSubmitIntake) {
      try {
        await onSubmitIntake({ email, intake: values });
      } catch (err) {
        setError((err as Error).message);
        setSubmitting(false);
      }
      return;
    }
    try {
      const res = await fetch(`/api/tools/${toolSlug}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, intake: values, ...(adminSandbox && sandbox ? { sandbox: true } : {}) }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; message?: string };
      if (!res.ok || !data.checkoutUrl) throw new Error(data.message ?? "Could not start checkout");
      const url = data.checkoutUrl;
      const go = () => {
        window.location.href = url;
      };
      if (gaItem && !(adminSandbox && sandbox)) {
        const item = { ...toGaItem({ slug: toolSlug, name: gaItem.name }, gaItem.priceCents), quantity };
        gaEventThen("begin_checkout", { currency: gaItem.currency.toUpperCase(), value: (gaItem.priceCents * quantity) / 100, items: [item] }, go);
      } else go();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  const total = perUnit ? perUnit.unitCents * quantity : null;
  const buttonLabel =
    perUnit && quantity > 1 && perUnit.ctaMany ? perUnit.ctaMany.replace("{n}", String(quantity)).replace("{total}", money(perUnit.unitCents * quantity)) : ctaLabel;

  return (
    <form onSubmit={submit} onFocus={onFocus} className="card space-y-5" id="order">
      <div>
        <h2 className="text-xl font-bold">{heading ?? "Start your order"}</h2>
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
          ) : f.type === "rooms" ? (
            <div className="space-y-3">
              {rooms.length > 0 ? (
                <ul className="space-y-2">
                  {rooms.map((r, idx) => (
                    <li key={r.id} className={`flex flex-wrap items-center gap-3 rounded-xl border p-2 ${missingType === r.id ? "border-red-400 bg-red-50" : "border-line"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.url} alt="" className="h-16 w-24 shrink-0 rounded-lg border border-line object-cover" />
                      <div className="min-w-0 flex-1 text-xs text-gray-500">
                        <div className="truncate font-semibold text-fg">
                          {rooms.length > 1 ? `Photo ${idx + 1} · ` : ""}
                          {r.name}
                        </div>
                        <div>{r.fileId ? `${r.sizeKb} KB · uploaded ✓` : "Uploading…"}</div>
                      </div>
                      <div className="flex w-full items-center gap-2 sm:w-auto">
                        <label className="sr-only" htmlFor={`room-type-${r.id}`}>
                          Room type of photo {idx + 1}
                        </label>
                        <select
                          id={`room-type-${r.id}`}
                          className="field-input flex-1 sm:w-44"
                          value={r.roomType}
                          onChange={(e) => setRoomType(r.id, e.target.value)}
                          aria-invalid={missingType === r.id}
                        >
                          {r.roomType ? null : <option value="">Which room is this?</option>}
                          {f.options?.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <button type="button" className="rounded-lg px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-bg hover:text-fg" onClick={() => removeRoom(r.id)} aria-label={`Remove photo ${idx + 1}`}>
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
              {rooms.length < (f.max ?? 6) ? (
                <label
                  htmlFor={`f-${f.key}`}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line px-3 py-4 text-sm font-semibold text-accent focus-within:ring-2 focus-within:ring-brand/30 hover:border-accent ${uploading === f.key ? "pointer-events-none opacity-60" : ""}`}
                >
                  {uploading === f.key ? "Uploading…" : rooms.length === 0 ? "Choose room photos" : "+ Add another room"}
                  <input
                    id={`f-${f.key}`}
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      const input = e.currentTarget;
                      void addRoomPhotos(f, input.files).finally(() => {
                        input.value = ""; // the same photo can be picked again after removing it
                      });
                    }}
                  />
                </label>
              ) : (
                <p className="text-xs text-gray-500">That's the maximum of {f.max ?? 6} photos for one order.</p>
              )}
              {perUnit && uploadedRooms.length > 1 ? (
                <p className="text-sm font-semibold">
                  {uploadedRooms.length} {perUnit.many} × {money(perUnit.unitCents)} = {money(total ?? 0)}
                </p>
              ) : null}
            </div>
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

      {preview && (imageKey || roomsField) ? (
        <div className="rounded-xl border border-line bg-bg p-3">
          {pvReady ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pvReady.image} alt="Free preview: your room, virtually staged" width={pvReady.width} height={pvReady.height} className={`h-auto w-full rounded-lg border border-line ${pvSince ? "opacity-60" : ""}`} />
              <p className="mt-2 text-xs text-gray-500">
                {pvReady.caption}
                {uploadedRooms.length > 1 ? " The preview uses your first photo." : ""}
              </p>
              <button type="button" className="mt-2 text-xs font-semibold text-accent hover:underline disabled:opacity-60" onClick={requestPreview} disabled={pvSince !== null || uploading !== null}>
                {pvSince ? `Staging again… ${elapsed}s` : "Changed the room or style? Preview again"}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                {pvSince
                  ? `Staging your photo… ${elapsed}s (usually under a minute)`
                  : hasPhoto
                    ? uploadedRooms.length > 1
                      ? "Not sure yet? See one version of your first photo — free, watermarked."
                      : "Not sure yet? See one version of your own room first — free, watermarked."
                    : uploadedRooms.length > 0
                      ? "Choose the room type of your first photo to preview it."
                      : "Upload a photo above to see a free preview of your room first."}
              </p>
              <button type="button" className="btn-secondary" onClick={requestPreview} disabled={!hasPhoto || uploading !== null || pvSince !== null}>
                {pvSince ? "Working…" : preview.label}
              </button>
            </div>
          )}
          {pvError ? <p className="mt-2 text-sm text-red-700">{pvError}</p> : null}
        </div>
      ) : null}

      {onSubmitIntake ? null : (
        <div>
          <label className="field-label" htmlFor="f-email">
            Your email (for the order page and delivery) <span className="text-red-500">*</span>
          </label>
          <input id="f-email" type="email" required className="field-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      )}

      {extraFields}

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {adminSandbox ? (
        <label className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <input type="checkbox" className="mt-0.5" checked={sandbox} onChange={(e) => setSandbox(e.target.checked)} />
          <span>Admin: pay in the Stripe sandbox (test card 4242…, no real money). The order is flagged as a test.</span>
        </label>
      ) : null}

      <button type="submit" className="btn-primary w-full" disabled={submitting || uploading !== null}>
        {submitting ? (onSubmitIntake ? "Creating the order…" : "Redirecting to secure checkout…") : (submitLabel ?? buttonLabel)}
      </button>
      {onSubmitIntake ? null : (
        <p className="text-center text-xs text-gray-500">
          By ordering you agree to our <a className="underline" href="/terms">Terms</a> and <a className="underline" href="/refund-policy">Refund Policy</a>.
        </p>
      )}
    </form>
  );
}
