import {getBuildingLocaleScope} from "@slices/buildings/contract";
import {notFound} from "next/navigation";
import {requireStaff} from "@core/auth";
import {uuid} from "@core/validation/primitives";
import {getTranslations} from "next-intl/server";
import {getApartmentEditorialModel} from "@slices/apartments/server/editorial-store";
import {ApartmentLocaleEditor} from "@slices/apartments/admin/ui/apartment-locale-editor";
export default async function EditApartmentPage({params,searchParams}:{params:Promise<{id:string;aptId:string}>;searchParams:Promise<{locale?:string}>}){
 await requireStaff();const{id,aptId}=await params;if(!uuid.safeParse(aptId).success||!uuid.safeParse(id).success)notFound();let initial;
 try{initial=await getApartmentEditorialModel(aptId,id);}catch(error){if(error instanceof Error&&error.name==="PropertyLegacyError"){const t=await getTranslations("propertyEditor");return <p role="alert">{t("legacyInvalid")}</p>;}throw error;}
 if(!initial||initial.parentId!==id)notFound();const parentPublication=Object.fromEntries(await Promise.all((["en","es","pt","fr"] as const).map(async locale=>[locale,Boolean((await getBuildingLocaleScope(id,locale))?.published)])));return <ApartmentLocaleEditor key={initial.id} initial={initial} initialLocale={(await searchParams).locale} buildingId={id} parentPublication={parentPublication}/>;
}
