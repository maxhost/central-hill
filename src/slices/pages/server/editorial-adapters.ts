import { servicesAdapter } from "../adapters/services";
import { aboutAdapter } from "../adapters/about";
import "server-only";
import type { EditorialPageKey } from "../editorial-types";
import type { PageEditorialAdapter } from "../editorial-adapter-types";
import { ownersAdapter } from "../adapters/owners";
import { buildingsAdapter } from "../adapters/buildings";
import { realEstateAdapter } from "../adapters/real-estate";
import { guestAdapter } from "../adapters/guest";
import { homeAdapter } from "../adapters/home";
/** Explicit server registry: consumers cannot accidentally bundle queries/renderers. */
export function getEditorialAdapter<K extends EditorialPageKey>(key: K): PageEditorialAdapter<K> {
 if (key === "services") return servicesAdapter as unknown as PageEditorialAdapter<K>;
 if (key === "about") return aboutAdapter as unknown as PageEditorialAdapter<K>;
 if (key === "guest") return guestAdapter as unknown as PageEditorialAdapter<K>;
 if (key === "buildings") return buildingsAdapter as unknown as PageEditorialAdapter<K>;
 if (key === "real_estate") return realEstateAdapter as unknown as PageEditorialAdapter<K>;
 if (key === "owners") return ownersAdapter as unknown as PageEditorialAdapter<K>;
 if (key === "home") return homeAdapter as unknown as PageEditorialAdapter<K>;
 throw new Error(`Editorial adapter not enabled: ${key}`);
}
