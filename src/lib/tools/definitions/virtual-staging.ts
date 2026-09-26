import { z } from "zod";
import type { PipelineContext, PipelineResult, ToolDefinition } from "@/lib/tools/types";
import type { ImageEditCall } from "@/lib/ai";
import { getFileBuffer } from "@/lib/storage";
import { AppError } from "@/lib/errors";
import { AiProviderError } from "@/lib/ai/types";
import { SAMPLE_VIRTUAL_STAGING_RESULT } from "@/lib/tools/samples/virtual-staging";
import { LABELED_VARIANT, LABEL_TEXT, disclosureLine, ensurePublicToken, labelStagedPhoto, originalPhotoUrl } from "@/lib/tools/disclosure";

/**
 * Virtual Staging — photos of empty (or dated) rooms → two photorealistic staged versions of each photo, ready for
 * the MLS. Up to MAX_ROOMS photos per order at the per-photo price (quantity = rooms). The customer pays first; the
 * image model edits each photo without touching walls, floors, windows or fixtures. Per room: 2 JPEGs (PNG fallback)
 * + 2 labeled copies (disclosure pack); one JSON note for the order.
 */

const ROOM_TYPES = ["living room", "bedroom", "dining room", "home office", "kitchen", "patio or outdoor"] as const;
const STYLES = ["modern", "scandinavian", "farmhouse", "mid-century", "luxury", "coastal"] as const;
export const MAX_ROOMS = 6;

const roomSchema = z.object({
  photoFileId: z.string().trim().min(1, "Upload the room photo").max(64),
  roomType: z.enum(ROOM_TYPES).default("living room"),
});

/** Orders before multi-room carried one photo as {photoFileId, roomType}; the form sends rooms as a JSON string. */
function normalizeIntake(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const r = raw as Record<string, unknown>;
  let rooms = r.rooms;
  if (typeof rooms === "string") {
    try {
      rooms = JSON.parse(rooms);
    } catch {
      // leave it: validation reports it
    }
  }
  if (rooms === undefined && typeof r.photoFileId === "string") rooms = [{ photoFileId: r.photoFileId, roomType: r.roomType }];
  return { ...r, rooms };
}

const intakeSchema = z.preprocess(
  normalizeIntake,
  z.object({
    rooms: z.array(roomSchema).min(1, "Upload at least one room photo").max(MAX_ROOMS, `Up to ${MAX_ROOMS} rooms per order`),
    style: z.enum(STYLES).default("modern"),
    notes: z.string().trim().max(300).optional().default(""),
  }),
);

export type VirtualStagingIntake = z.infer<typeof intakeSchema>;
type Room = VirtualStagingIntake["rooms"][number];

export const VIRTUAL_STAGING_VARIATIONS = 2;
/** Wait after an image API rate-limit error (tier-1 accounts: a few images per minute). Tests shorten it. */
export let RATE_LIMIT_WAIT_MS = 30_000;
export function setRateLimitWaitForTests(ms: number): void {
  RATE_LIMIT_WAIT_MS = ms;
}

/** JPEG quality for delivered photos — MLS uploads want JPG; visually identical to the model's PNG at a fifth of the size. */
export const STAGED_JPEG_QUALITY = 92;

/**
 * Re-encode a model PNG as a JPEG for delivery. Falls back to the original PNG if sharp is unavailable,
 * so a missing native binary can never fail a paid order.
 */
export async function encodeForDelivery(png: Buffer): Promise<{ data: Buffer; mime: string; ext: string }> {
  try {
    const sharp = (await import("sharp")).default;
    const data = await sharp(png).rotate().flatten({ background: "#ffffff" }).jpeg({ quality: STAGED_JPEG_QUALITY, mozjpeg: true }).toBuffer();
    return { data, mime: "image/jpeg", ext: "jpg" };
  } catch {
    return { data: png, mime: "image/png", ext: "png" };
  }
}

export function stagingPrompt(i: { roomType: Room["roomType"]; style: VirtualStagingIntake["style"]; notes: string }): string {
  return [
    `Virtually stage this empty ${i.roomType} in a ${i.style} style for a real-estate listing photo.`,
    "Add ONLY freestanding, movable furniture and decor that suits the room: seating or a bed, tables, a rug, cushions, plants, wall art on the existing walls, and floor or table lamps.",
    "Do NOT add, remove or change anything attached to the building: no ceiling lights, chandeliers, pendant lights or ceiling fans (keep the existing ceiling fixture exactly as it is); no built-in shelving, niches, cabinetry, fireplaces, mouldings, wall panels, wallpaper or paint colour changes.",
    "Walls, floor, ceiling, windows and their grids, doors, door hardware, trim, outlets and vents stay exactly as photographed, and so do the camera position, lens and framing — do not crop, zoom, reframe or change the aspect ratio.",
    "Match the existing daylight direction and colour temperature with consistent shadows and reflections. Photorealistic, no people, no pets, no text, no watermarks, no logos.",
    i.notes ? `Customer notes: ${i.notes}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Normalise the customer's photo before the image model sees it: apply the EXIF orientation (phone photos
 * are often stored sideways), cap the long edge at 2048 px and send a clean JPEG. Falls back to the original
 * bytes if sharp is unavailable, so a missing native binary can never fail a paid order.
 */
export async function prepareInputPhoto(data: Buffer, mime: string): Promise<{ data: Buffer; mime: string; width?: number; height?: number }> {
  try {
    const sharp = (await import("sharp")).default;
    const { data: out, info } = await sharp(data)
      .rotate()
      .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    return { data: out, mime: "image/jpeg", width: info.width, height: info.height };
  } catch {
    return { data, mime };
  }
}

/**
 * One image edit, patient with the image API's per-minute cap (a new account allows only a few images a minute, and
 * a multi-room order asks for several): on a rate-limit error wait and try again, up to three times.
 */
async function editWithRateLimitPatience(ctx: PipelineContext<VirtualStagingIntake>, call: ImageEditCall): Promise<{ images: Buffer[]; costMicros: number }> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await ctx.ai.editImage(call, "stage");
    } catch (err) {
      const rateLimited = err instanceof AiProviderError && (err.status === 429 || /rate limit/i.test(err.message));
      if (!rateLimited || attempt >= 3) throw err;
      ctx.step("rate_limit", `Image API rate limit — waiting ${RATE_LIMIT_WAIT_MS / 1000}s (attempt ${attempt + 1} of 3)`);
      await new Promise((r) => setTimeout(r, RATE_LIMIT_WAIT_MS));
    }
  }
}

/** Load the customer's upload, check it is a photo, and normalise it for the image model. */
async function loadRoomPhoto(fileId: string): Promise<{ data: Buffer; mime: string; width?: number; height?: number }> {
  const file = await getFileBuffer(fileId);
  if (!file) throw new AppError("The uploaded photo could not be found (it may have expired). Please upload it again.", 400, "photo_missing");
  const mime = file.file.mime;
  if (!/^image\/(png|jpeg|webp)$/.test(mime)) throw new AppError("The uploaded file is not a PNG, JPEG or WebP image.", 400, "photo_type");
  return prepareInputPhoto(file.data, mime);
}

export const virtualStagingTool: ToolDefinition<VirtualStagingIntake> = {
  id: "virtual-staging",
  slug: "virtual-staging",
  name: "Virtual Staging",
  category: "real-estate",
  tagline: "Empty-room photos in, two staged MLS-ready versions of each out — about two minutes per photo",
  description:
    "Upload photos of empty (or nearly empty) rooms — up to six per order — choose the room type of each and one of six styles, and receive two photorealistic virtually staged versions of every photo — walls, floors, windows and perspective untouched — as MLS-ready JPG files, in about two minutes per photo.",
  initialStatus: "LIVE",
  version: 1,
  fulfillment: "AUTO",
  featured: true,
  io: {
    input: "Photos of the empty rooms, up to 6 (JPG/PNG/WebP, up to 8 MB each)",
    output: "2 photorealistic staged versions of each photo (JPG, MLS-ready)",
    processingTime: "About 2 minutes per photo",
    ctaLabel: "Stage my photos",
  },
  intake: {
    schema: intakeSchema,
    fields: [
      {
        key: "rooms",
        label: "Room photos",
        type: "rooms",
        required: true,
        max: MAX_ROOMS,
        options: ROOM_TYPES.map((r) => ({ value: r, label: r[0].toUpperCase() + r.slice(1) })),
        help: "Up to 6 rooms per order, priced per photo. Straight-on, well lit, empty or nearly empty. Landscape works best.",
      },
      {
        key: "style",
        label: "Style",
        type: "select",
        required: true,
        options: STYLES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })),
      },
      { key: "notes", label: "Anything to keep or avoid (optional)", type: "text", placeholder: "e.g. keep the fireplace visible, no TV on the wall" },
    ],
  },
  pricing: {
    sku: "VIRTUAL_STAGING",
    name: "Virtual Staging — 2 versions per photo",
    priceCents: 1500,
    currency: "usd",
    unit: { one: "photo", many: "photos" },
    // Sources (checked 2026-09-26): boxbrownie.com/virtual-staging — US$30 per image, 48 hours; Bella Virtual Staging's
    // price comparison of 2026-07-20 — Styldod $23 ($16 on 8+ photos), BoxBrownie $30, Stuccco $35, Bella $37, 24–48 h.
    compareAtText: "Staging services with human editors charge about $23–37 per photo and take 24–48 hours",
  },
  sla: { deliveryHours: 1 },
  landing: {
    headline: "Empty room in, staged listing photo out.",
    subheadline: "Upload photos of the empty rooms, pick a style, and get two photorealistic staged versions of each exact photo — same walls, same windows, same light — in about two minutes per photo.",
    bullets: [
      "2 staged versions of each photo, 1024 px or larger, JPG ready for the MLS",
      "Up to 6 rooms in one order, $15 per photo — pick the room type of each",
      "The architecture stays untouched: walls, floors, windows, fixtures, perspective",
      "6 styles: modern, scandinavian, farmhouse, mid-century, luxury, coastal",
      "Before/after side by side on your order page, downloads kept 90 days",
      "Disclosure pack for California AB 723 and MLS rules: labeled copies, a public link and QR code to the original photo, and the line to paste next to it",
    ],
    howItWorks: [
      { title: "1. Upload the photos", text: "Up to 6 well-lit photos of empty rooms, up to 8 MB each. Pick the room type of each photo and one style." },
      { title: "2. Pay $15 per photo", text: "Secure checkout via Stripe. Staging starts immediately." },
      { title: "3. Download both versions of each", text: "About two minutes per photo later: two staged variations of every room on your order page and by email." },
    ],
    faq: [
      { q: "Does it change the room itself?", a: "No. Furniture, rugs, lighting and decor are added; walls, floors, windows, doors and the camera angle are kept as photographed. If something structural did change, reply to the delivery email and we redo it." },
      { q: "Do I have to disclose virtual staging?", a: "Almost everywhere, yes. In California, AB 723 (in force since January 1, 2026) requires digitally altered listing photos to carry a disclosure next to the image and the unaltered original to be available — on your own site, or through a public link or QR code elsewhere. Most MLS boards ask for a “virtually staged” or “digitally altered” label with the original uploaded right after the staged photo. Every order includes a disclosure pack: labeled copies, a public page with the original photo plus a QR code, and the line to paste. It helps you comply; you remain responsible for your listing." },
      { q: "What photos work best?", a: "Straight-on or slight angle, daylight, the whole room in frame, nothing blocking the floor. Cluttered rooms get staged too, but empty rooms give the cleanest result." },
      { q: "Can I see it on my photo before paying?", a: "Yes. Upload your photo in the order form and press “See a free preview” — you get one staged version of your (first) photo, watermarked and at reduced size, in about a minute (a few per day). The paid order gives you two full-resolution versions of every photo without watermarks." },
      { q: "Can I stage several rooms, or get another style?", a: "Up to 6 rooms fit in one order at $15 per photo — each photo gets two versions in the style you pick, and each photo gets its own room type. For a second style of the same rooms, place another order." },
    ],
    ctaLabel: "Stage my photo — $15",
    ctaLabelMany: "Stage {n} photos — {total}",
    guarantee: "If the room's structure was changed or the result is unusable, one redo is included; otherwise a refund.",
    deliveryPromise: "Usually ready in about 2 minutes per photo.",
    sample: SAMPLE_VIRTUAL_STAGING_RESULT,
    guides: [
      { href: "/guides/photographing-rooms-for-virtual-staging", label: "10 tips for room photos that stage well" },
      { href: "/guides/ab-723-virtual-staging", label: "AB 723 checklist (California)" },
    ],
  },
  seo: {
    title: "Virtual staging per photo — 2 MLS-ready versions in minutes | ORVIONIS",
    description: "Upload photos of empty rooms, choose a style, and get two photorealistic virtually staged versions of each photo in about two minutes per photo. $15 per photo, up to 6 rooms per order, no subscription.",
    keywords: ["virtual staging", "virtual staging software", "virtually staged photos", "AI virtual staging", "empty room staging"],
    ogImage: "img/sample-virtual-staging-og.jpg",
  },
  disclosurePack: true,
  quantity: (i) => i.rooms.length,
  photoInputs: (i) => i.rooms.map((r, idx) => ({ fileId: r.photoFileId, label: i.rooms.length > 1 ? `Room ${idx + 1} · ${r.roomType}` : "Your photo" })),
  preview: {
    label: "See a free preview first",
    caption: "Free preview: one version, watermarked and downsized. Your order: two full-resolution versions of each photo, no watermark.",
    async run(ctx) {
      // The preview shows the first room: enough to judge the result on the visitor's own photo.
      const room = ctx.intake.rooms[0];
      const photo = await loadRoomPhoto(room.photoFileId);
      const { images } = await ctx.ai.editImage(
        { image: photo.data, mime: photo.mime, prompt: stagingPrompt({ ...ctx.intake, roomType: room.roomType }), n: 1, size: "auto", inputWidth: photo.width, inputHeight: photo.height },
        "preview",
      );
      if (!images[0]) throw new AppError("The preview could not be made right now.", 502, "preview_empty");
      return { image: images[0] };
    },
  },
  delivery: {
    emailSubject: "Your staged photos are ready",
    emailIntro: "Your staged photos are ready to download — two versions of each room. Remember to label them as virtually staged in the MLS.",
  },
  async run(ctx) {
    const i = ctx.intake;
    const multi = i.rooms.length > 1;
    const publicToken = await ensurePublicToken(ctx.orderId);
    const notes: string[] = [];
    const outputs: PipelineResult["outputs"] = [];
    const details: Array<{ room: number; roomType: string; sourceFileId: string; prompt: string; versions: number }> = [];

    for (const [ri, room] of i.rooms.entries()) {
      const n = ri + 1;
      const where = multi ? `room ${n} (${room.roomType})` : `the ${room.roomType}`;
      ctx.step("load_photo", `Loading the photo of ${where}`);
      const photo = await loadRoomPhoto(room.photoFileId);
      const prompt = stagingPrompt({ roomType: room.roomType, style: i.style, notes: i.notes });
      ctx.step("ai_stage", `Staging ${where} in ${i.style} style (${VIRTUAL_STAGING_VARIATIONS} versions, input ${photo.width ?? "?"}×${photo.height ?? "?"})`);
      const { images, costMicros } = await editWithRateLimitPatience(ctx, { image: photo.data, mime: photo.mime, prompt, n: VIRTUAL_STAGING_VARIATIONS, size: "auto", inputWidth: photo.width, inputHeight: photo.height });

      ctx.step("qa", `Checking ${images.length} images of ${where}; AI cost ${costMicros} µ$`);
      const label = multi ? `Room ${n}: ` : "";
      if (images.length < VIRTUAL_STAGING_VARIATIONS) notes.push(`${label}only ${images.length} of ${VIRTUAL_STAGING_VARIATIONS} versions were produced`);
      for (const [idx, img] of images.entries()) if (img.length < 20_000) notes.push(`${label}version ${idx + 1} looks broken (${img.length} bytes)`);

      ctx.step("encode", `Encoding delivery JPEGs and labeled copies ("${LABEL_TEXT}") of ${where}`);
      const encoded = await Promise.all(images.map((img) => encodeForDelivery(img)));
      const labeled = await Promise.all(encoded.map(async (img) => (img.ext === "jpg" ? labelStagedPhoto(img.data).catch(() => null) : null)));

      const base = multi ? `room${n}-${room.roomType.replace(/\s+/g, "-")}-${i.style}` : `staged-${room.roomType.replace(/\s+/g, "-")}-${i.style}`;
      const title = (v: number) => (multi ? `Room ${n} · ${room.roomType} — version ${v}` : `Staged version ${v} — ${i.style} ${room.roomType}`);
      encoded.forEach((img, idx) =>
        outputs.push({ type: "IMAGE", title: title(idx + 1), content: { room: n, version: idx + 1 }, file: { name: `${base}-v${idx + 1}.${img.ext}`, mime: img.mime, data: img.data } }),
      );
      labeled.forEach((data, idx) => {
        if (data) {
          outputs.push({
            type: "IMAGE",
            title: `${title(idx + 1)} — labeled “${LABEL_TEXT}”`,
            content: { variant: LABELED_VARIANT, room: n, version: idx + 1 },
            file: { name: `${base}-v${idx + 1}-labeled.jpg`, mime: "image/jpeg", data },
          });
        }
      });
      details.push({ room: n, roomType: room.roomType, sourceFileId: room.photoFileId, prompt, versions: images.length });
    }

    outputs.push({
      type: "JSON",
      title: "Staging details",
      content: {
        style: i.style,
        notes: i.notes,
        rooms: details,
        // single-room fields kept for older readers
        roomType: i.rooms[0].roomType,
        sourceFileId: i.rooms[0].photoFileId,
        prompt: details[0]?.prompt,
        versions: VIRTUAL_STAGING_VARIATIONS,
        disclosure: { originalPhotoUrl: originalPhotoUrl(publicToken), text: disclosureLine(publicToken) },
      },
    });
    return { needsHuman: notes.length > 0, qc: { passed: notes.length === 0, notes }, outputs };
  },
};
