import "server-only";
import type { Locale } from "@core/db/columns";

/** Historical call shape retained only to reject old S14 callers (ADR0077). */
export interface GenerateOptions {
  locales?: Locale[];
  overwrite?: boolean;
  updatedBy?: string;
}

export interface GenerateSummary {
  provider: string;
  written: Partial<Record<Locale, number>>;
  total: number;
}

/** No provider or content is loaded, even for unknown or malformed entities. */
export async function generateDrafts(
  type: string,
  id: string,
  opts: GenerateOptions = {},
): Promise<GenerateSummary> {
  void [type, id, opts];
  throw new Error(
    "The global translation workflow is retired. Use the owning editor.",
  );
}
