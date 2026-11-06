# Owners: one Element entry per section — 2026-11-05

User explicitly requests the same consolidation as Home for
`/admin/pages/owners`. Source review confirms the existing generic outline exposed
each section and its individual fields. Enable existing selectAsGroup metadata
for every Owners section, reusing the shared selector/inspector behavior already
implemented for Home.

One option per block opens all its fields: Hero, earnings form, Figures (including
its merged stats_title), Why, Services, Plans, Journey, Dashboard, Testimonials,
FAQ and closing CTA. Clicking a child annotation or retaining an earlier child
selection opens that complete block. Nested lists/buttons remain editable within
their section. SEO keeps its dedicated toolbar. Existing blocks/order and FAQ/
stats grouping remain intact; no schema/content/URL/locale/preview-transport changes.

Root-only write set: Pages admin/home-contextual.ts, Pages/Backoffice READMEs,
this spec and current visual handoff. Main/509d785 plus all prior pending work
preserved, including untracked files and unrelated base-logo PNG. Other Pages'
selection is outside this follow-up; Home consolidation remains.

L0: source review only, user validates on running3071. No automated tests, lint,
typecheck, build, browser QA/detector, DB write, save/publish/upload, commit,
push/deploy or restart. Earlier functional verification does not cover this later
UI refinement. The public website and content lifecycle are unchanged.
