# Mock Coverage Audit — pages vs client briefs

## ✅ Re-audit result (2026-06-08, after fixes) — ALL 10 PAGES PASS

Every previously-flagged content gap was closed and re-verified by a second per-page agent. No
regressions, no emojis (Iconoir throughout), footers consistent site-wide.

| Page | Re-audit verdict | Gaps closed |
|---|---|---|
| Home | Complete | stats heading, brief-verbatim testimonials + owner cards, restored copy, "by Central Hill" ×3, footer toggle |
| Owners | Pass | 10-anchor sub-nav bar (ids verified), full "Central Hill Apartments" brand, footer toggle |
| Buildings | Pass | Stats band + Earnings calculator added, street addresses ×14, brief headline/teasers, "by Central Hill" ×14 |
| Building detail | Pass | brief-verbatim long description + "The Neighbourhood", H1 suffix |
| Real Estate | Excellent | select "Mixed", footer toggle; all sections intact |
| Guests | Pass | footer toggle; full coverage |
| Services | Pass | all 7 services, footer toggle |
| What to Do | Pass | Families & Kids + Groups & Friends + Secrets added (11 cards, all brief sub-pages covered) |
| About | Pass | full hero mission, www.centralhill.pt line, "Independently Verified" heading |
| Blog | Excellent | footer toggle; 9 articles + 5 category colours verbatim |

**Remaining items are all build-stage (not mock gaps):** hero video/GIF, per-service & per-guide
detail sub-pages, functional search/filters/forms, and the `€XXM+` revenue placeholder (which mirrors
the brief's own placeholder). These are resolved when the real Next.js app (S0) is built.

---

## Original audit (pre-fix) — kept for the record

Audit date: 2026-06-08. One agent per page compared each mock against its `cliente-docs/` brief.
Verdict scale: Excellent / Complete / Mostly complete / Partial. Items are content-fidelity gaps —
not design-mock limitations (static image instead of video/GIF is expected and noted as low priority).

## Scorecard

| Page | Brief | Verdict | Real gaps to address |
|---|---|---|---|
| Home | 0 | Mostly complete | Stats band heading missing; testimonial quotes rewritten (not brief copy); footer owner/guest toggle; "by Central Hill" suffix dropped |
| Owners | 1 | Complete | Owner sub-nav anchor bar not built; brand shortened to "Central Hill"; footer swapped a link |
| Buildings (listing) | 2 | **Partial** | **Missing Section 3 (stats band) + Section 4 (earnings calculator)**; per-card street addresses dropped; teasers/headline rewritten |
| Building detail | 2.1 | Pass | Long description is mock copy (brief copy is "ready for review" → source of truth); stats filled where brief had "—" |
| Real Estate | 3 | Excellent | Capability-Statement CTA is a dead link; minor select wording |
| Guests | 4 | Excellent | Hero static image vs briefed GIF (build-time); footer link label |
| Services | 4.1 | Pass | All 7 services present; per-service **detail sub-pages not built** (brief asks for them) |
| What to Do | 4.2 | Strong | **Missing 2 sub-pages: Families & Kids, Groups & Friends**; "Secrets" merged into Day Trips; sub-pages non-navigable |
| About | 5 | Excellent | Hero mission statement shortened; `www.centralhill.pt` line omitted |
| Blog | 6 | Excellent | Near-perfect (all 9 article titles + 5 category colours verbatim); footer toggle only |

## Cross-cutting issues (fix once, applies to many pages)
1. **Footer contract:** the brief's "Are you a guest or an owner? [Owner]/[Guest]" toggle is missing
   site-wide; "Owner Testimonials" was replaced by "Real Estate Partnerships". → fix in the shared
   footer (kernel-level contract change).
2. **Hero media:** several briefs specify a muted looped video/GIF; mocks use static images. Expected
   for a static preview — wire real video at build (S0). Low priority for the mock.
3. **Brand name:** briefs use "Central Hill Apartments" in body copy; mocks shortened to "Central
   Hill". Decide house style and apply consistently.
4. **"by Central Hill" suffix** on building/property names dropped in listing/detail/home cards.
5. **Copy fidelity:** some sections use freshly written premium copy instead of the brief's exact
   text (most notable: Home testimonial quotes are invented; Home owner-benefit cards shortened).
   Acceptable for a design preview; restore verbatim where copy carries commercial substance.

## Priority queue (real content gaps, highest first)
- **HIGH — Buildings listing:** add the missing **stats band** and **earnings calculator** sections;
  restore per-card street addresses.
- **HIGH — Home:** add the "A Trusted and Leading Company" stats heading; restore real testimonial
  quotes (or label as placeholder); add footer owner/guest toggle.
- **MED — What to Do:** add **Families & Kids** and **Groups & Friends** categories; surface "Secrets".
- **MED — Footer (kernel):** add owner/guest toggle + "Owner Testimonials" link across all pages.
- **MED — Owners:** build (or confirm dropping) the sticky sub-nav anchor bar.
- **MED — About:** restore full hero mission statement + website line.
- **LOW — Real Estate:** wire the Capability-Statement download; align select option wording.
- **LOW — copy/brand consistency:** "Central Hill Apartments" vs "Central Hill"; "by Central Hill"
  suffix; un-truncate shortened CTA helper notes.
- **FUTURE (build stage):** per-service detail pages (Services), per-guide sub-pages (What to Do),
  hero videos/GIFs, functional search/filter/forms.

## Overall
The site is a faithful, premium representation of the briefs. Most pages are Excellent/Complete. The
only page with a structural shortfall is the **Buildings listing** (two missing owner-conversion
sections). Everything else is small content/copy reconciliation plus the shared footer toggle.
