"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AdminButton, Field, MediaField, PageEditorShell, TextArea, useMediaQueue, type EditorLocale } from "@slices/backoffice/contract";
import type { HomeContextualModel } from "../home-queries";
import { homeNode, homeSections, type HomeTargetLocale } from "../home-contextual";
import { homeAt, homeSourceFields, homeTextPaths, homeTranslationField } from "../../home-content";
import type { HomeContent } from "../../schemas/home";
import { savePage } from "../actions";
import { saveHomeLocale } from "../home-actions";
import { NodeField, useFieldLabels } from "./schema-fields";
import type { AboutListOperation } from "../form-model";
function setValue(root:unknown,path:(string|number)[],value:unknown):unknown {
 if(!path.length)return value;const [head,...tail]=path;
 const out=Array.isArray(root)?[...root]:{...(root&&typeof root==="object"?root:{})};
 (out as Record<string,unknown>)[String(head)]=setValue((out as Record<string,unknown>)[String(head)],tail,value);return out;
}
export function HomeContextualEditor({model}:{model:HomeContextualModel}){
 const t=useTranslations("pages");const tb=useTranslations("backoffice");const labels=useFieldLabels();const router=useRouter();
 const [savedData,setSavedData]=useState(model.data);
 const [data,setData]=useState(model.data);const [og,setOg]=useState(model.ogImageMediaId??"");
 const [locale,setLocale]=useState<EditorLocale>("en");const [selected,setSelected]=useState("hero");
 const [targets,setTargets]=useState(()=>Object.fromEntries(Object.entries(model.translations).map(([l,rows])=>[l,Object.fromEntries(Object.entries(rows).map(([key,row])=>[key,row.value]))])) as Record<HomeTargetLocale,Record<string,string>>);
 const [translations,setTranslations]=useState(model.translations);const [dirty,setDirty]=useState<Record<string,boolean>>({});
 const [revision,setRevision]=useState(model.revision);const [version,setVersion]=useState(0);const [saving,setSaving]=useState(false);
 const [errors,setErrors]=useState<Record<string,string>>({});const [notice,setNotice]=useState("");const [conflict,setConflict]=useState(false);
 const queue=useMediaQueue();const lock=useRef(false);const sections=homeSections(model.rootNode,labels.field);
 const section=sections.find(s=>s.id===selected||s.bindings.some(b=>b.id===selected))??sections[0]!;
 const busy=saving||queue.isPreparing;const content=data as HomeContent;
 const mark=()=>setDirty(prev=>({...prev,[locale]:true}));
 function change(path:(string|number)[],value:unknown){setData(prev=>setValue(prev,path,value) as Record<string,unknown>);mark();}
 function listChange(_path:string,operation:AboutListOperation){
 setData(prev=>{const c=prev as HomeContent;const figures=[...(c.stats?.figures??[])];const ids=[...(c._list_ids?.["stats.figures"]??[])];
 if(operation.action==="add"){figures.push(operation.value as typeof figures[number]);ids.push(operation.id);}
 else if(operation.action==="remove"){figures.splice(operation.index,1);ids.splice(operation.index,1);}
 else{[figures[operation.index],figures[operation.to]]=[figures[operation.to]!,figures[operation.index]!];[ids[operation.index],ids[operation.to]]=[ids[operation.to]!,ids[operation.index]!];}
 return {...prev,stats:{...c.stats,figures},_list_ids:{"stats.figures":ids}};});mark();}
 async function save(approve=false){
 if(lock.current||busy||model.sourceInvalid||conflict)return;lock.current=true;setSaving(true);setNotice("");setErrors({});
 try{
 if(locale==="en"&&!await queue.flush())return;
 const result=locale==="en"?await savePage("home",{data,og_image_media_id:og||null,revision}):await saveHomeLocale({locale,revision:revision??"",values:targets[locale],approve});
 if(result.ok){if(locale==="en"){
 const before=homeSourceFields(savedData as HomeContent);const after=homeSourceFields(data as HomeContent);
 setTranslations(prev=>Object.fromEntries(Object.entries(prev).map(([l,rows])=>[l,Object.fromEntries(Object.entries(rows).filter(([key])=>Object.hasOwn(after,key)).map(([key,row])=>[key,{...row,stale:row.stale||before[key]!==after[key]}]))])) as typeof prev);
 setTargets(prev=>Object.fromEntries(Object.entries(prev).map(([l,values])=>[l,Object.fromEntries(Object.entries(values).filter(([key])=>Object.hasOwn(after,key)))])) as typeof prev);
 setSavedData(data);
 }setRevision(result.revision);setDirty(prev=>({...prev,[locale]:false}));setVersion(v=>v+1);setNotice(tb("actions.saved"));
 if(locale!=="en")setTranslations(prev=>({...prev,[locale]:Object.fromEntries(Object.entries(targets[locale]).map(([field,value])=>[field,{value,state:approve?"approved":"needs_review",stale:false}]))}));
 router.refresh();
 }else if(result.error==="validation"){setErrors(result.fieldErrors);setNotice(t("admin.validationError"));}
 else if(result.error==="conflict"){setConflict(true);setNotice(t("admin.contextual.conflict"));}else setNotice(tb("actions.saveError"));
 }finally{setSaving(false);lock.current=false;}
 }
 const visible=selected===section.id?section.bindings:section.bindings.filter(b=>b.id===selected);
 const targetContent=savedData as HomeContent;
 const sourceFields=homeSourceFields(targetContent);
 const targetPaths=homeTextPaths(targetContent).filter(path=>Object.hasOwn(sourceFields,homeTranslationField(targetContent,path))&&visible.some(b=>path===b.id||path.startsWith(`${b.id}.`)));
 const inspector=<div className="space-y-5">
 <h2 className="font-serif text-xl text-ink">{section.label}</h2>
 {(["portfolio","services_carousel","faq"].includes(section.id))?<p className="text-xs text-ink-soft">{t(`admin.contextual.${section.id==="portfolio"?"portfolioNote":section.id==="faq"?"faqNote":"servicesNote"}`)}{" "}<a className="underline underline-offset-2" href={section.id==="portfolio"?"/admin/buildings":section.id==="faq"?"/admin/faq":"/admin/services"}>{tb(`nav.${section.id==="portfolio"?"buildings":section.id==="faq"?"faq":"services"}`)}</a></p>:null}
 {section.external?<p className="text-sm text-ink-soft">{t("admin.contextual.external")}</p>:null}
 {notice?<p role={conflict?"alert":"status"} className="text-sm text-ink">{notice}</p>:null}
 {model.sourceInvalid?<p role="alert">{t("admin.contextual.sourceInvalid")}</p>:null}
 {conflict?<AdminButton onClick={()=>window.location.reload()}>{t("admin.reloadSource")}</AdminButton>:null}
 {locale==="en"?visible.map(binding=>binding.id==="og_image_media_id"?<Field key={binding.id} label={t("admin.fields.ogImage")} error={errors.og_image_media_id}><MediaField value={og||null} preview={model.previews[og]??null} onChange={id=>{setOg(id??"");mark();}}/></Field>:<NodeField key={binding.id} pageKey="home" node={homeNode(model.rootNode,binding.id)!} value={homeAt(data,binding.id)} path={binding.id.split(".")} label={binding.label} depth={0} onChange={change} onListChange={listChange} listIds={content._list_ids} errors={errors} previews={model.previews} options={model.options}/>):<>
 <p className="text-xs text-ink-soft">{t("admin.contextual.sourceOnly")}</p>
 {targetPaths.map(path=>{const field=homeTranslationField(targetContent,path);const row=translations[locale][field];return <Field key={field} label={labels.field(path.split(".").at(-1)!)} hint={`${row?.value?t(`admin.contextual.${row.state==="approved"?"approved":"needs_review"}`):t("admin.contextual.fallback")}${row?.stale?` · ${t("admin.contextual.stale")}`:""}`}><p className="mb-2 text-xs text-ink-soft">EN: {String(homeAt(savedData,path)??"")}</p><TextArea value={targets[locale][field]??""} placeholder={String(homeAt(savedData,path)??"")} onChange={event=>{const value=event.target.value;setTargets(prev=>({...prev,[locale]:{...prev[locale],[field]:value}}));mark();}}/></Field>;})}
 </>}
 </div>;
 return <PageEditorShell adapter={{title:"Home",sections,selectedId:selected,onSelect:setSelected,locale,onLocaleChange:setLocale,previewUrl:`/admin/preview/home?locale=${locale}`,previewVersion:version,dirty:Object.values(dirty).some(Boolean),busy,status:<span>{t("admin.contextual.savedPreview")}</span>,inspector,actions:<div className="flex gap-2"><AdminButton disabled={busy||conflict||model.sourceInvalid} onClick={()=>void save()}>{saving?tb("actions.saving"):t(locale==="en"?"admin.contextual.savePublish":"admin.contextual.saveReview")}</AdminButton>{locale!=="en"?<AdminButton disabled={busy||conflict||model.sourceInvalid} onClick={()=>void save(true)}>{t("admin.contextual.approve")}</AdminButton>:null}</div>}}/>;
}
