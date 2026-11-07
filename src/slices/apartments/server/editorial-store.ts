import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@core/db/client";
import { requireStaff } from "@core/auth";
import type { Locale } from "@core/db/columns";
import { setSlugs } from "@core/i18n";
import { loadMedia, mediaUrl } from "@core/media";
import {
  PROPERTY_EDITOR_LOCALES,
  type PropertyEditorialResult,
} from "@slices/backoffice/contract";
import {
  buildingIdentityExistsSql,
  type BuildingStats,
} from "@slices/buildings/contract";
import type {
  ApartmentEditorialContent,
  ApartmentEditorialModel,
  ApartmentEnvelope,
  SaveApartmentDraftInput,
  PublishApartmentDraftInput,
} from "../editorial-types";
import { apartment } from "../schema";
import { APARTMENT_SHARED_KEYS } from "../editorial-types";
import { readApartmentSharedState } from "./shared-content";
export { getApartmentSharedState } from "./shared-content";
import { apartmentLocaleModel } from "./editorial-model";
import {
  apartmentMediaIds,
  checkApartmentEnvelope,
  emptyApartmentEnvelope,
  issuesByField,
  publishApartmentRequest,
  saveApartmentRequest,
  apartmentSharedContent,
  apartmentLocalizedContent,
  overlayApartmentShared,
  semanticEqual,
} from "./editorial-validation";
import {
  LegacyApartmentError,
  apartmentSlugMap,
  bootstrapApartmentLocales,
  propertyGraphLockQuery,
  readApartmentIdentity,
  readApartmentLocaleRows,
} from "./editorial-bootstrap";
type Result = PropertyEditorialResult<ApartmentEditorialContent>;
const invalid = (fieldErrors: Record<string, string>): Result => ({
  ok: false,
  error: "validation",
  fieldErrors,
});
const validId = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
/** Owner-provided identity fragment: includes draft and archived children. */
export function apartmentIdentityGuardSql(buildingId: string): SQL {
  return sql`select id from apartment where building_id=${buildingId}::uuid`;
}
export async function getApartmentEditorParentId(
  id: string,
): Promise<string | null> {
  if (!validId(id)) return null;
  const [identity] = await db
    .select({ parentId: apartment.building_id })
    .from(apartment)
    .where(eq(apartment.id, id))
    .limit(1);
  return identity?.parentId ?? null;
}
export async function getApartmentEditorialModel(
  id: string,
  parentId?: string,
): Promise<ApartmentEditorialModel | null> {
  await requireStaff();
  if (!validId(id)) return null;
  const identity = await readApartmentIdentity(id);
  if (!identity || (parentId && parentId !== identity.building_id)) return null;
  const [rows, slugByLocale] = await Promise.all([
    readApartmentLocaleRows(identity),
    apartmentSlugMap(id),
  ]);
  for (const row of rows)
    for (const value of [row.draft, row.published])
      if (value && !checkApartmentEnvelope(value).envelope)
        throw new LegacyApartmentError();
  const shared = await readApartmentSharedState(identity, rows);
  const locales = Object.fromEntries(
    PROPERTY_EDITOR_LOCALES.map((locale) => [
      locale,
      apartmentLocaleModel(rows, locale, shared),
    ]),
  ) as ApartmentEditorialModel["locales"];
  const assets = await loadMedia([
    ...new Set(
      PROPERTY_EDITOR_LOCALES.flatMap((locale) =>
        [locales[locale].working, locales[locale].published].flatMap(
          (envelope) => (envelope ? apartmentMediaIds(envelope) : []),
        ),
      ),
    ),
  ]);
  const previews = Object.fromEntries(
    [...assets].map(([id, a]) => [
      id,
      {
        id,
        url: mediaUrl(a.r2_key),
        width: a.width,
        height: a.height,
        mime: a.mime,
      },
    ]),
  );
  return {
    id,
    parentId: identity.building_id,
    archived: identity.status === "archived",
    slugByLocale,
    locales,
    previews,
    shared,
  };
}
export async function validateApartmentReferences(
  envelope: ApartmentEnvelope,
  localIds = new Set<string>(),
): Promise<Record<string, string>> {
  const ids = apartmentMediaIds(envelope);
  const media = await loadMedia(ids);
  const errors: Record<string, string> = {};
  for (const id of ids)
    if (
      !localIds.has(id) &&
      (!media.get(id) || !media.get(id)!.mime.startsWith("image/"))
    ) {
      errors[
        id === envelope.content.cover_media_id
          ? "cover_media_id"
          : id === envelope.content.og_image_media_id
            ? "og_image_media_id"
            : "gallery"
      ] = "Select an available image.";
    }
  return errors;
}
function internalSlug(name: string, id: string) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return `${base || "apartment"}-${id}`;
}
async function createApartmentIdentity(input: SaveApartmentDraftInput) {
  const slug = internalSlug(input.payload.content.name, input.id);
  await db.batch([
    propertyGraphLockQuery(),
    db.execute(sql`with created as (
    insert into apartment(id,slug,status,building_id,position)
    select ${input.id}::uuid,${slug},'draft',${input.parentId}::uuid,
      coalesce((select max(position)+1 from apartment where building_id=${input.parentId}::uuid),0)
    where exists(${buildingIdentityExistsSql(input.parentId)})
    on conflict(id) do nothing returning id
  ) insert into apartment_locale_content(apartment_id,locale,revision)
    select created.id,locales.locale,0 from created cross join unnest(array['en','es','pt','fr']) locales(locale)
    on conflict do nothing`),
  ]);
}
/** The fresh SQL statement after the graph lock validates both revisions and
 * inherited source text before committing localized/common values together. */
export async function commitApartmentLocale(input: {
  id: string;
  parentId: string;
  locale: Locale;
  revision: number;
  templateRevision?: number | null;
  payload?: ApartmentEnvelope;
  publish?: boolean;
  actor: string;
  sharedChanged?: boolean;
  expectedSharedRevision?: number;
  sharedBaseline?: Partial<ApartmentEditorialContent>;
}): Promise<boolean> {
  const keyArray = sql`array[${sql.join(
    APARTMENT_SHARED_KEYS.map((key) => sql`${key}`),
    sql`, `,
  )}]::text[]`;
  const localized = input.payload
    ? apartmentLocalizedContent(input.payload)
    : null;
  const baseline = JSON.stringify(
    input.sharedBaseline ?? apartmentSharedContent(emptyApartmentEnvelope()),
  );
  const proposed = JSON.stringify(
    input.payload ? apartmentSharedContent(input.payload) : {},
  );
  const sharedChanges = Boolean(input.sharedChanged && !input.publish);
  const [, result] = await db.batch([
    propertyGraphLockQuery(),
    db.execute(sql`with identity as materialized (
      select id from apartment where id=${input.id}::uuid and building_id=${input.parentId}::uuid and status<>'archived'
      and exists(${buildingIdentityExistsSql(input.parentId, true)}) for update
    ), source as materialized (
      select coalesce(draft,published)->'content' as content from apartment_locale_content
      where apartment_id=${input.id}::uuid and locale='en' and exists(select 1 from identity) for update
    ), common as materialized (
      select coalesce((select data->'content' from apartment_shared_content where apartment_id=${input.id}::uuid),${baseline}::jsonb) as content,
        coalesce((select revision from apartment_shared_content where apartment_id=${input.id}::uuid),0) as revision
    ), eligible as materialized (
      select target.id from apartment_locale_content target, common
      where target.apartment_id=${input.id}::uuid and target.locale=${input.locale} and target.revision=${input.revision}
        and exists(select 1 from source)
        ${sharedChanges ? sql`and common.revision=${input.expectedSharedRevision ?? -1}` : sql``}
        ${
          input.publish
            ? sql`and target.draft is not null and (
          coalesce(target.draft->>'localeMode','custom')<>'inherit' or
          ((target.draft->'content') - ${keyArray}) is not distinct from (select content - ${keyArray} from source)
        )`
            : input.payload?.localeMode === "inherit" && input.locale !== "en"
              ? sql`and ${JSON.stringify(localized)}::jsonb is not distinct from (select content - ${keyArray} from source)`
              : sql``
        }
    ), saved as (
      update apartment_locale_content target set
        published=${input.publish ? sql`jsonb_set(target.draft,'{content}',(target.draft->'content') || common.content)` : sql`target.published`},
        draft=${input.publish ? sql`null` : sql`jsonb_set(${JSON.stringify(input.payload)}::jsonb,'{content}',(${JSON.stringify(input.payload?.content)}::jsonb) || ${sharedChanges ? sql`${proposed}::jsonb` : sql`common.content`})`},
        revision=target.revision+1,updated_at=now(),updated_by=${input.actor},
        draft_saved_at=${input.publish ? sql`null` : sql`now()`},published_at=${input.publish ? sql`now()` : sql`target.published_at`}
      from common where target.id in (select id from eligible) returning target.id
    ), shared_saved as (
      insert into apartment_shared_content(apartment_id,data,revision,updated_by)
      select ${input.id}::uuid,jsonb_build_object('schemaVersion',1,'content',${sharedChanges ? sql`${proposed}::jsonb` : sql`common.content`}),${sharedChanges ? 1 : 0},${input.actor}
      from common where exists(select 1 from saved) and ${!input.publish}
      on conflict(apartment_id) do update set
        data=${sharedChanges ? sql`excluded.data` : sql`apartment_shared_content.data`},
        revision=apartment_shared_content.revision+${sharedChanges ? 1 : 0},
        updated_at=${sharedChanges ? sql`now()` : sql`apartment_shared_content.updated_at`},
        updated_by=${sharedChanges ? sql`excluded.updated_by` : sql`apartment_shared_content.updated_by`}
      returning data->'content' as content
    ), mirrored as (
      update apartment set bedrooms=(shared_saved.content->>'bedrooms')::int,bathrooms=(shared_saved.content->>'bathrooms')::int,
        max_guests=(shared_saved.content->>'max_guests')::int,beds_count=(shared_saved.content->>'beds_count')::int,
        size_m2=(shared_saved.content->>'size_m2')::int,floor=(shared_saved.content->>'floor')::int,
        cover_media_id=(shared_saved.content->>'cover_media_id')::uuid,og_image_media_id=(shared_saved.content->>'og_image_media_id')::uuid,
        avantio_id=shared_saved.content->>'avantio_id',avantio_url=shared_saved.content->>'default_booking_url',updated_at=now()
      from shared_saved where apartment.id=${input.id}::uuid returning apartment.id
    ), removed_gallery as (
      delete from apartment_media where apartment_id in (select id from mirrored) returning id
    ), gallery_saved as (
      insert into apartment_media(apartment_id,media_id,position)
      select ${input.id}::uuid,items.value::uuid,(items.ordinality-1)::int from shared_saved,
        jsonb_array_elements_text(shared_saved.content->'gallery') with ordinality items(value,ordinality)
      where (select count(*) from removed_gallery)>=0 and exists(select 1 from mirrored) returning id
    ) select id from saved`),
  ]);
  return result.rows.length === 1;
}
export async function saveApartmentDraft(
  input: SaveApartmentDraftInput,
  actor: string,
): Promise<Result> {
  const request = saveApartmentRequest.safeParse(input);
  if (!request.success) return invalid(issuesByField(request.error.issues));
  const checked = checkApartmentEnvelope(input.payload);
  if (!checked.envelope || Object.keys(checked.errors).length)
    return invalid(checked.errors);
  input = { ...input, payload: checked.envelope };
  try {
    let identity = await readApartmentIdentity(input.id);
    if (!identity) {
      if (input.locale !== "en" || input.expectedRevision !== 0)
        return { ok: false, error: "not_found" };
      const errors = await validateApartmentReferences(input.payload);
      if (Object.keys(errors).length) return invalid(errors);
      await createApartmentIdentity(input);
      identity = await readApartmentIdentity(input.id);
      if (!identity) return { ok: false, error: "not_found" };
    }
    if (identity.building_id !== input.parentId)
      return { ok: false, error: "not_found" };
    if (identity.status === "archived") return { ok: false, error: "archived" };
    await bootstrapApartmentLocales(identity, actor);
    const rows = await readApartmentLocaleRows(identity);
    const shared = await readApartmentSharedState(identity, rows);
    const model = apartmentLocaleModel(rows, input.locale, shared);
    if (model.revision !== input.expectedRevision)
      return { ok: false, error: "conflict" };
    const inherited =
      input.locale !== "en" &&
      (input.payload.localeMode ?? model.working.localeMode) === "inherit";
    // Once customized, clearing the form cannot silently rejoin English.
    const mode =
      input.locale === "en" || model.working.localeMode === "custom"
        ? "custom"
        : inherited
          ? "inherit"
          : "custom";
    const payload = { ...input.payload, localeMode: mode } as ApartmentEnvelope;
    if (
      mode === "inherit" &&
      !semanticEqual(
        apartmentLocalizedContent(payload),
        apartmentLocalizedContent(model.working),
      )
    )
      return { ok: false, error: "conflict" };
    const sharedChanged =
      input.sharedChanged ??
      !semanticEqual(apartmentSharedContent(payload), shared.content);
    if (sharedChanged && input.expectedSharedRevision !== shared.revision)
      return { ok: false, error: "conflict" };
    input = {
      ...input,
      payload: overlayApartmentShared(
        payload,
        sharedChanged ? apartmentSharedContent(payload) : shared.content,
      ),
    };
    const errors = await validateApartmentReferences(input.payload);
    if (Object.keys(errors).length) return invalid(errors);
    let slugByLocale = await apartmentSlugMap(identity.id);
    const virgin = rows.every(
      (row) => row.revision === 0 && !row.published && !row.draft,
    );
    if (virgin && input.locale === "en") {
      const missing = Object.fromEntries(
        PROPERTY_EDITOR_LOCALES.filter((locale) => !slugByLocale[locale]).map(
          (locale) => [locale, identity!.slug],
        ),
      );
      if (Object.keys(missing).length)
        await setSlugs("apartment", identity.id, missing);
      slugByLocale = await apartmentSlugMap(identity.id);
    }
    if (
      !(await commitApartmentLocale({
        id: input.id,
        parentId: input.parentId,
        locale: input.locale,
        revision: input.expectedRevision,
        payload: input.payload,
        sharedChanged,
        expectedSharedRevision: input.expectedSharedRevision,
        sharedBaseline: shared.content,
        actor,
      }))
    )
      return { ok: false, error: "conflict" };
    const freshRows = await readApartmentLocaleRows(identity);
    const freshShared = await readApartmentSharedState(identity, freshRows);
    return {
      ok: true,
      id: input.id,
      parentId: input.parentId,
      slugByLocale,
      model: apartmentLocaleModel(freshRows, input.locale, freshShared),
      shared: freshShared,
      previews: await apartmentPreviews(
        overlayApartmentShared(input.payload, freshShared.content),
      ),
    };
  } catch (error) {
    if (error instanceof LegacyApartmentError)
      return { ok: false, error: "legacy_invalid" };
    console.error(
      "Apartment draft save failed",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, error: "server" };
  }
}
export async function publishApartmentDraft(
  input: PublishApartmentDraftInput,
  actor: string,
): Promise<Result> {
  const request = publishApartmentRequest.safeParse(input);
  if (!request.success) return invalid(issuesByField(request.error.issues));
  try {
    const identity = await readApartmentIdentity(input.id);
    if (!identity || identity.building_id !== input.parentId)
      return { ok: false, error: "not_found" };
    if (identity.status === "archived") return { ok: false, error: "archived" };
    await bootstrapApartmentLocales(identity, actor);
    const rows = await readApartmentLocaleRows(identity);
    const shared = await readApartmentSharedState(identity, rows);
    // A pre-ADR0061 EN draft may be the only copy of pending common edits.
    // Publishing cannot consume it until an explicit Save makes them shared.
    if (shared.working)
      return invalid({ _source: "Save shared changes before publishing." });
    const model = apartmentLocaleModel(rows, input.locale, shared);
    if (model.revision !== input.expectedRevision)
      return { ok: false, error: "conflict" };
    if (!model.draft) return { ok: false, error: "no_draft" };
    const checked = checkApartmentEnvelope(
      overlayApartmentShared(model.draft, shared.content),
      true,
    );
    if (!checked.envelope || Object.keys(checked.errors).length)
      return invalid(checked.errors);
    const errors = await validateApartmentReferences(checked.envelope);
    if (Object.keys(errors).length) return invalid(errors);
    if (
      !(await commitApartmentLocale({
        id: input.id,
        parentId: input.parentId,
        locale: input.locale,
        revision: input.expectedRevision,
        publish: true,
        sharedBaseline: shared.content,
        actor,
      }))
    )
      return { ok: false, error: "conflict" };
    const freshRows = await readApartmentLocaleRows(identity);
    const freshShared = await readApartmentSharedState(identity, freshRows);
    return {
      ok: true,
      id: input.id,
      parentId: input.parentId,
      slugByLocale: await apartmentSlugMap(input.id),
      model: apartmentLocaleModel(freshRows, input.locale, freshShared),
      shared: freshShared,
      previews: await apartmentPreviews(
        overlayApartmentShared(checked.envelope, freshShared.content),
      ),
    };
  } catch (error) {
    if (error instanceof LegacyApartmentError)
      return { ok: false, error: "legacy_invalid" };
    console.error(
      "Apartment publish failed",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, error: "server" };
  }
}
/** Deliberately has no parent visibility lookup: Buildings calls this while resolving itself. */
export async function getPublishedApartmentStats(
  buildingId: string,
  locale: Locale,
): Promise<BuildingStats> {
  const units = await readPublishedApartmentDocuments(buildingId, locale);
  return units.reduce(
    (stats, unit) => ({
      apartments: stats.apartments + 1,
      capacity: stats.capacity + unit.envelope.content.max_guests,
      beds: stats.beds + unit.envelope.content.beds_count,
    }),
    { apartments: 0, capacity: 0, beds: 0 },
  );
}
/** Internal snapshot collection also serves private parent previews; no parent gate here. */
export async function readPublishedApartmentDocuments(
  buildingId: string,
  locale: Locale,
) {
  const identities = await db
    .select()
    .from(apartment)
    .where(eq(apartment.building_id, buildingId))
    .orderBy(asc(apartment.position), asc(apartment.id));
  const documents = await Promise.all(
    identities
      .filter((identity) => identity.status !== "archived")
      .map(async (identity) => {
        const rows = await readApartmentLocaleRows(identity, false);
        const envelope = rows.find((row) => row.locale === locale)?.published;
        if (!envelope) return null;
        const shared = await readApartmentSharedState(identity, rows);
        return {
          identity,
          envelope: overlayApartmentShared(envelope, shared.content),
        };
      }),
  );
  return documents.filter((unit): unit is NonNullable<typeof unit> =>
    Boolean(unit),
  );
}
export async function archiveApartmentIdentity(
  id: string,
  parentId: string,
): Promise<boolean> {
  const [, result] = await db.batch([
    propertyGraphLockQuery(),
    db.execute(sql`update apartment set status='archived',updated_at=now()
    where id=${id}::uuid and building_id=${parentId}::uuid returning id`),
  ]);
  return result.rows.length === 1;
}

async function apartmentPreviews(envelope: ApartmentEnvelope) {
  const assets = await loadMedia(apartmentMediaIds(envelope));
  return Object.fromEntries(
    [...assets].map(([id, a]) => [
      id,
      {
        id,
        url: mediaUrl(a.r2_key),
        width: a.width,
        height: a.height,
        mime: a.mime,
      },
    ]),
  );
}
