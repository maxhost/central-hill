# Decisions: index

**Authoritative source:** `docs/decisions/README.md`. All ADRs live inline in that one file,
each anchored `<a id="NNNN">`. This page only indexes them; do not edit ADRs here and do not
create ADRs under `.glados/`. New cross-cutting decisions are added to `docs/decisions/README.md`
(CLAUDE.md golden rules 3 and 6).

Proposed but **not accepted**: `docs/parqueado.md` (parked items, e.g. the draft "ADR 0033"
for a unified icon system, and a dark `SectionHead` variant). Treat them as open questions,
not rules.

⚠️ **Numbering collision:** `docs/decisions/README.md` already contains an **accepted ADR 0033**
("Home's section components move into `core/ui`…", accepted 2026-10-03). It is missing from
that file's own index list, and the parked icon-system draft also calls itself 0033. Use the
heading text, not just the number, when citing either.

## Accepted ADRs (headings as written)

- 0001 — Custom build, not WordPress/Webflow
- 0002 — Rendering: Next.js ISR
- 0003 — Hosting: Netlify + Neon + R2
- 0004 — Monolith, host-split surfaces
- 0005 — Vertical slices + ownership + contracts
- 0006 — i18n model
- 0007 — LLM translation pipeline + human review
- 0008 — Booking via Avantio; Apartment is ours
- 0009 — Auth: Better Auth on Neon
- 0010 — Additive, forward-only migrations
- 0011 — Leads handling
- 0012 — Editable fixed pages via `page_content`; no generic block builder
- 0013 — Blog post body as a constrained portable-JSON block set
- 0014 — Lead capture shape: `lead` + `lead_field` KV + explicit GDPR consent
- 0015 — Data residency: production Neon project in an EU region
- 0016 — `core/email`: provider-interface seam, vendor deferred
- 0017 — Backoffice routing: interim path `/admin`; host split deferred
- 0018 — Media R2 upload: presigned direct PUT + serve-time resizing
- 0019 — `core/i18n` content + slug write seam (admin write path)
- 0020 — S13 seo-geo: sitemaps/robots/llms.txt as root routes + kernel JSON-LD/slug additions
- 0021 — S14 translation-pipeline: kernel target-write/read seam + provider interface + review inbox
- 0022 — Home restored to the approved mockup; Warm Editorial locked as the production palette
- 0023 — Pages drop draft/published state; Home editor gains the dual-CTA block + optional images
- 0027 — Optimised delivery: blurhash placeholders + `mediaImgTag()` for HTML-string builders
- 0024 — R2 provisioning: EU bucket, endpoint from env, immutable signed cache policy
- 0025 — Upload-time normalisation: cap the master at 3000px, bake in orientation
- 0026 — `media_asset` becomes two-backend (R2 | Stream); Stream vendor still unratified
- 0028 — AVIF before WebP in `images.formats`
- 0029 — Trace the libvips shared object into the function bundle
- 0030 — Media uploads happen on save, not on pick
- 0031 — Home reduced to a guest-facing funnel
- 0032 — Home gains a services & partners carousel
- 0033 — Home's section components move into `core/ui` as a reusable library
