import type { ROOM_TYPES } from "@/lib/tools/definitions/virtual-staging";

export type RoomExampleImage = { src: string; width: number; height: number; alt: string };

/** One room from the 3 Oct 2026 lab test: the empty stock photo and the staged result, shown side by side. */
export type RoomExample = {
  key: string;
  label: string;
  /** Fits under a phone-width thumbnail. */
  short: string;
  roomType: (typeof ROOM_TYPES)[number];
  style: string;
  before: RoomExampleImage;
  after: RoomExampleImage;
  thumb: string;
  /** What the model added and what stayed, read off the pair itself (no claims beyond the picture). */
  added: string;
  kept: string;
  /** Pexels photo id of the empty room (free licence). */
  pexelsId: number;
};

const img = (name: string, side: "before" | "after", alt: string): RoomExampleImage => ({ src: `/img/rooms/${name}-${side}.webp`, width: 1200, height: 800, alt });

/**
 * Real results by room for the "which rooms to stage" guide. They come from the room-type lab test (src/content/lab-requests.ts,
 * docs/GROWTH_EXPERIMENTS.md, 3 Oct 2026). The staged photos are the image model's output, unedited, resized to 1200 px;
 * the empty photos are cropped to the same frame. The backyard pool from the same test is left out on purpose: the
 * model replaced two folding chairs and a float that were in the photo, which isn't what we promise.
 */
export const ROOM_EXAMPLES: RoomExample[] = [
  {
    key: "kitchen",
    label: "Kitchen",
    short: "Kitchen",
    roomType: "kitchen",
    style: "Modern",
    before: img("kitchen", "before", "Empty kitchen with wood cabinets, a black hood and a balcony door, as photographed"),
    after: img("kitchen", "after", "The same kitchen virtually staged with a small round table, chairs and a little counter decor"),
    thumb: "/img/rooms/kitchen-thumb.webp",
    added: "a small round table with chairs, a fruit bowl and a little decor on the counter",
    kept: "the cabinets, hood, boiler, sink, radiator and the cage pendant light",
    pexelsId: 8146322,
  },
  {
    key: "dining-room",
    label: "Dining room",
    short: "Dining",
    roomType: "dining room",
    style: "Scandinavian",
    before: img("dining-room", "before", "Empty dining room with a chandelier, tiled floor and three windows, as photographed"),
    after: img("dining-room", "after", "The same dining room virtually staged with a wooden table for six, a rug, a sideboard and plants"),
    thumb: "/img/rooms/dining-room-thumb.webp",
    added: "a table for six, a rug, a sideboard with a lamp, plants and two framed prints",
    kept: "the chandelier, the windows, the wall trim and the vents",
    pexelsId: 20025667,
  },
  {
    key: "bathroom",
    label: "Bathroom",
    short: "Bathroom",
    roomType: "bathroom",
    style: "Coastal",
    before: img("bathroom", "before", "Empty bathroom with a ring ceiling light, a glass shower, a corner bathtub and a window, as photographed"),
    after: img("bathroom", "after", "The same bathroom virtually staged with a bath mat, a stool with towels, a bath tray and a framed print"),
    thumb: "/img/rooms/bathroom-thumb.webp",
    added: "a bath mat, a stool with folded towels, a bath tray, a small plant and a framed print; one towel hangs on a hook that was already there",
    kept: "the ring light, the shower, the bathtub, the vanity, the mirror and the radiator",
    pexelsId: 7031878,
  },
  {
    key: "covered-porch",
    label: "Covered porch",
    short: "Porch",
    roomType: "patio or outdoor",
    style: "Coastal",
    before: img("covered-porch", "before", "Empty screened porch with a ceiling fan, a wall lantern and a door, as photographed"),
    after: img("covered-porch", "after", "The same porch virtually staged with a wicker sofa and armchair, a coffee table, a rug and plants"),
    thumb: "/img/rooms/covered-porch-thumb.webp",
    added: "a wicker sofa and armchair, a coffee table, a side table with a lamp, a rug, plants and a framed print",
    kept: "the ceiling fan, the wall lantern, the door and the screens",
    pexelsId: 4030040,
  },
  {
    key: "home-office",
    label: "Home office",
    short: "Office",
    roomType: "home office",
    style: "Modern",
    before: img("home-office", "before", "Empty room with a wooden floor, two windows and a doorway to the next room, as photographed"),
    after: img("home-office", "after", "The same room virtually staged as a home office with a desk, a reading chair, a floor lamp and a rug"),
    thumb: "/img/rooms/home-office-thumb.webp",
    added: "a desk and chair, a reading chair, a floor lamp, a rug, a plant and a framed print",
    kept: "the room seen through the doorway, exactly as photographed",
    pexelsId: 3935327,
  },
];
