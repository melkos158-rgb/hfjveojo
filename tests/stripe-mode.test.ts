import { describe, expect, it } from "vitest";
import { isTestOrder, keyMode, secretKeyFor, secretKeyVarFor, stripeConfigSummary, webhookSecrets } from "@/lib/stripe/mode";

const base = { STRIPE_SECRET_KEY: "sk_test_abc", STRIPE_WEBHOOK_SECRET: "whsec_test", STRIPE_LIVE_SECRET_KEY: "", STRIPE_LIVE_WEBHOOK_SECRET: "", STRIPE_MODE: "test" as const };

describe("Stripe test and live side by side", () => {
  it("reads the mode from the key prefix only", () => {
    expect(keyMode("sk_live_123")).toBe("live");
    expect(keyMode("rk_live_123")).toBe("live");
    expect(keyMode("sk_test_123")).toBe("test");
    expect(keyMode("rk_test_123")).toBe("test");
    expect(keyMode("pk_live_123")).toBeNull(); // a publishable key is never a secret key
    expect(keyMode("")).toBeNull();
  });

  it("finds each mode's key wherever it was pasted, and never hands out a key of the other mode", () => {
    expect(secretKeyFor("test", base)).toBe("sk_test_abc");
    expect(secretKeyFor("live", base)).toBeNull();
    const both = { ...base, STRIPE_LIVE_SECRET_KEY: "sk_live_xyz", STRIPE_LIVE_WEBHOOK_SECRET: "whsec_live" };
    expect(secretKeyFor("live", both)).toBe("sk_live_xyz");
    expect(secretKeyFor("test", both)).toBe("sk_test_abc");
    expect(secretKeyVarFor("live", both)).toBe("STRIPE_LIVE_SECRET_KEY");
    const swapped = { ...base, STRIPE_SECRET_KEY: "sk_live_xyz" }; // live key pasted over the sandbox one
    expect(secretKeyFor("live", swapped)).toBe("sk_live_xyz");
    expect(secretKeyFor("test", swapped)).toBeNull();
    expect(webhookSecrets(both)).toEqual(["whsec_live", "whsec_test"]);
    expect(webhookSecrets({ ...both, STRIPE_LIVE_WEBHOOK_SECRET: "whsec_test" })).toEqual(["whsec_test"]);
  });

  it("flags every sandbox order in production as a test order, and nothing else implicitly", () => {
    expect(isTestOrder("test", false, "production")).toBe(true);
    expect(isTestOrder("live", false, "production")).toBe(false);
    expect(isTestOrder("live", true, "production")).toBe(true);
    expect(isTestOrder("test", false, "development")).toBe(false);
  });

  it("the admin summary names problems without ever containing a key", () => {
    expect(stripeConfigSummary(base).problems).toEqual([]);
    const liveNoKey = stripeConfigSummary({ ...base, STRIPE_MODE: "live" });
    expect(liveNoKey.problems.join(" ")).toContain("no live secret key");
    expect(liveNoKey.problems.join(" ")).toContain("STRIPE_LIVE_WEBHOOK_SECRET is missing");
    const keyOnly = stripeConfigSummary({ ...base, STRIPE_LIVE_SECRET_KEY: "sk_live_xyz" });
    expect(keyOnly.live.keyVar).toBe("STRIPE_LIVE_SECRET_KEY");
    expect(keyOnly.problems.join(" ")).toContain("STRIPE_LIVE_WEBHOOK_SECRET is not set yet");
    const same = stripeConfigSummary({ ...base, STRIPE_LIVE_SECRET_KEY: "sk_live_xyz", STRIPE_LIVE_WEBHOOK_SECRET: "whsec_test" });
    expect(same.problems.join(" ")).toContain("identical");
    const wrongPrefix = stripeConfigSummary({ ...base, STRIPE_LIVE_SECRET_KEY: "sk_test_oops", STRIPE_LIVE_WEBHOOK_SECRET: "whsec_live" });
    expect(wrongPrefix.problems.join(" ")).toContain("does not start with sk_live_");
    const all = JSON.stringify([liveNoKey, keyOnly, same, wrongPrefix]);
    expect(all).not.toMatch(/sk_(live|test)_[a-z]/);
    expect(all).not.toMatch(/whsec_[a-z]/);
  });
});
