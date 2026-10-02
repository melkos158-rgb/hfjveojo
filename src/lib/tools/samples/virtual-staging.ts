import type { GalleryImage, SampleResult, StyleGalleryData } from "@/lib/tools/types";

/**
 * Sample shown on /tools/virtual-staging and the home page. The "before" is a sample photo of an empty room;
 * the "after" is the unedited output of the production pipeline for it (test order #6, gpt-image-2,
 * 2026-09-26, file staged-living-room-modern-v2.jpg) — so the sample is exactly what a customer receives.
 * Static files under public/img.
 */
export const SAMPLE_VIRTUAL_STAGING_RESULT: SampleResult = {
  label: "Real result for a sample photo of an empty living room",
  caption: "The staged photo is exactly what our pipeline returned — not retouched. Your order runs the same pipeline on your photo.",
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
      heading: "Disclosure pack (California AB 723 / MLS)",
      text: "Each version again with a small “Virtually staged” label in the corner, a public page with the unaltered original photo plus a QR code for flyers, and the line to paste next to the photo: “Virtually staged (digitally altered image). Original photo: orvionis.com/original/…”.",
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
  note: "Label it “virtually staged” in the MLS — most boards require it. If anything structural changes in your result, one redo is included.",
};

const room = (name: string, alt: string): GalleryImage => ({
  src: `/img/styles/living-room-${name}.webp`,
  thumb: `/img/styles/living-room-${name}-thumb.webp`,
  width: 1200,
  height: 800,
  alt,
});

/**
 * "One room, six styles" on /tools/virtual-staging and in the styles guide. The empty room is a free stock photo
 * (Pexels 3958955, Pexels licence) that production staged once per style through the marketing lab
 * (src/lib/ops/lab.ts) — the customer pipeline, 2026-10-02. One of the two versions of each run is shown, unedited
 * apart from resizing to 1200×800.
 */
export const STYLE_GALLERY: StyleGalleryData = {
  title: "One room, six styles",
  intro: "Not sure which style fits your listing? Here is the same empty living room, staged by ORVIONIS in each of the six styles you can order.",
  before: room("empty", "An empty living room with a white fireplace mantel, a wall of four tall windows with wood blinds, a ceiling fan and a dark wood floor"),
  styles: [
    { label: "Modern", image: room("modern", "The same living room staged in a modern style: a cream sofa, a black steel coffee table on a jute rug, an armchair, a large table lamp, an olive tree and a landscape print over the mantel") },
    { label: "Scandinavian", image: room("scandinavian", "The same living room staged in a Scandinavian style: a cream sofa with a chaise and a knit throw, a round oak coffee table, a wood-frame armchair, a jute rug, a tall plant and a mountain print over the mantel") },
    { label: "Farmhouse", image: room("farmhouse", "The same living room staged in a farmhouse style: a rolled-arm sofa with plaid pillows, a carved rustic wood coffee table, an armchair with a green throw, a tripod floor lamp and a landscape painting over the mantel") },
    { label: "Mid-century", image: room("mid-century", "The same living room staged in a mid-century style: a wood-frame lounge chair with olive cushions, an oval walnut coffee table, a light sofa with orange pillows, a fiddle-leaf fig and abstract orange art over the mantel") },
    { label: "Luxury", image: room("luxury", "The same living room staged in a luxury style: a cream sectional with a chunky knit throw, a dark wood coffee table, a wood-frame armchair, a tall ceramic table lamp and framed landscape art") },
    { label: "Coastal", image: room("coastal", "The same living room staged in a coastal style: a white slipcovered sofa with blue and striped pillows, a light-blue armchair, a whitewashed coffee table, wicker side tables, a coral print and a seascape over the mantel") },
  ],
  caption: "Real results, not retouched: a free stock photo of an empty room (Curtis Adams, Pexels) run through ORVIONIS once per style — the same pipeline as your order. Each run returns two versions; one is shown here, resized. The walls, windows, fireplace and ceiling fan stay as photographed.",
  link: { href: "/guides/virtual-staging-styles", label: "How to pick a style for your listing" },
};

/**
 * Intake for the admin pipeline test and the test-suite. `@file:` values are resolved to a stored File id by
 * materializeTestIntake() — the sample "before" photo is uploaded exactly as a customer's would be.
 */
export const PIPELINE_TEST_INTAKE = {
  rooms: [{ photoFileId: "@file:img/sample-staging-before.jpg", roomType: "living room" }],
  style: "modern",
  notes: "keep the windows and the floor visible, no TV on the wall",
};
