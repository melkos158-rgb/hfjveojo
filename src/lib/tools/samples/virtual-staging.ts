import type { SampleResult } from "@/lib/tools/types";

/**
 * Sample shown on /tools/virtual-staging and the home page. The "before" is a sample photo of an empty room;
 * the "after" is the unedited output of the production pipeline for it (test order #6, gpt-image-2,
 * 2026-09-26) — so the sample is exactly what a customer receives. Static files under public/img.
 */
export const SAMPLE_VIRTUAL_STAGING_RESULT: SampleResult = {
  label: "Real result for a sample photo of an empty living room",
  input: [
    "1 photo of the empty living room — three windows, oak floor, recessed ceiling light",
    "Room: living room · Style: modern",
    "Notes: keep the windows and the floor visible, no TV on the wall",
  ],
  output: [
    {
      heading: "Staged version 1 — modern living room (JPG, 1536×1040)",
      text: "A cream sofa with a side table, a round coffee table on a jute rug, two wood-frame armchairs, a floor lamp, an olive tree and three framed prints were added. The recessed ceiling light, walls, floor, windows, doors and the camera position are exactly as photographed, and the photo keeps its proportions.",
    },
    {
      heading: "Staged version 2 — modern living room (JPG, 1536×1040)",
      text: "The same room with a second furniture layout — different coffee table, lamps and plant placement — so you can pick the version that reads best as the listing's hero photo.",
    },
    {
      heading: "Staging details (JSON)",
      text: "Room type, style, your notes and the exact instructions sent to the image model — kept with the order so a redo starts from the same brief.",
    },
  ],
  preview: {
    image: "/img/sample-virtual-staging.webp",
    alt: "Before and after: an empty living room, then the same photo virtually staged with a sofa, rug, coffee table, armchairs, a floor lamp and framed prints",
    width: 1420,
    height: 480,
  },
  note: "The staged photo above is the unedited output of our pipeline. Label it “virtually staged” in the MLS — most boards require it. If anything structural changes in your result, one redo is included.",
};

/**
 * Intake for the admin pipeline test and the test-suite. `@file:` values are resolved to a stored File id by
 * materializeTestIntake() — the sample "before" photo is uploaded exactly as a customer's would be.
 */
export const PIPELINE_TEST_INTAKE = {
  photoFileId: "@file:img/sample-staging-before.jpg",
  roomType: "living room",
  style: "modern",
  notes: "keep the windows and the floor visible, no TV on the wall",
};
