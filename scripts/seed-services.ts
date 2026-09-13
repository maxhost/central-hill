/**
 * Guest-services demo catalogue (NOT a migration; idempotent, re-runnable).
 *
 * The `services` catalogue ships empty, so the home services carousel (ADR 0032) and the
 * `/services/<slug>` detail pages have nothing to render. This script writes a coherent
 * example set — 3 categories, 9 published services — with **real cover photos**: each
 * Unsplash original is pushed through the production media pipeline (presign → PUT to R2 →
 * finalize, ADR 0018/0025), so the rows carry true dimensions and a blurhash exactly like a
 * backoffice upload. Nothing is hot-linked.
 *
 * Writes go through the same seams the admin actions use — `core/i18n` for source [T] text
 * and slugs (ADR 0019), `core/media` for ingest — so this cannot drift from the real write
 * path. Source locale (`en`) only; other locales fall back to it until translated.
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
import { service, service_category } from "@slices/services/schema";

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
  alt: string;
  /** Integer cents, or null when the service is quoted on request. */
  priceFrom: number | null;
  /** Integer tenths (47 = 4.7 stars), or null when unrated. */
  ratingTenths: number | null;
  durationLabel: string | null;
  bookingType: "enquiry" | "external" | "none";
  ctaLabel: string | null;
  ctaUrl: string | null;
}

const CATEGORIES: CategorySeed[] = [
  { slug: "arrival", icon: "car", name: "Arrival & Transfers" },
  { slug: "in-your-apartment", icon: "home-simple", name: "In Your Apartment" },
  { slug: "experiences", icon: "binocular", name: "Experiences" },
];

const SERVICES: ServiceSeed[] = [
  {
    slug: "private-airport-transfer",
    categorySlug: "arrival",
    name: "Private Transfer",
    excerpt: "A private driver tracks your flight and meets you in the arrival hall.",
    body: "Land, walk out, and your driver is waiting with your name on a sign — no queue, no haggling, no language barrier.\n\nWe track your flight, so a delay costs you nothing and nobody leaves without you. The fare is fixed when you book: luggage, tolls and the child seat you asked for are all included, and the car is sized to your group rather than to the cheapest slot available.\n\nTransfers run between Humberto Delgado Airport and any of our apartments, and the same service takes you back on departure day at whatever hour your flight demands.",
    photo: "1657459737249-0da225251448",
    alt: "Dark executive saloon car photographed from the front wing",
    priceFrom: 3500,
    ratingTenths: 49,
    durationLabel: "Door to door",
    bookingType: "enquiry",
    ctaLabel: "Request a transfer",
    ctaUrl: null,
  },
  {
    slug: "luggage-storage",
    categorySlug: "arrival",
    name: "Luggage Storage",
    excerpt: "Drop your bags and start the trip early — or keep exploring after checkout.",
    body: "Early flight in, late flight out: the two hours that usually go to waste dragging suitcases around cobbled streets.\n\nLeave your bags at a secured partner point minutes from the apartment and walk into the city with your hands free. Every bag is sealed, insured and tracked, and you collect it whenever suits you on the same day.\n\nIf you would rather not detour at all, we can arrange an early drop at the apartment itself, subject to the cleaning schedule.",
    photo: "1672501985900-4bd497734108",
    alt: "Wheeled suitcases lined up on a cobbled old-town street",
    priceFrom: 600,
    ratingTenths: 50,
    durationLabel: "Per bag, per day",
    bookingType: "external",
    ctaLabel: "Reserve a locker",
    ctaUrl: "https://www.centralhill.pt/en/contact",
  },
  {
    slug: "chef-at-home",
    categorySlug: "in-your-apartment",
    name: "Chef at Home",
    excerpt: "A private chef cooks a Portuguese menu in your apartment kitchen.",
    body: "The best table in Lisbon might be the one you are already sitting at.\n\nA private chef arrives with the shopping done, cooks a seasonal Portuguese menu in your kitchen, serves each course, and leaves the kitchen exactly as they found it. Menus are agreed in advance — seafood, meat, vegetarian, or a tasting run through all three — and allergies or a child's plain plate are never a problem.\n\nIdeal for the first night of a long stay, a birthday, or any evening when nobody wants to negotiate a restaurant booking for eight people.",
    photo: "1556910103-1c02745aae4d",
    alt: "Chef plating a refined dish in a home kitchen",
    priceFrom: 6500,
    ratingTenths: 50,
    durationLabel: "3 hours · from 2 guests",
    bookingType: "enquiry",
    ctaLabel: "Plan a dinner",
    ctaUrl: null,
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
    ratingTenths: 47,
    durationLabel: "About 2 hours",
    bookingType: "enquiry",
    ctaLabel: "Book a clean",
    ctaUrl: null,
  },
  {
    slug: "sintra-day-tour",
    categorySlug: "experiences",
    name: "Sintra Day Tour",
    excerpt: "Palaces, gardens and the Atlantic coast, with a private driver-guide.",
    body: "Sintra rewards anyone who gets there before the coaches, and punishes everyone who does not.\n\nYou leave the apartment early with a private driver-guide, take in Pena Palace and the Quinta da Regaleira gardens while the hills are still quiet, then drop down to Cabo da Roca and the coast road back through Cascais. Tickets are bought ahead, so no part of the day is spent in a queue.\n\nThe pace is yours: add the Moorish Castle, or trade a palace for a long lunch by the sea.",
    photo: "1697050303652-0b228f3f83df",
    alt: "The Pena Palace rising above the wooded hills of Sintra",
    priceFrom: 14500,
    ratingTenths: 49,
    durationLabel: "Full day · up to 6 guests",
    bookingType: "enquiry",
    ctaLabel: "Plan the day",
    ctaUrl: null,
  },
  {
    slug: "tagus-sunset-sailing",
    categorySlug: "experiences",
    name: "Sunset Sailing",
    excerpt: "Two hours on the Tagus as the city turns gold — skipper and drinks included.",
    body: "Lisbon looks like a different city from the water, and best of all in the last hour of light.\n\nA skippered sailing yacht leaves from Doca de Belém and takes you under the 25 de Abril bridge, past the Torre de Belém and the waterfront, with wine and a few petiscos on board. Between eight and twelve guests fits comfortably, which makes it a good fit for a family group or a small celebration.\n\nPrivate charters only — you are never sharing the deck with strangers.",
    photo: "1605387202149-47169c4ea58a",
    alt: "The deck of a sailing yacht under a low sun at sea",
    priceFrom: 9000,
    ratingTenths: 48,
    durationLabel: "2 hours",
    bookingType: "external",
    ctaLabel: "Check availability",
    ctaUrl: "https://www.centralhill.pt/en/contact",
  },
  {
    slug: "surf-lesson",
    categorySlug: "experiences",
    name: "Surf Lesson",
    excerpt: "Atlantic beginner lessons an hour from the apartment, board and wetsuit included.",
    body: "The beaches west of Lisbon are where half of Portugal learned to surf, and they are far more forgiving than their reputation.\n\nTransfer from the apartment, two hours in the water with a certified instructor, board and wetsuit included. Groups are small and split by ability, so a complete beginner is never in the same line-up as someone chasing a bigger wave.\n\nAvailable year-round: the Atlantic is colder in winter, but the wetsuits are good and the beaches are empty.",
    photo: "1502680390469-be75c86b636f",
    alt: "Surfer riding a clean wave along the Portuguese coast",
    priceFrom: 5500,
    ratingTenths: 47,
    durationLabel: "Half day",
    bookingType: "enquiry",
    ctaLabel: "Book a lesson",
    ctaUrl: null,
  },
];

const sameSlugAllLocales = (value: string) => ({ en: value, pt: value, es: value, fr: value });

/**
 * Download a photo and put it through the real upload path, returning the new
 * `media_asset.id`. Mirrors what the admin media picker does, minus the browser.
 */
async function ingestPhoto(seed: ServiceSeed): Promise<string> {
  const res = await fetch(PHOTO(seed.photo));
  if (!res.ok) throw new Error(`photo fetch failed for ${seed.slug}: ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());

  const presigned = await presignUpload({
    filename: `${seed.slug}.jpg`,
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
  if (!put.ok) throw new Error(`R2 PUT failed for ${seed.slug}: ${put.status} ${await put.text()}`);

  const asset = await finalizeUpload({
    id: presigned.id,
    r2Key: presigned.r2Key,
    credit: CREDIT(seed.photo),
  });
  // `alt` is [T] and lives in the translation table, not on the asset row.
  await setSourceContent("media_asset", asset.id, { alt: seed.alt });
  return asset.id;
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

  if (current?.credit === CREDIT(seed.photo)) return { coverId: currentId, action: "reused" };

  const coverId = await ingestPhoto(seed);
  // Only ever drop an asset this script uploaded — never one a person put there.
  if (current?.credit?.startsWith("Unsplash · photo-")) {
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

    await setSlugs(SERVICE, id, sameSlugAllLocales(seed.slug));
    await setSourceContent(SERVICE, id, {
      name: seed.name,
      excerpt: seed.excerpt,
      body: seed.body,
      duration_label: seed.durationLabel,
      cta_label: seed.ctaLabel,
    });
    console.log(`  service  ${existing ? "updated" : "created"}  ${seed.slug} (cover ${action})`);
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
