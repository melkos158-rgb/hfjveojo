import type { Metadata } from "next";
import { VerticalLanding } from "@/components/VerticalLanding";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Photographers — branded pricing guides and client documents",
  description: "Get a branded PDF pricing guide written from your real packages in minutes. $29 one-time, no subscription, no Canva evenings.",
  alternates: { canonical: "/photographers" },
};

export default function PhotographersPage() {
  return (
    <VerticalLanding
      category="photography"
      eyebrow="For wedding, portrait, family and brand photographers"
      headline="The client documents you keep meaning to make — written and designed from your real packages."
      sub="Answer ten questions. Get a pricing guide that reads like you wrote it on a good day, in your colors, ready to send to the next enquiry."
      pains={[
        "You bought the Canva template months ago and it still says 'Your Studio Name'.",
        "Every enquiry gets a slightly different price list pasted into an email.",
        "Your CRM's document templates are locked behind a $29–$129/month plan.",
        "Writing about yourself is the one thing you can't outsource to a template.",
      ]}
      proofNote="Pricing context: Etsy pricing-guide templates sell for $10–$20 and require hours of copywriting and layout; CRM plans that bundle documents cost $29–$129/month (public price pages, Sept 2026)."
      hero={{ src: "/img/hero-photographers.webp", alt: "A printed wedding photography pricing guide open on a wooden desk next to a camera" }}
    />
  );
}
