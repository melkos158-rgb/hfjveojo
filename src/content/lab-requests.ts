import type { StagingRoomType, StagingStyle } from "@/lib/tools/definitions/virtual-staging";

/**
 * Marketing lab: stock photos of empty rooms that production stages with the exact customer pipeline — same prompt,
 * model, quality and two versions per photo (src/lib/ops/lab.ts) — so videos and posts can show real ORVIONIS output
 * on rooms that are nobody's listing. Only photos under a licence that allows modification and commercial use
 * (Pexels licence, Unsplash licence). Append only: a run that is done keeps its result, so to redo one, add a new id.
 * Runs happen one at a time, in production only, within a share of the daily AI budget; results are listed for the
 * media bridge at /api/lab/manifest.
 */
export type LabRequest = {
  /** Stable id ([a-z0-9-]): used in file names and in the manifest. */
  id: string;
  /** https URL on images.pexels.com or images.unsplash.com, sized to 2048 px by the CDN. */
  imageUrl: string;
  roomType: StagingRoomType;
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
    credit: "Pexels photo 3958955, Pexels licence",
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
];
