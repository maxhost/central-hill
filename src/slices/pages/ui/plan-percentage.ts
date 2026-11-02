/** Only the percentage displayed on the card is authoritative; legacy commission is hidden. */
export function planPercentage(badge: string | undefined): number | null {
  const match = badge?.match(/^\s*\+?\s*(\d+(?:[.,]\d{1,2})?)\s*%\s*$/);
  if (!match?.[1]) return null;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) && value <= 100 ? value : null;
}
