import "server-only";
import type { Locale } from "@core/db/columns";
import type { NavLink, NavLocation } from "../contract";
import { FIXED_HEADER, FIXED_FOOTER, type FixedNavEntry } from "../fixed-navigation";
import en from "../../../../messages/en.json";
import es from "../../../../messages/es.json";
import pt from "../../../../messages/pt.json";
import fr from "../../../../messages/fr.json";

const messages = { en: en.settings, es: es.settings, pt: pt.settings, fr: fr.settings };

function labelFor(locale: Locale, key: string): string {
  let value: unknown = messages[locale];
  for (const part of key.split(".")) {
    value = value && typeof value === "object" ? (value as Record<string, unknown>)[part] : undefined;
  }
  if (typeof value !== "string" || !value.trim()) throw new Error(`Missing fixed navigation label: ${locale}.${key}`);
  return value;
}

/** Code-owned navigation never reads legacy nav_item or translation rows. */
export function getFixedNav(locale: Locale, location: NavLocation): NavLink[] {
  const build = (entries: readonly FixedNavEntry[], parent: string): NavLink[] => entries.map((entry) => {
    const id = `${parent}-${entry.key}`;
    return { id, label: labelFor(locale, entry.labelKey), url: entry.url, children: build(entry.children ?? [], id) };
  });
  return build(location === "header" ? FIXED_HEADER : FIXED_FOOTER, `fixed-${location}`);
}
