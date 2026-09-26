import { beforeAll, describe, expect, it, vi } from "vitest";

const { sent } = vi.hoisted(() => ({ sent: [] as Array<{ to: string; subject: string; text: string }> }));
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async (m: { to: string; subject: string; text: string }) => {
    sent.push(m);
    return { id: null };
  }),
}));

import { prisma } from "@/lib/db";
import { createOrderWithCheckout } from "@/lib/orders/create";
import { resetDatabase, sampleListingDescriptionIntake } from "./helpers";

const alerts = () => sent.filter((m) => m.to === "admin@example.com" && m.subject.includes("Checkout is DOWN"));

async function waitFor(check: () => boolean, ms = 3000) {
  const deadline = Date.now() + ms;
  while (!check()) {
    if (Date.now() > deadline) throw new Error("timed out");
    await new Promise((r) => setTimeout(r, 20));
  }
}

describe("checkout with a mode that has no Stripe key (e.g. keys swapped in Railway mid-switch)", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("tells the customer to try again (no internals), creates no order and alerts the admins once an hour", async () => {
    const attempt = () => createOrderWithCheckout({ toolSlug: "listing-description", email: "buyer@example.com", intakeRaw: sampleListingDescriptionIntake, mode: "live" });
    const err = await attempt().catch((e: unknown) => e as { code: string; status: number; message: string });
    expect(err).toMatchObject({ code: "checkout_unavailable", status: 503 });
    expect(err.message).toContain("try again in a few minutes");
    expect(err.message).not.toMatch(/STRIPE|key|mode/i);
    expect(await prisma.order.count()).toBe(0);

    await waitFor(() => alerts().length === 1);
    expect(alerts()[0].text).toContain("STRIPE_LIVE_SECRET_KEY");

    await expect(attempt()).rejects.toMatchObject({ code: "checkout_unavailable" });
    await new Promise((r) => setTimeout(r, 200));
    expect(alerts()).toHaveLength(1); // at most one alert per hour
  });
});
