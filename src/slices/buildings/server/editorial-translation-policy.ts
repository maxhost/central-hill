import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { building_faq } from "../schema";
import { getApartmentEditorParentId } from "@slices/apartments/contract";
export function isPropertyEditorialEntity(type:string):boolean { return ["building","apartment","building_faq"].includes(type); }
export async function getPropertyEditorialRedirect(type:string,id:string,locale?:string):Promise<string|null> {
 if(!isPropertyEditorialEntity(type)||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
 const suffix=locale&&["en","es","pt","fr"].includes(locale)?`?locale=${locale}`:"";
 if(type==="building")return `/admin/buildings/${id}${suffix}`;
 if(type==="apartment"){const parent=await getApartmentEditorParentId(id);return parent?`/admin/buildings/${parent}/apartments/${id}${suffix}`:null;}
 const [faq]=await db.select({parent:building_faq.building_id}).from(building_faq).where(eq(building_faq.id,id)).limit(1);
 return faq?`/admin/buildings/${faq.parent}${suffix}`:null;
}
