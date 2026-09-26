"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { trackClient } from "@/components/Analytics";
import { computePricing, pricingInputsValid, type PricingInputs } from "@/lib/free/pricing-calc";

type Inputs = PricingInputs;

const PRESETS: Record<string, { label: string; v: Inputs }> = {
  wedding: { label: "Wedding photographer", v: { income: 60000, expenses: 14000, taxRate: 25, weeks: 46, hoursPerWeek: 35, shootHours: 8, editHours: 30, jobs: 24 } },
  portrait: { label: "Family & portrait sessions", v: { income: 45000, expenses: 9000, taxRate: 25, weeks: 48, hoursPerWeek: 30, shootHours: 1.5, editHours: 4, jobs: 180 } },
  commercial: { label: "Brand & product shoots", v: { income: 80000, expenses: 18000, taxRate: 28, weeks: 46, hoursPerWeek: 35, shootHours: 5, editHours: 10, jobs: 70 } },
};

const money = (n: number) => (Number.isFinite(n) ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "—");

function Field({ label, hint, value, onChange, suffix, step = 1, min = 0 }: { label: string; hint?: string; value: number; onChange: (n: number) => void; suffix?: string; step?: number; min?: number }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <span className="flex items-center gap-2">
        <input type="number" inputMode="decimal" className="field-input w-full" value={Number.isFinite(value) ? value : ""} min={min} step={step} onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))} />
        {suffix ? <span className="shrink-0 text-sm text-gray-500">{suffix}</span> : null}
      </span>
      {hint ? <span className="mt-1 block text-xs text-gray-500">{hint}</span> : null}
    </label>
  );
}

/** Cost-of-doing-business calculator: what a photographer must charge per job to hit a take-home number. Runs in the browser. */
export function PricingCalculator() {
  const [v, setV] = useState<Inputs>(PRESETS.wedding.v);
  const tracked = useRef(false);
  const set = (k: keyof Inputs) => (n: number) => setV((s) => ({ ...s, [k]: n }));

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      trackClient("free_tool_used", { tool: "photography-pricing-calculator" });
    }
  }, []);

  const r = useMemo(() => computePricing(v), [v]);
  const valid = pricingInputsValid(v);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Your numbers</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([k, p]) => (
              <button key={k} type="button" className="btn-pill border border-line bg-bg text-gray-600 hover:text-fg" onClick={() => setV(p.v)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Take-home income you want" value={v.income} onChange={set("income")} suffix="$ / yr" step={1000} hint="After business costs and taxes." />
          <Field label="Business costs" value={v.expenses} onChange={set("expenses")} suffix="$ / yr" step={500} hint="Gear, software, insurance, website, marketing, second shooters, travel." />
          <Field label="Tax rate on profit" value={v.taxRate} onChange={set("taxRate")} suffix="%" hint="Self-employment + income tax, roughly." />
          <Field label="Weeks you work" value={v.weeks} onChange={set("weeks")} suffix="/ yr" />
          <Field label="Hours for paid work" value={v.hoursPerWeek} onChange={set("hoursPerWeek")} suffix="/ week" hint="Shooting and editing, not marketing or admin." />
          <Field label="Jobs you expect to book" value={v.jobs} onChange={set("jobs")} suffix="/ yr" />
          <Field label="Hours shooting per job" value={v.shootHours} onChange={set("shootHours")} step={0.5} suffix="h" />
          <Field label="Hours editing + admin per job" value={v.editHours} onChange={set("editHours")} step={0.5} suffix="h" hint="Culling, editing, gallery, emails, travel." />
        </div>
      </div>

      <div className="card">
        <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase">What you need to charge</div>
        {valid ? (
          <>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3">
              <div className="text-4xl font-extrabold tracking-tight text-fg">{money(r.pricePerJob)}</div>
              <div className="text-sm text-gray-500">per job, minimum · {money(r.hourly)}/hour of your time</div>
            </div>
            <dl className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="text-gray-500">Revenue needed</dt>
              <dd className="text-fg">
                {money(r.revenueNeeded)} / yr <span className="text-gray-500">(costs + income grossed up for tax)</span>
              </dd>
              <dt className="text-gray-500">Time per job</dt>
              <dd className="text-fg">{r.hoursPerJob} h · capacity {r.capacity} jobs / yr at {r.hoursAvailable} h</dd>
              <dt className="text-gray-500">Jobs used</dt>
              <dd className={r.overbooked ? "text-amber-700" : "text-fg"}>
                {r.jobs}
                {r.overbooked ? ` — you planned ${v.jobs}, but the hours only allow ${r.capacity}; the price above uses ${r.capacity}` : ""}
              </dd>
            </dl>
            <table className="mt-5 w-full text-sm">
              <thead className="text-left text-xs tracking-wider text-gray-500 uppercase">
                <tr>
                  <th className="py-1">If you book</th>
                  <th className="py-1">Charge at least</th>
                  <th className="py-1">Fits your hours?</th>
                </tr>
              </thead>
              <tbody>
                {r.scenarios.map((s) => (
                  <tr key={s.jobs} className="border-t border-line">
                    <td className="py-1.5">{s.jobs} jobs</td>
                    <td className="py-1.5 font-semibold text-fg">{money(s.price)}</td>
                    <td className={`py-1.5 ${s.feasible ? "text-green-700" : "text-amber-700"}`}>{s.feasible ? "yes" : "no — cut editing hours or book fewer"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-gray-500">
              Minimum, not a market price: add margin for slow months, and price packages so the average booking lands above this number. Nothing you type is sent anywhere.
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-gray-500">Fill in every field (weeks, hours and jobs must be above zero).</p>
        )}

        <div className="mt-6 rounded-xl border border-accent/40 bg-accent/10 p-4">
          <div className="font-semibold text-fg">Now put those prices in front of clients</div>
          <p className="mt-1 text-sm text-gray-600">
            Photographer Pricing Guide turns your packages, add-ons and policies into a designed, branded PDF you can send to every inquiry — five minutes of questions, $29, no subscription.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/tools/photographer-pricing-guide" className="btn-primary" onClick={() => trackClient("cta_click", { from: "pricing-calculator" })}>
              Build my pricing guide — $29
            </Link>
            <Link href="/tools/photographer-pricing-guide#example" className="btn-secondary">
              See the sample PDF
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
