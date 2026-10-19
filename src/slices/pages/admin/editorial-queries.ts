import "server-only";
import { loadMedia, mediaUrl } from "@core/media";
import { requireStaff } from "@core/auth";
import type { Locale } from "@core/db/columns";
import type {
  EditorialPageKey,
  PageEditorialModel,
  PageEnvelope,
  PageLocaleEditorialModel,
} from "../editorial-types";
import { getEditorialAdapter } from "../server/editorial-adapters";
import { getPageEditModel } from "./queries";
import {
  editorialLocales,
  editorialModel,
  readEditorialRows,
} from "./editorial-store";
import { validEditorialRequest } from "../server/editorial-policy";

export function emptyEditorialEnvelope<K extends EditorialPageKey = "home">(
  key: K = "home" as K,
): PageEnvelope<K> {
  return {
    schemaVersion: 1,
    content: getEditorialAdapter(key).defaultContent(),
    ogImageMediaId: null,
  };
}
export async function getPageEditorialModel<K extends EditorialPageKey>(
  key: K,
  locale: Locale,
): Promise<PageLocaleEditorialModel<K> | null> {
  await requireStaff();
  if (!validEditorialRequest(key, locale)) return null;
  return editorialModel(
    await readEditorialRows(key),
    locale,
    emptyEditorialEnvelope(key),
    key,
  );
}
export async function getEditorialEditModel<K extends EditorialPageKey>(
  key: K,
): Promise<PageEditorialModel<K>> {
  await requireStaff();
  const adapter = getEditorialAdapter(key);
  const model = (await getPageEditModel(key))!;
  const rows = await readEditorialRows(key);
  const locales = Object.fromEntries(
    editorialLocales.map((locale) => [
      locale,
      editorialModel(rows, locale, emptyEditorialEnvelope(key), key),
    ]),
  ) as PageEditorialModel<K>["locales"];
  const ids = new Set<string>();
  for (const locale of editorialLocales)
    for (const value of [
      locales[locale].working,
      locales[locale].draft,
      locales[locale].published,
    ]) {
      if (value)
        for (const ref of adapter.collectMediaReferences(
          value.content,
          value.ogImageMediaId,
        ))
          ids.add(ref.id);
    }
  const previews = { ...model.previews };
  for (const [id, asset] of await loadMedia([...ids]))
    previews[id] = {
      id,
      url: mediaUrl(asset.r2_key),
      width: asset.width,
      height: asset.height,
      mime: asset.mime,
    };
  return {
    ...model,
    descriptor: adapter.descriptor,
    previews,
    data: locales.en.working.content,
    ogImageMediaId: locales.en.working.ogImageMediaId,
    locales,
  };
}
export async function getHomeEditorialModel(): Promise<
  PageEditorialModel<"home">
> {
  return getEditorialEditModel("home");
}
