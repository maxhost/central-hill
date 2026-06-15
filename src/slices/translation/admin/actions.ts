"use server";
import { requireStaff } from "@core/auth";
import type { Locale } from "@core/db/columns";
import {
  deleteTranslation,
  loadTranslationRows,
  setTargetTranslation,
  setTranslationState,
} from "@core/i18n";
import { cacheTags, revalidatePath, updateTag } from "@core/revalidate";
import { SOURCE_LOCALE, TARGET_LOCALES } from "./derive";
import { generateDrafts } from "../server/generate";

/**
 * Backoffice mutations for the translation review workflow (S14). Each action is an
 * independent entry point, so it re-gates with `requireStaff()` (defence in depth,
 * never relying solely on the `(panel)` layout gate; ADR 0009/0017) and validates
 * its input server-side. Writes go through the kernel target seam (`core/i18n`,
 * ADR 0021) — never the table directly. After a write we `revalidatePath` the admin
 * screens and best-effort bust the entity's public ISR tags so a newly-approved
 * locale appears (the daily ISR fallback backstops other tag conventions).
 */

export type TranslationActionResult =
  | { ok: true }
  | { ok: false; error: "validation" | "not_found" };

const isTargetLocale = (v: unknown): v is Locale =>
  typeof v === "string" && (TARGET_LOCALES as string[]).includes(v);

/** Bust the admin screens + the entity's public caches after a change. */
function revalidateEntity(type: string, id: string): void {
  revalidatePath("/admin/translations");
  revalidatePath(`/admin/translations/${type}/${id}`);
  // Best-effort public refresh: covers both the per-entity and list tag
  // conventions slices use; anything else rides the daily ISR fallback.
  updateTag(cacheTags.entity(type, id));
  updateTag(cacheTags.list(type));
}

/** Approve one target-locale field (it becomes publicly visible). */
export async function approveField(
  type: string,
  id: string,
  field: string,
  locale: string,
): Promise<TranslationActionResult> {
  await requireStaff();
  if (!type || !id || !field || !isTargetLocale(locale)) return { ok: false, error: "validation" };
  await setTranslationState(type, id, field, locale, "approved");
  revalidateEntity(type, id);
  return { ok: true };
}

/** Send an approved/edited target field back to `needs_review` (un-publish). */
export async function resetField(
  type: string,
  id: string,
  field: string,
  locale: string,
): Promise<TranslationActionResult> {
  await requireStaff();
  if (!type || !id || !field || !isTargetLocale(locale)) return { ok: false, error: "validation" };
  await setTranslationState(type, id, field, locale, "needs_review");
  revalidateEntity(type, id);
  return { ok: true };
}

/**
 * Save an edited target value (resets it to `needs_review`, re-stamping
 * `source_hash` from the current source). An empty value clears the translation.
 * The source value is re-read server-side — never trusted from the client.
 */
export async function saveField(
  type: string,
  id: string,
  field: string,
  locale: string,
  value: string,
): Promise<TranslationActionResult> {
  const staff = await requireStaff();
  if (!type || !id || !field || !isTargetLocale(locale)) return { ok: false, error: "validation" };

  const sourceRows = await loadTranslationRows({ type, id, locale: SOURCE_LOCALE });
  const source = sourceRows.find((r) => r.field === field);
  if (!source) return { ok: false, error: "not_found" };

  const trimmed = value.trim();
  if (trimmed) {
    await setTargetTranslation(type, id, field, locale, trimmed, {
      sourceValue: source.value,
      state: "needs_review",
      updatedBy: staff.userId,
    });
  } else {
    await deleteTranslation(type, id, field, locale);
  }
  revalidateEntity(type, id);
  return { ok: true };
}

/** Clear one target-locale field. */
export async function clearField(
  type: string,
  id: string,
  field: string,
  locale: string,
): Promise<TranslationActionResult> {
  await requireStaff();
  if (!type || !id || !field || !isTargetLocale(locale)) return { ok: false, error: "validation" };
  await deleteTranslation(type, id, field, locale);
  revalidateEntity(type, id);
  return { ok: true };
}

/** Approve every existing target row of an entity in one pass. */
export async function approveEntity(type: string, id: string): Promise<TranslationActionResult> {
  await requireStaff();
  if (!type || !id) return { ok: false, error: "validation" };

  const rows = await loadTranslationRows({ type, id });
  for (const r of rows) {
    if (r.locale !== SOURCE_LOCALE && r.state !== "approved") {
      await setTranslationState(type, id, r.field, r.locale, "approved");
    }
  }
  revalidateEntity(type, id);
  return { ok: true };
}

/**
 * (Re)generate target drafts for an entity through the LLM provider seam. By
 * default fills only missing/stale cells; `overwrite` re-drafts everything. New
 * drafts land as `needs_review` for the reviewer.
 */
export async function generateEntityDrafts(
  type: string,
  id: string,
  overwrite = false,
): Promise<TranslationActionResult> {
  const staff = await requireStaff();
  if (!type || !id) return { ok: false, error: "validation" };
  await generateDrafts(type, id, { overwrite, updatedBy: staff.userId });
  revalidateEntity(type, id);
  return { ok: true };
}
