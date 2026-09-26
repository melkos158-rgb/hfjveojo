import { describe, expect, it } from "vitest";
import { attributionFromUrl, isPaidClick, nextAttribution, parseAttributionCookie, serializeAttribution, sourceOf } from "@/lib/analytics/attribution";

const GCLID = "Cj0KCQjw2t3VBhDcARIsAB_test-click_1";
const at = new Date("2026-09-26T18:00:00.000Z");

describe("visit attribution", () => {
  it("keeps campaign parameters, the keyword and a valid Google click id; drops junk click ids", () => {
    const a = attributionFromUrl(
      new URL(`https://orvionis.com/tools/virtual-staging?utm_source=google&utm_medium=cpc&utm_campaign=vs-search-test&utm_term=virtual%20staging%20service&gclid=${GCLID}`),
      "https://www.google.com/",
      at,
    );
    expect(a).toMatchObject({ utm_source: "google", utm_medium: "cpc", utm_term: "virtual staging service", gclid: GCLID, referrer: "www.google.com", landing: "/tools/virtual-staging", clickAt: at.toISOString() });
    expect(isPaidClick(a)).toBe(true);

    const junk = attributionFromUrl(new URL("https://orvionis.com/?gclid=<script>alert(1)</script>"), null, at);
    expect(junk).toBeNull();
    expect(attributionFromUrl(new URL("https://orvionis.com/pricing"), "https://www.orvionis.com/tools", at)).toBeNull(); // own subdomain is not a referrer
  });

  it("first touch wins, but a new paid click replaces it and remembers the first source", () => {
    const first = attributionFromUrl(new URL("https://orvionis.com/?utm_source=instagram_dm"), null, at)!;
    expect(nextAttribution(null, first)).toEqual(first);
    const organic = attributionFromUrl(new URL("https://orvionis.com/"), "https://www.bing.com/", at)!;
    expect(nextAttribution(first, organic)).toBeNull();

    const click = attributionFromUrl(new URL(`https://orvionis.com/tools/virtual-staging?gclid=${GCLID}`), null, at)!;
    const next = nextAttribution(first, click)!;
    expect(next).toMatchObject({ gclid: GCLID, firstTouch: "instagram_dm" });
    expect(sourceOf(next)).toBe("google"); // auto-tagged click without utm_source still counts as Google
    expect(nextAttribution(next, click)).toBeNull(); // reloading the same click keeps the original click time
  });

  it("round-trips through the cookie and ignores garbage", () => {
    const a = attributionFromUrl(new URL(`https://orvionis.com/?utm_source=google&gclid=${GCLID}`), null, at)!;
    expect(parseAttributionCookie(serializeAttribution(a))).toEqual(a);
    expect(parseAttributionCookie("%7Bbroken")).toBeNull();
    expect(parseAttributionCookie(encodeURIComponent("[1,2]"))).toBeNull();
    expect(sourceOf({ ref: "partner" })).toBe("partner");
    expect(sourceOf(null)).toBe("direct");
  });
});
