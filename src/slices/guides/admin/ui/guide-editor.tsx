"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  AdminPageHeader,
  AdminCard,
  StateBadge,
  Field,
  Select,
  FieldGrid,
  AdminButton,
  MediaField,
  MediaQueueProvider,
  useMediaQueue,
  useToast,
  type AdminMediaPreview,
} from "@slices/backoffice/contract";
import type {
  GuideActionResult,
  GuideEditBundle,
  GuidePageEdit,
  GuideCityOption,
  GuideSectionEdit,
  GuidePlaceEdit,
} from "../model";
import {
  saveGuidePage,
  saveGuideSection,
  saveGuidePlace,
  deleteGuideSection,
  deleteGuidePlace,
  reorderGuideSections,
  reorderGuidePlaces,
} from "../actions";
import {
  pagePatch,
  sectionPatch,
  placePatch,
  patchIsDirty,
  newSection,
  newPlace,
  moveItem,
  fieldError,
} from "./editor-model";
import { GuideTextField } from "./guide-place-editor";
import { GuideSectionEditor } from "./guide-section-editor";

export function GuideEditor({
  initial,
  cities,
  draft,
}: {
  initial: GuideEditBundle | null;
  cities: GuideCityOption[];
  draft: GuidePageEdit;
}) {
  return (
    <MediaQueueProvider>
      <Editor initial={initial} cities={cities} draft={draft} />
    </MediaQueueProvider>
  );
}
function Editor({
  initial,
  cities,
  draft,
}: {
  initial: GuideEditBundle | null;
  cities: GuideCityOption[];
  draft: GuidePageEdit;
}) {
  const t = useTranslations("guides.admin"),
    mediaT = useTranslations("backoffice.media"),
    toast = useToast(),
    queue = useMediaQueue();
  const [page, setPage] = useState(initial?.data ?? draft),
    [saved, setSaved] = useState<GuidePageEdit | undefined>(initial?.data);
  const [busy, setBusy] = useState(false),
    [partial, setPartial] = useState(false);
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>(
    {},
  );
  const lock = useRef(false);
  const [previews, setPreviews] = useState<Record<string, AdminMediaPreview>>(
    initial?.previews ?? {},
  );
  const onPreview = (preview: AdminMediaPreview | null) => {
    if (preview) setPreviews((prev) => ({ ...prev, [preview.id]: preview }));
  };
  const findSection = (id: string) => saved?.sections.find((s) => s.id === id);
  const findPlace = (sectionId: string, id: string) =>
    findSection(sectionId)?.places.find((p) => p.id === id);
  const pageDirty = patchIsDirty(pagePatch(page, saved));
  const sectionDirty = (s: GuideSectionEdit) =>
    patchIsDirty(sectionPatch(s, findSection(s.id)));
  const placeDirty = (s: GuideSectionEdit, p: GuidePlaceEdit) =>
    patchIsDirty(placePatch(p, findPlace(s.id, p.id)));
  const childrenDirty = page.sections.some(
    (s) => sectionDirty(s) || s.places.some((p) => placeDirty(s, p)),
  );
  const dirty = pageDirty || childrenDirty || queue.hasPending;
  const disabled = busy || initial?.integrity === "invalid" || Boolean(partial);
  const canOrder =
    Boolean(saved) && !childrenDirty && !queue.isPreparing && !disabled;
  useEffect(() => {
    if (!dirty) return;
    const before = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const click = (event: MouseEvent) => {
      const anchor = (event.target as Element).closest?.("a[href]");
      if (
        !anchor ||
        event.defaultPrevented ||
        anchor.getAttribute("target") === "_blank"
      )
        return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (!window.confirm(t("unsaved"))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", before);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", before);
      document.removeEventListener("click", click, true);
    };
  }, [dirty, t]);
  const updatePage = <K extends keyof GuidePageEdit>(
    key: K,
    value: GuidePageEdit[K],
  ) => setPage((prev) => ({ ...prev, [key]: value }));
  const updateSection = (next: GuideSectionEdit) =>
    setPage((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === next.id ? next : s)),
    }));
  function focusEntity(id: string, name?: string) {
    requestAnimationFrame(() => {
      const block = document.getElementById(`entity-${id}`);
      if (block instanceof HTMLDetailsElement) block.open = true;
      let parent = block?.parentElement;
      while (parent) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
        parent = parent.parentElement;
      }
      const fieldName = name?.replace(/^(source|changes)\./, "");
      const targetName = fieldName === "slugs.en" ? "slug" : fieldName;
      const namedInput = targetName
        ? document.getElementById(`${id}-${targetName}`)
        : null;
      const input =
        namedInput ??
        block?.querySelector("input, textarea, select, button, summary");
      (input as HTMLElement | null)?.focus();
      block?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }
  function receiveErrors(id: string, result: GuideActionResult) {
    if (result.ok) return;
    if (result.error === "partial_write") {
      if (!saved && id === page.id)
        window.history.replaceState(null, "", `/admin/guides/${page.id}`);
      setPartial(true);
      toast.error(t("partialWrite"));
      return;
    }
    const next: Record<string, Record<string, string>> = { [id]: {} };
    if (result.error === "validation")
      for (const [path, message] of Object.entries(result.fieldErrors ?? {})) {
        const parts = path.split(".");
        const entity =
          (parts[0] === "sections"
            ? parts[2] === "places"
              ? parts[3]
              : parts[1]
            : id) ?? id;
        const key =
          parts[0] === "sections"
            ? parts.slice(parts[2] === "places" ? 4 : 2).join(".")
            : path;
        (next[entity] ??= {})[key] = message;
      }
    if (result.error === "slug_conflict")
      (next[id] ??= {})["slugs.en"] = t("slugConflict");
    setErrors((prev) => ({ ...prev, ...next }));
    toast.error(
      result.error === "invalid_stored_content"
        ? t("invalidStored")
        : t("error"),
    );
    const first = Object.entries(next).find(
      ([, value]) => Object.keys(value).length,
    );
    focusEntity(first?.[0] ?? id, first ? Object.keys(first[1])[0] : undefined);
  }
  async function run(
    id: string,
    action: () => Promise<GuideActionResult>,
    success: () => void,
    needsMedia = false,
  ) {
    if (queue.isPreparing) {
      toast.info(mediaT("waitForMedia"));
      return;
    }
    if (disabled || lock.current) return;
    lock.current = true;
    setBusy(true);
    let actionStarted = false;
    try {
      if (needsMedia && !(await queue.flush())) {
        toast.error(t("error"));
        return;
      }
      actionStarted = true;
      const result = await action();
      if (!result.ok) {
        receiveErrors(id, result);
        return;
      }
      success();
      setErrors((prev) => ({ ...prev, [id]: {} }));
      toast.success(t("saved"));
    } catch {
      if (actionStarted) {
        if (!saved && id === page.id)
          window.history.replaceState(null, "", `/admin/guides/${page.id}`);
        setPartial(true);
        toast.error(t("partialWrite"));
      } else {
        toast.error(t("error"));
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function savePage() {
    if (queue.isPreparing) {
      toast.info(mediaT("waitForMedia"));
      return;
    }
    if (page.status === "published" && childrenDirty) {
      toast.info(t("saveChildrenFirst"));
      return;
    }
    const snapshot = page;
    void run(
      page.id,
      () => saveGuidePage(pagePatch(snapshot, saved)),
      () => {
        setSaved((prev) => ({ ...snapshot, sections: prev?.sections ?? [] }));
        if (!saved)
          window.history.replaceState(null, "", `/admin/guides/${page.id}`);
      },
      true,
    );
  }
  function saveSection(section: GuideSectionEdit) {
    if (!saved) return;
    const snapshot = section;
    void run(
      section.id,
      () =>
        saveGuideSection(
          page.id,
          sectionPatch(snapshot, findSection(section.id)),
        ),
      () =>
        setSaved((prev) =>
          prev
            ? {
                ...prev,
                sections: findSection(section.id)
                  ? prev.sections.map((s) =>
                      s.id === section.id
                        ? { ...snapshot, places: s.places }
                        : s,
                    )
                  : [...prev.sections, { ...snapshot, places: [] }],
              }
            : prev,
        ),
      true,
    );
  }
  function savePlace(section: GuideSectionEdit, place: GuidePlaceEdit) {
    const snapshot = place;
    void run(
      place.id,
      () =>
        saveGuidePlace(
          page.id,
          section.id,
          placePatch(snapshot, findPlace(section.id, place.id)),
        ),
      () =>
        setSaved((prev) =>
          prev
            ? {
                ...prev,
                sections: prev.sections.map((s) =>
                  s.id === section.id
                    ? {
                        ...s,
                        places: findPlace(section.id, place.id)
                          ? s.places.map((p) =>
                              p.id === place.id ? snapshot : p,
                            )
                          : [...s.places, snapshot],
                      }
                    : s,
                ),
              }
            : prev,
        ),
      true,
    );
  }
  function removeSection(section: GuideSectionEdit) {
    if (!window.confirm(t("confirmDelete"))) return;
    const remove = () => {
      for (const mediaId of [
        section.header_media_id,
        ...section.places.map((place) => place.media_id),
      ]) {
        if (mediaId && queue.isQueued(mediaId)) queue.dequeue(mediaId);
      }
      setPage((prev) => ({
        ...prev,
        sections: prev.sections.filter((s) => s.id !== section.id),
      }));
      setSaved((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.filter((s) => s.id !== section.id),
            }
          : prev,
      );
      focusEntity(page.id);
    };
    if (!findSection(section.id)) {
      remove();
      return;
    }
    void run(section.id, () => deleteGuideSection(page.id, section.id), remove);
  }
  function removePlace(section: GuideSectionEdit, place: GuidePlaceEdit) {
    if (!window.confirm(t("confirmDelete"))) return;
    const remove = () => {
      if (place.media_id && queue.isQueued(place.media_id))
        queue.dequeue(place.media_id);
      updateSection({
        ...section,
        places: section.places.filter((p) => p.id !== place.id),
      });
      setSaved((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.map((s) =>
                s.id === section.id
                  ? { ...s, places: s.places.filter((p) => p.id !== place.id) }
                  : s,
              ),
            }
          : prev,
      );
      focusEntity(section.id);
    };
    if (!findPlace(section.id, place.id)) {
      remove();
      return;
    }
    void run(
      place.id,
      () => deleteGuidePlace(page.id, section.id, place.id),
      remove,
    );
  }
  function orderSection(id: string, offset: number) {
    if (!canOrder) return;
    const sections = moveItem(page.sections, id, offset);
    void run(
      id,
      () =>
        reorderGuideSections(
          page.id,
          sections.map((s) => s.id),
        ),
      () => {
        updatePage("sections", sections);
        setSaved((prev) => (prev ? { ...prev, sections } : prev));
        focusEntity(id);
      },
    );
  }
  function orderPlace(section: GuideSectionEdit, id: string, offset: number) {
    if (!canOrder) return;
    const places = moveItem(section.places, id, offset);
    void run(
      id,
      () =>
        reorderGuidePlaces(
          page.id,
          section.id,
          places.map((p) => p.id),
        ),
      () => {
        updateSection({ ...section, places });
        setSaved((prev) =>
          prev
            ? {
                ...prev,
                sections: prev.sections.map((s) =>
                  s.id === section.id ? { ...s, places } : s,
                ),
              }
            : prev,
        );
        focusEntity(id);
      },
    );
  }
  const pageErrors = errors[page.id] ?? {};
  const text = (
    name: "title" | "intro" | "meta_title" | "meta_description",
    maxLength: number,
    multiline = false,
  ) => (
    <GuideTextField
      entityId={page.id}
      name={name}
      value={page[name]}
      errors={pageErrors}
      maxLength={maxLength}
      multiline={multiline}
      required={name === "title"}
      onChange={(v) => updatePage(name, name === "title" ? v : v || null)}
    />
  );
  const publishedCity = cities.find((city) => city.id === saved?.city_id);
  const publishedUrl =
    saved?.status === "published" &&
    publishedCity?.status === "published" &&
    saved.slugs.en
      ? `/en/guides/${publishedCity.slug}/${saved.slugs.en}`
      : null;
  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title={page.title || t("newGuide")}
        description={t("sourceHint")}
        actions={
          <>
            <StateBadge
              label={t(
                page.status === "published" ? "publishedStatus" : page.status,
              )}
              tone={page.status === "published" ? "approved" : "draft"}
            />
            <StateBadge
              label={busy ? t("saving") : dirty ? t("pending") : t("saved")}
              tone={dirty ? "review" : "approved"}
            />
          </>
        }
      />
      <div className="flex flex-wrap gap-4 text-sm text-accent-deep">
        <Link href="/admin/guides" className="underline underline-offset-4">
          {t("back")}
        </Link>
        {publishedUrl ? (
          <a
            href={publishedUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            {t("published")}
          </a>
        ) : null}
        {saved ? (
          <a
            href={`/admin/translations/guide_page/${page.id}`}
            className="underline underline-offset-4"
          >
            {t("translations")}
          </a>
        ) : null}
      </div>
      {saved?.status === "published" ? (
        <p className="rounded-md bg-amber-50 p-4 text-sm text-amber-900">
          {t("liveWarning")}
        </p>
      ) : null}
      {initial?.integrity === "invalid" ? (
        <p role="alert" className="text-sm text-red-700">
          {t("invalidStored")}
        </p>
      ) : null}
      {partial ? (
        <div
          role="alert"
          className="space-y-3 rounded-md border border-red-200 p-4 text-sm text-red-700"
        >
          <p>{t("partialWrite")}</p>
          <AdminButton
            onClick={() => {
              if (!dirty || window.confirm(t("unsaved")))
                window.location.reload();
            }}
          >
            {t("reload")}
          </AdminButton>
        </div>
      ) : null}
      {Object.entries(errors).some(([, value]) => Object.keys(value).length) ? (
        <div
          role="alert"
          className="space-y-2 rounded-md border border-red-200 p-4"
        >
          <p className="text-sm font-medium text-red-700">{t("error")}</p>
          {Object.entries(errors).flatMap(([id, value]) =>
            Object.entries(value).map(([key, message]) => (
              <button
                key={`${id}-${key}`}
                type="button"
                className="block max-w-full break-words text-left text-sm text-red-700 underline"
                onClick={() => focusEntity(id, key)}
              >
                {message}
              </button>
            )),
          )}
        </div>
      ) : null}
      <form
        id={`entity-${page.id}`}
        onSubmit={(e) => {
          e.preventDefault();
          savePage();
        }}
        className="space-y-6"
      >
        <fieldset disabled={disabled} className="min-w-0 space-y-6">
          <AdminCard title={t("general")}>
            <div className="space-y-4">
              {text("title", 200)}
              {text("intro", 1200, true)}
              <FieldGrid>
                <Field
                  label={t("labels.city_id")}
                  htmlFor={`${page.id}-city_id`}
                  error={fieldError(pageErrors, "city_id")}
                >
                  <Select
                    id={`${page.id}-city_id`}
                    value={page.city_id}
                    required
                    onChange={(e) => updatePage("city_id", e.target.value)}
                  >
                    <option value="">{t("noCity")}</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name} (
                        {t(
                          city.status === "published"
                            ? "publishedStatus"
                            : city.status,
                        )}
                        )
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label={t("labels.template")}
                  htmlFor={`${page.id}-template`}
                  error={fieldError(pageErrors, "template")}
                >
                  <Select
                    id={`${page.id}-template`}
                    value={page.template}
                    onChange={(e) =>
                      updatePage(
                        "template",
                        e.target.value as GuidePageEdit["template"],
                      )
                    }
                  >
                    {[
                      "landing",
                      "eat",
                      "beaches",
                      "events",
                      "secrets",
                      "families",
                      "groups",
                      "travellers",
                      "custom",
                    ].map((value) => (
                      <option key={value} value={value}>
                        {t(`templates.${value}`)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label={t("labels.status")}
                  htmlFor={`${page.id}-status`}
                  error={fieldError(pageErrors, "status")}
                >
                  <Select
                    id={`${page.id}-status`}
                    value={page.status}
                    onChange={(e) =>
                      updatePage(
                        "status",
                        e.target.value as GuidePageEdit["status"],
                      )
                    }
                  >
                    {["draft", "published", "archived"].map((value) => (
                      <option key={value} value={value}>
                        {t(value === "published" ? "publishedStatus" : value)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <GuideTextField
                  entityId={page.id}
                  name="position"
                  value={page.position}
                  errors={pageErrors}
                  type="number"
                  onChange={(v) => updatePage("position", Number(v))}
                />
              </FieldGrid>
              <GuideTextField
                entityId={page.id}
                name="slug"
                value={page.slugs.en ?? ""}
                errors={{
                  slug:
                    fieldError(pageErrors, "slugs.en") ??
                    fieldError(pageErrors, "slug") ??
                    "",
                }}
                maxLength={160}
                required
                onChange={(v) => {
                  setPage((prev) => ({
                    ...prev,
                    slug: v,
                    slugs: { ...prev.slugs, en: v },
                  }));
                }}
              />
              <p className="text-xs text-ink-soft">{t("slugWarning")}</p>
              <Field
                label={t("labels.hero_media_id")}
                error={fieldError(pageErrors, "hero_media_id")}
                hint={t("photoHint")}
              >
                <MediaField
                  value={page.hero_media_id}
                  preview={
                    page.hero_media_id ? previews[page.hero_media_id] : null
                  }
                  onChange={(id, preview) => {
                    onPreview(preview);
                    updatePage("hero_media_id", id);
                  }}
                />
              </Field>
            </div>
          </AdminCard>
          <AdminCard title={t("seo")}>
            <div className="space-y-4">
              {text("meta_title", 70)}
              {text("meta_description", 200, true)}
              <Field
                label={t("labels.og_image_media_id")}
                error={fieldError(pageErrors, "og_image_media_id")}
              >
                <MediaField
                  value={page.og_image_media_id}
                  preview={
                    page.og_image_media_id
                      ? previews[page.og_image_media_id]
                      : null
                  }
                  onChange={(id, preview) => {
                    onPreview(preview);
                    updatePage("og_image_media_id", id);
                  }}
                />
              </Field>
            </div>
          </AdminCard>
          <p className="text-xs text-ink-soft">{t("clearSourceWarning")}</p>
          {childrenDirty ? (
            <p className="text-sm text-ink-soft">{t("saveChildrenFirst")}</p>
          ) : null}
          {queue.isPreparing ? (
            <p role="status" className="text-sm text-ink-soft">
              {mediaT("waitForMedia")}
            </p>
          ) : null}
          <AdminButton
            type="submit"
            variant="primary"
            disabled={
              !pageDirty ||
              queue.isPreparing ||
              (page.status === "published" && childrenDirty)
            }
          >
            {t("savePage")}
          </AdminButton>
        </fieldset>
      </form>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-xl text-ink">{t("sections")}</h2>
          <AdminButton
            disabled={!saved || disabled || queue.isPreparing}
            onClick={() => {
              const section = newSection(
                crypto.randomUUID(),
                page.id,
                page.sections.length,
              );
              updatePage("sections", [...page.sections, section]);
              focusEntity(section.id);
            }}
          >
            {t("addSection")}
          </AdminButton>
        </div>
        {!saved ? (
          <p className="text-sm text-ink-soft">{t("createFirst")}</p>
        ) : null}
        {!page.sections.length ? (
          <p className="text-sm text-ink-soft">{t("emptySections")}</p>
        ) : null}
        {page.sections.map((section, index) => (
          <GuideSectionEditor
            key={section.id}
            section={section}
            previews={previews}
            onPreview={onPreview}
            errors={errors[section.id] ?? {}}
            dirty={sectionDirty(section)}
            hasPendingChildren={section.places.some((place) =>
              placeDirty(section, place),
            )}
            persisted={Boolean(findSection(section.id))}
            disabled={disabled || queue.isPreparing}
            canOrder={canOrder}
            first={index === 0}
            last={index === page.sections.length - 1}
            onChange={updateSection}
            onSave={() => saveSection(section)}
            onDelete={() => removeSection(section)}
            onMove={(offset) => orderSection(section.id, offset)}
            placeState={(place) => ({
              dirty: placeDirty(section, place),
              persisted: Boolean(findPlace(section.id, place.id)),
              errors: errors[place.id] ?? {},
            })}
            onAddPlace={() => {
              const place = newPlace(
                crypto.randomUUID(),
                section.id,
                section.places.length,
              );
              updateSection({ ...section, places: [...section.places, place] });
              focusEntity(place.id);
            }}
            onSavePlace={(id) => {
              const place = section.places.find((p) => p.id === id);
              if (place) savePlace(section, place);
            }}
            onDeletePlace={(id) => {
              const place = section.places.find((p) => p.id === id);
              if (place) removePlace(section, place);
            }}
            onMovePlace={(id, offset) => orderPlace(section, id, offset)}
          />
        ))}
      </section>
      <p className="text-xs text-ink-soft">
        {t("sharedHint")}{" "}
        <Link
          href="/admin/pages/guides"
          className="text-accent-deep underline underline-offset-4"
        >
          {t("sharedPagesLink")}
        </Link>{" "}
        ·{" "}
        <Link
          href="/admin/settings"
          className="text-accent-deep underline underline-offset-4"
        >
          {t("sharedSettingsLink")}
        </Link>
      </p>
    </div>
  );
}
