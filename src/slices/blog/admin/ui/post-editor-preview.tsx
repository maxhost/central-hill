"use client";

import type { ReactNode } from "react";
import { PageEditorLivePreview } from "@slices/backoffice/contract";
import { renderPostLivePreview } from "../post-preview-actions";
import { POST_EDITOR_BINDING_IDS } from "./post-editor-state";

/** Mounted only on the authenticated, noindex Blog preview route. */
export function BlogPostPreview({ children, instance }: { children: ReactNode; instance: string }) {
  return <PageEditorLivePreview instance={instance} bindingIds={POST_EDITOR_BINDING_IDS}
    renderPreviewAction={renderPostLivePreview}>
    {children}
  </PageEditorLivePreview>;
}
