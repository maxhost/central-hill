import { MediaImage, type MediaImageData } from "@core/media";
import { cn } from "@core/ui";
import type { BodyBlock, PostBody } from "../../contract";

/**
 * Renders a post body — a typed switch over the closed block set (ADR 0013).
 * No raw HTML: inline images resolve from `media` (media_asset.id → image data).
 */
export function BodyRenderer({
  body,
  media,
}: {
  body: PostBody;
  media: Record<string, MediaImageData>;
}) {
  return (
    <div className="flex flex-col gap-7">
      {body.map((block, i) => (
        <Block key={i} block={block} media={media} />
      ))}
    </div>
  );
}

const calloutStyles: Record<string, string> = {
  info: "border-l-2 border-accent bg-surface",
  tip: "border-l-2 border-accent bg-surface",
  warning: "border-l-2 border-accent-deep bg-surface",
  note: "border-l-2 border-line bg-surface",
};

function Block({ block, media }: { block: BodyBlock; media: Record<string, MediaImageData> }) {
  switch (block.type) {
    case "heading": {
      const cls = cn(
        "mt-4 font-serif leading-snug text-ink",
        block.level === 2 ? "text-3xl" : block.level === 3 ? "text-2xl" : "text-xl",
      );
      const inner = (
        <>
          {block.number ? <span className="mr-3 text-accent">{block.number}</span> : null}
          {block.text}
        </>
      );
      if (block.level === 2) return <h2 className={cls}>{inner}</h2>;
      if (block.level === 3) return <h3 className={cls}>{inner}</h3>;
      return <h4 className={cls}>{inner}</h4>;
    }
    case "paragraph":
      return <p className="max-w-[68ch] text-base leading-relaxed text-ink-soft">{block.text}</p>;
    case "list": {
      const items = block.items.map((item, i) => <li key={i}>{item}</li>);
      return block.ordered ? (
        <ol className="ml-5 flex max-w-[68ch] list-decimal flex-col gap-2 text-ink-soft">{items}</ol>
      ) : (
        <ul className="ml-5 flex max-w-[68ch] list-disc flex-col gap-2 text-ink-soft">{items}</ul>
      );
    }
    case "image": {
      const data = media[block.media_id];
      if (!data) return null;
      const img = block.alt ? { ...data, alt: block.alt } : data;
      return (
        <figure className="my-2">
          <div className="overflow-hidden rounded-lg bg-surface">
            <MediaImage data={img} className="h-auto w-full" sizes="(max-width: 768px) 100vw, 720px" />
          </div>
          {block.caption ? (
            <figcaption className="mt-2 text-sm text-ink-soft">{block.caption}</figcaption>
          ) : null}
        </figure>
      );
    }
    case "quote":
      return (
        <blockquote className="border-l-2 border-accent pl-6">
          <p className="font-serif text-2xl leading-snug text-ink">{block.text}</p>
          {block.attribution ? (
            <cite className="mt-3 block text-sm not-italic text-ink-soft">— {block.attribution}</cite>
          ) : null}
        </blockquote>
      );
    case "callout":
      return (
        <div className={cn("rounded-r-md p-5 text-ink-soft", calloutStyles[block.variant])}>
          {block.body}
        </div>
      );
    case "divider":
      return <hr className="my-2 border-line" />;
    case "cta":
      return (
        <a
          href={block.url}
          className="inline-flex w-fit items-center justify-center rounded-md bg-accent px-7 py-3 text-sm font-medium text-surface transition-colors hover:bg-accent-deep"
        >
          {block.label}
        </a>
      );
  }
}
