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
 * Not legal advice; the founder should verify local advertising rules.
 */
const FAIR_HOUSING_PATTERNS: Array<[string, RegExp]> = [
  ["perfect for families", /\bperfect for famil(?:y|ies)\b/i],
  ["family-friendly", /\bfamily[- ]friendly\b/i],
  ["ideal for families", /\b(?:ideal|great|perfect) for (?:young |growing )?famil(?:y|ies)\b/i],
  ["bachelor pad", /\bbachelor pad\b/i],
  ["christian", /\bchristians?\b/i],
  ["no kids", /\bno (?:kids|children)\b/i],
  ["adults only", /\badults?[- ]only\b/i],
  ["safe neighborhood", /\bsafe (?:neighbou?rhood|area|community)\b/i],
  ["exclusive neighborhood", /\bexclusive (?:neighbou?rhood|area|community)\b/i],
  ["walking distance to church", /\bwalking distance (?:to|from) (?:the )?(?:church|synagogue|mosque|temple)\b/i],
  ["great for singles", /\b(?:great|perfect|ideal) for singles\b/i],
  ["mature (people)", /\bmature (?:adults?|persons?|people|individuals?|couples?|community|residents?|buyers?|professionals?|only)\b/i],
  ["handicapped", /\bhandicapped\b/i],
  ["ethnic", /\bethnic\b/i],
  ["empty nesters", /\bempty[- ]nesters?\b/i],
  ["retirees", /\b(?:great|perfect|ideal) for retirees\b/i],
];

export function checkFairHousing(text: string): string[] {
  return FAIR_HOUSING_PATTERNS.filter(([, re]) => re.test(text)).map(([label]) => `Fair-housing risk: phrase "${label}"`);
}

export function combine(...lists: string[][]): QcResult {
  const notes = lists.flat();
  return { passed: notes.length === 0, notes };
}
