import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderPricingGuidePdf } from "../src/lib/render/pricingGuidePdf";
import { SAMPLE_PRICING_GUIDE } from "../src/lib/tools/samples/photo-pricing-guide";

/**
 * Renders the sample deliverables shown on tool pages (public/samples/*). Run after editing a sample:
 *   npx tsx scripts/render-samples.ts
 * Page previews (public/img/sample-*.webp) are made from the PDF with pdftoppm + sharp, e.g.
 *   pdftoppm -r 110 -png public/samples/photographer-pricing-guide-sample.pdf /tmp/pg
 * then compose pages 1 and 3 side by side and save as WebP.
 */
async function main() {
  const dir = join(process.cwd(), "public", "samples");
  mkdirSync(dir, { recursive: true });
  const pdf = await renderPricingGuidePdf(SAMPLE_PRICING_GUIDE);
  const out = join(dir, "photographer-pricing-guide-sample.pdf");
  writeFileSync(out, pdf);
  console.log(`wrote ${out} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
