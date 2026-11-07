import "server-only";
import { requireStaff } from "@core/auth";
import { loadGeographyNameOptions } from "./reference-names";
import { listCitiesAdmin } from "../admin/queries";
/** Source-locale options, including unpublished cities; never used by public ISR. */
export async function listGuideCityOptions() {
  await requireStaff(["admin", "editor"]);
  const rows = await listCitiesAdmin();
  const names = await loadGeographyNameOptions("city", rows);
  return rows.map(({ id, slug, status }, index) => ({ ...names[index]!, id, slug, status }));
}
