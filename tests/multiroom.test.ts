import { beforeAll, describe, expect, it, vi } from "vitest";
import sharp from "sharp";

const { sent, sessions } = vi.hoisted(() => ({
  sent: [] as Array<{ to: string; subject: string; text: string; html?: string }>,
  sessions: [] as Array<{ line_items: Array<{ quantity: number; price_data: { unit_amount: number } }> }>,
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async (m: { to: string; subject: string; text: string; html?: string }) => {
    sent.push(m);
    return { id: null };
  }),
}));

vi.mock("@/lib/stripe/client", () => {
  const fake = {
    checkout: {
      sessions: {
        create: vi.fn(async (params: { metadata: { orderId: string }; line_items: Array<{ quantity: number; price_data: { unit_amount: number } }> }) => {
          sessions.push(params);
          return { id: `cs_test_${params.metadata.orderId}`, url: `https://checkout.stripe.com/c/pay/cs_test_${params.metadata.orderId}` };
        }),
      },
    },
    paymentIntents: { retrieve: vi.fn(async (id: string) => ({ id, latest_charge: { id: `ch_${id}`, receipt_url: "https://pay.stripe.com/receipts/x" } })) },
  };
  return { stripe: () => fake };
});

import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { createOrderWithCheckout } from "@/lib/orders/create";
import { handleStripeEvent } from "@/lib/stripe/webhooks";
import { deliveredOutputs } from "@/lib/orders/deliverables";
import { isLabeledOutput } from "@/lib/tools/disclosure";
import { originalPhotoFor } from "@/lib/orders/original-photo";
import { materializeTestIntake } from "@/lib/tools/samples/materialize";
import { AiProviderError } from "@/lib/ai/types";
import type { PipelineContext } from "@/lib/tools/types";
import { setRateLimitWaitForTests, virtualStagingTool, type VirtualStagingIntake } from "@/lib/tools/definitions/virtual-staging";
import { resetDatabase } from "./helpers";

const PHOTO = "@file:img/sample-staging-before.jpg";

function paid(orderId: string, amount: number): Stripe.Event {
  return {
    id: `evt_multi_${orderId}`,
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_${orderId}`,
        object: "checkout.session",
        payment_status: "paid",
        amount_total: amount,
        currency: "usd",
        payment_intent: `pi_${orderId}`,
        customer_email: "agent@example.com",
        customer_details: { email: "agent@example.com", name: "Agent" },
        metadata: { orderId },
        client_reference_id: orderId,
      },
    },
  } as unknown as Stripe.Event;
}

describe("multi-room virtual staging", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("charges per photo, stages every room with its own room type and delivers them grouped by room", async () => {
    const intake = await materializeTestIntake({
      rooms: [
        { photoFileId: PHOTO, roomType: "living room" },
        { photoFileId: PHOTO, roomType: "bedroom" },
        { photoFileId: PHOTO, roomType: "dining room" },
      ],
      style: "scandinavian",
      notes: "",
    });
    const rooms = intake.rooms as Array<{ photoFileId: string; roomType: string }>;
    expect(new Set(rooms.map((r) => r.photoFileId)).size).toBe(3); // three separate uploads

    // the order form sends the rooms as JSON; the price comes from the server (3 × $15), never from the browser
    const { orderId } = await createOrderWithCheckout({ toolSlug: "virtual-staging", email: "agent@example.com", intakeRaw: { ...intake, rooms: JSON.stringify(rooms), amountCents: 100 } });
    const created = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect([created.amountCents, created.quantity]).toEqual([4500, 3]);
    expect((created.intake as { rooms: unknown }).rooms).toEqual(rooms); // stored normalised
    expect(sessions.at(-1)?.line_items).toMatchObject([{ quantity: 3, price_data: { unit_amount: 1500 } }]);
    const started = await prisma.event.findFirstOrThrow({ where: { name: "checkout_started", orderId } });
    expect(started.props).toMatchObject({ quantity: 3, amountCents: 4500 });
    for (const r of rooms) expect((await prisma.file.findUniqueOrThrow({ where: { id: r.photoFileId } })).orderId).toBe(orderId);

    await handleStripeEvent(paid(orderId, 4500));
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { outputs: { include: { file: true } } } });
    expect(order.status).toBe("COMPLETED");

    const ai = await prisma.aiRequest.findMany({ where: { orderId } });
    expect(ai.map((r) => r.purpose)).toEqual(["stage", "stage", "stage"]); // one image call per room

    const shown = deliveredOutputs(order.outputs);
    const clean = shown.filter((o) => o.type === "IMAGE" && !isLabeledOutput(o));
    const labeled = shown.filter((o) => o.type === "IMAGE" && isLabeledOutput(o));
    expect(clean.map((o) => o.title)).toEqual([
      "Room 1 · living room — version 1",
      "Room 1 · living room — version 2",
      "Room 2 · bedroom — version 1",
      "Room 2 · bedroom — version 2",
      "Room 3 · dining room — version 1",
      "Room 3 · dining room — version 2",
    ]);
    expect(clean.map((o) => o.content)).toEqual([1, 1, 2, 2, 3, 3].map((room, i) => ({ room, version: (i % 2) + 1 })));
    expect(clean.map((o) => o.file?.name)).toContain("room2-bedroom-scandinavian-v1.jpg");
    expect(labeled).toHaveLength(6);
    expect(labeled.map((o) => (o.content as { room: number }).room)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(labeled.map((o) => o.file?.name)).toContain("room3-dining-room-scandinavian-v2-labeled.jpg");

    const details = shown.find((o) => o.type === "JSON")?.content as { rooms: Array<{ room: number; roomType: string; sourceFileId: string }>; style: string };
    expect(details.style).toBe("scandinavian");
    expect(details.rooms.map((r) => [r.room, r.roomType, r.sourceFileId])).toEqual(rooms.map((r, i) => [i + 1, r.roomType, r.photoFileId]));

    // one delivery email with every staged photo
    const mail = sent.filter((m) => m.to === "agent@example.com").at(-1)!;
    expect(mail.subject).toBe("Your staged photos are ready");
    for (const o of clean) expect(mail.text).toContain(`/api/files/${o.fileId}?`);

    // the public original-photo page (AB 723) shows every room's unaltered photo
    const fresh = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    const original = await originalPhotoFor(fresh.publicToken!);
    expect(original?.photos).toEqual(rooms.map((r, i) => ({ fileId: r.photoFileId, label: `Room ${i + 1} · ${r.roomType}` })));
  });

  it("waits out the image API's per-minute limit instead of failing a multi-room order", async () => {
    setRateLimitWaitForTests(5);
    const intake = await materializeTestIntake({
      rooms: [
        { photoFileId: PHOTO, roomType: "living room" },
        { photoFileId: PHOTO, roomType: "home office" },
      ],
      style: "modern",
    });
    const product = await prisma.product.findFirstOrThrow({ where: { toolId: "virtual-staging" } });
    const order = await prisma.order.create({
      data: { customerEmail: "agent@example.com", toolId: "virtual-staging", productId: product.id, status: "PROCESSING", intake, amountCents: 3000, quantity: 2, accessToken: `rl-${Date.now()}` },
    });
    const noisy = await sharp(Buffer.from(Array.from({ length: 256 * 256 * 3 }, () => Math.floor(Math.random() * 256))), { raw: { width: 256, height: 256, channels: 3 } }).png().toBuffer();

    const run = async (failures: number[]) => {
      let calls = 0;
      const steps: string[] = [];
      const ctx = {
        orderId: order.id,
        orderNumber: order.number,
        customerEmail: order.customerEmail,
        intake: virtualStagingTool.intake.schema.parse(intake) as VirtualStagingIntake,
        step: (name: string) => void steps.push(name),
        ai: {
          ctx: { purpose: "generate" },
          complete: async () => {
            throw new Error("not used");
          },
          completeStructured: async () => {
            throw new Error("not used");
          },
          editImage: async () => {
            calls++;
            if (failures.includes(calls)) throw new AiProviderError("Rate limit reached for gpt-image-2 on images per minute", { retryable: true, status: 429 });
            return { images: [noisy, noisy], costMicros: 0 };
          },
        },
      } as unknown as PipelineContext<VirtualStagingIntake>;
      const result = await virtualStagingTool.run(ctx);
      return { calls, steps, result };
    };

    // room 2 hits the limit once: wait, try again, deliver both rooms
    const ok = await run([2]);
    expect(ok.calls).toBe(3);
    expect(ok.steps.filter((s) => s === "rate_limit")).toHaveLength(1);
    expect(ok.result.outputs.filter((o) => o.type === "IMAGE" && !isLabeledOutput({ content: o.content }))).toHaveLength(4);

    // a limit that never lifts fails the run after three retries (the order is retried later, nothing is lost)
    await expect(run([1, 2, 3, 4])).rejects.toThrow(/Rate limit/);
    // other errors are not retried here
    let calls = 0;
    const ctx = {
      orderId: order.id,
      orderNumber: order.number,
      customerEmail: order.customerEmail,
      intake: virtualStagingTool.intake.schema.parse(intake) as VirtualStagingIntake,
      step: () => undefined,
      ai: {
        editImage: async () => {
          calls++;
          throw new AiProviderError("Invalid image", { retryable: false, status: 400 });
        },
      },
    } as unknown as PipelineContext<VirtualStagingIntake>;
    await expect(virtualStagingTool.run(ctx)).rejects.toThrow("Invalid image");
    expect(calls).toBe(1);
  });
});
