import type { Metadata } from "next";
import { VerticalLanding } from "@/components/VerticalLanding";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "For real estate agents: virtual staging, listing copy and clips",
  description:
    "Virtual staging from $15 per photo, MLS-ready listing descriptions for $9 and five vertical listing clips for $49 — ordered per listing, no subscription. Plus a free fair-housing checker for your remarks.",
  alternates: { canonical: "/real-estate" },
};

export default function RealEstatePage() {
  return (
    <VerticalLanding
      category="real-estate"
      eyebrow="For real-estate agents and RE videographers"
      headline="Your listing video, cut into clips that get posted — without a video editor on payroll."
      sub="You already shoot the walkthrough. We turn it into ready-to-post vertical clips with price, beds/baths and your branding, plus captions and hashtags. Pay per listing."
      pains={[
        "The walkthrough sits on your phone for a week because editing takes an evening you don't have.",
        "Agency subscriptions start at ~$195/month whether you have one listing or ten.",
        "Generic AI clippers are built for talking-head podcasts, not property B-roll.",
        "Writing hooks and captions that don't sound like every other agent takes longer than the shoot.",
      ]}
      proofNote="Pricing context: Fiverr real-estate edits run $15–$65 per single video; real-estate editing subscriptions start around $195/month for 10 clips (public price pages, Sept 2026)."
      hero={{ src: "/img/hero-real-estate.webp", alt: "A phone on a tripod filming a bright, staged living room and kitchen for a listing walkthrough" }}
    />
  );
}
