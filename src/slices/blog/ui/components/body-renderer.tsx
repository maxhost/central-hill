import type { ReactNode } from "react";
import { MediaImage, type MediaImageData } from "@core/media";
import { Callout, type CalloutVariant, cn } from "@core/ui";
import { Icon } from "@core/ui/icon";
import type { BodyBlock, PostBody } from "../../contract";

/** Per-variant icon + label for the `callout` block (site icons + `blog.callout.*`). */
export type CalloutChrome = Record<CalloutVariant, { icon: string; label: string }>;

/**
 * Renders a post body — a typed switch over the closed block set (ADR 0013). No raw HTML:
 * inline images resolve from `media` (media_asset.id → image data); text renders escaped.
 *
 * Styled 1:1 to `mock/blog-post.html`'s `.article` rules: a `68ch` measure; `17px/1.7` `ink-soft`
 * paragraphs, the first one (when the body opens with a paragraph) as the `19px` `ink` lead;
 * serif `h2` `clamp(26px,3vw,34px)` with the optional `number` in `accent`, `h3` `21px` (h4
 * `18px`), all with `scroll-mt-[96px]` and the anchor id from `ids` (`headingIds`, shared with
 * the TOC); check-icon `ul` (the `list_bullet` site icon), serif `decimal-leading-zero` `ol`;
 * 3:2 figure + caption; serif blockquote on an accent rule; hairline `hr`; `callout` →
 * `core/ui` `Callout`; `cta` → the mock's `.btn btn-accent`.
 *
 * Vertical rhythm (the mock's `> * + *`, `h2 + *` and per-element margins) is resolved per
 * block here rather than with sibling selectors, so it never depends on CSS source order:
 * 20px between blocks, 52px above an `h2`, 34px above an `h3`, 14px after a heading, and the
 * figure/quote/rule/button margins of the mock. The root is a plain block, so vertical margins
 * collapse exactly as in the mock.
 *
 * Server-only (`<Icon>`).
 */
export function BodyRenderer({
  body,
  media,
  ids,
  bulletIcon,
  callouts,
  className,
}: {
  body: PostBody;
  media: Record<string, MediaImageData>;
  /** `headingIds(body)` — index-aligned anchor ids. */
  ids: readonly (string | undefined)[];
  /** Iconoir name before each unordered-list item (the `list_bullet` site icon). */
  bulletIcon: string;
  callouts: CalloutChrome;
  className?: string;
}) {
  return (
    <div className={cn("max-w-[68ch]", className)}>
      {body.map((block, i) => (
        <Block
          key={i}
          block={block}
          media={media}
          id={ids[i]}
          lead={i === 0 && block.type === "paragraph"}
          space={spaceAbove(block, i === 0 ? null : body[i - 1]!)}
          bulletIcon={bulletIcon}
          callouts={callouts}
        />
      ))}
    </div>
  );
}

// Literal class strings (Tailwind must see them whole).
const MT = {
  0: "mt-0",
  14: "mt-[14px]",
  20: "mt-5",
  26: "mt-[26px]",
  34: "mt-[34px]",
  38: "mt-[38px]",
  40: "mt-10",
  52: "mt-[52px]",
} as const;
type Space = keyof typeof MT;

/** Top margin of `block` after `prev` (the mock's `.article` margin rules, in their cascade order). */
function spaceAbove(block: BodyBlock, prev: BodyBlock | null): string {
  if (!prev) return MT[0];
  // `.article figure|blockquote|hr|.btn` are declared after `h2 + *` → they keep their own margin.
  if (block.type === "image") return MT[34];
  if (block.type === "quote") return MT[38];
  if (block.type === "divider") return MT[40];
  if (block.type === "cta") return MT[26];
  // `.article h2 + *, .article h3 + *` (h4: same treatment).
  if (prev.type === "heading") return MT[14];
  if (block.type === "heading") return MT[(block.level === 2 ? 52 : 34) satisfies Space];
  return MT[20];
}

const HEADING_BASE = "scroll-mt-[96px] font-serif font-medium tracking-[-0.015em] text-ink";
const ITEM = "text-base leading-[1.55] text-ink";
const BTN =
  "inline-flex items-center justify-center gap-[0.5em] rounded-[3px] border border-transparent bg-accent px-7 py-[14px] text-[14px] font-medium tracking-[0.01em] text-white transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-accent-deep";

function Block({
  block,
  media,
  id,
  lead,
  space,
  bulletIcon,
  callouts,
}: {
  block: BodyBlock;
  media: Record<string, MediaImageData>;
  id: string | undefined;
  lead: boolean;
  space: string;
  bulletIcon: string;
  callouts: CalloutChrome;
}): ReactNode {
  switch (block.type) {
    case "heading": {
      if (block.level === 2) {
        return (
          <h2 id={id} className={cn(space, HEADING_BASE, "text-[clamp(26px,3vw,34px)] leading-[1.15]")}>
            {block.number ? <span className="mr-3 text-accent">{block.number}</span> : null}
            {block.text}
          </h2>
        );
      }
      const Tag = block.level === 3 ? "h3" : "h4";
      return (
        <Tag
          id={id}
          className={cn(space, HEADING_BASE, block.level === 3 ? "text-[21px]" : "text-lg", "leading-[1.25]")}
        >
          {block.number ? <span className="mr-2.5 text-accent">{block.number}</span> : null}
          {block.text}
        </Tag>
      );
    }
    case "paragraph":
      return lead ? (
        <p className={cn(space, "text-[19px] leading-[1.6] text-ink")}>{block.text}</p>
      ) : (
        <p className={cn(space, "text-[17px] leading-[1.7] text-ink-soft")}>{block.text}</p>
      );
    case "list":
      return block.ordered ? (
        <ol className={cn(space, "flex list-none flex-col gap-2.5 pl-0 [counter-reset:n]")}>
          {block.items.map((item, i) => (
            <li
              key={i}
              className={cn(
                ITEM,
                "grid grid-cols-[30px_1fr] gap-2.5 [counter-increment:n] before:font-serif before:text-base before:text-accent-deep before:content-[counter(n,decimal-leading-zero)]",
              )}
            >
              <span>{item}</span>
            </li>
          ))}
        </ol>
      ) : (
        <ul className={cn(space, "flex list-none flex-col gap-2.5 pl-0")}>
          {block.items.map((item, i) => (
            <li key={i} className={cn(ITEM, "flex items-start gap-3")}>
              <Icon name={bulletIcon} size={19} className="mt-px block flex-none text-accent-deep" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "image": {
      const data = media[block.media_id];
      if (!data) return null;
      const img = block.alt ? { ...data, alt: block.alt } : data;
      return (
        <figure className={cn(space, "mb-[14px]")}>
          <MediaImage
            data={img}
            className="block aspect-[3/2] h-auto w-full rounded-[6px] object-cover"
            sizes="(max-width: 980px) calc(100vw - 56px), 720px"
          />
          {block.caption ? (
            <figcaption className="mt-2.5 text-[13.5px] leading-[1.6] text-ink-soft">{block.caption}</figcaption>
          ) : null}
        </figure>
      );
    }
    case "quote":
      return (
        <blockquote className={cn(space, "mb-[18px] border-l-2 border-accent pl-[26px]")}>
          <p className="font-serif text-[clamp(22px,2.4vw,27px)] leading-[1.3] text-ink">{block.text}</p>
          {block.attribution ? (
            <cite className="mt-3 block text-[13.5px] not-italic leading-[1.6] text-ink-soft">— {block.attribution}</cite>
          ) : null}
        </blockquote>
      );
    case "callout": {
      const chrome = callouts[block.variant];
      return (
        <Callout
          variant={block.variant}
          icon={<Icon name={chrome.icon} />}
          label={chrome.label}
          className={space}
        >
          <p>{block.body}</p>
        </Callout>
      );
    }
    case "divider":
      return <hr className={cn(space, "mb-10 border-0 border-t border-line")} />;
    case "cta":
      return (
        <div className={space}>
          <a href={block.url} className={BTN}>
            {block.label}
          </a>
        </div>
      );
  }
}
