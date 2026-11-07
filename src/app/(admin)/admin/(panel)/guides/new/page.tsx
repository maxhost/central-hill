import { randomUUID } from "node:crypto";
import { requireStaff } from "@core/auth";
import { listGuideCityOptions } from "@slices/geography/contract";
import { GuideEditor } from "@slices/guides/contract";
import { newGuide } from "@slices/guides/contract";
export default async function NewGuidePage() {
  await requireStaff(["admin", "editor"]);
  const cities = await listGuideCityOptions();
  const draft = newGuide(randomUUID(), cities[0]?.id);
  return (
    <GuideEditor
      key={`new-${draft.id}`}
      initial={null}
      cities={cities}
      draft={draft}
    />
  );
}
