import { randomUUID } from "node:crypto";
import { requireStaff } from "@core/auth";
import { listGuideCityOptions } from "@slices/geography/contract";
import { GuideEditor } from "@slices/guides/contract";
import { newGuide } from "@slices/guides/contract";
export default async function NewGuidePage() {
  await requireStaff(["admin", "editor"]);
  const cities = await listGuideCityOptions();
  return (
    <GuideEditor
      initial={null}
      cities={cities}
      draft={newGuide(randomUUID(), cities[0]?.id)}
    />
  );
}
