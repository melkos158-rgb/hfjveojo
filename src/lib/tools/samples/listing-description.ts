import type { SampleResult } from "@/lib/tools/types";

/** The MLS description below is 641 characters — inside the 1,000-character limit chosen in the sample input. */
export const SAMPLE_MLS_DESCRIPTION =
  "Tucked at the end of Maple Court, this 3-bedroom, 2-bath home pairs a fully renovated kitchen with the kind of covered back deck that turns summer evenings into a habit. Quartz counters, a walk-in pantry and a wide island anchor the open main level, with afternoon light pouring in through the deck doors. The primary suite has dual closets and its own bath; two more bedrooms share a full bath down the hall. Outside, mature maples shade the deck and the fenced yard, and the oversized two-car garage is wired for an EV charger. Ten minutes to downtown Boise, with the river trail and a neighborhood park close by. Open house Saturday 11–1.";

export const SAMPLE_LISTING_DESCRIPTION_RESULT: SampleResult = {
  label: "Sample for a fictional 3-bed in Boise, Idaho",
  input: [
    "312 Maple Court, Boise, ID · $489,000",
    "3 bd · 2 ba · 1,820 sq ft · single-family",
    "Renovated kitchen with quartz counters and walk-in pantry",
    "Covered back deck under mature maples; fenced yard",
    "Primary suite with dual closets; oversized 2-car garage with EV outlet",
    "10 minutes to downtown Boise · open house Saturday 11–1",
    "Tone: warm · MLS limit: 1,000 characters · Agent: Jordan Lee, Summit Realty",
  ],
  output: [
    { heading: "Headline", text: "End-of-court 3-bed with a renovated kitchen and a covered deck under the maples" },
    { heading: "MLS description (641 characters)", text: SAMPLE_MLS_DESCRIPTION },
    {
      heading: "Long version — website, flyer, listing site",
      text: "Some houses are about the kitchen. This one is about the kitchen and the deck. The renovation put quartz counters, a wide island and a walk-in pantry at the center of an open main level, so cooking, laptops and long conversations all happen in the same bright room. Slide the doors open and the covered deck takes over: mature maples overhead, a fenced yard below, and enough shade to make August feel reasonable.\n\nThe primary suite sits at the quiet end of the house with dual closets and a private bath. Two more bedrooms share a full bath down the hall, and the oversized two-car garage has room for bikes, gear and an EV charger. Downtown Boise is ten minutes away; the river trail and a neighborhood park are closer than that.\n\n312 Maple Court is offered at $489,000. Open house Saturday 11–1, or contact Jordan Lee at Summit Realty for a private showing.",
    },
    {
      heading: "Social captions",
      bullets: [
        "Instagram: Just listed on Maple Court 🍁 Renovated kitchen, covered deck under mature maples, EV-ready garage. $489,000 · 3 bd · 2 ba. Open house Saturday 11–1 — link in bio.",
        "Facebook: New in Boise: 312 Maple Court. A fully renovated kitchen with quartz counters and a walk-in pantry, a covered deck shaded by mature maples, and an oversized two-car garage wired for an EV. 3 bed, 2 bath, $489,000. Open house Saturday 11–1 — message me for the details.",
        "TikTok: POV: your kitchen has a walk-in pantry and your deck has shade. 312 Maple Court, Boise · $489,000 · open Saturday 11–1.",
      ],
    },
    { heading: "Hashtags", text: "#BoiseRealEstate #JustListed #BoiseHomes #IdahoLiving #OpenHouse #RenovatedKitchen #TreasureValley #HomeTour" },
    {
      heading: "Email blurb — for your client list",
      text: "New listing: 312 Maple Court, Boise — $489,000. A 3-bed, 2-bath with a fully renovated kitchen, a covered deck under mature maples and an EV-ready garage, ten minutes from downtown. Open house Saturday 11–1; reply to this email for a private showing.",
    },
  ],
  collapseAfter: 2,
  note: "Every draft is checked for fair-housing wording and placeholder text before it is delivered. Facts you did not give are never invented.",
};
