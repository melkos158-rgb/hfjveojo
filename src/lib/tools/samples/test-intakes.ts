import { PIPELINE_TEST_INTAKE as LISTING_DESCRIPTION } from "@/lib/tools/samples/listing-description";

/**
 * One valid intake per tool for the admin pipeline test and the test-suite. Fictional data only.
 * Adding a tool: add its slug here so the admin can prove its pipeline in production.
 */
export const TEST_INTAKES: Record<string, Record<string, unknown>> = {
  "listing-description": LISTING_DESCRIPTION,
  "photographer-pricing-guide": {
    studioName: "Ember & Oak Photography",
    photographerName: "Maya Torres",
    genre: "wedding",
    location: "Denver, Colorado",
    packagesText: "The Essentials | $2,400 | 6 hours coverage, 400+ edited photos\nThe Full Day | $3,800 | 10 hours, second shooter",
    brandVoice: "warm",
    brandColor: "#8a6d3b",
  },
  "listing-clips": {
    agentName: "Jordan Lee",
    listingAddress: "1420 Oak Hill Dr, Austin, TX",
    price: "$549,000",
    beds: "3",
    baths: "2.5",
    features: "Renovated kitchen with quartz island; covered patio; primary suite with soaking tub; oak-shaded corner lot",
    videoLink: "https://drive.google.com/file/d/abc123/view",
    style: "cinematic",
    musicVibe: "chill",
  },
};
