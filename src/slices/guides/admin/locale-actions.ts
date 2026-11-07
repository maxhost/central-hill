"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@core/auth";
import type { GuideEditorialResult } from "../editorial-types";
import {
  saveGuideDraft,
  publishGuideDraft,
  setGuideArchived,
} from "../server/locale-store";
import { revalidateGuides } from "../server/publish";
function refresh(id: string) {
  revalidateGuides();
  revalidatePath("/admin/guides");
  revalidatePath(`/admin/guides/${id}`);
}
export async function saveGuideLocaleDraft(
  raw: unknown,
): Promise<GuideEditorialResult> {
  const staff = await requireStaff(["admin", "editor"]);
  const result = await saveGuideDraft(raw, staff.userId);
  if (result.ok) refresh(result.model.id);
  return result;
}
export async function publishGuideLocaleDraft(
  raw: unknown,
): Promise<GuideEditorialResult> {
  const staff = await requireStaff(["admin", "editor"]);
  const result = await publishGuideDraft(raw, staff.userId);
  if (result.ok) refresh(result.model.id);
  return result;
}
export async function setGuideVisibility(
  raw: unknown,
): Promise<GuideEditorialResult> {
  const staff = await requireStaff(["admin", "editor"]);
  const parsed = z
    .strictObject({ guideId: z.uuid(), archived: z.boolean() })
    .safeParse(raw);
  if (!parsed.success)
    return {
      ok: false,
      error: "validation",
      fieldErrors: { _form: "Invalid visibility request." },
    };
  const result = await setGuideArchived(
    parsed.data.guideId,
    parsed.data.archived,
    staff.userId,
  );
  if (result.ok) refresh(result.model.id);
  return result;
}
