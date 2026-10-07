import Link from "next/link";
import { MediaImage } from "@core/media";
import type { Locale } from "@core/db/columns";
import type { PostSummary } from "../../contract";
import { CategoryTag } from "./category-tag";
import { PostMeta, formatPostMonth } from "./post-meta";

// One cell of the listing's 3/2/1-column grid (`mock.css`'s `.pf-grid` breakpoints) — the same
// `sizes` as the Guides/Buildings listing cards, which sit in the same grid.
const CARD_SIZES = "(max-width: 680px) 100vw, (max-width: 980px) 50vw, 420px";

/** `core/media`'s `mediaImgTag` fallback when there is no asset (it isn't exported). */
const EMPTY_SRC = "/placeholders/building.svg";

const IMG_CLASS =
  "h-full w-full object-cover transition-transform duration-[600ms] ease-in-out group-hover:scale-[1.04]";

/**
 * Blog listing "From the Journal" card — the locked mock `article.pcard` (`mock/blog.html`: the
 * shared `mock.css` `.pcard`/`.ph`/`.pbody` rules plus the page's own `.pcard .pbody|.ctag|h3|
 * .excerpt|.card-meta|.read-link` rules), ported 1:1 into Tailwind. The shared `.pcard` parts
 * (border/surface, hover lift + shadow, 4:3 photo with hover scale, body padding, serif `h3`)
 * use exactly the classes of the Guides listing's `GuideCard` (itself mirroring the Buildings
 * listing's card) — mirrored, not imported (another slice's internals). The `.mk` wrapper's
 * inherited `line-height:1.6` is restated on the root (`leading-[1.6]`).
 *
 * Body: `CategoryTag` (DB colour, `14px` below), a `21px/1.18` serif title (`8px` below), the
 * excerpt (`14.5px`, `ink-soft`, `16px` below), `PostMeta` (month-year · reading time — no
 * byline on cards, `14px` below) and the "Read Article →" line (`13.5px/600`, `accent-deep`).
 *
 * **Whole card is the link** (`/${locale}/blog/${post.slug}`), unlike the mock where only the
 * "Read Article →" anchor is clickable: consistency with the sibling listing cards (GuideCard,
 * Buildings) that are whole-card links, a bigger hit target, and one tab stop per card. The read
 * line is therefore a plain `<span>` (no nested anchor). `FeaturedPost` keeps the mock's
 * read-link-only behaviour (a wide split panel, not a grid card).
 *
 * **Blog-only, not a `core/ui` primitive**: it owns its `PostSummary` coupling. Labels come
 * pre-translated from the caller (`blog.readingMinutes`, `blog.readArticle`), so it stays
 * presentational and server-safe. Not `PostCard` (the article detail's related posts — an older,
 * borderless look this change leaves untouched so the detail page renders exactly as before).
 *
 * Image: `MediaImage` when the cover has a URL and real dimensions (alt falls back to the post
 * title); otherwise the same plain `<img>` `mediaImgTag` emits for missing/dimensionless media
 * (the asset URL or the building placeholder SVG) — GuideCard's approach.
 */
export function JournalCard({
  post,
  locale,
  readingTimeLabel,
  readingTimeIcon,
  readLabel,
  priority,
}: {
  post: PostSummary;
  locale: Locale;
  /** Pre-translated "{n} min read" (`blog.readingMinutes`), or null when unknown. */
  readingTimeLabel: string | null;
  /** Iconoir name before the reading time (the `reading_time` site icon). */
  readingTimeIcon: string;
  /** Pre-translated "Read Article" label (the arrow is appended here). */
  readLabel: string;
  priority?: boolean;
}) {
  const cover = post.cover;
  const alt = cover?.alt || post.title;

  return (
    <Link
      href={`/${locale}/blog/${post.slug}`}
      className="group block overflow-hidden border border-line bg-surface leading-[1.6] text-ink transition-[transform,box-shadow] duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_20px_44px_-26px_rgba(0,0,0,0.42)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {cover?.url && cover.width > 0 && cover.height > 0 ? (
          <MediaImage data={{ ...cover, alt }} className={IMG_CLASS} sizes={CARD_SIZES} priority={priority} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- `mediaImgTag`'s unoptimised fallback (no asset / no dimensions)
          <img
            src={cover?.url || EMPTY_SRC}
            alt={alt}
            className={IMG_CLASS}
            {...(priority ? { loading: "eager" as const, fetchPriority: "high" as const } : { loading: "lazy" as const })}
            decoding="async"
            {...(cover?.width && cover.width > 0 ? { width: cover.width, height: cover.height } : {})}
          />
        )}
      </div>
      <div className="px-6 pt-[22px] pb-[26px]">
        <CategoryTag category={post.category} className="mb-[14px]" />
        <h3 className="mb-2 font-serif text-[21px] font-medium leading-[1.18] tracking-[-0.015em] text-ink">
          {post.title}
        </h3>
        {post.excerpt ? <p className="mb-4 text-[14.5px] text-ink-soft">{post.excerpt}</p> : null}
        <PostMeta
          date={formatPostMonth(post.publishedAt, locale)}
          readingTime={readingTimeLabel}
          readingTimeIcon={readingTimeIcon}
          className="mb-[14px]"
        />
        <span className="inline-flex items-center gap-[6px] text-[13.5px] font-semibold text-accent-deep">
          {readLabel} →
        </span>
      </div>
    </Link>
  );
}
