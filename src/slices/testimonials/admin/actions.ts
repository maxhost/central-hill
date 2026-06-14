"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import { deleteContent, setSourceContent } from "@core/i18n/content-write";
import { TESTIMONIAL } from "../contract";
import { testimonial } from "../schema";
import { revalidateTestimonials } from "../server/publish";
import { testimonialSaveInput } from "./validation";

/**
 * Backoffice write actions for slice `testimonials` (S12). Each re-gates with
 * `requireStaff()` and re-validates with `testimonialSaveInput`. The source [T]
 * `quote` goes through the `core/i18n` write seam (ADR 0019); the scalar columns
 * are written directly. On success the ISR cache is busted via
 * `revalidateTestimonials` (which cascades every S9 page that embeds a row).
 */

export type TestimonialSaveResult =
  | { ok: true; id: string }
  | { ok: false; error: "validation"; fieldErrors: Record<string, string> }
  | { ok: false; error: "not_found" }
  | { ok: false; error: "server" };

function fieldErrorsFrom(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

export async function saveTestimonial(raw: unknown): Promise<TestimonialSaveResult> {
  const staff = await requireStaff();

  const parsed = testimonialSaveInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const input = parsed.data;

  const coreValues = {
    audience: input.audience,
    rating: input.rating,
    author_name: input.author_name,
    author_country: input.author_country,
    property_location: input.property_location,
    position: input.position,
    status: input.status,
  };

  try {
    let id = input.id ?? "";

    if (input.id) {
      const [exists] = await db
        .select({ id: testimonial.id })
        .from(testimonial)
        .where(eq(testimonial.id, input.id))
        .limit(1);
      if (!exists) return { ok: false, error: "not_found" };
      await db
        .update(testimonial)
        .set({ ...coreValues, updated_at: new Date() })
        .where(eq(testimonial.id, input.id));
    } else {
      const [ins] = await db
        .insert(testimonial)
        .values(coreValues)
        .returning({ id: testimonial.id });
      if (!ins) return { ok: false, error: "server" };
      id = ins.id;
    }

    await setSourceContent(TESTIMONIAL, id, { quote: input.quote }, { updatedBy: staff.userId });

    revalidateTestimonials();
    revalidatePath("/admin/testimonials");
    revalidatePath(`/admin/testimonials/${id}`);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function deleteTestimonial(id: string): Promise<{ ok: boolean }> {
  await requireStaff();
  try {
    await db.delete(testimonial).where(eq(testimonial.id, id));
    await deleteContent(TESTIMONIAL, id);
    revalidateTestimonials();
    revalidatePath("/admin/testimonials");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
