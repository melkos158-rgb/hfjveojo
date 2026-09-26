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

import { TEST_INTAKES } from "@/lib/tools/samples/test-intakes";

export const samplePricingGuideIntake = TEST_INTAKES["photographer-pricing-guide"];
export const sampleListingClipsIntake = TEST_INTAKES["listing-clips"];
export const sampleListingDescriptionIntake = TEST_INTAKES["listing-description"];
