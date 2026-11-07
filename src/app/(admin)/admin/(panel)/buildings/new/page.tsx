import {randomUUID} from "node:crypto";
import {requireStaff} from "@core/auth";
import {listAmenitiesAdmin,listLocationOptions} from "@slices/buildings/admin/queries";
import {BuildingLocaleEditor} from "@slices/buildings/admin/ui/building-locale-editor";
export default async function NewBuildingPage(){await requireStaff();const [amenities,locations]=await Promise.all([listAmenitiesAdmin(),listLocationOptions()]);return <BuildingLocaleEditor initial={null} newEntityId={randomUUID()} amenities={amenities} locations={locations}/>;}
