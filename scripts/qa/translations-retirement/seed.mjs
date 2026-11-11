import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { randomUUID, createHash } from "node:crypto";
const root = process.env.SOURCE_ROOT || process.cwd(),
  out = process.env.FIXTURE_ARTIFACT_DIR || "/private/tmp/central-hill-translations-retirement-qa",
  runtime = process.env.QA_RUNTIME_ROOT || process.env.SOURCE_ROOT || process.cwd();
const req = createRequire(root + "/package.json"),
  { neon } = req("@neondatabase/serverless"),
  sharp = req("sharp");
const { pageSchemas } = await import(root + "/src/slices/pages/schemas/index.ts");
const { describe } = await import(root + "/src/slices/pages/admin/form-model.ts");
const { getEditorialAdapter } = await import(
  root + "/src/slices/pages/server/editorial-adapters.ts"
);
const { validateEnvelope } = await import(root + "/src/slices/pages/admin/editorial-validation.ts");
const { translatablePaths } = await import(root + "/src/core/validation/primitives.ts");
const { emptyServiceEnvelope, serviceSharedContent } = await import(
  root + "/src/slices/services/locale-content.ts"
);
const { checkServiceEnvelope } = await import(
  root + "/src/slices/services/server/locale-validation.ts"
);
const { SERVICE_COPY_KEYS, SERVICE_HIDDEN_COPY_KEYS } = await import(
  root + "/src/slices/services/copy.ts"
);
const { emptyGuideEnvelope, guideSharedContent } = await import(
  root + "/src/slices/guides/locale-content.ts"
);
const { checkGuideEnvelope } = await import(
  root + "/src/slices/guides/server/locale-validation.ts"
);
const { checkBlogEnvelope } = await import(
  root + "/src/slices/blog/server/post-locale-validation.ts"
);
const locales = ["en", "es", "pt", "fr"];
const ids = {
  city: randomUUID(),
  emptyCity: randomUUID(),
  neighbourhood: randomUUID(),
  building: randomUUID(),
  apartment: randomUUID(),
  amenity: randomUUID(),
  buildingFaq: randomUUID(),
  category: randomUUID(),
  service: randomUUID(),
  guide: randomUUID(),
  section: randomUUID(),
  post: randomUUID(),
  secondPost: randomUUID(),
  author: randomUUID(),
  blogCategory: randomUUID(),
  settings: randomUUID(),
  guestTestimonial: randomUUID(),
  ownerTestimonial: randomUUID(),
  legacyFaq: randomUUID(),
  legacyFaqItem: randomUUID(),
};
const media = [randomUUID(), randomUUID(), randomUUID()];
const places = [randomUUID(), randomUUID(), randomUUID()];
const faq = Object.fromEntries(
  locales.map((l) => [l, { id: randomUUID(), item: randomUUID(), key: `trqa-faq-${l}` }]),
);
const pages = Object.fromEntries(Object.keys(pageSchemas).map((k) => [k, randomUUID()]));
const hash = (s) => createHash("sha256").update(s.trim()).digest("hex");
const text = (l, p) => `Base ${l.toUpperCase()} ${hash(p).slice(0, 7)}`;
function complete(node, p) {
  const key = p.split(".").at(-1) || "";
  if (node.kind === "hidden") return key.startsWith("_") ? undefined : complete(node.node, p);
  if (node.kind === "object")
    return Object.fromEntries(
      node.fields
        .map((f) => [f.key, complete(f.node, p ? `${p}.${f.key}` : f.key)])
        .filter(([, v]) => v !== undefined),
    );
  if (node.kind === "array") {
    const n = Math.max(node.min || 0, 1);
    return Array.from({ length: n }, (_, i) => complete(node.element, `${p}.${i}`));
  }
  if (node.kind === "boolean") return key === "is_popular" ? false : true;
  if (node.kind === "media")
    return ["video", "pdf", "document"].includes(node.accept) ? "" : media[0];
  if (node.kind === "icon") return "check";
  if (node.kind === "select") return key === "faq_group_key" ? faq.en.key : "";
  if (node.choices) return node.choices[0];
  if (/(?:\.url|_url)$/.test(p)) return "https://example.invalid/qa";
  if (["to", "value", "commission"].includes(key)) return "17";
  if (key === "prefix" || key === "suffix") return "";
  if (key === "image_media_id") return media[0];
  if (key === "issuer") return "QA Issuer";
  if (key === "corner_badge") return "17%";
  if (p === "catalogue.headline") return "Base EN guides {city}";
  return text("en", p);
}
function expand(root, pattern) {
  const parts = pattern.split(".");
  function walk(value, index, prefix) {
    if (index === parts.length) return [prefix];
    const seg = parts[index],
      array = seg.endsWith("[]"),
      key = seg.replace(/\[\]$/, "");
    const next = prefix ? `${prefix}.${key}` : key;
    if (array)
      return (value?.[key] || []).flatMap((item, i) => walk(item, index + 1, `${next}.${i}`));
    return walk(value?.[key], index + 1, next);
  }
  return walk(root, 0, "");
}
function set(root, p, v) {
  const keys = p.split("."),
    last = keys.pop();
  let node = root;
  for (const k of keys) node = node[k];
  node[last] = v;
}
function localized(c, schema, l) {
  const copy = structuredClone(c);
  for (const pattern of translatablePaths(schema))
    for (const p of expand(copy, pattern)) {
      let v = text(l, p);
      if (/(?:\.url|_url)$/.test(p)) v = `https://example.invalid/${l}/${hash(p).slice(0, 8)}`;
      if (/\.value$/.test(p)) v = String(170 + locales.indexOf(l));
      if (p === "catalogue.headline") v += " {city}";
      if (p.endsWith(".corner_badge")) v = String(17 + locales.indexOf(l)) + "%";
      set(copy, p, v);
    }
  if ("faq_group_key" in copy) copy.faq_group_key = faq[l].key;
  return copy;
}
const pageEnvelopes = {};
for (const [key, schema] of Object.entries(pageSchemas)) {
  const raw = complete(describe(schema), ""),
    adapter = getEditorialAdapter(key);
  // Array members of About serve/contact are photo surfaces rather than arbitrary text links.
  if (key === "about") {
    for (const card of raw.contact.cards) card.destination = "buildings";
  }
  const canonical = adapter.normalize(raw);
  for (const l of locales) {
    const content = localized(canonical, schema, l);
    const env = {
      schemaVersion: 1,
      content,
      ogImageMediaId: media[1],
      mediaAlts: { [media[0]]: text(l, `${key}-photo`), [media[1]]: text(l, `${key}-og`) },
    };
    const check = validateEnvelope(env, true, key);
    assert.deepEqual(check.errors, {}, `${key}/${l}: ${JSON.stringify(check.errors)}`);
    pageEnvelopes[key] ??= {};
    pageEnvelopes[key][l] = check.payload;
  }
}
const serviceEnv = {};
for (const l of locales) {
  const env = emptyServiceEnvelope(ids.category),
    c = env.content;
  c.name = text(l, "service-name");
  c.excerpt = text(l, "service-excerpt");
  c.body = text(l, "service-body");
  c.cover_media_id = media[0];
  c.og_image_media_id = media[1];
  c.gallery = [media[1], media[2]];
  c.price_from = 15000;
  c.rating_tenths = 48;
  c.booking_type = "external";
  c.cta_label = text(l, "service-cta");
  c.cta_url = "https://example.invalid/qa-booking";
  c.duration_label = text(l, "service-duration");
  c.price_suffix = text(l, "service-price");
  c.meta_title = text(l, "service-meta-title");
  c.meta_description = text(l, "service-meta-desc");
  c.media_alts = Object.fromEntries(media.map((m, i) => [m, text(l, `service-photo${i}`)]));
  c.detail = {
    badges: [text(l, "badge")],
    facts: [
      { id: "qa-fact", icon: "clock", title: text(l, "fact-title"), note: text(l, "fact-note") },
    ],
    about_title: text(l, "about-title"),
    included_title: text(l, "included-title"),
    price_note: text(l, "price-note"),
    booking_rows: [{ label: text(l, "booking-label"), value: text(l, "booking-value") }],
    good_to_know: {
      included: [text(l, "gtk-included")],
      cancellation: [text(l, "gtk-cancel")],
      practical: [text(l, "gtk-practical")],
    },
    highlights: [text(l, "highlight")],
    itinerary: [
      {
        id: "qa-step",
        time: text(l, "time"),
        title: text(l, "step-title"),
        text: text(l, "step-body"),
        media_id: media[2],
      },
    ],
    option_groups: [
      {
        title: text(l, "options-title"),
        items: [{ name: text(l, "option-name"), desc: text(l, "option-desc") }],
      },
    ],
    pricing: {
      columns: [text(l, "column")],
      rows: [{ label: text(l, "row"), cells: [text(l, "cell")] }],
      footnote: text(l, "footnote"),
    },
    extras: [
      { label: text(l, "extra-label"), price: text(l, "extra-price"), desc: text(l, "extra-desc") },
    ],
    partners: [
      {
        name: text(l, "partner-name"),
        desc: text(l, "partner-desc"),
        cta_label: text(l, "partner-cta"),
        url: "https://example.invalid/partner",
      },
    ],
    notes: [],
  };
  c.copy = Object.fromEntries(
    SERVICE_COPY_KEYS.filter((k) => !SERVICE_HIDDEN_COPY_KEYS.includes(k)).map((k) => [
      k,
      text(l, `copy${k}`) + (k === "enquiryTitle" ? " {name}" : ""),
    ]),
  );
  const checked = checkServiceEnvelope(env, true);
  assert.deepEqual(checked.errors, {}, `service/${l}`);
  serviceEnv[l] = checked.envelope;
}
const guideEnv = {};
for (const l of locales) {
  const env = emptyGuideEnvelope(ids.city),
    c = env.content;
  c.title = text(l, "guide-title");
  c.intro = text(l, "guide-intro");
  c.hero_media_id = media[0];
  c.og_image_media_id = media[1];
  c.meta_title = text(l, "guide-meta-title");
  c.meta_description = text(l, "guide-meta-description");
  c.media_alts = Object.fromEntries(media.map((m, i) => [m, text(l, `guide-photo${i}`)]));
  c.sections = [
    {
      id: ids.section,
      guide_page_id: ids.guide,
      position: 0,
      layout: "with_cta",
      header_media_id: media[1],
      presentation: null,
      title: text(l, "section-title"),
      body: text(l, "section-body"),
      local_tip: text(l, "section-tip"),
      cta_label: text(l, "section-cta"),
      cta_url: "https://example.invalid/guide",
      places: places.map((id, i) => ({
        id,
        guide_section_id: ids.section,
        position: i,
        category: ["restaurant", "viewpoint", "beach"][i],
        address: `QA address ${i}`,
        phone: "+351 210 000 001",
        price_tier: "mid",
        opening_hours: text(l, `hours${i}`),
        latitude: 38.7 + i / 100,
        longitude: -9.1,
        website_url: "https://example.invalid/place",
        booking_url: "https://example.invalid/place-booking",
        media_id: media[i],
        name: text(l, `place-name${i}`),
        description: text(l, `place-description${i}`),
      })),
    },
  ];
  const checked = checkGuideEnvelope(env, ids.guide);
  assert.deepEqual(checked.errors, {}, `guide/${l}`);
  guideEnv[l] = checked.envelope;
}
const postEnv = {};
for (const post of [ids.post, ids.secondPost])
  for (const l of locales) {
    const content = {
      title: text(l, `post-title${post}`),
      excerpt: text(l, `post-excerpt${post}`),
      body: [
        { type: "heading", level: 2, text: text(l, "post-heading") },
        { type: "paragraph", text: text(l, "post-paragraph") },
        { type: "list", ordered: false, items: [text(l, "post-list")] },
        {
          type: "image",
          media_id: media[2],
          alt: text(l, "post-image-alt"),
          caption: text(l, "post-caption"),
        },
      ],
      category_id: ids.blogCategory,
      author_id: ids.author,
      cover_media_id: media[0],
      og_image_media_id: media[1],
      published_at: "2026-11-01T12:00:00.000Z",
      reading_minutes: 5,
      is_featured: post === ids.secondPost,
      related_ids: post === ids.post ? [ids.secondPost] : [],
      cta_label: text(l, "post-cta"),
      cta_url: "https://example.invalid/article",
      meta_title: text(l, "post-meta-title"),
      meta_description: text(l, "post-meta-description"),
      media_alts: { [media[0]]: text(l, "post-cover-alt"), [media[1]]: text(l, "post-og-alt") },
    };
    const checked = checkBlogEnvelope({ schemaVersion: 1, content }, true);
    assert.deepEqual(checked.errors, {}, `post/${l}`);
    postEnv[post] ??= {};
    postEnv[post][l] = checked.envelope;
  }
const fixture = {
  runId: "translations-retirement-20261111",
  ids,
  media,
  places,
  faq,
  pages,
  baseUrl: "http://localhost:3081",
  publicPaths: Object.fromEntries(
    locales.map((l) => [
      l,
      {
        post: `/${l}/blog/qa-article`,
        service: `/${l}/services/qa-service`,
        guide: `/${l}/guides/qa-city/qa-guide`,
      },
    ]),
  ),
};
await fs.writeFile(
  out + "/baseline.json",
  JSON.stringify(
    { fixture, pages: pageEnvelopes, service: serviceEnv, guide: guideEnv, posts: postEnv },
    null,
    2,
  ),
);
console.log(
  "Baseline validated:",
  Object.keys(pageEnvelopes).length,
  "Pages x4 + service/guide/posts",
);
if (!process.argv.includes("--apply")) process.exit(0);
const u = new URL(process.env.DATABASE_URL);
assert.equal(u.hostname, "translationsretirementqa.local");
assert.equal(u.pathname, "/translationsretirementqa");
assert.equal(u.username, "translationsretirementqa");
const sql = neon(process.env.DATABASE_URL);
assert.deepEqual((await sql`select current_database()as db,current_user as role`)[0], {
  db: "translationsretirementqa",
  role: "translationsretirementqa",
});
const scaffold = JSON.parse(await fs.readFile(out + "/schema-scaffold-before.json", "utf8"));
assert.deepEqual(
  await sql`select id,key,md5(to_jsonb(p)::text)as hash from page_content p order by key`,
  scaffold.scaffolds,
  "Exact freshly migrated page scaffolds",
);
for (const [table, expected] of Object.entries(scaffold.counts)) {
  const [r] = await sql.query(
    `select count(*)::int as n,md5(coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text)::text,'[]'))as hash from "${table}"t`,
  );
  assert.deepEqual(r, expected, `Fresh scaffold baseline ${table}`);
}
for (const row of scaffold.scaffolds) pages[row.key] = row.id;
const oldIds = {};
for (const table of ["faq_group", "faq_item", "translation"])
  oldIds[table] = (await sql.query(`select id from ${table} order by id`)).map((r) => r.id);
await fs.writeFile(
  out + "/baseline.json",
  JSON.stringify(
    { fixture, pages: pageEnvelopes, service: serviceEnv, guide: guideEnv, posts: postEnv },
    null,
    2,
  ),
);
const queries = [];
function insert(table, data) {
  const keys = Object.keys(data),
    values = Object.values(data);
  queries.push(
    sql.query(
      `insert into ${table} (${keys.map((k) => `"${k}"`).join(",")}) values (${keys.map((_, i) => `$${i + 1}`).join(",")})`,
      values.map((v) => (v && typeof v === "object" ? JSON.stringify(v) : v)),
    ),
  );
}
function tr(type, id, field, l, value, sourceValue = value) {
  insert("translation", {
    id: randomUUID(),
    entity_type: type,
    entity_id: id,
    field,
    locale: l,
    value,
    state: l === "en" ? "draft" : "approved",
    source_hash: l === "en" ? null : hash(sourceValue),
  });
}
function sourceTargets(type, id, fields) {
  for (const [field, value] of Object.entries(fields))
    for (const l of locales)
      tr(type, id, field, l, l === "en" ? value : `${value} ${l.toUpperCase()}`, value);
}
for (const [id, i] of media.map((m, i) => [m, i])) {
  const key = `${id}/1.png`,
    target = path.join(runtime, "public/translationsretirementqa", key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  const bytes = await sharp({
    create: {
      width: 1200,
      height: 900,
      channels: 3,
      background: ["#4f6c57", "#7e6648", "#67758a"][i],
    },
  })
    .png()
    .toBuffer();
  await fs.writeFile(target, bytes);
  insert("media_asset", {
    id,
    storage: "r2",
    r2_key: key,
    mime: "image/png",
    width: 1200,
    height: 900,
    bytes: bytes.length,
  });
  sourceTargets("media_asset", id, { alt: `Legacy asset ${i}` });
}
insert("city", {
  id: ids.city,
  slug: "qa-city",
  status: "published",
  country: "PT",
  hero_media_id: media[0],
});
sourceTargets("city", ids.city, { name: "QA City", intro: "Legacy unused city intro" });
insert("city", {
  id: ids.emptyCity,
  slug: "qa-empty-city",
  status: "published",
  country: "PT",
  position: 1,
  hero_media_id: media[1],
});
sourceTargets("city", ids.emptyCity, { name: "QA Empty City" });
insert("neighbourhood", { id: ids.neighbourhood, city_id: ids.city, slug: "qa-neighbourhood" });
sourceTargets("neighbourhood", ids.neighbourhood, { name: "QA Neighbourhood" });
insert("amenity", { id: ids.amenity, slug: "qa-amenity", icon: "check" });
sourceTargets("amenity", ids.amenity, { label: "QA Amenity" });
insert("building", {
  id: ids.building,
  slug: "qa-building",
  status: "published",
  is_featured: true,
  city_id: ids.city,
  neighbourhood_id: ids.neighbourhood,
  cover_media_id: media[0],
  og_image_media_id: media[1],
  apartments_count: 1,
  total_capacity: 4,
  beds_count: 2,
});
sourceTargets("building", ids.building, {
  name: "QA Building",
  headline: "QA Building headline",
  teaser: "QA Building teaser",
  description_intro: "QA Building intro",
  meta_title: "QA Building SEO",
  meta_description: "QA Building description",
});
insert("building_media", { building_id: ids.building, media_id: media[0], position: 0 });
insert("building_amenity", { building_id: ids.building, amenity_id: ids.amenity });
insert("building_faq", { id: ids.buildingFaq, building_id: ids.building });
sourceTargets("building_faq", ids.buildingFaq, {
  question: "QA Building question",
  answer: "QA Building answer",
});
insert("apartment", {
  id: ids.apartment,
  slug: "qa-apartment",
  status: "published",
  building_id: ids.building,
  cover_media_id: media[0],
  bedrooms: 2,
  bathrooms: 1,
  max_guests: 4,
  beds_count: 2,
});
sourceTargets("apartment", ids.apartment, {
  name: "QA Apartment",
  description: "QA Apartment description",
});
insert("service_category", { id: ids.category, slug: "qa-experiences", icon: "check" });
sourceTargets("service_category", ids.category, { name: "QA Experiences" });
insert("service", {
  id: ids.service,
  slug: "qa-service",
  status: "published",
  category_id: ids.category,
  cover_media_id: media[0],
  og_image_media_id: media[1],
  price_from: 15000,
  rating_tenths: 48,
  booking_type: "external",
  cta_url: "https://example.invalid/qa-booking",
});
for (const l of locales)
  insert("service_locale_content", {
    service_id: ids.service,
    locale: l,
    published: serviceEnv[l],
    revision: 0,
    published_at: new Date().toISOString(),
  });
insert("service_shared_content", {
  service_id: ids.service,
  data: { schemaVersion: 1, content: serviceSharedContent(serviceEnv.en.content) },
  revision: 0,
});
insert("guide_page", {
  id: ids.guide,
  city_id: ids.city,
  slug: "qa-guide",
  template: "landing",
  status: "published",
  hero_media_id: media[0],
  og_image_media_id: media[1],
});
insert("guide_section", {
  id: ids.section,
  guide_page_id: ids.guide,
  layout: "with_cta",
  header_media_id: media[1],
  cta_label: "QA section CTA",
  cta_url: "https://example.invalid/guide",
});
for (const [p, i] of places.map((p, i) => [p, i]))
  insert("guide_place", {
    id: p,
    guide_section_id: ids.section,
    position: i,
    category: ["restaurant", "viewpoint", "beach"][i],
    address: `QA address ${i}`,
    media_id: media[i],
    latitude: 38.7 + i / 100,
    longitude: -9.1,
  });
for (const l of locales)
  insert("guide_locale_content", {
    guide_id: ids.guide,
    locale: l,
    published: guideEnv[l],
    revision: 0,
    published_at: new Date().toISOString(),
  });
insert("guide_shared_content", {
  guide_id: ids.guide,
  data: { schemaVersion: 1, content: guideSharedContent(guideEnv.en.content) },
  revision: 0,
});
insert("author", {
  id: ids.author,
  slug: "qa-author",
  status: "published",
  avatar_media_id: media[2],
});
sourceTargets("author", ids.author, { name: "QA Author", bio: "QA Author biography" });
insert("blog_category", { id: ids.blogCategory, slug: "qa-category", color: "#67758a" });
sourceTargets("blog_category", ids.blogCategory, { name: "QA Category" });
for (const post of [ids.post, ids.secondPost]) {
  insert("blog_post", {
    id: post,
    slug: post === ids.post ? "qa-article" : "qa-featured",
    status: "published",
    category_id: ids.blogCategory,
    author_id: ids.author,
    cover_media_id: media[0],
    og_image_media_id: media[1],
    published_at: "2026-11-01T12:00:00.000Z",
    reading_minutes: 5,
    is_featured: post === ids.secondPost,
  });
  for (const l of locales)
    insert("blog_post_locale_content", {
      post_id: post,
      locale: l,
      published: postEnv[post][l],
      revision: 0,
      published_at: new Date().toISOString(),
    });
}
insert("company_settings", {
  id: ids.settings,
  email: "qa@example.invalid",
  phone: "+351 210 000 001",
  owners_phone: "+351 210 000 002",
  checkin_phone: "+351 210 000 003",
  whatsapp: "+351 210 000 004",
  website_url: "https://example.invalid/qa",
  office_address: "QA Test Office",
  office_hours: "09:30–18:00",
  office_hours_label: "QA Office Hours",
  avantio_account_id: "bk_centralhill",
  default_og_image_media_id: media[1],
});
for (const audience of ["guest", "owner"]) {
  const id = audience === "guest" ? ids.guestTestimonial : ids.ownerTestimonial;
  insert("testimonial", {
    id,
    audience,
    author_name: `QA ${audience}`,
    author_country: "PT",
    status: "published",
    rating: 5,
  });
  sourceTargets("testimonial", id, { quote: `QA ${audience} testimonial` });
}
for (const l of locales) {
  insert("faq_group", { id: faq[l].id, key: faq[l].key });
  insert("faq_item", { id: faq[l].item, group_id: faq[l].id, status: "published" });
  tr("faq_item", faq[l].item, "question", "en", `QA ${l.toUpperCase()} FAQ question`);
  tr("faq_item", faq[l].item, "answer", "en", `QA ${l.toUpperCase()} FAQ answer`);
}
insert("faq_group", { id: ids.legacyFaq, key: "trqa-faq-legacy" });
insert("faq_item", { id: ids.legacyFaqItem, group_id: ids.legacyFaq, status: "published" });
sourceTargets("faq_item", ids.legacyFaqItem, {
  question: "Legacy FAQ question",
  answer: "Legacy FAQ answer",
});
for (const key of Object.keys(pageEnvelopes)) {
  const existing = scaffold.scaffolds.find((row) => row.key === key);
  if (existing)
    queries.push(
      sql.query(
        `with changed as(update page_content p set data=$1::jsonb,og_image_media_id=$2,updated_at=now() where p.id=$3 and p.key=$4 and md5(to_jsonb(p)::text)=$5 returning id)select 1/count(*)::int as guard from changed`,
        [JSON.stringify(pageEnvelopes[key].en.content), media[1], existing.id, key, existing.hash],
      ),
    );
  else
    insert("page_content", {
      id: pages[key],
      key,
      data: pageEnvelopes[key].en.content,
      og_image_media_id: media[1],
    });
  for (const l of locales)
    insert("page_locale_content", {
      page_key: key,
      locale: l,
      published: pageEnvelopes[key][l],
      revision: 0,
      published_at: new Date().toISOString(),
    });
}
for (const [type, id, slug] of [
  ["city", ids.city, "qa-city"],
  ["city", ids.emptyCity, "qa-empty-city"],
  ["neighbourhood", ids.neighbourhood, "qa-neighbourhood"],
  ["building", ids.building, "qa-building"],
  ["apartment", ids.apartment, "qa-apartment"],
  ["service", ids.service, "qa-service"],
  ["guide_page", ids.guide, "qa-guide"],
  ["blog_post", ids.post, "qa-article"],
  ["blog_post", ids.secondPost, "qa-featured"],
])
  for (const l of locales) insert("slug", { entity_type: type, entity_id: id, locale: l, slug });
await sql.transaction(queries);
await fs.writeFile(out + "/fixtures.json", JSON.stringify(fixture, null, 2));
const preserved = {};
for (const table of ["faq_group", "faq_item", "translation"]) {
  const [r] = await sql.query(
    `select count(*)::int as n,md5(coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text)::text,'[]'))as hash from "${table}"t where id=any($1::uuid[])`,
    [oldIds[table]],
  );
  assert.deepEqual(r, scaffold.counts[table], `Migration ${table} rows preserved`);
  preserved[table] = r;
}
await fs.writeFile(
  out + "/seed-evidence.json",
  JSON.stringify(
    {
      identity: scaffold.identity,
      statements: queries.length,
      adoptedScaffolds: scaffold.scaffolds,
      preserved,
      fixture,
    },
    null,
    2,
  ),
);
console.log(
  "Seed committed:",
  queries.length,
  "statements;4fresh scaffold CAS updates+ownfixtures; migrationFAQ/translation hashes exact",
);
