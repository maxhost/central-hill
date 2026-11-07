"use client";
import type { ReactNode } from "react";
import type { PageLivePreviewRenderer } from "../page-editor-types";
import { PageEditorLivePreview } from "./page-editor-live-preview";
export function PropertyLivePreview({children,instance,bindingIds,renderPreviewAction}:{children:ReactNode;instance:string;bindingIds:string[];renderPreviewAction:PageLivePreviewRenderer}) {
 return <PageEditorLivePreview instance={instance} bindingIds={bindingIds} renderPreviewAction={renderPreviewAction}>{children}</PageEditorLivePreview>;
}
