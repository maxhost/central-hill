// Audited renderer/control policies for b30a18c. This file never marks a browser pass.
import fs from "node:fs/promises";
import { out } from "./qa-common.mjs";
const file = out + "/concrete-field-manifest.json",
  m = JSON.parse(await fs.readFile(file, "utf8"));
m.version = 6;
m.controlEvidence = {
  english: "Native IDs are EN-only; observe Q0 before claiming any control pass.",
  target:
    "Use ID only when actually present. Otherwise use descriptor field order in selected Inspector section, exact count excluding file/hidden, then exact stored-path checks.",
  targetNestedAlt:
    "Product b30a18c includes canonical numeric-array traversal; verify real About certifications inline ALT in Q2.",
};
for (const p of m.pages)
  for (const f of p.fields) {
    f.control.localeScope = ["en"];
    f.control.targetStrategy = m.controlEvidence.target;
    if (/_alt$/.test(f.path)) f.public.kind = "image-alt";
    if (
      (["owners", "buildings"].includes(p.key) && /^hero\.contact\.(title|intro)$/.test(f.path)) ||
      (p.key === "guest" && /^dual_cta\.owner\.contact\./.test(f.path))
    )
      f.public.interaction = "open-own-contact-dialog";
    if (f.path.includes(".contact_step."))
      f.public.interaction = "calculator-next-step2-no-submission";
    if (f.path.includes(".done_step."))
      f.public.interaction = "calculator-next-step3-no-submission";
    if (
      p.key === "owners" &&
      ["why.cta_secondary.note", "plans.helpers.0.title", "plans.helpers.0.copy"].includes(f.path)
    ) {
      f.public.exclusion = "Persisted control without current public consumer; no public-edit-pass";
      f.public.source = "src/slices/pages/ui/owners-page.tsx:283-291,331-366";
    }
    if (p.key === "guides" && f.path === "catalogue.empty_message") {
      f.public.interaction = "archive-own-guide-then-restore-after-final-guide-cycle";
      f.public.dependency =
        "Archive only own Guide after Q5c; check4locale labels; Restore and compare snapshots/revisions. Before adding any source-only Guide.";
    }
    if (f.surface === "blog_article") {
      f.public.route = "/{locale}/blog/qa-featured";
      f.public.dependency =
        "Clear secondary own Post CTA via UI4locales; preserve primary Post CTA.";
    }
  }
for (const p of m.pages)
  if (p.key === "blog")
    p.mediaAlt.policy =
      "Own ALT persists/reloads, but Hero background renderer deliberately forces alt empty. Assert separately; no public-edit-pass.";
for (const f of m.entities.service.fields) {
  if (f.path === "copy.bookingLabel") f.public.kind = "aside-aria-label";
  if (f.path === "duration_label") {
    f.public.exclusion = "Editor-only: no current renderer";
    f.public.source = "ServiceCard/detail do not consume duration_label";
  }
  if (f.path === "detail.pricing.columns.0") f.control = 'role=textbox[name="Column 1"]';
}
for (const f of m.entities.guide.fields)
  if (f.path.endsWith(".category")) {
    f.public.enPolicy =
      "Preserve canonical recommendation classification EN, observe guides.recType code-label; no EN textual edit pass. Targets use free labels.";
    f.public.enSource = "src/slices/guides/ui/components/recommendation-card.tsx:109-111";
  }
for (const f of m.entities.post.fields)
  if (/^body\..*\.(alt|caption)$/.test(f.path))
    f.control = '[data-post-rich-text] input[id$="-' + f.path.split(".").at(-1) + '"]';
m.rendererExclusions = [
  {
    page: "owners",
    paths: [
      "why.cta_secondary.note",
      "plans.helpers[].title",
      "plans.helpers[].copy",
      "plans.helpers[].cta.note",
      "plans.helpers[].cta.url",
    ],
    reason: "No current renderer; only helpers[0].cta.label remains active",
  },
  { entity: "service", paths: ["duration_label"], reason: "No current renderer" },
  {
    page: "blog",
    paths: ["mediaAlts[hero.image_media_id]"],
    reason: "Decorative Hero alt empty by code, same f947c4f; no public-edit-pass",
  },
];
await fs.writeFile(file, JSON.stringify(m, null, 2));
console.log("Applied audited static control/renderer policies; browser evidence remains pending.");
