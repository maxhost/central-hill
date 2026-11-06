import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { requireStaff } from "@core/auth";
import type { Locale } from "@core/db/columns";
import { uuid } from "@core/validation/primitives";
import { SiteHeader, SiteFooter } from "@slices/settings/contract";
import { getPostEditorialModel } from "@slices/blog/server/post-locale-model";
import { renderPostLivePreview } from "@slices/blog/admin/post-preview-actions";
import { BlogPostPreview } from "@slices/blog/admin/ui/post-editor-preview";
export const dynamic="force-dynamic";
export const revalidate=0;
export const metadata={robots:{index:false,follow:false}};
export default async function PostPreviewPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{locale?:string;instance?:string;new?:string}>}) {
 await requireStaff();
 const {id}=await params; const q=await searchParams;
 if(!uuid.safeParse(id).success || !q.instance || !/^[a-zA-Z0-9_-]{1,100}$/.test(q.instance)) notFound();
 const locale=(q.locale??"en") as Locale; if(!["en","es","pt","fr"].includes(locale)) notFound();
 setRequestLocale(locale);
 const [messages,t]=await Promise.all([getMessages({locale}),getTranslations({locale,namespace:"blog.editorial"})]);
 let initial; try { initial=await getPostEditorialModel(id); } catch(error) { if(error instanceof Error && error.name==="LegacyPostError") return <p role="alert">{t("legacyInvalid")}</p>; throw error; }
 if(!initial && q.new!=="1") notFound();
 const rendered=initial ? await renderPostLivePreview({postId:id,locale,envelope:initial.locales[locale].working,slug:initial.slugByLocale[locale]??"",localMedia:{}}) : null;
 return <NextIntlClientProvider locale={locale} messages={messages}>
  <SiteHeader locale={locale}/>
  <BlogPostPreview instance={q.instance}>{rendered?.ok?rendered.content:<p role="status">{t("previewEmpty")}</p>}</BlogPostPreview>
  <SiteFooter locale={locale}/>
 </NextIntlClientProvider>;
}
