import Link from "next/link";
import { MediaImage } from "@core/media";
import type { Locale } from "@core/db/columns";
import type { PostSummary } from "../../contract";
import { CategoryTag } from "./category-tag";
import { PostMeta, formatPostMonth } from "./post-meta";

// Left cell of the 1.15fr/.85fr split inside the 1240px/28px wrap (≈ 1.15/2 × 1184px), full
// width once the grid collapses to one column at 880px.
const FEATURED_SIZES = "(max-width: 880px) 100vw, 680px";

/** `core/media`'s `mediaImgTag` fallback when there is no asset (it isn't exported). */
const EMPTY_SRC = "/placeholders/building.svg";

const IMG_CLASS = "absolute inset-0 h-full w-full object-cover";

/**
 * Blog listing "Featured" card — the locked mock `article.featured` (`mock/blog.html`), ported
 * 1:1 into Tailwind: a bordered `surface` panel split `1.15fr / .85fr` (photo left, min 340px
 * tall, cover-cropped; body right, `46px 48px` padding, vertically centred), stacking to one
 * column under 880px (photo min 240px, body `34px 30px`). The body is the category tag
 * (`CategoryTag`, DB colour), a serif `h3` (`clamp(26px,2.6vw,36px)`, `1.12` leading,
 * `16px 0 14px` margins), the excerpt (`16px`, `ink-soft`), the meta line (`PostMeta`: byline ·
 * month-year · reading time) and the "Read Article →" link in `accent-deep`. The `.mk`
 * wrapper's inherited `line-height:1.6` is restated on the root (`leading-[1.6]`), and the `h3`
 * carries `mock.css`'s serif `500` / `-0.015em` / `ink`.
 *
 * As in the mock, only the read link is an anchor (not the whole card); it goes to the
 * article detail, `/${locale}/blog/${post.slug}`.
 *
 * **Blog-only, not a `core/ui` primitive**: it owns its `PostSummary` coupling. Labels come
 * pre-translated from the caller (`blog.byAuthor`, `blog.readingMinutes`, `blog.readArticle`),
 * so the component stays presentational and server-safe.
 *
 * Image: `MediaImage` (absolute-filling the left cell, `priority` — it sits near the top of
 * the listing) when the cover has a URL and real dimensions; otherwise the same plain `<img>`
 * `mediaImgTag` emits for missing/dimensionless media (the asset URL or the building
 * placeholder SVG), alt falling back to the post title — GuideCard's approach.
 */
export function FeaturedPost({
  post,
  locale,
  bylineLabel,
  readingTimeLabel,
  readLabel,
}: {
  post: PostSummary;
  locale: Locale;
  /** Pre-translated "By {author}" (`blog.byAuthor`). */
  bylineLabel: string;
  /** Pre-translated "{n} min read" (`blog.readingMinutes`), or null when unknown. */
  readingTimeLabel: string | null;
  /** Pre-translated "Read Article" label (the arrow is appended here). */
  readLabel: string;
}) {
  const cover = post.cover;
  const alt = cover?.alt || post.title;

  return (
    <article className="grid grid-cols-[1.15fr_0.85fr] overflow-hidden border border-line bg-surface leading-[1.6] text-ink max-[880px]:grid-cols-1">
      <div className="relative min-h-[340px] max-[880px]:min-h-[240px]">
        {cover?.url && cover.width > 0 && cover.height > 0 ? (
          <MediaImage data={{ ...cover, alt }} className={IMG_CLASS} sizes={FEATURED_SIZES} priority />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- `mediaImgTag`'s unoptimised fallback (no asset / no dimensions)
          <img src={cover?.url || EMPTY_SRC} alt={alt} className={IMG_CLASS} loading="eager" decoding="async" />
        )}
      </div>
      <div className="flex flex-col justify-center px-12 py-[46px] max-[880px]:px-[30px] max-[880px]:py-[34px]">
        <div>
          <CategoryTag category={post.category} />
        </div>
        <h3 className="mt-4 mb-[14px] font-serif text-[clamp(26px,2.6vw,36px)] font-medium leading-[1.12] tracking-[-0.015em] text-ink">
          {post.title}
        </h3>
        {post.excerpt ? <p className="mb-[22px] text-base text-ink-soft">{post.excerpt}</p> : null}
        <PostMeta
          byline={bylineLabel}
          date={formatPostMonth(post.publishedAt, locale)}
          readingTime={readingTimeLabel}
        />
        <Link
          href={`/${locale}/blog/${post.slug}`}
          className="mt-6 inline-flex items-center gap-[6px] text-sm font-semibold text-accent-deep"
        >
          {readLabel} →
        </Link>
      </div>
    </article>
  );
}
