import fs from "node:fs/promises";
const file =
  (process.env.FIXTURE_ARTIFACT_DIR || "/private/tmp/central-hill-translations-retirement-qa") +
  "/page-field-manifest.json";
const manifest = JSON.parse(await fs.readFile(file, "utf8"));
const evidence = {
  home: {
    source: "src/slices/pages/ui/home-page.tsx:161; components/services-carousel.tsx",
    reason:
      "Services carousel receives section content; the retired eyebrow override has no public read. Only its headline and assurance labels are authored publicly.",
  },
  owners: {
    source: "src/slices/pages/ui/owners-page.tsx:338,436",
    reason:
      "Plans project name/tag/corner_badge/features; fee comes from corner_badge. Closing band projects headline/body/cta/contact without eyebrow.",
  },
  buildings: {
    source: "src/slices/pages/ui/components/buildings-sections.tsx",
    reason: "No hidden [T] fields.",
  },
  real_estate: {
    source: "src/slices/pages/ui/real-estate-page.tsx:324",
    reason:
      "Partners renders secondary CTA label; only primary CTA note is passed to EditorialSplit. Secondary note is not consumed.",
  },
  guest: {
    source: "src/slices/pages/ui/guest-page.tsx:176,320,346,402",
    reason:
      "Hero button uses hero.cta_label/cta_url, not legacy hero.cta.label. Teaser card text comes from published Services/Guides. Other retired eyebrows are not passed to section/CTA renderers.",
  },
  services: {
    source:
      "src/slices/pages/ui/components/services-sections.tsx:87; src/slices/services/ui/services-listing.tsx",
    reason:
      "Intro/final CTA no longer read eyebrows. Retired how_it_works is not composed by Services listing.",
  },
  about: {
    source: "src/slices/pages/ui/about-page.tsx:239,265,281,297,342",
    reason:
      "Story/serve/values/organisation/certifications/community/contact compose headline/body without the retired section eyebrows.",
  },
  guides: {
    source:
      "src/slices/pages/ui/components/guides-sections.tsx:49; src/slices/guides/ui/guides-listing.tsx:87,114,184",
    reason:
      "City filter takes label/soonLabel, not note. Catalogue/recommendations/final CTA use headlines/body; retired eyebrows have no source-content read.",
  },
  blog: {
    source: "src/slices/blog/ui/blog-listing.tsx:102,116,148,171,201",
    reason:
      "Hero, featured, journal and newsletter compose headline/intro/title/description without the retired eyebrow overrides.",
  },
};
const rows = manifest.pages.flatMap((page) =>
  page.fields
    .filter((field) => !field.control)
    .map((field) => ({
      page: page.key,
      pattern: field.pattern,
      status: "legacy-override-not-rendered",
      ...evidence[page.key],
    })),
);
await fs.writeFile(
  (process.env.FIXTURE_ARTIFACT_DIR || "/private/tmp/central-hill-translations-retirement-qa") +
    "/hidden-field-audit.json",
  JSON.stringify(
    {
      method:
        "Read schema-hidden inventory AND current public composition. These rows are explicit legacy-override exclusions, not passed E2E assertions. Any conflicting runtime observation reopens the field as a gap.",
      fields: rows,
    },
    null,
    2,
  ),
);
for (const page of manifest.pages)
  for (const field of page.fields) {
    if (!field.control)
      field.exclusion = rows.find((row) => row.page === page.key && row.pattern === field.pattern);
    if (/(?:_alt|\.alt)$/.test(field.pathTemplate))
      field.public = { ...field.public, kind: "image-alt", selector: 'img[alt="{value}"]' };
    if (/(?:contact_step|done_step)\./.test(field.pathTemplate))
      field.public.interaction = field.pathTemplate.includes("done_step")
        ? "calculator-submit-own-synthetic-lead"
        : "calculator-next-step";
    if (
      /(?:hero\.contact\.(?:title|intro)|dual_cta\.owner\.contact\.(?:title|intro))/.test(
        field.pathTemplate,
      )
    )
      field.public.interaction = "open-own-contact-dialog";
    if (page.key === "guides" && field.pattern === "catalogue.empty_message")
      field.public.interaction = "select-city-without-guides";
    if (page.key === "guides" && field.pattern.startsWith("recommendations."))
      field.public.requirement = "Published recommendation places with media/address and all3types";
  }
await fs.writeFile(file, JSON.stringify(manifest, null, 2));
console.log("Audited explicit hidden exclusions:", rows.length);
