import type { StagingRoomType, StagingStyle } from "@/lib/tools/definitions/virtual-staging";

/**
 * Marketing lab: stock photos of empty rooms that production stages with the exact customer pipeline — same prompt,
 * model, quality and two versions per photo (src/lib/ops/lab.ts) — so videos and posts can show real ORVIONIS output
 * on rooms that are nobody's listing. Only photos under a licence that allows modification and commercial use
 * (Pexels licence, Unsplash licence). Append only: a run that is done keeps its result, so to redo one, add a new id.
 * Runs happen one at a time, in production only, within a share of the daily AI budget; results are listed for the
 * media bridge at /api/lab/manifest.
 *
 * The lab also tests rooms before they are offered: a LabOnlyRoomType goes into the same prompt as a customer's room
 * type, but the order form never shows it. (Bathroom started here and joined the form on 3 Oct; none is pending now.)
 */
export type LabOnlyRoomType = never;

export type LabRequest = {
  /** Stable id ([a-z0-9-]): used in file names and in the manifest. */
  id: string;
  /** https URL on images.pexels.com or images.unsplash.com, sized to 2048 px by the CDN. */
  imageUrl: string;
  roomType: StagingRoomType | LabOnlyRoomType;
  styles: readonly StagingStyle[];
  /** Same field as the customer's "anything to keep or avoid". */
  notes?: string;
  /** Source and licence of the photo. */
  credit: string;
};

const pexels = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2048`;
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=2048&q=85`;

export const LAB_REQUESTS: readonly LabRequest[] = [
  {
    // Living room with a fireplace, a wall of windows and a ceiling fan: one room in all six styles (video v8).
    id: "pexels-3958955",
    imageUrl: pexels(3958955),
    roomType: "living room",
    styles: ["modern", "scandinavian", "farmhouse", "mid-century", "luxury", "coastal"],
    credit: "Pexels photo 3958955 by Curtis Adams, Pexels licence",
  },
  {
    id: "unsplash-1668910242969",
    imageUrl: unsplash("1668910242969-bd2933e7a5cf"),
    roomType: "bedroom",
    styles: ["modern", "scandinavian", "coastal"],
    credit: "Unsplash photo 1668910242969-bd2933e7a5cf, Unsplash licence",
  },
  {
    id: "pexels-15062102",
    imageUrl: pexels(15062102),
    roomType: "living room",
    styles: ["luxury", "modern"],
    credit: "Pexels photo 15062102, Pexels licence",
  },
  {
    id: "pexels-4030075",
    imageUrl: pexels(4030075),
    roomType: "living room",
    styles: ["farmhouse", "luxury"],
    credit: "Pexels photo 4030075, Pexels licence",
  },
  {
    // Portrait photo: fills a vertical video frame.
    id: "pexels-16333971",
    imageUrl: pexels(16333971),
    roomType: "bedroom",
    styles: ["scandinavian", "farmhouse"],
    credit: "Pexels photo 16333971, Pexels licence",
  },
  // Room-type test (3 Oct). The order form offers these rooms, but until now only living rooms and bedrooms had been
  // run. One style each, no notes: what a customer gets today from the shared prompt.
  {
    id: "pexels-8146322",
    imageUrl: pexels(8146322),
    roomType: "kitchen",
    styles: ["modern"],
    credit: "Pexels photo 8146322, Pexels licence",
  },
  {
    id: "pexels-20025667",
    imageUrl: pexels(20025667),
    roomType: "dining room",
    styles: ["scandinavian"],
    credit: "Pexels photo 20025667, Pexels licence",
  },
  {
    id: "pexels-3935327",
    imageUrl: pexels(3935327),
    roomType: "home office",
    styles: ["modern"],
    credit: "Pexels photo 3935327, Pexels licence",
  },
  {
    // An empty covered porch.
    id: "pexels-4030040",
    imageUrl: pexels(4030040),
    roomType: "patio or outdoor",
    styles: ["coastal"],
    credit: "Pexels photo 4030040, Pexels licence",
  },
  {
    // A backyard pool. A customer would pick "patio or outdoor".
    id: "pexels-8134750",
    imageUrl: pexels(8134750),
    roomType: "patio or outdoor",
    styles: ["modern"],
    credit: "Pexels photo 8134750, Pexels licence",
  },
  {
    // Bathrooms were lab-only until round 2 (offered from 3 Oct).
    id: "pexels-7045910",
    imageUrl: pexels(7045910),
    roomType: "bathroom",
    styles: ["modern"],
    credit: "Pexels photo 7045910, Pexels licence",
  },
  // Photo-quality test (3 Oct): inputs that are worse than a photographer's.
  {
    // The same room as pexels-3958955 at 480 px wide, like a small phone or web copy. Compare with its modern run.
    id: "pexels-3958955-480",
    imageUrl: "https://images.pexels.com/photos/3958955/pexels-photo-3958955.jpeg?auto=compress&cs=tinysrgb&w=480",
    roomType: "living room",
    styles: ["modern"],
    credit: "Pexels photo 3958955 by Curtis Adams, Pexels licence",
  },
  {
    // A wide-angle shot with stretched corners.
    id: "pexels-8146336",
    imageUrl: pexels(8146336),
    roomType: "living room",
    styles: ["modern"],
    credit: "Pexels photo 8146336, Pexels licence",
  },
  // Round 2 (3 Oct, after the room-specific prompt lines): the same photos where round 1 went wrong, plus a second
  // kitchen and a second bathroom.
  {
    // Round 1 removed the pendant light.
    id: "pexels-8146322-r2",
    imageUrl: pexels(8146322),
    roomType: "kitchen",
    styles: ["modern"],
    credit: "Pexels photo 8146322, Pexels licence",
  },
  {
    id: "pexels-7061337",
    imageUrl: pexels(7061337),
    roomType: "kitchen",
    styles: ["scandinavian"],
    credit: "Pexels photo 7061337, Pexels licence",
  },
  {
    id: "pexels-7045910-r2",
    imageUrl: pexels(7045910),
    roomType: "bathroom",
    styles: ["modern"],
    credit: "Pexels photo 7045910, Pexels licence",
  },
  {
    id: "pexels-7031878",
    imageUrl: pexels(7031878),
    roomType: "bathroom",
    styles: ["coastal"],
    credit: "Pexels photo 7031878, Pexels licence",
  },
  {
    // Round 1 hung wall art on the facade and removed the chairs by the pool.
    id: "pexels-8134750-r2",
    imageUrl: pexels(8134750),
    roomType: "patio or outdoor",
    styles: ["modern"],
    credit: "Pexels photo 8134750, Pexels licence",
  },
  {
    // Round 1 also furnished the room seen through the doorway.
    id: "pexels-3935327-r2",
    imageUrl: pexels(3935327),
    roomType: "home office",
    styles: ["modern"],
    credit: "Pexels photo 3935327, Pexels licence",
  },
  // Round 3 (3 Oct): the second kitchen lost its recessed spotlights in round 2, and one bathroom version added a towel
  // rail. Same photos with the counting line and the no-new-rails rule.
  {
    id: "pexels-7061337-r3",
    imageUrl: pexels(7061337),
    roomType: "kitchen",
    styles: ["scandinavian"],
    credit: "Pexels photo 7061337, Pexels licence",
  },
  {
    id: "pexels-7045910-r3",
    imageUrl: pexels(7045910),
    roomType: "bathroom",
    styles: ["modern"],
    credit: "Pexels photo 7045910, Pexels licence",
  },
  // Round 4 (4 Oct): round 3 kept the kitchen's spotlights, but one bathroom version still hung a new towel bar. Both
  // bathrooms again with towels only folded or draped and framed art as the only thing on a wall.
  {
    id: "pexels-7045910-r4",
    imageUrl: pexels(7045910),
    roomType: "bathroom",
    styles: ["modern"],
    credit: "Pexels photo 7045910, Pexels licence",
  },
  {
    id: "pexels-7031878-r4",
    imageUrl: pexels(7031878),
    roomType: "bathroom",
    styles: ["coastal"],
    credit: "Pexels photo 7031878, Pexels licence",
  },
];
