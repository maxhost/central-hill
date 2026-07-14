/**
 * Demo content seed (NOT a migration; one-off, idempotent-guarded).
 *
 * The database ships empty, so every public page `notFound()`s. This script writes a
 * coherent demo dataset — company settings, header navigation with sub-tabs, the five
 * fixed marketing pages, a Lisbon catalog (city + neighbourhoods + featured buildings)
 * and mixed testimonials — so the site renders and the client-feedback features are
 * visible. Source-locale (`en`) only; other locales fall back to it until translated.
 *
 * Page `data` is validated against each page's real Zod schema before insert, so the
 * shape can never drift from what the pages read. [T] fields (building/city names,
 * testimonial quotes, nav labels) are written through the `core/i18n` source seam;
 * slugs through the slug seam. Run:  pnpm tsx scripts/seed-demo.ts
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { translation, slug as slugTable } from "@core/i18n/schema";
import { company_settings, nav_item } from "@slices/settings/schema";
import { city, neighbourhood } from "@slices/geography/schema";
import { building } from "@slices/buildings/schema";
import { testimonial } from "@slices/testimonials/schema";
import { faq_group, faq_item } from "@slices/faq/schema";
import { page_content } from "@slices/pages/schema";
import { homeSchema } from "@slices/pages/schemas/home";
import { guestSchema } from "@slices/pages/schemas/guest";
import { ownersSchema } from "@slices/pages/schemas/owners";
import { realEstateSchema } from "@slices/pages/schemas/real-estate";
import { aboutSchema } from "@slices/pages/schemas/about";

const SITE = "https://www.centralhill.pt";
const BOOK = `${SITE}/en/rentals/holidays-rentals-rentals-d0/`;
const uid = () => randomUUID();

/** iconCard helper — `icon_key` is decorative (not rendered), any kebab key is fine. */
const ic = (title: string, description: string, icon_key = "spark") => ({ icon_key, title, description });
const ti = (title: string, description: string) => ({ title, description });

/** FAQ group content (question, answer) — bound to the Owners/Real-Estate pages by key. */
const OWNERS_FAQ: [string, string][] = [
  ["What types of properties does Central Hill Apartments manage?", "We manage all property types across Portugal, from compact studios to large 8-bedroom apartments accommodating up to 27 guests. Whether you own a single apartment or a growing portfolio, we have the right plan for you."],
  ["How does your pricing and commission work?", "We operate on a commission model — we earn when you earn. Your personalized proposal includes a full, transparent breakdown of all fees and platform commissions with no hidden costs."],
  ["Do I need to be in Portugal to work with Central Hill Apartments?", "Not at all. Many of our owners are based overseas. Our fully remote management model means you can monitor your property and receive your earnings from anywhere in the world."],
  ["How quickly can my property be listed?", "Most properties are live within 5 business days of completing onboarding. This includes professional photography, listing creation, and platform setup."],
  ["What happens if there is damage to my property?", "We conduct check-out inspections after every stay. All bookings are covered by platform guarantee schemes, and our team handles any damage claims directly on your behalf."],
  ["Can I block dates for personal use?", "Absolutely. Your property remains yours. You can block any dates through your owner dashboard at any time, with no restrictions or extra charges."],
  ["Do you handle legal and tax compliance?", "Yes. We provide guidance on Alojamento Local licensing, AIMA registration requirements, and local tax obligations specific to Portugal."],
];
const REAL_ESTATE_FAQ: [string, string][] = [
  ["What minimum scale of asset do you work with?", "We work with individual buildings through to multi-property portfolios. There is no minimum unit count for institutional partnerships, though our management fee structures are most efficient for assets with 5 or more units. We are also able to discuss portfolio-level agreements covering multiple buildings or locations."],
  ["What contract terms do you offer?", "Contract terms vary by partnership model. Fixed rent agreements typically run for 10–25 years. Management commission agreements are available from 3 years, with renewal options. Hybrid structures typically mirror fixed rent terms. All contracts include clearly defined performance review milestones and exit provisions."],
  ["How is financial reporting structured for institutional partners?", "We provide monthly financial reports in a format agreed at contract stage — including gross revenue, management fees, net owner proceeds, occupancy rates, average daily rate (ADR), and RevPAR. Partners also have real-time access to their asset's performance dashboard. Bespoke reporting formats for fund administrators and asset managers can be accommodated."],
  ["How do you handle regulatory compliance?", "Central Hill manages all Alojamento Local licensing, AIMA registration, tourist tax calculation and payment, and local regulatory requirements on behalf of our partners. We monitor regulatory developments proactively and notify partners of any material changes affecting their asset."],
  ["Can you manage assets we are currently developing or acquiring?", "Yes. We offer pre-opening consultancy services to developers and acquiring funds, including unit mix advice, interior design direction, FF&E specification, licensing pre-registration, platform setup, and full operational launch. Engaging us at the planning stage typically results in faster time-to-revenue and higher initial occupancy rates."],
  ["What performance guarantees do you offer?", "Under our fixed rent model, income is fully guaranteed regardless of occupancy. Under our management commission and hybrid models, we agree performance KPIs at contract stage and report transparently against them monthly. While market performance is inherently variable, our track record demonstrates consistent above-market outcomes across our managed portfolio."],
  ["Do you work with international partners and funds?", "Yes. A significant proportion of our institutional partners are based outside Portugal. We provide all reporting in English, accommodate different time zones for review meetings, and our legal and commercial documentation is available in English. We work with advisors and legal counsel in multiple jurisdictions."],
];

// Inline Drizzle client + write helpers. We deliberately do NOT import @core/db/client
// or @core/i18n/content-write here: those carry `import "server-only"`, which Node/tsx
// cannot resolve outside the Next bundler. The pure table schemas import fine, so we
// reconstruct the (source-locale) translation + slug upserts the seam would do.
const db = drizzle(neon(process.env.DATABASE_URL ?? ""));

type SourceFields = Record<string, string | null | undefined>;

/** Upsert source-locale ([en]) [T] field values for an entity. */
async function setSourceContent(type: string, id: string, fields: SourceFields): Promise<void> {
  const rows = Object.entries(fields)
    .map(([field, raw]) => ({ field, value: (typeof raw === "string" ? raw : "").trim() }))
    .filter((r) => r.value)
    .map((r) => ({
      entity_type: type,
      entity_id: id,
      field: r.field,
      locale: "en" as const,
      value: r.value,
      state: "draft" as const,
    }));
  if (rows.length === 0) return;
  await db
    .insert(translation)
    .values(rows)
    .onConflictDoUpdate({
      target: [translation.entity_type, translation.entity_id, translation.field, translation.locale],
      set: { value: sql`excluded.value`, updated_at: sql`now()` },
    });
}

/** Upsert per-locale slugs for an entity (skips empties; no-ops on conflict). */
async function setSlugs(type: string, id: string, byLocale: Record<string, string>): Promise<void> {
  for (const [locale, value] of Object.entries(byLocale)) {
    if (!value) continue;
    await db
      .insert(slugTable)
      .values({ entity_type: type, entity_id: id, locale: locale as "en" | "pt" | "es" | "fr", slug: value })
      .onConflictDoNothing();
  }
}

async function main() {
  if (process.env.DRY) {
    for (const p of [homeData(), ownersData(), guestData(), realEstateData(), aboutData()]) void p;
    homeSchema.parse(homeData());
    ownersSchema.parse(ownersData());
    guestSchema.parse(guestData());
    realEstateSchema.parse(realEstateData());
    aboutSchema.parse(aboutData());
    console.log("✓ DRY: imports resolved + all 5 page schemas valid (no DB writes)");
    return;
  }

  const [existing] = await db.select({ id: company_settings.id }).from(company_settings).limit(1);
  if (existing) {
    console.log("⚠️  company_settings already has a row — DB looks seeded. Aborting to avoid duplicates.");
    return;
  }

  // Validate every page against its real schema BEFORE writing anything, so a shape
  // mismatch aborts cleanly with an empty DB (never a partial seed).
  const pages: { key: "home" | "owners" | "guest" | "real_estate" | "about"; schema: { parse: (d: unknown) => unknown }; data: unknown }[] = [
    { key: "home", schema: homeSchema, data: homeData() },
    { key: "owners", schema: ownersSchema, data: ownersData() },
    { key: "guest", schema: guestSchema, data: guestData() },
    { key: "real_estate", schema: realEstateSchema, data: realEstateData() },
    { key: "about", schema: aboutSchema, data: aboutData() },
  ];
  for (const p of pages) p.schema.parse(p.data);
  console.log("✓ all 5 page schemas validated");

  // ── Company settings (singleton) ───────────────────────────────────────────
  await db.insert(company_settings).values({
    email: "info@centralhill.pt",
    phone: "+351 910 075 725",
    whatsapp: "+351 910 075 725",
    social: { instagram: "https://instagram.com/centralhill", linkedin: "https://linkedin.com/company/centralhill" },
    stats: {
      bookings: { value: "60,000+", label: "Bookings Completed" },
      years: { value: "12+", label: "Years of Experience" },
      guests: { value: "700,000+", label: "Guests Hosted" },
      revenue: { value: "€55M+", label: "Revenue Generated" },
      buildings: { value: "14", label: "Buildings" },
      apartments: { value: "180", label: "Apartments" },
    },
    office_address: "Rua Garrett 12, 1200-203 Lisbon, Portugal",
    currency: "EUR",
    avantio_account_id: "centralhill",
    avantio_widget_config: {},
    show_building_location: false,
    show_building_count: false,
  });
  console.log("✓ company_settings");

  // ── Header navigation (with hover sub-tabs, LovelyStay-style — client feedback B1) ──
  type NavSeed = { url: string; label: string; children?: { url: string; label: string }[] };
  const header: NavSeed[] = [
    { url: "/owners", label: "Owners", children: [
      { url: "/owners#plans", label: "Management Plans" },
      { url: "/owners#estimate", label: "Profitability Study" },
    ] },
    { url: "/buildings", label: "Buildings" },
    { url: "/real-estate", label: "Real Estate" },
    { url: "/guests", label: "Guests", children: [
      { url: "/services", label: "Services" },
      { url: "/guides", label: "What to Do" },
    ] },
    { url: "/about", label: "About Us" },
    { url: "/blog", label: "Blog" },
  ];
  let pos = 0;
  for (const item of header) {
    const [row] = await db.insert(nav_item).values({ location: "header", position: pos++, url: item.url }).returning({ id: nav_item.id });
    await setSourceContent("nav_item", row!.id, { label: item.label });
    let cpos = 0;
    for (const child of item.children ?? []) {
      const [crow] = await db.insert(nav_item).values({ location: "header", parent_id: row!.id, position: cpos++, url: child.url }).returning({ id: nav_item.id });
      await setSourceContent("nav_item", crow!.id, { label: child.label });
    }
  }
  console.log("✓ header navigation (+ sub-tabs)");

  // ── Geography: Lisbon + neighbourhoods ──────────────────────────────────────
  const [lisbon] = await db.insert(city).values({ slug: "lisbon", status: "published", country: "PT", position: 0 }).returning({ id: city.id });
  await setSourceContent("city", lisbon!.id, { name: "Lisbon", intro: "Portugal's capital — historic, sunlit and endlessly walkable." });
  await setSlugs("city", lisbon!.id, { en: "lisbon", pt: "lisboa", es: "lisboa", fr: "lisbonne" });

  const nbhoods: Record<string, string> = {};
  for (const [i, n] of [["Chiado", "chiado"], ["Bairro Alto", "bairro-alto"], ["Baixa", "baixa"]].entries()) {
    const [row] = await db.insert(neighbourhood).values({ city_id: lisbon!.id, slug: n[1]!, position: i }).returning({ id: neighbourhood.id });
    await setSourceContent("neighbourhood", row!.id, { name: n[0]! });
    await setSlugs("neighbourhood", row!.id, { en: n[1]!, pt: n[1]!, es: n[1]!, fr: n[1]! });
    nbhoods[n[1]!] = row!.id;
  }
  console.log("✓ geography (Lisbon + 3 neighbourhoods)");

  // ── Buildings (the 6 featured properties from the brief) ────────────────────
  const buildings: { name: string; slug: string; nb: string; street: string; aps: number; cap: number; beds: number; avantio: string }[] = [
    { name: "Bairro Alto View 4E", slug: "bairro-alto-view-4e", nb: "bairro-alto", street: "Rua da Atalaia 4", aps: 6, cap: 25, beds: 12, avantio: `${SITE}/en/rentals/apartment-lisbon-new-bairro-alto-view-4e-up-to-25guests-by-central-hill-242910.html` },
    { name: "Big Chiado Terrace", slug: "big-chiado-terrace", nb: "chiado", street: "Rua Garrett 22", aps: 5, cap: 22, beds: 11, avantio: `${SITE}/en/rentals/apartment-lisbon-big-chiado-terrace-up-to-22-guests-by-central-hill-245142.html` },
    { name: "Big Bairro Alto 2D", slug: "big-bairro-alto-2d", nb: "bairro-alto", street: "Rua do Norte 2", aps: 6, cap: 25, beds: 12, avantio: `${SITE}/en/rentals/apartment-lisbon-big-bairro-alto-2d-up-to-25-guests-by-central-hill-244056.html` },
    { name: "Large Central with View 3E", slug: "large-central-with-view-3e", nb: "baixa", street: "Rua Augusta 3", aps: 5, cap: 20, beds: 10, avantio: `${SITE}/en/rentals/apartment-lisbon-large-central-with-view-3e-by-central-hill-244171.html` },
    { name: "Bairro Alto View 3E", slug: "bairro-alto-view-3e", nb: "bairro-alto", street: "Rua da Atalaia 3", aps: 5, cap: 21, beds: 10, avantio: `${SITE}/en/rentals/apartment-lisbon-new-bairro-alto-view-3e-up-to-21guests-by-central-hill-244190.html` },
    { name: "Big Bairro Alto 2E", slug: "big-bairro-alto-2e", nb: "bairro-alto", street: "Rua do Norte 2E", aps: 7, cap: 27, beds: 13, avantio: `${SITE}/en/rentals/apartment-lisbon-big-bairro-alto-2e-up-to-27-guests-by-central-hill-244061.html` },
  ];
  for (const [i, b] of buildings.entries()) {
    const [row] = await db.insert(building).values({
      slug: b.slug, status: "published", position: i, is_new: i < 2, is_featured: true,
      city_id: lisbon!.id, neighbourhood_id: nbhoods[b.nb]!, street_address: b.street,
      apartments_count: b.aps, total_capacity: b.cap, beds_count: b.beds,
      avantio_url: b.avantio,
    }).returning({ id: building.id });
    await setSourceContent("building", row!.id, {
      name: b.name,
      headline: `${b.name} — up to ${b.cap} guests in central Lisbon`,
      teaser: `A spacious, design-led group apartment in ${b.nb.replace(/-/g, " ")}, sleeping up to ${b.cap} guests across ${b.aps} units — fully managed by Central Hill.`,
      description_intro: `${b.name} sits in the heart of Lisbon, steps from the city's best dining, nightlife and views. Professionally managed end-to-end by Central Hill.`,
    });
    await setSlugs("building", row!.id, { en: b.slug, pt: b.slug, es: b.slug, fr: b.slug });
  }
  console.log(`✓ ${buildings.length} featured buildings`);

  // ── Testimonials (mixed, with countries for the flag carousel) ──────────────
  const tms: { audience: "owner" | "guest"; rating: number; name: string; country: string; loc: string; quote: string }[] = [
    { audience: "guest", rating: 5, name: "Sophie M.", country: "France", loc: "Chiado, Lisbon", quote: "Flawless stay — the apartment was exactly as pictured and the team answered within minutes. We'll be back." },
    { audience: "owner", rating: 5, name: "João P.", country: "Portugal", loc: "Bairro Alto, Lisbon", quote: "Central Hill turned my apartment into a genuinely passive, high-performing asset. Transparent reporting every month." },
    { audience: "guest", rating: 5, name: "Mark T.", country: "United Kingdom", loc: "Baixa, Lisbon", quote: "Best group trip we've done. Huge, immaculate space and a location you couldn't beat." },
    { audience: "owner", rating: 5, name: "Andrea R.", country: "Italy", loc: "Chiado, Lisbon", quote: "Revenue up over 30% versus my previous manager, with zero hassle on my side. Highly recommend." },
    { audience: "guest", rating: 4, name: "Lena S.", country: "Germany", loc: "Bairro Alto, Lisbon", quote: "Beautiful design, spotless, and check-in was effortless. A real home from home in Lisbon." },
    { audience: "guest", rating: 5, name: "Carlos D.", country: "Spain", loc: "Baixa, Lisbon", quote: "Impecable. La ubicación es perfecta y el equipo súper atento. Repetiremos sin duda." },
    { audience: "owner", rating: 5, name: "Patricia L.", country: "Brazil", loc: "Bairro Alto, Lisbon", quote: "Profissionalismo do início ao fim. Acompanho tudo pelo dashboard e os resultados falam por si." },
    { audience: "guest", rating: 5, name: "Emily K.", country: "United States", loc: "Chiado, Lisbon", quote: "Stunning apartment with an incredible terrace. The whole experience felt premium yet personal." },
  ];
  for (const [i, t] of tms.entries()) {
    const [row] = await db.insert(testimonial).values({
      audience: t.audience, rating: t.rating, author_name: t.name, author_country: t.country,
      property_location: t.loc, position: i, status: "published",
    }).returning({ id: testimonial.id });
    await setSourceContent("testimonial", row!.id, { quote: t.quote });
  }
  console.log(`✓ ${tms.length} testimonials`);

  // ── FAQ groups (selectable per page via `faq_group_key`) ────────────────────
  for (const [pos, [key, items]] of [
    ["owners", OWNERS_FAQ],
    ["real_estate", REAL_ESTATE_FAQ],
  ].entries() as IterableIterator<[number, [string, [string, string][]]]>) {
    const [grow] = await db.insert(faq_group).values({ key, position: pos }).returning({ id: faq_group.id });
    for (const [i, [question, answer]] of items.entries()) {
      const [irow] = await db
        .insert(faq_item)
        .values({ group_id: grow!.id, position: i, status: "published" })
        .returning({ id: faq_item.id });
      await setSourceContent("faq_item", irow!.id, { question, answer });
    }
    console.log(`✓ faq_group: ${key} (${items.length})`);
  }

  // ── Page content (5 fixed pages) — already validated above ──────────────────
  for (const p of pages) {
    await db.insert(page_content).values({ key: p.key, data: p.data as Record<string, unknown> });
    console.log(`✓ page_content: ${p.key}`);
  }

  console.log("\n✅ Demo seed complete. Run `pnpm dev` (live DB reads) or rebuild to see it.");
}

// ── Page data builders ─────────────────────────────────────────────────────────
function homeData() {
  return {
    hero: {
      video_media_id: uid(),
      headline: "Premium furnished apartments across Portugal",
      subtitle: "Design-led, professionally managed homes in Lisbon's most sought-after streets — for unforgettable stays and effortless ownership.",
      cta_primary: { label: "Book Now", url: BOOK },
      cta_secondary: { label: "I'm a property owner", url: `${SITE}/en/owners` },
    },
    owners_pitch: {
      headline: "Own a property in Portugal? Earn more, do nothing.",
      subheadline: "Full-service management that maximises your returns with AI-driven pricing and unmatched local expertise.",
      benefits: [
        ic("Maximised revenue", "Dynamic, AI-driven pricing keeps your calendar full at the best nightly rate.", "chart"),
        ic("Fully managed", "Guests, cleaning, maintenance and compliance — all handled end to end.", "check"),
        ic("Total transparency", "Track bookings, payouts and performance in real time from any device.", "search"),
        ic("Five-star care", "Hotel-grade hospitality protects your asset and your reviews.", "trophy"),
        ic("Local expertise", "A Lisbon team on the ground, available around the clock.", "map-pin"),
        ic("No lock-in", "Flexible plans that grow with you — cancel anytime.", "tag"),
      ],
      cta_primary: { label: "I'm a property owner", url: `${SITE}/en/owners`, note: "Free, no obligation — reply within 48h." },
      cta_secondary: { label: "See our plans", url: `${SITE}/en/owners` },
    },
    guests_pitch: {
      headline: "Planning a stay? Find your perfect apartment.",
      subheadline: "Spacious, beautifully designed homes for couples, families and groups — in the heart of the city.",
      benefits: [
        ic("Prime locations", "Steps from Lisbon's best dining, nightlife and landmarks.", "map-pin"),
        ic("Space for everyone", "From studios to apartments sleeping 25+ for big groups.", "home"),
        ic("Design-led interiors", "Every home styled for comfort and that wow factor.", "spark"),
        ic("Seamless check-in", "Effortless arrival and a local team a message away.", "key"),
      ],
      image_media_id: "",
      cta: { label: "Book Now", url: BOOK, note: "Best-rate guarantee when you book direct." },
    },
    dual_cta: {
      owner: {
        image_media_id: "",
        eyebrow: "Owners",
        title: "Own a property? Start earning more — free, no obligation.",
        body: "Find out what your property could earn with a free, no-obligation profitability analysis. Our team will assess your property and come back within 48 hours.",
        cta_label: "I'm a property owner",
      },
      guest: {
        image_media_id: "",
        eyebrow: "Guests",
        title: "Planning a stay? Find your perfect apartment.",
        body: "Browse our full portfolio of professionally managed apartments across Portugal's most sought-after locations — studios to 8-bedrooms, for every type of stay.",
        cta_label: "Book Now",
      },
    },
  };
}

function ownersData() {
  const tier = (name: string, commission: string, tag: string, features: string[], is_popular = false) => ({ name, tag, commission, is_popular, features });
  return {
    hero: {
      image_media_id: uid(),
      headline: "Your property, our expertise, maximum returns",
      copy: "Central Hill turns your property into a high-performing asset — fully managed, transparent, and optimised for maximum profit using AI-driven pricing and unmatched local expertise.",
    },
    earnings_form: {
      badge: "Earn +25%",
      headline: "Get your free profitability study",
      subheadline: "Find out what your property could earn. Our team responds within 48 hours.",
      cta_label: "Request my study",
      note: "Free and with no obligation.",
    },
    stats: [
      { to: "400000", suffix: "+", group: true, label: "Bookings Completed" },
      { to: "12", suffix: "+", group: false, label: "Years of Experience" },
      { to: "55", prefix: "€", suffix: "M+", group: false, label: "Revenue Generated" },
      { to: "5", suffix: "M+", group: false, label: "Guests Hosted" },
    ],
    why: {
      headline: "Why property owners trust Central Hill Apartments",
      subheadline: "We turn your property into a high-performing asset — fully managed, transparent, and optimised for maximum returns.",
      benefits: [
        ic("AI-powered pricing", "Our dynamic pricing engine analyses market data in real time, adjusting your rates daily for maximum occupancy at the best possible price.", "chart"),
        ic("Profit-first management", "Every decision is guided by one goal: maximising your returns — from listing optimisation to upsell strategies, we leave no revenue on the table.", "trophy"),
        ic("24/7 owner dashboard", "Monitor your property's performance in real time — bookings, revenue, occupancy and guest reviews — from anywhere in the world.", "bell"),
        ic("Dedicated account manager", "A named point of contact who knows your property personally. No call centres, no uncertainty — just reliable, expert support.", "user"),
        ic("Deep local expertise", "We operate on the ground in Portugal, with an unmatched understanding of seasonal trends, regulations and the best channels for your property.", "map-pin"),
        ic("Full transparency", "Detailed monthly reports, real-time dashboards and complete financial visibility. You stay in control, even when we handle everything.", "search"),
      ],
      cta_primary: { label: "Get your free estimate", url: `${SITE}/en/owners`, note: "Free, no obligation — reply within 48h." },
      cta_secondary: { label: "Talk to us", url: `${SITE}/en/owners` },
    },
    services: {
      headline: "Everything handled. Nothing overlooked.",
      subheadline: "From the first listing to each guest's departure, we manage every detail so you don't have to.",
      benefits: [
        ic("Listing & marketing", "Professional photography, copy and multi-channel distribution across Airbnb, Booking.com and direct.", "search"),
        ic("Reservations & guest care", "24/7 multilingual communication, calendar and seamless check-in/out — every stay runs smoothly.", "bell"),
        ic("Housekeeping & maintenance", "Hotel-standard cleaning, premium linen and proactive upkeep keep your home guest-ready.", "spark"),
        ic("Revenue & compliance", "AI-driven pricing, monthly reporting and full Alojamento Local licensing & tax support.", "chart"),
      ],
      image_media_id: "",
      cta: { label: "See how we manage your home", url: `${SITE}/en/owners`, note: "Fully managed, end to end — you stay informed, we do the work." },
    },
    plans: {
      headline: "A management plan built around your goals",
      subheadline: "Cumulative plans — each tier adds to the one before it. Names are ours; the structure mirrors the best in the market.",
      tiers: [
        tier("Core", "15%", "The essentials, done brilliantly", ["Listing creation & optimisation", "Multi-channel distribution", "Dynamic pricing", "Guest communication", "Secure payment handling"]),
        tier("Prime", "18%", "Everything automated", ["Professional photography", "Premium listing placement", "Review management", "Smart check-in support"], true),
        tier("Manage", "22%", "Full operations", ["Housekeeping & linen", "Maintenance coordination", "Restocking of essentials", "On-the-ground support"]),
        tier("Complete", "25%", "White-glove, end to end", ["Dedicated account manager", "Interior styling advice", "Licensing & compliance", "Priority everything"]),
      ],
      helpers: [
        { title: "Not sure which plan fits?", copy: "Tell us about your property and goals — we'll recommend the right tier and show projected returns.", cta: { label: "Get your profitability study", url: `${SITE}/en/owners` } },
      ],
    },
    journey: {
      headline: "Your growth path",
      subheadline: "From first call to full performance in five steps.",
      steps: [
        ti("Profitability study", "We assess your property and project its earning potential — free."),
        ti("Onboarding", "Photography, listing and pricing set up across all channels."),
        ti("Go live", "Your home goes to market and starts taking bookings."),
        ti("Operate", "We run day-to-day hosting end to end."),
        ti("Optimise", "We refine pricing and service to keep growing your returns."),
      ],
    },
    dashboard: {
      headline: "Your property, always in sight",
      subheadline: "Our owner dashboard gives you real-time visibility into every aspect of your property's performance — from anywhere in the world.",
      benefits: [
        ic("Live revenue tracking", "Your earnings and projected monthly income at a glance, updated in real time.", "chart"),
        ic("Booking calendar", "Full visibility of reservations, blocked dates and availability across all platforms.", "bell"),
        ic("Occupancy & performance", "Track occupancy rates, average nightly rate and review scores over any period.", "search"),
        ic("Alerts & statements", "Instant alerts for bookings and check-ins, plus downloadable monthly statements anytime.", "key"),
      ],
      image_media_id: "",
      cta: { label: "Explore the owner dashboard", url: `${SITE}/en/owners`, note: "Real-time visibility into your property, 24/7." },
    },
    faq_group_key: "owners",
  };
}

function guestData() {
  return {
    hero: {
      video_media_id: uid(),
      eyebrow: "For guests",
      headline: "Your home in the heart of Lisbon",
      subheadline: "Spacious, design-led apartments for couples, families and groups — book direct for the best rate.",
      cta: { label: "Book Now", url: BOOK },
    },
    welcome: {
      headline: "Stay like a local, hosted like a guest",
      lede: "Beautifully designed apartments in Lisbon's best neighbourhoods, with the comfort of a home and the care of a hotel.",
      copy: "Every Central Hill apartment is styled for comfort, professionally cleaned and backed by a local team available around the clock.\n\nFrom intimate studios to homes that sleep large groups, we have the perfect base for your trip.",
      guarantee_label: "Best-rate guarantee when you book direct",
      image_media_id: uid(),
    },
    why: {
      headline: "Why book directly with us",
      intro: "More space, better rates and a team that actually answers.",
      benefits: [
        ic("Best rates", "Book direct and skip the platform mark-ups."),
        ic("Prime locations", "Steps from the sights, dining and nightlife."),
        ic("Real support", "A local team a message away, 24/7."),
        ic("Spotless homes", "Professionally cleaned and checked before every stay."),
      ],
      cta: { label: "Browse apartments", url: BOOK, note: "Secure checkout via our booking engine." },
    },
    services_teaser: {
      headline: "Make your stay effortless",
      intro: "Add the extras that turn a trip into an experience.",
      items: [
        ic("Airport transfers", "Private, door-to-door arrivals and departures."),
        ic("Private chef", "A chef-prepared meal in your apartment."),
        ic("Guided tours", "Sintra, Fátima and the best of the region."),
        ic("Boat trips", "See Lisbon from the Tagus."),
        ic("Surf experiences", "Lessons on the coast's best breaks."),
        ic("Luggage storage", "Hands-free before check-in and after check-out."),
      ],
      cta: { label: "Explore services", url: `${SITE}/en/services`, note: "" },
    },
    activities_teaser: {
      headline: "The best of Lisbon",
      intro: "Curated guides to help you make the most of the city.",
      items: [
        ic("Things to do", "Landmarks, viewpoints and hidden corners."),
        ic("Where to eat", "From tascas to fine dining."),
        ic("Beaches near Lisbon", "Sand and surf within easy reach."),
        ic("Events & festivals", "What's on while you're in town."),
        ic("Secrets of Lisbon", "Local favourites off the tourist trail."),
        ic("For families", "Kid-friendly plans for every age."),
      ],
      cta: { label: "Read the guides", url: `${SITE}/en/guides` },
    },
  };
}

function realEstateData() {
  // Real Estate is mostly a static marketing page; the hero, the "partners" section
  // ("Built for Institutional Partners" — Editorial Split), the "market" Why-Portugal bento,
  // and the FAQ group are schema-driven.
  return {
    hero: {
      image_media_id: uid(),
      headline: "Real estate, managed for performance",
      subheadline: "Real Estate Partnerships",
      positioning: "Central Hill manages and operates furnished-rental portfolios across Portugal's most in-demand locations — combining hotel-grade operations with data-driven revenue management.",
      cta_primary: { label: "Discuss a Partnership", url: `${SITE}/en/real-estate` },
      cta_secondary: { label: "Download Our Capability Statement", url: `${SITE}/en/real-estate` },
    },
    partners: {
      headline: "Built for Institutional Partners",
      subheadline:
        "Central Hill Apartments works with organisations that think at scale — investment funds, developers, large operators, and corporates seeking managed accommodation. We bring the operational depth, deal flexibility, and market knowledge to meet your requirements.",
      benefits: [
        ic(
          "Investment Funds & Asset Managers",
          "Reliable, data-driven hospitality management for residential and mixed-use assets. Reporting infrastructure, performance dashboards, and flexible deal structures built for institutional governance.",
          "bank",
        ),
        ic(
          "Real Estate Developers",
          "From pre-opening strategy to full operational management. We advise on unit mix, yield optimisation, and guest experience from the planning stage through to stabilised operation.",
          "ruler-combine",
        ),
        ic(
          "Large-Scale Property Operators",
          "Consolidate multiple properties under a single high-performance partner. Our technology and operating model scale across any portfolio size with no loss of quality or control.",
          "city",
        ),
        ic(
          "Corporate & Relocation Clients",
          "Managed accommodation for relocating employees and international organisations. Consistent standards, direct billing, and dedicated account management for a seamless experience.",
          "airplane",
        ),
      ],
      cta_primary: {
        label: "Discuss a Partnership",
        url: `${SITE}/en/real-estate`,
        note: "A senior member of our institutional team responds within 24 hours.",
      },
      cta_secondary: { label: "Explore deal structures", url: `${SITE}/en/real-estate` },
    },
    capabilities: {
      headline: "Institutional-Grade Management, End to End",
      subheadline:
        "We operate at the intersection of hospitality excellence and real estate performance. Our capabilities cover every dimension of asset management — from technology and distribution to operations and strategic partnership.",
      benefits: [
        ic(
          "Digital Excellence",
          "Multi-platform distribution across Airbnb, Booking.com, and direct channels. AI-powered dynamic pricing updated daily. Automated financial reporting, occupancy analytics, and a real-time performance dashboard accessible by asset managers and fund controllers.",
          "stats-up-square",
        ),
        ic(
          "Operational Mastery",
          "Professional housekeeping and linen services. 24/7 guest concierge. Premium amenities and quality assurance protocols. Regular property inspections. Rapid-response maintenance with preventive asset protection built into every management contract.",
          "settings",
        ),
        ic(
          "Strategic Partnership",
          "Project design consultancy at the planning stage. Dedicated account management throughout the contract term. Performance benchmarking against market comparables. Proactive recommendations for yield improvement and capital expenditure prioritisation.",
          "peace-hand",
        ),
      ],
      image_media_id: uid(),
      cta: {
        label: "Discuss a Partnership",
        url: `${SITE}/en/real-estate`,
        note: "End-to-end management — technology, operations, and partnership under one roof.",
      },
    },
    asset_management: {
      headline: "A Management Partner for Every Asset Type",
      subheadline:
        "From individual apartments to full buildings, boutique hotels, and corporate housing programmes — our operational model adapts to the asset, not the other way around.",
      benefits: [
        ic(
          "Residential Apartments",
          "Individual units and full buildings as short, mid, or long-term rentals — studios to 8-bedrooms across Portugal's prime locations.",
          "home",
        ),
        ic(
          "Hotels & Boutique Hotels",
          "Full operational management of hotel assets — front-of-house, guest experience, revenue management, and distribution at any scale.",
          "building",
        ),
        ic(
          "Apart-Hotels & Mixed-Use",
          "Hotel services blended with apartment-style living — flexible, high-yield products between residential and hotel categories.",
          "city",
        ),
        ic(
          "Corporate Housing",
          "Fully serviced apartments for corporate clients and relocating executives, with flexible terms from 30 days and direct invoicing.",
          "community",
        ),
        ic(
          "Development Consultancy",
          "Pre-opening services for developers — unit mix, interior direction, FF&E, licensing, platform registration, and operational launch.",
          "design-pencil",
        ),
        ic(
          "Portfolio Management",
          "Multi-building, multi-city portfolio management — consolidated reporting, standard operating procedures, and economies of scale.",
          "reports",
        ),
      ],
      image_media_id: uid(),
      cta: {
        label: "Discuss your asset",
        url: `${SITE}/en/real-estate`,
        note: "Our model adapts to the asset — not the other way around.",
      },
    },
    deal_structures: {
      headline: "Deal Structures Built Around Your Risk Profile",
      subheadline:
        "We offer three core partnership models designed to align with different investment strategies, risk appetites, and return expectations. All models include full management, technology access, and institutional reporting.",
      models: [
        {
          name: "Fixed Rent",
          tagline: "Guaranteed income, maximum certainty",
          featured: false,
          feature_label: "",
          points: [
            "Guaranteed monthly rent regardless of occupancy",
            "Contract terms: 10–25 years",
            "Zero revenue variability — full income certainty",
            "Ideal for funds requiring predictable cash flows",
            "Asset maintenance obligations shared",
            "Annual rent review mechanism",
            "Full operational management by Central Hill",
          ],
        },
        {
          name: "Management Commission",
          tagline: "Maximum upside, pure performance",
          featured: true,
          feature_label: "Most Flexible",
          points: [
            "Revenue-based model: total receipts minus management fee",
            "Contract terms: 3–25 years",
            "Owner captures full revenue upside",
            "Transparent monthly reporting and payouts",
            "Ideal for operators seeking market-rate returns",
            "Performance KPIs agreed at contract stage",
            "Full operational management by Central Hill",
          ],
        },
        {
          name: "Hybrid Model",
          tagline: "Balanced risk and reward",
          featured: false,
          feature_label: "",
          points: [
            "Guaranteed base rent plus revenue share above threshold",
            "Contract terms: 10–25 years",
            "Downside protection with upside participation",
            "Ideal for funds seeking blended return profiles",
            "Revenue share trigger agreed at contract stage",
            "Regular performance review meetings",
            "Full operational management by Central Hill",
          ],
        },
      ],
      note: "All partnership models are subject to individual asset assessment and negotiation. Contract structures, commission rates, and performance targets are agreed on a case-by-case basis.",
    },
    market: {
      headline: "Portugal: One of Europe's Strongest Hospitality Markets",
      subheadline:
        "Portugal consistently ranks among Europe's top-performing short-term rental markets, combining exceptional tourism growth, favourable regulation, strong international demand, and some of the continent's highest yields on residential real estate.",
      stats: [
        { value: "30M+", label: "Tourists welcomed in 2024" },
        { value: "20–40%", label: "Yield premium vs. long-term letting" },
        { value: "75%+", label: "Occupancy in managed properties" },
      ],
      fundamentals: {
        title: "Market Fundamentals",
        body: [
          "Lisbon and Porto rank among the most visited cities in Southern Europe, with international arrivals growing year-on-year — driven by leisure, remote working, and corporate relocation demand.",
          "Short-term rental yields in prime locations consistently outperform traditional residential letting, sustaining some of the highest returns on residential real estate in Western Europe.",
        ],
      },
      regulatory: {
        title: "Regulatory Environment",
        body: "Portugal's Alojamento Local framework provides a clear, stable regulatory structure for short-term rental operations. Central Hill's compliance team manages all licensing, tax registration, and reporting obligations on behalf of our partners.",
      },
      thesis: {
        title: "Investment Thesis",
        points: [
          "Strong, year-round tourism demand",
          "Rising corporate relocation and mid-term demand",
          "Prime yields 20–40% above long-term letting",
          "Stable regulatory framework with a clear compliance path",
          "Undersupply of institutional-grade managed stock",
          "Lisbon positioned as a tier-1 European destination",
        ],
      },
    },
    track_record: {
      headline: "Performance You Can Measure",
      subheadline:
        "Our track record is built on consistent, data-driven results across a growing portfolio of managed assets. We report transparently, benchmark rigorously, and continuously optimise performance for every asset under management.",
      tiles: [
        { value: "85%+", label: "Average Occupancy", caption: "Across all managed properties year-round" },
        { value: "+25%", label: "Revenue Premium", caption: "Vs. traditional residential letting" },
        { value: "24/7", label: "Operational Coverage", caption: "Guest support, reporting, and management" },
        { value: "10+", label: "Years of Experience", caption: "Managing assets in Portugal's prime markets" },
        { value: "14+", label: "Buildings Managed", caption: "Across Lisbon's most in-demand locations" },
        { value: "100%", label: "Transparent Reporting", caption: "Real-time dashboard access for all partners" },
      ],
    },
    process: {
      headline: "A Structured Path from First Conversation to Full Performance",
      subheadline:
        "Our onboarding process is designed for institutional partners. Every step is documented, timeline-driven, and managed by a dedicated account team.",
      cta: { label: "Start the Conversation" },
      steps: [
        {
          title: "Asset Assessment & Commercial Proposal",
          description:
            "We conduct a detailed assessment of your asset — location, unit mix, current performance, and market positioning — and present a tailored commercial proposal including projected yield, recommended partnership model, and contract terms.",
        },
        {
          title: "Due Diligence & Contract Negotiation",
          description:
            "Our legal and commercial team works with your advisors to structure and finalise the management agreement. All performance KPIs, reporting cadence, revenue share triggers, and exit terms are agreed and documented.",
        },
        {
          title: "Operational Onboarding",
          description:
            "We handle all elements of the operational setup: professional photography, platform registration and listing creation, pricing strategy implementation, staff assignment, and property preparation — typically completed within 10–15 business days.",
        },
        {
          title: "Asset Goes Live",
          description:
            "Your property launches across all distribution channels simultaneously. AI-powered pricing begins optimising daily rates from day one. Your account manager is active and reporting from the first booking.",
        },
        {
          title: "Ongoing Management & Reporting",
          description:
            "Monthly performance reports delivered to your agreed format. Quarterly review meetings with your account manager. Continuous yield optimisation and strategic recommendations as market conditions evolve.",
        },
      ],
    },
    faq_group_key: "real_estate",
  };
}

function aboutData() {
  const dep = (name: string, description: string) => ({ icon_key: "spark", name, description });
  const cert = (title: string, issuer: string, description: string) => ({ icon_key: "spark", title, issuer, description });
  return {
    hero: {
      image_media_id: uid(),
      eyebrow: "About us",
      headline: "Portugal's trusted hospitality management company",
      mission: "We help owners earn more and guests feel at home — pairing hotel-grade hospitality with technology and a hands-on local team.",
    },
    story: {
      eyebrow: "Our story",
      headline: "Twelve years of Lisbon hospitality",
      narrative: [
        "Central Hill began in 2012 with a single apartment and a simple belief: furnished rentals could be run to a hotel standard.",
        "Today we host hundreds of thousands of guests and manage homes for owners across Portugal's most sought-after locations.",
        "Our edge is the blend of people and technology — a local team that cares, backed by data that drives results.",
      ],
    },
    serve: {
      headline: "Who we serve",
      intro: "Two audiences, one standard of care.",
      audiences: [
        ic("Guests", "Memorable, design-led stays with real local support."),
        ic("Owners", "Hands-off management that maximises returns."),
        ic("Partners", "Investment-grade operations at scale."),
      ],
    },
    values: {
      headline: "What we stand for",
      intro: "The principles behind every decision.",
      items: [
        ti("Hospitality first", "We treat every guest like a guest in our own home."),
        ti("Transparency", "Clear reporting and honest communication, always."),
        ti("Excellence", "Hotel-grade standards in everything we do."),
        ti("Partnership", "We win when our owners and partners win."),
      ],
    },
    organisation: {
      eyebrow: "Our team",
      headline: "The people behind Central Hill",
      intro: "Specialist teams working as one.",
      departments: [
        dep("Guest experience", "24/7 multilingual support across the journey."),
        dep("Revenue management", "Pricing and distribution that maximise yield."),
        dep("Operations", "Housekeeping, maintenance and quality."),
        dep("Owner relations", "Reporting, advice and partnership."),
        dep("Marketing", "Photography, content and direct demand."),
        dep("Compliance", "Licensing, tax and regulation."),
      ],
    },
    certifications: {
      headline: "Independently verified",
      intro: "Recognised by the bodies that set the standard.",
      items: [
        cert("Registered operator", "Turismo de Portugal", "Licensed and compliant short-stay operation."),
        cert("ALEP member", "ALEP", "Member of Portugal's local-accommodation association."),
        cert("Quality assured", "Central Hill", "Rigorous internal quality and safety checks."),
      ],
    },
    community: {
      eyebrow: "Our community",
      headline: "Rooted in Lisbon",
      copy: [
        "We work with local makers, guides and suppliers to give guests an authentic taste of the city.",
        "Being a good neighbour matters — we operate responsibly and invest in the communities we host in.",
      ],
      image_media_id: uid(),
    },
    contact: {
      headline: "Get in touch",
      cta_guests: { label: "Book a stay", url: BOOK },
      cta_owners: { label: "I'm a property owner", url: `${SITE}/en/owners` },
      cta_partners: { label: "Partner with us", url: `${SITE}/en/real-estate` },
      form: { headline: "Send us a message", subheadline: "We'll get back to you shortly." },
    },
  };
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  });
