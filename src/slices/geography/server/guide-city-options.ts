import "server-only";
import { requireStaff } from "@core/auth";
import { listCitiesAdmin } from "../admin/queries";
/** Source-locale options, including unpublished cities; never used by public ISR. */
export async function listGuideCityOptions() {
  await requireStaff(["admin", "editor"]);
  const rows = await listCitiesAdmin();
  return rows.map(({ id, name, slug, status }) => ({ id, name, slug, status }));
}
