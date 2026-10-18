/** Index-only presentation. Identity always comes from Geography UUIDs, never translated labels. */
export interface ListingCity { id: string; name: string; slug: string }
export interface ListingCityChoice { key: string; label: string; available: boolean }
export function buildListingCities(
  cities: readonly ListingCity[],
  sourceCities: readonly ListingCity[],
  availableIds: readonly string[],
  placeholders: { porto: string; cascais: string },
): ListingCityChoice[] {
  const available = new Set(availableIds);
  const choices = cities.map((city) => ({ key: city.id, label: city.name, available: available.has(city.id) }));
  for (const [key, aliases] of [["porto", ["porto", "oporto"]], ["cascais", ["cascais"]]] as const) {
    const real = sourceCities.some((city) => cities.some((local) => local.id === city.id) && aliases.some((alias) => city.slug.toLowerCase() === alias));
    if (!real) choices.push({ key: `placeholder:${key}`, label: placeholders[key], available: false });
  }
  return choices;
}
export function initialListingCity(cities: readonly ListingCityChoice[]): string | null {
  return cities.find((city) => city.available)?.key ?? null;
}
export function selectListingCity(current: string | null, next: string, cities: readonly ListingCityChoice[]): string | null {
  return cities.some((city) => city.key === next && city.available) ? next : current;
}
export function guideCityHeadline(template: string | null | undefined, city: string, fallback: string): string {
  return typeof template === "string" && template.trim() && template.includes("{city}") && !/[{}]/.test(template.replaceAll("{city}", ""))
    ? template.replaceAll("{city}", () => city)
    : fallback;
}
export function listingCopy(value: string | undefined, fallback: string): string {
  return value?.trim() ? value : fallback;
}
