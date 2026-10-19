import type { z } from "zod";
import type { ReactNode } from "react";
import type { Locale } from "@core/db/columns";
import type { FieldNode } from "./admin/form-model";
import type { PageResult } from "./contract";
import type { EditorialPageKey, PageContentMap, PageEnvelope } from "./editorial-types";

/** JSON only: safe to serialize to the common client editor. */
export interface PageEditorialDescriptor {
  key: EditorialPageKey;
  title: string;
  publicPath: string;
  rootNode: FieldNode;
  /** Schema [T] patterns, including [] wildcards. Never infer translation by names. */
  textPatterns: string[];
  /** [] means a parent list; metadata scope uses @parentId, never its position. */
  listPaths: string[];
  mediaSlots: { path: string; kind: "image" | "video" | "mixed" | "pdf" }[];
  maxLocalMedia: number;
  externalSections: string[];
}
export interface EditorialMediaReference { path: string; id: string; kind: "image" | "video" | "mixed" | "pdf" }
/** Pure adapter; registry is server-only. Renderer is loaded lazily to avoid slice cycles. */
export interface PageEditorialAdapter<K extends EditorialPageKey> {
  key: K;
  descriptor: PageEditorialDescriptor;
  draftSchema: z.ZodType<PageContentMap[K]>;
  publishSchema: z.ZodType<PageContentMap[K]>;
  defaultContent(): PageContentMap[K];
  normalize(content: PageContentMap[K]): PageContentMap[K];
  identityErrors(content: PageContentMap[K], previous?: PageContentMap[K]): Record<string, string>;
  retireIds(content: PageContentMap[K], previous: PageContentMap[K]): PageContentMap[K];
  textPaths(content: PageContentMap[K]): string[];
  translationField(content: PageContentMap[K], path: string): string;
  collectMediaReferences(content: PageContentMap[K], og: string | null): EditorialMediaReference[];
  mediaErrors(content: PageContentMap[K], og: string | null, assets: ReadonlyMap<string, { mime: string }>): Record<string, string>;
  render(input: { locale: Locale; page: PageResult<PageContentMap[K]> | null; preview: true }): Promise<ReactNode>;
}
export type AnyPageEnvelope = PageEnvelope<EditorialPageKey>;
