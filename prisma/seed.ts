import "../scripts/load-env";
import { prisma } from "../src/lib/db";
import { syncToolsToDatabase } from "../src/lib/tools/registry";
import { upsertUserByEmail } from "../src/lib/auth/magic";
import { adminEmails } from "../src/lib/env";

/**
 * Idempotent seed: syncs tool definitions + products from code, creates admin users from ADMIN_EMAILS,
 * registers the two launch experiments and the marketing channels used for CAC tracking.
 */
async function main() {
  const synced = await syncToolsToDatabase();
  console.log(`tools synced: ${synced.tools}, products: ${synced.products}`);

  for (const email of adminEmails()) {
    const u = await upsertUserByEmail(email);
    console.log(`admin: ${u.email} (${u.role})`);
  }

  const channels = [
    ["instagram_dm", "Instagram DMs"],
    ["facebook_groups", "Facebook groups"],
    ["reddit", "Reddit"],
    ["seo", "Organic search"],
    ["referral", "Referral / word of mouth"],
    ["etsy", "Etsy listing"],
    ["direct", "Direct / unknown"],
  ];
  for (const [key, name] of channels) {
    await prisma.marketingChannel.upsert({ where: { key }, create: { key, name }, update: { name } });
  }

  await prisma.experiment.upsert({
    where: { key: "e1-listing-clips" },
    create: {
      key: "e1-listing-clips",
      name: "E1 — Listing Clips concierge for US agents",
      hypothesis:
        "Agents who already shoot walkthroughs will pay $49 per listing for 5 captioned vertical clips delivered in 48h, because editing agencies charge ~$195/mo for 10 clips and single Fiverr edits run $15–$65.",
      targetCustomer: "US residential agents who posted a listing walkthrough on Instagram/TikTok in the last 7 days",
      offer: "5 vertical clips + captions + hashtags from one walkthrough, $49, 48h, one revision; optional free single-clip sample for the first 10 prospects",
      channel: "instagram_dm + facebook_groups",
      priceCents: 4900,
      status: "RUNNING",
      startAt: new Date(),
      successCriteria: "≥3 paid orders from ≤60 personalised messages within 14 days (≥5% reply→paid), ≥1 repeat or subscription interest, delivery ≤48h, no refunds",
      failureCriteria: "0 paid orders after 60 messages + one offer iteration (price or free-sample variant), or delivery cost > 2h founder time per order twice in a row",
      expected: { orders: 3, revenueCents: 14700, costCents: 500 },
    },
    update: {},
  });

  await prisma.experiment.upsert({
    where: { key: "e2-photo-pricing-guide" },
    create: {
      key: "e2-photo-pricing-guide",
      name: "E2 — Photographer Pricing Guide (automated)",
      hypothesis:
        "Independent photographers will pay $29 for a branded pricing-guide PDF generated from their real packages, because they already buy $10–$20 templates and spend hours filling them in.",
      targetCustomer: "Wedding/portrait/family photographers active on Instagram or in Facebook groups",
      offer: "Branded 5-page pricing guide PDF + Markdown text, generated in minutes, $29, free regeneration once",
      channel: "instagram_dm + facebook_groups + seo",
      priceCents: 2900,
      status: "RUNNING",
      startAt: new Date(),
      successCriteria: "≥5 paid orders in 30 days with AI cost ≤ $0.50/order and ≥4/5 average feedback; ≥1 organic (non-outreach) order",
      failureCriteria: "<2 paid orders after 60 outreach messages + 2 community posts in 30 days, or feedback avg <3/5",
      expected: { orders: 5, revenueCents: 14500, costCents: 300 },
    },
    update: {},
  });

  console.log("experiments: e1-listing-clips, e2-photo-pricing-guide");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
