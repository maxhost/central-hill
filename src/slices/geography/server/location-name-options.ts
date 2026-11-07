import "server-only";
import { asc, eq } from "drizzle-orm";
import { requireStaff } from "@core/auth";
import { db } from "@core/db/client";
import type { GeographyLocationOptions } from "../reference-name-types";
import { city, neighbourhood } from "../schema";
import { loadGeographyNameOptions } from "./reference-names";

/** Published locations for Building selectors, freshly resolved for all locales. */
export async function listLocationNameOptions(): Promise<GeographyLocationOptions> {
  await requireStaff();
  const [cities, neighbourhoods] = await Promise.all([
    db
      .select({ id: city.id, slug: city.slug })
      .from(city)
      .where(eq(city.status, "published"))
      .orderBy(asc(city.position)),
    db
      .select({
        id: neighbourhood.id,
        slug: neighbourhood.slug,
        cityId: neighbourhood.city_id,
      })
      .from(neighbourhood)
      .innerJoin(city, eq(city.id, neighbourhood.city_id))
      .where(eq(city.status, "published"))
      .orderBy(asc(neighbourhood.position)),
  ]);
  const [cityOptions, neighbourhoodOptions] = await Promise.all([
    loadGeographyNameOptions("city", cities),
    loadGeographyNameOptions("neighbourhood", neighbourhoods),
  ]);
  return {
    cities: cityOptions,
    neighbourhoods: neighbourhoodOptions.map((option, index) => ({
      ...option,
      cityId: neighbourhoods[index]!.cityId,
    })),
  };
}
