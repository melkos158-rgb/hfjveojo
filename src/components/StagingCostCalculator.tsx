"use client";

import { STAGING_PRICE_LINE } from "@/config/staging-pricing";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { trackClient } from "@/components/Analytics";
import { compareStagingCost, LIMITS, SUBSCRIPTION_NAME, type Cheapest } from "@/lib/free/staging-cost";

const money = (n: number) => {
  const cents = !Number.isInteger(n);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
};
const GROUP_TAG = { designer: "Design service", "per-photo": "Pay per photo" } as const;

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

function Tile({ label, best, suffix }: { label: string; best: Cheapest; suffix?: string }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-extrabold tracking-tight text-fg">
        {best.from ? <span className="text-base font-semibold">from </span> : null}
        {money(best.cost)}
        {suffix ? <span className="text-sm font-normal text-gray-500">{suffix}</span> : null}
      </div>
      <div className="mt-1 text-sm text-gray-600">
        cheapest: {best.name}
        {best.detail ? ` (${best.detail})` : ""}
      </div>
    </div>
  );
}

/** Prices the visitor's listings at the nine companies of the cost guide: design services, pay-per-photo, a subscription. Runs in the browser. */
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
  // The subscription sits among the others at its one-listing price (one month, billed monthly); ties keep the guide's order.
  const rows = useMemo(
    () =>
      [...r.perPhoto.map((o) => ({ kind: "option" as const, o, perListing: o.perListing })), { kind: "subscription" as const, perListing: r.subscriptionOneOff.cost }].sort(
        (a, b) => a.perListing - b.perListing,
      ),
    [r],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.8fr]">
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
        <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase">What it costs at nine companies</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Tile label={`One listing (${r.photosPerListing} photo${r.photosPerListing === 1 ? "" : "s"})`} best={r.oneOff} />
          <Tile label={`Every month (${r.photosPerMonth} photo${r.photosPerMonth === 1 ? "" : "s"})`} best={r.everyMonth} suffix=" / month" />
        </div>

        <table className="mt-5 w-full text-left text-sm">
          <thead className="text-xs tracking-wider text-gray-500 uppercase">
            <tr>
              <th className="py-1 pr-3">Company, cheapest first</th>
              <th className="py-1 pr-3 text-right">Per listing</th>
              <th className="py-1 text-right">Per month</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              row.kind === "option" ? (
                <tr key={row.o.key} className={`border-t border-line align-top${row.o.ours ? " bg-accent/10" : ""}`}>
                  <td className="py-2 pr-3 text-fg">
                    <span className={row.o.ours ? "font-semibold" : undefined}>{row.o.name}</span>
                    <span className="text-xs text-gray-500"> · {GROUP_TAG[row.o.group]}</span>
                    <div className="text-xs text-gray-500">{row.o.priceLine}</div>
                    <div className="text-xs text-gray-500">{row.o.turnaround}</div>
                  </td>
                  <td className="py-2 pr-3 text-right font-semibold whitespace-nowrap text-fg">
                    {row.o.from ? <span className="text-xs font-normal text-gray-500">from </span> : null}
                    {money(row.o.perListing)}
                  </td>
                  <td className="py-2 text-right whitespace-nowrap text-fg">
                    {row.o.from ? <span className="text-xs text-gray-500">from </span> : null}
                    {money(row.o.perMonth)}
                  </td>
                </tr>
              ) : (
                <tr key="subscription" className="border-t border-line align-top">
                  <td className="py-2 pr-3 text-fg">
                    {SUBSCRIPTION_NAME}
                    <span className="text-xs text-gray-500"> · Subscription</span>
                    <div className="text-xs text-gray-500">
                      Per listing: one month of the {r.subscriptionOneOff.plan.name} plan ({r.subscriptionOneOff.plan.photosPerMonth} photos), billed monthly.
                    </div>
                    <div className="text-xs text-gray-500">
                      {r.subscription
                        ? `Per month: the ${r.subscription.plan.name} plan (${r.subscription.plan.photosPerMonth} photos) billed monthly, or ${money(r.subscription.yearlyPerMonth)} a month billed yearly (${money(r.subscription.billedYearly)} up front).`
                        : "Per month: above the largest plan (150 photos a month); ask the provider."}
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-right font-semibold whitespace-nowrap text-fg">{money(r.subscriptionOneOff.cost)}</td>
                  <td className="py-2 text-right whitespace-nowrap text-fg">{r.subscription ? money(r.subscription.monthly) : "—"}</td>
                </tr>
              ),
            )}
            <tr className="border-t border-line align-top">
              <td className="py-2 pr-3 text-fg">
                Physical staging (a staging service)
                <div className="text-xs text-gray-500">NAR 2025 median per home: real furniture in the home, a different service, shown for scale.</div>
              </td>
              <td className="py-2 pr-3 text-right font-semibold whitespace-nowrap text-fg">{money(r.physicalPerMonth / r.listingsPerMonth)}</td>
              <td className="py-2 text-right whitespace-nowrap text-fg">{money(r.physicalPerMonth)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 rounded-xl border border-accent/40 bg-accent/10 p-4">
          <div className="font-semibold text-fg">See it on your own photo before you pay</div>
          <p className="mt-1 text-sm text-gray-600">
            ORVIONIS stages up to ten rooms per order: {STAGING_PRICE_LINE}, two versions of each, with a disclosure pack (labeled copies and a link to the original). For {r.photosPerListing} photo
            {r.photosPerListing === 1 ? "" : "s"} that is {money(r.ours.perListing)}. Your first photo is free (one per person).
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
