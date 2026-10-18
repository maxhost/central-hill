import { defaultGuides, guidesSchema, type GuidesContent } from "../schemas/guides";

export type GuidesSourceStatus = "absent" | "valid" | "invalid";
/** Never repair a corrupt existing row; absence and optional fields are distinct. */
export function guidesEditorDefaults(raw: unknown, exists: boolean) {
  const parsed = guidesSchema.safeParse(raw);
  const sourceStatus: GuidesSourceStatus = !exists ? "absent" : parsed.success ? "valid" : "invalid";
  const content = !exists ? structuredClone(defaultGuides) : parsed.success ? parsed.data : null;
  const data: Partial<GuidesContent> = content ? {
    ...content,
    city_filter: { ...content.city_filter, enabled: content.city_filter?.enabled ?? true },
  } : {};
  return {
    sourceStatus,
    sourceInvalid: sourceStatus === "invalid",
    data,
  };
}
