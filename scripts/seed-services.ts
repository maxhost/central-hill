/**
 * Guest-services demo catalogue (NOT a migration; idempotent, re-runnable).
 *
 * The `services` catalogue ships empty, so the home services carousel (ADR 0032) and the
 * `/services/<slug>` detail pages have nothing to render. This script writes a coherent
 * example set — 3 categories, 10 published services — with **real cover photos**: each
 * Unsplash original is pushed through the production media pipeline (presign → PUT to R2 →
 * finalize, ADR 0018/0025), so the rows carry true dimensions and a blurhash exactly like a
 * backoffice upload. Nothing is hot-linked.
 *
 * Writes go through the same seams the admin actions use — `core/i18n` for source [T] text
 * and slugs (ADR 0019), `core/media` for ingest — so this cannot drift from the real write
 * path. Source locale (`en`) only; other locales fall back to it until translated.
 *
 * The first seven services carry the real centralhill.pt detail copy — the `detail` [T]
 * JSON (variable module: itinerary, options, pricing, extras, partners) plus a gallery
 * (Unsplash/Wikimedia, uploaded the same way and reused by `media_asset.credit`). Every
 * service also gets the fixed-skeleton copy from `SKELETON` (`mock/service-detail.html`).
 *
 * **Idempotent by slug.** A category or service whose slug already exists is updated in
 * place, and its cover is only re-fetched when the seed names a *different* photo than the
 * one on the row (tracked through `media_asset.credit`) — a re-run with no photo change
 * uploads nothing. When a photo does change, the superseded asset is deleted from R2 and
 * the library, so repeated runs never leave orphans. Covers a person uploaded are left alone.
 *
 * ISR is not busted here (no Next runtime in a script): the carousel picks the new rows up
 * on the next revalidation, or immediately after any save in /admin/services.
 *
 *   pnpm tsx --tsconfig scripts/tsconfig.json scripts/seed-services.ts
 *   DRY=1 pnpm tsx --tsconfig scripts/tsconfig.json scripts/seed-services.ts   # report only
 */
import "dotenv/config";
import { asc, eq } from "drizzle-orm";
import { db } from "@core/db/client";
import { deleteContent, setSlugs, setSourceContent } from "@core/i18n/content-write";
import { media_asset } from "@core/media/schema";
import { deleteMedia, finalizeUpload, presignUpload } from "@core/media/server/ingest";
import { SERVICE, SERVICE_CATEGORY } from "@slices/services/contract";
import { isEmptyDetail, serviceDetailContent } from "@slices/services/detail";
import { service, service_category, service_media } from "@slices/services/schema";

/** Portrait crop — the carousel card is 3:4, and the detail hero re-crops from the same master. */
const PHOTO = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&h=1600&q=75&fm=jpg`;

/**
 * Stamped on every asset this script uploads. It is also how a re-run knows whether the
 * cover on disk is still the photo the seed asks for: change a `photo` id below and the
 * next run replaces that cover (old R2 object and row deleted) instead of keeping the
 * stale one. Assets uploaded by staff have a different credit (or none) and are never
 * touched.
 */
const CREDIT = (photoId: string) => `Unsplash · photo-${photoId}`;

/** Landscape gallery sources (4:3 tiles on the detail page). */
const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=75&fm=jpg`;
const wikimedia = (file: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1600`;

/** Credits this script stamps — the only assets it may reuse or delete. */
const SEED_CREDIT = /^(Unsplash · photo-|Wikimedia Commons · )/;

/** Wikimedia rejects requests without a descriptive User-Agent. */
const FETCH_HEADERS = { "user-agent": "CentralHillSeed/1.0 (services demo catalogue)" };

interface GallerySeed {
  url: string;
  /** Stamped on `media_asset.credit`; a re-run reuses the asset carrying it. */
  credit: string;
  alt: string;
}

interface CategorySeed {
  slug: string;
  /** Iconoir key used by the services listing (free text, not the `pages` icon set). */
  icon: string;
  name: string;
}

interface ServiceSeed {
  slug: string;
  categorySlug: string;
  name: string;
  excerpt: string;
  body: string;
  /** Unsplash photo id. Each was reviewed visually — the subject must match the service. */
  photo: string;
  /** Non-Unsplash cover (e.g. Wikimedia) — overrides `photo` when set. */
  coverImage?: { url: string; credit: string };
  alt: string;
  /** Integer cents, or null when the service is quoted on request. */
  priceFrom: number | null;
  /** Integer tenths (47 = 4.7 stars), or null when unrated. */
  ratingTenths: number | null;
  /** [T] text after the price, e.g. "/ person". */
  priceSuffix: string | null;
  durationLabel: string | null;
  bookingType: "enquiry" | "external" | "none";
  ctaLabel: string | null;
  ctaUrl: string | null;
  /** Rich detail sections (validated against `serviceDetailContent`; omitted = none). */
  detail?: Record<string, unknown>;
  /** Detail-page gallery, in order (the cover is not repeated here). */
  gallery?: GallerySeed[];
}

const CATEGORIES: CategorySeed[] = [
  { slug: "arrival", icon: "car", name: "Arrival & Transfers" },
  { slug: "in-your-apartment", icon: "home-simple", name: "In Your Apartment" },
  { slug: "experiences", icon: "binocular", name: "Experiences" },
];

/**
 * The first seven services carry the real centralhill.pt copy (prices, itineraries, menus,
 * conditions) that used to live in the static `ui/service-detail-content.ts`; the other three
 * remain demo rows with a body only.
 */
const SERVICES: ServiceSeed[] = [
  {
    slug: "private-airport-transfer",
    categorySlug: "arrival",
    name: "Airport Private Transfer",
    excerpt:
      "A driver waiting with your name on a board — door to door, any hour of the day or night.",
    body: "The moment you land, your private driver is already watching your flight. One transfer, no queues, no surprises — just a smooth, direct ride between the airport and your apartment door, available around the clock.\n\nAdd a return transfer for the day you leave, or ask your guest contact to arrange a pickup from anywhere else in the city.",
    photo: "1657459737249-0da225251448",
    alt: "Dark executive saloon car photographed from the front wing",
    priceFrom: 7200,
    priceSuffix: null,
    ratingTenths: 49,
    durationLabel: "Available 24/7",
    bookingType: "enquiry",
    ctaLabel: "Request a transfer",
    ctaUrl: null,
    detail: {
      highlights: [
        "Professional driver waiting in the arrivals hall with your name, or at your apartment door",
        "Live flight tracking — your pickup time adjusts automatically if you're early or delayed",
        "One large check-in bag or two cabin bags included per person",
        "No hidden fees, no surge pricing",
      ],
      pricing: {
        columns: ["One way", "Round trip"],
        rows: [
          { label: "1–6 passengers", cells: ["€72", "€144"] },
          { label: "6–25 passengers", cells: ["€12 / person", "€24 / person"] },
          { label: "25+ passengers", cells: ["On request", "On request"] },
        ],
      },
    },
  },
  {
    slug: "luggage-storage",
    categorySlug: "arrival",
    name: "Luggage Storage",
    excerpt: "Two trusted partners so you can enjoy Lisbon right up to your flight — bag-free.",
    body: "Your apartment can't hold your bags after check-out, but Lisbon doesn't have to stop there. We've partnered with two trusted companies so you can explore freely until it's time to leave.",
    photo: "1672501985900-4bd497734108",
    alt: "Wheeled suitcases lined up on a cobbled old-town street",
    priceFrom: null,
    priceSuffix: null,
    ratingTenths: 50,
    durationLabel: null,
    // Booked directly with the partners (their cards carry the links) — no enquiry form.
    bookingType: "none",
    ctaLabel: null,
    ctaUrl: null,
    detail: {
      partners: [
        {
          name: "Bounce",
          desc: "Secure storage locations across the city — drop your bags off after check-out and collect them whenever suits you.",
          cta_label: "Find a location",
          url: "https://www.bouncestorage.com",
        },
        {
          name: "Luggit",
          desc: "Door-to-door pickup and delivery, including straight to the airport. Central Hill guests save 10%.",
          cta_label: "Book with 10% off",
          url: "https://luggit.app",
        },
      ],
    },
  },
  {
    slug: "chef-at-home",
    categorySlug: "in-your-apartment",
    name: "Chef at Home",
    excerpt:
      "A three-course Portuguese dinner, cooked in your apartment by someone who's spent a lifetime perfecting it.",
    body: "Be surprised in the comfort of your apartment by the best of Portuguese home cooking.\n\nCentral Hill partners with 55+, a local social organisation that champions cooks over 55 — giving experienced home cooks the chance to keep doing what they love, for guests who want a truly authentic meal.\n\nEnjoy a full Portuguese menu — starter, main course, wine, bread and dessert — without leaving home.",
    photo: "1556910103-1c02745aae4d",
    alt: "Chef plating a refined dish in a home kitchen",
    priceFrom: 3500,
    priceSuffix: "/ person",
    ratingTenths: 50,
    durationLabel: "One evening, in your apartment",
    bookingType: "enquiry",
    ctaLabel: "Plan a dinner",
    ctaUrl: null,
    detail: {
      option_groups: [
        {
          title: "Starters — choose one",
          items: [
            { name: "Caldo Verde" },
            { name: "Leek à Brás" },
            { name: "Tomato Soup" },
            { name: "Portuguese Cheese Board" },
          ],
        },
        {
          title: "Main course — choose one",
          items: [
            { name: "Duck Rice" },
            { name: "Pork Pie" },
            { name: "Stuffed Turkey with Farinheira" },
            { name: "Prawn Rice" },
            { name: "Bacalhau com Natas" },
            { name: "Sweet Rice (vegetarian)" },
            { name: "Stuffed Red Cabbage (vegetarian)" },
          ],
        },
        {
          title: "Dessert — choose one",
          items: [{ name: "Apple Tart" }, { name: '"Baba de Camelo"' }],
        },
      ],
      pricing: { columns: ["Price"], rows: [{ label: "Per person", cells: ["€35"] }] },
    },
    gallery: [
      {
        url: unsplash("1591825729269-caeb344f6df2"),
        credit: "Unsplash · photo-1591825729269-caeb344f6df2",
        alt: "Friends sharing a home-cooked meal together around the table",
      },
    ],
  },
  {
    slug: "grocery-pre-stocking",
    categorySlug: "in-your-apartment",
    name: "Grocery Pre-Stocking",
    excerpt: "Arrive to a stocked fridge — breakfast, coffee and the basics already in.",
    body: "Nobody wants to hunt for a supermarket after a long flight, least of all with a tired family in tow.\n\nSend us a list before you travel and we shop it: fresh bread and pastries, coffee, milk, fruit, water, whatever your children actually eat. Everything is put away before you arrive, cold things in the fridge, so the first morning starts at the kitchen table instead of in a checkout queue.\n\nYou pay the receipt plus a flat service fee — there is no markup on the shopping itself.",
    photo: "1730984226564-8f3f226ac48c",
    alt: "Vegetables and herbs in cotton produce bags on a kitchen counter",
    priceFrom: 2000,
    priceSuffix: null,
    ratingTenths: 48,
    durationLabel: "Order 48h ahead",
    bookingType: "enquiry",
    ctaLabel: "Send a shopping list",
    ctaUrl: null,
  },
  {
    slug: "babysitting",
    categorySlug: "in-your-apartment",
    name: "Babysitting",
    excerpt: "Vetted, English-speaking sitters so you can have an evening out.",
    body: "An evening to yourselves, without the guesswork.\n\nOur sitters are background-checked, first-aid trained and speak English; many also speak French or Spanish. They come to the apartment, follow your routine for bath and bedtime, and send a message when the children are asleep.\n\nBook a single evening or a recurring slot across a longer stay. Daytime cover is available too, which families with small children usually discover on day two and book for the rest of the week.",
    photo: "1764616676739-57db6e5c00ee",
    alt: "An adult and a child building a tower of wooden blocks together",
    priceFrom: 1800,
    priceSuffix: null,
    ratingTenths: 50,
    durationLabel: "Per hour · minimum 3h",
    bookingType: "enquiry",
    ctaLabel: "Request a sitter",
    ctaUrl: null,
  },
  {
    slug: "mid-stay-housekeeping",
    categorySlug: "in-your-apartment",
    name: "Mid-Stay Housekeeping",
    excerpt: "A full clean and fresh linen partway through a longer stay.",
    body: "On a stay of a week or more, one reset makes the apartment feel new again.\n\nThe same team that prepares the apartment before arrival comes back mid-stay: full clean, fresh bed linen and towels, kitchen and bathrooms done properly, bins out. It takes about two hours and you are welcome to be out while it happens.\n\nAdd laundry to the same visit and it comes back washed, folded and put away the following day.",
    photo: "1731336478850-6bce7235e320",
    alt: "A freshly made bed with white linen in a warm, designed bedroom",
    priceFrom: 4500,
    priceSuffix: null,
    ratingTenths: 47,
    durationLabel: "About 2 hours",
    bookingType: "enquiry",
    ctaLabel: "Book a clean",
    ctaUrl: null,
  },
  {
    slug: "sintra-day-tour",
    categorySlug: "experiences",
    name: "Sintra Tour",
    excerpt:
      "Palaces, cliffs and coastline — Sintra, Cabo da Roca and Cascais in one unhurried day.",
    body: "A full day with a private driver-guide through Sintra's fairytale hills, the dramatic cliffs of Cabo da Roca — mainland Europe's westernmost point — and the seafront promenade of Cascais.\n\nThe pace is yours: linger longer at one stop, as long as you're back in Lisbon by early evening.",
    photo: "1697050303652-0b228f3f83df",
    alt: "The Pena Palace rising above the wooded hills of Sintra",
    priceFrom: 6500,
    priceSuffix: "/ person",
    ratingTenths: 49,
    durationLabel: "Full day · ~8 hours",
    bookingType: "enquiry",
    ctaLabel: "Plan the day",
    ctaUrl: null,
    detail: {
      itinerary: [
        { time: "08:30", title: "Pickup", text: "Your driver-guide meets you at the apartment." },
        {
          time: "08:30 – 12:30",
          title: "Sintra",
          text: "Explore the National Palace and either Pena Palace or Quinta da Regaleira — we suggest choosing one; Sintra rewards an unhurried visit.", media: "gallery:0",
        },
        { time: "12:30 – 13:30", title: "Lunch", text: "A stop to enjoy a local meal (not included)." },
        {
          time: "13:30 – 14:30",
          title: "Cabo da Roca",
          text: "Stand at the westernmost point of continental Europe.", media: "gallery:1",
        },
        {
          time: "14:30 – 16:00",
          title: "Cascais",
          text: "A walk along the seafront promenade and marina.", media: "gallery:2",
        },
        { time: "16:00 – 17:00", title: "Return", text: "Back in Lisbon by early evening." },
      ],
      pricing: {
        columns: ["Price"],
        rows: [
          { label: "1–5 guests", cells: ["€320 total"] },
          { label: "6–25 guests", cells: ["€65 / person"] },
          { label: "25+ guests", cells: ["On request"] },
        ],
      },
    },
    gallery: [
      {
        url: wikimedia("Initiation_Well_in_Quinta_da_Regaleira_-_Sintra_(16277476688).jpg"),
        credit: "Wikimedia Commons · Initiation_Well_in_Quinta_da_Regaleira_-_Sintra_(16277476688).jpg",
        alt: "The spiral Initiation Well at Quinta da Regaleira, Sintra",
      },
      {
        url: wikimedia(
          "Farol_do_Cabo_da_Roca,_Cabo_da_Roca,_the_westernmost_point_of_continental_Europe_(50657181383).jpg",
        ),
        credit:
          "Wikimedia Commons · Farol_do_Cabo_da_Roca,_Cabo_da_Roca,_the_westernmost_point_of_continental_Europe_(50657181383).jpg",
        alt: "The lighthouse at Cabo da Roca, the westernmost point of continental Europe",
      },
      {
        url: wikimedia("View_from_the_Praia_da_Rainha_(Beach)_in_Cascais,_Portugal.jpg"),
        credit: "Wikimedia Commons · View_from_the_Praia_da_Rainha_(Beach)_in_Cascais,_Portugal.jpg",
        alt: "The seafront promenade and beach at Cascais, Portugal",
      },
    ],
  },
  {
    slug: "fatima-tour",
    categorySlug: "experiences",
    name: "Fátima Tour",
    excerpt:
      "Fátima, Batalha, Nazaré and Óbidos — faith, history and the Atlantic coast in a single day.",
    body: "A day trip to the spiritual heart of Portugal: the Sanctuary of Fátima, the Gothic Monastery of Batalha, the record-breaking waves of Nazaré, and the whitewashed medieval walls of Óbidos.",
    photo: "",
    coverImage: {
      url: wikimedia("Sanctuary of Our Lady of Fátima.jpg"),
      credit: "Wikimedia Commons · Sanctuary of Our Lady of Fátima.jpg",
    },
    alt: "The Basilica of Our Lady of the Rosary and its colonnade at the Sanctuary of Fátima",
    priceFrom: 8600,
    priceSuffix: "/ person",
    ratingTenths: null,
    durationLabel: "Full day · ~9 hours",
    bookingType: "enquiry",
    ctaLabel: "Plan the day",
    ctaUrl: null,
    detail: {
      itinerary: [
        { time: "08:30", title: "Pickup", text: "Your driver-guide meets you at the apartment." },
        {
          time: "08:30 – 12:00",
          title: "Fátima",
          text: "Free time at the Sanctuary and the Basilica of the Most Holy Trinity.", media: "cover",
        },
        {
          time: "12:00 – 14:00",
          title: "Batalha",
          text: "Visit the Monastery of Batalha and stop for lunch (not included).", media: "gallery:0",
        },
        { time: "14:00 – 15:00", title: "Nazaré", text: "See the Guinness World Record waves from the clifftop.", media: "gallery:1" },
        { time: "15:00 – 16:30", title: "Óbidos", text: "Wander the medieval walled village.", media: "gallery:2" },
        { time: "16:30 – 17:30", title: "Return", text: "Back in Lisbon by early evening." },
      ],
      pricing: {
        columns: ["Price"],
        rows: [
          { label: "1–5 guests", cells: ["€480 total"] },
          { label: "6–25 guests", cells: ["€86 / person"] },
          { label: "25+ guests", cells: ["On request"] },
        ],
      },
    },
    gallery: [
      {
        url: wikimedia("Batalha_September_2021-2.jpg"),
        credit: "Wikimedia Commons · Batalha_September_2021-2.jpg",
        alt: "The Gothic facade of the Monastery of Batalha",
      },
      {
        url: wikimedia("Nazaré_-_Praia_do_Norte_(25302065368).jpg"),
        credit: "Wikimedia Commons · Nazaré_-_Praia_do_Norte_(25302065368).jpg",
        alt: "The record-breaking waves at Praia do Norte, Nazaré",
      },
      {
        url: wikimedia("Obidos_April_2009-4b.jpg"),
        credit: "Wikimedia Commons · Obidos_April_2009-4b.jpg",
        alt: "A whitewashed street inside the medieval walls of Óbidos",
      },
    ],
  },
  {
    slug: "tagus-sunset-sailing",
    categorySlug: "experiences",
    name: "Boat Tour",
    excerpt: "A private sailboat or catamaran on the Tagus — your route, your hours, your pace.",
    body: "See Lisbon the way it was meant to be seen — from the water. Choose a sailboat or catamaran, pick your duration, and sail past Belém's monuments, the hills of Alfama or out to the open Atlantic off Cascais.\n\nAdd a barbecue on board or an open bar to turn the afternoon into something to remember.",
    photo: "1605387202149-47169c4ea58a",
    alt: "The deck of a sailing yacht under a low sun at sea",
    priceFrom: 19900,
    priceSuffix: null,
    ratingTenths: 48,
    durationLabel: "2–8 hours",
    bookingType: "enquiry",
    ctaLabel: "Check availability",
    ctaUrl: null,
    detail: {
      option_groups: [
        {
          title: "Choose your boat",
          items: [
            {
              name: "Catamaran",
              desc: "A luxurious catamaran with four double cabins, private bathrooms, a spacious deck and a solarium. A smaller catamaran is also available.",
            },
            {
              name: "Sailboat",
              desc: "A 14-metre sailboat with a solarium and barbecue area — ideal for a relaxed afternoon with friends. A smaller sailboat is also available.",
            },
          ],
        },
        {
          title: "Choose your route",
          items: [
            { name: "2 hours", desc: "Belém — the Belém Tower, Jerónimos Monastery, MAAT and the 25 de Abril Bridge." },
            { name: "3 hours", desc: "Add Alfama, São Jorge Castle and the National Pantheon." },
            { name: "4 hours", desc: "A half-day out to Oeiras, with time to swim in the summer months." },
            { name: "8 hours", desc: "A full day out to Cascais bay and the open Atlantic." },
          ],
        },
      ],
      pricing: {
        columns: ["2h", "3h", "4h", "8h"],
        rows: [
          { label: "Sailing Boat Fado · up to 6", cells: ["€199", "€249", "€299", "€600"] },
          { label: "Sailing Boat Chiado · up to 12", cells: ["€299", "€399", "€449", "€699"] },
          { label: "Catamaran Tejo · up to 12", cells: ["€359", "€459", "€525", "€799"] },
          { label: "Catamaran Lisboa · up to 18", cells: ["€549", "€749", "€849", "€1,400"] },
        ],
      },
      extras: [
        {
          label: "Barbecue",
          price: "€14 / person",
          desc: "Cheese, chouriço, bread, grilled meats, salad, cake and fruit, plus 4 drinks per person.",
        },
        {
          label: "Open bar",
          price: "€8 / person",
          desc: "Unlimited beer, white wine, soft drinks and water (subject to the boat's safety rules).",
        },
      ],
    },
  },
  {
    slug: "surf-lesson",
    categorySlug: "experiences",
    name: "Surf Experience",
    excerpt: "A 2.5-hour lesson at Carcavelos beach, built for every level.",
    body: "Lisbon's mild Atlantic swell makes Carcavelos one of Portugal's best places to learn. An English-speaking instructor takes your group of up to six through the basics on the sand before heading into the water for your first waves.",
    photo: "1502680390469-be75c86b636f",
    alt: "Surfer riding a clean wave along the Portuguese coast",
    priceFrom: 4000,
    priceSuffix: "/ person",
    ratingTenths: 47,
    durationLabel: "~2.5 hours",
    bookingType: "enquiry",
    ctaLabel: "Book a lesson",
    ctaUrl: null,
    detail: {
      highlights: [
        "Board, wetsuit and insurance included",
        "One instructor per group of up to 6",
        "If conditions are poor, the instructor can move the lesson to a better beach",
        "Contact available around the clock",
      ],
      pricing: { columns: ["Price"], rows: [{ label: "Per person", cells: ["€40"] }] },
    },
  },
];

const FREE_24H = "Free cancellation up to 24 hours before.";

/**
 * The fixed-skeleton copy of every detail page (`mock/service-detail.html`): trust badges,
 * key facts, block headings, booking-card note + rows and the three "Good to know" columns.
 * Merged into each service's `detail` at write time — the variable module (itinerary,
 * options, pricing, extras, partners) stays on the service entry above.
 */
const SKELETON: Record<string, Record<string, unknown>> = {
  "private-airport-transfer": {
    badges: ["Free cancellation · 24h", "Live flight tracking"],
    facts: [
      { icon: "clock", title: "Available 24/7", note: "Any arrival or departure time" },
      { icon: "group", title: "1–25+ passengers", note: "Vehicle sized to your group" },
      { icon: "car", title: "Door to door", note: "Arrivals hall ↔ your apartment" },
      { icon: "language", title: "English-speaking driver", note: "Waiting with your name on a board" },
    ],
    about_title: "Land, walk out, and you're on your way",
    included_title: "Every transfer includes",
    price_note: "One way for 1–6 passengers · €144 round trip",
    booking_rows: [
      { label: "Availability", value: "24/7" },
      { label: "Passengers", value: "1–25+" },
      { label: "Cancellation", value: "Free up to 24h" },
    ],
    good_to_know: {
      included: ["One large check-in bag or two cabin bags per person", "Tolls and flight tracking"],
      cancellation: ["Free cancellation up to 24 hours before the transfer."],
      practical: [
        "Extra luggage beyond the included allowance may require a larger vehicle (+€25).",
        "A waiting-time charge of €40 applies from 1h30 after landing.",
      ],
    },
  },
  "luggage-storage": {
    badges: ["Central Hill guests save 10% with Luggit"],
    facts: [
      { icon: "map-pin", title: "Across the city", note: "Secure partner locations near every apartment" },
      { icon: "car", title: "Pickup & delivery", note: "Including straight to the airport" },
    ],
    about_title: "Enjoy Lisbon right up to your flight",
    booking_rows: [
      { label: "Partners", value: "Bounce · Luggit" },
      { label: "Book", value: "Directly with the partner" },
    ],
    good_to_know: {
      practical: [
        "Luggit is a pickup-and-delivery service — book at least 24 hours ahead.",
        "Request your Luggit pickup before the 11:00 check-out time.",
      ],
    },
  },
  "chef-at-home": {
    badges: ["Cooks over 55 · with 55+", "Vegetarian on request"],
    facts: [
      { icon: "home", title: "In your apartment", note: "The chef shops, cooks, serves and clears" },
      { icon: "clock", title: "One evening", note: "Starter, main, dessert, wine and bread" },
      { icon: "group", title: "From 2 guests", note: "One bottle of wine per four guests" },
    ],
    about_title: "Portuguese home cooking, at your own table",
    price_note: "Three courses, wine and bread included",
    booking_rows: [
      { label: "Where", value: "Your apartment" },
      { label: "Menu", value: "3 courses, chosen ahead" },
      { label: "Cancellation", value: "Free up to 24h" },
    ],
    good_to_know: {
      included: ["One bottle of wine (red or white) for every four guests, plus bread"],
      cancellation: [FREE_24H],
      practical: ["A vegetarian adaptation is available on request.", "Choose your menu when you book."],
    },
  },
  "grocery-pre-stocking": {
    badges: ["No markup on the shopping"],
    facts: [
      { icon: "calendar", title: "Order 48h ahead", note: "Send your list before you travel" },
      { icon: "home", title: "Put away before you arrive", note: "Cold things in the fridge" },
    ],
    about_title: "Arrive to a stocked fridge",
    included_title: "What we take care of",
    price_note: "Flat service fee + the receipt",
    booking_rows: [
      { label: "Lead time", value: "48 hours" },
      { label: "Where", value: "Your apartment" },
    ],
    highlights: [
      "Shopped from your own list",
      "Fresh bread, pastries, coffee and fruit",
      "Everything put away before check-in",
      "You pay the receipt — no markup",
    ],
    good_to_know: {
      included: ["Shopping, delivery and putting everything away"],
      cancellation: ["Free cancellation up to 48 hours before arrival."],
      practical: ["Send dietary needs or brand preferences with your list."],
    },
  },
  babysitting: {
    badges: ["Background-checked sitters"],
    facts: [
      { icon: "clock", title: "Per hour · minimum 3h", note: "Evenings, or daytime cover on request" },
      { icon: "group", title: "Up to 3 children", note: "One sitter per family" },
      { icon: "language", title: "English, French, Spanish", note: "Depending on availability" },
      { icon: "home", title: "At your apartment", note: "Following your bath and bedtime routine" },
    ],
    about_title: "An evening to yourselves, without the guesswork",
    included_title: "Peace of mind, built in",
    price_note: "Minimum 3 hours per booking",
    booking_rows: [
      { label: "Where", value: "Your apartment" },
      { label: "Availability", value: "Evenings & daytime" },
      { label: "Cancellation", value: "Free up to 24h" },
    ],
    highlights: [
      "Background-checked, first-aid trained sitter",
      "Message when the children are asleep",
      "Your routine, followed to the letter",
      "Single evenings or recurring slots",
    ],
    good_to_know: {
      included: ["Sitter's travel to and from the apartment"],
      cancellation: [FREE_24H],
      practical: ["Book at least 24 hours ahead; same-day on request."],
    },
  },
  "mid-stay-housekeeping": {
    badges: ["Same team that prepares your apartment"],
    facts: [
      { icon: "clock", title: "About 2 hours", note: "You're welcome to be out" },
      { icon: "home", title: "Full apartment reset", note: "Linen, towels, kitchen and bathrooms" },
    ],
    about_title: "One reset, and the apartment feels new again",
    included_title: "Every clean includes",
    booking_rows: [
      { label: "Duration", value: "About 2 hours" },
      { label: "Cancellation", value: "Free up to 24h" },
    ],
    highlights: [
      "Full clean of every room",
      "Fresh bed linen and towels",
      "Kitchen and bathrooms done properly",
      "Bins out",
    ],
    good_to_know: {
      cancellation: [FREE_24H],
      practical: ["Add laundry to the same visit — it comes back washed and folded the next day."],
    },
  },
  "sintra-day-tour": {
    badges: ["Free cancellation · 24h", "Private group"],
    facts: [
      { icon: "clock", title: "Full day · ~8 hours", note: "08:30 – 17:00, back by early evening" },
      { icon: "group", title: "Up to 25 guests", note: "Private — never shared with strangers" },
      { icon: "language", title: "Portuguese, English, Spanish", note: "Your driver-guide's languages" },
      { icon: "car", title: "Pickup at your apartment", note: "Door to door, anywhere in Lisbon" },
    ],
    about_title: "Palaces, cliffs and coastline in one day",
    price_note: "€320 total for a private group of 1–5",
    booking_rows: [
      { label: "Duration", value: "Full day · ~8 h" },
      { label: "Group", value: "Private, up to 25" },
      { label: "Cancellation", value: "Free up to 24h" },
    ],
    good_to_know: {
      included: [
        "Private driver-guide and vehicle",
        "Pickup and drop-off at your apartment",
        "Not included: monument tickets and meals",
      ],
      cancellation: ["Free cancellation up to 24 hours before the tour."],
      practical: [
        "A dedicated driver joins for groups over 8.",
        "Comfortable shoes recommended — Sintra is hilly.",
      ],
    },
  },
  "fatima-tour": {
    badges: ["Free cancellation · 24h", "Private group"],
    facts: [
      { icon: "clock", title: "Full day · ~9 hours", note: "08:30 – 17:30, back in Lisbon by early evening" },
      { icon: "group", title: "Up to 25 guests", note: "Private — never shared with strangers" },
      { icon: "language", title: "Portuguese, English, Spanish", note: "Your driver-guide's languages" },
      { icon: "car", title: "Pickup at your apartment", note: "Door to door, anywhere in Lisbon" },
    ],
    about_title: "The spiritual heart of Portugal, in one unhurried day",
    price_note: "€480 total for a private group of 1–5",
    booking_rows: [
      { label: "Duration", value: "Full day · ~9 h" },
      { label: "Group", value: "Private, up to 25" },
      { label: "Cancellation", value: "Free up to 24h" },
    ],
    good_to_know: {
      included: [
        "Private driver-guide and vehicle",
        "Pickup and drop-off at your apartment",
        "Not included: monument tickets and meals",
      ],
      cancellation: ["Free cancellation up to 24 hours before the tour."],
      practical: [
        "A dedicated driver joins for groups over 8.",
        "Comfortable shoes recommended — Óbidos is cobbled.",
      ],
    },
  },
  "tagus-sunset-sailing": {
    badges: ["Private charter", "Barbecue & open bar add-ons"],
    facts: [
      { icon: "clock", title: "2–8 hours", note: "Choose your route and duration" },
      { icon: "group", title: "Up to 18 guests", note: "Depending on the boat" },
      { icon: "map-pin", title: "Departs from Lisbon", note: "Past Belém, Alfama or out to Cascais" },
    ],
    about_title: "See Lisbon the way it was meant to be seen",
    price_note: "2 hours on the Sailing Boat Fado, up to 6 guests",
    booking_rows: [
      { label: "Duration", value: "2–8 hours" },
      { label: "Group", value: "Private, up to 18" },
    ],
    good_to_know: {
      included: ["Skipper and fuel", "Add-ons: barbecue (€14 / person), open bar (€8 / person)"],
      practical: ["Swimming stops on the 4h and 8h routes in the summer months."],
    },
  },
  "surf-lesson": {
    badges: ["All levels", "Board & wetsuit included"],
    facts: [
      { icon: "clock", title: "~2.5 hours", note: "Basics on the sand, then into the water" },
      { icon: "group", title: "Up to 6 per instructor", note: "Small groups, split by ability" },
      { icon: "language", title: "English-speaking instructor", note: "Certified surf school" },
      { icon: "map-pin", title: "Carcavelos beach", note: "Moved to a better beach if needed" },
    ],
    about_title: "Your first waves, on Lisbon's coast",
    included_title: "Every lesson includes",
    booking_rows: [
      { label: "Duration", value: "~2.5 hours" },
      { label: "Group", value: "Up to 6" },
      { label: "Cancellation", value: "Free up to 24h" },
    ],
    good_to_know: {
      included: ["Board, wetsuit and insurance"],
      cancellation: [
        "Free cancellation up to 24 hours before the lesson.",
        "Bad weather: relocated, postponed or fully refunded.",
      ],
      practical: ["The surf school makes the final call on conditions."],
    },
  },
};

const sameSlugAllLocales = (value: string) => ({ en: value, pt: value, es: value, fr: value });

/**
 * Download an image and put it through the real upload path, returning the new
 * `media_asset.id`. Mirrors what the admin media picker does, minus the browser.
 */
async function ingestImage(src: string, filename: string, credit: string, alt: string): Promise<string> {
  const res = await fetch(src, { headers: FETCH_HEADERS });
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.startsWith("image/")) {
    throw new Error(`image fetch failed for ${filename}: ${res.status} ${type}`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());

  const presigned = await presignUpload({
    filename,
    contentType: "image/jpeg",
    size: bytes.length,
  });

  // Both headers are signed (ADR 0024) — a PUT that omits either is rejected.
  const put = await fetch(presigned.uploadUrl, {
    method: "PUT",
    headers: {
      "content-type": presigned.contentType,
      "cache-control": presigned.cacheControl,
    },
    body: new Uint8Array(bytes),
  });
  if (!put.ok) throw new Error(`R2 PUT failed for ${filename}: ${put.status} ${await put.text()}`);

  const asset = await finalizeUpload({ id: presigned.id, r2Key: presigned.r2Key, credit });
  // `alt` is [T] and lives in the translation table, not on the asset row.
  await setSourceContent("media_asset", asset.id, { alt });
  return asset.id;
}

const coverCredit = (seed: ServiceSeed) => seed.coverImage?.credit ?? CREDIT(seed.photo);

const ingestPhoto = (seed: ServiceSeed) =>
  ingestImage(
    seed.coverImage?.url ?? PHOTO(seed.photo),
    `${seed.slug}.jpg`,
    coverCredit(seed),
    seed.alt,
  );

/**
 * Resolve the gallery to `media_asset` ids, reusing any asset already stamped with the
 * same credit (so a re-run uploads nothing), then replace the service's `service_media`
 * rows. Seed-owned gallery assets the service no longer references are deleted.
 */
async function syncGallery(
  serviceId: string,
  seed: ServiceSeed,
): Promise<{ ids: string[]; summary: string }> {
  const wanted = seed.gallery ?? [];
  const current = await db
    .select({ media_id: service_media.media_id, credit: media_asset.credit })
    .from(service_media)
    .innerJoin(media_asset, eq(service_media.media_id, media_asset.id))
    .where(eq(service_media.service_id, serviceId));

  let uploaded = 0;
  const ids: string[] = [];
  for (const [i, g] of wanted.entries()) {
    const [existing] = await db
      .select({ id: media_asset.id })
      .from(media_asset)
      .where(eq(media_asset.credit, g.credit))
      .limit(1);
    if (existing) {
      await setSourceContent("media_asset", existing.id, { alt: g.alt });
      ids.push(existing.id);
    } else {
      ids.push(await ingestImage(g.url, `${seed.slug}-gallery-${i + 1}.jpg`, g.credit, g.alt));
      uploaded++;
    }
  }

  await db.delete(service_media).where(eq(service_media.service_id, serviceId));
  if (ids.length) {
    await db
      .insert(service_media)
      .values(ids.map((media_id, position) => ({ service_id: serviceId, media_id, position })));
  }

  let removed = 0;
  for (const c of current) {
    if (!ids.includes(c.media_id) && c.credit && SEED_CREDIT.test(c.credit)) {
      await deleteMedia(c.media_id);
      await deleteContent("media_asset", c.media_id);
      removed++;
    }
  }
  return {
    ids,
    summary: `gallery ${ids.length} (${uploaded} uploaded${removed ? `, ${removed} removed` : ""})`,
  };
}

/**
 * Decide what this service's cover should be. Reuses the existing asset when it is already
 * the seed's photo; otherwise uploads the new one and removes the superseded asset (object,
 * row and its `alt` translation) so re-runs don't leak orphans into the media library.
 */
async function resolveCover(
  currentId: string | null,
  seed: ServiceSeed,
): Promise<{ coverId: string; action: "reused" | "uploaded" | "replaced" }> {
  if (!currentId) return { coverId: await ingestPhoto(seed), action: "uploaded" };

  const [current] = await db
    .select({ credit: media_asset.credit })
    .from(media_asset)
    .where(eq(media_asset.id, currentId))
    .limit(1);

  if (current?.credit === coverCredit(seed)) return { coverId: currentId, action: "reused" };

  const coverId = await ingestPhoto(seed);
  // Only ever drop an asset this script uploaded — never one a person put there.
  if (current?.credit && SEED_CREDIT.test(current.credit)) {
    await deleteMedia(currentId);
    await deleteContent("media_asset", currentId);
  }
  return { coverId, action: "replaced" };
}

async function upsertCategories(): Promise<Map<string, string>> {
  const bySlug = new Map<string, string>();
  for (const [i, seed] of CATEGORIES.entries()) {
    const [existing] = await db
      .select({ id: service_category.id })
      .from(service_category)
      .where(eq(service_category.slug, seed.slug))
      .limit(1);

    let id = existing?.id;
    if (id) {
      await db
        .update(service_category)
        .set({ icon: seed.icon, position: i, updated_at: new Date() })
        .where(eq(service_category.id, id));
    } else {
      const [ins] = await db
        .insert(service_category)
        .values({ slug: seed.slug, icon: seed.icon, position: i })
        .returning({ id: service_category.id });
      id = ins!.id;
    }

    await setSourceContent(SERVICE_CATEGORY, id, { name: seed.name });
    bySlug.set(seed.slug, id);
    console.log(`  category ${existing ? "updated" : "created"}  ${seed.slug}`);
  }
  return bySlug;
}

async function upsertServices(categoryIds: Map<string, string>): Promise<void> {
  for (const [i, seed] of SERVICES.entries()) {
    const categoryId = categoryIds.get(seed.categorySlug);
    if (!categoryId) throw new Error(`unknown category ${seed.categorySlug} for ${seed.slug}`);

    const [existing] = await db
      .select({ id: service.id, cover_media_id: service.cover_media_id })
      .from(service)
      .where(eq(service.slug, seed.slug))
      .limit(1);

    // Only pay for a download + upload when the cover is missing or is a different photo
    // than the seed now specifies.
    const { coverId, action } = await resolveCover(existing?.cover_media_id ?? null, seed);

    const values = {
      slug: seed.slug,
      status: "published" as const,
      position: i,
      category_id: categoryId,
      cover_media_id: coverId,
      price_from: seed.priceFrom,
      rating_tenths: seed.ratingTenths,
      booking_type: seed.bookingType,
      cta_url: seed.ctaUrl,
    };

    let id = existing?.id;
    if (id) {
      await db
        .update(service)
        .set({ ...values, updated_at: new Date() })
        .where(eq(service.id, id));
    } else {
      const [ins] = await db.insert(service).values(values).returning({ id: service.id });
      id = ins!.id;
    }

    // A seed without a gallery leaves whatever staff attached in /admin/services alone.
    const gallery = seed.gallery
      ? await syncGallery(id, seed)
      : { ids: [] as string[], summary: "gallery untouched" };

    // Same shape the admin editor saves: the validated object as one [T] JSON field,
    // cleared when every section is empty. Itinerary `media` refs ("cover", "gallery:<i>")
    // become the uploaded assets' ids.
    const raw = { ...seed.detail, ...SKELETON[seed.slug] } as Record<string, unknown>;
    if (Array.isArray(raw.itinerary)) {
      raw.itinerary = (raw.itinerary as Array<Record<string, unknown>>).map(({ media, ...step }) => {
        if (typeof media !== "string") return step;
        const mediaId = media === "cover" ? coverId : gallery.ids[Number(media.split(":")[1])];
        if (!mediaId) throw new Error(`${seed.slug}: itinerary media "${media}" not found`);
        return { ...step, media_id: mediaId };
      });
    }
    const detail = serviceDetailContent.parse(raw);

    await setSlugs(SERVICE, id, sameSlugAllLocales(seed.slug));
    await setSourceContent(SERVICE, id, {
      name: seed.name,
      excerpt: seed.excerpt,
      body: seed.body,
      price_suffix: seed.priceSuffix,
      duration_label: seed.durationLabel,
      cta_label: seed.ctaLabel,
      detail: isEmptyDetail(detail) ? null : JSON.stringify(detail),
    });
    console.log(
      `  service  ${existing ? "updated" : "created"}  ${seed.slug} (cover ${action}, ${gallery.summary})`,
    );
  }
}

async function main() {
  if (process.env.DRY) {
    const cats = await db
      .select({ slug: service_category.slug })
      .from(service_category)
      .orderBy(asc(service_category.position));
    const svcs = await db.select({ slug: service.slug }).from(service);
    console.log(`DRY: would write ${CATEGORIES.length} categories, ${SERVICES.length} services.`);
    console.log(`     existing: ${cats.length} categories, ${svcs.length} services (no writes made).`);
    return;
  }

  console.log("seeding service categories…");
  const categoryIds = await upsertCategories();
  console.log("seeding services (uploading covers to R2 where missing)…");
  await upsertServices(categoryIds);
  console.log(
    `\n✓ ${CATEGORIES.length} categories, ${SERVICES.length} published services.\n` +
      "  Next: /admin/pages/home → Services carousel, then save to refresh the home page.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
