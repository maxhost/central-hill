import { z } from "zod";
import { defaultGuides, guidesSchema, type GuidesContent } from "../schemas/guides";

/** Salvage valid source blocks independently, before resolving their media references. */
export function guidesSourceContent(raw: unknown): GuidesContent {
  const record = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const output: Record<string, unknown> = { guide_aside: structuredClone(defaultGuides.guide_aside) };
  for (const [key, schema] of Object.entries(guidesSchema.shape)) {
    const parsed = schema.safeParse(record[key]);
    if (parsed.success && parsed.data !== undefined) output[key] = parsed.data;
  }
  return guidesSchema.parse(output);
}

function overlayValid(schema: z.ZodType, value: unknown, source: unknown): unknown {
  let base = schema;
  while (base instanceof z.ZodOptional) base = base.unwrap() as z.ZodType;
  if (base instanceof z.ZodObject && value && typeof value === "object" && !Array.isArray(value)) {
    const result: Record<string, unknown> = {};
    const sourceObject = source && typeof source === "object" ? source as Record<string, unknown> : {};
    for (const [key, field] of Object.entries(base.shape)) {
      result[key] = overlayValid(field as z.ZodType, (value as Record<string, unknown>)[key], sourceObject[key]);
    }
    const parsed = schema.safeParse(result);
    return parsed.success ? parsed.data : source;
  }
  if (value === undefined) return source;
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : source;
}

/** Target translation failures fall back per field, including the {city} template. */
export function guidesLocalizedContent(source: GuidesContent, localized: unknown): GuidesContent {
  return guidesSchema.parse(overlayValid(guidesSchema, localized, source));
}
