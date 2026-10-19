"use server";
import { revalidatePath, updateTag } from "next/cache";
import { requireStaff } from "@core/auth";
import type { PageEditorialResult, PublishPageDraftInput, SavePageDraftInput } from "../editorial-types";
import { pageLocaleTag } from "../editorial-registry";
import { saveEditorialDraft, publishEditorialDraft } from "./editorial-store";
export async function savePageDraft(input: SavePageDraftInput): Promise<PageEditorialResult> {
  const actor = await requireStaff();
  return saveEditorialDraft(input, actor.userId);
}
export async function publishPageDraft(input: PublishPageDraftInput): Promise<PageEditorialResult> {
  const actor = await requireStaff();
  const result = await publishEditorialDraft(input, actor.userId);
  if (!result.ok) return result;
  try { updateTag(pageLocaleTag("home", input.locale)); revalidatePath(`/${input.locale}`); }
  catch { return { ...result, refreshWarning: true }; }
  return result;
}
