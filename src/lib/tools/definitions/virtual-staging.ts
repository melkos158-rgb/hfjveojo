import { z } from "zod";
import type { ToolDefinition } from "@/lib/tools/types";
import { getFileBuffer } from "@/lib/storage";
import { AppError } from "@/lib/errors";
import { SAMPLE_VIRTUAL_STAGING_RESULT } from "@/lib/tools/samples/virtual-staging";

/**
 * Virtual Staging — one photo of an empty (or dated) room → two photorealistic staged versions of the
 * same photo, ready for the MLS. The customer pays first; the image model edits the photo without
 * touching walls, floors, windows or fixtures. Output is 2 JPEGs (PNG fallback) + a JSON note with the style used.
 */

const ROOM_TYPES = ["living room", "bedroom", "dining room", "home office", "kitchen", "patio or outdoor"] as const;
const STYLES = ["modern", "scandinavian", "farmhouse", "mid-century", "luxury", "coastal"] as const;

const intakeSchema = z.object({
  photoFileId: z.string().trim().min(1, "Upload the room photo").max(64),
  roomType: z.enum(ROOM_TYPES).default("living room"),
  style: z.enum(STYLES).default("modern"),
  notes: z.string().trim().max(300).optional().default(""),
});

export type VirtualStagingIntake = z.infer<typeof intakeSchema>;

export const VIRTUAL_STAGING_VARIATIONS = 2;

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

export function stagingPrompt(i: Pick<VirtualStagingIntake, "roomType" | "style" | "notes">): string {
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

export const virtualStagingTool: ToolDefinition<VirtualStagingIntake> = {
  id: "virtual-staging",
  slug: "virtual-staging",
  name: "Virtual Staging",
  category: "real-estate",
  tagline: "One room photo in, two staged MLS-ready versions of it out, in about two minutes",
  description:
    "Upload one photo of an empty (or nearly empty) room, choose the room type and one of six styles, and receive two photorealistic virtually staged versions of that exact photo — walls, floors, windows and perspective untouched — as MLS-ready JPG files in about two minutes.",
  initialStatus: "LIVE",
  version: 1,
  fulfillment: "AUTO",
  featured: true,
  io: {
    input: "One photo of the empty room (JPG/PNG/WebP, up to 8 MB)",
    output: "2 photorealistic staged versions of the same photo (JPG, MLS-ready)",
    processingTime: "About 2 minutes",
    ctaLabel: "Stage my photo",
  },
  intake: {
    schema: intakeSchema,
    fields: [
      { key: "photoFileId", label: "Room photo", type: "image", required: true, help: "Straight-on, well lit, empty or nearly empty. Landscape works best." },
      {
        key: "roomType",
        label: "Room",
        type: "select",
        required: true,
        options: ROOM_TYPES.map((r) => ({ value: r, label: r[0].toUpperCase() + r.slice(1) })),
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
    name: "Virtual Staging — 1 photo, 2 versions",
    priceCents: 1500,
    currency: "usd",
    compareAtText: "Staging companies charge $25–75 per photo with a 24–48 h turnaround",
  },
  sla: { deliveryHours: 1 },
  landing: {
    headline: "Empty room in, staged listing photo out.",
    subheadline: "Upload one photo of the empty room, pick a style, and get two photorealistic staged versions of that exact photo — same walls, same windows, same light — in about two minutes.",
    bullets: [
      "2 staged versions of your photo, 1024 px or larger, JPG ready for the MLS",
      "The architecture stays untouched: walls, floors, windows, fixtures, perspective",
      "6 styles: modern, scandinavian, farmhouse, mid-century, luxury, coastal",
      "Before/after side by side on your order page, downloads kept 90 days",
    ],
    howItWorks: [
      { title: "1. Upload the photo", text: "One well-lit photo of the empty room, up to 8 MB. Pick the room type and a style." },
      { title: "2. Pay $15", text: "Secure checkout via Stripe. Staging starts immediately." },
      { title: "3. Download both versions", text: "About two minutes later: two staged variations on your order page and by email." },
    ],
    faq: [
      { q: "Does it change the room itself?", a: "No. Furniture, rugs, lighting and decor are added; walls, floors, windows, doors and the camera angle are kept as photographed. If something structural did change, reply to the delivery email and we redo it." },
      { q: "Do I have to disclose virtual staging?", a: "Most MLS boards and many state rules require photos to be labelled as virtually staged. Add “virtually staged” to the photo caption or listing remarks — it is your responsibility as the listing agent." },
      { q: "What photos work best?", a: "Straight-on or slight angle, daylight, the whole room in frame, nothing blocking the floor. Cluttered rooms get staged too, but empty rooms give the cleanest result." },
      { q: "Can I get more styles or more rooms?", a: "Each order is one photo. Order again for another room or another style — same price." },
    ],
    ctaLabel: "Stage my photo — $15",
    guarantee: "If the room's structure was changed or the result is unusable, one redo is included; otherwise a refund.",
    deliveryPromise: "Usually ready in about 2 minutes.",
    sample: SAMPLE_VIRTUAL_STAGING_RESULT,
  },
  seo: {
    title: "Virtual staging from one photo — 2 MLS-ready versions in minutes | ORVIONIS",
    description: "Upload a photo of the empty room, choose a style, and get two photorealistic virtually staged versions of the same photo in about two minutes. $15 per photo, no subscription.",
    keywords: ["virtual staging", "virtual staging software", "virtually staged photos", "AI virtual staging", "empty room staging"],
    ogImage: "img/sample-virtual-staging-og.jpg",
  },
  delivery: {
    emailSubject: "Your staged photos are ready",
    emailIntro: "Two staged versions of your room are ready to download. Remember to label them as virtually staged in the MLS.",
  },
  async run(ctx) {
    const i = ctx.intake;
    ctx.step("load_photo", "Loading the uploaded room photo");
    const file = await getFileBuffer(i.photoFileId);
    if (!file) throw new AppError("The uploaded photo could not be found (it may have expired). Please order again with a fresh upload.", 400, "photo_missing");
    const mime = file.file.mime;
    if (!/^image\/(png|jpeg|webp)$/.test(mime)) throw new AppError("The uploaded file is not a PNG, JPEG or WebP image.", 400, "photo_type");

    const photo = await prepareInputPhoto(file.data, mime);
    ctx.step("ai_stage", `Staging a ${i.roomType} in ${i.style} style (${VIRTUAL_STAGING_VARIATIONS} versions, input ${photo.width ?? "?"}×${photo.height ?? "?"})`);
    const prompt = stagingPrompt(i);
    const { images, costMicros } = await ctx.ai.editImage(
      { image: photo.data, mime: photo.mime, prompt, n: VIRTUAL_STAGING_VARIATIONS, size: "auto", inputWidth: photo.width, inputHeight: photo.height },
      "stage",
    );

    ctx.step("qa", `Checking ${images.length} images; AI cost ${costMicros} µ$`);
    const notes: string[] = [];
    if (images.length < VIRTUAL_STAGING_VARIATIONS) notes.push(`Only ${images.length} of ${VIRTUAL_STAGING_VARIATIONS} versions were produced`);
    for (const [idx, img] of images.entries()) if (img.length < 20_000) notes.push(`Version ${idx + 1} looks broken (${img.length} bytes)`);

    ctx.step("encode", "Encoding delivery JPEGs");
    const encoded = await Promise.all(images.map((img) => encodeForDelivery(img)));

    return {
      needsHuman: notes.length > 0,
      qc: { passed: notes.length === 0, notes },
      outputs: [
        ...encoded.map((img, idx) => ({
          type: "IMAGE" as const,
          title: `Staged version ${idx + 1} — ${i.style} ${i.roomType}`,
          file: { name: `staged-${i.roomType.replace(/\s+/g, "-")}-${i.style}-v${idx + 1}.${img.ext}`, mime: img.mime, data: img.data },
        })),
        { type: "JSON" as const, title: "Staging details", content: { roomType: i.roomType, style: i.style, notes: i.notes, prompt, sourceFileId: i.photoFileId, versions: images.length, format: encoded[0]?.ext ?? "png" } },
      ],
    };
  },
};
