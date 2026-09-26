/** Free, browser-only tools (lead magnets). Each links to the paid tool that delivers the finished result. */
export type FreeTool = { href: string; title: string; description: string; audience: string; category: "real-estate" | "photography" };

export const FREE_TOOLS: FreeTool[] = [
  {
    href: "/free/fair-housing-checker",
    title: "Fair housing checker for listing descriptions",
    description: "Paste your remarks: risky phrases highlighted with a rewrite hint, plus a live character count against your MLS limit.",
    audience: "Real estate",
    category: "real-estate",
  },
  {
    href: "/free/photography-pricing-calculator",
    title: "Photography pricing calculator",
    description: "Income goal, costs, taxes and real hours per job → the minimum to charge per job and per hour, with a capacity check.",
    audience: "Photographers",
    category: "photography",
  },
];
