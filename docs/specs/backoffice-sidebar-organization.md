# Backoffice sidebar organization — 2026-11-05

User requests nesting Amenities/Cities beneath Buildings, ordering Guest Services,
Guest Guides, Blog Posts, and grouping FAQ/Testimonials/Forms beneath Content.
The user explicitly chooses **a heading with options always visible**, not a dropdown.

Root handles this small presentation change on local main, base `c9484b6`.
Preserve the preceding uncommitted Pages list-order change and unrelated untracked
Central Hill base-logo PNG. No agents, database changes or public content changes.

## Result

Website:
- Pages
- Buildings: Amenities, Cities
- Guest Services: existing service categories
- Guest Guides
- Blog Posts: existing blog categories and authors

Content (heading, options always visible):
- FAQ
- Testimonials
- Forms

Overview remains before Website. CRM, Translations and System follow Content.
Existing route URLs, staff roles, active-link behavior and catalogue child expansion
remain intact. EN/PT/ES/FR headings and guest catalogue labels are provided.

## Owned changes

- Backoffice `types.ts`/`registry.ts`: add `website` group before existing `content`.
- Pages, Buildings, Geography, Services, Guides and Blog `admin/screens.ts`: website
  contributions, Cities parent/order and Blog Posts ordering after Guides.
- FAQ/Testimonials `admin/screens.ts`, Forms `contract.ts`: Content order.
- `messages/{en,pt,es,fr}.json`: Website heading and Guest Services/Guides labels.
- Backoffice/Geography READMEs, this spec and current visual handoff.

No nav renderer change is needed: the existing group heading and child rendering
already express the selected structure. No href/type changes beyond the group ID.

## Delivery boundary

After local iteration, user authorizes the combined BO checkpoint commit before clear,
without push/deployment. Resolve its hash with `git log -1`; earlier boundaries below
record the original implementation scope.

Local source only; no commit, push, deploy or restart of the stopped localhost3071
requested. Aesthetic L0: user-owned review, no automatic tests, check suites or
browser QA. No database, media, form submission, email or reservation requests.
