/**
 * How US MLSs treat virtually staged listing photos: one row per board, each read from the board's own rules or help
 * pages, or (marked `status: "report"`) from the association that runs the MLS or a news report when the rulebook
 * itself isn't public. `checked` is the day the source was read. The by-MLS guide renders this table and derives its
 * summaries from it, so a board's row is the only place its rule is written down for that page; the board guides
 * (Stellar, ARMLS, Texas, California) go deeper.
 */

/** Where a board wants the disclosure: on the photo itself, in the photo caption/description, in the remarks, or in an MLS field. */
export type DisclosurePlace = "photo" | "caption" | "remarks" | "field";
/** Whether the unaltered photo has to sit next to the staged one in the listing. */
export type OriginalRule = "required" | "recommended" | "on-request" | "not-required" | "not-addressed";
/** A binding rule, a proposed guideline, or a second-hand report of the rule. */
export type RuleStatus = "rule" | "guideline" | "report";

export type MlsRule = {
  slug: string;
  name: string;
  area: string;
  state: string;
  status: RuleStatus;
  disclose: DisclosurePlace[];
  /** Where and how to disclose, in one or two sentences. */
  discloseText: string;
  original: OriginalRule;
  originalText: string;
  /** What may and may not change, fines, dates. */
  notes: string[];
  source: { label: string; url: string };
  extraSources?: { label: string; url: string }[];
  /** YYYY-MM-DD, the day the source was read. */
  checked: string;
  /** Our deeper guide for this board, if any. */
  guide?: string;
};

export const MLS_RULES: MlsRule[] = [
  {
    slug: "stellar",
    name: "Stellar MLS",
    area: "Central Florida (Tampa, Orlando, Sarasota)",
    state: "FL",
    status: "rule",
    disclose: ["caption", "field", "remarks"],
    discloseText:
      "“Virtually staged” in each staged photo's description, the virtually staged field ticked, and public remarks that start with “One or more photo(s) was virtually staged.” No words on the photo.",
    original: "not-addressed",
    originalText: "Not part of the rule.",
    notes: [
      "No virtual staging on pre-construction or under-construction listings.",
      "No hiding damage or changing fixtures, paint or views; a broken rule means the photos come down and an automatic fine.",
    ],
    source: { label: "Stellar MLS Rules, Article 4.4 — Virtually Staged Photos", url: "https://rules.stellarmls.com/hc/en-us/articles/14692987795095-Article-04-04-Virtually-Staged-Photos" },
    checked: "2026-10-08",
    guide: "/guides/stellar-mls-virtual-staging",
  },
  {
    slug: "armls",
    name: "ARMLS",
    area: "Phoenix area, Arizona",
    state: "AZ",
    status: "rule",
    disclose: ["photo"],
    discloseText: "The Flexmls “Digitally Altered” watermark on each altered photo, added in Flexmls; one watermark per photo, and only ARMLS's.",
    original: "required",
    originalText: "Directly before or after the altered photo.",
    notes: ["Rule 8.23, updated May 28, 2026.", "Fines abated through November 2026; $200 per violation from December 2026."],
    source: { label: "ARMLS — Digitally Altered Media (Rule 8.23)", url: "https://armls.com/digitally-altered-media" },
    checked: "2026-10-09",
    guide: "/guides/armls-virtual-staging",
  },
  {
    slug: "crmls",
    name: "CRMLS",
    area: "Southern California",
    state: "CA",
    status: "rule",
    disclose: ["caption"],
    discloseText: "Label the altered photo in the photo description field.",
    original: "required",
    originalText: "Immediately before or after the altered photo.",
    notes: ["California's AB 723 applies on top: a statement on or next to the image in ads, and access to the original."],
    source: { label: "CRMLS — Digitally Altered Images FAQs", url: "https://kb.crmls.org/knowledgebase/digitally-altered-images-faqs/" },
    checked: "2026-10-10",
    guide: "/guides/ab-723-virtual-staging",
  },
  {
    slug: "sdmls",
    name: "SDMLS",
    area: "San Diego, California",
    state: "CA",
    status: "rule",
    disclose: [],
    discloseText: "Altered photos must be clearly disclosed; the page we read doesn't name the field.",
    original: "required",
    originalText: "Paired with the unaltered original across MLS displays and IDX, VOW and syndication feeds.",
    notes: ["Written for California's AB 723."],
    source: { label: "SDMLS — AB 723: Digitally Altered Images requirements", url: "https://sdmls.com/ab-723-digitally-altered-images-sdmls-requirements/" },
    checked: "2026-09-26",
    guide: "/guides/ab-723-virtual-staging",
  },
  {
    slug: "bay-east",
    name: "Bay East",
    area: "East Bay, San Francisco Bay Area",
    state: "CA",
    status: "rule",
    disclose: ["field"],
    discloseText: "The MLS's Label option on the photo: “altered”, “digitally altered” or “AI altered”.",
    original: "required",
    originalText: "Uploaded and shown immediately after the altered photo.",
    notes: ["Written for California's AB 723."],
    source: { label: "Bay East — Digitally Altered MLS Photo Rule", url: "https://bayeast.org/digitally-altered-mls-photo-rule/" },
    checked: "2026-10-10",
    guide: "/guides/ab-723-virtual-staging",
  },
  {
    slug: "har",
    name: "HAR",
    area: "Houston, Texas",
    state: "TX",
    status: "rule",
    disclose: ["caption"],
    discloseText: "Clearly indicate in the Photo Description that the photo is virtually staged.",
    original: "not-required",
    originalText: "Not for furniture-only staging. A photo that changes the property itself needs HAR's watermark, can't be the primary photo, and goes next to the unaltered one.",
    notes: ["Staging limited to furnishings and wall décor (Rule 1.25.1)."],
    source: { label: "HAR MLS Rules (December 1, 2023), Rule 1.25.1", url: "https://web.har.com/mls/MLSRules.pdf" },
    checked: "2026-10-13",
    guide: "/guides/texas-virtual-staging-rules",
  },
  {
    slug: "sabor",
    name: "SABOR",
    area: "San Antonio, Texas",
    state: "TX",
    status: "rule",
    disclose: ["caption"],
    discloseText: "Pick “virtually staged” from the photo description list.",
    original: "not-addressed",
    originalText: "Not part of the rule.",
    notes: ["Furnishings and wall décor only; nothing that alters the structure or grounds, such as a pool or landscaping (Rule 1.2(b))."],
    source: { label: "SABOR MLS Rules (revised September 18, 2024), 1.2(b)", url: "https://sabor.com/wp-content/uploads/2024/09/MLS-Rules-Update-Clean-copy-2.pdf" },
    checked: "2026-10-13",
    guide: "/guides/texas-virtual-staging-rules",
  },
  {
    slug: "ntreis",
    name: "NTREIS",
    area: "Dallas–Fort Worth, Texas",
    state: "TX",
    status: "report",
    disclose: [],
    discloseText: "No disclosure field named in the guidance we could read (the rulebook isn't public).",
    original: "not-addressed",
    originalText: "Not addressed in that guidance.",
    notes: [
      "MetroTex (May 2026): staging is acceptable in many cases, but large virtual renovations can misrepresent the home.",
      "No text across listing photos when the information belongs in an MLS field.",
    ],
    source: { label: "MetroTex Association of REALTORS® — Common MLS Violations to Avoid in 2026", url: "https://www.mymetrotex.com/common-mls-violations-to-avoid-2026/" },
    checked: "2026-10-13",
    guide: "/guides/texas-virtual-staging-rules",
  },
  {
    slug: "metro-mls",
    name: "Metro MLS",
    area: "Milwaukee area, Wisconsin",
    state: "WI",
    status: "report",
    disclose: ["photo", "remarks"],
    discloseText: "A watermark on the altered photo and the changes noted in the public remarks (as reported).",
    original: "required",
    originalText: "Immediately before the altered photo.",
    notes: [
      "From September 1, 2026: $10 a day for an altered primary photo until it's replaced, and a separate $10 sanction for a missing watermark.",
      "Wisconsin's own law (2025 Act 69) adds a disclosure rule from January 1, 2027.",
    ],
    source: { label: "The Close — how far can agents edit a listing photo (September 3, 2026)", url: "https://theclose.com/news-ai-listing-photo-rules/" },
    checked: "2026-10-16",
    guide: "/guides/virtual-staging-laws-by-state",
  },
  {
    slug: "bright",
    name: "Bright MLS",
    area: "Mid-Atlantic (Maryland, Virginia, D.C., Pennsylvania, New Jersey, Delaware, West Virginia)",
    state: "Mid-Atlantic",
    status: "rule",
    disclose: [],
    discloseText:
      "Virtually staged photos “must be disclosed in the MLS”; the 2024 rules don't say where. A condensed rulebook took effect on July 22, 2026, which we couldn't read, so check it.",
    original: "not-addressed",
    originalText: "Not part of the 2024 rules.",
    notes: [
      "Furniture and other personal property that doesn't convey may be added; adding or removing things outside the owner's control (a view, power lines) is prohibited.",
      "Staging is permitted on to-be-built and under-construction listings.",
      "No readable text, contact details, signs or logos on photos.",
    ],
    source: {
      label: "Bright MLS — Policy on Images and Documents in the MLS (February 28, 2024), 4.E",
      url: "https://assets.ctfassets.net/1g8q1frp41ix/57NAS71dVeHqmiBhfaMl0Y/fb68c2776bec92fa67d83d566d1e802f/Bright_-_Policy_on_Images_and_Documents_in_the_MLS_2282024.pdf",
    },
    checked: "2026-10-17",
  },
  {
    slug: "northstar",
    name: "NorthstarMLS",
    area: "Minneapolis–St. Paul, Minnesota",
    state: "MN",
    status: "guideline",
    disclose: ["caption", "photo"],
    discloseText: "In the photo caption or a file name shown in the listing viewer, or on the photo itself (proposed guidelines, July 2026).",
    original: "recommended",
    originalText: "At least one unaltered “before” photo of each staged room.",
    notes: [
      "Staging may only add or remove personal property such as furniture and décor; changing walls, floors, windows, roofs or other permanent features is prohibited.",
      "The binding rules (effective July 1, 2026) don't mention staging; these are proposed guidelines.",
    ],
    source: { label: "NorthstarMLS — Guidelines for Virtual Staging and AI-Enhanced Listing Photos (July 10, 2026)", url: "https://northstarmls.com/insights/guidelines-for-virtual-staging-and-ai-enhanced-listing-photos/" },
    checked: "2026-10-17",
  },
  {
    slug: "smartmls",
    name: "SmartMLS",
    area: "Connecticut",
    state: "CT",
    status: "rule",
    disclose: ["photo", "field"],
    discloseText: "A stamp or watermark on the photo saying it's virtually staged (connectMLS can add its own), plus the “Are any property photos virtually staged?” field.",
    original: "not-required",
    originalText: "Not needed for virtually staged photos.",
    notes: ["Don't misrepresent the house, yard or surroundings."],
    source: { label: "SmartMLS — Virtually Staged Photos (updated September 2, 2026)", url: "https://compliance.smartmls.com/hc/en-us/articles/34224328235675-Virtually-Staged-Photos" },
    checked: "2026-10-17",
  },
  {
    slug: "mls-now",
    name: "MLS Now",
    area: "Ohio",
    state: "OH",
    status: "rule",
    disclose: ["photo", "caption"],
    discloseText: "An on-image label in a readable font, “Virtually Staged”, “Digitally Altered” or “Rendering/AI-Generated”, repeated in the caption.",
    original: "on-request",
    originalText: "Keep the originals and give them to MLS Now on request; the primary photo must be an unaltered current photo (a rendering is allowed for new construction).",
    notes: ["Staging is limited to movable personal property, and permanent or structural features may not change (Rules 3.2–3.3, effective August 3, 2026)."],
    source: { label: "MLS Now Rules, Section 3 — Images, Media and Virtual Staging", url: "https://support.mlsnow.com/hc/en-us/articles/47635315367067-MLS-Now-Rules-Section-3-Images-Media-Virtual-Staging" },
    checked: "2026-10-17",
  },
  {
    slug: "recolorado",
    name: "REcolorado",
    area: "Denver area, Colorado",
    state: "CO",
    status: "rule",
    disclose: [],
    discloseText: "“Virtual staging is allowed”; the policy doesn't say where to disclose it.",
    original: "not-addressed",
    originalText: "Not part of the policy.",
    notes: [
      "No manipulating the true appearance of the property, such as removing a permanent object or changing the landscape.",
      "Subtle text and non-predominant watermarks are allowed on photos; branding and logos are not (MLS Policy, revised November 2025, 1.20).",
    ],
    source: { label: "REcolorado MLS Policy (revised November 2025), 1.20", url: "https://cdn.recolorado.com/files/MLS-Policy.pdf" },
    checked: "2026-10-17",
  },
  {
    slug: "mred",
    name: "MRED",
    area: "Chicago area, Illinois",
    state: "IL",
    status: "rule",
    disclose: ["field"],
    discloseText: "The required “Are Any Property Photos Virtually Staged?” field; a Y adds a note to the listing reports and the photo browser.",
    original: "not-addressed",
    originalText: "Not part of the rule.",
    notes: [
      "Personal property that doesn't convey may be added; adding or removing things outside the owner's control is prohibited; staging to-be-built and under-construction listings is permitted (Rule 6.2, revised May 14, 2026).",
      "No names, contact details, logos or text commentary on photos, with fines from $250 to $1,000 per occurrence for photo content (6.1.1).",
    ],
    source: { label: "MRED Rules and Regulations (revised May 14, 2026), 6.2", url: "https://www.mredllc.com/comms/resources/MREDRulesAndRegulations.pdf" },
    extraSources: [{ label: "MRED Residential Glossary (revised August 17, 2024)", url: "https://www.mredllc.com/comms/resources/MREDResidentialGlossary.pdf" }],
    checked: "2026-10-17",
  },
  {
    slug: "canopy",
    name: "Canopy MLS",
    area: "Charlotte, North Carolina",
    state: "NC",
    status: "rule",
    disclose: ["photo"],
    discloseText: "A clear disclosure directly on the image; a disclosure only in captions or remarks is not acceptable.",
    original: "required",
    originalText: "Immediately before or after the staged photo.",
    notes: [
      "Furniture and cosmetic changes such as paint color are allowed if no structural change is shown or implied.",
      "The same rule covers AI-enhanced photos (Rules revised September 2026, 1.18.1).",
    ],
    source: { label: "Canopy MLS Rules and Regulations (revised September 2026), 1.18.1", url: "https://apps.carolinarealtors.com/files/Canopy%20MLS%20Rules%20and%20Regulations.pdf" },
    checked: "2026-10-17",
  },
  {
    slug: "fmls",
    name: "FMLS",
    area: "Atlanta, Georgia",
    state: "GA",
    status: "rule",
    disclose: ["remarks"],
    discloseText: "Every staged image designated as such in the public remarks; no text superimposed on photos.",
    original: "not-addressed",
    originalText: "Not part of the rule.",
    notes: [
      "Personal property and landscaping improvements that could realistically be made are allowed; nothing outside the owner's control, such as neighboring buildings or power lines, may be removed (Rule 20.1(e), effective March 17, 2025).",
    ],
    source: { label: "FMLS Rules and Regulations (effective March 17, 2025), 20.1(e)", url: "https://firstmls.com/wp-content/uploads/2025/03/RR2.0_3_18_25-2.pdf" },
    checked: "2026-10-17",
  },
];

/** Boards whose staging rules we couldn't read from a public source. */
export const MLS_NOT_PUBLIC = [
  "NWMLS (Washington): the rules are for members only.",
  "Georgia MLS: its current rules couldn't be fetched.",
  "Unlock MLS (Austin), NEFMLS (Jacksonville) and Miami's MLS: no public staging rule we could find.",
];

export const DISCLOSURE_LABEL: Record<DisclosurePlace, string> = {
  photo: "On the photo",
  caption: "Photo caption",
  remarks: "Remarks",
  field: "MLS field",
};

export const ORIGINAL_LABEL: Record<OriginalRule, string> = {
  required: "Required",
  recommended: "Recommended",
  "on-request": "Keep, give on request",
  "not-required": "Not required",
  "not-addressed": "Not addressed",
};

/** Boards that ask for the disclosure in `place`. */
export function boardsDisclosingIn(place: DisclosurePlace): MlsRule[] {
  return MLS_RULES.filter((r) => r.disclose.includes(place));
}

/** Boards that require the unaltered photo next to the staged one. */
export function boardsRequiringOriginal(): MlsRule[] {
  return MLS_RULES.filter((r) => r.original === "required");
}
