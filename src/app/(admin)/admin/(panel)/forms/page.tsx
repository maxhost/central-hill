import { requireStaff } from "@core/auth";
import { FormCatalog, listForms } from "@slices/forms/contract";
export default async function FormsRoute() {
  await requireStaff();
  return <FormCatalog forms={await listForms()} />;
}
