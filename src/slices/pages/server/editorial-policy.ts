import { z } from "zod";
import { usesPageLocaleDrafts } from "../editorial-registry";
export const editorialLocale = z.enum(["en", "es", "pt", "fr"]);
export function validEditorialRequest(key: unknown, locale: unknown): locale is z.infer<typeof editorialLocale> {
  return typeof key === "string" && usesPageLocaleDrafts(key) && editorialLocale.safeParse(locale).success;
}
