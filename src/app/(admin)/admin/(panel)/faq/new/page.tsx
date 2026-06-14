import { requireStaff } from "@core/auth";
import { FaqGroupForm } from "@slices/faq/admin/ui/group-form";

/** New-FAQ-group route (`/admin/faq/new`). Gated by `(panel)`. */
export default async function NewFaqGroupPage() {
  await requireStaff();
  return <FaqGroupForm initial={null} />;
}
