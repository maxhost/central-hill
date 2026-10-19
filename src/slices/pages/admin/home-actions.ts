"use server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import { targetSnapshotCtes } from "@core/i18n";
import { page_content } from "../schema";
import { homeSchema } from "../schemas/home";
import { homeSet, homeSourceFields, homeTextPaths, homeTranslationField, normalizeHome } from "../home-content";
import { homeRevision } from "./home-save";
import { revalidatePage } from "../server/publish";
import type { PageSaveResult } from "./actions";
const inputSchema=z.object({locale:z.enum(["es","pt","fr"]),revision:z.string().min(1),values:z.record(z.string(),z.string().max(2000)),approve:z.boolean()});
export async function saveHomeLocale(input: z.infer<typeof inputSchema>):Promise<PageSaveResult>{
 const actor=await requireStaff();const checked=inputSchema.safeParse(input);
 if(!checked.success)return {ok:false,error:"validation",fieldErrors:{_source:"Invalid translation request."}};
 try{
 const value=checked.data;
 const [row]=await db.select().from(page_content).where(eq(page_content.key,"home")).limit(1);
 if(!row||homeRevision(row)!==value.revision)return {ok:false,error:"conflict"};
 const parsed=homeSchema.safeParse(row.data);
 if(!parsed.success)return {ok:false,error:"validation",fieldErrors:{_source:"Invalid saved source."}};
 const data=normalizeHome(parsed.data);const source=homeSourceFields(data);const localized=structuredClone(data);
 const fields:Record<string,{value:string;sourceValue:string}>={};
 for(const [field,text]of Object.entries(value.values)){
 if(!Object.hasOwn(source,field))return {ok:false,error:"conflict"};
 fields[field]={value:text,sourceValue:source[field]!};
 }
 for(const path of homeTextPaths(data)){const field=homeTranslationField(data,path);const text=value.values[field];if(text?.trim())homeSet(localized,path,text);}
 if(!homeSchema.safeParse(localized).success)return {ok:false,error:"validation",fieldErrors:{_source:"Translated text exceeds its field limit."}};
 const snapshot=targetSnapshotCtes("page_content",sql`select id from saved`,value.locale,fields,value.approve?"approved":"needs_review",actor.userId);
 const result=await db.execute(sql`with saved as (
 update page_content set updated_at=now() where key='home' and data=${JSON.stringify(row.data)}::jsonb and og_image_media_id is not distinct from ${row.og_image_media_id}::uuid and date_trunc('milliseconds',updated_at)=${row.updated_at.toISOString()}::timestamptz returning id,data,og_image_media_id,updated_at
 ), ${snapshot} select data,og_image_media_id,updated_at from saved`);
 if(!result.rows.length)return {ok:false,error:"conflict"};
 const saved=result.rows[0] as {data:unknown;og_image_media_id:string|null;updated_at:string};
 revalidatePage("home");return {ok:true,revision:homeRevision({...saved,updated_at:new Date(saved.updated_at)})};
 }catch{return {ok:false,error:"server"};}
}
