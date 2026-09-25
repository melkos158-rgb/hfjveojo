import type { Metadata } from "next";
import { site } from "@/config/site";
import { LegalNotice } from "@/components/LegalNotice";

export const metadata: Metadata = { title: "Terms of Service", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <h1>Terms of Service</h1>
      <p>Last updated: {site.legal.lastUpdated}</p>
      <LegalNotice />
      <h2>1. Who we are</h2>
      <p>
        {site.name} is operated by {site.legal.entityName}, {site.legal.address}, {site.legal.country} (&quot;we&quot;, &quot;us&quot;). Contact: {site.supportEmail}.
      </p>
      <h2>2. What we sell</h2>
      <p>
        We produce digital deliverables (for example, video clips, PDF documents and written copy) from the information you submit through an order form. Each tool page describes what is included, the price and the delivery time. Some deliverables are generated automatically with AI systems and checked by automated quality gates; others are produced by a person. The tool page says which.
      </p>
      <h2>3. Orders and payment</h2>
      <p>
        Prices are shown before you pay and charged once, in the currency shown, through Stripe. An order is confirmed when Stripe reports the payment as successful; the confirmation email and your order page reflect that status. We may cancel and refund an order that we cannot fulfil.
      </p>
      <h2>4. Your inputs</h2>
      <p>
        You confirm that you have the rights to the footage, images, text and other material you submit and that it does not infringe anyone&apos;s rights or applicable law. You keep ownership of your inputs and grant us the licence needed to produce and deliver your order. We do not use your inputs to train AI models.
      </p>
      <h2>5. Deliverables and licence</h2>
      <p>
        Once paid, you may use the deliverables for your own business purposes without restriction, including commercial use. We may retain copies for a limited period to handle revisions and refunds (see the Privacy Policy). Deliverables are produced from the information you give us; you are responsible for verifying facts (prices, property details, legal wording) before publishing them.
      </p>
      <h2>6. Revisions, refunds and digital content</h2>
      <p>
        Each order includes the revision round stated on the tool page. Refund conditions are set out in the Refund Policy, which forms part of these terms. Because delivery of digital content starts immediately after payment, you agree that production begins right away and acknowledge that any statutory withdrawal right for digital content may be affected once delivery has started, to the extent permitted by law.
      </p>
      <h2>7. AI-generated content</h2>
      <p>
        AI systems can make mistakes. Automated deliverables are checked by quality rules, but you must review them before use. Nothing we deliver is legal, financial, tax or professional advice.
      </p>
      <h2>8. Acceptable use</h2>
      <p>We refuse orders that are unlawful, deceptive, infringe third-party rights, or contain discriminatory content (including advertising that violates fair-housing rules).</p>
      <h2>9. Liability</h2>
      <p>
        To the extent permitted by law, our total liability for any order is limited to the amount you paid for that order. We are not liable for indirect losses. Nothing in these terms limits liability that cannot be limited by law.
      </p>
      <h2>10. Changes and governing law</h2>
      <p>
        We may update these terms; the date above shows the current version. These terms are governed by {site.legal.governingLaw}.
      </p>
    </div>
  );
}
