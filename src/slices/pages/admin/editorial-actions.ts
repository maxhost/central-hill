"use server";
import { revalidatePath, updateTag } from "next/cache";
import { requireStaff } from "@core/auth";
import { getEditorialAdapter } from "../server/editorial-adapters";
import type {
  EditorialPageKey,
  PageEditorialResult,
  PublishPageDraftInput,
  SavePageDraftInput,
} from "../editorial-types";
import { pageLocaleTag } from "../editorial-registry";
import { saveEditorialDraft, publishEditorialDraft } from "./editorial-store";
export async function savePageDraft<K extends EditorialPageKey>(
  input: SavePageDraftInput<K>,
): Promise<PageEditorialResult<K>> {
  const actor = await requireStaff();
  return saveEditorialDraft(input, actor.userId);
}
export async function publishPageDraft<K extends EditorialPageKey>(
  input: PublishPageDraftInput<K>,
): Promise<PageEditorialResult<K>> {
  const actor = await requireStaff();
  const result = await publishEditorialDraft(input, actor.userId);
  if (!result.ok) return result;
  try {
    updateTag(pageLocaleTag(input.key, input.locale));
    revalidatePath(
      `/${input.locale}${getEditorialAdapter(input.key).descriptor.publicPath}`,
    );
  } catch {
    return { ...result, refreshWarning: true };
  }
  return result;
}
