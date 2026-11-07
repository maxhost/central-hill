import {notFound} from "next/navigation";
import {NextIntlClientProvider} from "next-intl";
import {getMessages,getTranslations,setRequestLocale} from "next-intl/server";
import {requireStaff} from "@core/auth";
import {uuid} from "@core/validation/primitives";
import type {Locale} from "@core/db/columns";
import {PropertyLivePreview} from "@slices/backoffice/contract";
import {SiteHeader,SiteFooter} from "@slices/settings/contract";
import {getBuildingEditorialModel} from "@slices/buildings/server/editorial-store";
import {renderBuildingLivePreview} from "@slices/buildings/admin/editorial-actions";
export const dynamic="force-dynamic";export const revalidate=0;export const metadata={robots:{index:false,follow:false}};
export default async function PropertyPreviewPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{locale?:string;instance?:string;new?:string;buildingId?:string;parentId?:string}>}){
 await requireStaff();const{id}=await params;const q=await searchParams;const locale=(q.locale??"en") as Locale;
 if(!uuid.safeParse(id).success||!["en","es","pt","fr"].includes(locale)||!q.instance||!/^[a-zA-Z0-9_-]{1,100}$/.test(q.instance))notFound();
 setRequestLocale(locale);const[messages,t]=await Promise.all([getMessages({locale}),getTranslations({locale,namespace:"propertyEditor"})]);
 let initial;try{initial=await getBuildingEditorialModel(id);}catch(error){if(error instanceof Error&&error.name==="PropertyLegacyError")return <p role="alert">{t("legacyInvalid")}</p>;throw error;}
 if(!initial&&q.new!=="1")notFound();
 const rendered=initial?await renderBuildingLivePreview({id,locale,envelope:initial.locales[locale].working,slug:initial.slugByLocale[locale]??"",localMedia:{}}):null;
 return <NextIntlClientProvider locale={locale} messages={messages}><SiteHeader locale={locale}/><PropertyLivePreview instance={q.instance} bindingIds={["identity", "hero", "gallery", "amenities", "faq", "booking", "seo"]} renderPreviewAction={renderBuildingLivePreview}>{rendered?.ok?rendered.content:<p role="status">{t("previewEmpty")}</p>}</PropertyLivePreview><SiteFooter locale={locale}/></NextIntlClientProvider>;
}
