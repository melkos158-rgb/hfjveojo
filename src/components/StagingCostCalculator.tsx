"use client";

import { STAGING_PRICE_LINE } from "@/config/staging-pricing";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { trackClient } from "@/components/Analytics";
import { compareStagingCost, LIMITS } from "@/lib/free/staging-cost";

const money = (n: number, cents = false) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });

function NumberField({ label, hint, value, onChange, min, max }: { label: string; hint: string; value: number; onChange: (n: number) => void; min: number; max: number }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        className="field-input w-full"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={1}
        onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
      />
      <span className="mt-1 block text-xs text-gray-500">{hint}</span>
    </label>
  );
}

/** Compares what virtual staging costs for the visitor's volume: pay-per-photo, subscription, physical staging. Runs in the browser. */
export function StagingCostCalculator() {
  const [photos, setPhotos] = useState(5);
  const [listings, setListings] = useState(1);
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      trackClient("free_tool_used", { tool: "virtual-staging-cost-calculator" });
    }
  }, []);

  const r = useMemo(() => compareStagingCost(photos, listings), [photos, listings]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
      <div className="card h-fit min-w-0 space-y-4">
        <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Your listings</div>
        <NumberField
          label="Photos to stage per listing"
          hint="Most vacant listings need 4–6: living room, primary bedroom, dining, kitchen."
          value={photos}
          onChange={setPhotos}
          min={LIMITS.photos.min}
          max={LIMITS.photos.max}
        />
        <NumberField label="Listings per month" hint="How many listings you stage in a typical month." value={listings} onChange={setListings} min={LIMITS.listings.min} max={LIMITS.listings.max} />
        <p className="text-xs text-gray-500">
          {r.photosPerMonth} photo{r.photosPerMonth === 1 ? "" : "s"} a month. Nothing you type is sent anywhere.
        </p>
      </div>

      <div className="card min-w-0">
        <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase">What it costs</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line p-4">
            <div className="text-xs text-gray-500">One-off listing ({r.photosPerListing} photos)</div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight text-fg">{money(r.oneOff.cost)}</div>
            <div className="mt-1 text-sm text-gray-600">cheapest: {r.oneOff.name}</div>
          </div>
          <div className="rounded-xl border border-line p-4">
            <div className="text-xs text-gray-500">Every month ({r.photosPerMonth} photos)</div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight text-fg">
              {money(r.everyMonth.cost)}
              <span className="text-sm font-normal text-gray-500"> / month</span>
            </div>
            <div className="mt-1 text-sm text-gray-600">cheapest: {r.everyMonth.name}</div>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs tracking-wider text-gray-500 uppercase">
              <tr>
                <th className="py-1 pr-3">Option</th>
                <th className="py-1 pr-3">Per listing</th>
                <th className="py-1 pr-3">Per month</th>
                <th className="py-1">Notes</th>
              </tr>
            </thead>
            <tbody>
              {r.perPhoto.map((o) => (
                <tr key={o.key} className="border-t border-line align-top">
                  <td className="py-2 pr-3 text-fg">
                    {o.name}
                    <div className="text-xs text-gray-500">{o.priceNote ?? `${money(o.perPhoto)} per photo`}</div>
                  </td>
                  <td className="py-2 pr-3 font-semibold text-fg">{money(o.perListing)}</td>
                  <td className="py-2 pr-3 text-fg">{money(o.perMonth)}</td>
                  <td className="py-2 text-gray-600">{o.note}</td>
                </tr>
              ))}
              <tr className="border-t border-line align-top">
                <td className="py-2 pr-3 text-fg">
                  Virtual Staging AI subscription
                  <div className="text-xs text-gray-500">{r.subscription ? `${r.subscription.plan.name} plan, ${r.subscription.plan.photosPerMonth} photos a month` : "above the largest plan (150 photos a month)"}</div>
                </td>
                <td className="py-2 pr-3 text-gray-600">—</td>
                <td className="py-2 pr-3 text-fg">{r.subscription ? `${money(r.subscription.perMonth)}*` : "—"}</td>
                <td className="py-2 text-gray-600">
                  {r.subscription
                    ? `*With yearly billing: ${money(r.subscription.billedYearly)} paid up front. ${money(r.subscription.perPhoto, true)} per photo if you use ${r.photosPerMonth} of ${r.subscription.plan.photosPerMonth} credits every month.`
                    : "Contact the provider for larger volumes."}
                </td>
              </tr>
              <tr className="border-t border-line align-top">
                <td className="py-2 pr-3 text-fg">
                  Physical staging (a staging service)
                  <div className="text-xs text-gray-500">NAR 2025 median, per home</div>
                </td>
                <td className="py-2 pr-3 font-semibold text-fg">{money(r.physicalPerMonth / r.listingsPerMonth)}</td>
                <td className="py-2 pr-3 text-fg">{money(r.physicalPerMonth)}</td>
                <td className="py-2 text-gray-600">Real furniture in the home; a different service, shown for scale.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-xl border border-accent/40 bg-accent/10 p-4">
          <div className="font-semibold text-fg">See it on your own photo before you pay</div>
          <p className="mt-1 text-sm text-gray-600">
            ORVIONIS stages up to ten rooms per order: {STAGING_PRICE_LINE}, two versions of each, with labeled copies for the MLS disclosure. Your first photo is free (one per person).
          </p>
          <div className="mt-3">
            <Link href="/tools/virtual-staging" className="btn-primary" onClick={() => trackClient("cta_click", { from: "staging-cost-calculator" })}>
              Stage your first photo free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
