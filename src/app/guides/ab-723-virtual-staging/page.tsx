import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";

const TITLE = "AB 723 and virtual staging: what California agents must do (2026 checklist)";
const DESCRIPTION =
  "Since January 1, 2026, California's AB 723 requires a disclosure next to virtually staged and other digitally altered listing photos, plus access to the original. What counts, what MLSs ask for, and a 7-step checklist.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/guides/ab-723-virtual-staging" },
  openGraph: { type: "article", title: `${TITLE} | ${site.name}`, description: DESCRIPTION, url: `${site.url}/guides/ab-723-virtual-staging`, images: [{ url: "/img/sample-virtual-staging-og.jpg", width: 540, height: 630 }] },
};

const FAQ = [
  { q: "Does AB 723 apply to virtual staging?", a: "Yes. The law covers images altered with photo-editing software or AI to add, remove or change elements such as furniture, fixtures, flooring, walls or landscaping — virtually staged photos are the most common case." },
  { q: "When did AB 723 take effect?", a: "January 1, 2026. It applies to advertising and promotional materials for selling real property by brokers, salespersons and people acting on their behalf." },
  { q: "Do I have to show the original photo?", a: "Buyers must be able to see it. On a website you control, show the unaltered version with the altered one (or link to it); elsewhere, give a link, URL or QR code to a publicly accessible page with the original. Most MLSs also want the original uploaded right after the staged photo." },
  { q: "Are lighting or color edits covered?", a: "No. Lighting, sharpening, white balance, color correction, angle, straightening, cropping and exposure adjustments that don't change what the property looks like are excluded." },
];

/**
 * Plain-English guide + checklist for AB 723 (virtually staged listing photos). Sources are linked at the bottom; the
 * page says clearly that it is general information, not legal advice. Links into the Virtual Staging tool, whose
 * orders ship with a disclosure pack.
 */
export default function Ab723GuidePage() {
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    datePublished: "2026-09-26",
    dateModified: "2026-09-26",
    author: { "@type": "Organization", name: site.name },
    publisher: { "@type": "Organization", name: site.name },
    mainEntityOfPage: `${site.url}/guides/ab-723-virtual-staging`,
  };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <p className="eyebrow">Guide · California · updated September 2026</p>
      <h1 className="mt-3">AB 723 and virtual staging: what California agents must do</h1>
      <p>
        Since <strong>January 1, 2026</strong>, California&apos;s AB 723 requires real estate licensees who advertise digitally altered photos — virtually staged ones included — to say so next to the image and to give buyers access to the original. Here is what that means in practice, what MLSs ask for, and a checklist you can run for every listing.
      </p>

      <h2>What counts as a digitally altered photo</h2>
      <p>
        An image changed with photo-editing software or AI to <strong>add, remove or change elements</strong>: furniture, fixtures, appliances, flooring, walls, paint color, landscaping, the facade — or things taken out, such as utility poles or neighboring buildings. Virtual staging is the textbook case.
      </p>
      <p>
        <strong>Not covered:</strong> lighting, sharpening, white balance, color correction, angle, straightening, cropping and exposure — adjustments that don&apos;t change what the property looks like.
      </p>

      <h2>What the law asks for</h2>
      <ul>
        <li>A statement that the image has been altered, <strong>reasonably conspicuous and on or next to the image</strong> — &ldquo;Virtually staged&rdquo; or &ldquo;Digitally altered&rdquo;.</li>
        <li>Access to the original: on a website you control, show the unaltered version with the altered one (or link to it); everywhere else, a <strong>link, URL or QR code</strong> to a publicly accessible page with the original.</li>
        <li>It covers advertising and promotional materials for selling property by brokers, salespersons and anyone acting for them — portals, social posts, flyers and your own site, not just the MLS.</li>
      </ul>

      <h2>How MLSs apply it</h2>
      <p>Boards turned the law into listing rules, and the details differ — two examples:</p>
      <ul>
        <li><strong>SDMLS</strong>: altered images must be clearly disclosed and paired with the unaltered original, across all MLS displays and downstream IDX, VOW and syndication feeds.</li>
        <li><strong>Bay East</strong>: label altered photos &ldquo;altered&rdquo;, &ldquo;digitally altered&rdquo; or &ldquo;AI altered&rdquo; with the Label option, upload the original and show it immediately after the altered image.</li>
      </ul>
      <p>Check your own MLS&apos;s wording before you upload; the listing agent and broker stay responsible whoever edited the photos.</p>

      <h2>The checklist</h2>
      <ol>
        <li><strong>Keep the original</strong> of every room you stage.</li>
        <li><strong>MLS:</strong> label the staged photo (&ldquo;virtually staged&rdquo; / &ldquo;digitally altered&rdquo;, as your board words it) and upload the original right after it.</li>
        <li><strong>Your website:</strong> show the original next to the staged photo, before or after it.</li>
        <li><strong>Portals, social posts, ads:</strong> put &ldquo;Virtually staged&rdquo; on or right beside the image, with a link to the original.</li>
        <li><strong>Print:</strong> flyers and brochures get a QR code that opens the original.</li>
        <li><strong>Stage, don&apos;t renovate:</strong> add movable furniture and decor; leave walls, floors, fixtures, views and the exterior as they are.</li>
        <li><strong>Keep the label on reposts</strong> — don&apos;t crop it off when a photo is reused.</li>
      </ol>

      <h2>How ORVIONIS handles it</h2>
      <p>
        Every <Link href="/tools/virtual-staging">Virtual Staging</Link> order ($15 per photo, two staged versions in about two minutes) comes with a <strong>disclosure pack</strong>: a labeled copy of each version, a public page with the unaltered original, a QR code to it for print, and the line to paste next to the photo. Walls, floors, windows and fixtures are left exactly as photographed. You can see a free, watermarked preview on your own photo before paying.
      </p>
      <p>
        <Link href="/tools/virtual-staging#order" className="btn-primary no-underline">
          Stage a photo — $15
        </Link>
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
          <a href="https://legiscan.com/CA/text/AB723/id/3272851" target="_blank" rel="noopener noreferrer">AB 723 bill text (2025–2026 session)</a>
        </li>
        <li>
          <a href="https://sdmls.com/ab-723-digitally-altered-images-sdmls-requirements/" target="_blank" rel="noopener noreferrer">SDMLS — AB 723: Digitally Altered Images requirements</a>
        </li>
        <li>
          <a href="https://bayeast.org/digitally-altered-mls-photo-rule/" target="_blank" rel="noopener noreferrer">Bay East — Digitally Altered MLS Photo Rule</a>
        </li>
        <li>
          <a href="https://pfar.org/californias-new-altered-image-law-ab-723-what-real-estate-pros-need-to-know-starting-january-1st-2026/" target="_blank" rel="noopener noreferrer">Pasadena-Foothills REALTORS® — what real estate pros need to know</a>
        </li>
      </ul>
      <p className="text-sm text-gray-500">General information, not legal advice. Rules differ by MLS and change; check with your broker or association.</p>
    </div>
  );
}
