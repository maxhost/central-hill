# Guest closing CTA: identify contact-dialog copy — 2026-11-05

User asks what Closing dual CTA fields Title/Intro text correspond to because
typing changes nothing visible in the page preview. Source confirms these paths
are `dual_cta.owner.contact.title` and `.intro`: GuestPage forwards them to the
owner button's ContactDialog. That client renders its title/intro only when open.
The authenticated preview bridge intentionally blocks clicks/submissions; its
page canvas does not open that form. These are connected dialog fields, not stale
page preview content.

Bounded root-owned L0 clarification: pageFieldLabel in Pages admin/home-contextual.ts
names those two exact paths Owner contact dialog title/intro; matching four-locale
messages, and a Guest/dual_cta-only inspector note explain where the copy appears
and why the page preview does not show it. English and target inspectors share
the path labels. No fields hidden/removed or persistence/render/dialog/bridge
behavior changed. Existing schemas, paths and public form wiring preserved.

Base509d785/main/current checkout, all preceding work and unused logo retained.
Write set: the two admin modules, messages/en/es/pt/fr.json, this report and visual
handoff. L0/source inspection only; no automatic tests, QA, suites, detector,
browser session, DB writes, save/publish/upload, commit/push/deploy or restart.
User reviews existing localhost3071. Prior functional evidence is not a new QA
claim for this later wording change.
