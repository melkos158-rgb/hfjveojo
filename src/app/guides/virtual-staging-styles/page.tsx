import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";
import { STYLE_GALLERY } from "@/lib/tools/samples/virtual-staging";

const SLUG = "virtual-staging-styles";
const TITLE = "Virtual staging styles: one room in six looks";
/** Search-result title: what agents compare ("modern vs farmhouse staging"), with the proof in it. */
const SEO_TITLE = "Virtual staging styles compared on the same room";
const DESCRIPTION =
  "Modern, Scandinavian, farmhouse, mid-century, luxury or coastal? The same empty living room staged in all six, what defines each style, and which listings each one suits.";
const PUBLISHED = "2026-10-02";
const OG_IMAGE = "/img/guide-staging-styles-og.jpg";

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `/guides/${SLUG}` },
  openGraph: { type: "article", title: `${SEO_TITLE} | ${site.name}`, description: DESCRIPTION, url: `${site.url}/guides/${SLUG}`, images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
};

/** What defines each style (general interior-design usage) and where it fits (our recommendation, not a study). */
const STYLE_NOTES: Record<string, { defines: string; fits: string }> = {
  Modern: {
    defines: "Clean lines, a neutral base of white, cream and gray, black or metal accents, low and simple furniture, little ornament.",
    fits: "Condos, new construction and most mid-priced homes. The safest default when you don't know who the buyer will be.",
  },
  Scandinavian: {
    defines: "Light woods, soft whites and creams, rounded shapes, natural textures like wool, linen and jute, and plants: airy and cozy at once.",
    fits: "Small or bright rooms, apartments and starter homes. Light, low furniture keeps a small room feeling open.",
  },
  Farmhouse: {
    defines: "Warm rustic wood, comfortable rolled-arm or slipcovered seating, plaid and woven textures, vintage-style art.",
    fits: "Suburban and rural single-family homes, especially ones with traditional details: a mantel, beams, wide-plank floors.",
  },
  "Mid-century": {
    defines: "Walnut and teak tones, tapered legs, low profiles, organic shapes, bold accents in orange, mustard or olive, graphic art.",
    fits: "Homes from the 1950s and 60s, ranches, and design-minded city buyers.",
  },
  Luxury: {
    defines: "Richer materials and more layers: deeper woods, plush textiles, statement lamps and art, a restrained palette with dark accents.",
    fits: "Higher-priced listings where finishes and lifestyle are the selling point. Ours leans to warm, quiet luxury rather than gold and glam.",
  },
  Coastal: {
    defines: "Whites and sand tones with soft blues, slipcovered seating, rattan and wicker, pale woods, sea and shore art.",
    fits: "Beach and lake markets and vacation homes. Inland, it can look out of place.",
  },
};

/** E10 guide built on our own results: the six styles of ORVIONIS Virtual Staging on one stock photo of an empty room. */
export default function StylesGuide() {
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    image: `${site.url}${OG_IMAGE}`,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/brand/orvionis-logo-512.png` } },
    mainEntityOfPage: `${site.url}/guides/${SLUG}`,
  };
  const g = STYLE_GALLERY;
  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <p className="eyebrow">Guide · Virtual staging</p>
      <h1 className="mt-3">{TITLE}</h1>
      <p>
        <strong>Short answer:</strong> if you aren&apos;t sure, pick <strong>modern</strong> or <strong>Scandinavian</strong>.
        Both are neutral and light, and they suit most homes. Match <strong>farmhouse</strong>, <strong>mid-century</strong>{" "}
        and <strong>coastal</strong> to the home&apos;s age and location. Save <strong>luxury</strong> for listings where
        premium finishes are the point. That is our recommendation, not a rule. Below is the same empty living room staged
        in all six styles, so you can compare them side by side.
      </p>

      <h2>The room before staging</h2>
      <div className="not-prose overflow-hidden rounded-2xl border border-line">
        <Image src={g.before.src} alt={g.before.alt} width={g.before.width} height={g.before.height} unoptimized priority className="h-auto w-full" />
      </div>
      <p>
        A living room with a white fireplace mantel, a wall of tall windows, a ceiling fan and a dark wood floor. In every
        version below, those stay exactly as photographed. Virtual staging adds furniture, rugs, lamps, plants and art; it
        doesn&apos;t move walls or swap fixtures.
      </p>

      <h2>The six styles</h2>
      {g.styles.map((s, i) => {
        const n = STYLE_NOTES[s.label];
        return (
          <div key={s.label} className="mt-8">
            <h3>
              {i + 1}. {s.label}
            </h3>
            <div className="not-prose mt-3 overflow-hidden rounded-2xl border border-line">
              <Image src={s.image.src} alt={s.image.alt} width={s.image.width} height={s.image.height} unoptimized className="h-auto w-full" />
            </div>
            {n ? (
              <>
                <p>
                  <strong>What defines it:</strong> {n.defines}
                </p>
                <p>
                  <strong>Good fit for:</strong> {n.fits}
                </p>
              </>
            ) : null}
          </div>
        );
      })}

      <h2>How to choose a style for a listing</h2>
      <p>Our recommendation, in the order we&apos;d think about it:</p>
      <ol>
        <li>
          <strong>Start from the house.</strong> Its age and architecture narrow the choice: a 1960s ranch takes mid-century
          naturally, a new build takes modern, and a traditional home with a mantel and trim takes farmhouse or luxury,
          depending on the price.
        </li>
        <li>
          <strong>Think about the likely buyer.</strong> First-time buyers and renters-turned-owners respond to light,
          practical rooms (Scandinavian, modern); move-up and high-end buyers expect more layers (luxury).
        </li>
        <li>
          <strong>Respect the location.</strong> Coastal belongs near water. Elsewhere, choose a neutral style.
        </li>
        <li>
          <strong>Work with what stays.</strong> Floors, wall colors and the fireplace don&apos;t change. Strong wall colors
          and busy floors call for calm, neutral furniture.
        </li>
        <li>
          <strong>Use one style for the whole listing.</strong> Rooms in different styles look like a catalog, not a home.
          Start with the rooms that matter most — see{" "}
          <Link href="/guides/which-rooms-to-virtually-stage">which rooms to stage first</Link>.
        </li>
      </ol>

      <h2>Can I get more than one style of the same room?</h2>
      <p>
        Yes, as separate orders. With <Link href="/tools/virtual-staging">ORVIONIS Virtual Staging</Link> you pick one style
        for the whole order and get two staged versions of every photo, in about two minutes per photo, for $15 a photo
        ($12 each from five, $99 for ten). For a second style of the same room, place another order. Your first photo is
        free, so you can try a style on your own room before paying.
      </p>
      <p>
        <Link href="/tools/virtual-staging#order" className="btn-primary no-underline">
          Stage your first photo free
        </Link>
      </p>

      <h2>How these photos were made</h2>
      <p>
        The empty room is a free stock photo by Curtis Adams on Pexels. We ran it through ORVIONIS Virtual Staging once per style. It is
        the same pipeline and the same instructions to the image model as a customer&apos;s order. Each run returned two
        versions; this page shows one of each, unedited apart from resizing. They are AI-staged images, so in a listing
        they would need the usual disclosure. Most MLSs ask for a &ldquo;virtually staged&rdquo; label, and California
        also requires access to the original photo. See the <Link href="/guides/ab-723-virtual-staging">AB 723 checklist</Link>.
      </p>

      <h2>Sources</h2>
      <ul className="text-sm">
        <li>
          Room photo: Curtis Adams on Pexels (photo 3958955), Pexels licence, free to use and modify:{" "}
          <a href="https://www.pexels.com/photo/brown-wooden-framed-glass-window-and-fireplace-3958955/" rel="nofollow noopener" target="_blank">
            pexels.com
          </a>
        </li>
        <li>Staged versions: ORVIONIS Virtual Staging, production pipeline, October 2, 2026.</li>
      </ul>
    </div>
  );
}
