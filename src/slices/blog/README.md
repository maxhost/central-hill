# Slice `blog` (S4)

## Individual posts: form and continuous rich text (ADR0059)

The locale workflow remains complete draft/published snapshots (ADR0057), but the
post authoring UI is now a form: separate title/excerpt, a continuous Tiptap body
with formatting and inserted media, and cover/SEO/social metadata forms. It no
longer uses the Pages visual canvas/inspector. The older body-editor/form notes
below describe historical code; the active route mounts PostLocaleEditor and
PostRichTextEditor. Pages listing/article-sidebar editors retain their own UI.

BodyBlock preserves all eight legacy types and plain text. Optional inline runs
encode bold/italic/safe links; lists have aligned optional inline_items. Plain
text must equal concatenated runs. React renders validated elements, no stored
HTML. No migration or existing snapshot rewrite. Locale Save/Publish, revisions,
shared EN references, media queue and dirty guards retain their existing policy.

Execution and QA status: [Blog form](../../../docs/specs/blog-form-editor-execution.md).
Implemented on8064fab with scoped independent functional QA; see the final
[delivery](../../../docs/specs/blog-form-editor-delivery.md) and
[QA](../../../docs/specs/blog-form-editor-qa.md). Real synthetic Save/Publish,
reload, formatting, two uploads and desktop/mobile cases passed. Old private preview endpoints remain for
compatibility; they are not the active article authoring interface.


## Individual articles: locale draft/publication —2026-11-05

ADR0057 supersedes the source-only post editor/workflow described historically
below. `/admin/posts/new` and `/admin/posts/[id]` use independent EN/ES/PT/FR
workspaces with Save draft and Publish, manual translation and private ephemeral
preview through the real BlogPostRenderer. Shared reference fields are authored
in EN; each published locale freezes its own snapshot. Body/CTA links/SEO and
reading time are localized; an absent legacy reading time stays absent.

Migration0024 adds Blog-owned blog_post_locale_content (unique post_id/locale),
nullable draft/published versioned JSON and persistent monotonic revision. Public
reads use published only; absent rows preserve read-only legacy compatibility,
while published=NULL stays unpublished. Staff bootstrap preserves current public
versions and pending target text as drafts. Original translations/slugs remain.
New identity slug reservation never publishes; existing locale slugs are immutable
in this pilot. Old savePost/Translation actions/generator cannot publish articles.
Categories/authors retain their existing editors and translation workflow.

Save/Publish use CAS and parent archive guards. Blog graph mutations acquire an
advisory transaction lock in a Neon HTTP noninteractive batch, then check references
with a fresh READ COMMITTED snapshot. Delete refuses incoming draft/published
related-post references (and applicable legacy joins) rather than changing other
articles. Category/author deletion also checks snapshot references.

The editor preserves all started-locale local work, handles conflicts explicitly,
flushes media only for the selected document and shares the Backoffice shell.
Preview never writes/publishes/uploads; forms and links are inert. The public
listing/detail/featured/related/metadata/sitemap consume published locales only.
Historic seed-blog.ts writes are retired; DRY remains read-only.

See [spec](../../../docs/specs/entity-locale-editors-spec.md),
[execution](../../../docs/specs/blog-post-locale-editors-plan.md) and
[delivery](../../../docs/specs/blog-post-locale-editors-delivery.md).

## Shared article sidebar editor —2026-11-05

Pages' `/admin/pages/blog/article-sidebar` edits the shared CTA beside a localized,
illustrative article. `BlogArticlePreview` creates no post and supplies fixed
sample content plus the selected Blog locale snapshot to `BlogPostRenderer`.
Public `BlogPost` still reads the actual post and uses the same renderer; public
SEO, newsletter, related posts and per-post button precedence are preserved.
Private preview annotates the CTA inside the actual StickyAside and disables
newsletter submission. It emits no sample JSON-LD or public sample route.
Listing and sidebar views retain the existing complete Blog draft/publication
unit per locale. See `docs/specs/blog-article-sidebar-editor.md`.

## Newsletter provider —2026-11-03

Listing and article NewsletterSignup now embed BrevoNewsletterForm through the
Settings contract, sharing the public HTML form destination with the footer
modal. Their UI stays on the same form-card primitives, dark tone,480px column,
field/consent/button copy and spacing. Responses use localized acceptance/error
messages; a provider acceptance is not proof of completed double opt-in.
This band no longer creates a local Leads record. Private preview keeps the form
inert and explicitly disables submissions. User requested no automatic tests/QA
or real subscription sends; review is in localhost. Historical Leads wiring
descriptions below are superseded by this provider change.

## Blog page copy (2026-10-18)

The index now reads `getBlogPage(locale)` from the Pages contract for header and
search text, Journal title and newsletter copy. Blank overrides
inherit the existing localized messages per field. The article newsletter consumes
the same page fields. Listing metadata uses Pages' `buildBlogMetadata`, including
its editable localized title/description and social image. Cards, categories,
article fields, filtering and pagination keep their existing source/behavior;
the search field still has no search implementation in this scoped delivery.

The Blog hero, featured, journal and shared newsletter eyebrows are removed from
public rendering (2026-11-01). Pages preserves their old values with `adminHidden`
and hides the four controls in both BO editors, including the entire featured
copy group. The shared article newsletter also omits its eyebrow.

The listing uses the shared photo `Hero` (2026-11-01), with editable
`hero.image_media_id` in Pages→Blog, a decorative priority background and the
existing search field. Until selected, the background is the site's existing
Lisbon stock photo. The title, introduction, search placeholder and accessible
search label remain locale-owned. The Pages adapter collects/validates hero and
OG image references and supports both in local preview. See
`docs/specs/blog-hero-background.md` for functional checks and limits.

After From the Journal and before Newsletter, the listing embeds Pages'
`PublishedHomeDualCta`: the same Owners/Guests photo panels as Home, with its
published locale text/images (edited in Pages→Home) and Settings contact lines.
This also appears in Blog's private preview, always using Home's published
content. Home drafts remain private; Home's locale cache dependency carries
publication updates through to Blog. No separate Blog CTA fields are stored.

Editorial blog — listing + article detail. Public, statically rendered (ISR), 4 locales.
See `docs/vertical-slices.md` → S4, `docs/content-briefs.md` → §6, ADR 0013 (body block set).

## Owns

**Tables** (`schema.ts`, migration `0000`): `blog_category`, `author`, `blog_post`,
`blog_post_related`. One category per post, no tags. Author = brand byline. Exactly 3 curated
related posts. Translatable (**[T]**) fields — `title`, `excerpt`, `body`, category/author `name`,
`meta_*`, `cta_label` — live in the `translation` table (`core/i18n`), not as columns. The post
`body` is one portable-JSON field (`field='body'`), validated by `body.ts` (ADR 0013).

## Contract (`contract.ts`)

Types: `PostSummary`, `PostDetail`, `CategoryRef`, `AuthorRef` (with the optional translated
`bio`), `PostBody`, `BodyBlock`.
Reads: `listPosts(locale)`, `getFeaturedPost(locale)`, `listCategories(locale)`,
`getPostBySlug(locale, slug)`, `listPostParams()`.
Cache tags: `BLOG_TAGS.list` = `blog_post-list`, `BLOG_TAGS.post(id)` = `blog_post:<id>`.

All reads are `unstable_cache`-wrapped (keyed by locale) and tagged so a publish busts them.
Consumed by S9 pages (featured/teasers), S13 seo-geo (URLs), S14 translation-pipeline.

## Routes

- `app/[locale]/blog/page.tsx` → `ui/blog-listing.tsx` (header · category tabs · featured · grid · newsletter)
  — the category tabs are `ui/components/category-tabs.tsx` (`core/ui` `ChipBar`, fed by
  `listCategories(locale)`, tagged `blog_post-list`). They **filter the grid** client-side:
  `CategoryFilterProvider` wraps tabs + Featured + grid, each grid card sits in a
  `CategoryFilterItem` (page stays ISR — no `searchParams`). Visibility rules are pure in
  `category-filter-logic.ts` (unit-tested in `tests/blog.test.ts`).
  — the Featured section is `ui/components/featured-post.tsx`
  (`FeaturedPost`), fed by `getFeaturedPost(locale)` (tagged `blog_post-list`); omitted when there
  is no featured post, and never category-filtered.
  Its image and Read Article action both link to the corresponding localized post.
  — "From the Journal" is `SectionHead` (`blog.latestTitle`) over a 3/2/1
  grid of `ui/components/journal-card.tsx` (`JournalCard`, a whole-card link mirroring the Guides
  listing card), fed by `listPosts(locale)` (published, newest first) **minus the featured post
  (by id)**. "Load more" (`CategoryLoadMore`, `blog.loadMore`) reveals already-rendered cards
  `JOURNAL_PAGE_SIZE` (9) at a time on "All" and renders nothing when everything fits; a
  category chip always shows all its cards. Shared card pieces: `category-tag.tsx`
  (`CategoryTag`, the mock `.ctag` with the DB colour), `post-meta.tsx` (`PostMeta` byline · date ·
  reading time + `formatPostMonth`), `category-color.ts` (`safeSwatch`, the `#hex` check shared
  with the chips).
  — the newsletter band is `ui/components/newsletter-signup.tsx` (`NewsletterSignup`): `core/ui`
  `CenteredCtaBand` (Guides' closing band; its `children` action slot) wrapping the leads slice's
  `NewsletterForm` (`theme="dark"`, `source="blog"`; email + consent + submit → a `newsletter`
  lead), copy from `blog.newsletter.title|description`. The listing is fully
  componentised (no `.mk` subtree). Icons are `core/ui` `<Icon>` (ADR 0034); no `mock.css`.
- `app/[locale]/blog/[slug]/page.tsx` → `ui/blog-post.tsx`, the approved `mock/blog-post.html` on
  the service-detail skeleton, all `core/ui`: `DetailTitle` (Home / Blog / category; author ·
  `published_date` date · `reading_time` minutes) · cover in `MosaicGallery adaptive` · `DetailLayout`
  with the article (`ui/components/body-renderer.tsx`, the mock's `.article` prose; `callout` →
  `core/ui` `Callout` with the `callout_<variant>` site icon + `blog.callout.*`; `ul` bullets = the
  `list_bullet` site icon) + byline (initial disc, name, author `bio` or `blog.bylineFallback`), and a
  `StickyAside` with `TocList` ("In this article", h2 + h3 as sub; `collapsible` copy above the
  article ≤980px) + `AsideCta` from the pages contract's `getBlogAsideCta` (a post's own `cta`
  replaces only the button) · `NewsletterSignup` · related posts as the listing's `JournalCard` grid.
  Heading anchors come from `ui/components/headings.ts` (`headingIds` / `tocItems`, slug + `-2`,
  `-3` dedupe), the one source for both the TOC and the renderer.

Both: `generateStaticParams` + `generateMetadata` (`core/seo` `buildMetadata`, hreflang from the
per-locale slug table) + `revalidate`. Article detail emits `BlogPosting` + `BreadcrumbList` JSON-LD.

## i18n

UI chrome under the `blog` namespace in `messages/{en,pt,es,fr}.json` (all four authored).
Content translations resolve through `core/i18n` with the source-locale (`en`) fallback +
`approved`-only gating for target locales (docs/seo-i18n.md).

## Revalidation (`server/publish.ts`)

`revalidateBlogList()` / `revalidatePost(id, slugByLocale)` — the single place that busts blog
ISR caches on publish. Called by the blog admin actions once the backoffice shell (S12) lands.

## Backoffice (`admin/`) — category/author managers + post editor (S12)

Plugs into the backoffice shell. Contributes three `content`-group screens
(`admin/screens.ts` → `blogAdminScreens`): "Blog Posts" (30) with "Blog categories"
and "Authors" as submenus on post/category/author routes. Lists + editors mount under
`app/(admin)/admin/(panel)/{blog-categories,authors,posts}/…`.

- `admin/validation.ts` — `blogCategorySaveInput`, `authorSaveInput`, and
  `blogPostSaveInput` (the editor's post shape: `id?`, nullable optionals, `min(1)` on
  required [T] title/excerpt, `body` = the portable-JSON block array (ADR 0013),
  `related_ids` ≤3, `published_at` ISO/empty/null).
- `admin/queries.ts` (server-only) — list/edit/option reads for all three entities;
  `getPostForEdit` parses the stored `body` JSON and resolves cover/og/body-image previews.
- `admin/actions.ts` (`"use server"`, `requireStaff`-gated) — category/author save +
  delete (plain-column slug; deletes refuse while a post references them — RESTRICT FK),
  and `savePost` (post slug via the `core/i18n` write seam, ADR 0019; source [T]
  title/excerpt/cta/meta + the `body` JSON written as one field through the same seam;
  related rows replaced) / `deletePost` (cascades related, cleans translations + slugs).
  All bust the blog tags via `revalidateBlogList`/`revalidatePost`.
- `admin/ui/` — `category-list`/`category-form`, `author-list`/`author-form`,
  `list`/`post-form`, and `body-editor` (the portable-JSON block editor: heading,
  paragraph, list, image, quote, callout, divider, cta — add/remove/reorder).

## Deferred

- **Sitemap/llms.txt entries**: produced by **S13** from `listPostParams()` / the contract.

## Kernel completed alongside (S0 surface, new files only)

`core/revalidate`, `core/seo` (`buildMetadata` + JSON-LD builders + `<JsonLd>`),
`core/i18n/content` (translation + slug reads), `core/media` (reads + `<MediaImage>` + `mediaUrl`),
`core/ui` (Container, Section, Eyebrow, ButtonLink, `cn`) + design tokens in `app/globals.css`.

## Tests

`tests/blog.test.ts` — body block-set validation. `tests/blog-admin.test.ts` — the admin
save schemas (category/author/post + block body + related cap). `tests/headings.test.ts` — heading
anchor ids + TOC entries. Run: `npx tsx --test src/slices/blog/tests/*.test.ts`.

## Common Pages editorial integration

`BlogListingRenderer` accepts optional injected Pages content and private preview
annotations; the public listing uses the same renderer and retains slice catalogue queries.
Editorial draft/publish lives in Pages, while individual entity workflows remain here.
