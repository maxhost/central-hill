import { aboutSchema, defaultAbout } from "../schemas/about";
import { aboutIdentityErrors, normalizeAbout } from "../about-content";
export function aboutEditorDefaults(raw: unknown, exists: boolean) {
  const parsed = aboutSchema.safeParse(exists ? raw : defaultAbout);
  const data = parsed.success ? normalizeAbout(parsed.data) : null;
  const invalid = !data || Object.keys(aboutIdentityErrors(data)).length > 0;
  return { data: invalid ? {} : data!, sourceInvalid: invalid, sourceStatus: !exists ? "absent" as const : invalid ? "invalid" as const : "valid" as const };
}
