import fs from "node:fs/promises";
const root = process.env.SOURCE_ROOT || process.cwd();
const { translatablePaths } = await import(
  root + "/src/core/validation/primitives.ts"
);
const { describe } = await import(
  root + "/src/slices/pages/admin/form-model.ts"
);
const schemaModule = await import(root + "/src/slices/pages/schemas/index.ts");
const names = {
  home: "homeSchema",
  owners: "ownersSchema",
  buildings: "buildingsSchema",
  real_estate: "realEstateSchema",
  guest: "guestSchema",
  services: "servicesSchema",
  about: "aboutSchema",
  guides: "guidesSchema",
  blog: "blogSchema",
};
const routes = {
  home: "",
  owners: "/owners",
  buildings: "/buildings",
  real_estate: "/real-estate",
  guest: "/guests",
  services: "/services",
  about: "/about",
  guides: "/guides",
  blog: "/blog",
};
const out = [];
function find(node, parts, hidden = false) {
  if (node.kind === "hidden") return find(node.node, parts, true);
  if (!parts.length) return { node, hidden };
  const [head, ...tail] = parts;
  if (node.kind === "object") {
    const f = node.fields.find((x) => x.key === head);
    return f ? find(f.node, tail, hidden) : { node: null, hidden };
  }
  if (node.kind === "array") return find(node.element, tail, hidden);
  return { node: null, hidden };
}
for (const [key, name] of Object.entries(names)) {
  const schema = schemaModule[name],
    node = describe(schema),
    patterns = translatablePaths(schema);
  const fields = patterns.map((pattern) => {
    const path = pattern.replace(/\[\]/g, ".0"),
      meta = find(node, path.split("."));
    const surface =
      key === "blog" && path.startsWith("post_aside.")
        ? "blog_article"
        : key === "guides" && path.startsWith("guide_aside.")
          ? "shared_aside"
          : "page";
    const kind = /^seo\.meta_title$/.test(path)
      ? "document-title"
      : /^seo\.meta_description$/.test(path)
        ? "meta-description"
        : /(?:image_alt|\.alt)$/.test(path)
          ? "image-alt"
          : /(?:\.url|_url)$/.test(path)
            ? "link-href"
            : /placeholder$/.test(path)
              ? "input-placeholder"
              : /search_label$/.test(path)
                ? "input-aria-label"
                : "visible-text";
    return {
      pattern,
      pathTemplate: path,
      surface,
      section: path.split(".")[0],
      control: meta.hidden
        ? null
        : {
            selector: `[id="page-field-${key}-${path}"]`,
            kind: meta.node?.multiline ? "textarea" : "input",
            source: "src/slices/pages/admin/ui/schema-fields.tsx:99",
          },
      public: {
        route: `/{locale}${routes[key]}`,
        kind,
        selector:
          kind === "document-title"
            ? "head > title"
            : kind === "meta-description"
              ? 'head > meta[name="description"]'
              : kind === "image-alt"
                ? 'img[alt="{value}"]'
                : kind === "link-href"
                  ? 'a[href="{value}"]'
                  : kind === "input-placeholder"
                    ? 'input[placeholder="{value}"]'
                    : kind === "input-aria-label"
                      ? 'input[aria-label="{value}"]'
                      : 'main :text-is("{value}")',
      },
      status: meta.hidden
        ? "excluded-admin-hidden"
        : "requires-fixture-resolution",
    };
  });
  out.push({
    key,
    editor: `/admin/pages/${key}`,
    public: `/{locale}${routes[key]}`,
    fields,
  });
}
await fs.writeFile(
  (process.env.FIXTURE_ARTIFACT_DIR ||
    "/private/tmp/central-hill-translations-retirement-qa") +
    "/page-field-manifest.json",
  JSON.stringify(
    {
      version: 1,
      sourceRoot: root,
      note: "Schema-pattern inventory before DB. Expand every [] for actual fixture IDs/indexes; unresolved renderer paths require explicit public-source audit before pass.",
      pages: out,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    out.map((p) => ({
      key: p.key,
      patterns: p.fields.length,
      editable: p.fields.filter((f) => f.control).length,
      hidden: p.fields.filter((f) => !f.control).map((f) => f.pattern),
    })),
  ),
);
