"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { IntakeField } from "@/lib/tools/types";
import { IntakeForm } from "@/components/IntakeForm";

const CHANNELS = [
  { value: "fiverr", label: "Fiverr", fee: 0.2 },
  { value: "upwork", label: "Upwork", fee: 0.1 },
  { value: "etsy", label: "Etsy", fee: 0.1 },
  { value: "direct", label: "Direct deal (paid outside Stripe)", fee: 0 },
  { value: "other", label: "Other", fee: 0 },
] as const;

const toCents = (v: string) => Math.round(Number(v.replace(",", ".")) * 100);

/**
 * Admin form for an order paid on a marketplace: the tool's own intake form (uploads included) plus what the buyer
 * paid, the channel's fee and its order number. Creates a PAID order that runs through the normal pipeline.
 */
export function ExternalOrderForm({ toolSlug, toolName, fields, defaultEmail, unitCents }: { toolSlug: string; toolName: string; fields: IntakeField[]; defaultEmail: string; unitCents: number }) {
  const router = useRouter();
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]["value"]>("fiverr");
  const [amount, setAmount] = useState((unitCents / 100).toFixed(2));
  const [fee, setFee] = useState(((unitCents / 100) * 0.2).toFixed(2));
  const [feeTouched, setFeeTouched] = useState(false);
  const [ref, setRef] = useState("");
  const [deliverTo, setDeliverTo] = useState(defaultEmail);

  const autoFee = (a: string, c: string) => {
    if (feeTouched) return;
    const rate = CHANNELS.find((x) => x.value === c)?.fee ?? 0;
    const cents = toCents(a);
    setFee(Number.isFinite(cents) ? ((cents * rate) / 100).toFixed(2) : "0.00");
  };

  const submit = async ({ intake }: { email: string; intake: Record<string, string> }) => {
    const amountCents = toCents(amount);
    const feeCents = toCents(fee);
    if (!Number.isFinite(amountCents) || amountCents < 100) throw new Error("Enter what the buyer paid (at least $1).");
    if (!Number.isFinite(feeCents) || feeCents < 0 || feeCents > amountCents) throw new Error("The fee must be between $0 and the amount.");
    const res = await fetch("/api/admin/orders/external", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolSlug, intake, channel, amountCents, feeCents, externalRef: ref, deliverTo }),
    });
    const data = (await res.json()) as { orderId?: string; message?: string };
    if (!res.ok || !data.orderId) throw new Error(data.message ?? "Could not create the order");
    router.push(`/admin/orders/${data.orderId}`);
  };

  const extra = (
    <fieldset className="space-y-4 rounded-xl border border-amber-300/60 p-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-amber-700">Paid outside Stripe</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="field-label">Channel</span>
          <select
            className="field-input"
            value={channel}
            onChange={(e) => {
              const c = e.target.value as typeof channel;
              setChannel(c);
              autoFee(amount, c);
            }}
          >
            {CHANNELS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="field-label">Channel order no. (optional)</span>
          <input className="field-input" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. FO1234ABCD" maxLength={80} />
        </label>
        <label className="block text-sm">
          <span className="field-label">Buyer paid ($)</span>
          <input
            className="field-input"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              autoFee(e.target.value, channel);
            }}
          />
        </label>
        <label className="block text-sm">
          <span className="field-label">Channel fee ($)</span>
          <input
            className="field-input"
            inputMode="decimal"
            value={fee}
            onChange={(e) => {
              setFeeTouched(true);
              setFee(e.target.value);
            }}
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="field-label">Send the files to</span>
        <input className="field-input" type="email" value={deliverTo} onChange={(e) => setDeliverTo(e.target.value)} required />
      </label>
      <p className="text-xs text-gray-500">The order counts as revenue on this channel (fee included in the fees KPI). Deliver the files on the channel; refunds happen there and are only recorded here.</p>
    </fieldset>
  );

  return (
    <IntakeForm
      toolSlug={toolSlug}
      fields={fields}
      ctaLabel="Create order"
      priceLabel={toolName}
      deliveryPromise="runs through the normal pipeline"
      heading="New external order"
      submitLabel="Create order and run it"
      onSubmitIntake={submit}
      extraFields={extra}
    />
  );
}
