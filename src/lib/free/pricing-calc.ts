/** Cost-of-doing-business maths for the free photography pricing calculator (pure, tested). */
export type PricingInputs = {
  income: number; // target take-home per year, USD
  expenses: number; // business costs per year
  taxRate: number; // % of profit
  weeks: number; // working weeks per year
  hoursPerWeek: number; // hours available for paid work incl. editing
  shootHours: number; // per job
  editHours: number; // per job (editing, admin, travel)
  jobs: number; // jobs you expect to book per year
};

export type PricingResult = {
  revenueNeeded: number;
  hoursPerJob: number;
  hoursAvailable: number;
  capacity: number;
  jobs: number;
  pricePerJob: number;
  hourly: number;
  overbooked: boolean;
  scenarios: Array<{ jobs: number; price: number; feasible: boolean }>;
};

/**
 * Starting points for the calculator. They are examples, not market data: every field is meant to be replaced with the
 * photographer's own numbers. Each preset must fit its own hours (tested), so the default view never opens with a
 * capacity warning.
 */
export const PRICING_PRESETS = {
  wedding: { label: "Wedding photographer", v: { income: 60000, expenses: 14000, taxRate: 25, weeks: 46, hoursPerWeek: 35, shootHours: 8, editHours: 30, jobs: 24 } },
  "real-estate": { label: "Real estate photographer", v: { income: 55000, expenses: 14000, taxRate: 25, weeks: 48, hoursPerWeek: 35, shootHours: 1.5, editHours: 2.5, jobs: 320 } },
  portrait: { label: "Family & portrait sessions", v: { income: 45000, expenses: 9000, taxRate: 25, weeks: 48, hoursPerWeek: 30, shootHours: 1.5, editHours: 4, jobs: 180 } },
  commercial: { label: "Brand & product shoots", v: { income: 80000, expenses: 18000, taxRate: 28, weeks: 46, hoursPerWeek: 35, shootHours: 5, editHours: 10, jobs: 70 } },
} satisfies Record<string, { label: string; v: PricingInputs }>;

export type PricingPresetKey = keyof typeof PRICING_PRESETS;

export function computePricing(v: PricingInputs): PricingResult {
  const tax = Math.min(Math.max(v.taxRate, 0), 60) / 100;
  const revenueNeeded = v.expenses + v.income / (1 - tax); // profit is taxed; costs are not
  const hoursPerJob = v.shootHours + v.editHours;
  const hoursAvailable = v.weeks * v.hoursPerWeek;
  const capacity = hoursPerJob > 0 ? Math.floor(hoursAvailable / hoursPerJob) : 0;
  const jobs = Math.max(1, capacity > 0 ? Math.min(v.jobs, capacity) : v.jobs);
  const pricePerJob = revenueNeeded / jobs;
  const hourly = hoursPerJob > 0 ? pricePerJob / hoursPerJob : 0;
  const overbooked = capacity > 0 && v.jobs > capacity;
  const scenarios = [0.75, 1, 1.25].map((f) => {
    const j = Math.max(1, Math.round(v.jobs * f));
    return { jobs: j, price: revenueNeeded / j, feasible: capacity === 0 || j <= capacity };
  });
  return { revenueNeeded, hoursPerJob, hoursAvailable, capacity, jobs, pricePerJob, hourly, overbooked, scenarios };
}

export function pricingInputsValid(v: PricingInputs): boolean {
  const all = [v.income, v.expenses, v.taxRate, v.weeks, v.hoursPerWeek, v.shootHours, v.editHours, v.jobs];
  return all.every((n) => Number.isFinite(n) && n >= 0) && v.weeks > 0 && v.hoursPerWeek > 0 && v.jobs > 0 && v.shootHours + v.editHours > 0;
}
