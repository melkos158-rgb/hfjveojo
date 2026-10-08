"use client";

import { useState } from "react";
import type { IntakeField } from "@/lib/tools/types";
import { IntakeForm } from "@/components/IntakeForm";

/**
 * Admin form for a prospect preview: the staging form (one photo, style, room) plus who it is for. On success the
 * browser opens the private page the prospect will get; it updates by itself until the room is staged, and its
 * address is the link to send.
 */
export function ProspectPreviewForm({ fields, maxLength }: { fields: IntakeField[]; maxLength: number }) {
  const [prospect, setProspect] = useState("");

  const submit = async ({ intake }: { email: string; intake: Record<string, string> }) => {
    if (!prospect.trim()) throw new Error("Write who the preview is for (their Instagram handle or name).");
    const res = await fetch("/api/admin/previews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intake, prospect }),
    });
    const data = (await res.json()) as { orderId?: string; url?: string; message?: string };
    if (!res.ok || !data.orderId || !data.url) throw new Error(data.message ?? "Could not create the preview");
    window.location.assign(data.url);
  };

  const extra = (
    <fieldset className="space-y-3 rounded-xl border border-amber-300/60 p-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-amber-700">Prospect</legend>
      <label className="block text-sm">
        <span className="field-label">Who it is for (Instagram handle or name)</span>
        <input className="field-input" value={prospect} onChange={(e) => setProspect(e.target.value)} placeholder="@agent_handle" maxLength={maxLength} required />
      </label>
      <p className="text-xs text-gray-500">Only with their yes: a photo they sent you, or one of their listing photos they told you to use. One room, free. Nothing is emailed to them; you send the link yourself.</p>
    </fieldset>
  );

  return (
    <IntakeForm
      toolSlug="virtual-staging"
      fields={fields}
      ctaLabel="Make the preview"
      priceLabel="Prospect preview"
      deliveryPromise="one room, two versions, about 2 minutes"
      heading="New prospect preview"
      submitLabel="Stage it and open the page"
      onSubmitIntake={submit}
      extraFields={extra}
    />
  );
}
