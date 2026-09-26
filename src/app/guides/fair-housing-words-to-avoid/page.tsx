import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { FAIR_HOUSING_RULES } from "@/lib/tools/qa";

const PATH = "/guides/fair-housing-words-to-avoid";
const TITLE = "Fair housing words to avoid in listing descriptions (2026)";
const DESCRIPTION =
  "The Fair Housing Act bars ads that show a preference based on race, color, religion, sex, disability, familial status or national origin. What HUD's guidance allows, the phrases to rewrite, and a safer alternative for each.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["fair housing words to avoid", "fair housing advertising words", "listing description words to avoid", "fair housing compliant listing description", "HUD advertising guidelines"],
  alternates: { canonical: PATH },
  openGraph: { type: "article", title: `${TITLE} | ${site.name}`, description: DESCRIPTION, url: `${site.url}${PATH}` },
};

const FAQ = [
  {
    q: "What words can't you use in a real estate listing?",
    a: "Anything that says who should or shouldn't live in the home based on race, color, religion, sex, disability, familial status or national origin — for example “no children”, “adults only”, “Christian home”, “perfect for singles” or references to the ethnicity of the neighborhood. Describe the property and its features instead.",
  },
  {
    q: "Is “master bedroom” a fair housing violation?",
    a: "No. HUD's 1995 advertising guidance names “master bedroom” as a facially neutral description. Many MLS boards and brokerages have nevertheless switched to “primary bedroom”, so it is treated here as a style choice, not a legal risk.",
  },
  {
    q: "Can I say “family room” or “close to schools”?",
    a: "Yes. “Family room” is the name of a room, and naming nearby facilities describes the property's location. What causes trouble is describing the ideal buyer (“great for families”) rather than the home.",
  },
  {
    q: "Can a 55+ community advertise its age requirement?",
    a: "Housing that qualifies as housing for older persons under the Fair Housing Act exemption may advertise it. Outside such communities, age language (“mature adults”, “retirees”) should come out.",
  },
];

/**
 * Sourced guide to fair-housing wording in listing ads. The phrase table is rendered from FAIR_HOUSING_RULES — the same
 * lexicon the free checker and the paid Listing Description tool use — so the three never disagree. General
 * information, not legal advice.
 */
export default function FairHousingWordsGuide() {
  const risk = FAIR_HOUSING_RULES.filter((r) => r.severity === "risk");
  const style = FAIR_HOUSING_RULES.filter((r) => r.severity === "style");
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    datePublished: "2026-09-26",
    dateModified: "2026-09-26",
    author: { "@type": "Organization", name: site.name },
    publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/brand/orvionis-logo-512.png` } },
    mainEntityOfPage: `${site.url}${PATH}`,
  };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <div className="container-x max-w-3xl py-12 prose-basic">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <p className="eyebrow">Guide · Listing copy · updated September 2026</p>
      <h1 className="mt-3">Fair housing words to avoid in listing descriptions</h1>
      <p>
        The rule fits in one line: <strong>describe the property, not the people who should live in it.</strong> Almost every phrase that gets a listing flagged breaks that rule — it names the ideal buyer instead of the home. Below: what the law says, what HUD&apos;s guidance explicitly allows, and {risk.length} phrases to rewrite, each with an alternative that sells the same thing.
      </p>

      <h2>What the law says</h2>
      <p>
        The Fair Housing Act makes it unlawful to publish any advertisement for the sale or rental of a dwelling &ldquo;that indicates any preference, limitation, or discrimination based on race, color, religion, sex, handicap, familial status, or national origin&rdquo; (42 U.S.C. §3604(c)). It covers listing remarks, social posts, flyers and emails alike — and the person who writes or publishes the ad, not just the seller.
      </p>

      <h2>What HUD&apos;s guidance allows</h2>
      <p>
        HUD&apos;s 1995 memo on advertising (Guidance Regarding Advertisements Under §804(c)) draws the line between describing the <em>residents</em> and describing the <em>housing</em>:
      </p>
      <ul>
        <li>
          <strong>Violations:</strong> explicit preferences or exclusions — &ldquo;adults only&rdquo;, &ldquo;no children&rdquo;, &ldquo;Christian home&rdquo;, &ldquo;no wheelchairs&rdquo;, or describing residents in racial or ethnic terms.
        </li>
        <li>
          <strong>Allowed:</strong> facially neutral descriptions of the property — &ldquo;master bedroom&rdquo;, &ldquo;family room&rdquo;, &ldquo;mother-in-law suite&rdquo;, &ldquo;walk-in closets&rdquo;, &ldquo;jogging trails&rdquo;, &ldquo;wheelchair ramp&rdquo;, &ldquo;quiet streets&rdquo;.
        </li>
      </ul>
      <p>
        State law, MLS rules and brokerage policies are often stricter than the federal baseline, which is why the list below also flags phrases that are not outright violations but routinely get remarks rejected.
      </p>

      <h2>Phrases to rewrite</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wider text-gray-500">
              <th className="py-2 pr-3">Phrase</th>
              <th className="py-2 pr-3">Why it&apos;s risky</th>
              <th className="py-2">Say this instead</th>
            </tr>
          </thead>
          <tbody>
            {risk.map((r) => (
              <tr key={r.label} className="border-b border-line align-top">
                <td className="py-2 pr-3 font-semibold text-fg">{r.label}</td>
                <td className="py-2 pr-3 text-gray-600">{r.basis}</td>
                <td className="py-2 text-gray-700">{r.hint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Style, not law</h2>
      <p>These are fine under HUD&apos;s guidance, but many boards now prefer other wording:</p>
      <ul>
        {style.map((r) => (
          <li key={r.label}>
            <strong>{r.label}</strong> — {r.hint}
          </li>
        ))}
      </ul>

      <h2>Gray areas worth knowing</h2>
      <ul>
        <li>
          <strong>&ldquo;Safe neighborhood&rdquo;</strong> isn&apos;t named in HUD&apos;s memo, but it invites a judgment about who lives nearby and is widely flagged in fair-housing training. Give facts a buyer can check: a cul-de-sac, sidewalks, the distance to a park.
        </li>
        <li>
          <strong>&ldquo;Bachelor apartment&rdquo;</strong> is accepted by HUD as a description of a unit type; <strong>&ldquo;bachelor pad&rdquo;</strong> reads as a lifestyle for single men — rewrite it as what it is (&ldquo;efficient one-bedroom&rdquo;).
        </li>
        <li>
          <strong>Places of worship:</strong> naming a church as the only landmark (&ldquo;walking distance to St. Mary&apos;s&rdquo;) can signal a religious preference; use neutral landmarks such as the park, the library or the train.
        </li>
        <li>
          <strong>55+ communities</strong> that qualify for the housing-for-older-persons exemption may say so; everyone else should drop age language.
        </li>
      </ul>

      <h2>A 30-second routine before you publish</h2>
      <ol>
        <li>Read every sentence and ask: does it describe the home, or the buyer?</li>
        <li>
          Paste the remarks into the <Link href="/free/fair-housing-checker">free fair housing checker</Link> — it highlights these phrases and counts characters against your MLS limit. Nothing you paste leaves your browser.
        </li>
        <li>Replace each flagged phrase with the feature it was hinting at: bedrooms, yard, layout, distances.</li>
      </ol>

      <div className="not-prose card mt-8">
        <p className="font-semibold text-fg">Rather not write it yourself?</p>
        <p className="mt-1 text-sm text-gray-600">
          The <Link className="font-semibold text-accent hover:underline" href="/tools/listing-description">Listing Description tool</Link> turns your listing facts into MLS remarks within your board&apos;s character limit, a web version, captions and an email blurb — checked against the same list before you receive it. $9 per listing, about five minutes.
        </p>
      </div>

      <h2>Sources</h2>
      <ul>
        <li>
          <a href="https://www.law.cornell.edu/uscode/text/42/3604" rel="noopener noreferrer" target="_blank">
            42 U.S.C. §3604 — Discrimination in the sale or rental of housing
          </a>{" "}
          (Cornell LII)
        </li>
        <li>
          <a href="https://fairhousingtx.org/resource/hud-memo-guidance-regarding-advertisements-under-%C2%A7804c-of-the-fair-housing-act-january-9-1995/" rel="noopener noreferrer" target="_blank">
            HUD memo: Guidance Regarding Advertisements Under §804(c) of the Fair Housing Act, January 9, 1995
          </a>
        </li>
        <li>
          <a href="https://www.law.cornell.edu/uscode/text/42/3607" rel="noopener noreferrer" target="_blank">
            42 U.S.C. §3607 — exemptions, including housing for older persons
          </a>
        </li>
      </ul>
      <p className="text-sm text-gray-500">General information, not legal advice. Your state, MLS and brokerage may have stricter rules; check them and ask your broker or counsel when in doubt.</p>
    </div>
  );
}
