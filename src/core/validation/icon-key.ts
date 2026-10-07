import { z } from "zod";
import { isIconName } from "@core/ui/icons/names";

/**
 * An Iconoir icon name (ADR 0034), shipped in code with no icon table. Must exist in the
 * generated set `<Icon>` renders (`core/ui/icons/names.ts`).
 *
 * Kept out of `primitives.ts` on purpose: the name list is ~7 KB gzip, and `primitives` is
 * imported by client components on every public page. Import this from server code and
 * admin schemas only.
 */
export const iconKey = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/, "iconoir icon key (kebab-case)")
  .refine(isIconName, "unknown iconoir icon");
