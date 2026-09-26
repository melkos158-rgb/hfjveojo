/**
 * Output size for an image edit. GPT Image 2+ accepts arbitrary WIDTHxHEIGHT (both divisible by 16, aspect
 * between 1:3 and 3:1), so we keep the customer's photo proportions exactly — a staged photo that comes back
 * cropped or letterboxed is useless in a listing. Older GPT Image models only know three fixed sizes, so they
 * get "auto" and pick the closest one themselves.
 */
export const EDIT_LONG_EDGE = 1536;

export function supportsArbitrarySize(model: string): boolean {
  return /^gpt-image-(2|[3-9])/.test(model);
}

export function editSizeFor(model: string, width?: number, height?: number): string {
  if (!supportsArbitrarySize(model)) return "auto";
  if (!width || !height || width <= 0 || height <= 0) return `${EDIT_LONG_EDGE}x1024`;
  const aspect = Math.min(3, Math.max(1 / 3, width / height));
  const r16 = (n: number) => Math.max(16, Math.round(n / 16) * 16);
  return aspect >= 1 ? `${EDIT_LONG_EDGE}x${r16(EDIT_LONG_EDGE / aspect)}` : `${r16(EDIT_LONG_EDGE * aspect)}x${EDIT_LONG_EDGE}`;
}

/** GPT Image 1 / 1.5 need `input_fidelity: "high"` to keep the photographed room intact; GPT Image 2 ignores it. */
export function wantsInputFidelity(model: string): boolean {
  return /^gpt-image-1(\.5)?(-\d{4}-\d{2}-\d{2})?$/.test(model);
}
