import NextImage from "next/image";
import { env } from "@core/env";
import { blurDataUrl } from "./blur";

/**
 * R2 image component (kernel — `core/media`). Always renders with explicit
 * dimensions (CLS ≈ 0 per design-system.md). Slices resolve a `media_asset` into
 * `MediaImageData` and pass it here — components never build R2 URLs themselves.
 */
export interface MediaImageData {
  url: string;
  width: number;
  height: number;
  alt: string;
  blurhash: string | null;
}

/** Build a public URL for an R2 key (falls back to a root-relative path in dev). */
export function mediaUrl(r2Key: string): string {
  const base = env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  return base ? `${base}/${r2Key}` : `/${r2Key}`;
}

export function MediaImage({
  data,
  className,
  sizes,
  priority,
}: {
  data: MediaImageData;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  // Decoded from the stored blurhash (ADR 0027) — at build/revalidate time, since public
  // pages are ISR. Absent or undecodable hash → no placeholder, never a broken image.
  const blur = blurDataUrl(data.blurhash, data.width, data.height);
  return (
    <NextImage
      src={data.url}
      alt={data.alt}
      width={data.width}
      height={data.height}
      className={className}
      sizes={sizes}
      priority={priority}
      {...(blur ? { placeholder: "blur" as const, blurDataURL: blur } : {})}
    />
  );
}
