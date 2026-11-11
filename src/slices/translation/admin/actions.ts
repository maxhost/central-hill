"use server";

import { requireStaff } from "@core/auth";

/** Compatibility result for callers compiled before the S14 retirement (ADR0077). */
export type TranslationActionResult =
  | { ok: true }
  | { ok: false; error: "validation" | "not_found" | "conflict" };

/** Retired actions keep their signatures but never inspect editorial content. */
export async function approveField(
  type: string,
  id: string,
  field: string,
  locale: string,
): Promise<TranslationActionResult> {
  await requireStaff();
  void [type, id, field, locale];
  return { ok: false, error: "validation" };
}

export async function resetField(
  type: string,
  id: string,
  field: string,
  locale: string,
): Promise<TranslationActionResult> {
  await requireStaff();
  void [type, id, field, locale];
  return { ok: false, error: "validation" };
}

export async function saveField(
  type: string,
  id: string,
  field: string,
  locale: string,
  value: string,
): Promise<TranslationActionResult> {
  await requireStaff();
  void [type, id, field, locale, value];
  return { ok: false, error: "validation" };
}

export async function clearField(
  type: string,
  id: string,
  field: string,
  locale: string,
): Promise<TranslationActionResult> {
  await requireStaff();
  void [type, id, field, locale];
  return { ok: false, error: "validation" };
}

export async function approveEntity(
  type: string,
  id: string,
): Promise<TranslationActionResult> {
  await requireStaff();
  void [type, id];
  return { ok: false, error: "validation" };
}

export async function generateEntityDrafts(
  type: string,
  id: string,
  overwrite = false,
): Promise<TranslationActionResult> {
  await requireStaff();
  void [type, id, overwrite];
  return { ok: false, error: "validation" };
}
