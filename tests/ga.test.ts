import { describe, expect, it } from "vitest";
import { gaEvent, gaInitScript, sanitizedLocation, validGaId } from "@/lib/ga";

describe("Google Analytics 4 wiring", () => {
  it("never lets an order token or other query data reach GA; campaign parameters stay", () => {
    expect(sanitizedLocation("https://orvionis.com", "/orders/cmabc123", "t=SECRET_TOKEN&utm_source=instagram_dm&exp=e4")).toBe(
      "https://orvionis.com/orders/:id?utm_source=instagram_dm&exp=e4",
    );
    expect(sanitizedLocation("https://orvionis.com", "/checkout/success", "order=cm1&t=SECRET&session_id=cs_live_1")).toBe("https://orvionis.com/checkout/success");
    expect(sanitizedLocation("https://orvionis.com", "/tools/virtual-staging", "gclid=abc")).toBe("https://orvionis.com/tools/virtual-staging?gclid=abc");
  });

  it("accepts only a real measurement id, so an env value can never inject script", () => {
    expect(validGaId("G-ABC123XYZ")).toBe("G-ABC123XYZ");
    expect(validGaId(" G-ABC123XYZ ")).toBe("G-ABC123XYZ");
    expect(validGaId("UA-12345-1")).toBeNull();
    expect(validGaId("G-abc'</script><script>alert(1)")).toBeNull();
    expect(validGaId("")).toBeNull();
    expect(validGaId(undefined)).toBeNull();
  });

  it("the snippet denies ads everywhere, denies analytics in the EEA/UK/CH by default and sends no automatic page view", () => {
    const js = gaInitScript("G-TEST1234");
    expect(js).toContain("gtag('config',\"G-TEST1234\"");
    expect(js).toContain("send_page_view:false");
    expect(js).toContain("allow_google_signals:false");
    expect(js).toContain("allow_ad_personalization_signals:false");
    const region = js.match(/analytics_storage:'denied',region:(\[[^\]]*\])/)?.[1] ?? "[]";
    expect(JSON.parse(region)).toEqual(expect.arrayContaining(["PL", "DE", "GB", "CH"]));
    expect(js).not.toMatch(/ad_storage:'granted'/);
  });

  it("is a harmless no-op on the server or when GA is not loaded", () => {
    expect(() => gaEvent("purchase", { value: 9 })).not.toThrow();
  });
});
