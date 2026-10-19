import "server-only";
import { requireStaff } from "@core/auth";
import { hashSource, loadTranslationRows } from "@core/i18n";
import { getPageEditModel, type PageEditModel } from "./queries";
import { homeSourceFields, normalizeHome } from "../home-content";
import { homeSchema, type HomeContent } from "../schemas/home";
import type { HomeTranslations } from "./home-contextual";
export interface HomeContextualModel extends PageEditModel { translations: HomeTranslations }
export async function getHomeContextualModel():Promise<HomeContextualModel> {
 await requireStaff();
 const model=(await getPageEditModel("home"))!;
 const translations:HomeTranslations={es:{},pt:{},fr:{}};
 const parsed=homeSchema.safeParse(model.data);
 const source=parsed.success?homeSourceFields(normalizeHome(parsed.data as HomeContent)):{};
 if(model.pageId)for(const row of await loadTranslationRows({type:"page_content",id:model.pageId})){
 if(row.locale!=="en"&&source[row.field]!==undefined) translations[row.locale][row.field]={value:row.value,state:row.state,stale:row.source_hash!==hashSource(source[row.field]!)};
 }
 return {...model,translations};
}
