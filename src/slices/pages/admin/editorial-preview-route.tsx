import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { validEditorialSurface } from "../server/editorial-policy";
import { requireStaff } from "@core/auth";
import { PageEditorLivePreview } from "@slices/backoffice/contract";
import { SiteHeader, SiteFooter } from "@slices/settings/contract";
import type { Locale } from "@core/db/columns";
import { usesPageLocaleDrafts } from "../editorial-registry";
import { getEditorialAdapter } from "../server/editorial-adapters";
import { getPageDraftPreview } from "../server/editorial-preview";
import { renderPageLivePreview } from "./live-preview-actions";
import { homeEditorBindingIds } from "./home-contextual";

/** Dynamic staff route shared by every enabled page. Never mounts on public routes. */
export async function PageEditorialPreview({ pageKey, query }: {
 pageKey: string; query: { locale?: string; instance?: string; surface?: string };
}) {
 await requireStaff();
 const locale = query.locale ?? "en";
 const surface = query.surface ?? "page";
 if (!validEditorialSurface(pageKey, surface)) notFound();
 if (!usesPageLocaleDrafts(pageKey) || !["en", "es", "pt", "fr"].includes(locale) || !query.instance || !/^[a-zA-Z0-9_-]{1,100}$/.test(query.instance)) notFound();
 setRequestLocale(locale);
 const adapter = getEditorialAdapter(pageKey);
 const root = adapter.descriptor.rootNode;
 // Same leaf/group allowlist as the common outline. Private annotations only.
 function bindings(node: typeof root, path = ""): string[] {
  if (node.kind === "hidden") return [];
  if (node.kind === "object") return [...(path ? [path] : []), ...node.fields.flatMap(field => bindings(field.node, path ? `${path}.${field.key}` : field.key))];
  return [path];
 }
 const ids = pageKey === "home" ? homeEditorBindingIds : [...bindings(root), ...adapter.descriptor.externalSections, "og_image_media_id"];
 const messages = await getMessages({ locale });
 const page = await getPageDraftPreview(pageKey, locale as Locale);
 return <NextIntlClientProvider locale={locale} messages={messages}>
  <SiteHeader locale={locale as Locale} />
  <PageEditorLivePreview instance={query.instance} bindingIds={ids}
   renderPreviewAction={async (payload) => { "use server"; return renderPageLivePreview(pageKey, locale, payload, surface); }}>
   {await adapter.render({ locale: locale as Locale, preview: true, page, surface })}
  </PageEditorLivePreview>
  <SiteFooter locale={locale as Locale} />
 </NextIntlClientProvider>;
}
