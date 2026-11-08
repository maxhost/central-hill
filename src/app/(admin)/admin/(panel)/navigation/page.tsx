import { requireStaff } from "@core/auth";
import { redirect } from "next/navigation";

/** Legacy navigation editor: the public menus are fixed in code (ADR0074). */
export default async function NavigationPage() {
  await requireStaff(["admin"]);
  redirect("/admin/settings");
}
