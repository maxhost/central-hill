import type { GuidePriceTier } from "../contract";

/**
 * Presentation helpers for slice `guides`. The price tier is shown as the
 * conventional €/€€/€€€ band (content brief 4.2), independent of currency/settings.
 */
export function priceTierSymbol(tier: GuidePriceTier | null): string | null {
  switch (tier) {
    case "budget":
      return "€";
    case "mid":
      return "€€";
    case "premium":
      return "€€€";
    default:
      return null;
  }
}
