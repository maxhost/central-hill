# Contracts: where they live

**Authoritative sources:** each slice's `src/slices/<slice>/contract.ts` (the only surface
other slices may import, CLAUDE.md golden rule 2) and its `README.md` ("Contract" section).
There is no REST/OpenAPI surface: the only HTTP route is Better Auth (`src/app/api/auth/[...all]`).
Mutations are Server Actions in `src/slices/<slice>/admin/actions.ts` (staff) and the leads
submission actions (public).

| Slice | Contract | Cache tags declared |
|---|---|---|
| geography | `src/slices/geography/contract.ts` | yes (`city-list`, …) |
| buildings | `src/slices/buildings/contract.ts` | yes (`building-list`, `building:<id>`) |
| apartments | `src/slices/apartments/contract.ts` | yes (`apartment-list`, …) |
| blog | `src/slices/blog/contract.ts` | yes |
| services | `src/slices/services/contract.ts` | yes (`service-list`); detail JSON schema in `src/slices/services/detail.ts` |
| guides | `src/slices/guides/contract.ts` | yes (`guide-list`, …) |
| testimonials | `src/slices/testimonials/contract.ts` | yes (`testimonial-list`) |
| faq | `src/slices/faq/contract.ts` | yes (`faq-list`) |
| pages | `src/slices/pages/contract.ts` | yes; per-page Zod schemas in `src/slices/pages/schemas/` |
| leads | `src/slices/leads/contract.ts` | — (forms + admin inbox) |
| settings | `src/slices/settings/contract.ts` | yes (`globals`, nav) |
| backoffice | `src/slices/backoffice/contract.ts` | — (admin shell + form/media primitives) |
| seo | `src/slices/seo/contract.ts` | — (consumes others) |
| translation | `src/slices/translation/contract.ts` | — (review inbox, `generateDrafts`) |

Kernel seams that work like contracts (change-controlled, ADR required): `src/core/*/index.ts`.
In particular `src/core/i18n/content.ts` / `content-write.ts` (the [T] read/write seam,
ADR 0019/0021), `src/core/media` (ADR 0018/0024–0030), `src/core/auth` (`requireStaff`) and
`src/core/ui/index.ts` (design-system exports).

Changing a contract you do not own: open a Contract Change Request
(`docs/multi-agent-workflow.md` → "Contract Change Request").
