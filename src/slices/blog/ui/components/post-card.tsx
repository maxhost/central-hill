import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { MediaImage } from "@core/media";
import type { PostSummary } from "../../contract";

function formatDate(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(iso));
  } catch {
    return null;
  }
}

/** Property/post card — image (4:3, fixed dims) + category + title + excerpt. */
export async function PostCard({
  post,
  locale,
  priority,
}: {
  post: PostSummary;
  locale: string;
  priority?: boolean;
}) {
  const t = await getTranslations("blog");
  const date = formatDate(post.publishedAt, locale);

  return (
    <Link href={`/${locale}/blog/${post.slug}`} className="group flex flex-col">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-surface">
        {post.cover ? (
          <MediaImage
            data={post.cover}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={priority}
          />
        ) : null}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: post.category.color }}
          aria-hidden
        />
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
          {post.category.name}
        </span>
      </div>
      <h3 className="mt-2 font-serif text-xl leading-snug text-ink transition-colors group-hover:text-accent">
        {post.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{post.excerpt}</p>
      <div className="mt-3 flex items-center gap-2 text-xs text-ink-soft">
        {date ? <span>{date}</span> : null}
        {post.readingMinutes ? (
          <span>· {t("readingMinutes", { minutes: post.readingMinutes })}</span>
        ) : null}
      </div>
    </Link>
  );
}
