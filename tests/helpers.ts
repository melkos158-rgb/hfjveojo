import { prisma } from "@/lib/db";
import { syncToolsToDatabase } from "@/lib/tools/registry";

/** Truncate every application table (keeps the schema and migration history). */
export async function resetDatabase(): Promise<void> {
  const tables = [
    "Event",
    "Feedback",
    "AdminAction",
    "ChannelCost",
    "MarketingChannel",
    "ExperimentVariant",
    "Experiment",
    "GeneratedOutput",
    "File",
    "AiRequest",
    "ToolRun",
    "Job",
    "CreditLedger",
    "Subscription",
    "StripeEvent",
    "Refund",
    "Payment",
    "Order",
    "Product",
    "ToolVersion",
    "Tool",
    "MagicLinkToken",
    "User",
    "CeoReport",
    "ErrorLog",
    "RateLimit",
    "Setting",
  ];
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`);
  await syncToolsToDatabase();
}

export const samplePricingGuideIntake = {
  studioName: "Ember & Oak Photography",
  photographerName: "Maya Torres",
  genre: "wedding",
  location: "Denver, Colorado",
  packagesText: "The Essentials | $2,400 | 6 hours coverage, 400+ edited photos\nThe Full Day | $3,800 | 10 hours, second shooter",
  brandVoice: "warm",
  brandColor: "#8a6d3b",
};

export const sampleListingClipsIntake = {
  agentName: "Jordan Lee",
  listingAddress: "1420 Oak Hill Dr, Austin, TX",
  price: "$549,000",
  beds: "3",
  baths: "2.5",
  features: "Renovated kitchen with quartz island; covered patio; primary suite",
  videoLink: "https://drive.google.com/file/d/abc123/view",
  style: "cinematic",
  musicVibe: "chill",
};

export const sampleListingDescriptionIntake = {
  address: "1420 Oak Hill Dr, Austin, TX",
  price: "$549,000",
  beds: "3",
  baths: "2.5",
  sqft: "1,980",
  propertyType: "single-family",
  features: "Renovated kitchen with quartz island (2024)\nCovered patio and fenced backyard\nPrimary suite with walk-in closet",
  neighborhood: "Four blocks from Zilker Park",
  tone: "warm",
  mlsLimit: "1000",
  openHouse: "Sunday 2–4 pm",
  agentName: "Jordan Lee",
  brokerage: "",
};
