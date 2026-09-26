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

  await prisma.experiment.upsert({
    where: { key: "e3-listing-description" },
    create: {
      key: "e3-listing-description",
      name: "E3 — Listing Description (automated, $9 entry product)",
      hypothesis:
        "A $9 instant MLS description + social captions is an easy first purchase for agents (new listing every few weeks), lowers the barrier to the $49 clips, and converts organic search traffic for 'listing description generator' queries.",
      targetCustomer: "US residential agents with a new listing this week; also RE assistants and transaction coordinators",
      offer: "MLS description within the MLS limit + web version + 3 captions + hashtags + email blurb, $9, about 5 minutes, one revision",
      channel: "seo + instagram_dm + facebook_groups",
      priceCents: 900,
      status: "RUNNING",
      startAt: new Date(),
      successCriteria: "≥10 paid orders in 30 days with AI cost ≤ $0.10/order, ≥20% of buyers order again within 45 days, 0 fair-housing complaints",
      failureCriteria: "<3 paid orders after 30 days with ≥300 tool-page views, or QC parks >30% of orders for a human",
      expected: { orders: 10, revenueCents: 9000, costCents: 100 },
    },
    update: {},
  });

  await prisma.experiment.upsert({
    where: { key: "e4-virtual-staging" },
    create: {
      key: "e4-virtual-staging",
      name: "E4 — Virtual Staging (automated, $15 per photo)",
      hypothesis:
        "Agents and listing photographers with an empty room photo will pay $15 for two photorealistic staged versions delivered in minutes, instead of $25–75 and 24–48 h at a staging company; the visual before/after also makes the strongest social proof for outreach.",
      targetCustomer: "US listing agents and real-estate photographers with vacant listings; flippers and property managers",
      offer: "Upload one room photo, pick room type + style, get 2 staged PNGs of the same photo in about 2 minutes, $15, one redo included",
      channel: "instagram_dm + facebook_groups + seo",
      priceCents: 1500,
      status: "RUNNING",
      startAt: new Date(),
      successCriteria: "≥10 paid photos in 30 days with AI cost ≤ $0.40/order, ≤20% redo requests, ≥30% of buyers stage a second photo within 30 days",
      failureCriteria: "<3 paid photos after 30 days with ≥300 tool-page views, or >30% of results parked for a human (structure changed / broken image)",
      expected: { orders: 10, revenueCents: 15000, costCents: 300 },
    },
    update: {},
  });

  console.log("experiments: e1-listing-clips, e2-photo-pricing-guide, e3-listing-description, e4-virtual-staging");
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
