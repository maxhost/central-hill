import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "./cn";

/**
 * Call to action at the bottom of a detail page's `StickyAside`, under a `TocList`: optional
 * 16:10 photo, eyebrow, serif title, short copy and a full-width accent button. Ported from the
 * `.aside-cta` of `mock/blog-post.html` (owners estimate) and `mock/guide-detail.html` (stay with
 * us, with photo).
 *
 * A hairline and 26px/24px of space separate it from the TOC above (`divided`, the default). At
 * ≤980px the aside's TOC is hidden (the collapsible `TocList` sits above the content instead), so
 * the separator goes too and the CTA is the whole card. Pass `divided={false}` when nothing sits
 * above it (no TOC).
 *
 * Presentational, no i18n and no `@core/media`: strings arrive translated and `image` is a
 * caller node (a `MediaImage` or `<img>`) that fills the frame. An absolute http(s) `href` opens
 * in a new tab, like `ButtonLink`.
 */
export function AsideCta({
  image,
  eyebrow,
  title,
  body,
  cta,
  divided = true,
  className,
}: {
  image?: ReactNode;
  eyebrow?: string;
  title: string;
  body?: string;
  cta: { label: string; href: string };
  /** Separate it from a TOC above (hairline + spacing above 980px). */
  divided?: boolean;
  className?: string;
}) {
  const external = /^https?:\/\//i.test(cta.href);
  return (
    <div
      className={cn(
        divided &&
          "mt-[26px] border-t border-line pt-6 max-[980px]:mt-0 max-[980px]:border-t-0 max-[980px]:pt-0",
        className,
      )}
    >
      {image ? (
        <div className="mb-[18px] aspect-[16/10] overflow-hidden rounded-[6px] [&_img]:block [&_img]:size-full [&_img]:object-cover">
          {image}
        </div>
      ) : null}
      {eyebrow ? (
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">
          {eyebrow}
        </span>
      ) : null}
      <h3 className="font-serif text-[22px] font-medium leading-[1.2] tracking-[-0.015em] text-ink">{title}</h3>
      {body ? <p className="mt-2 text-[14px] leading-[1.55] text-ink-soft">{body}</p> : null}
      <Link
        href={cta.href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
        className="mt-[18px] flex w-full cursor-pointer items-center justify-center gap-[0.5em] rounded-[3px] border border-transparent bg-accent px-7 py-[14px] text-[14px] font-medium tracking-[0.01em] text-white transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-accent-deep"
      >
        {cta.label}
      </Link>
    </div>
  );
}
