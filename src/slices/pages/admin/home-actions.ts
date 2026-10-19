"use server";
import { requireStaff } from "@core/auth";
import type { PageSaveResult } from "./actions";
/** Retired public Server Action: legacy tabs cannot publish adapted Home. */
export async function saveHomeLocale(input: unknown): Promise<PageSaveResult> {
  void input;
  await requireStaff();
  return { ok: false, error: "validation", fieldErrors: { _source: "Use Save draft and Publish in the Home editor." } };
}
