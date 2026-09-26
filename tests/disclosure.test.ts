import { beforeAll, describe, expect, it } from "vitest";
import sharp from "sharp";
import { prisma } from "@/lib/db";
import { resetDatabase } from "./helpers";
import { disclosureLine, ensurePublicToken, labelStagedPhoto, originalPhotoUrl, qrPng } from "@/lib/tools/disclosure";
import { originalPhotoFor } from "@/lib/orders/original-photo";
import { materializeTestIntake } from "@/lib/tools/samples/materialize";
import { TEST_INTAKES } from "@/lib/tools/samples/test-intakes";

describe("disclosure pack for virtually staged photos (AB 723 / MLS)", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("labels a staged photo in the bottom-left corner without changing its size", async () => {
    const photo = await sharp({ create: { width: 1536, height: 1024, channels: 3, background: "#e8e4dc" } }).jpeg().toBuffer();
    const out = await labelStagedPhoto(photo);
    const meta = await sharp(out).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(["jpeg", 1536, 1024]);
    const corner = await sharp(await sharp(out).extract({ left: 40, top: 1024 - 90, width: 250, height: 50 }).toBuffer()).stats();
    const elsewhere = await sharp(await sharp(out).extract({ left: 1200, top: 100, width: 250, height: 50 }).toBuffer()).stats();
    expect(corner.channels[0].mean).toBeLessThan(elsewhere.channels[0].mean - 60); // the dark label is there
    expect(elsewhere.channels[0].stdev).toBeLessThan(2); // and nowhere else
  });

  it("the public page shows the original only for paid orders, by an unguessable token", async () => {
    const intake = await materializeTestIntake(TEST_INTAKES["virtual-staging"]);
    const product = await prisma.product.findFirstOrThrow({ where: { toolId: "virtual-staging" } });
    const order = await prisma.order.create({
      data: { customerEmail: "agent@example.com", toolId: "virtual-staging", productId: product.id, status: "PENDING", intake, amountCents: 1500, accessToken: `disc-${Date.now()}` },
    });
    const token = await ensurePublicToken(order.id);
    expect(await ensurePublicToken(order.id)).toBe(token); // stable
    expect(await originalPhotoFor(token)).toBeNull(); // not paid yet
    await prisma.order.update({ where: { id: order.id }, data: { status: "COMPLETED" } });
    const photoFileId = (intake.rooms as Array<{ photoFileId: string }>)[0].photoFileId;
    expect(await originalPhotoFor(token)).toEqual({ photos: [{ fileId: photoFileId, label: "Your photo" }] });
    expect(await originalPhotoFor("../../etc/passwd")).toBeNull();
    expect(await originalPhotoFor("nosuchtoken123")).toBeNull();
    expect(originalPhotoUrl(token)).toBe(`http://localhost:3000/original/${token}`);
    expect(disclosureLine(token)).toBe(`Virtually staged (digitally altered image). Original photo: http://localhost:3000/original/${token}`);
  });

  it("makes a scannable-size QR code PNG for print", async () => {
    const png = await qrPng("https://orvionis.com/original/abcdEFGH1234");
    const meta = await sharp(png).metadata();
    expect([meta.format, meta.width]).toEqual(["png", 600]);
  });
});
