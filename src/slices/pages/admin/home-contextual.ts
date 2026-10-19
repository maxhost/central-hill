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
 "portfolio.title","portfolio.cta_label","portfolio.card_view_label","services_carousel.eyebrow","services_carousel.headline","services_carousel.assurances","services_carousel.service_category_slug","faq.title",
 ...["owner","guest"].flatMap(side=>["image_media_id","eyebrow","title","body","cta_label"].map(key=>`dual_cta.${side}.${key}`)),"seo.meta_title","seo.meta_description"] ;
