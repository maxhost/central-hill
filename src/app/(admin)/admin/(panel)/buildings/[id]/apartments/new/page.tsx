import {getBuildingLocaleScope} from "@slices/buildings/contract";
import {randomUUID} from "node:crypto";
import {requireStaff} from "@core/auth";
import {ApartmentLocaleEditor} from "@slices/apartments/admin/ui/apartment-locale-editor";
export default async function NewApartmentPage({params}:{params:Promise<{id:string}>}){await requireStaff();const{id}=await params;const parentPublication=Object.fromEntries(await Promise.all((["en","es","pt","fr"] as const).map(async locale=>[locale,Boolean((await getBuildingLocaleScope(id,locale))?.published)])));return <ApartmentLocaleEditor initial={null} newEntityId={randomUUID()} buildingId={id} parentPublication={parentPublication}/>;}
