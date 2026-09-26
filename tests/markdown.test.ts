import { describe, expect, it } from "vitest";
import { markdownSections, parseInline, parseMarkdown } from "@/lib/markdown";

describe("deliverable markdown", () => {
  const md = `# Inviting Boise Home

## MLS description (496/1000 characters)
Welcome to 312 Maple Court. **Open house** Saturday.

## Social captions
**instagram**
Renovated kitchen, covered deck.

- one
- two

1. first
2. second

## Hashtags
#Boise #JustListed`;

  it("splits sections at level-2 headings with copyable plain text", () => {
    const s = markdownSections(md);
    expect(s.map((x) => x.title)).toEqual([null, "MLS description (496/1000 characters)", "Social captions", "Hashtags"]);
    expect(s[1].plain).toBe("Welcome to 312 Maple Court. Open house Saturday.");
    expect(s[2].blocks[0]).toEqual({ kind: "heading", level: 3, text: "instagram" }); // lone **label** line
    expect(s[2].plain).toContain("• one\n• two");
    expect(s[2].plain).toContain("1. first\n2. second");
    expect(s[3].plain).toBe("#Boise #JustListed");
  });

  it("parses inline bold/italic and never interprets HTML", () => {
    expect(parseInline("a **b** _c_")).toEqual([
      { t: "text", v: "a " },
      { t: "bold", v: "b" },
      { t: "text", v: " " },
      { t: "em", v: "c" },
    ]);
    const blocks = parseMarkdown("<script>alert(1)</script>");
    expect(blocks).toEqual([{ kind: "paragraph", inlines: [{ t: "text", v: "<script>alert(1)</script>" }] }]);
  });
});
