/**
 * Presentation helpers for slice `services`. Currency is EUR (company_settings
 * fixes `currency` to a literal "EUR" — see settings/validation.ts), so the public
 * "from €X" label can format without taking a settings dependency.
 */
export function formatPrice(cents: number | null, locale: string): string | null {
  if (cents === null) return null;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
  } catch {
    return `€${(cents / 100).toFixed(0)}`;
  }
}
