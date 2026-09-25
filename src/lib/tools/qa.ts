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
 * Not legal advice; the founder should verify local advertising rules.
 */
const FAIR_HOUSING_TERMS = [
  "perfect for families",
  "family-friendly",
  "bachelor pad",
  "christian",
  "no kids",
  "adults only",
  "safe neighborhood",
  "exclusive neighborhood",
  "walking distance to church",
  "great for singles",
  "mature",
  "handicapped",
  "ethnic",
];

export function checkFairHousing(text: string): string[] {
  const lower = text.toLowerCase();
  return FAIR_HOUSING_TERMS.filter((t) => lower.includes(t)).map((t) => `Fair-housing risk: phrase "${t}"`);
}

export function combine(...lists: string[][]): QcResult {
  const notes = lists.flat();
  return { passed: notes.length === 0, notes };
}
