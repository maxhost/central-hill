import { collectSitemap, type SitemapSection } from "./urls";
import { SITE_NAME, absoluteUrl } from "../config";

/**
 * Slice `seo` (S13) — `llms.txt` / `llms-full.txt` (ADR 0020, docs/seo-i18n.md →
 * GEO). The `llms.txt` spec (llmstxt.org) is a markdown digest that helps answer
 * engines cite the site accurately: an H1 name, a blockquote summary, prose, then
 * `##` sections of annotated links. We emit the **English canonical** URLs (the
 * x-default); per-locale variants are reachable via the page hreflang + sitemaps.
 *
 * `llms.txt` is the concise map (key sections only); `llms-full.txt` additionally
 * enumerates every public entity URL grouped by section.
 */
const SUMMARY =
  "Central Hill is a Lisbon-based premium furnished-rentals company: a curated " +
  "portfolio of boutique buildings and serviced apartments for medium and long stays, " +
  "with services for guests and property owners, plus editorial city guides and a blog.";

const SECTION_TITLES: Record<string, string> = {
  pages: "Main pages",
  buildings: "Buildings & apartments",
  blog: "Blog",
  services: "Services",
  guides: "City guides",
};

/** English canonical (`x-default`) URLs of a section, in document order. */
function englishUrls(section: SitemapSection): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of section.urls) {
    const xdefault = url.alternates.find((a) => a.hreflang === "x-default");
    const href = xdefault?.href ?? url.loc;
    if (!seen.has(href)) {
      seen.add(href);
      out.push(href);
    }
  }
  return out;
}

function header(): string {
  return [`# ${SITE_NAME}`, "", `> ${SUMMARY}`, "", SUMMARY, ""].join("\n");
}

function sectionBlock(title: string, links: string[]): string {
  return [`## ${title}`, "", ...links.map((href) => `- ${href}`), ""].join("\n");
}

export async function buildLlmsTxt(): Promise<string> {
  const sections = await collectSitemap();
  const blocks: string[] = [header()];

  // Concise: the fixed key sections, each linked once to its index/landing URL.
  const keyLinks = [
    absoluteUrl("/en"),
    absoluteUrl("/en/buildings"),
    absoluteUrl("/en/services"),
    absoluteUrl("/en/guides"),
    absoluteUrl("/en/blog"),
    absoluteUrl("/en/owners"),
    absoluteUrl("/en/about"),
  ];
  blocks.push(sectionBlock("Key sections", keyLinks));

  const counts = sections
    .filter((s) => s.id !== "pages")
    .map((s) => `- ${SECTION_TITLES[s.id] ?? s.id}: ${englishUrls(s).length} pages`);
  if (counts.length) blocks.push(["## Catalog", "", ...counts, ""].join("\n"));

  blocks.push(`Full URL list: ${absoluteUrl("/llms-full.txt")}`, "");
  return blocks.join("\n");
}

export async function buildLlmsFullTxt(): Promise<string> {
  const sections = await collectSitemap();
  const blocks: string[] = [header()];
  for (const section of sections) {
    const links = englishUrls(section);
    if (!links.length) continue;
    blocks.push(sectionBlock(SECTION_TITLES[section.id] ?? section.id, links));
  }
  return blocks.join("\n");
}
