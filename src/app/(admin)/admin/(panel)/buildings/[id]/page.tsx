import {notFound} from "next/navigation";
import {requireStaff} from "@core/auth";
import {uuid} from "@core/validation/primitives";
import {getTranslations} from "next-intl/server";
import {getBuildingEditorialModel} from "@slices/buildings/server/editorial-store";
import {listAmenitiesAdmin,listLocationOptions} from "@slices/buildings/admin/queries";
import {BuildingLocaleEditor} from "@slices/buildings/admin/ui/building-locale-editor";
export default async function EditBuildingPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{locale?:string}>}){
 await requireStaff();const {id}=await params;if(!uuid.safeParse(id).success)notFound();let initial;
 try{initial=await getBuildingEditorialModel(id);}catch(error){if(error instanceof Error&&error.name==="PropertyLegacyError"){const t=await getTranslations("propertyEditor");return <p role="alert">{t("legacyInvalid")}</p>;}throw error;}
 if(!initial)notFound();const [amenities,locations]=await Promise.all([listAmenitiesAdmin(),listLocationOptions()]);return <BuildingLocaleEditor key={initial.id} initial={initial} initialLocale={(await searchParams).locale} amenities={amenities} locations={locations}/>;
}
