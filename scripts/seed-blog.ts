/**
 * Blog "From the Journal" demo articles (NOT a migration; idempotent, re-runnable).
 *
 * The blog ships with a single (featured) post, and the featured post is excluded from the
 * listing grid — so the grid had nothing to render. This script writes 8 published,
 * **non-featured** articles taken from the approved mock's grid (titles, excerpts, dates,
 * reading time) with original short bodies, each with a real cover photo pushed through the
 * production media pipeline (presign → PUT to R2 → finalize, ADR 0018/0025), exactly like a
 * backoffice upload. Nothing is hot-linked.
 *
 * Writes mirror `savePost` in `src/slices/blog/admin/actions.ts` field-for-field, so a seeded
 * post is indistinguishable from one created in /admin/posts: the input is validated with the
 * admin's own `blogPostSaveInput`; the core columns are the same; the slug goes to the column
 * *and* (same value for all 4 locales) the `core/i18n` slug table; title / excerpt / body
 * (portable JSON, ADR 0013) / cta_label / meta_* go through `setSourceContent` (source `en`
 * only — other locales fall back to it until translated); related posts are ≤3 ordered rows.
 *
 * It does **not** create categories or authors: every post is filed under the existing
 * `owner-guides` category and the existing `central-hill` author (both from `seed-demo`),
 * and the existing featured post is never read-modified or touched.
 *
 * **Idempotent by slug.** A post whose slug exists is updated in place. Its cover is only
 * re-fetched when the seed names a different photo than the asset on the row (tracked via
 * `media_asset.credit`, stamped with a `(seed-blog)` suffix unique to this script). A replaced
 * cover is deleted (R2 object + row + alt) only when it carries this script's credit — an
 * asset a person (or another seed) uploaded is never deleted.
 *
 * ISR is not busted here (no Next runtime in a script): the blog reads are cached under the
 * `blog_post-list` tag — restart `pnpm dev` (or save any post in /admin/posts) to see them.
 *
 * Env: run with `--env-file=.env.local` (Node's loader never overrides a variable that is
 * already set, so a one-off `R2_S3_ENDPOINT=… pnpm tsx …` prefix wins over the file).
 *
 *   pnpm tsx --env-file=.env.local --tsconfig scripts/tsconfig.json scripts/seed-blog.ts
 *   DRY=1 pnpm tsx --env-file=.env.local --tsconfig scripts/tsconfig.json scripts/seed-blog.ts   # report only
 */
import { eq, inArray } from "drizzle-orm";
import { db } from "@core/db/client";
import { deleteContent, setSlugs, setSourceContent } from "@core/i18n/content-write";
import { media_asset } from "@core/media/schema";
import { deleteMedia, finalizeUpload, presignUpload } from "@core/media/server/ingest";
import { blogPostSaveInput, type BlogPostSaveInput } from "@slices/blog/admin/validation";
import type { PostBody } from "@slices/blog/body";
import { BLOG_POST } from "@slices/blog/contract";
import { author, blog_category, blog_post, blog_post_related } from "@slices/blog/schema";

const CATEGORY_SLUG = "owner-guides";
const AUTHOR_SLUG = "central-hill";

/** 4:3 master — the listing card and the detail hero both crop from it. */
const pexels = (id: string) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600&h=1200&fit=crop`;

const CREDIT_SUFFIX = " (seed-blog)";
const CREDIT = (photoId: string) => `Pexels · photo-${photoId}${CREDIT_SUFFIX}`;
const isSeedOwned = (credit: string | null | undefined) =>
  Boolean(credit?.startsWith("Pexels · photo-") && credit.endsWith(CREDIT_SUFFIX));

interface PostSeed {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date-time (UTC). */
  publishedAt: string;
  readingMinutes: number;
  /** Pexels photo id — each checked visually; the alt describes what is in the frame. */
  photo: string;
  alt: string;
  body: PostBody;
}

const p = (text: string) => ({ type: "paragraph" as const, text });
const h2 = (text: string) => ({ type: "heading" as const, level: 2 as const, text });

// ─────────────────────────────────────────────────────────────────────────────
// Content — titles/excerpts/dates/reading time from the mock's "From the Journal" grid
// (mock card #1, AL registration, is skipped: it duplicates the featured licensing post).
// ─────────────────────────────────────────────────────────────────────────────
const POSTS: PostSeed[] = [
  {
    slug: "top-5-mistakes-in-short-term-rental-management-and-how-to-avoid-them",
    title: "Top 5 Mistakes in Short-Term Rental Management — and How to Avoid Them",
    excerpt:
      "Even experienced owners make these common mistakes. Recognising them early can be the difference between a profitable rental and a costly one.",
    publishedAt: "2026-03-17T09:00:00Z",
    readingMinutes: 6,
    photo: "6527037",
    alt: "A bright apartment living room with a grey sofa, mustard cushions and a round coffee table",
    body: [
      p("Most short-term rentals that underperform are not in the wrong place or the wrong building. They are run with a handful of habits that quietly cost bookings, reviews and margin. The good news is that every one of them is fixable."),
      h2("1. Pricing once and forgetting about it"),
      p("A nightly rate set in January is almost never right in August. Demand in Lisbon moves with events, school holidays and flight capacity, and a static price either leaves money on the table in peak weeks or empties the calendar in shoulder season. Review rates at least weekly, or use a dynamic pricing tool with sensible floors."),
      h2("2. Treating cleaning as a cost, not a product"),
      p("Guests forgive a small kitchen; they do not forgive a hair on the pillow. Cleanliness is the single most mentioned topic in reviews, and one bad score can depress your ranking for months. Use a checklist, photograph every turnover and inspect regularly."),
      h2("3. Slow or inconsistent communication"),
      p("Booking platforms reward fast replies, and guests remember the host who answered at midnight. Templates for check-in, Wi-Fi and house rules save time; a human reply when something goes wrong saves the review."),
      h2("4. Ignoring compliance until it is urgent"),
      p("AL registration, guest reporting to the authorities, tourist tax and safety equipment are not optional extras. Fines are real and enforcement has tightened. Build compliance into your processes from day one rather than reacting to a letter."),
      h2("5. Under-investing in photos and listing copy"),
      p("Your photos are your shop window. Professional photography, an accurate floor plan and an honest description consistently outperform phone snapshots — and they reduce disappointed guests, which protects your reviews."),
    ],
  },
  {
    slug: "how-to-choose-the-best-property-management-company-in-portugal",
    title: "How to Choose the Best Property Management Company in Portugal",
    excerpt:
      "In a crowded market, choosing the right management partner is one of the most important decisions you can make as an owner. Here is what to look for.",
    publishedAt: "2026-01-20T09:00:00Z",
    readingMinutes: 5,
    photo: "8293744",
    alt: "A property manager in a suit reviewing a printed financial report with two clients at a desk",
    body: [
      p("Handing your property to a manager is a decision about trust as much as revenue. The Portuguese market has hundreds of operators, from one-person outfits to national brands, and the differences only become obvious once your calendar — and your apartment — are in their hands."),
      h2("Look past the headline commission"),
      p("A low percentage can hide extra fees for cleaning, linen, maintenance call-outs or channel costs. Ask for a sample monthly owner statement and compare the net amount you would actually receive, not the advertised rate."),
      h2("Ask how they price and distribute"),
      p("A good manager can explain their pricing strategy in plain language, shows you which channels they list on, and has a view on minimum stays, last-minute discounts and long-stay demand. Vague answers here usually mean a static calendar."),
      h2("Check the operations behind the brand"),
      p("Who cleans, who inspects, and who answers the phone at 2am? In-house or tightly managed teams tend to deliver more consistent standards than a rotating list of freelancers. Ask to see their turnover checklist and their average review score across the portfolio."),
      h2("Insist on transparency and compliance"),
      p("You should have live access to bookings and statements, and clear confirmation that guest registration, tourist tax and AL obligations are handled. A manager who is relaxed about compliance is a risk to your licence, not just your income."),
    ],
  },
  {
    slug: "dynamic-pricing-explained-how-to-maximise-your-rental-income",
    title: "Dynamic Pricing Explained: How to Maximise Your Rental Income",
    excerpt:
      "Static pricing is leaving money on the table. Here is how dynamic pricing works, why it matters, and what the data says about its impact on revenue.",
    publishedAt: "2025-11-12T09:00:00Z",
    readingMinutes: 6,
    photo: "3912976",
    alt: "A hand typing on a laptop whose screen shows a line chart",
    body: [
      p("Hotels have adjusted their prices daily for decades. Short-term rental owners who still set one rate per season are competing with one hand tied behind their back — and the gap shows up directly in annual revenue."),
      h2("What dynamic pricing actually does"),
      p("Dynamic pricing adjusts your nightly rate based on demand signals: how far away the date is, local events, competitor availability, day of the week and your own booking pace. When demand rises, the price follows; when a date looks likely to stay empty, it comes down early enough to still sell."),
      h2("Why it matters in Lisbon"),
      p("Lisbon's calendar is full of spikes — conferences, festivals, football and cruise arrivals — alongside quieter winter weeks. A flat rate cannot capture both. Owners who move to demand-based pricing typically see higher occupancy in low season and a stronger average daily rate in peak weeks."),
      h2("Guardrails matter"),
      p("Algorithms are tools, not strategies. Always set a minimum price that covers your costs, a maximum that protects your positioning, and sensible rules for minimum stays and gap nights. Review the results monthly and adjust."),
      { type: "callout", variant: "tip", body: "Track revenue per available night (RevPAN), not just occupancy. A full calendar at the wrong price can earn less than a well-priced one with a few gaps." },
    ],
  },
  {
    slug: "lisbons-best-neighbourhoods-for-short-term-rental-investment",
    title: "Lisbon's Best Neighbourhoods for Short-Term Rental Investment",
    excerpt:
      "From Bairro Alto to Alfama, each Lisbon neighbourhood offers a different risk-return profile. Here is how to evaluate which location works best for your goals.",
    publishedAt: "2025-09-16T09:00:00Z",
    readingMinutes: 7,
    photo: "34155133",
    alt: "Terracotta rooftops of Alfama under a clear blue sky, with the dome of the National Pantheon",
    body: [
      p("Location still decides most of a rental's performance, but in Lisbon the best location depends on what you want from the investment: maximum nightly rates, steady year-round occupancy, or long-term capital growth."),
      h2("Historic centre: Baixa, Chiado and Alfama"),
      p("The postcard neighbourhoods command the highest nightly rates and the strongest international demand. They also carry the tightest regulation — several parishes have restrictions on new AL registrations — and higher acquisition prices. Ideal for owners with an existing licence or a property already in use."),
      h2("Príncipe Real and Estrela"),
      p("Elegant, quieter and popular with longer-staying guests and families. Rates are high, wear and tear is lower, and the neighbourhoods appeal to medium-term stays as well as holidays, which helps smooth occupancy."),
      h2("Up-and-coming: Arroios, Intendente and Marvila"),
      p("Lower entry prices and a creative, local feel make these areas attractive to younger travellers and digital nomads. Yields can be strong, but due diligence on the specific street matters more here than in the centre."),
      h2("How to evaluate a location"),
      p("Check the AL rules for the parish, transport links to the airport and centre, noise at night, and comparable listings' occupancy. Then decide whether the property should be priced for short stays, medium stays, or a mix of both."),
    ],
  },
  {
    slug: "5-things-every-property-owner-should-know-before-renting-short-term",
    title: "5 Things Every Property Owner Should Know Before Renting Short-Term",
    excerpt:
      "Before your first booking, there are five things every short-term rental owner in Portugal needs to understand — from registration to pricing strategy.",
    publishedAt: "2025-07-15T09:00:00Z",
    readingMinutes: 5,
    photo: "12955837",
    alt: "A small wooden house model beside a set of keys and a printed contract on a blue surface",
    body: [
      p("Short-term renting can be one of the most rewarding ways to earn from a property in Portugal — but it is a hospitality business, not a passive one. These are the five things we wish every owner knew before their first guest arrived."),
      {
        type: "list",
        ordered: true,
        items: [
          "Registration comes first. You need a valid Alojamento Local (AL) registration before you can legally advertise or accept a booking.",
          "Taxes are part of the plan. Rental income is taxable, and Lisbon charges a municipal tourist tax per guest per night that must be collected and paid.",
          "Insurance must cover hosting. Standard home insurance rarely covers paying guests; a specific policy protects you and is required for AL.",
          "Guests expect hotel standards. Fresh linen, spotless bathrooms, fast Wi-Fi and a smooth check-in are the baseline, not a bonus.",
          "Pricing is a strategy, not a number. Rates should move with demand, season and events to reach both strong occupancy and a healthy average rate.",
        ],
      },
      p("None of this is complicated once it is set up properly, but each point is a common source of fines, poor reviews or lost income when it is skipped. Getting the foundations right is what lets a rental run smoothly for years."),
    ],
  },
  {
    slug: "5-interior-design-tips-that-make-guests-book-again-and-again",
    title: "5 Interior Design Tips That Make Guests Book Again and Again",
    excerpt:
      "The way your property looks — in photos and in person — directly affects your bookings, your reviews, and your nightly rate. Here is how to get it right.",
    publishedAt: "2025-05-13T09:00:00Z",
    readingMinutes: 5,
    photo: "271624",
    alt: "A bright, compact bedroom with a white double bed, a round side table and a padded window seat",
    body: [
      p("Guests decide in seconds whether a listing feels right, and they decide again the moment they open the door. Thoughtful interiors are one of the few investments that improve both your conversion rate and your reviews."),
      h2("Design for the photo, live for the stay"),
      p("A calm, light palette with one or two accent colours photographs beautifully and ages well. Add texture — linen, wood, ceramics — rather than clutter, so the space looks generous in pictures and feels warm in person."),
      h2("Invest where guests touch"),
      p("Mattresses, bedding, towels and the shower are what guests write about. A hotel-quality bed and good water pressure earn more five-star reviews than any statement artwork."),
      h2("Light every corner"),
      p("Layer ceiling, floor and bedside lighting with warm bulbs. Dark corners make rooms feel smaller on camera, and reading lights on both sides of the bed are a small detail guests notice."),
      h2("Give a sense of place"),
      p("A few local touches — azulejo-inspired ceramics, prints by Lisbon artists, a guide to the neighbourhood — make a stay memorable and help your listing stand out from identical rentals nearby."),
      h2("Make it practical"),
      p("Hooks by the door, space for open suitcases, a proper desk for remote workers and blackout curtains in the bedroom. Practical design is invisible when it is right and very visible when it is missing."),
    ],
  },
  {
    slug: "why-portugal-remains-one-of-europes-best-short-term-rental-markets-in-2025",
    title: "Why Portugal Remains One of Europe's Best Short-Term Rental Markets in 2025",
    excerpt:
      "Record visitor numbers, a stable regulatory framework, and consistently strong yields — here is the investment case for Portugal's short-term rental sector.",
    publishedAt: "2025-03-18T09:00:00Z",
    readingMinutes: 6,
    photo: "17847439",
    alt: "Porto's riverside lit up at dusk along the Douro, seen over terracotta rooftops",
    body: [
      p("Portugal has spent a decade at the top of European travel wish lists, and the fundamentals behind that demand remain solid. For owners, the question is less whether the market works and more how to operate well within it."),
      h2("Demand that keeps growing"),
      p("Visitor numbers continue to set records, helped by new air routes, a long tourist season and a reputation for safety and value. Lisbon and Porto lead, but the Algarve, Madeira and smaller cities are drawing more travellers every year."),
      h2("A clearer regulatory picture"),
      p("After a period of uncertainty, the rules for Alojamento Local are better defined. Requirements are demanding — registration, safety, guest reporting and local restrictions — but clarity lets professional operators plan and invest with confidence."),
      h2("Yields that compare well"),
      p("Well-located, well-run apartments continue to deliver gross yields that compare favourably with long-term letting and with many other European capitals, especially when combined with medium-term stays in the quieter months."),
      { type: "quote", text: "The opportunity has shifted from simply owning a property to operating it professionally." },
      p("Owners who treat their rental as a hospitality product — with strong pricing, consistent standards and full compliance — are the ones capturing the market's upside."),
    ],
  },
  {
    slug: "the-essential-setup-checklist-for-your-first-short-term-rental",
    title: "The Essential Setup Checklist for Your First Short-Term Rental",
    excerpt:
      "Getting your property ready for its first guest involves more than cleaning and photography. Here is the complete checklist — from registration to listing optimisation.",
    publishedAt: "2025-01-21T09:00:00Z",
    readingMinutes: 7,
    photo: "2092060",
    alt: "A folded white towel laid on a freshly made bed in a sunlit room",
    body: [
      p("The weeks before your first booking set the tone for everything that follows. Use this checklist to make sure nothing important is left until the guest is already at the door."),
      h2("Paperwork and compliance"),
      {
        type: "list",
        ordered: false,
        items: [
          "AL registration approved and the registration number ready for every listing.",
          "Hosting-specific insurance in place.",
          "Guest reporting and tourist tax processes set up.",
          "Fire extinguisher, fire blanket, first-aid kit and emergency information displayed.",
        ],
      },
      h2("The apartment"),
      {
        type: "list",
        ordered: false,
        items: [
          "Two full sets of quality linen and towels per bed.",
          "Kitchen basics: cookware, knives, coffee maker, kettle, glasses and dishes for the maximum occupancy.",
          "Fast, reliable Wi-Fi with the password clearly displayed.",
          "Smart lock or a clear key handover process.",
        ],
      },
      h2("The listing"),
      p("Book professional photography once the apartment is fully styled. Write a description that is honest about stairs, noise and size, highlight what makes the neighbourhood special, and set an opening price slightly below market to earn your first reviews quickly."),
      { type: "callout", variant: "note", body: "Do a full test night yourself before the first guest arrives. You will find the missing corkscrew long before they do." },
    ],
  },
];

const sameSlugAllLocales = (value: string) => ({ en: value, pt: value, es: value, fr: value });

/** Download a photo and put it through the real upload path, returning the new asset id. */
async function ingestPhoto(seed: PostSeed): Promise<string> {
  const res = await fetch(pexels(seed.photo));
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.startsWith("image/")) {
    throw new Error(`photo fetch failed for ${seed.slug}: ${res.status} ${type}`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());

  const presigned = await presignUpload({
    filename: `${seed.slug}.jpg`,
    contentType: "image/jpeg",
    size: bytes.length,
  });

  // Both headers are signed (ADR 0024) — a PUT that omits either is rejected.
  const put = await fetch(presigned.uploadUrl, {
    method: "PUT",
    headers: { "content-type": presigned.contentType, "cache-control": presigned.cacheControl },
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

async function resolveCover(
  currentId: string | null,
  seed: PostSeed,
): Promise<{ coverId: string; action: "reused" | "uploaded" | "replaced" }> {
  if (!currentId) return { coverId: await ingestPhoto(seed), action: "uploaded" };

  const [current] = await db
    .select({ credit: media_asset.credit })
    .from(media_asset)
    .where(eq(media_asset.id, currentId))
    .limit(1);

  if (current?.credit === CREDIT(seed.photo)) {
    await setSourceContent("media_asset", currentId, { alt: seed.alt }); // keep alt in sync
    return { coverId: currentId, action: "reused" };
  }

  const coverId = await ingestPhoto(seed);
  if (isSeedOwned(current?.credit)) {
    await deleteMedia(currentId);
    await deleteContent("media_asset", currentId);
  }
  return { coverId, action: "replaced" };
}

async function lookupRefs(): Promise<{ categoryId: string; authorId: string }> {
  const [cat] = await db
    .select({ id: blog_category.id })
    .from(blog_category)
    .where(eq(blog_category.slug, CATEGORY_SLUG))
    .limit(1);
  const [auth] = await db
    .select({ id: author.id })
    .from(author)
    .where(eq(author.slug, AUTHOR_SLUG))
    .limit(1);
  if (!cat) throw new Error(`category "${CATEGORY_SLUG}" not found — create it in /admin first`);
  if (!auth) throw new Error(`author "${AUTHOR_SLUG}" not found — create it in /admin first`);
  return { categoryId: cat.id, authorId: auth.id };
}

/** Same as the admin's `persistRelated`: replace, dedupe, drop self, keep order, ≤3. */
async function persistRelated(postId: string, relatedIds: string[]): Promise<void> {
  await db.delete(blog_post_related).where(eq(blog_post_related.post_id, postId));
  const clean = Array.from(new Set(relatedIds.filter((rid) => rid !== postId))).slice(0, 3);
  if (clean.length > 0) {
    await db
      .insert(blog_post_related)
      .values(clean.map((rid, i) => ({ post_id: postId, related_post_id: rid, position: i })));
  }
}

async function upsertPost(
  seed: PostSeed,
  refs: { categoryId: string; authorId: string },
): Promise<string> {
  const [existing] = await db
    .select({ id: blog_post.id, cover_media_id: blog_post.cover_media_id, is_featured: blog_post.is_featured })
    .from(blog_post)
    .where(eq(blog_post.slug, seed.slug))
    .limit(1);
  if (existing?.is_featured) throw new Error(`refusing to overwrite featured post "${seed.slug}"`);

  const { coverId, action } = await resolveCover(existing?.cover_media_id ?? null, seed);

  // Validate with the admin's own schema so seeded rows can't diverge from an admin save.
  const input: BlogPostSaveInput = blogPostSaveInput.parse({
    slug: seed.slug,
    status: "published",
    category_id: refs.categoryId,
    author_id: refs.authorId,
    cover_media_id: coverId,
    og_image_media_id: null,
    published_at: seed.publishedAt,
    reading_minutes: seed.readingMinutes,
    is_featured: false,
    cta_label: null,
    cta_url: null,
    title: seed.title,
    excerpt: seed.excerpt,
    body: seed.body,
    meta_title: null,
    meta_description: null,
    related_ids: [],
  });

  const coreValues = {
    slug: input.slug,
    status: input.status,
    category_id: input.category_id,
    author_id: input.author_id,
    cover_media_id: input.cover_media_id,
    og_image_media_id: input.og_image_media_id,
    published_at: input.published_at ? new Date(input.published_at) : null,
    reading_minutes: input.reading_minutes,
    is_featured: input.is_featured,
    cta_url: input.cta_url,
  };

  let id = existing?.id;
  if (id) {
    await db
      .update(blog_post)
      .set({ ...coreValues, updated_at: new Date() })
      .where(eq(blog_post.id, id));
  } else {
    const [ins] = await db.insert(blog_post).values(coreValues).returning({ id: blog_post.id });
    id = ins!.id;
  }

  await setSlugs(BLOG_POST, id, sameSlugAllLocales(input.slug));
  await setSourceContent(BLOG_POST, id, {
    title: input.title,
    excerpt: input.excerpt,
    body: JSON.stringify(input.body),
    cta_label: input.cta_label,
    meta_title: input.meta_title,
    meta_description: input.meta_description,
  });

  console.log(`  post ${existing ? "updated" : "created"}  ${seed.slug} (cover ${action})`);
  return id;
}

async function main() {
  const refs = await lookupRefs();

  if (process.env.DRY) {
    const existing = await db
      .select({ slug: blog_post.slug })
      .from(blog_post)
      .where(inArray(blog_post.slug, POSTS.map((s) => s.slug)));
    console.log(`DRY: would write ${POSTS.length} posts; ${existing.length} already exist (no writes made).`);
    return;
  }

  console.log("seeding blog posts (uploading covers to R2 where missing)…");
  const ids: string[] = [];
  for (const seed of POSTS) ids.push(await upsertPost(seed, refs));

  // Curated related posts: the next three seeded posts (wrapping), like an editor would pick.
  for (const [i, id] of ids.entries()) {
    await persistRelated(id, [1, 2, 3].map((k) => ids[(i + k) % ids.length]!));
  }

  console.log(
    `\n✓ ${POSTS.length} published, non-featured posts (category ${CATEGORY_SLUG}, author ${AUTHOR_SLUG}).\n` +
      "  Blog reads are cached under the `blog_post-list` tag: restart `pnpm dev` or save any post in /admin/posts.",
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
