"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@core/auth";
import type { ServiceEditorialResult } from "../editorial-types";
import {
  saveServiceDraft,
  publishServiceDraft,
  setServiceArchived,
} from "../server/locale-store";
import {
  saveServiceRequestSchema,
  publishServiceRequestSchema,
  serviceFieldErrors,
} from "../server/locale-validation";
import { revalidateServices } from "../server/publish";

function refresh(id: string) {
  revalidateServices();
  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${id}`);
}
export async function saveServiceLocaleDraft(
  raw: unknown,
): Promise<ServiceEditorialResult> {
  const staff = await requireStaff();
  const parsed = saveServiceRequestSchema.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false,
      error: "validation",
      fieldErrors: serviceFieldErrors(parsed.error.issues),
    };
  const result = await saveServiceDraft(
    parsed.data,
    staff.userId,
  );
  if (result.ok) refresh(result.model.id);
  else if (result.error === "server") refresh(parsed.data.serviceId);
  return result;
}
export async function publishServiceLocaleDraft(
  raw: unknown,
): Promise<ServiceEditorialResult> {
  const staff = await requireStaff();
  const parsed = publishServiceRequestSchema.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false,
      error: "validation",
      fieldErrors: serviceFieldErrors(parsed.error.issues),
    };
  const result = await publishServiceDraft(parsed.data, staff.userId);
  if (result.ok) refresh(result.model.id);
  else if (result.error === "server") refresh(parsed.data.serviceId);
  return result;
}

export async function setServiceVisibility(
  raw: unknown,
): Promise<ServiceEditorialResult> {
  const staff = await requireStaff();
  const parsed = z
    .object({ serviceId: z.uuid(), archived: z.boolean() })
    .strict()
    .safeParse(raw);
  if (!parsed.success)
    return {
      ok: false,
      error: "validation",
      fieldErrors: serviceFieldErrors(parsed.error.issues),
    };
  try {
    const result = await setServiceArchived(
      parsed.data.serviceId,
      parsed.data.archived,
      staff.userId,
    );
    if (result.ok) refresh(result.model.id);
    else if (result.error === "server") refresh(parsed.data.serviceId);
    return result;
  } catch {
    refresh(parsed.data.serviceId);
    return { ok: false, error: "server" };
  }
}
