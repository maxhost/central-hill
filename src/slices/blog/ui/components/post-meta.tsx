import { Fragment } from "react";
import type { ReactNode } from "react";
import { cn } from "@core/ui";

/**
 * Month + year of a post's `publishedAt` ("June 2025", "junho de 2025"), as the blog mock
 * prints it in the featured block and the card meta. `null` for unpublished/invalid dates.
 * (The article detail and `PostCard` use the long `dateStyle` instead — a different format.)
 */
export function formatPostMonth(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(iso));
  } catch {
    return null;
  }
}

/**
 * Blog post meta line — the mock's `.feat-meta` / `.card-meta` (`mock/blog.html`): a wrapping
 * flex row (`gap 7px`, `13px`, `ink-soft`) of items separated by a half-opacity `·`, the
 * reading time preceded by Iconoir's clock (`15px`, `line-height:1`). Ported 1:1.
 *
 * Every item is optional and pre-translated by the caller, so the same component serves the
 * featured block (byline · date · reading time) and the "From the Journal" cards (date ·
 * reading time, no byline); a missing item drops out together with its separator.
 *
 * Presentational and server-safe. The Iconoir stylesheet comes from the route's `mock.css`.
 */
export function PostMeta({
  byline,
  date,
  readingTime,
  className,
}: {
  /** e.g. "By Central Hill Apartments" (`blog.byAuthor`). */
  byline?: string | null;
  /** e.g. "June 2025" (`formatPostMonth`). */
  date?: string | null;
  /** e.g. "8 min read" (`blog.readingMinutes`). */
  readingTime?: string | null;
  className?: string;
}) {
  const items: ReactNode[] = [];
  if (byline) items.push(<span>{byline}</span>);
  if (date) items.push(<span>{date}</span>);
  if (readingTime) {
    items.push(
      <>
        <i className="iconoir-clock text-[15px] leading-none" aria-hidden="true" />
        <span>{readingTime}</span>
      </>,
    );
  }
  if (items.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-[7px] text-[13px] text-ink-soft", className)}>
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 ? (
            <span className="opacity-50" aria-hidden="true">
              ·
            </span>
          ) : null}
          {item}
        </Fragment>
      ))}
    </div>
  );
}
