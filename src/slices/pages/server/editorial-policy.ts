import { z } from "zod";
import { usesPageLocaleDrafts } from "../editorial-registry";
export const editorialLocale = z.enum(["en", "es", "pt", "fr"]);
export function validEditorialSurface(key: string, surface: string): surface is "page" | "shared_aside" {
  return surface === "page" || (surface === "shared_aside" && ["guides", "blog"].includes(key));
}
export function validEditorialRequest(key: unknown, locale: unknown): locale is z.infer<typeof editorialLocale> {
  return typeof key === "string" && usesPageLocaleDrafts(key) && editorialLocale.safeParse(locale).success;
}
