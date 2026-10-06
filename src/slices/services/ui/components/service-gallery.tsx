import { MediaImage, type MediaImageData } from "@core/media";

// Auto-fit 260px-min columns inside the 1240px/28px column: ~3 across on desktop, 1 on phones.
const GALLERY_SIZES = "(max-width: 680px) 100vw, (max-width: 980px) 50vw, 395px";

/**
 * A service's photo gallery: equal 4:3 cover-cropped tiles in an auto-fit grid (min 260px,
 * 16px gap, 4px corners), each the R2 asset through `@core/media`'s `MediaImage` (lazy,
 * responsive `sizes`, blurhash placeholder). Port of the old `.mk .svc-gallery`.
 *
 * Not `core/ui`'s `MosaicGallery` (the Buildings detail gallery): its `2fr 1fr 1fr` lead-tile
 * layout fills exactly at 5 photos, and service galleries hold 1–3 today, which would leave the
 * right-hand cells empty. A dimensionless asset falls back to a plain lazy `<img>`, the same
 * branch Buildings' `galleryImage()` uses.
 */
export function ServiceGallery({ images }: { images: MediaImageData[] }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
      {images.map((img, i) => (
        <li key={i} className="overflow-hidden rounded-[4px]">
          {img.url && img.width > 0 && img.height > 0 ? (
            <MediaImage data={img} sizes={GALLERY_SIZES} className="block aspect-[4/3] h-auto w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- dimensionless asset, not optimisable
            <img
              src={img.url}
              alt={img.alt}
              loading="lazy"
              decoding="async"
              className="block aspect-[4/3] w-full object-cover"
            />
          )}
        </li>
      ))}
    </ul>
  );
}
