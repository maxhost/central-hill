# Slice `blog` (S4)

Editorial blog — listing + article detail. Public, statically rendered (ISR), 4 locales.
See `docs/vertical-slices.md` → S4, `docs/content-briefs.md` → §6, ADR 0013 (body block set).

## Owns

**Tables** (`schema.ts`, migration `0000`): `blog_category`, `author`, `blog_post`,
`blog_post_related`. One category per post, no tags. Author = brand byline. Exactly 3 curated
related posts. Translatable (**[T]**) fields — `title`, `excerpt`, `body`, category/author `name`,
`meta_*`, `cta_label` — live in the `translation` table (`core/i18n`), not as columns. The post
`body` is one portable-JSON field (`field='body'`), validated by `body.ts` (ADR 0013).

## Contract (`contract.ts`)

Types: `PostSummary`, `PostDetail`, `CategoryRef`, `AuthorRef`, `PostBody`, `BodyBlock`.
Reads: `listPosts(locale)`, `getFeaturedPost(locale)`, `listCategories(locale)`,
`getPostBySlug(locale, slug)`, `listPostParams()`.
Cache tags: `BLOG_TAGS.list` = `blog_post-list`, `BLOG_TAGS.post(id)` = `blog_post:<id>`.

All reads are `unstable_cache`-wrapped (keyed by locale) and tagged so a publish busts them.
Consumed by S9 pages (featured/teasers), S13 seo-geo (URLs), S14 translation-pipeline.

## Routes

- `app/[locale]/blog/page.tsx` → `ui/blog-listing.tsx` (hero · featured · category tabs · grid · newsletter)
- `app/[locale]/blog/[slug]/page.tsx` → `ui/blog-post.tsx` (header · hero · body blocks · CTA · 3 related)

Both: `generateStaticParams` + `generateMetadata` (`core/seo` `buildMetadata`, hreflang from the
per-locale slug table) + `revalidate`. Article detail emits `BlogPosting` + `BreadcrumbList` JSON-LD.

## i18n

UI chrome under the `blog` namespace in `messages/{en,pt,es,fr}.json` (all four authored).
Content translations resolve through `core/i18n` with the source-locale (`en`) fallback +
`approved`-only gating for target locales (docs/seo-i18n.md).

## Revalidation (`server/publish.ts`)

`revalidateBlogList()` / `revalidatePost(id, slugByLocale)` — the single place that busts blog
ISR caches on publish. Called by the blog admin actions once the backoffice shell (S12) lands.

## Deferred (not in this slice's first cut)

- **Admin CRUD** (`admin/`): plugs into the backoffice shell **S12** (wave 1) — list/form,
  body-block editor, translation review. Not buildable before S12.
- **Newsletter submit**: `ui/components/newsletter-signup.tsx` is UX-complete but the submit wires
  to **S10 leads** `submitLead({ kind: "newsletter" })` (ADR 0011/0014) when S10 lands.
- **Sitemap/llms.txt entries**: produced by **S13** from `listPostParams()` / the contract.

## Kernel completed alongside (S0 surface, new files only)

`core/revalidate`, `core/seo` (`buildMetadata` + JSON-LD builders + `<JsonLd>`),
`core/i18n/content` (translation + slug reads), `core/media` (reads + `<MediaImage>` + `mediaUrl`),
`core/ui` (Container, Section, Eyebrow, ButtonLink, `cn`) + design tokens in `app/globals.css`.

## Tests

`tests/blog.test.ts` — body block-set validation. Run: `npx tsx --test src/slices/blog/tests/blog.test.ts`.
