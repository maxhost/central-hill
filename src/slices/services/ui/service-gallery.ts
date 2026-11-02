import type { MediaImageData } from "@core/media";

/** Cover plus the first three gallery photos form every service's public mosaic. */
export const SERVICE_MOSAIC_MAX = 4;

export function serviceGalleryView(cover: MediaImageData | null, gallery: MediaImageData[]) {
  const photos = [...(cover ? [cover] : []), ...gallery];
  return {
    photos,
    visible: photos.slice(0, SERVICE_MOSAIC_MAX),
    showAll: photos.length > SERVICE_MOSAIC_MAX,
  };
}
