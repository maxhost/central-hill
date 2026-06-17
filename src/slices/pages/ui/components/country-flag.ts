/**
 * Country name → flag emoji (client feedback B4 — "next to each testimonial's country
 * name, display the respective flag"). `author_country` is free text typed in the back
 * office, so we normalize (lowercase, strip accents) and match common names across the
 * site's four locales (EN/PT/ES/FR) plus a few frequent markets. Unknown names return
 * `null` and the UI simply omits the flag.
 *
 * Pure module — derives the emoji from the ISO-3166 alpha-2 code via regional-indicator
 * symbols, so adding a country only needs its code in the name map below.
 */

/** ISO alpha-2 → flag emoji (two regional-indicator letters). */
function codeToFlag(cc: string): string {
  return cc
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

const norm = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Common country names (and their PT/ES/FR variants) → ISO alpha-2. */
const NAME_TO_CODE: Record<string, string> = {
  portugal: "pt",
  spain: "es",
  espana: "es",
  espanha: "es",
  espagne: "es",
  france: "fr",
  francia: "fr",
  franca: "fr",
  germany: "de",
  alemania: "de",
  alemanha: "de",
  allemagne: "de",
  italy: "it",
  italia: "it",
  italie: "it",
  "united kingdom": "gb",
  uk: "gb",
  "reino unido": "gb",
  "royaume-uni": "gb",
  england: "gb",
  inglaterra: "gb",
  ireland: "ie",
  irlanda: "ie",
  irlande: "ie",
  "united states": "us",
  usa: "us",
  "estados unidos": "us",
  "etats-unis": "us",
  canada: "ca",
  brazil: "br",
  brasil: "br",
  bresil: "br",
  netherlands: "nl",
  "paises bajos": "nl",
  "pays-bas": "nl",
  holanda: "nl",
  belgium: "be",
  belgica: "be",
  belgique: "be",
  switzerland: "ch",
  suiza: "ch",
  suica: "ch",
  suisse: "ch",
  sweden: "se",
  suecia: "se",
  suede: "se",
  norway: "no",
  noruega: "no",
  norvege: "no",
  denmark: "dk",
  dinamarca: "dk",
  danemark: "dk",
  austria: "at",
  autriche: "at",
  poland: "pl",
  polonia: "pl",
  pologne: "pl",
  australia: "au",
  australie: "au",
};

/** The flag emoji for a free-text country name, or `null` when unrecognized. */
export function countryFlag(country: string | null | undefined): string | null {
  if (!country) return null;
  const code = NAME_TO_CODE[norm(country)];
  return code ? codeToFlag(code) : null;
}
