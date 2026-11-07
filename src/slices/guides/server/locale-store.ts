import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@core/db/client";
import {
  loadAlternateSlugs,
  resolveSlug,
  setSlugs,
  SlugConflictError,
} from "@core/i18n";
import { loadMedia } from "@core/media";
import { IMAGE_MIMES } from "@core/media/mime";
import { listGuideCityOptions } from "@slices/geography/contract";
import { guideTreeErrors } from "../admin/validation";
import {
  GUIDE_EDITOR_LOCALES,
  type GuideEditorialResult,
  type GuideEnvelope,
  type GuideSharedContent,
  type SaveGuideDraftInput,
} from "../editorial-types";
import {
  guideSharedContent,
  guideValuesEqual,
  guideLocalizedEqual,
  guideSharedMediaIds,
  guideContentMediaIds,
  overlayGuideShared,
} from "../locale-content";
import {
  saveGuideRequestSchema,
  publishGuideRequestSchema,
  checkGuideEnvelope,
  guideSharedSchema,
  guideLocaleFieldErrors,
} from "./locale-validation";
import {
  GuideLegacyError,
  readGuideIdentity,
  readGuideLocaleRows,
  type GuideIdentity,
  type GuideLocaleRow,
} from "./locale-bootstrap";
import { readGuideEditorialModel } from "./locale-model";
const invalid = (
  fieldErrors: Record<string, string>,
): GuideEditorialResult => ({ ok: false, error: "validation", fieldErrors });
const graphLock = () => db.execute(sql`select pg_advisory_xact_lock(7160,1)`);
function seedQuery(
  identity: GuideIdentity,
  rows: GuideLocaleRow[],
  shared: GuideSharedContent,
  actor: string,
) {
  const data = rows.map((r) => ({
    locale: r.locale,
    published: r.published,
    draft: r.draft,
    published_at: r.published_at?.toISOString() ?? null,
    draft_saved_at: r.draft_saved_at?.toISOString() ?? null,
  }));
  return db.execute(
    sql`with parent as materialized(select id from guide_page where id=${identity.id}::uuid for update),seeded as(insert into guide_locale_content(guide_id,locale,published,draft,published_at,draft_saved_at,updated_by) select parent.id,x.locale,x.published,x.draft,x.published_at,x.draft_saved_at,${actor} from parent cross join jsonb_to_recordset(${JSON.stringify(data)}::jsonb) as x(locale text,published jsonb,draft jsonb,published_at timestamptz,draft_saved_at timestamptz) on conflict(guide_id,locale) do nothing returning id) insert into guide_shared_content(guide_id,data,updated_by) select id,${JSON.stringify({ schemaVersion: 1, content: shared })}::jsonb,${actor} from parent on conflict(guide_id) do nothing`,
  );
}
export function guideSharedPayloadErrors(
  envelope: GuideEnvelope,
  shared: GuideSharedContent,
  previous?: GuideSharedContent,
  locale: "en" | "es" | "pt" | "fr" = "en",
) {
  const errors: Record<string, string> = {};
  const expected = guideSharedContent(envelope.content, shared, locale);
  if (!guideValuesEqual(expected, shared))
    errors._shared = "Shared values must match the selected form.";
  if (previous) {
    for (const id of Object.keys(previous.sections))
      if (!shared.sections[id])
        errors._shared = "Retain saved section identities.";
    for (const [id, p] of Object.entries(previous.places)) {
      if (!shared.places[id] || shared.places[id].section_id !== p.section_id)
        errors._shared = "Retain saved place identities and registry parents.";
    }
    if (locale !== "en")
      for (const [id, p] of Object.entries(shared.places))
        if (
          p.recommendation_type !==
          (previous.places[id]?.recommendation_type ?? null)
        )
          errors._shared = "Choose recommendation categories in English.";
  }
  const all = new Set<string>();
  for (const id of [
    ...Object.keys(shared.sections),
    ...Object.keys(shared.places),
  ]) {
    if (all.has(id))
      errors._shared = "Section and place identities must be distinct.";
    all.add(id);
  }
  return errors;
}
async function references(
  shared: GuideSharedContent,
  ids = guideSharedMediaIds(shared),
) {
  const errors: Record<string, string> = {};
  const [cities, assets] = await Promise.all([
    listGuideCityOptions(),
    loadMedia(ids),
  ]);
  if (!cities.some((c) => c.id === shared.city_id))
    errors.city_id = "Select an existing city.";
  for (const id of ids)
    if (
      !(IMAGE_MIMES as readonly string[]).includes(assets.get(id)?.mime ?? "")
    )
      errors._shared = "Select an uploaded JPEG, PNG, WebP or AVIF image.";
  return errors;
}
async function ownsGuideNodes(
  guideId: string,
  shared: GuideSharedContent,
): Promise<boolean> {
  const sectionIds = Object.keys(shared.sections),
    placeIds = Object.keys(shared.places);
  const result = await db.execute(sql`select not (
 exists(select 1 from guide_section where id=${guideId}::uuid)
 or exists(select 1 from guide_place where id=${guideId}::uuid)
 or exists(select 1 from guide_section where id in(select value::uuid from jsonb_array_elements_text(${JSON.stringify(sectionIds)}::jsonb)) and guide_page_id<>${guideId}::uuid)
 or exists(select 1 from guide_place p join guide_section s on s.id=p.guide_section_id where p.id in(select value::uuid from jsonb_array_elements_text(${JSON.stringify(placeIds)}::jsonb)) and s.guide_page_id<>${guideId}::uuid)
 or exists(select 1 from guide_place where id in(select value::uuid from jsonb_array_elements_text(${JSON.stringify(sectionIds)}::jsonb)))
 or exists(select 1 from guide_section where id in(select value::uuid from jsonb_array_elements_text(${JSON.stringify(placeIds)}::jsonb)))
 or exists(select 1 from guide_page where id in(select value::uuid from jsonb_array_elements_text(${JSON.stringify([...sectionIds, ...placeIds])}::jsonb)))
 ) as valid`);
  return result.rows[0]?.valid === true;
}
async function commitDraft(
  input: SaveGuideDraftInput,
  identity: GuideIdentity,
  rows: GuideLocaleRow[],
  before: GuideSharedContent,
  shared: GuideSharedContent,
  actor: string,
) {
  const sections = Object.entries(shared.sections).map(([id, s]) => ({
    id,
    ...s,
  }));
  const places = Object.entries(shared.places).map(([id, p]) => ({ id, ...p }));
  const c = shared;
  const [, , result] = await db.batch([
    graphLock(),
    seedQuery(identity, rows, before, actor),
    db.execute(sql`with parent as materialized(select id from guide_page where id=${input.guideId}::uuid for update),selected as materialized(select id,revision from guide_locale_content where guide_id=${input.guideId}::uuid and locale=${input.locale} for update),english as materialized(select revision from guide_locale_content where guide_id=${input.guideId}::uuid and locale='en' for update),common as materialized(select id,revision from guide_shared_content where guide_id=${input.guideId}::uuid for update),sections as materialized(select * from jsonb_to_recordset(${JSON.stringify(sections)}::jsonb) as s(id uuid,header_media_id uuid,layout text,presentation jsonb)),places as materialized(select * from jsonb_to_recordset(${JSON.stringify(places)}::jsonb) as p(id uuid,section_id uuid,media_id uuid,address text,phone text,price_tier text,latitude double precision,longitude double precision)),eligible as materialized(
 select selected.id from selected,english,common,parent where selected.revision=${input.expectedRevision} and common.revision=${input.expectedSharedRevision} ${input.templateRevision !== null ? sql`and english.revision=${input.templateRevision}` : sql``}
 and not exists(select 1 from sections s join guide_section old on old.id=s.id where old.guide_page_id<>parent.id)
 and not exists(select 1 from places p join guide_place old on old.id=p.id join guide_section owner on owner.id=old.guide_section_id where owner.guide_page_id<>parent.id)
 and not exists(select 1 from sections s join guide_place old on old.id=s.id)
 and not exists(select 1 from places p join guide_section old on old.id=p.id)
 and not exists(select 1 from guide_page old where old.id in(select id from sections union all select id from places))
 ),saved as(update guide_locale_content set draft=${JSON.stringify(input.payload)}::jsonb,revision=revision+1,draft_saved_at=now(),updated_at=now(),updated_by=${actor} where id in(select id from eligible) returning id),shared_saved as(update guide_shared_content set data=${JSON.stringify({ schemaVersion: 1, content: shared })}::jsonb,revision=revision+1,updated_at=now(),updated_by=${actor} where id in(select common.id from common) and exists(select 1 from saved) returning id),mirrored as(update guide_page set city_id=${c.city_id}::uuid,template=${c.template},position=${c.position},hero_media_id=${c.hero_media_id}::uuid,og_image_media_id=${c.og_image_media_id}::uuid,updated_at=now() where id=${input.guideId}::uuid and exists(select 1 from shared_saved) returning id),registered_sections as(insert into guide_section(id,guide_page_id,header_media_id,layout,presentation) select s.id,${input.guideId}::uuid,s.header_media_id,s.layout,s.presentation from sections s where exists(select 1 from mirrored) on conflict(id) do nothing returning id),registered_places as(insert into guide_place(id,guide_section_id,media_id,address,phone,price_tier,latitude,longitude) select p.id,p.section_id,p.media_id,p.address,p.phone,p.price_tier,p.latitude,p.longitude from places p where exists(select 1 from mirrored) and (exists(select 1 from registered_sections s where s.id=p.section_id) or exists(select 1 from guide_section s where s.id=p.section_id and s.guide_page_id=${input.guideId}::uuid)) on conflict(id) do nothing returning id) select id from saved`),
  ]);
  return result.rows.length === 1;
}
async function success(id: string): Promise<GuideEditorialResult> {
  const model = await readGuideEditorialModel(id);
  return model ? { ok: true, model } : { ok: false, error: "not_found" };
}
function failure(error: unknown): GuideEditorialResult {
  if (error instanceof GuideLegacyError)
    return { ok: false, error: "legacy_invalid" };
  if (error instanceof SlugConflictError)
    return { ok: false, error: "slug_conflict" };
  console.error(
    "Guide editorial mutation failed",
    error instanceof Error ? error.message : "unknown",
  );
  return { ok: false, error: "server" };
}
export async function saveGuideDraft(
  raw: unknown,
  actor: string,
): Promise<GuideEditorialResult> {
  const request = saveGuideRequestSchema.safeParse(raw);
  if (!request.success)
    return invalid(guideLocaleFieldErrors(request.error.issues));
  let input = request.data as SaveGuideDraftInput;
  const checked = checkGuideEnvelope(input.payload, input.guideId);
  if (!checked.envelope || Object.keys(checked.errors).length)
    return invalid(checked.errors);
  input = { ...input, payload: checked.envelope };
  try {
    let identity = await readGuideIdentity(input.guideId);
    let shared = input.shared ?? guideSharedContent(input.payload.content);
    if (!guideSharedSchema.safeParse(shared).success)
      return invalid({ _shared: "Invalid shared data." });
    const initialErrors = guideSharedPayloadErrors(
      input.payload,
      shared,
      undefined,
      input.locale,
    );
    if (Object.keys(initialErrors).length) return invalid(initialErrors);
    if (!identity) {
      if (!(await ownsGuideNodes(input.guideId, shared)))
        return { ok: false, error: "ownership" };
      if (
        input.locale !== "en" ||
        input.expectedRevision !== 0 ||
        input.expectedSharedRevision !== 0 ||
        !input.slug
      )
        return { ok: false, error: "not_found" };
      const errors = await references(shared);
      if (Object.keys(errors).length) return invalid(errors);
      const owners = await Promise.all(
        GUIDE_EDITOR_LOCALES.map((locale) =>
          resolveSlug("guide_page", locale, input.slug!),
        ),
      );
      if (owners.some((id) => id && id !== input.guideId))
        return { ok: false, error: "slug_conflict" };
      // Reserve roots under the same graph lock as child registration, so a
      // concurrent guide cannot claim this UUID as a section or place.
      await db.batch([
        graphLock(),
        db.execute(sql`with created as(insert into guide_page(id,city_id,template,slug,status)
          select ${input.guideId}::uuid,${shared.city_id}::uuid,${shared.template},${input.slug},'draft'
          where not exists(select 1 from guide_section where id=${input.guideId}::uuid)
          and not exists(select 1 from guide_place where id=${input.guideId}::uuid)
          on conflict(id) do nothing returning id)
          insert into guide_locale_content(guide_id,locale) select created.id,locale
          from created cross join unnest(array['en','es','pt','fr']) locale on conflict do nothing`),
      ]);
      identity = await readGuideIdentity(input.guideId);
      if (!identity) return { ok: false, error: "ownership" };
    }
    const model = await readGuideEditorialModel(input.guideId);
    if (!model) return { ok: false, error: "not_found" };
    const selected = model.locales[input.locale];
    if (
      selected.revision !== input.expectedRevision ||
      model.shared.revision !== input.expectedSharedRevision ||
      selected.templateRevision !== input.templateRevision
    )
      return { ok: false, error: "conflict" };
    const rows = await readGuideLocaleRows(identity);
    const virgin = rows.every(
      (r) => r.revision === 0 && !r.draft && !r.published,
    );
    if (input.slug !== undefined && input.slug !== identity.slug)
      return invalid({ slug: "Existing guide URLs are preserved." });
    shared =
      input.shared ??
      guideSharedContent(
        input.payload.content,
        model.shared.content,
        input.locale,
      );
    const errors = guideSharedPayloadErrors(
      input.payload,
      shared,
      model.shared.content,
      input.locale,
    );
    if (!(await ownsGuideNodes(input.guideId, shared)))
      return { ok: false, error: "ownership" };
    const previous = model.shared.content;
    const changedMedia = [
      shared.hero_media_id !== previous.hero_media_id
        ? shared.hero_media_id
        : null,
      shared.og_image_media_id !== previous.og_image_media_id
        ? shared.og_image_media_id
        : null,
      ...Object.entries(shared.sections).map(([id, row]) =>
        row.header_media_id !== previous.sections[id]?.header_media_id
          ? row.header_media_id
          : null,
      ),
      ...Object.entries(shared.places).map(([id, row]) =>
        row.media_id !== previous.places[id]?.media_id ? row.media_id : null,
      ),
    ].filter((id): id is string => Boolean(id));
    const ids = [
      ...new Set([
        ...guideContentMediaIds(input.payload.content),
        ...changedMedia,
      ]),
    ];
    Object.assign(errors, await references(shared, ids));
    if (Object.keys(errors).length) return invalid(errors);
    input = {
      ...input,
      payload: {
        ...input.payload,
        localeMode:
          input.locale === "en" ||
          selected.working.localeMode === "custom" ||
          !guideLocalizedEqual(input.payload.content, selected.working.content)
            ? "custom"
            : "inherit",
      },
    };
    if (virgin && input.locale === "en") {
      const existing = await loadAlternateSlugs("guide_page", input.guideId);
      await setSlugs(
        "guide_page",
        input.guideId,
        Object.fromEntries(
          GUIDE_EDITOR_LOCALES.filter((l) => !existing[l]).map((l) => [
            l,
            identity!.slug,
          ]),
        ),
      );
    }
    if (
      !(await commitDraft(
        input,
        identity,
        rows,
        model.shared.content,
        shared,
        actor,
      ))
    )
      return { ok: false, error: "conflict" };
    return success(input.guideId);
  } catch (error) {
    return failure(error);
  }
}
export async function publishGuideDraft(
  raw: unknown,
  actor: string,
): Promise<GuideEditorialResult> {
  const parsed = publishGuideRequestSchema.safeParse(raw);
  if (!parsed.success)
    return invalid(guideLocaleFieldErrors(parsed.error.issues));
  const input = parsed.data;
  try {
    const model = await readGuideEditorialModel(input.guideId);
    if (!model) return { ok: false, error: "not_found" };
    const selected = model.locales[input.locale];
    if (selected.revision !== input.expectedRevision)
      return { ok: false, error: "conflict" };
    if (!selected.draft) return { ok: false, error: "no_draft" };
    if (
      selected.templateRevision !== null &&
      !guideLocalizedEqual(
        selected.draft.content,
        model.locales.en.working.content,
      )
    )
      return { ok: false, error: "conflict" };
    const publishing = overlayGuideShared(selected.draft, model.shared.content);
    const errors = guideTreeErrors(
      {
        ...publishing.content,
        id: input.guideId,
        status: "published",
        slug: model.slugByLocale[input.locale] ?? "",
        slugs: { en: model.slugByLocale[input.locale] },
        sections: publishing.content.sections,
      },
      model.cities,
    );
    Object.assign(
      errors,
      await references(
        model.shared.content,
        guideContentMediaIds(publishing.content),
      ),
    );
    if (!model.slugByLocale[input.locale])
      errors.slug = "A public URL is required.";
    if (Object.keys(errors).length) return invalid(errors);
    const [, result] = await db.batch([
      graphLock(),
      db.execute(
        sql`with eligible as materialized(select l.id from guide_locale_content l join guide_shared_content s on s.guide_id=l.guide_id where l.guide_id=${input.guideId}::uuid and l.locale=${input.locale} and l.revision=${input.expectedRevision} and l.draft is not null and s.revision=${model.shared.revision} ${selected.templateRevision !== null ? sql`and exists(select 1 from guide_locale_content en where en.guide_id=l.guide_id and en.locale='en' and en.revision=${selected.templateRevision})` : sql``} for update of l,s),published as(update guide_locale_content set published=${JSON.stringify(publishing)}::jsonb,draft=null,revision=revision+1,published_at=now(),draft_saved_at=null,updated_at=now(),updated_by=${actor} where id in(select id from eligible) returning id),visible as(update guide_page set status='published',updated_at=now() where id=${input.guideId}::uuid and exists(select 1 from published) returning id) select id from published`,
      ),
    ]);
    if (!result.rows.length) return { ok: false, error: "conflict" };
    return success(input.guideId);
  } catch (error) {
    return failure(error);
  }
}
export async function setGuideArchived(
  id: string,
  archived: boolean,
  actor: string,
): Promise<GuideEditorialResult> {
  try {
    const identity = await readGuideIdentity(id);
    if (!identity) return { ok: false, error: "not_found" };
    const model = await readGuideEditorialModel(id);
    if (!model) return { ok: false, error: "not_found" };
    const rows = await readGuideLocaleRows(identity);
    await db.batch([
      graphLock(),
      seedQuery(identity, rows, model.shared.content, actor),
      db.execute(
        sql`update guide_page set status=${archived ? sql`'archived'` : sql`case when exists(select 1 from guide_locale_content where guide_id=${id}::uuid and published is not null) then 'published' else 'draft' end`},updated_at=now() where id=${id}::uuid`,
      ),
    ]);
    return success(id);
  } catch (error) {
    return failure(error);
  }
}
