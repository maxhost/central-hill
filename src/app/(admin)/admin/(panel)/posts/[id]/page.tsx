import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@core/auth";
import { getPostEditorialModel } from "@slices/blog/server/post-locale-model";
import { listAuthorOptions, listBlogCategoryOptions, listPostOptions } from "@slices/blog/admin/queries";
import { PostLocaleEditor } from "@slices/blog/admin/ui/post-locale-editor";
import { uuid } from "@core/validation/primitives";
export default async function EditPostPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{locale?:string}>}) {
 await requireStaff(); const {id}=await params; if(!uuid.safeParse(id).success) notFound();
 const t=await getTranslations("blog.editorial");
 let initial;
 try { initial=await getPostEditorialModel(id); }
 catch(error) { if(error instanceof Error && error.name === "LegacyPostError") return <p role="alert">{t("legacyInvalid")}</p>; throw error; }
 if(!initial) notFound();
 const [categories,authors,posts]=await Promise.all([listBlogCategoryOptions(),listAuthorOptions(),listPostOptions()]);
 const locale=(await searchParams).locale;
 return <PostLocaleEditor key={initial.id} initial={initial} categories={categories} authors={authors} posts={posts} initialLocale={locale} />;
}
