import type { EditorialPageKey } from "../editorial-types";
export const editorialPagePaths: Record<EditorialPageKey, string> = {
  home: "", owners: "/owners", buildings: "/buildings", real_estate: "/real-estate", guest: "/guests", services: "/services", about: "/about", guides: "/guides", blog: "/blog",
};
export function editorialPublicPath(key: EditorialPageKey, locale: string) { return `/${locale}${editorialPagePaths[key]}`; }
