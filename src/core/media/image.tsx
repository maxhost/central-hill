import NextImage from "next/image";
import { env } from "@core/env";

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
  return (
    <NextImage
      src={data.url}
      alt={data.alt}
      width={data.width}
      height={data.height}
      className={className}
      sizes={sizes}
      priority={priority}
    />
  );
}
