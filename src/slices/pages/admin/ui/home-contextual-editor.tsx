"use client";

import type { HomeEditorialModel } from "../../editorial-types";
import { PageContextualEditor } from "./page-contextual-editor";

/** Compatibility entrypoint; all state and actions belong to the common editor. */
export function HomeContextualEditor({ model }: { model: HomeEditorialModel }) {
  return <PageContextualEditor model={model} />;
}
