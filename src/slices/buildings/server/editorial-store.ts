import "server-only";
import { inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@core/db/client";
import { requireStaff } from "@core/auth";
import { SlugConflictError, setSlugs, deleteSlugs } from "@core/i18n";
import { loadMedia, mediaUrl } from "@core/media";
import type { Locale } from "@core/db/columns";
import { listCities, listNeighbourhoods } from "@slices/geography/contract";
import {
  PROPERTY_EDITOR_LOCALES,
  type SavePropertyDraftInput,
  type PublishPropertyDraftInput,
  type PropertyEditorialResult,
  type PropertySharedState,
} from "@slices/backoffice/contract";
import type { BuildingDetail } from "../contract";
import type {
  BuildingEditorialContent,
  BuildingEnvelope,
  BuildingEditorialModel,
  BuildingLocaleScope,
} from "../editorial-types";
import { amenity } from "../schema";
import {
  PropertyLegacyError,
  propertyGraphLockQuery,
  readBuildingIdentity,
  readBuildingLocaleRows,
  bootstrapBuildingLocales,
  buildingSlugMap,
} from "./editorial-bootstrap";
import { buildingLocaleModel } from "./editorial-model";
import {
  emptyBuildingEnvelope,
  buildingMediaIds,
  effectiveBuildingBooking,
  checkBuildingEnvelope,
  saveBuildingRequest,
  publishBuildingRequest,
  issuesByField,
} from "./editorial-validation";
import {
  readBuildingSharedState,
  overlayBuildingShared,
  buildingSharedContent,
} from "./shared-content";
import {
  buildingLocalizedContent,
  buildingValuesEqual,
} from "../admin/ui/property-editor-state";
import { BUILDING_SHARED_KEYS } from "../editorial-types";
type Result = PropertyEditorialResult<BuildingEditorialContent>;
export async function getBuildingSharedState(
  id: string,
): Promise<PropertySharedState<BuildingEditorialContent> | null> {
  const identity = await readBuildingIdentity(id);
  return identity
    ? readBuildingSharedState(identity, await readBuildingLocaleRows(identity))
    : null;
}
async function buildingPreviews(envelope: BuildingEnvelope) {
  const assets = await loadMedia(buildingMediaIds(envelope));
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
const invalid = (fieldErrors: Record<string, string>): Result => ({
  ok: false,
  error: "validation",
  fieldErrors,
});
/** Identity fragment, called under shared graph lock by Apartment creation. */
export function buildingIdentityExistsSql(
  id: string,
  allowArchived = false,
): SQL {
  return sql`select id from building where id=${id}::uuid ${allowArchived ? sql`` : sql`and status<>'archived'`}`;
}
/** Deliberately never resolves children, preventing scope -> child -> scope recursion. */
export async function getBuildingLocaleScope(
  id: string,
  locale: Locale,
): Promise<BuildingLocaleScope | null> {
  const identity = await readBuildingIdentity(id);
  if (!identity) return null;
  const rows = await readBuildingLocaleRows(identity, false);
  const document = rows.find((r) => r.locale === locale)?.published;
  return {
    id,
    archived: identity.status === "archived",
    published: identity.status !== "archived" && Boolean(document),
    bookingUrl: document
      ? effectiveBuildingBooking(
          overlayBuildingShared(
            document,
            (await readBuildingSharedState(identity, rows)).content,
          ).content,
        )
      : null,
  };
}
export async function getBuildingEditorialModel(
  id: string,
): Promise<BuildingEditorialModel | null> {
  await requireStaff();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const identity = await readBuildingIdentity(id);
  if (!identity) return null;
  const [rows, slugByLocale] = await Promise.all([
    readBuildingLocaleRows(identity),
    buildingSlugMap(id),
  ]);
  const shared = await readBuildingSharedState(identity, rows);
  const empty = emptyBuildingEnvelope(identity.city_id);
  const locales = Object.fromEntries(
    PROPERTY_EDITOR_LOCALES.map((locale) => [
      locale,
      buildingLocaleModel(rows, locale, empty),
    ]),
  ) as BuildingEditorialModel["locales"];
  for (const locale of PROPERTY_EDITOR_LOCALES)
    locales[locale].working = overlayBuildingShared(
      locales[locale].working,
      shared.working ?? shared.content,
    );
  const assets = await loadMedia(
    PROPERTY_EDITOR_LOCALES.flatMap((locale) =>
      [locales[locale].working, locales[locale].published].flatMap((e) =>
        e ? buildingMediaIds(e) : [],
      ),
    ),
  );
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
    archived: identity.status === "archived",
    slugByLocale,
    shared,
    locales,
    previews,
  };
}
export async function getBuildingDraftPreview(
  id: string,
  locale: Locale,
): Promise<BuildingDetail | null> {
  const model = await getBuildingEditorialModel(id);
  if (!model) return null;
  const { resolveBuildingDocument } = await import("./queries");
  return resolveBuildingDocument(
    id,
    model.locales[locale].working,
    locale,
    model.slugByLocale[locale] ?? model.slugByLocale.en ?? "",
  );
}
export async function validateBuildingReferences(
  envelope: BuildingEnvelope,
  preview = false,
  localIds: Set<string> = new Set(),
): Promise<Record<string, string>> {
  const c = envelope.content;
  const [cities, neighbourhoods, amenities, media] = await Promise.all([
    listCities("en"),
    listNeighbourhoods("en"),
    c.amenity_ids.length
      ? db
          .select({ id: amenity.id })
          .from(amenity)
          .where(inArray(amenity.id, c.amenity_ids))
      : Promise.resolve([]),
    loadMedia(buildingMediaIds(envelope)),
  ]);
  const errors: Record<string, string> = {};
  if (c.city_id && !cities.some((city) => city.id === c.city_id))
    errors.city_id = "City no longer exists.";
  if (
    c.neighbourhood_id &&
    !neighbourhoods.some(
      (n) => n.id === c.neighbourhood_id && n.cityId === c.city_id,
    )
  )
    errors.neighbourhood_id = "Choose a neighbourhood in the selected city.";
  if (amenities.length !== c.amenity_ids.length)
    errors.amenity_ids = "An amenity no longer exists.";
  for (const id of buildingMediaIds(envelope)) {
    if (preview && localIds.has(id)) continue;
    const asset = media.get(id);
    if (!asset || !asset.mime.startsWith("image/"))
      errors[
        id === c.cover_media_id
          ? "cover_media_id"
          : id === c.og_image_media_id
            ? "og_image_media_id"
            : "gallery"
      ] = "Select an available image.";
  }
  return errors;
}
async function createIdentity(
  input: SavePropertyDraftInput<BuildingEditorialContent>,
) {
  const c = input.payload.content;
  await db.batch([
    propertyGraphLockQuery(),
    db.execute(
      sql`with created as (insert into building(id,slug,status,city_id) values(${input.id}::uuid,${input.slug!},'draft',${c.city_id || "00000000-0000-0000-0000-000000000000"}::uuid) on conflict(id) do nothing returning id),locales as(select unnest(array['en','es','pt','fr'])as locale) insert into building_locale_content(building_id,locale,revision)select created.id,locales.locale,0 from created cross join locales on conflict do nothing`,
    ),
  ]);
}
/** One fresh statement after the graph lock: every guard precedes all writes. */
export async function commitBuildingLocale(input: {
  id: string;
  locale: Locale;
  revision: number;
  templateRevision?: number | null;
  payload?: BuildingEnvelope;
  publish?: boolean;
  actor: string;
  shared?: PropertySharedState<BuildingEditorialContent>;
  sharedChanged?: boolean;
  expectedSharedRevision?: number;
}): Promise<boolean> {
  const shared = input.shared;
  const proposed = input.payload;
  const candidate = input.publish
    ? sql`target.draft`
    : sql`${JSON.stringify(proposed)}::jsonb`;
  const commonCandidate = input.sharedChanged
    ? sql`${candidate}->'content'`
    : sql`coalesce((select data->'content' from current_shared),${candidate}->'content')`;
  const excluded = sql`array[${sql.join(
    BUILDING_SHARED_KEYS.map((key) => sql`${key}::text`),
    sql`, `,
  )}]::text[]`;
  const [, result] = await db.batch([
    propertyGraphLockQuery(),
    db.execute(sql`with parent as materialized(select id,status from building where id=${input.id}::uuid for update),
    template as materialized(select revision,coalesce(draft,published)as document from building_locale_content where building_id=${input.id}::uuid and locale='en' for update),
    current_shared as materialized(select data,revision from building_shared_content where building_id=${input.id}::uuid for update),
    eligible as materialized(select target.id,${candidate} as document from building_locale_content target where target.building_id=${input.id}::uuid and target.locale=${input.locale} and target.revision=${input.revision}
      and exists(select 1 from parent where status<>'archived')
      ${input.publish ? sql`and target.draft is not null` : sql``}
      ${input.sharedChanged ? sql`and coalesce((select revision from current_shared),0)=${input.expectedSharedRevision ?? 0}` : sql``}
      and (${input.locale}='en' or coalesce(${candidate}->>'localeMode','custom')<>'inherit' or ((${candidate}->'content') - ${excluded})=(((select document from template)->'content') - ${excluded}))
      and not exists(select 1 from jsonb_array_elements_text(coalesce(${commonCandidate}->'amenity_ids','[]'::jsonb))requested(id) left join amenity a on a.id=requested.id::uuid where a.id is null)
    ),
    shared_saved as (insert into building_shared_content(building_id,data,revision,updated_by)
      select ${input.id}::uuid,${JSON.stringify({ schemaVersion: 1, content: shared?.content ?? {} })}::jsonb,${input.sharedChanged ? 1 : 0},${input.actor} from eligible where ${Boolean(shared)}
      on conflict(building_id) do update set data=${input.sharedChanged ? sql`excluded.data` : sql`building_shared_content.data`},revision=building_shared_content.revision+${input.sharedChanged ? 1 : 0},updated_by=${input.sharedChanged ? sql`excluded.updated_by` : sql`building_shared_content.updated_by`},updated_at=${input.sharedChanged ? sql`now()` : sql`building_shared_content.updated_at`} returning data),
    effective_shared as materialized(select data->'content'as content from shared_saved union all select data->'content' from current_shared where not exists(select 1 from shared_saved)),
    normalized as materialized(select eligible.id,jsonb_set(eligible.document,'{content}',(eligible.document->'content') || coalesce((select content from effective_shared),'{}'::jsonb))as document from eligible),
    saved as(update building_locale_content target set published=${input.publish ? sql`normalized.document` : sql`target.published`},draft=${input.publish ? sql`null` : sql`normalized.document`},revision=target.revision+1,updated_at=now(),updated_by=${input.actor},draft_saved_at=${input.publish ? sql`null` : sql`now()`},published_at=${input.publish ? sql`now()` : sql`target.published_at`} from normalized where target.id=normalized.id returning target.id),
    identity_saved as(update building set position=(c->>'position')::integer,is_new=(c->>'is_new')::boolean,is_featured=(c->>'is_featured')::boolean,city_id=coalesce(nullif(c->>'city_id',''),'00000000-0000-0000-0000-000000000000')::uuid,neighbourhood_id=(c->>'neighbourhood_id')::uuid,street_address=c->>'street_address',latitude=(c->>'latitude')::double precision,longitude=(c->>'longitude')::double precision,cover_media_id=(c->>'cover_media_id')::uuid,og_image_media_id=(c->>'og_image_media_id')::uuid,avantio_id=c->>'avantio_id',avantio_url=c->>'default_booking_url',booking_enabled=(c->>'booking_enabled')::boolean,updated_at=now() from(select content as c from effective_shared)common where building.id=${input.id}::uuid and exists(select 1 from saved) and ${Boolean(shared)} returning building.id),
    gallery_deleted as(delete from building_media where building_id=${input.id}::uuid and exists(select 1 from identity_saved) returning id),
    gallery_saved as(insert into building_media(building_id,media_id,position)select ${input.id}::uuid,entry.id::uuid,(entry.position-1)::integer from effective_shared cross join lateral jsonb_array_elements_text(content->'gallery')with ordinality entry(id,position)where exists(select 1 from identity_saved) and (select count(*)from gallery_deleted)>=0),
    amenities_deleted as(delete from building_amenity where building_id=${input.id}::uuid and exists(select 1 from identity_saved) returning building_id),
    amenities_saved as(insert into building_amenity(building_id,amenity_id)select ${input.id}::uuid,entry.id::uuid from effective_shared cross join lateral jsonb_array_elements_text(content->'amenity_ids')entry(id)where exists(select 1 from identity_saved) and (select count(*)from amenities_deleted)>=0)
    select id from saved`),
  ]);
  return result.rows.length === 1;
}
export async function saveBuildingDraft(
  input: SavePropertyDraftInput<BuildingEditorialContent>,
  actor: string,
): Promise<Result> {
  const request = saveBuildingRequest.safeParse(input);
  if (!request.success) return invalid(issuesByField(request.error.issues));
  const checked = checkBuildingEnvelope(input.payload);
  if (!checked.envelope || Object.keys(checked.errors).length)
    return invalid(checked.errors);
  input = { ...input, payload: checked.envelope };
  try {
    let identity = await readBuildingIdentity(input.id);
    if (!identity) {
      if (input.locale !== "en" || input.expectedRevision !== 0 || !input.slug)
        return { ok: false, error: "not_found" };
      const errors = await validateBuildingReferences(input.payload);
      if (Object.keys(errors).length) return invalid(errors);
      await createIdentity(input);
      identity = await readBuildingIdentity(input.id);
      if (!identity) return { ok: false, error: "server" };
    }
    if (identity.status === "archived") return { ok: false, error: "archived" };
    await bootstrapBuildingLocales(identity, actor);
    const rows = await readBuildingLocaleRows(identity);
    const model = buildingLocaleModel(
      rows,
      input.locale,
      emptyBuildingEnvelope(identity.city_id),
    );
    let slugByLocale = await buildingSlugMap(input.id);
    const virgin = rows.every(
      (row) =>
        row.revision === 0 && row.draft === null && row.published === null,
    );
    if (input.slug !== undefined && input.slug !== identity.slug) {
      if (!virgin || input.locale !== "en" || input.expectedRevision !== 0)
        return invalid({ slug: "The building URL cannot be changed." });
      const changed = await db.execute(
        sql`update building set slug=${input.slug},updated_at=now()where id=${input.id}::uuid and status='draft' and not exists(select 1 from building_locale_content where building_id=${input.id}::uuid and(revision<>0 or draft is not null or published is not null))returning id`,
      );
      if (!changed.rows.length) return { ok: false, error: "conflict" };
      await deleteSlugs("building", input.id);
      identity = { ...identity, slug: input.slug };
      slugByLocale = {};
    }
    if (virgin && input.locale === "en") {
      await setSlugs(
        "building",
        input.id,
        Object.fromEntries(
          PROPERTY_EDITOR_LOCALES.filter((locale) => !slugByLocale[locale]).map(
            (locale) => [locale, identity!.slug],
          ),
        ),
      );
      slugByLocale = await buildingSlugMap(input.id);
    }
    if (!slugByLocale[input.locale] && !slugByLocale.en)
      return invalid({ slug: "The building has no public URL." });
    if (model.revision !== input.expectedRevision)
      return { ok: false, error: "conflict" };
    const shared = await readBuildingSharedState(identity, rows);
    const sharedChanged = input.sharedChanged ?? input.locale === "en";
    if (
      sharedChanged &&
      (input.expectedSharedRevision ?? 0) !== shared.revision
    )
      return { ok: false, error: "conflict" };
    const mode =
      input.locale === "en" ? "custom" : (input.payload.localeMode ?? "custom");
    if (mode === "inherit" && model.working.localeMode === "custom")
      return invalid({ _source: "This language already has its own content." });
    let payload: BuildingEnvelope = { ...input.payload, localeMode: mode };
    if (
      mode === "inherit" &&
      !buildingValuesEqual(
        buildingLocalizedContent(payload),
        buildingLocalizedContent(model.working),
      )
    )
      return { ok: false, error: "conflict" };
    const nextShared = {
      revision: shared.revision,
      content: sharedChanged
        ? buildingSharedContent(payload.content)
        : shared.content,
    };
    payload = overlayBuildingShared(payload, nextShared.content);
    const errors = await validateBuildingReferences(payload);
    if (Object.keys(errors).length) return invalid(errors);
    if (
      !(await commitBuildingLocale({
        id: input.id,
        locale: input.locale,
        revision: input.expectedRevision,
        payload,
        actor,
        shared: nextShared,
        sharedChanged,
        expectedSharedRevision: input.expectedSharedRevision ?? 0,
      }))
    )
      return { ok: false, error: "conflict" };
    const currentShared = (await getBuildingSharedState(input.id))!;
    const savedRows = await readBuildingLocaleRows(identity);
    const savedModel = buildingLocaleModel(
      savedRows,
      input.locale,
      emptyBuildingEnvelope(identity.city_id),
    );
    savedModel.working = overlayBuildingShared(
      savedModel.working,
      currentShared.content,
    );
    return {
      ok: true,
      id: input.id,
      slugByLocale,
      model: savedModel,
      shared: currentShared,
      previews: await buildingPreviews(savedModel.working),
    };
  } catch (error) {
    if (error instanceof PropertyLegacyError)
      return { ok: false, error: "legacy_invalid" };
    if (error instanceof SlugConflictError)
      return { ok: false, error: "slug_conflict" };
    console.error(
      "Building draft failed",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, error: "server" };
  }
}
export async function publishBuildingDraft(
  input: PublishPropertyDraftInput,
  actor: string,
): Promise<Result> {
  const parsed = publishBuildingRequest.safeParse(input);
  if (!parsed.success) return invalid(issuesByField(parsed.error.issues));
  try {
    const identity = await readBuildingIdentity(input.id);
    if (!identity) return { ok: false, error: "not_found" };
    if (identity.status === "archived") return { ok: false, error: "archived" };
    await bootstrapBuildingLocales(identity, actor);
    const rows = await readBuildingLocaleRows(identity);
    const model = buildingLocaleModel(
      rows,
      input.locale,
      emptyBuildingEnvelope(identity.city_id),
    );
    if (model.revision !== input.expectedRevision)
      return { ok: false, error: "conflict" };
    if (!model.draft) return { ok: false, error: "no_draft" };
    const shared = await readBuildingSharedState(identity, rows);
    if (shared.working)
      return invalid({ _source: "Save shared changes before publishing." });
    const payload = overlayBuildingShared(model.draft, shared.content);
    if (
      input.locale !== "en" &&
      payload.localeMode === "inherit" &&
      !buildingValuesEqual(
        buildingLocalizedContent(payload),
        buildingLocalizedContent(model.working),
      )
    )
      return { ok: false, error: "conflict" };
    const checked = checkBuildingEnvelope(payload, true);
    if (!checked.envelope || Object.keys(checked.errors).length)
      return invalid(checked.errors);
    const errors = await validateBuildingReferences(checked.envelope);
    if (Object.keys(errors).length) return invalid(errors);
    const slugByLocale = await buildingSlugMap(input.id);
    if (!slugByLocale[input.locale] && !slugByLocale.en)
      return invalid({ slug: "The building has no public URL." });
    if (
      !(await commitBuildingLocale({
        id: input.id,
        locale: input.locale,
        revision: input.expectedRevision,
        publish: true,
        actor,
      }))
    )
      return { ok: false, error: "conflict" };
    return {
      ok: true,
      id: input.id,
      slugByLocale,
      shared,
      previews: await buildingPreviews(payload),
      model: {
        ...model,
        revision: model.revision + 1,
        published: payload,
        working: payload,
        draft: null,
        templateRevision:
          input.locale === "en"
            ? null
            : (rows.find((r) => r.locale === "en")?.revision ?? 0),
      },
    };
  } catch (error) {
    if (error instanceof PropertyLegacyError)
      return { ok: false, error: "legacy_invalid" };
    console.error(
      "Building publish failed",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, error: "server" };
  }
}
export async function deleteBuildingIdentityIfUnused(
  id: string,
): Promise<{ ok: true } | { ok: false; error: "not_found" | "in_use" }> {
  const { apartmentIdentityGuardSql } =
    await import("@slices/apartments/contract");
  const [, result] = await db.batch([
    propertyGraphLockQuery(),
    db.execute(
      sql`with children as materialized(${apartmentIdentityGuardSql(id)}),deleted as(delete from building where id=${id}::uuid and not exists(select 1 from children)returning id)select exists(select 1 from deleted)as deleted,exists(select 1 from children)as in_use`,
    ),
  ]);
  const row = result.rows[0];
  return row?.deleted
    ? { ok: true }
    : { ok: false, error: row?.in_use ? "in_use" : "not_found" };
}
