import { editorialAt } from "../editorial-identities";
import type { PageEditorialDescriptor } from "../editorial-adapter-types";
import type { EditorSection } from "@slices/backoffice/contract";
import type { FieldNode } from "./form-model";
export type HomeTargetLocale = "es" | "pt" | "fr";
export type HomeTranslations = Record<HomeTargetLocale, Record<string,{value:string;state:string;stale:boolean}>>;
export function homeSections(root:FieldNode, label:(key:string)=>string):EditorSection[] {
 if(root.kind!=="object") return [];
 const sections = root.fields.filter(f=>f.node.kind!=="hidden").map(f=>({id:f.key,label:label(f.key),bindings: bindings(f.node,f.key,label).map(b=>({...b,sectionId:f.key}))}));
 sections.splice(2,0,{id:"avantio",label:"Avantio",bindings:[],external:true} as EditorSection);
 const seo=sections.find(s=>s.id==="seo");if(seo){sections.splice(sections.indexOf(seo),1);sections.push(seo);}
 const faq=sections.find(s=>s.id==="faq");const group=sections.find(s=>s.id==="faq_group_key");
 if(faq&&group){faq.bindings.push(...group.bindings.map(b=>({...b,sectionId:"faq"})));sections.splice(sections.indexOf(group),1);}
 sections.find(s=>s.id==="seo")?.bindings.push({id:"og_image_media_id",label:label("ogImage"),sectionId:"seo"});
 return sections;
}
function bindings(node:FieldNode,path:string,label:(key:string)=>string):{id:string;label:string}[] {
 if(node.kind==="hidden")return [];
 if(node.kind==="object")return node.fields.flatMap(f=>bindings(f.node,`${path}.${f.key}`,label));
 return [{id:path,label:label(path.split(".").at(-1)!)}];
}
export function homeNode(root:FieldNode,path:string):FieldNode|undefined {
 let current:FieldNode|undefined=root;
 for(const part of path.split(".")){if(current?.kind!=="object")return undefined;current=current.fields.find(f=>f.key===part)?.node;}
 return current;
}

/** Private preview allowlist, including fields that remain reachable only through the outline. */
export const homeEditorBindingIds = ["hero","avantio","stats","guests_pitch","portfolio","services_carousel","faq","dual_cta","seo","faq_group_key","og_image_media_id",
 "hero.video_media_id","hero.poster_media_id","hero.eyebrow","hero.headline","hero.subtitle","hero.cta_primary.label","hero.cta_primary.url","hero.cta_secondary.label",
 "stats.title","stats.figures","guests_pitch.headline","guests_pitch.subheadline","guests_pitch.benefits","guests_pitch.image_media_id","guests_pitch.cta.label","guests_pitch.cta.url","guests_pitch.cta.note","guests_pitch.badge.label","guests_pitch.badge.icon_key",
 "portfolio.title","portfolio.cta_label","portfolio.card_view_label","services_carousel.headline","services_carousel.assurances","services_carousel.service_category_slug","faq.title",
 ...["owner","guest"].flatMap(side=>["image_media_id","eyebrow","title","body","cta_label"].map(key=>`dual_cta.${side}.${key}`)),"seo.meta_title","seo.meta_description"] ;

/** One outline policy; Home retains its validated section grouping and order. */
export function pageSections(descriptor: PageEditorialDescriptor, label: (key: string) => string, content?: unknown): EditorSection[] {
  if (descriptor.key === "home") return homeSections(descriptor.rootNode, label);
  const root = descriptor.rootNode;
  if (root.kind !== "object") return [];
  const sections: EditorSection[] = root.fields.filter(field => field.node.kind !== "hidden").map(field => ({
    id: field.key, label: label(field.key),
    bindings: bindings(field.node, field.key, label).map(binding => ({ ...binding, sectionId: field.key })),
  }));
  for (const id of descriptor.externalSections) {
    if (!sections.some(section => section.id === id)) sections.push({ id, label: label(id), bindings: [], external: true });
  }
  if (descriptor.key === "owners") {
    const title = sections.find(section => section.id === "stats_title");
    const stats = sections.find(section => section.id === "stats");
    if (title && stats) {
      stats.bindings.unshift(...title.bindings.map(binding => ({ ...binding, sectionId: "stats" })));
      sections.splice(sections.indexOf(title), 1);
    }
  }
  const faq = sections.find(section => section.id === "faq");
  const group = sections.find(section => section.id === "faq_group_key");
  if (faq && group) {
    faq.bindings.push(...group.bindings.map(binding => ({ ...binding, sectionId: "faq" })));
    sections.splice(sections.indexOf(group), 1);
  }
  const seo = sections.find(section => section.id === "seo");
  if (seo) {
    sections.splice(sections.indexOf(seo), 1);
    seo.bindings.push({ id: "og_image_media_id", label: label("ogImage"), sectionId: "seo" });
    sections.push(seo);
  }
  for (const rule of descriptor.collapseWhenFalse ?? []) {
    if (editorialAt(content, rule.path) === false) {
      const section = sections.find(section => section.id === rule.section);
      if (section) section.bindings = section.bindings.filter(binding => binding.id === rule.path);
    }
  }
  return sections;
}

/** Read only declared slots; no schema/server registry enters the client bundle. */
export function descriptorMediaIds(content: unknown, og: string | null, descriptor: PageEditorialDescriptor): string[] {
  function read(root: unknown, keys: string[]): unknown[] {
    if (!keys.length) return [root];
    const [key, ...rest] = keys;
    if (!root || typeof root !== "object") return [];
    const value = (root as Record<string, unknown>)[key!.replace(/\[\]$/, "")];
    return key!.endsWith("[]") ? (Array.isArray(value) ? value.flatMap(item => read(item, rest)) : []) : read(value, rest);
  }
  return [...new Set([og, ...descriptor.mediaSlots.flatMap(slot => read(content, slot.path.split(".")))].filter((id): id is string => typeof id === "string" && Boolean(id)))];
}

/** Mirror NodeField visibility while following concrete indexes through nested lists. */
export function isEditableFieldPath(root: FieldNode, path: string): boolean {
  let node: FieldNode | undefined = root;
  for (const part of path.split(".")) {
    if (node?.kind === "object") node = node.fields.find(field => field.key === part)?.node;
    else if (node?.kind === "array" && /^(0|[1-9]\d*)$/.test(part)) node = node.element;
    else return false;
    if (!node || node.kind === "hidden") return false;
  }
  return node !== undefined && node.kind !== "hidden";
}
