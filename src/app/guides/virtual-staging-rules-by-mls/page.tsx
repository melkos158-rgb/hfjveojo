import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { STAGING_PRICE_LINE } from "@/config/staging-pricing";
import {
  DISCLOSURE_LABEL,
  MLS_NOT_PUBLIC,
  MLS_RULES,
  ORIGINAL_LABEL,
  boardsDisclosingIn,
  boardsRequiringOriginal,
  type MlsRule,
} from "@/content/mls-staging-rules";

const SLUG = "virtual-staging-rules-by-mls";
const COUNT = MLS_RULES.length;
const TITLE = `Virtual staging rules by MLS: what ${COUNT} boards require (2026)`;
/** Search-result title: agents type "virtual staging MLS rules" or "<board> virtual staging". */
const SEO_TITLE = `Virtual staging MLS rules: ${COUNT} boards compared (2026)`;
const DESCRIPTION = `Where ${COUNT} MLSs want virtual staging disclosed (on the photo, the caption, the remarks or a field), when the original must follow, and what's banned.`;

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `/guides/${SLUG}` },
  openGraph: { type: "article", title: `${TITLE} | ${site.name}`, description: DESCRIPTION, url: `${site.url}/guides/${SLUG}`, images: [{ url: "/img/sample-virtual-staging-og.jpg", width: 540, height: 630 }] },
};

const names = (rules: MlsRule[]) => {
  const n = rules.map((r) => r.name);
  return n.length <= 1 ? n.join("") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
};

const onPhoto = boardsDisclosingIn("photo");
const inCaption = boardsDisclosingIn("caption");
const inRemarks = boardsDisclosingIn("remarks");
const inField = boardsDisclosingIn("field");
const unspecified = MLS_RULES.filter((r) => r.disclose.length === 0);
const needOriginal = boardsRequiringOriginal();

/** Questions 1–3 are written from the rows, so they follow the table; question 4 names boards whose rows say so. */
const FAQ = [
  {
    q: "Do MLSs allow virtual staging?",
    a: `All ${COUNT} boards in this guide allow it in some form, usually limited to furniture, décor and other things that don't convey with the property. Most ban changes to the property itself, such as walls, floors, fixtures or views, and hiding defects; Canopy MLS allows cosmetic changes like paint color as long as no structural change is shown.`,
  },
  {
    q: "Where do I disclose virtual staging on the MLS?",
    a: `It depends on the board. On the photo itself: ${names(onPhoto)}. In the photo caption or description: ${names(inCaption)}. In the remarks: ${names(inRemarks)}. In an MLS field: ${names(inField)}. Some boards ask for more than one.`,
  },
  {
    q: "Do I have to upload the original photo?",
    a: `On ${names(needOriginal)}, yes: the unaltered photo goes next to the staged one. Other boards don't require it, but keeping the original of every staged room is a good habit, and California's AB 723 requires buyers to have access to it.`,
  },
  {
    q: "Can I put “Virtually staged” text on the photo?",
    a: "On some boards you must (Canopy MLS, MLS Now, SmartMLS); on others you may not: Stellar MLS allows no words on photos and FMLS bans text superimposed on photos, while ARMLS allows only its own Flexmls watermark. Check your board's row before you upload, and keep a labeled copy for ads and social posts.",
  },
  {
    q: "What if my MLS isn't listed?",
    a: "Look for a rule on virtually staged, digitally altered or AI-enhanced photos in your MLS's rules or help center, and follow it. If you can't find one, disclose in the photo caption and the remarks, keep the original next to the staged photo, and don't change the property itself.",
  },
];

/**
 * Board-by-board virtual staging rules (src/content/mls-staging-rules.ts). Eight boards were read on 17 Oct 2026 from
 * their own rules or help pages (Bright, NorthstarMLS, SmartMLS, MLS Now, REcolorado, MRED, Canopy, FMLS); the others
 * come from the board guides' sources. Rules we couldn't read are listed as such, never guessed.
 */
export default function MlsRulesGuidePage() {
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    image: `${site.url}/img/sample-virtual-staging-og.jpg`,
    datePublished: "2026-10-17",
    dateModified: "2026-10-17",
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/brand/orvionis-logo-512.png` } },
    mainEntityOfPage: `${site.url}/guides/${SLUG}`,
  };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <p className="eyebrow">Guide · MLS rules · updated October 2026</p>
      <h1 className="mt-3">{TITLE}</h1>
      <p>
        Every MLS in this guide allows virtual staging, and almost all of them limit it to furniture and décor. Where they differ is the disclosure: some want a label on the photo
        itself, some ban any words on the photo and want the caption, the remarks or an MLS field instead, and some want the original photo right next to the staged one. Below is
        each board&apos;s rule, read from its own rules or help pages, with the date we checked it.
      </p>

      <h2>Four ways boards ask for it</h2>
      <ul>
        <li>
          <strong>A label on the photo:</strong> {names(onPhoto)}.
        </li>
        <li>
          <strong>The photo caption or description:</strong> {names(inCaption)}.
        </li>
        <li>
          <strong>The remarks:</strong> {names(inRemarks)}.
        </li>
        <li>
          <strong>An MLS field:</strong> {names(inField)}.
        </li>
      </ul>
      <p>
        The original next to the staged photo is required on {names(needOriginal)}. {names(unspecified)} don&apos;t say where the disclosure goes in what we could read; there,
        we&apos;d put it in the caption and the remarks.
      </p>

      <h2>The {COUNT} boards at a glance</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr>
              <th className="py-2 pr-3">MLS</th>
              <th className="py-2 pr-3">Area</th>
              <th className="py-2 pr-3">Where to disclose</th>
              <th className="py-2">Original next to it</th>
            </tr>
          </thead>
          <tbody>
            {MLS_RULES.map((r) => (
              <tr key={r.slug} className="border-t border-line align-top">
                <td className="py-2 pr-3 font-semibold text-fg">
                  <a href={`#${r.slug}`}>{r.name}</a>
                </td>
                <td className="py-2 pr-3">{r.area}</td>
                <td className="py-2 pr-3">{r.disclose.length ? r.disclose.map((d) => DISCLOSURE_LABEL[d]).join(" + ") : "Not specified"}</td>
                <td className="py-2">{ORIGINAL_LABEL[r.original]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Board by board</h2>
      {MLS_RULES.map((r) => (
        <section key={r.slug} id={r.slug}>
          <h3>
            {r.name} — {r.area}
          </h3>
          {r.status !== "rule" ? (
            <p className="text-sm text-gray-500">
              {r.status === "guideline" ? "Proposed guidelines, not a binding rule." : "From a report on the rule; the rulebook itself wasn't public."}
            </p>
          ) : null}
          <ul>
            <li>
              <strong>Disclosure:</strong> {r.discloseText}
            </li>
            <li>
              <strong>Original photo:</strong> {r.originalText}
            </li>
            {r.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="text-sm">
            Source:{" "}
            <a href={r.source.url} target="_blank" rel="noopener noreferrer">
              {r.source.label}
            </a>
            {r.extraSources?.map((s) => (
              <span key={s.url}>
                ;{" "}
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              </span>
            ))}
            . Checked {new Date(`${r.checked}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}.
            {r.guide ? (
              <>
                {" "}
                <Link href={r.guide}>More in our guide</Link>.
              </>
            ) : null}
          </p>
        </section>
      ))}

      <h2>Boards we couldn&apos;t check</h2>
      <ul>
        {MLS_NOT_PUBLIC.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      <h2>One habit that passes on every board</h2>
      <ol>
        <li>
          <strong>Stage, don&apos;t renovate:</strong> furniture and décor only; walls, floors, fixtures, views and defects stay as photographed.
        </li>
        <li>
          <strong>Keep a clean version and a labeled version</strong> of every staged photo. Upload the one your board wants: labeled where the label goes on the photo, clean
          where words on photos are banned.
        </li>
        <li>
          <strong>Mark it where your board asks:</strong> the caption, the field, the remarks, or all three.
        </li>
        <li>
          <strong>Put the original next to the staged photo</strong> where your board requires it, and keep it either way.
        </li>
        <li>
          <strong>Check the state law too:</strong> California and, from 2027, Wisconsin have their own rules. See{" "}
          <Link href="/guides/virtual-staging-laws-by-state">virtual staging laws by state</Link>.
        </li>
      </ol>
      <p>
        The wording to paste in each place is in our <Link href="/guides/virtual-staging-disclaimer">virtual staging disclaimer examples</Link>.
      </p>

      <h2>How ORVIONIS fits</h2>
      <p>
        Every <Link href="/tools/virtual-staging">Virtual Staging</Link> order gives you both versions the boards above ask for: clean JPGs with no words or logo, and copies labeled
        &ldquo;Virtually staged&rdquo;, plus a public page with the unaltered original and a QR code to it. Walls, floors, windows and fixtures are kept as photographed. Pricing:{" "}
        {STAGING_PRICE_LINE}. Your first photo is free.
      </p>
      <p>
        <Link href="/tools/virtual-staging#order" className="btn-primary no-underline">
          Stage your first photo free
        </Link>
      </p>

      <h2>Questions</h2>
      {FAQ.map((f) => (
        <div key={f.q}>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}

      <p className="text-sm text-gray-500">
        General information, not legal advice. Each board&apos;s rule was checked on the date shown under it; rules change, so check your MLS&apos;s current version and your
        broker&apos;s policy.
      </p>
    </div>
  );
}
