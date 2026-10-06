import type { Metadata } from "next";
import { VerticalLanding } from "@/components/VerticalLanding";
import { priceRanges } from "@/content/staging-prices";
import { CREDIT_MONTHS, CREDIT_TOOL_SLUG, CREDITS_PER_PACK } from "@/lib/orders/credit-rules";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "For real estate photographers: virtual staging at $5.96 a room",
  description:
    "Add virtual staging to your shoots: 25 rooms for $149 with Pro credits (about $5.96 a room), two versions per room, no logo on the photos, no subscription. Plus branded pricing guides for photographers.",
  alternates: { canonical: "/photographers" },
};

/**
 * Photographers (court of agents, 2026-10-06, session 2, lever 3): real-estate photographers, teams and coordinators
 * first, with Pro credits; the pricing guide for portrait and wedding photographers stays in the list below.
 */
export default function PhotographersPage() {
  const r = priceRanges();
  return (
    <VerticalLanding
      category="photography"
      eyebrow="For real-estate photographers, teams and listing coordinators"
      headline="Add virtual staging to every shoot — about $6 a room, delivered under your name."
      sub={`Upload the empty rooms from a shoot and get two staged versions of each in minutes, with no logo on them. Pro credits: ${CREDITS_PER_PACK} rooms for $149, paid once, used over ${CREDIT_MONTHS} months.`}
      pains={[
        "Agents ask for staged photos, so the rooms go to an outside editor and come back a day or two later.",
        `Staging editors charge $${r.designerOnePhoto[0]}–$${r.designerOnePhoto[1]} for one photo ($${r.designerBulk[0]}–$${r.designerBulk[1]} in bulk), which leaves little margin on a staging add-on.`,
        "A monthly AI plan bills the same whether you shot ten vacant listings this month or two.",
        "Your own price list still lives in a template that says “Your Studio Name”.",
      ]}
      proofNote={`Pricing context: staging editors quote $${r.designerOnePhoto[0]}–$${r.designerOnePhoto[1]} a photo and Virtual Staging AI $25–$139 a month billed monthly (our virtual staging cost guide, prices checked October 6, 2026). Pro credits work out to $5.96 a room.`}
      hero={{ src: "/img/hero-staging-after.webp", width: 700, height: 474, alt: "A living room staged by ORVIONIS: sofa, rug, coffee table, armchairs, a floor lamp and framed prints — no logo on the photo" }}
      primary={{ slug: CREDIT_TOOL_SLUG, cta: "Get 25 rooms — $149 →" }}
    />
  );
}
