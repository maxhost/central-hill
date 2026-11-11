import fs from "node:fs/promises";
import { createHash } from "node:crypto";
const out =
    process.env.FIXTURE_ARTIFACT_DIR || "/private/tmp/central-hill-translations-retirement-qa",
  manifest = JSON.parse(await fs.readFile(out + "/page-field-manifest.json", "utf8")),
  baseline = JSON.parse(await fs.readFile(out + "/baseline.json", "utf8")),
  fixture = baseline.fixture;
function expand(root, pattern) {
  const parts = pattern.split(".");
  function walk(v, i, p) {
    if (i === parts.length) return [p];
    const seg = parts[i],
      arr = seg.endsWith("[]"),
      key = seg.replace(/\[\]$/, "");
    const next = p ? `${p}.${key}` : key;
    if (arr) return (v?.[key] || []).flatMap((item, j) => walk(item, i + 1, `${next}.${j}`));
    return walk(v?.[key], i + 1, next);
  }
  return walk(root, 0, "");
}
const pages = manifest.pages.map((page) => ({
  key: page.key,
  editor: page.editor,
  public: page.public,
  exclusions: page.fields
    .filter((f) => !f.control)
    .map((f) => ({ pattern: f.pattern, ...f.exclusion })),
  fields: page.fields
    .filter((f) => f.control)
    .flatMap((field) =>
      expand(baseline.pages[page.key].en.content, field.pattern).map((p) => ({
        ...field,
        path: p,
        control: { ...field.control, selector: `[id="page-field-${page.key}-${p}"]` },
        section: field.section === "stats_title" ? "stats" : field.section,
        public: {
          ...field.public,
          route:
            field.surface === "blog_article"
              ? fixture.publicPaths.en.post.replace("/en/", "/{locale}/")
              : field.surface === "shared_aside"
                ? fixture.publicPaths.en.guide.replace("/en/", "/{locale}/")
                : field.public.route,
        },
        status: "planned-baseline-resolved-needs-browser-observation",
      })),
    ),
  references: ["home", "owners", "real_estate", "guest", "about"].includes(page.key)
    ? [
        {
          path: "faq_group_key",
          section: "faq",
          control: '[id="page-field-' + page.key + '-faq_group_key"]',
          kind: "select",
          expected: "Own locale group; blank target no EN inheritance",
        },
      ]
    : [],
  mediaAlt: {
    kind: "own-map",
    ids: Object.keys(baseline.pages[page.key].en.mediaAlts || {}),
    control:
      "Alternative text · {LOCALE} textbox beside selected image; inline sibling alt remains authoritative",
    requiresRendererAssertion: true,
  },
}));
const classify = (p) =>
  /meta_title$/.test(p)
    ? "document-title"
    : /meta_description$/.test(p)
      ? "meta-description"
      : /(?:_alt|\.alt)$/.test(p)
        ? "image-alt"
        : /(?:\.url|_url)$/.test(p)
          ? "link-href"
          : "visible-text";
function leaves(v, p = "") {
  if (typeof v === "string") return [{ path: p, value: v }];
  if (Array.isArray(v)) return v.flatMap((x, i) => leaves(x, p ? `${p}.${i}` : String(i)));
  if (v && typeof v === "object")
    return Object.entries(v).flatMap(([k, x]) => leaves(x, p ? `${p}.${k}` : k));
  return [];
}
const serviceSkip = new Set(["category_id", "cover_media_id", "og_image_media_id", "booking_type"]);
const service = leaves(baseline.service.en.content)
  .filter(
    (f) =>
      !serviceSkip.has(f.path) &&
      !f.path.startsWith("gallery.") &&
      !f.path.startsWith("media_alts.") &&
      !/\.(?:id|icon|media_id)$/.test(f.path),
  )
  .map((f) => ({
    path: f.path,
    control: `[data-service-path="${f.path}"] input, [data-service-path="${f.path}"] textarea, input[data-service-path="${f.path}"], textarea[data-service-path="${f.path}"]`,
    public: { kind: classify(f.path), route: "/{locale}/services/qa-service" },
    condition:
      f.path.startsWith("copy.enquiry") ||
      ["copy.noPayment", "copy.phone", "copy.whatsapp", "copy.email", "copy.requestShort"].includes(
        f.path,
      )
        ? "booking_type=enquiry; edit when editor exposes it; mobile for requestShort"
        : ["copy.showAllPhotos", "copy.allPhotos", "copy.close"].includes(f.path)
          ? "gallery with5media, open photos dialog"
          : f.path === "copy.onRequest"
            ? "price_display=on_request variant"
            : f.path === "copy.seePartners"
              ? "booking_type=none, partners branch"
              : "configured baseline",
    status: "planned-needs-browser-observation",
  }));
const guide = leaves(baseline.guide.en.content)
  .filter(
    (f) =>
      !["city_id", "template", "hero_media_id", "og_image_media_id"].includes(f.path) &&
      !f.path.startsWith("media_alts.") &&
      !/\.(?:id|guide_page_id|guide_section_id|layout|header_media_id|media_id|address|phone|price_tier)$/.test(
        f.path,
      ),
  )
  .map((f) => {
    const parts = f.path.split(".");
    let entity = fixture.ids.guide;
    if (parts[0] === "sections") {
      entity = baseline.guide.en.content.sections[Number(parts[1])].id;
      if (parts[2] === "places")
        entity = baseline.guide.en.content.sections[Number(parts[1])].places[Number(parts[3])].id;
    }
    return {
      path: f.path,
      control: `[id="${entity}-${parts.at(-1)}"]`,
      public: { kind: classify(f.path), route: "/{locale}/guides/qa-city/qa-guide" },
      constraint:
        parts.at(-1) === "category"
          ? "EN retains canonical restaurant/viewpoint/beach classification; targets may localize label without mutating shared recommendation_type"
          : null,
      status: "planned-needs-browser-observation",
    };
  });
const post = [
  ...["title", "excerpt", "cta_label", "cta_url", "meta_title", "meta_description"].map((p) => ({
    path: p,
    control: `[data-post-field="${p}"] input, [data-post-field="${p}"] textarea`,
    public: { kind: classify(p), route: "/{locale}/blog/qa-article" },
  })),
  ...baseline.posts[fixture.ids.post].en.content.body.flatMap((block, i) => {
    if (block.type === "heading" || block.type === "paragraph")
      return [
        {
          path: `body.${i}.text`,
          control: `[data-post-rich-text] ${block.type === "heading" ? "h" + block.level : "p"} (actual block index resolved in browser)`,
          public: { kind: "visible-text", route: "/{locale}/blog/qa-article" },
        },
      ];
    if (block.type === "list")
      return block.items.map((_, j) => ({
        path: `body.${i}.items.${j}`,
        control: `[data-post-rich-text] li nth(${j})`,
        public: { kind: "visible-text", route: "/{locale}/blog/qa-article" },
      }));
    if (block.type === "image")
      return ["alt", "caption"].map((k) => ({
        path: `body.${i}.${k}`,
        control: `[data-article-node="articleImage"] input[id$="-${k}"]`,
        public: {
          kind: k === "alt" ? "image-alt" : "visible-text",
          route: "/{locale}/blog/qa-article",
        },
      }));
    return [];
  }),
].map((f) => ({ ...f, status: "planned-needs-browser-observation" }));
const resolved = {
  version: 2,
  fixtureRunId: fixture.runId,
  note: "Prepared baseline resolved; no browser observations or pass implied. Conditional fields require their named interactions/variants. Persisted/draft/public must be asserted per spec.",
  pages,
  entities: {
    post: { editor: `/admin/posts/${fixture.ids.post}`, fields: post },
    service: { editor: `/admin/services/${fixture.ids.service}`, fields: service },
    guide: { editor: `/admin/guides/${fixture.ids.guide}`, fields: guide },
  },
  cases: {
    principal: 48,
    blogSidebarAdditional: 4,
    incremental: ["S1/es", "G1/pt", "P7/fr"],
    interleaved: ["owners", "post", "service", "guide"],
  },
};
const data = JSON.stringify(resolved, null, 2);
await fs.writeFile(out + "/concrete-field-manifest.json", data);
console.log(
  JSON.stringify({
    sha256: createHash("sha256").update(data).digest("hex"),
    pageFields: pages.map((p) => ({
      key: p.key,
      count: p.fields.length,
      exclusions: p.exclusions.length,
    })),
    entityFields: Object.fromEntries(
      Object.entries(resolved.entities).map(([k, v]) => [k, v.fields.length]),
    ),
  }),
);
