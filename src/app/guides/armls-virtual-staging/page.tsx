import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { STAGING_PRICE_LINE } from "@/config/staging-pricing";

const SLUG = "armls-virtual-staging";
const TITLE = "ARMLS Rule 8.23: virtual staging and the Digitally Altered watermark";
const DESCRIPTION =
  "ARMLS Rule 8.23 allows virtual staging if each staged photo has the Flexmls Digitally Altered watermark and the original next to it. $200 fines from December.";
const RULE_URL = "https://armls.com/digitally-altered-media";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `/guides/${SLUG}` },
  openGraph: { type: "article", title: `${TITLE} | ${site.name}`, description: DESCRIPTION, url: `${site.url}/guides/${SLUG}`, images: [{ url: "/img/sample-virtual-staging-og.jpg", width: 540, height: 630 }] },
};

const FAQ = [
  {
    q: "Is virtual staging allowed on ARMLS?",
    a: "Yes. Under Rule 8.23, in effect since May 28, 2026, a virtually staged photo counts as digitally altered: it needs the Flexmls Digitally Altered watermark, and the original, unaltered photo has to be uploaded directly before or after it.",
  },
  {
    q: "Can I use the “Virtually staged” label from my editor or staging company?",
    a: "Not on photos in Flexmls. The rule asks for the Digitally Altered watermark added within Flexmls; ARMLS allows one watermark per photo, only the ones it provides, and no other company's watermark. Upload the clean staged photo and add the watermark in Flexmls.",
  },
  {
    q: "Do I have to upload the original photo too?",
    a: "Yes. ARMLS says subscribers must upload the original, unaltered photo directly before or after the watermarked, altered version, so keep the original of every room you stage.",
  },
  {
    q: "When do the fines start?",
    a: "ARMLS has enforced the rule since June 2026 with fines abated (its education phase runs to November 2026). From December 2026 a missing disclosure is a $200 fine per violation, under the Penalty Violation category of its penalty policy.",
  },
  {
    q: "Does brightening a photo count as digitally altered?",
    a: "No. Brightness, contrast, color, cropping and sharpening don't change what is in the picture, so they need no watermark. Adding, removing or significantly changing content does: virtual staging, decluttering, removing valuables, adding a fire to a fireplace. A changed sky color needs none, ARMLS says, but submit the photo for review if you're unsure.",
  },
];

/**
 * ARMLS (Phoenix area) Rule 8.23, digitally altered media, from ARMLS's own pages (linked as sources): in effect since
 * 2026-05-28, education phase to November 2026, $200 fines from December 2026. Arizona joins the owner's outreach on
 * 20 Oct (court session 2); the page links into Virtual Staging, whose clean versions are what Flexmls watermarks.
 */
export default function ArmlsGuidePage() {
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    image: `${site.url}/img/sample-virtual-staging-og.jpg`,
    datePublished: "2026-10-09",
    dateModified: "2026-10-09",
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/brand/orvionis-logo-512.png` } },
    mainEntityOfPage: `${site.url}/guides/${SLUG}`,
  };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <p className="eyebrow">Guide · Arizona · updated October 2026</p>
      <h1 className="mt-3">Virtual staging on ARMLS: the Digitally Altered watermark rule</h1>
      <p>
        ARMLS, the MLS for the Phoenix area, changed how altered listing photos are disclosed. Since May 28, 2026, <strong>Rule 8.23</strong> treats a virtually staged photo as
        digitally altered media: staging is still allowed, but each staged photo needs the Flexmls &ldquo;Digitally Altered&rdquo; watermark and the original photo next to it. The
        education phase runs to November; from December 2026, a missing disclosure is a $200 fine. Here is the rule in plain English, plus a checklist for every listing.
      </p>

      <h2>What counts as digitally altered</h2>
      <p>
        ARMLS&apos;s definition: a photo is digitally altered &ldquo;when software or AI is used to add, remove, or significantly change image content.&rdquo;
      </p>
      <ul>
        <li>
          <strong>Needs the watermark:</strong> virtual staging, decluttering, removing valuable items, adding a fire to a fireplace.
        </li>
        <li>
          <strong>Doesn&apos;t:</strong> brightness, contrast, color, cropping and sharpening, which don&apos;t change what is in the picture.
        </li>
        <li>
          <strong>Edge cases from ARMLS&apos;s FAQ:</strong> a changed sky color needs no watermark (submit the photo for review if unsure); a blurred yard sign needs none either, as
          long as you follow ARMLS&apos;s blurring guideline.
        </li>
      </ul>

      <h2>Each staged photo needs two things</h2>
      <ol>
        <li>
          <strong>The Flexmls Digitally Altered watermark.</strong> ARMLS requires it on every digitally altered photo in Flexmls, and you add it within Flexmls itself; its post{" "}
          <a href="https://armls.com/how-to-add-a-digitally-altered-watermark" target="_blank" rel="noopener noreferrer">
            How to add a Digitally Altered watermark
          </a>{" "}
          has the steps. Only one watermark goes on a photo, and only ARMLS&apos;s: other companies&apos; watermarks are prohibited, and so is other text on the image.
        </li>
        <li>
          <strong>The original, directly before or after it.</strong> ARMLS: subscribers must upload the original, unaltered photo directly before or after the watermarked, altered
          version.
        </li>
      </ol>
      <p>
        You can also write a note such as &ldquo;Virtually staged&rdquo; in the Flexmls media description field, which is where ARMLS wants disclosures and extra details instead of on
        the image. The note adds to the watermark; it doesn&apos;t replace it. For stills inside videos or virtual tours, ARMLS has an approved watermark file to use instead.
      </p>

      <h2>What you may and may not change</h2>
      <p>ARMLS&apos;s own examples of virtual staging:</p>
      <ul>
        <li>
          <strong>Yes:</strong> furniture in a room, an accent paint color, patio furniture in the backyard, clearing clutter such as trash cans at the end of the driveway (all of it
          with the watermark, since content was added or removed).
        </li>
        <li>
          <strong>No:</strong> architectural features the home doesn&apos;t have, such as a fireplace, a swimming pool or a garage. Removing a tree is deceptive and not allowed.
        </li>
      </ul>
      <p>
        Arizona&apos;s advertising rule for licensees (R4-28-502) applies on top of the MLS rule: advertising must contain accurate claims, and a salesperson or broker must not create
        &ldquo;misleading or ambiguous impressions.&rdquo; It covers online advertising, AI included, and the designated broker answers for all of it. So defects stay visible, and
        furniture stays true to the room&apos;s size.
      </p>

      <h2>Timeline and fines</h2>
      <ul>
        <li>
          <strong>May 28, 2026:</strong> the updated rule took effect.
        </li>
        <li>
          <strong>June to November 2026:</strong> education phase. ARMLS enforces the rule, but fines are abated.
        </li>
        <li>
          <strong>From December 2026:</strong> $200 per violation, in the Penalty Violation category of the ARMLS penalty policy.
        </li>
      </ul>

      <h2>The checklist</h2>
      <ol>
        <li>
          <strong>Stage furniture and décor only:</strong> nothing the home doesn&apos;t have.
        </li>
        <li>
          <strong>Compare each staged photo with the original:</strong> same walls, floors, windows, fixtures and views; any damage still visible; furniture to scale.
        </li>
        <li>
          <strong>Upload the clean staged version</strong>, with no label, logo or text on it.
        </li>
        <li>
          <strong>Add the Flexmls Digitally Altered watermark</strong> to it, the only watermark on that photo.
        </li>
        <li>
          <strong>Upload the original</strong> directly before or after it.
        </li>
        <li>
          Optional: write <strong>&ldquo;Virtually staged&rdquo;</strong> in the media description.
        </li>
        <li>
          <strong>Off the MLS too</strong>, say the photo is virtually staged wherever you use it: in ads, on social media and on flyers.
        </li>
      </ol>

      <h2>How ORVIONIS fits these rules</h2>
      <p>
        <Link href="/tools/virtual-staging">Virtual Staging</Link> adds furniture and décor to your own room photo and is instructed to keep the walls, floors, windows and fixtures as
        photographed. You get two versions of each room as clean, unbranded JPGs: upload one to Flexmls, add its Digitally Altered watermark, and put your original directly before
        or after it. The copies labeled &ldquo;Virtually staged&rdquo; are for ads, social posts and flyers outside the MLS; don&apos;t upload them to ARMLS, where the only watermark
        allowed is its own. If a version changed something it shouldn&apos;t have, don&apos;t upload it: one redo is included.
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
        Listing elsewhere? <Link href="/guides/stellar-mls-virtual-staging">Stellar MLS in Florida</Link> wants no words or watermark on the photo at all, only a description,
        a checkbox and a line in the remarks, and in California <Link href="/guides/ab-723-virtual-staging">AB 723</Link> puts the label on or next to the image and requires access to
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
            ARMLS — Digitally Altered Media (Rule 8.23)
          </a>
        </li>
        <li>
          <a href="https://armls.com/watermarks" target="_blank" rel="noopener noreferrer">
            ARMLS — Watermarks
          </a>
        </li>
        <li>
          <a href="https://armls.com/virtually-staged-photos" target="_blank" rel="noopener noreferrer">
            ARMLS — Virtually Staged Photos
          </a>
        </li>
        <li>
          <a href="https://apps.azsos.gov/public_services/Title_04/4-28.pdf" target="_blank" rel="noopener noreferrer">
            Arizona Administrative Code, Title 4, Chapter 28 — R4-28-502, Advertising by a Licensee
          </a>
        </li>
      </ul>
      <p className="text-sm text-gray-500">General information, not legal advice. Checked against ARMLS&apos;s published pages on October 9, 2026; rules change, so check the current version and your broker&apos;s policy.</p>
    </div>
  );
}
