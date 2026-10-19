import "server-only";
import { loadMedia, mediaUrl } from "@core/media";
import { homeMediaReferences } from "./home-media-validation";
import { requireStaff } from "@core/auth";
import type { Locale } from "@core/db/columns";
import type { HomeEditorialModel, PageEnvelope, PageLocaleEditorialModel } from "../editorial-types";
import { homeSchema, type HomeContent } from "../schemas/home";
import { normalizeHome } from "../home-content";
import { applyDefaults, describe } from "./form-model";
import { getPageEditModel } from "./queries";
import { editorialLocales, editorialModel, readEditorialRows } from "./editorial-store";
import { validEditorialRequest } from "../server/editorial-policy";

export function emptyEditorialEnvelope(): PageEnvelope {
  return { schemaVersion: 1, content: normalizeHome(applyDefaults(describe(homeSchema), {}) as HomeContent), ogImageMediaId: null };
}
export async function getPageEditorialModel(key: string, locale: Locale): Promise<PageLocaleEditorialModel | null> {
  await requireStaff();
  if (!validEditorialRequest(key, locale)) return null;
  return editorialModel(await readEditorialRows(), locale, emptyEditorialEnvelope());
}
export async function getHomeEditorialModel(): Promise<HomeEditorialModel> {
  await requireStaff();
  const model = (await getPageEditModel("home"))!;
  const rows = await readEditorialRows();
  const locales = Object.fromEntries(editorialLocales.map(locale => [locale, editorialModel(rows, locale, emptyEditorialEnvelope())])) as HomeEditorialModel["locales"];
  const ids = new Set<string>();
  for (const locale of editorialLocales) for (const value of [locales[locale].working, locales[locale].draft, locales[locale].published]) {
    if (value) for (const ref of homeMediaReferences(value.content, value.ogImageMediaId)) ids.add(ref.id);
  }
  const previews = { ...model.previews };
  for (const [id, asset] of await loadMedia([...ids])) previews[id] = { id, url: mediaUrl(asset.r2_key), width: asset.width, height: asset.height, mime: asset.mime };
  return { ...model, previews, data: locales.en.working.content, ogImageMediaId: locales.en.working.ogImageMediaId, locales };
}
