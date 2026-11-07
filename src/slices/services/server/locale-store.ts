import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import {
  SlugConflictError,
  loadAlternateSlugs,
  resolveSlug,
  setSlugs,
} from "@core/i18n";
import { loadMedia } from "@core/media";
import { IMAGE_MIMES } from "@core/media/mime";
import {
  SERVICE_EDITOR_LOCALES,
  SERVICE_SHARED_KEYS,
  type SaveServiceDraftInput,
  type PublishServiceDraftInput,
  type ServiceEditorialResult,
  type ServiceEnvelope,
  type ServiceSharedContent,
} from "../editorial-types";
import {
  serviceLocalizedEqual,
  serviceValuesEqual,
  serviceSharedContent,
  identifyServiceContent,
  overlayServiceShared,
  serviceContentMediaIds,
} from "../locale-content";
import { service, service_category } from "../schema";
import {
  checkServiceEnvelope,
  saveServiceRequestSchema,
  publishServiceRequestSchema,
  serviceFieldErrors,
  serviceSharedSchema,
} from "./locale-validation";
import {
  ServiceLegacyError,
  readServiceIdentity,
  readServiceLocaleRows,
  type ServiceIdentity,
  type ServiceLocaleRow,
} from "./locale-bootstrap";
import { readServiceEditorialModel } from "./locale-model";

const invalid = (
  fieldErrors: Record<string, string>,
): ServiceEditorialResult => ({ ok: false, error: "validation", fieldErrors });
export async function validateServiceReferences(
  envelope: ServiceEnvelope,
): Promise<Record<string, string>> {
  const c = envelope.content;
  const [categories, assets] = await Promise.all([
    db
      .select({ id: service_category.id })
      .from(service_category)
      .where(eq(service_category.id, c.category_id))
      .limit(1),
    loadMedia(serviceContentMediaIds(c)),
  ]);
  const errors: Record<string, string> = {};
  if (!categories.length) errors.category_id = "Category no longer exists.";
  const refs = [
    { id: c.cover_media_id, path: "cover_media_id" },
    { id: c.og_image_media_id, path: "og_image_media_id" },
    ...c.gallery.map((id, i) => ({ id, path: `gallery.${i}` })),
    ...c.detail.itinerary.map((step, i) => ({
      id: step.media_id,
      path: `detail.itinerary.${i}.media_id`,
    })),
  ];
  for (const ref of refs)
    if (
      ref.id &&
      !(IMAGE_MIMES as readonly string[]).includes(
        assets.get(ref.id)?.mime ?? "",
      )
    )
      errors[ref.path] = "Select an uploaded JPEG, PNG, WebP or AVIF image.";
  return errors;
}
export function serviceSourceOnlyErrors(
  envelope: ServiceEnvelope,
  shared: ServiceSharedContent,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (envelope.content.category_id !== shared.category_id)
    errors.category_id = "Choose the shared category in English.";
  if (
    !serviceValuesEqual(
      envelope.content.presentation?.icons ?? {},
      shared.presentation?.icons ?? {},
    )
  )
    errors.presentation = "Choose shared icons in English.";
  for (const [i, fact] of envelope.content.detail.facts.entries()) {
    if (
      !fact.id ||
      !Object.hasOwn(shared.factIcons, fact.id) ||
      shared.factIcons[fact.id] !== fact.icon
    )
      errors[`detail.facts.${i}.icon`] =
        "Choose shared icons and add facts in English.";
  }
  return errors;
}
function sharedPayloadErrors(
  envelope: ServiceEnvelope,
  shared: ServiceSharedContent,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const key of SERVICE_SHARED_KEYS)
    if (!serviceValuesEqual(shared[key], envelope.content[key]))
      errors[key] = "Shared values must match the selected form.";
  for (const fact of envelope.content.detail.facts)
    if (!fact.id || shared.factIcons[fact.id] !== fact.icon)
      errors["detail.facts"] =
        "Shared fact icons must match the selected form.";
  for (const step of envelope.content.detail.itinerary)
    if (
      !step.id ||
      !Object.hasOwn(shared.itineraryMedia, step.id) ||
      shared.itineraryMedia[step.id] !== (step.media_id ?? null)
    )
      errors["detail.itinerary"] =
        "Shared itinerary images must match the selected form.";
  return errors;
}
/** All locale/shared mutations serialize on the same graph lock. The following
 * statement sees a fresh READ COMMITTED snapshot after waiting for that lock. */
const graphLock = () => db.execute(sql`select pg_advisory_xact_lock(7159,1)`);
async function reserveIdentity(
  input: SaveServiceDraftInput,
): Promise<ServiceIdentity | null> {
  const c = input.payload.content;
  // Reservation is deliberately unpublished and idempotent. Failed first-save
  // validation occurs before this seam; retrying uses the same client UUID.
  await db.execute(sql`with created as (
    insert into service(id,slug,status,category_id) values(${input.serviceId}::uuid,${input.slug!},'draft',${c.category_id}::uuid)
    on conflict(id) do nothing returning id
  ) insert into service_locale_content(service_id,locale,revision)
    select created.id,locale,0 from created cross join unnest(array['en','es','pt','fr']) locale on conflict do nothing`);
  return readServiceIdentity(input.serviceId);
}
/** Seed only missing rows from the audited read-only legacy projection. Existing
 * authored rows are never replaced. Bootstrap participates in the save batch. */
function seedQuery(
  identity: ServiceIdentity,
  rows: ServiceLocaleRow[],
  shared: ServiceSharedContent,
  actor: string,
) {
  const data = rows.map((row) => ({
    locale: row.locale,
    published: row.published,
    draft: row.draft,
    published_at: row.published_at?.toISOString() ?? null,
    draft_saved_at: row.draft_saved_at?.toISOString() ?? null,
  }));
  return db.execute(sql`with parent as materialized (select id from service where id=${identity.id}::uuid for update),
    seeded as (insert into service_locale_content(service_id,locale,published,draft,revision,published_at,draft_saved_at,updated_by)
      select parent.id,x.locale,x.published,x.draft,0,x.published_at,x.draft_saved_at,${actor}
      from parent cross join jsonb_to_recordset(${JSON.stringify(data)}::jsonb)
        as x(locale text,published jsonb,draft jsonb,published_at timestamptz,draft_saved_at timestamptz)
      on conflict(service_id,locale) do nothing returning id)
    insert into service_shared_content(service_id,data,revision,updated_by)
      select id,${JSON.stringify({ schemaVersion: 1, content: shared })}::jsonb,0,${actor} from parent
      on conflict(service_id) do nothing`);
}
async function commitDraft(
  input: SaveServiceDraftInput,
  rows: ServiceLocaleRow[],
  sharedBefore: ServiceSharedContent,
  shared: ServiceSharedContent,
  identity: ServiceIdentity,
  actor: string,
): Promise<boolean> {
  const c = input.payload.content;
  const [, , result] = await db.batch([
    graphLock(),
    seedQuery(identity, rows, sharedBefore, actor),
    db.execute(sql`with parent as materialized (
      select id,status from service where id=${input.serviceId}::uuid for update
    ), selected as materialized (
      select id,revision from service_locale_content where service_id=${input.serviceId}::uuid and locale=${input.locale} for update
    ), english as materialized (
      select revision from service_locale_content where service_id=${input.serviceId}::uuid and locale='en' for update
    ), common as materialized (
      select id,revision from service_shared_content where service_id=${input.serviceId}::uuid for update
    ), eligible as materialized (
      select selected.id from selected,common,english,parent where selected.revision=${input.expectedRevision}
      and common.revision=${input.expectedSharedRevision}
      ${input.templateRevision != null ? sql`and english.revision=${input.templateRevision}` : sql``}
    ), saved as (
      update service_locale_content set draft=${JSON.stringify(input.payload)}::jsonb,revision=revision+1,
      draft_saved_at=now(),updated_at=now(),updated_by=${actor}
      where id in(select id from eligible) returning id
    ), shared_saved as (
      update service_shared_content set data=${JSON.stringify({ schemaVersion: 1, content: shared })}::jsonb,
      revision=revision+1,updated_at=now(),updated_by=${actor}
      where service_id=${input.serviceId}::uuid and exists(select 1 from saved) returning id
    ), mirrored as (
      update service set position=${c.position},category_id=${c.category_id}::uuid,
      cover_media_id=${c.cover_media_id}::uuid,og_image_media_id=${c.og_image_media_id}::uuid,
      price_from=${c.price_from},rating_tenths=${c.rating_tenths},booking_type=${c.booking_type},
      presentation=${JSON.stringify(c.presentation ?? null)}::jsonb,updated_at=now()
      where id=${input.serviceId}::uuid and exists(select 1 from shared_saved) returning id
    ), cleared as (
      delete from service_media where service_id=${input.serviceId}::uuid and exists(select 1 from mirrored) returning id
    ), gallery as (
      insert into service_media(service_id,media_id,position)
      select ${input.serviceId}::uuid,x.id::uuid,(x.ordinality-1)::integer
      from jsonb_array_elements_text(${JSON.stringify(c.gallery)}::jsonb) with ordinality x(id,ordinality)
      where exists(select 1 from mirrored) returning id
    ) select id from saved`),
  ]);
  return result.rows.length === 1;
}
export async function saveServiceDraft(
  raw: unknown,
  actor: string,
): Promise<ServiceEditorialResult> {
  const request = saveServiceRequestSchema.safeParse(raw);
  if (!request.success)
    return invalid(serviceFieldErrors(request.error.issues));
  const checked = checkServiceEnvelope(request.data.payload);
  if (!checked.envelope || Object.keys(checked.errors).length)
    return invalid(checked.errors);
  let input = {
    ...request.data,
    payload: {
      ...checked.envelope,
      content: identifyServiceContent(checked.envelope.content),
    },
  };
  try {
    if (input.shared) {
      const errors = sharedPayloadErrors(input.payload, input.shared);
      if (Object.keys(errors).length) return invalid(errors);
    }
    let identity = await readServiceIdentity(input.serviceId);
    const creating = !identity;
    if (!identity) {
      if (
        input.locale !== "en" ||
        input.expectedRevision !== 0 ||
        input.expectedSharedRevision !== 0 ||
        !input.slug
      )
        return { ok: false, error: "not_found" };
      const errors = await validateServiceReferences(input.payload);
      if (input.shared) {
        const ids = [
          ...new Set(
            Object.values(input.shared.itineraryMedia).filter(
              (id): id is string => Boolean(id),
            ),
          ),
        ];
        const assets = await loadMedia(ids);
        for (const id of ids)
          if (
            !(IMAGE_MIMES as readonly string[]).includes(
              assets.get(id)?.mime ?? "",
            )
          )
            errors._shared =
              "Select an uploaded JPEG, PNG, WebP or AVIF image.";
      }
      if (Object.keys(errors).length) return invalid(errors);
      const owners = await Promise.all(
        SERVICE_EDITOR_LOCALES.map((locale) =>
          resolveSlug("service", locale, input.slug!),
        ),
      );
      if (owners.some((id) => id && id !== input.serviceId))
        return { ok: false, error: "slug_conflict" };
      identity = await reserveIdentity(input);
      if (!identity) return { ok: false, error: "server" };
    }
    const model = await readServiceEditorialModel(input.serviceId);
    if (!model) return { ok: false, error: "not_found" };
    const selected = model.locales[input.locale];
    if (
      selected.revision !== input.expectedRevision ||
      model.shared.revision !== input.expectedSharedRevision ||
      selected.templateRevision !== input.templateRevision
    )
      return { ok: false, error: "conflict" };
    const rows = await readServiceLocaleRows(identity);
    const virgin = rows.every(
      (row) => row.revision === 0 && !row.draft && !row.published,
    );
    if (input.slug !== undefined && input.slug !== identity.slug) {
      if (!virgin || input.locale !== "en")
        return invalid({
          slug: "Existing service URLs are preserved in this editor.",
        });
      const owners = await Promise.all(
        SERVICE_EDITOR_LOCALES.map((locale) =>
          resolveSlug("service", locale, input.slug!),
        ),
      );
      if (owners.some((id) => id && id !== input.serviceId))
        return { ok: false, error: "slug_conflict" };
      await db
        .update(service)
        .set({ slug: input.slug, updated_at: new Date() })
        .where(eq(service.id, input.serviceId));
      identity = { ...identity, slug: input.slug };
    }
    if (input.locale !== "en") {
      const errors = serviceSourceOnlyErrors(
        input.payload,
        model.shared.content,
      );
      if (Object.keys(errors).length) return invalid(errors);
    }
    const referenceErrors = await validateServiceReferences(input.payload);
    if (Object.keys(referenceErrors).length) return invalid(referenceErrors);
    input = {
      ...input,
      payload: {
        ...input.payload,
        localeMode:
          input.locale === "en" ||
          selected.working.localeMode === "custom" ||
          !serviceLocalizedEqual(
            input.payload.content,
            selected.working.content,
          )
            ? "custom"
            : "inherit",
      },
    };
    const shared =
      input.shared ??
      serviceSharedContent(input.payload.content, model.shared.content);
    // Old callers omit shared; validate the merged retained maps as well.
    if (!serviceSharedSchema.safeParse(shared).success)
      return invalid({ _shared: "Shared service data is invalid or too large." });
    const sharedErrors = sharedPayloadErrors(input.payload, shared);
    // A full workspace common document may contain assets for rows belonging to
    // another language. Retain those keys, including currently inactive rows.
    for (const key of Object.keys(model.shared.content.factIcons))
      if (!Object.hasOwn(shared.factIcons, key))
        sharedErrors._shared = "Retain existing shared fact identities.";
    for (const key of Object.keys(model.shared.content.itineraryMedia))
      if (!Object.hasOwn(shared.itineraryMedia, key))
        sharedErrors._shared = "Retain existing shared itinerary identities.";
    if (
      input.locale !== "en" &&
      !serviceValuesEqual(shared.factIcons, model.shared.content.factIcons)
    )
      sharedErrors["detail.facts"] =
        "Choose shared icons and add facts in English.";
    const changedMedia = [
      ...new Set(
        Object.entries(shared.itineraryMedia).flatMap(([key, id]) =>
          id && id !== model.shared.content.itineraryMedia[key] ? [id] : [],
        ),
      ),
    ];
    const sharedAssets = await loadMedia(changedMedia);
    for (const id of changedMedia)
      if (
        !(IMAGE_MIMES as readonly string[]).includes(
          sharedAssets.get(id)?.mime ?? "",
        )
      )
        sharedErrors._shared =
          "Select an uploaded JPEG, PNG, WebP or AVIF image.";
    if (Object.keys(sharedErrors).length) return invalid(sharedErrors);
    // Only fill URLs for a virgin identity. Legacy localized slugs are immutable here.
    if (virgin && input.locale === "en") {
      const existing = await loadAlternateSlugs("service", input.serviceId);
      const missing = Object.fromEntries(
        SERVICE_EDITOR_LOCALES.filter((locale) => !existing[locale]).map(
          (locale) => [locale, identity!.slug],
        ),
      );
      await setSlugs("service", input.serviceId, missing);
    } else if (
      !model.slugByLocale[input.locale] &&
      !model.slugByLocale.en &&
      !creating
    )
      return invalid({ slug: "This service has no public URL." });
    if (
      !(await commitDraft(
        input,
        rows,
        model.shared.content,
        shared,
        identity,
        actor,
      ))
    )
      return { ok: false, error: "conflict" };
    const saved = await readServiceEditorialModel(input.serviceId);
    return saved ? { ok: true, model: saved } : { ok: false, error: "server" };
  } catch (error) {
    if (error instanceof ServiceLegacyError)
      return { ok: false, error: "legacy_invalid" };
    if (error instanceof SlugConflictError)
      return { ok: false, error: "slug_conflict" };
    console.error(
      "Service draft save failed",
      error instanceof Error && error.cause instanceof Error
        ? error.cause.message
        : error instanceof Error
          ? error.message
          : "unknown",
    );
    return { ok: false, error: "server" };
  }
}
export async function publishServiceDraft(
  input: PublishServiceDraftInput,
  actor: string,
): Promise<ServiceEditorialResult> {
  const request = publishServiceRequestSchema.safeParse(input);
  if (!request.success)
    return invalid(serviceFieldErrors(request.error.issues));
  try {
    const identity = await readServiceIdentity(input.serviceId);
    if (!identity) return { ok: false, error: "not_found" };
    const model = await readServiceEditorialModel(input.serviceId);
    if (!model) return { ok: false, error: "not_found" };
    const selected = model.locales[input.locale];
    if (selected.revision !== input.expectedRevision)
      return { ok: false, error: "conflict" };
    if (!selected.draft) return { ok: false, error: "no_draft" };
    // Publish consumes the actual saved snapshot, not a newer inherited English workspace.
    const publishing = overlayServiceShared(
      selected.draft,
      model.shared.content,
    );
    const checked = checkServiceEnvelope(publishing, true);
    if (!checked.envelope || Object.keys(checked.errors).length)
      return invalid(checked.errors);
    const errors = await validateServiceReferences(publishing);
    if (Object.keys(errors).length) return invalid(errors);
    if (!model.slugByLocale[input.locale] && !model.slugByLocale.en)
      return invalid({ slug: "This service has no public URL." });
    const rows = await readServiceLocaleRows(identity);
    const [, , result] = await db.batch([
      graphLock(),
      seedQuery(identity, rows, model.shared.content, actor),
      db.execute(sql`with parent as materialized(select id,status from service where id=${input.serviceId}::uuid for update),
        common as materialized(select revision from service_shared_content where service_id=${input.serviceId}::uuid for update),
        saved as (update service_locale_content set published=draft,draft=null,revision=revision+1,
          published_at=now(),draft_saved_at=null,updated_at=now(),updated_by=${actor}
          where service_id=${input.serviceId}::uuid and locale=${input.locale} and revision=${input.expectedRevision} and draft is not null
          and exists(select 1 from parent)
          and exists(select 1 from common where revision=${model.shared.revision}) returning id),
        activated as(update service set status='published',updated_at=now() where id=${input.serviceId}::uuid and exists(select 1 from saved) returning id)
        select id from saved`),
    ]);
    if (!result.rows.length) return { ok: false, error: "conflict" };
    const published = await readServiceEditorialModel(input.serviceId);
    return published
      ? { ok: true, model: published }
      : { ok: false, error: "server" };
  } catch (error) {
    if (error instanceof ServiceLegacyError)
      return { ok: false, error: "legacy_invalid" };
    console.error(
      "Service publication failed",
      error instanceof Error ? error.message : "unknown",
    );
    return { ok: false, error: "server" };
  }
}

/** Archive is a visibility flag. Restore reuses publications and consumes no drafts. */
export async function setServiceArchived(
  serviceId: string,
  archived: boolean,
  actor = "service-visibility",
): Promise<ServiceEditorialResult> {
  const identity = await readServiceIdentity(serviceId);
  if (!identity) return { ok: false, error: "not_found" };
  const before = await readServiceEditorialModel(serviceId);
  if (!before) return { ok: false, error: "not_found" };
  const rows = await readServiceLocaleRows(identity);
  const [, , result] = await db.batch([
    graphLock(),
    seedQuery(identity, rows, before.shared.content, actor),
    db.execute(sql`update service set status=${archived ? sql`'archived'` : sql`case when exists(select 1 from service_locale_content lc where lc.service_id=service.id and lc.published is not null) then 'published' else 'draft' end`},updated_at=now()
    where id=${serviceId}::uuid returning id`),
  ]);
  if (!result.rows.length) return { ok: false, error: "not_found" };
  const model = await readServiceEditorialModel(serviceId);
  return model ? { ok: true, model } : { ok: false, error: "not_found" };
}
