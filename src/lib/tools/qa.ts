import type { QcResult } from "@/lib/tools/types";

/**
 * Deterministic quality checks that run before any delivery. Cheap, fast, no AI.
 * Model-based checks can be layered on top by individual tools.
 */
const PLACEHOLDER_PATTERNS = [
  /\[(?:insert|your|name|price|placeholder)[^\]]*\]/i,
  /lorem ipsum/i,
  /\{\{[^}]+\}\}/,
  /\bTBD\b/,
  /\bTODO\b/,
  /as an ai (?:language )?model/i,
  /I cannot (?:help|assist)/i,
];

export function checkNoPlaceholders(text: string): string[] {
  const notes: string[] = [];
  for (const p of PLACEHOLDER_PATTERNS) {
    const m = text.match(p);
    if (m) notes.push(`Placeholder-like text found: "${m[0].slice(0, 40)}"`);
  }
  return notes;
}

export function checkContains(text: string, needles: string[], label: string): string[] {
  const notes: string[] = [];
  for (const n of needles) {
    if (n && !text.includes(n)) notes.push(`${label} "${n}" is missing from the output`);
  }
  return notes;
}

export function checkLength(text: string, min: number, label = "Output"): string[] {
  return text.length < min ? [`${label} is too short (${text.length} chars < ${min})`] : [];
}

/**
 * Fair-housing lexicon for real-estate copy (US). Flags — does not auto-rewrite — so a human can judge.
 * Word-boundary patterns: "mature maples" and "Christiansen Ave" are fine, "mature adults" and "Christian community" are not.
 * Each entry carries the protected class it touches and a rewrite hint (used by the free checker on /free/fair-housing-checker).
 * Not legal advice; the founder should verify local advertising rules.
 */
export type FairHousingRule = { label: string; re: RegExp; basis: string; hint: string; severity: "risk" | "style" };

export const FAIR_HOUSING_RULES: FairHousingRule[] = [
  { label: "perfect for families", re: /\bperfect for famil(?:y|ies)\b/gi, basis: "familial status", hint: "Describe the home, not the household: “four bedrooms and a fenced backyard”.", severity: "risk" },
  { label: "family-friendly", re: /\bfamily[- ]friendly\b/gi, basis: "familial status", hint: "Name the feature instead: “near two parks”, “quiet cul-de-sac”.", severity: "risk" },
  { label: "ideal/great for families", re: /\b(?:ideal|great|wonderful) for (?:young |growing |large )?famil(?:y|ies)\b/gi, basis: "familial status", hint: "Describe the space: “room to spread out on two levels”.", severity: "risk" },
  { label: "family home / family room", re: /\bfamily (?:home|neighbou?rhood|oriented)\b/gi, basis: "familial status", hint: "“Family room” as a room name is fine; “family home/neighborhood” describes who should live there — cut it.", severity: "style" },
  { label: "bachelor pad", re: /\bbachelor(?:ette)? pad\b/gi, basis: "familial status / sex", hint: "Say what it is: “efficient one-bedroom with a full kitchen”.", severity: "risk" },
  { label: "christian / religious reference", re: /\b(?:christians?|catholics?|jewish|muslims?|hindus?)\b/gi, basis: "religion", hint: "Leave religion out; naming nearby places of worship is also risky.", severity: "risk" },
  { label: "no kids / no children", re: /\bno (?:kids|children)\b/gi, basis: "familial status", hint: "You cannot exclude children from housing ads. Remove it.", severity: "risk" },
  { label: "adults only", re: /\badults?[- ]only\b/gi, basis: "familial status", hint: "Only lawful 55+ communities may say so, with the proper wording. Otherwise remove.", severity: "risk" },
  { label: "safe neighborhood", re: /\bsafe (?:neighbou?rhood|area|community|street)\b/gi, basis: "implied national origin / race", hint: "Point to facts a buyer can check: “on a cul-de-sac”, “sidewalks on both sides”.", severity: "risk" },
  { label: "exclusive neighborhood", re: /\bexclusive (?:neighbou?rhood|area|community|enclave)\b/gi, basis: "implied exclusion", hint: "“Gated community with 42 homes” says more and excludes no one.", severity: "risk" },
  { label: "walking distance to a place of worship", re: /\bwalking distance (?:to|from) (?:the |a )?(?:church|synagogue|mosque|temple|parish)\b/gi, basis: "religion", hint: "Use neutral landmarks: the park, the library, the train.", severity: "risk" },
  { label: "great for singles / couples", re: /\b(?:great|perfect|ideal) for (?:singles|couples|professionals|young professionals|students)\b/gi, basis: "familial status / age", hint: "Describe the layout instead: “open plan with a work nook”.", severity: "risk" },
  { label: "mature adults / seniors", re: /\b(?:mature|older|senior) (?:adults?|persons?|people|individuals?|couples?|community|residents?|buyers?|professionals?|only)\b/gi, basis: "age / familial status", hint: "Unless it is a lawful 55+ community, remove age language.", severity: "risk" },
  { label: "empty nesters / retirees", re: /\b(?:empty[- ]nesters?|retirees?)\b/gi, basis: "age / familial status", hint: "Describe single-level living or low maintenance instead.", severity: "risk" },
  { label: "handicapped", re: /\bhandicapped\b/gi, basis: "disability (wording)", hint: "Use “accessible”: “step-free entry”, “36-inch doorways”.", severity: "style" },
  { label: "ethnic / nationality reference", re: /\b(?:ethnic|hispanic|latino|asian|african|chinese|indian|italian|polish) (?:neighbou?rhood|area|community|family|families)\b/gi, basis: "national origin / race", hint: "Remove references to the people who live nearby.", severity: "risk" },
  { label: "master bedroom", re: /\bmaster (?:bedroom|suite|bath(?:room)?)\b/gi, basis: "style (many MLS boards now use “primary”)", hint: "Not a fair-housing violation, but most boards prefer “primary bedroom/suite”.", severity: "style" },
];

export type FairHousingMatch = { start: number; end: number; text: string; rule: FairHousingRule };

/** Every match with its position, for highlighting. */
export function findFairHousingMatches(text: string): FairHousingMatch[] {
  const out: FairHousingMatch[] = [];
  for (const rule of FAIR_HOUSING_RULES) {
    rule.re.lastIndex = 0;
    for (const m of text.matchAll(rule.re)) {
      if (m.index === undefined) continue;
      out.push({ start: m.index, end: m.index + m[0].length, text: m[0], rule });
    }
  }
  out.sort((a, b) => a.start - b.start || b.end - a.end);
  // Overlaps (two rules on the same words): keep the earliest/longest, drop the rest.
  const kept: FairHousingMatch[] = [];
  for (const m of out) if (!kept.length || m.start >= kept[kept.length - 1].end) kept.push(m);
  return kept;
}

/** Delivery gate: only "risk" rules block an automated delivery; "style" rules are advice. */
export function checkFairHousing(text: string): string[] {
  const seen = new Set<string>();
  for (const m of findFairHousingMatches(text)) if (m.rule.severity === "risk") seen.add(m.rule.label);
  return [...seen].map((label) => `Fair-housing risk: phrase "${label}"`);
}

export function combine(...lists: string[][]): QcResult {
  const notes = lists.flat();
  return { passed: notes.length === 0, notes };
}
