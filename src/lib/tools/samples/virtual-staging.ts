import type { SampleResult } from "@/lib/tools/types";

/**
 * Sample shown on /tools/virtual-staging. The before photo is a fictional empty living room; the "after" is the
 * kind of result the image model returns for it (same walls, floor, windows and camera angle — only furniture,
 * rug, lighting and decor added). Static files under public/img — nothing is generated at request time.
 */
export const SAMPLE_VIRTUAL_STAGING_RESULT: SampleResult = {
  label: "Sample for a fictional empty living room",
  input: [
    "1 photo of the empty living room — three windows, oak floor (JPG, 1.8 MB)",
    "Room: living room · Style: modern",
    "Notes: keep the windows and the floor visible, no TV on the wall",
  ],
  output: [
    {
      heading: "Staged version 1 — modern living room (JPG)",
      text: "A grey sectional, a walnut coffee table, a jute rug, a floor lamp, an olive tree and one large print were added. Walls, floor, windows, door, trim and the camera perspective are exactly as photographed.",
    },
    {
      heading: "Staged version 2 — modern living room (JPG)",
      text: "The same room with a second furniture layout, so you can pick the version that reads best as the listing's hero photo.",
    },
    {
      heading: "Staging details (JSON)",
      text: "Room type, style, your notes and the exact instructions sent to the image model — kept with the order so a redo starts from the same brief.",
    },
  ],
  preview: {
    image: "/img/sample-virtual-staging.webp",
    alt: "Before and after: the same empty living room, then virtually staged with a sectional sofa, rug, coffee table and plants",
    width: 1420,
    height: 480,
  },
  note: "Label the photo “virtually staged” in the MLS — most boards require it. If anything structural changed in your result, one redo is included.",
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
