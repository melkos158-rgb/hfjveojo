import "./load-env";
import { prisma } from "../src/lib/db";
import { syncToolsToDatabase } from "../src/lib/tools/registry";
import { randomToken } from "../src/lib/security/tokens";
import { fulfillOrder } from "../src/lib/orders/fulfill";
import { generateCeoReport } from "../src/lib/ceo/report";

/**
 * End-to-end smoke test WITHOUT Stripe or a real AI key (use AI_PROVIDER=mock):
 * creates a paid order for each tool, runs fulfilment, checks outputs and cost logging, generates a report.
 * Usage: AI_PROVIDER=mock JOBS_INLINE=true npm run smoke
 */
async function main() {
  await syncToolsToDatabase();

  const cases: Array<{ toolId: string; sku: string; intake: Record<string, unknown> }> = [
    {
      toolId: "photo-pricing-guide",
      sku: "PHOTO_PRICING_GUIDE",
      intake: {
        studioName: "Ember & Oak Photography",
        photographerName: "Maya Torres",
        genre: "wedding",
        location: "Denver, Colorado",
        packagesText: "The Essentials | $2,400 | 6 hours coverage, 400+ edited photos, online gallery\nThe Full Day | $3,800 | 10 hours, second shooter, 700+ photos, engagement session",
        addOnsText: "Extra hour | $350 | Booked in advance",
        turnaround: "Sneak peeks in 48 hours, full gallery in 6 weeks",
        depositPolicy: "30% non-refundable retainer, balance due 2 weeks before",
        brandVoice: "warm",
        brandColor: "#8a6d3b",
        website: "emberandoak.com",
        instagram: "@emberandoak",
        aboutNotes: "Shooting weddings since 2018, film-inspired colors",
      },
    },
    {
      toolId: "listing-clips",
      sku: "LISTING_CLIPS_5",
      intake: {
        agentName: "Jordan Lee",
        brokerage: "Keller Williams Austin",
        listingAddress: "1420 Oak Hill Dr, Austin, TX",
        price: "$549,000",
        beds: 3,
        baths: 2.5,
        sqft: 2140,
        features: "Renovated kitchen with quartz island; covered patio; primary suite with soaking tub; 2-car garage; 0.4-acre lot",
        videoLink: "https://drive.google.com/file/d/abc123/view",
        brandColor: "#111111",
        style: "cinematic",
        musicVibe: "chill",
        notes: "Open house Sunday 2–4pm",
      },
    },
  ];

  for (const c of cases) {
    const product = await prisma.product.findUniqueOrThrow({ where: { sku: c.sku } });
    const order = await prisma.order.create({
      data: {
        customerEmail: "smoke@example.com",
        toolId: c.toolId,
        productId: product.id,
        status: "PAID",
        paidAt: new Date(),
        intake: c.intake as object,
        amountCents: product.priceCents,
        currency: product.currency,
        accessToken: randomToken(16),
        attribution: { utm_source: "smoke" },
      },
    });
    await prisma.payment.create({ data: { orderId: order.id, amountCents: product.priceCents, currency: product.currency, status: "SUCCEEDED", stripePaymentIntentId: `pi_smoke_${order.id}` } });
    await fulfillOrder(order.id);
    const after = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { outputs: { include: { file: true } }, runs: true, aiRequests: true } });
    const expected = c.toolId === "photo-pricing-guide" ? "COMPLETED" : "REVIEW";
    const pdf = after.outputs.find((o) => o.type === "PDF");
    console.log(
      `${c.toolId}: status=${after.status} (expected ${expected}) outputs=${after.outputs.length} runs=${after.runs.length} aiCalls=${after.aiRequests.length} costMicros=${after.runs[0]?.costMicros ?? 0}` +
        (pdf?.file ? ` pdfBytes=${pdf.file.sizeBytes}` : ""),
    );
    if (after.status !== expected) throw new Error(`Unexpected status for ${c.toolId}: ${after.status} — ${after.errorMessage ?? after.qcNotes ?? ""}`);
    if (c.toolId === "photo-pricing-guide" && !(pdf?.file && pdf.file.sizeBytes > 5000)) throw new Error("PDF missing or too small");
  }

  const report = await generateCeoReport("DAILY");
  console.log(`ceo report: ${report.id}`);
  console.log("SMOKE OK");
}

main()
  .catch((err) => {
    console.error("SMOKE FAILED", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
