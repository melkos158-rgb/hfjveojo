import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { STAGING_PRICE_LINE } from "@/config/staging-pricing";

const SLUG = "stellar-mls-virtual-staging";
const TITLE = "Virtual staging on Stellar MLS: the rules and a checklist (2026)";
const DESCRIPTION =
  "Stellar MLS allows virtual staging if you disclose it in the photo description, the checkbox and the remarks. No words on photos, no exteriors, no pre-construction.";
const RULE_URL = "https://rules.stellarmls.com/hc/en-us/articles/14692987795095-Article-04-04-Virtually-Staged-Photos";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `/guides/${SLUG}` },
  openGraph: { type: "article", title: `${TITLE} | ${site.name}`, description: DESCRIPTION, url: `${site.url}/guides/${SLUG}`, images: [{ url: "/img/sample-virtual-staging-og.jpg", width: 540, height: 630 }] },
};

const FAQ = [
  {
    q: "Is virtual staging allowed on Stellar MLS?",
    a: "Yes. Stellar MLS allows it under Article 4.4 of its rules, as long as you disclose it in the photo description, tick the virtually staged field and start the public remarks with “One or more photo(s) was virtually staged.”",
  },
  {
    q: "Can I put “Virtually staged” on the photo itself?",
    a: "Not on Stellar MLS. Its rules prohibit words (and people) on any property photograph and allow no branding, so the disclosure goes in the photo description field, the virtually staged checkbox and the remarks. Labeled copies are for your ads, social posts and flyers.",
  },
  {
    q: "Can I virtually stage a new-construction listing?",
    a: "Not while it is pre-construction or under construction: the rule says virtual staging shall not be used for those properties. A finished home can be staged like any other listing.",
  },
  {
    q: "Can I stage the patio, pool deck or yard?",
    a: "Only with unattached furniture or décor. Exterior photos may not otherwise be virtually staged, and permanent fixtures, landscaping and views can't be added, removed or changed.",
  },
  {
    q: "What happens if a staged photo breaks the rules?",
    a: "Stellar MLS removes the virtually staged photos, and the violation carries an automatic fine from its fine schedule (Level I).",
  },
];

/**
 * Stellar MLS (Central Florida: Tampa Bay, Orlando, Sarasota and around) rules for virtually staged photos, from its
 * Article 4.4 and photo rules page (linked as sources). Florida is a market of the owner's outreach (court session 2);
 * the page links into Virtual Staging, whose unlabeled versions are what Stellar's no-words rule needs.
 */
export default function StellarMlsGuidePage() {
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    image: `${site.url}/img/sample-virtual-staging-og.jpg`,
    datePublished: "2026-10-08",
    dateModified: "2026-10-08",
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/brand/orvionis-logo-512.png` } },
    mainEntityOfPage: `${site.url}/guides/${SLUG}`,
  };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <p className="eyebrow">Guide · Florida · updated October 2026</p>
      <h1 className="mt-3">Virtual staging on Stellar MLS: the rules for Central Florida listings</h1>
      <p>
        Stellar MLS, the MLS for much of Central Florida, allows virtual staging. Its rule for it, <strong>Article 4.4 &ldquo;Virtually Staged Photos&rdquo;</strong>, is short but strict: three
        things to disclose, a list of things you may not change, and an automatic fine when a photo breaks it. Here is all of it in plain English, plus a checklist for every listing.
      </p>

      <h2>Disclose it in three places</h2>
      <p>All three are required for a listing with one or more virtually staged photos:</p>
      <ol>
        <li>
          <strong>Photo description:</strong> add the words &ldquo;Virtually staged&rdquo; to each staged photo&apos;s description.
        </li>
        <li>
          <strong>The virtually staged field:</strong> check it.
        </li>
        <li>
          <strong>Public remarks:</strong> the first words must read <strong>&ldquo;One or more photo(s) was virtually staged.&rdquo;</strong>
        </li>
      </ol>
      <p>
        What you can&apos;t do is put the disclosure on the image: Stellar prohibits words and people on any property photograph and allows no branding. Upload the clean staged photo and
        let the description, the checkbox and the remarks carry the disclosure.
      </p>

      <h2>What you may change</h2>
      <ul>
        <li>
          <strong>Add things that don&apos;t convey</strong> with the home: Stellar&apos;s own examples are furniture, mirrors, artwork and plants placed into a photo of a room.
        </li>
        <li>
          <strong>Replace the furniture</strong> in a photo with digital furniture or décor.
        </li>
        <li>
          <strong>Twilight photos</strong> are acceptable as long as lighting isn&apos;t added where it doesn&apos;t exist and the sunset or sunrise is true to where the sun actually sets or
          rises. Brightening an underexposed photo is fine too.
        </li>
      </ul>

      <h2>What you may not</h2>
      <ul>
        <li>
          <strong>Pre-construction and under-construction listings:</strong> no virtual staging at all.
        </li>
        <li>
          <strong>Exteriors:</strong> no virtual staging except unattached furniture or décor (patio chairs, yes; a new hedge, no).
        </li>
        <li>
          <strong>Permanent fixtures</strong>, inside or out: none attached, removed, altered or added. Stellar&apos;s photo rules add: don&apos;t change paint colors.
        </li>
        <li>
          <strong>Things the owner doesn&apos;t control:</strong> no edited-in gulf or ocean views, lighting or landmarks.
        </li>
        <li>
          <strong>Negative conditions stay:</strong> don&apos;t edit out holes in the wall, exposed wiring, damaged flooring and the like.
        </li>
        <li>
          <strong>True dimensions:</strong> no small furniture to make a room look bigger than it is.
        </li>
        <li>
          <strong>No branding, people or words</strong> on the photos.
        </li>
      </ul>
      <p>
        Break the rule and the virtually staged photos are removed, with an automatic fine from Stellar&apos;s fine schedule (Level I). The overall test is in the rule itself: photos must
        be a true and accurate picture of the property&apos;s features and surroundings.
      </p>

      <h2>The checklist</h2>
      <ol>
        <li>
          <strong>Not pre-construction or under construction?</strong> Then you can stage.
        </li>
        <li>
          <strong>Stage the inside only</strong> (outside: unattached furniture or décor at most).
        </li>
        <li>
          <strong>Compare each staged photo with the original:</strong> same walls, paint, floors, windows, fixtures and view; any damage still visible; furniture to scale.
        </li>
        <li>
          <strong>Upload the clean version</strong>, without a label, logo or people on it.
        </li>
        <li>
          Type <strong>&ldquo;Virtually staged&rdquo;</strong> in each staged photo&apos;s description.
        </li>
        <li>
          <strong>Check the virtually staged field.</strong>
        </li>
        <li>
          Start the public remarks with <strong>&ldquo;One or more photo(s) was virtually staged.&rdquo;</strong>
        </li>
      </ol>

      <h2>How ORVIONIS fits these rules</h2>
      <p>
        <Link href="/tools/virtual-staging">Virtual Staging</Link> adds furniture and décor to your own room photo and is instructed to keep the walls, floors, windows and fixtures as
        photographed. You get two versions of each room as clean, unbranded JPGs, which is what Stellar wants uploaded, plus copies labeled &ldquo;Virtually staged&rdquo; for ads,
        social posts and flyers outside the MLS, and a public page with the original photo. If a version changed something it shouldn&apos;t have, don&apos;t upload it: one redo is included.
      </p>
      <p>
        Pricing: {STAGING_PRICE_LINE}. Your first photo is free, so you can try it on a real listing first.
      </p>
      <p>
        <Link href="/tools/virtual-staging#order" className="btn-primary no-underline">
          Stage your first photo free
        </Link>
      </p>
      <p>
        Listing in California too? <Link href="/guides/ab-723-virtual-staging">AB 723</Link> works differently there: the label goes on or next to the image, and buyers need access to
        the original.
      </p>

      <h2>Questions</h2>
      {FAQ.map((f) => (
        <div key={f.q}>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}

      <h2>Sources</h2>
      <ul>
        <li>
          <a href={RULE_URL} target="_blank" rel="noopener noreferrer">
            Stellar MLS Rules — Article 4.4, Virtually Staged Photos
          </a>
        </li>
        <li>
          <a href="https://www.stellarmls.com/photorules" target="_blank" rel="noopener noreferrer">
            Stellar MLS — Photo Rules and Tips
          </a>
        </li>
      </ul>
      <p className="text-sm text-gray-500">General information, not legal advice. Checked against Stellar MLS&apos;s published rules on October 8, 2026; rules change, so check the current version and your broker&apos;s policy.</p>
    </div>
  );
}
