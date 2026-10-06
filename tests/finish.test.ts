import { beforeAll, describe, expect, it, vi } from "vitest";

const { sessions } = vi.hoisted(() => ({ sessions: [] as Array<{ line_items: Array<{ quantity: number; price_data: { unit_amount: number; product_data: { name: string } } }> }> }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async () => ({ id: null })) }));
vi.mock("@/lib/stripe/client", () => {
  const fake = {
    checkout: {
      sessions: {
        create: vi.fn(async (params: { metadata: { orderId: string }; line_items: Array<{ quantity: number; price_data: { unit_amount: number; product_data: { name: string } } }> }) => {
          sessions.push(params);
          return { id: `cs_test_${params.metadata.orderId}`, url: `https://checkout.stripe.com/c/pay/cs_test_${params.metadata.orderId}` };
        }),
      },
    },
  };
  return { stripe: () => fake };
});

import { prisma } from "@/lib/db";
import { createOrderWithCheckout } from "@/lib/orders/create";
import { checkFinish, finishUrl } from "@/lib/orders/finish";
import { signPayload } from "@/lib/security/tokens";
import { materializeTestIntake } from "@/lib/tools/samples/materialize";
import { resetDatabase } from "./helpers";

const PHOTO = "@file:img/sample-staging-before.jpg";
const DAY = 24 * 3600 * 1000;
let seq = 0;

async function freePhoto(over: { deliveredAgoDays?: number; free?: boolean; status?: "COMPLETED" | "PROCESSING" } = {}) {
  const product = await prisma.product.findFirstOrThrow({ where: { toolId: "virtual-staging" } });
  const free = over.free ?? true;
  return prisma.order.create({
    data: {
      customerEmail: "finisher@example.com",
      toolId: "virtual-staging",
      productId: product.id,
      status: over.status ?? "COMPLETED",
      free,
      freeKey: free ? `finisher${seq}@example.com` : null,
      paidAt: new Date(),
      deliveredAt: over.status === "PROCESSING" ? null : new Date(Date.now() - (over.deliveredAgoDays ?? 0) * DAY),
      intake: { rooms: [{ photoFileId: "f", roomType: "living room" }], style: "coastal", notes: "" },
      amountCents: free ? 0 : 1500,
      quantity: 1,
      accessToken: `finish-${seq++}-${Date.now()}`,
    },
  });
}

const tokenOf = (url: string) => new URL(url).searchParams.get("finish") as string;
const roomsOf = async (n: number) =>
  (await materializeTestIntake({ rooms: Array.from({ length: n }, () => ({ photoFileId: PHOTO, roomType: "bedroom" })), style: "coastal", notes: "" })).rooms;

describe("finish this listing after a free photo ($39 for up to 4 more rooms + MLS description)", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("gives a delivered free photo a 7-day link that prices the rest of the listing", async () => {
    const free = await freePhoto();
    const url = finishUrl(free.id, free.deliveredAt);
    expect(url && new URL(url).pathname).toBe("/tools/virtual-staging");
    expect(await checkFinish(tokenOf(url!))).toEqual({ ok: true, freeOrderId: free.id, style: "coastal", email: "finisher@example.com" });

    for (const [n, total] of [
      [1, 1500],
      [3, 3900],
      [4, 3900],
      [5, 4900],
      [9, 8900],
    ] as const) {
      const { orderId } = await createOrderWithCheckout({ toolSlug: "virtual-staging", email: `fin${n}@example.com`, intakeRaw: { rooms: JSON.stringify(await roomsOf(n)), style: "coastal" }, finish: tokenOf(url!) });
      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
      expect([order.amountCents, n], `rooms ${n}`).toEqual([total, n]);
      expect(order.intake).toMatchObject({ finishOf: free.id });
      if (n >= 3) {
        expect(order.intake).toMatchObject({ extraIncluded: true });
        expect(sessions.at(-1)?.line_items[0].price_data.product_data.name).toContain("Finish this listing");
      }
    }
  });

  it("ends after 7 days, and never applies to paid orders or undelivered photos", async () => {
    const old = await freePhoto({ deliveredAgoDays: 8 });
    expect(finishUrl(old.id, old.deliveredAt)).toBeNull();
    const forged = signPayload({ o: old.id, k: "finish" }, 3600);
    expect(await checkFinish(forged)).toEqual({ ok: false });
    await expect(
      createOrderWithCheckout({ toolSlug: "virtual-staging", email: "late@example.com", intakeRaw: { rooms: JSON.stringify(await roomsOf(3)), style: "modern" }, finish: forged }),
    ).rejects.toMatchObject({ code: "finish_expired" });

    const paid = await freePhoto({ free: false });
    expect(await checkFinish(signPayload({ o: paid.id, k: "finish" }, 3600))).toEqual({ ok: false });
    const running = await freePhoto({ status: "PROCESSING" });
    expect(await checkFinish(signPayload({ o: running.id, k: "finish" }, 3600))).toEqual({ ok: false });
    expect(await checkFinish("nonsense")).toEqual({ ok: false });
  });
});
