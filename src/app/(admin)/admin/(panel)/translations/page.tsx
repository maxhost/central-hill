import { requireStaff } from "@core/auth";
import { redirect } from "next/navigation";

/**
 * Compatibility for the retired inbox, including its old filter URLs (ADR0077).
 */
export default async function TranslationsInboxPage() {
  await requireStaff();
  redirect("/admin/pages");
}
