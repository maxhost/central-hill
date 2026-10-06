/**
 * "What to Do" city guides catalogue (NOT a migration; idempotent, re-runnable).
 *
 * The `guides` slice ships with a full `guide_page → guide_section → guide_place` schema,
 * a working premium detail template (`GuidePageView`), and a public index — but no rows, so
 * the index's 8 "Explore" cards had nowhere real to link. This script writes the 8 real
 * Lisbon city guides (adapted from the live centralhill.pt "What to do in Lisbon" pages) with
 * **real cover photos**: each is pushed through the production media pipeline (presign → PUT
 * to R2 → finalize, ADR 0018/0025), exactly like a backoffice upload. Nothing is hot-linked.
 *
 * Writes go through the same seams the (future, S12) admin will use — `core/i18n` for source
 * [T] text and slugs (ADR 0019), `core/media` for ingest — so content authored here cannot
 * drift from the real write path, and is the same shape a staff editor will later create,
 * edit or delete sections/places from. Source locale (`en`) only; other locales fall back to
 * it until translated (same accepted gap as `seed-services.ts`).
 *
 * **Idempotent by slug.** A guide page whose slug already exists is updated in place, and its
 * image is only re-fetched when the seed names a different photo than the one on the row
 * (tracked via `media_asset.credit`). Sections and places are fully replaced on every run
 * (delete + reinsert under the parent) since they have no public slug of their own to key on —
 * safe because nothing external links to a section/place id yet (so their ids change per run).
 *
 * **Images survive the rebuild.** Section header photos and the optional per-place photos
 * (`PlaceSeed.image` → `guide_place.media_id`; given to every eat/beach place and the
 * viewpoints — all candidates for the index's Top Recommendations) go through a per-page
 * reuse pool keyed by credit: before the subtree is deleted, the seed-owned assets it
 * referenced are indexed by credit, and the new rows claim from that pool before uploading
 * anything. A re-run with no photo change therefore uploads nothing; an asset the seed no
 * longer claims is deleted (R2 object + row + alt). Assets a person uploaded (other/no
 * credit) are never reused or deleted. The run prints `uploaded / reused / stale removed`.
 *
 * Env: run with `--env-file=.env.local` (Node's loader never overrides a variable that is
 * already set, so a one-off `R2_S3_ENDPOINT=… pnpm tsx …` prefix wins over the file).
 *
 *   pnpm tsx --env-file=.env.local --tsconfig scripts/tsconfig.json scripts/seed-guides.ts
 *   DRY=1 pnpm tsx --env-file=.env.local --tsconfig scripts/tsconfig.json scripts/seed-guides.ts   # report only
 */
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@core/db/client";
import { deleteContent, setSlugs, setSourceContent } from "@core/i18n/content-write";
import { media_asset } from "@core/media/schema";
import { deleteMedia, finalizeUpload, presignUpload } from "@core/media/server/ingest";
import { city } from "@slices/geography/schema";
import { GUIDE_PAGE, GUIDE_PLACE, GUIDE_SECTION, type GuideTemplate } from "@slices/guides/contract";
import { guide_page, guide_place, guide_section } from "@slices/guides/schema";

const pexels = (id: string, w = 1900, h = 1080) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`;

interface ImageSeed {
  /** Full, directly-fetchable image URL. */
  url: string;
  alt: string;
  /** Stamped on the asset; re-runs compare against this to decide whether to re-upload. */
  credit: string;
  filename: string;
}

function pexelsImage(id: string, alt: string, w = 1900, h = 1080): ImageSeed {
  return { url: pexels(id, w, h), alt, credit: `Pexels · photo-${id}`, filename: `pexels-${id}.jpg` };
}

/** Prefixes identifying an asset this script uploaded (vs. one a staff member uploaded),
 *  safe to delete when a re-run replaces it with a different photo. Unsplash/Wikimedia
 *  are no longer seeded (all sources are Pexels now) but stay recognised so a re-run
 *  against a database still holding an earlier run's assets cleans those up too. */
const SEED_CREDIT_PREFIXES = ["Pexels · photo-", "Unsplash · photo-", "Wikimedia Commons"];
const isSeedOwnedCredit = (credit: string | null | undefined) =>
  Boolean(credit) && SEED_CREDIT_PREFIXES.some((p) => credit!.startsWith(p));

/** 4:3 place photo (the `PlaceCard` / Top Recommendations tile ratio). */
const placeImage = (id: string, alt: string) => pexelsImage(id, alt, 1600, 1200);

interface PlaceSeed {
  name: string;
  description?: string;
  /** Free-text type label shown on the card ("Restaurant", "Viewpoint", "Beach", …). The
   *  guides index's Top Recommendations match it case-insensitively (`listTopRecommendations`). */
  category?: string;
  address?: string;
  phone?: string;
  priceTier?: "budget" | "mid" | "premium";
  openingHours?: string;
  /** Optional photo → `guide_place.media_id`. Each was checked visually against the place's
   *  subject; the alt describes what is actually in the frame, not the venue's name. */
  image?: ImageSeed;
}

interface SectionSeed {
  title: string;
  body: string[];
  localTip?: string;
  image?: ImageSeed;
  places?: PlaceSeed[];
}

interface GuidePageSeed {
  slug: string;
  template: GuideTemplate;
  title: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  hero: ImageSeed;
  sections: SectionSeed[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Content — adapted from the live centralhill.pt "What to do in Lisbon" guides.
// ─────────────────────────────────────────────────────────────────────────────

const GUIDES: GuidePageSeed[] = [
  {
    slug: "things-to-do-in-lisbon",
    template: "landing",
    title: "Top Things to Do in Lisbon",
    intro:
      "Lisbon blends traditional heritage with striking modernism and progressive thinking — a rich history, amazing views, buzzing nightlife, beautiful beaches and a glorious year-round climate. Here are the essentials our guests ask us about most.",
    metaTitle: "Top Things to Do in Lisbon | Central Hill",
    metaDescription:
      "The must-see Lisbon — historic districts, São Jorge Castle, viewpoints, Sintra, Belém and more, hand-picked by our local team.",
    hero: pexelsImage("19891046", "A red tram carrying passengers through Lisbon on a sunny spring day"),
    sections: [
      {
        title: "Walk the Historic Districts",
        body: [
          "Lisbon rewards getting lost on foot: azulejo-covered façades along Praça do Comércio and Rossio, then the narrow, flower-draped lanes of Alfama climbing toward the castle. Hop on the famous Tram 28 for a rattling ride through Graça and Escolas Gerais, or take the Santa Justa Elevator and the Glória and Bica funiculars for the easiest way up the city's seven hills.",
        ],
        localTip:
          "Lisbon is the city of seven hills — use the historic trams and elevators to save your legs for the viewpoints.",
        image: pexelsImage("16549939", "A quiet cobblestone street in Lisbon's old town", 1600, 1200),
      },
      {
        title: "São Jorge Castle",
        body: [
          "From a Moorish fortress to the royal residence of Portugal's first king in 1147, São Jorge Castle has watched over Lisbon for almost a thousand years. Its ramparts open onto a panorama of red rooftops and the Tagus that's worth the climb on its own.",
        ],
        localTip: "Arrive early in the morning, or expect to queue.",
        image: pexelsImage(
          "28962469",
          "Charming Lisbon streets with São Jorge Castle visible in the background",
          1600,
          1200,
        ),
      },
      {
        title: "Lisbon's Best Viewpoints & Rooftops",
        body: [
          "The city's miradouros are its real living rooms — benches, a kiosk, a view, and locals in no hurry to leave. When the sun goes down, a handful of rooftop bars take over the same job.",
        ],
        image: pexelsImage(
          "12956566",
          "Alfama's old town district seen from the Miradouro das Portas do Sol viewpoint",
          1600,
          1200,
        ),
        places: [
          {
            name: "Miradouro da Graça",
            category: "Viewpoint",
            image: placeImage("19952255", "Lisbon's tiled rooftops and the São Vicente de Fora monastery seen from a hilltop viewpoint"),
          },
          {
            name: "São Pedro de Alcântara",
            category: "Viewpoint",
            image: placeImage("34452546", "Terracotta rooftops of the Baixa and Rossio seen from a viewpoint above the city"),
          },
          {
            name: "Portas do Sol",
            category: "Viewpoint",
            image: placeImage("5069524", "White houses and red roofs of Alfama below the São Vicente de Fora monastery"),
          },
          {
            name: "Nossa Senhora do Monte",
            category: "Viewpoint",
            image: placeImage("16343720", "A sweeping panorama of Lisbon's rooftops to the river under a clear blue sky"),
          },
          { name: "Topo Martim Moniz", category: "Rooftop Bar" },
          { name: "Park Rooftop", category: "Rooftop Bar" },
        ],
      },
      {
        title: "Day Trips: Sintra & Fátima",
        body: [
          "Thirty minutes from Lisbon, Sintra's palaces, mansions and gardens feel like a different country — UNESCO World Heritage and an easy family day out.",
          "Further afield, the Sanctuary of Fátima draws over five million pilgrims a year; combine it with the Gothic Monastery of Batalha, the record-breaking waves of Nazaré and the whitewashed walls of Óbidos for a full day on the road.",
        ],
        localTip: "Both routes are available as a private day tour through your guest contact.",
        image: pexelsImage("8163130", "Aerial drone shot of the colourful Pena Palace in Sintra", 1600, 1200),
      },
      {
        title: "Taste Authentic Lisbon",
        body: [
          "Portuguese cooking draws on Mediterranean roots and centuries of maritime trade — fresh fish and seafood, quality meat, good wine, olive oil, cheese and bread. No visit is complete without a pastel de nata, still warm from the oven.",
        ],
        localTip:
          "Pastéis de Belém is the classic (and the queue), but Manteigaria in Bairro Alto bakes just as well without the trip.",
        image: pexelsImage("35554378", "A pastel de nata served on an elegant plate", 1600, 1200),
      },
      {
        title: "An Evening of Fado",
        body: [
          "Fado's melancholic, string-accompanied singing dates back to the 1820s and is still sung nightly in pubs and restaurants across Alfama and Bairro Alto.",
        ],
        localTip: "The most authentic houses are tucked into Alfama and Bairro Alto, not the main squares.",
        image: pexelsImage("1966012", "Close-up of an acoustic guitarist mid-performance", 1600, 1200),
        places: [
          { name: "Adega Machado", category: "Fado House" },
          { name: "Parreirinha de Alfama", category: "Fado House" },
          { name: "Clube de Fado", category: "Fado House" },
          { name: "Museu do Fado", category: "Museum" },
        ],
      },
      {
        title: "Belém's Monuments",
        body: [
          "The riverside district of Belém trades Lisbon's tight streets for open plazas and parks — and the city's grandest Age of Discovery landmarks.",
        ],
        image: pexelsImage("24768459", "The Belém Tower on the Tagus riverfront", 1600, 1200),
        places: [
          { name: "Jerónimos Monastery", category: "Monument" },
          { name: "Belém Tower", category: "Monument" },
          { name: "Padrão dos Descobrimentos", category: "Monument" },
          { name: "MAAT", category: "Museum" },
        ],
      },
      {
        title: "Lisbon's Museums",
        body: [
          "A rainy afternoon (or a determinedly curious one) is never wasted in Lisbon — from one of Europe's great private art collections to a museum devoted entirely to the city's own azulejo tiles.",
        ],
        image: pexelsImage("34453118", "A modern art gallery interior with sculptures on display", 1600, 1200),
        places: [
          { name: "Calouste Gulbenkian Museum", category: "Museum" },
          { name: "National Tile Museum", category: "Museum" },
          { name: "Coleção Berardo", category: "Museum" },
          { name: "National Coach Museum", category: "Museum" },
        ],
      },
      {
        title: "Beaches, Boats & Nightlife",
        body: [
          "Lisbon's Atlantic beaches — Carcavelos, Cascais, Costa da Caparica, Comporta and Arrábida — are all within an easy transfer, and a Tagus boat tour is the best seat in the house for the city's skyline. After dark, Bairro Alto and Cais do Sodré keep going well past midnight.",
        ],
        localTip: "See our dedicated Beaches guide and Groups & Friends guide for the full picks.",
        image: pexelsImage("20536745", "Sailing boats moored in a harbour", 1600, 1200),
      },
    ],
  },
  {
    slug: "where-and-what-to-eat-in-lisbon",
    template: "eat",
    title: "Where & What to Eat in Lisbon",
    intro:
      "Portuguese gastronomy is rich, varied and heavily Mediterranean, with influences gathered over centuries of seafaring — the freshest fish and seafood, nature-fed beef, and some of the world's best wine, olive oil, cheese and bread. Here's where our team actually eats.",
    metaTitle: "Where & What to Eat in Lisbon | Central Hill",
    metaDescription:
      "From authentic tascas to Michelin tables — Lisbon's best restaurants by category, curated by our local team.",
    hero: pexelsImage("35554378", "A perfectly baked pastel de nata on an elegant plate"),
    sections: [
      {
        title: "Typical & Authentic",
        body: ["Grandma's cooking, done properly — the dishes that define a Lisbon lunch."],
        image: pexelsImage("20095784", "Francesinha sandwich served with fries, a Portuguese classic", 1600, 1200),
        places: [
          {
            name: "A Provinciana",
            category: "Tasca",
            description:
              "Different daily dishes with grandma's-food quality. Cabidela and polvo à lagareiro are specialties.",
            address: "Travessa do Forno, 23/25",
            phone: "+351 21 346 4704",
            priceTier: "budget",
            image: placeImage("921361", "Grilled octopus with potatoes, herbs and olive oil on a white plate"),
          },
          {
            name: "Cantinho do Bem Estar",
            category: "Tasca",
            description:
              "The best of Alentejo cuisine in a cosy room. Try the migas à alentejana or vitela com molho de coentros.",
            address: "Rua do Norte 46",
            phone: "+351 21 346 4265",
            priceTier: "mid",
            image: placeImage("4344576", "Sliced grilled steak with roast potatoes, salad and a glass of red wine"),
          },
          {
            name: "Solar dos Presuntos",
            category: "Portuguese Cuisine",
            description:
              "Start with presunto, then arroz de lagosta e gambas or cozido à portuguesa — a Lisbon favourite.",
            address: "Rua das Portas de Santo Antão 150",
            phone: "+351 21 342 4253",
            priceTier: "premium",
            image: placeImage("16743489", "A pan of seafood rice with lobster, prawns and mussels"),
          },
        ],
      },
      {
        title: "Fish & Seafood",
        body: ["Portugal's coastline on a plate."],
        image: pexelsImage("10895800", "Fresh mussels served with sauce and lemon on ice", 1600, 1200),
        places: [
          {
            name: "Ramiro",
            category: "Restaurant",
            description: "The freshest seafood in every variety — leave room for the famous prego at the end.",
            address: "Avenida Almirante Reis, 1",
            phone: "+351 21 885 1024",
            priceTier: "premium",
            image: placeImage("4869334", "A platter of grilled crab, prawns and shellfish with fries and salad"),
          },
          {
            name: "Cervejaria Quintada",
            category: "Seafood",
            description: "Choose your fish from the counter, then try ameijoas à bulhão pato while it grills.",
            address: "Av. Eng. Bonneville Franco, 8",
            phone: "+351 21 443 5366",
            priceTier: "mid",
            image: placeImage("2233733", "Whole fish grilling over open flames on a charcoal grill"),
          },
          {
            name: "Ponto Final",
            category: "Restaurant",
            description:
              "Across the river in Cacilhas, reachable by ferry. Pataniscas or arroz de tamboril with an unbeatable view.",
            address: "Cais do Ginjal 72, Almada",
            phone: "+351 212 760 743",
            priceTier: "mid",
            image: placeImage("8694616", "Grilled prawns and a bowl of mussels served with a cold beer"),
          },
        ],
      },
      {
        title: "Restaurants for Large Groups",
        body: ["Big tables, bigger portions — book ahead for a group of six or more."],
        image: pexelsImage("6955659", "A group of friends sharing a dinner together", 1600, 1200),
        places: [
          {
            name: "Adega do Tagarro",
            category: "Tavern",
            description: "In the middle of Bairro Alto. Ask for the group menu — appetiser, main, drinks and dessert.",
            address: "Rua Luz Soriano, 21",
            phone: "+351 21 346 4620",
            priceTier: "budget",
            image: placeImage("6760878", "Friends sharing wine and food at a table on a Lisbon terrace"),
          },
          {
            name: "Cervejaria Trindade",
            category: "Beer Hall",
            description:
              "A former convent with room to match. Seafood, beer and their signature steak are the specialities.",
            address: "Rua Nova da Trindade, 20C",
            phone: "+351 21 342 3506",
            priceTier: "mid",
            image: placeImage("260922", "A large, warmly lit beer hall and restaurant interior"),
          },
          {
            name: "Príncipe do Calhariz",
            category: "Restaurant",
            description: "A familiar, welcoming atmosphere — veal grenadines, roasted chicken and tuna steak.",
            address: "Calçada do Combro, 28",
            phone: "+351 21 342 0971",
            priceTier: "mid",
            image: placeImage("7627420", "A plated grilled meat dish with fresh vegetables and a glass of wine"),
          },
        ],
      },
      {
        title: "Trendy Tables",
        body: ["Where the city eats to be seen, without sacrificing the food."],
        image: pexelsImage("4450334", "Interior of a stylish, contemporary restaurant with large windows", 1600, 1200),
        places: [
          {
            name: "Time Out Market",
            category: "Food Hall",
            description: "A food hall of its own invention — chef's signature dishes under one roof.",
            address: "Av. 24 de Julho 49",
            phone: "+351 21 395 1274",
            priceTier: "budget",
            image: placeImage("3570077", "People eating at tables between food stalls in an indoor food hall"),
          },
          {
            name: "Seen",
            category: "Restaurant",
            description: "Atop the Tivoli Hotel — incredible decor, breathtaking views and a wagyu steak worth the trip.",
            address: "Av. da Liberdade 185, 9º floor",
            phone: "+351 914 673 356",
            priceTier: "premium",
            image: placeImage("8697542", "A gourmet steak with berries and a vivid red sauce on a white plate"),
          },
          {
            name: "Guilty",
            category: "Restaurant & Bar",
            description: "Burgers, pizzas and steaks with a modern touch — turns into a dance bar after dinner.",
            address: "Rua Barata Salgueiro, 28",
            phone: "+351 21 191 3590",
            priceTier: "mid",
            image: placeImage("27998840", "A burger with a fried egg and a side of fries on a restaurant table"),
          },
        ],
      },
      {
        title: "Restaurants with a View",
        body: ["Lisbon's hills make every terrace a potential sunset."],
        image: pexelsImage("8681219", "A restaurant patio overlooking the sea", 1600, 1200),
        places: [
          {
            name: "The Insólito",
            category: "Restaurant",
            description: "Super creative cuisine, in the dishes and the drinks — come with an open mind.",
            address: "Rua de São Pedro de Alcântara, 83",
            phone: "+351 21 130 3306",
            priceTier: "mid",
            image: placeImage("19295070", "A rooftop restaurant terrace with tables under white pergolas above Lisbon"),
          },
          {
            name: "Madame Petisca",
            category: "Petiscos",
            description: "An amazing river and bridge view. Try the lombinho de porco em ginja.",
            address: "Rua de Santa Catarina (Bica), 17, 3º",
            phone: "+351 91 515 0860",
            priceTier: "budget",
            image: placeImage("17831963", "Lisbon rooftops stretching to the 25 de Abril Bridge and Cristo Rei"),
          },
          {
            name: "Noobai",
            category: "Café-Bar",
            description: "Right by the Adamastor viewpoint — try the chilli basmati or mango with prawns.",
            address: "Miradouro de Santa Catarina",
            phone: "+351 21 346 5014",
            priceTier: "mid",
            image: placeImage("5935182", "Friends clinking bottles on a sunny terrace"),
          },
        ],
      },
      {
        title: "Michelin Star",
        body: ["For the night you want Lisbon's finest kitchens."],
        image: pexelsImage("30737878", "An artfully plated gourmet dish at a fine-dining restaurant", 1600, 1200),
        places: [
          {
            name: "Belcanto",
            category: "Fine Dining",
            description: "Chef José Avillez's two-star kitchen — luxurious Portuguese ingredients, technically flawless.",
            address: "Rua Serpa Pinto 10A",
            phone: "+351 21 342 0607",
            priceTier: "premium",
            image: placeImage("30469688", "An array of artfully plated fine-dining courses on a stone table"),
          },
          {
            name: "100 Maneiras",
            category: "Fine Dining",
            description: "Chef Ljubomir Stanišić tells his life story through three tasting-menu options.",
            address: "Rua do Teixeira, 39",
            phone: "+351 910 918 181",
            priceTier: "premium",
            image: placeImage("2977514", "A chef plating a row of refined dishes in a professional kitchen"),
          },
          {
            name: "Alma",
            category: "Fine Dining",
            description: "Chef Henrique Sá Pessoa's best-of tasting menu — ask for the 'Alma menu'.",
            address: "Rua da Anchieta, 15",
            phone: "+351 21 347 0650",
            priceTier: "premium",
            image: placeImage("29145279", "A chef finishing a plated dish of grilled vegetables by hand"),
          },
        ],
      },
      {
        title: "Best Brunches",
        body: ["A slower start to the day, Lisbon-style."],
        image: pexelsImage("33521338", "Avocado and salmon toast with coffee for brunch", 1600, 1200),
        places: [
          {
            name: "Nicolau",
            category: "Brunch",
            description: "Right in downtown Lisbon. Green juice, açaí and locust bean cake are the house picks.",
            address: "Rua de São Nicolau, 15",
            phone: "+351 21 886 0312",
            priceTier: "mid",
            image: placeImage("803897", "A brunch spread of bread, muffins, fresh fruit and spreads on a café table"),
          },
          {
            name: "Heim",
            category: "Brunch",
            description: "Just three menus — yellow, green or red — and all of them good.",
            address: "Rua de Santos-O-Velho, 2",
            phone: "+351 21 248 0763",
            priceTier: "budget",
            image: placeImage("3838632", "Latte art coffees, eggs with bacon and a fruit bowl at a café table"),
          },
          {
            name: "Zenith",
            category: "Brunch",
            description: "Lisbon's top-rated brunch spot — don't miss the smoothie bowls and banana bread.",
            address: "Rua do Telhal, 4A",
            phone: "+351 21 152 7583",
            priceTier: "mid",
            image: placeImage("8230033", "A smoothie bowl topped with banana, mango, berries and almonds"),
          },
        ],
      },
      {
        title: "Best Terraces",
        body: ["For a drink in hand and nowhere else to be."],
        image: pexelsImage("2531184", "Assorted colourful cocktails on a sunset terrace", 1600, 1200),
        places: [
          {
            name: "Miradouro do Adamastor",
            category: "Viewpoint",
            description: "A Lisbon late-afternoon institution — bring your own beer and watch the sunset.",
            address: "Miradouro de Santa Catarina",
            phone: "+351 21 343 0582",
            priceTier: "budget",
            image: placeImage("30775136", "The 25 de Abril Bridge silhouetted against a pink sunset sky over the Tagus"),
          },
          {
            name: "Ribeira das Naus",
            category: "Terrace",
            description: "Right on the river — sun loungers, a drink, and an unbeatable sunset.",
            address: "Avenida Ribeira das Naus",
            phone: "+351 21 408 8889",
            priceTier: "budget",
            image: placeImage("9787527", "Wicker chairs and café tables on a sunny outdoor terrace"),
          },
          {
            name: "Jardim do Príncipe Real",
            category: "Garden Terrace",
            description: "The garden terrace of Lisbon's trendiest neighbourhood — the after-work spot, Monday to Friday.",
            address: "Praça do Príncipe Real",
            phone: "+351 21 342 8334",
            priceTier: "budget",
            image: placeImage("601169", "Wooden tables and chairs on a stone terrace surrounded by greenery"),
          },
        ],
      },
      {
        title: "Vegan",
        body: ["Lisbon's plant-based scene has grown up fast."],
        image: pexelsImage("6120238", "A vegan bowl of tofu and broccoli", 1600, 1200),
        places: [
          {
            name: "AO 26 – Vegan Food Project",
            category: "Vegan",
            description: "Creative, gourmet vegan takes on Portuguese classics, including a vegan francesinha.",
            address: "Rua Vítor Cordon 26",
            phone: "+351 967 281 937",
            priceTier: "mid",
            image: placeImage("17597408", "A vegan bowl of roasted squash, chickpeas, avocado and greens"),
          },
          {
            name: "Orteá – Vegan Collective",
            category: "Vegan",
            description: "House-made cheeses and fermented drinks, plus a pastry shop and natural grocery on site.",
            address: "Rua Dom Luís I, 19 (Cais do Sodré)",
            phone: "+351 913 491 570",
            priceTier: "premium",
            image: placeImage("6065181", "Colourful plant-based bowls with beans, corn, avocado and greens"),
          },
          {
            name: "The Green Affair",
            category: "Vegan",
            description: "Stylish, fully vegan dining — the vegan sushi and mushroom risotto are standouts.",
            address: "Avenida Duque de Ávila 30A (Saldanha)",
            phone: "+351 211 374 984",
            priceTier: "mid",
            image: placeImage("327172", "Close-up of a vegetable sushi roll beside chopsticks"),
          },
        ],
      },
      {
        title: "Vegetarian",
        body: ["Long before plant-based was trendy, these rooms were already doing it well."],
        image: pexelsImage("13467083", "A fresh vegetable salad on a blue ceramic plate", 1600, 1200),
        places: [
          {
            name: "PSI",
            category: "Vegetarian",
            description: "One of Lisbon's oldest vegetarian restaurants, set in a peaceful garden.",
            address: "Alameda Santo António dos Capuchos",
            phone: "+351 213 591 053",
            priceTier: "mid",
            image: placeImage("6823336", "A vegetarian bowl of eggs, mushrooms, cucumber and grains"),
          },
          {
            name: "Jardim dos Sentidos",
            category: "Vegetarian",
            description: "A calm, romantic garden setting — try the lasagna verde or tofu feijoada.",
            address: "Rua da Mãe d'Água 3",
            phone: "+351 213 142 038",
            priceTier: "mid",
            image: placeImage("3026808", "Two bowls of noodles with tofu, mushrooms and fresh herbs"),
          },
          {
            name: "Os Tibetanos",
            category: "Vegetarian",
            description: "Tibetan and Indian-inspired dishes in a charming courtyard — the tofu momo dumplings are a highlight.",
            address: "Rua do Salitre 117",
            phone: "+351 213 142 038",
            priceTier: "mid",
            image: placeImage("5409010", "Steamed dumplings garnished with microgreens on a black plate"),
          },
        ],
      },
    ],
  },
  {
    slug: "beaches-near-lisbon",
    template: "beaches",
    title: "Beaches Near Lisbon",
    intro:
      "Portugal has more than 900km of coastline and around 300 sunny days a year — perfect whether you're chasing waves or doing absolutely nothing at all. Here's which stretch of sand suits which kind of day.",
    metaTitle: "Beaches Near Lisbon | Central Hill",
    metaDescription:
      "From Costa da Caparica to wild Guincho and the coves of Arrábida — the best beaches within easy reach of Lisbon.",
    hero: pexelsImage("12228108", "Golden sand beach and turquoise Atlantic water along Portugal's coast"),
    sections: [
      {
        title: "Costa da Caparica",
        body: [
          "One of the best-known beach destinations near Lisbon — 15km of sand just across the river. Families head for São João and Rainha, groups for Castelo and Cabana do Pescador, and surfers for Cova do Vapor, CDS and Fonte da Telha.",
        ],
        localTip: "Irmão, Leblon and Clássico beach bars are excellent for sunset drinks.",
        image: pexelsImage("30352308", "Serene sunset over a wide Portuguese beach", 1600, 1200),
        places: [
          {
            name: "São João Beach",
            category: "Beach",
            description: "Best for families — wide, gentle sand with lifeguards and beach bars all summer.",
            address: "Almada · near Lisbon",
            image: placeImage("20079503", "Waves rolling onto a wide Atlantic beach under a soft evening sky"),
          },
          {
            name: "Castelo Beach",
            category: "Beach",
            description: "Best for groups and friends — lively beach bars right on the sand.",
            address: "Almada · near Lisbon",
            image: placeImage("36527888", "Two surfers carrying boards along a sandy Atlantic beach"),
          },
          {
            name: "Cova do Vapor",
            category: "Beach",
            description: "Best for surfers — consistent breaks at the mouth of the Tagus.",
            address: "Trafaria, Almada",
            image: placeImage("7659108", "Surfers in wetsuits wading into the Atlantic surf with their boards"),
          },
        ],
      },
      {
        title: "Carcavelos & Oeiras",
        body: [
          "The closest urban beaches to Lisbon — easy access, bars and restaurants right on the sand. Santo Amaro, Paço de Arcos and Torre suit families; Carcavelos itself is the pick for groups and surfers, with easy parking and a 20–30 minute train from Cais do Sodré.",
        ],
        localTip: "We can book your surf lesson at Carcavelos directly — just ask your guest contact.",
        image: pexelsImage("4846528", "Crowded beach with sunbeds and parasols", 1600, 1200),
        places: [
          {
            name: "Carcavelos Beach",
            category: "Beach",
            description: "Best for surfers and groups — surf schools, beach bars and a direct train from Cais do Sodré.",
            address: "Carcavelos, Cascais",
            image: placeImage("13062245", "A lone figure walking along the shoreline at golden hour"),
          },
          {
            name: "Santo Amaro Beach",
            category: "Beach",
            description: "Best for families — calm water and a promenade lined with cafés.",
            address: "Oeiras",
            image: placeImage("4321802", "Aerial view of turquoise surf washing over pale golden sand"),
          },
        ],
      },
      {
        title: "Cascais & Estoril",
        body: [
          "A little further out, quieter and family-friendly, with a seafront promenade linking the two towns. Poça, Rata and Conceição are the pick for families; Cascais marina has fresh fish and seafood, and Boca do Inferno is a dramatic spot for a walk.",
        ],
        image: pexelsImage("19328006", "A quiet beach at sunset", 1600, 1200),
        places: [
          {
            name: "Praia da Poça",
            category: "Beach",
            description: "Best for families — a small, sheltered beach on the Estoril promenade.",
            address: "Estoril, Cascais",
            image: placeImage("34193707", "Sunbathers on a sheltered sandy cove with clear turquoise water"),
          },
          {
            name: "Praia da Conceição",
            category: "Beach",
            description: "Best for families — calm water steps from Cascais town centre.",
            address: "Cascais",
            image: placeImage("29820651", "The blue-and-white Santa Marta lighthouse on the rocky Cascais shoreline"),
          },
        ],
      },
      {
        title: "Guincho",
        body: [
          "Part of the Sintra-Cascais Natural Park, Guincho is for adventure — strong winds make it a famous surf and kitesurf spot. Bar do Guincho is the mythical stop for drinks or a full meal, and Ursa Beach, 11km on, was named one of the most beautiful in the world by the Michelin Guide.",
        ],
        image: pexelsImage("33987116", "Scenic rocky coastline with dramatic ocean waves", 1600, 1200),
      },
      {
        title: "Comporta & Arrábida",
        body: [
          "A small paradise a short drive away, with a microclimate, crystal-clear water and striking scenery. Figueirinha and Galapos are easy to reach with restaurants nearby; Galapinhos is harder to get to but exceptionally beautiful. The Tróia peninsula and Comporta add an oasis of quieter, more luxurious beaches.",
        ],
        localTip: "Parking is scarce here — booking a transfer is worth it.",
        image: pexelsImage("31934689", "Scenic beach cove with turquoise waters", 1600, 1200),
        places: [
          {
            name: "Praia da Figueirinha",
            category: "Beach",
            description: "Best for families — shallow, crystal-clear water with restaurants nearby.",
            address: "Arrábida, Setúbal",
            image: placeImage("11670749", "A long, wild beach with turquoise water curving below green hills"),
          },
          {
            name: "Galapinhos",
            category: "Beach",
            description: "A hidden gem — harder to reach, but one of the most beautiful coves on the coast.",
            address: "Arrábida, Setúbal",
            image: placeImage("26082688", "Clear blue-green water lapping at a rocky cove"),
          },
        ],
      },
      {
        title: "Water Sports",
        body: [
          "Carcavelos and Costa da Caparica are the easiest places to learn to surf, with schools for every level; Guincho and Ericeira are for more experienced surfers. For kitesurfing, head to Lagoa de Albufeira or the Fonte da Telha / Americano beaches. Stand-up paddle, bodyboard and jet-ski rentals are widely available too.",
        ],
        localTip: "Ask your guest contact to book surf lessons directly with us.",
        image: pexelsImage("5231795", "Surfer riding a board on ocean waves", 1600, 1200),
      },
    ],
  },
  {
    slug: "events-and-festivals-in-lisbon",
    template: "events",
    title: "Events & Festivals in Lisbon",
    intro:
      "Lisbon regularly hosts world-famous events across music, culture, sport and technology — drawing some of the world's best musicians, athletes and entrepreneurs to the city each year.",
    metaTitle: "Events & Festivals in Lisbon | Central Hill",
    metaDescription:
      "From Santos Populares to NOS Alive and Web Summit — Lisbon's biggest annual events and festivals.",
    hero: pexelsImage("25016471", "Vibrant outdoor music festival crowd at night under bright stage lights"),
    sections: [
      {
        title: "Santos Populares",
        body: [
          "All through June, Lisbon honours St. Anthony with parades, parties and even street weddings. Alfama, Mouraria and Graça fill with locals dancing, eating and drinking — grilled sardines, caldo verde, bifanas and a cold beer or glass of wine in hand.",
        ],
        image: pexelsImage(
          "8967430",
          "String lights strung between old buildings in a narrow Lisbon-style alley at night",
          1600,
          1200,
        ),
      },
      {
        title: "Music Festivals",
        body: [
          "Lisbon's summer calendar is built around a handful of genuinely world-class festivals — buy tickets well in advance.",
        ],
        image: pexelsImage(
          "1387174",
          "Crowd in front of a blue and orange lit stage during a night concert",
          1600,
          1200,
        ),
        places: [
          {
            name: "NOS Alive",
            description:
              "One of Europe's best — international lineups, a strong food court, easy access by train from Cais do Sodré, at Passeio Marítimo de Algés.",
            category: "Music Festival",
          },
          {
            name: "Rock in Rio Lisboa",
            description:
              "One of the world's best festivals, at Bela Vista Park, with infrastructure that makes it a strong pick for families too.",
            category: "Music Festival",
          },
          {
            name: "Super Bock Super Rock",
            description:
              "One of Lisbon's oldest festivals — rock to hip-hop and electronic, with camping and beach access near Sesimbra.",
            category: "Music Festival",
          },
        ],
      },
      {
        title: "Culture & Technology",
        body: [
          "Beyond music, Lisbon's calendar runs from free open-air jazz to one of the biggest tech conferences in the world.",
        ],
        image: pexelsImage("6270258", "A band performing live on stage", 1600, 1200),
        places: [
          {
            name: "Web Summit",
            description: "Europe's biggest tech conference, held every November at the Altice Arena.",
            category: "Conference",
          },
          {
            name: "Lisbon OutJazz",
            description:
              "A free festival on weekends from May to September, rotating through the city's parks and gardens — jazz, funk, soul and more.",
            category: "Festival",
          },
          {
            name: "Lisbon Film Festivals",
            description:
              "LEFFEST, MOTELX (horror), MONSTRA (animation) and IndieLisboa run through the year, covering everything from mainstream premieres to the independent circuit.",
            category: "Film",
          },
        ],
      },
      {
        title: "Sport in the City",
        body: [
          "From Europe's only stop on the world surf tour to one of the continent's most scenic marathons.",
        ],
        image: pexelsImage("21077134", "Aerial view of a surfer riding a wave on the open ocean", 1600, 1200),
        places: [
          {
            name: "MEO Rip Curl Pro Portugal",
            description:
              "The World Surf League's only European stage, at Supertubos in Peniche — about 100km from Lisbon.",
            category: "Surfing",
          },
          {
            name: "EDP Lisbon Marathon",
            description:
              "Held every October, starting in Cascais and finishing at Praça do Comércio, entirely along the sea and river.",
            category: "Running",
          },
        ],
      },
    ],
  },
  {
    slug: "secrets-of-lisbon",
    template: "secrets",
    title: "Secrets of Lisbon",
    intro:
      "Lisbon has become one of Europe's most-visited cities, and most of its best corners are no longer much of a secret. A handful of spots, though, still carry the city's authentic, unhurried character.",
    metaTitle: "Secrets of Lisbon | Central Hill",
    metaDescription:
      "Hidden viewpoints, underground tunnels, a flea market and Lisbon's oldest house — the lesser-known corners only locals know.",
    hero: pexelsImage("29281154", "A dimly lit underground stone tunnel corridor"),
    sections: [
      {
        title: "Viewpoints & Hidden Corners",
        body: [
          "Santa Catarina's viewpoint is better known to locals as 'Adamastor', after the mythical giant from Camões' Os Lusíadas — a kiosk, a sunset over the Tagus, and the Cristo Rei statue across the river.",
          "For something less photographed, Monsanto Panoramic — a graffiti-covered former restaurant abandoned since 2001 — has a third-floor view over the Águas Livres Aqueduct that's become a favourite with urban-art lovers.",
        ],
        localTip: "Plenty of authentic restaurants surround Adamastor, right next to Bairro Alto's nightlife.",
        image: pexelsImage(
          "12956566",
          "Alfama's old town district seen from the Miradouro das Portas do Sol viewpoint",
          1600,
          1200,
        ),
        places: [{ name: "Aqueduto das Águas Livres", category: "Landmark" }],
      },
      {
        title: "A Taste of Local Ritual",
        body: [
          "Near Rossio, a small crowd often gathers outside a tiny storefront for a ginja — a Portuguese cherry liqueur and the unofficial drink of Lisbon.",
          "For something more private, book Chef at Home: a complete Portuguese meal cooked in your own apartment by an experienced home cook, through our partner 55+, a local organisation supporting cooks over 55.",
        ],
        localTip: "The best and most authentic ginja is at A Ginginha, Largo São Domingos 8, right by Rossio.",
        image: pexelsImage("757340", "A small shot glass of cherry liqueur", 1600, 1200),
      },
      {
        title: "Vintage Shopping & Markets",
        body: [
          "A Vida Portuguesa, in a beautifully preserved old perfume factory in Chiado, sells jewellery, ceramics, stationery and food rescued from the country's memory.",
          "Twice a week, Lisbon's 'Thieves' Market' — Feira da Ladra — takes over a stretch by the National Pantheon in Alfama, a flea market first mentioned in the 17th century.",
        ],
        localTip: "At Feira da Ladra, don't be afraid to negotiate — it's part of the game.",
        image: pexelsImage(
          "17351233",
          "A market stall tent with secondhand books and clothing on display",
          1600,
          1200,
        ),
        places: [
          { name: "A Vida Portuguesa", category: "Shop" },
          { name: "Feira da Ladra", category: "Market", openingHours: "Tuesday & Saturday, dawn to dusk" },
        ],
      },
      {
        title: "Underground & Off-Radar Lisbon",
        body: [
          "Few locals know that beneath downtown Lisbon runs a network of Roman-era tunnels, open to the public only a few days a year.",
          "In Alfama, at Rua do Cego 20, stands what's considered the oldest house in Lisbon — one of the few buildings to survive the devastating 1755 earthquake.",
        ],
        localTip: "Contact the Lisbon Tourism Office for the Roman galleries' open dates — they're not always accessible.",
        image: pexelsImage("6572276", "A narrow cobblestone alley lined with centuries-old houses", 1600, 1200),
      },
      {
        title: "Gardens & Quiet Museums",
        body: [
          "Estufa Fria, minutes from Marquês de Pombal, is a horticultural wonderland of tropical plants most visitors walk straight past.",
          "The Gulbenkian Museum's gardens are just as worth the visit as the collection inside — a quiet retreat with hidden benches and winding paths.",
        ],
        localTip: "Both Estufa Fria and the Tropical Garden are free to enter every Sunday and on public holidays.",
        image: pexelsImage("33115262", "A lush botanical garden with a tropical greenhouse", 1600, 1200),
      },
      {
        title: "Street Art & the Other Side of the River",
        body: [
          "Lisbon is an open-air gallery — look for Vhils' carved building façades and Bordalo II's sculptures made from salvaged waste.",
          "For a different afternoon, take the 20-minute ferry from Cais do Sodré to Cacilhas, ride up to the Cristo Rei statue, then walk down to riverside restaurant Ponto Final for sunset over the city.",
        ],
        localTip: "Several tuk-tuk operators run dedicated Lisbon Street Art tours.",
        image: pexelsImage("1227497", "Colorful street art painted across a city wall", 1600, 1200),
      },
      {
        title: "Lisbon's Hidden Palaces",
        body: [
          "Centuries of one of the world's richest royal families left Lisbon dotted with palaces most visitors never see — Palácio Nacional da Ajuda, built after the 1755 earthquake, the Palácio dos Marqueses de Fronteira, and Palácio de Belém.",
        ],
        image: pexelsImage(
          "5511313",
          "The Pena Palace in the Sintra-Cascais Natural Park, Portugal",
          1600,
          1200,
        ),
      },
    ],
  },
  {
    slug: "lisbon-for-families-and-kids",
    template: "families",
    title: "Lisbon for Families & Kids",
    intro:
      "Lisbon is a genuinely easy city to visit with children — plenty to do, and a climate that's kind to little ones.",
    metaTitle: "Lisbon for Families & Kids | Central Hill",
    metaDescription:
      "The Oceanário, Europe's oldest zoo, hands-on museums and dolphin watching — easy days out the whole family will love.",
    hero: pexelsImage("8623325", "A family walking together along a sunny beach"),
    sections: [
      {
        title: "Oceanário & Lisbon Zoo",
        body: [
          "The Lisbon Oceanarium is one of the world's largest saltwater aquariums, split across four habitats with more than 450 species, including a family of much-loved otters.",
          "Lisbon Zoo, Europe's oldest, has been in the city centre for over 120 years and is home to more than 2,000 animals across 300 species, plus dolphin, bird and reptile shows.",
        ],
        image: pexelsImage("33969651", "A woman smiling at a colourful aquarium fish tank", 1600, 1200),
        places: [
          { name: "Lisbon Oceanarium", category: "Attraction", description: "Free for children up to 3 years old." },
          { name: "Lisbon Zoo", category: "Attraction", description: "Free for children up to 2 years old." },
        ],
      },
      {
        title: "Hands-On Fun",
        body: [
          "The Pavilion of Knowledge turns science into play — pedal a 'suspended' bicycle, fly a hydrogen rocket, and let kids solve puzzles hands-on, with a dedicated area for 3–6 year-olds.",
          "The Puppet Museum is a good quieter morning option, with an interactive area where kids can create their own animations.",
        ],
        image: pexelsImage("12471794", "Kids exploring an interactive exhibit in a museum", 1600, 1200),
        places: [
          { name: "Pavilion of Knowledge", category: "Museum", description: "Free for children up to 2 years old." },
          { name: "Puppet Museum", category: "Museum", description: "Free for children under 13." },
        ],
      },
      {
        title: "Riverside Bikes & Easy Adventures",
        body: [
          "On a sunny day, ride the riverfront bike path under the 25 de Abril Bridge, stop for ice cream or a playground, and take in the MAAT museum and Belém Tower along the way.",
        ],
        localTip: "A Segway, Go-Kart or electric scooter works just as well if bikes aren't your thing.",
        image: pexelsImage("7982172", "A family riding bicycles together outdoors", 1600, 1200),
      },
      {
        title: "A Family Day Trip to Sintra & Fátima",
        body: [
          "Sintra's fairytale palaces, mysterious castle ruins and legendary garden wells are an easy 30 minutes from Lisbon and a hit with kids and adults alike.",
          "Fátima, Batalha Monastery, the waves of Nazaré and the medieval walls of Óbidos make for a bigger day out that still holds a child's attention.",
        ],
        image: pexelsImage(
          "5511313",
          "The Pena Palace in Sintra-Cascais Natural Park, Portugal",
          1600,
          1200,
        ),
      },
      {
        title: "Dolphin Watching & the Beach",
        body: [
          "A resident pod of dolphins lives along the Arrábida coast, and boat tours give a near-guaranteed sighting while passing historic forts along the way.",
          "Closer to the city, Praia de Carcavelos has golden sand, clean water and strong facilities; Costa da Caparica, Guincho, Comporta and Arrábida are all easy alternatives.",
        ],
        localTip: "Bring a hat and sun protection — you'll be on the boat for a couple of hours.",
        image: pexelsImage("4886376", "Dolphins swimming under blue water in the sea", 1600, 1200),
      },
      {
        title: "Christmas Fairs & Festive Lisbon",
        body: [
          "In December, Marquês de Pombal square becomes Wonderland Lisboa — a market, ice rink, Santa's village and Ferris wheel. Downtown, Rossio's Christmas market serves mulled wine and traditional sweets.",
        ],
        localTip: "With a car, Óbidos Vila Natal (about an hour away) is considered Portugal's most magical holiday fair.",
        image: pexelsImage("29645440", "A festive Christmas market lit up at night", 1600, 1200),
      },
      {
        title: "A Portuguese Dinner, Cooked at Home",
        body: [
          "Skip the crowded restaurants one night and have an experienced home cook prepare a full Portuguese menu in your own apartment, through our partner 55+ — a fun, social experience the whole family remembers.",
        ],
        image: pexelsImage("7469438", "A family preparing food together in the kitchen", 1600, 1200),
      },
    ],
  },
  {
    slug: "lisbon-for-groups-and-friends",
    template: "groups",
    title: "Lisbon for Groups & Friends",
    intro:
      "Great weather, great food and welcoming locals — Lisbon is one of the most exciting cities in Europe for a trip with friends, from sightseeing to nightlife to a little adventure.",
    metaTitle: "Lisbon for Groups & Friends | Central Hill",
    metaDescription:
      "Rooftop bars, boat trips, surf lessons and the best restaurants for groups — Lisbon's essentials for a trip with friends.",
    hero: pexelsImage("15375947", "Three friends taking photos together on a rooftop at sunset"),
    sections: [
      {
        title: "Boat Trips on the Tagus",
        body: [
          "A private tour along the Tagus takes in Lisbon's historic riverside from the water — some include a stop to swim, or a barbecue on board.",
        ],
        localTip: "Book your boat for late afternoon and catch the sunset with the group.",
        image: pexelsImage("185799", "Sailboat on calm water during a golden sunset", 1600, 1200),
      },
      {
        title: "Lisbon's Nightlife",
        body: [
          "One of Europe's most exciting nightlife scenes runs through two neighbourhoods: Bairro Alto's packed little bars, and Cais do Sodré's Pink Street.",
        ],
        image: pexelsImage("5143166", "People dancing in a nightclub under neon lights", 1600, 1200),
        places: [
          { name: "LUX Frágil", category: "Nightclub" },
          { name: "Urban Beach", category: "Nightclub" },
          { name: "BOSQ", category: "Nightclub" },
        ],
      },
      {
        title: "Learn to Surf Together",
        body: [
          "Portugal holds the record for the biggest wave ever surfed, but the beginner beaches 20 minutes from Lisbon — Carcavelos, Costa da Caparica and Guincho — are far more forgiving. Lessons run 1.5–2 hours with equipment and instruction included.",
        ],
        image: pexelsImage("2959596", "Men surfing together on a sunny beach", 1600, 1200),
      },
      {
        title: "The Best Rooftop Bars",
        body: [
          "Lisbon's climate and hilltop views make rooftop bars a near year-round pleasure.",
        ],
        image: pexelsImage("8696255", "Silhouette of friends gathered on a rooftop at sunset", 1600, 1200),
        places: [
          { name: "Park Rooftop", description: "Best for sunset and music.", category: "Rooftop Bar" },
          { name: "TOPO Martim Moniz", category: "Rooftop Bar" },
          { name: "Rio Maravilha", category: "Rooftop Bar" },
        ],
      },
      {
        title: "Eat Together",
        body: [
          "For groups, a handful of Lisbon kitchens do big tables particularly well — and for a night in, Chef at Home brings a full Portuguese menu straight to your apartment.",
        ],
        localTip: "Avoid downtown's touristic restaurants — the best are in Chiado, Bairro Alto or Alfama.",
        image: pexelsImage("6955635", "Friends having a good conversation over dinner with wine", 1600, 1200),
        places: [
          { name: "Príncipe do Calhariz", category: "Restaurant" },
          { name: "Time Out Market", category: "Restaurant" },
          { name: "Adega do Tagarro", category: "Restaurant" },
          { name: "Cervejaria Trindade", category: "Restaurant" },
        ],
      },
      {
        title: "Bikes, Tuk-Tuks & Segways",
        body: [
          "Rent bikes for the riverfront below the 25 de Abril Bridge, taking in MAAT and Belém Tower, or hop on a tuk-tuk for a ride through the historic neighbourhoods, the castle and the riverfront. A Segway or GoCar covers the same ground with even less walking.",
        ],
        localTip: "On a tuk-tuk, agree the price before you hop in.",
        image: pexelsImage("29817094", "Colorful tuk-tuks parked along a city street", 1600, 1200),
      },
      {
        title: "LX Factory & Street Art",
        body: [
          "Beneath the 25 de Abril Bridge, LX Factory is a collective of independent stores and cafés in repurposed industrial units — Portuguese goods, vintage furniture and a standout cheesecake.",
          "Lisbon's street art scene has produced two genuine international names: Vhils, known for carving faces into building façades, and Bordalo II, who sculpts from salvaged waste.",
        ],
        localTip: "Rio Maravilha, LX Factory's own rooftop bar, has great city views and art on site.",
        image: pexelsImage("19713490", "Colorful street art graffiti on a city wall", 1600, 1200),
      },
      {
        title: "Free Walking Tours & Football",
        body: [
          "Free walking tours cover Bairro Alto, Chiado, Baixa, the castle and the riverfront, with a separate route through Belém. For football, both Benfica and Sporting's stadiums are about 20 minutes by metro, with match tickets, stadium tours and club stores all open to visitors.",
        ],
        localTip: "Free tours usually start in Rossio or Camões squares around 9–10am — look for the coloured umbrellas.",
        image: pexelsImage("13273106", "Group of people walking together on a city street", 1600, 1200),
      },
      {
        title: "Relax at the Beach",
        body: [
          "Carcavelos is the easiest beach day from the city; Cascais, Costa da Caparica and the award-winning coves of Comporta and Arrábida are all within reach for a longer outing.",
        ],
        image: pexelsImage(
          "10867128",
          "Group of friends relaxing and chatting together on the beach",
          1600,
          1200,
        ),
      },
    ],
  },
  {
    slug: "information-for-travellers",
    template: "travellers",
    title: "Information for Travellers",
    intro:
      "Lisbon is an easy city to plan for, well-prepared for every kind of traveller — but a few practical things are worth knowing before you land.",
    metaTitle: "Information for Travellers | Central Hill",
    metaDescription:
      "Weather, getting into the city, where to stay, local phrases and emergency numbers — the practical know-how for a smooth stay in Lisbon.",
    hero: pexelsImage("29112731", "Luxury private car parked beside a private jet on an airport tarmac"),
    sections: [
      {
        title: "Weather & Best Time to Visit",
        body: [
          "Lisbon is the third-sunniest city in Europe, with around 300 sunny days a year. Peak season runs March to October, with July and August the busiest months. October through mid-March brings fewer crowds and still-mild weather; January is the quietest month of all.",
        ],
        image: pexelsImage(
          "18794098",
          "Aerial panorama of Lisbon's old town rooftops under a clear blue sky",
          1600,
          1200,
        ),
      },
      {
        title: "Getting from the Airport",
        body: [
          "A private transfer is the fastest, most comfortable option — personalised pickup, with a 10% discount for Central Hill guests. A taxi is comfortable but can mean a 30-minute wait; confirm the meter is running. The metro is the budget option, usually at least 45 minutes with a change of line. We don't recommend the Aerobus — it takes longer and stops further from most addresses.",
        ],
        image: pexelsImage("2767767", "Travellers standing inside an airport terminal", 1600, 1200),
      },
      {
        title: "Where to Stay in Lisbon",
        body: [
          "Each neighbourhood has a different rhythm — pick the one that matches your trip.",
        ],
        image: pexelsImage(
          "34155133",
          "Scenic view of Lisbon's Alfama district rooftops and narrow streets",
          1600,
          1200,
        ),
        places: [
          {
            name: "Alfama",
            category: "Neighbourhood",
            description: "The most typical Lisbon — local dining, fado and city views, though steep streets can be hard going for families or less mobile travellers.",
          },
          {
            name: "Príncipe Real / Bairro Alto",
            category: "Neighbourhood",
            description: "Trendy, with the city's best restaurants and nightlife, plus an easy terrace culture by afternoon.",
          },
          {
            name: "Baixa / Chiado",
            category: "Neighbourhood",
            description: "The downtown core — architecture, local shops, cafés and the city's main monuments.",
          },
          {
            name: "Avenida da Liberdade",
            category: "Neighbourhood",
            description: "Premium retail and restaurants, running from Marquês de Pombal down to Restauradores.",
          },
        ],
      },
      {
        title: "Portuguese for Beginners",
        body: [
          "English is widely spoken — it's mandatory in schools from grades 5 to 12, and Portuguese TV uses subtitles rather than dubbing. A few basics still go a long way: Obrigado/a (thank you), Bom dia (good morning), Boa tarde (good afternoon/evening), Boa noite (good night, after sunset), and Adeus (goodbye).",
        ],
        image: pexelsImage("7450476", "Close-up of an open dictionary page", 1600, 1200),
      },
      {
        title: "Business Hours & Traffic",
        body: [
          "Cafés open from around 7am; restaurants serve lunch from noon to 3pm and dinner from 7 to 11pm. Street shops run 9am–7pm (Saturdays until 1pm, closed Sundays); shopping malls stay open until midnight, and museums generally run 10am–5pm, Tuesday to Saturday. Traffic peaks 8–9:30am and 4:30–8pm.",
        ],
        image: pexelsImage(
          "15433586",
          "Crowded Portuguese street scene with pedestrians and shops",
          1600,
          1200,
        ),
      },
      {
        title: "The Lisboa Card",
        body: [
          "The official tourist pass covers unlimited public transport plus free or discounted entry to more than 80 museums and landmarks: €19 for 24 hours, €34 for 48 hours, or €40 for 72 hours (child pricing available). It's sold at the airport, the Lisboa Welcome Center on Praça do Comércio, and Foz Palace — buying online in advance and exchanging a voucher on arrival is the smoothest option.",
        ],
        image: pexelsImage("37555058", "The MAAT Museum in Lisbon at sunset", 1600, 1200),
      },
      {
        title: "Emergency Contacts",
        body: [
          "Police: +351 213 588 300 · Fire Department: +351 213 422 222 · 24h Pharmacy (Avenida Álvares Cabral 1): +351 21 386 3044 · Hospital de São José: +351 21 884 1000 · Hospital Dona Estefânia (paediatric): +351 21 312 6600 · Airport: +351 21 841 3500 · Lost & Found: +351 21 342 7707.",
        ],
        localTip: "For any emergency, dial 112.",
        image: pexelsImage(
          "28223034",
          "Bright yellow and red emergency first-aid sign showing the 112 number",
          1600,
          1200,
        ),
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Write path — mirrors scripts/seed-services.ts.
// ─────────────────────────────────────────────────────────────────────────────

const sameSlugAllLocales = (value: string) => ({ en: value, pt: value, es: value, fr: value });

async function ingestImage(seed: ImageSeed): Promise<string> {
  const res = await fetch(seed.url);
  if (!res.ok) throw new Error(`image fetch failed (${seed.filename}): ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());

  const presigned = await presignUpload({
    filename: seed.filename,
    contentType: "image/jpeg",
    size: bytes.length,
  });

  const put = await fetch(presigned.uploadUrl, {
    method: "PUT",
    headers: { "content-type": presigned.contentType, "cache-control": presigned.cacheControl },
    body: new Uint8Array(bytes),
  });
  if (!put.ok) throw new Error(`R2 PUT failed (${seed.filename}): ${put.status} ${await put.text()}`);

  const asset = await finalizeUpload({ id: presigned.id, r2Key: presigned.r2Key, credit: seed.credit });
  await setSourceContent("media_asset", asset.id, { alt: seed.alt });
  return asset.id;
}

/** Reuse the existing asset if its credit still matches; otherwise upload and replace it. */
async function resolveImage(
  currentId: string | null,
  seed: ImageSeed | undefined,
): Promise<{ id: string | null; action: "kept" | "cleared" | "uploaded" | "replaced" }> {
  if (!seed) {
    if (currentId) {
      const [current] = await db
        .select({ credit: media_asset.credit })
        .from(media_asset)
        .where(eq(media_asset.id, currentId))
        .limit(1);
      if (isSeedOwnedCredit(current?.credit)) {
        await deleteMedia(currentId);
        await deleteContent("media_asset", currentId);
      }
    }
    return { id: null, action: "cleared" };
  }

  if (!currentId) return { id: await ingestImage(seed), action: "uploaded" };

  const [current] = await db
    .select({ credit: media_asset.credit })
    .from(media_asset)
    .where(eq(media_asset.id, currentId))
    .limit(1);
  if (current?.credit === seed.credit) return { id: currentId, action: "kept" };

  const id = await ingestImage(seed);
  if (isSeedOwnedCredit(current?.credit)) {
    await deleteMedia(currentId);
    await deleteContent("media_asset", currentId);
  }
  return { id, action: "replaced" };
}

async function writeGuidePage(cityId: string, position: number, seed: GuidePageSeed): Promise<void> {
  const [existing] = await db
    .select({ id: guide_page.id, hero_media_id: guide_page.hero_media_id })
    .from(guide_page)
    .where(eq(guide_page.slug, seed.slug))
    .limit(1);

  const { id: heroId, action } = await resolveImage(existing?.hero_media_id ?? null, seed.hero);

  const values = {
    city_id: cityId,
    template: seed.template,
    slug: seed.slug,
    status: "published" as const,
    position,
    hero_media_id: heroId,
  };

  let pageId = existing?.id;
  if (pageId) {
    await db.update(guide_page).set({ ...values, updated_at: new Date() }).where(eq(guide_page.id, pageId));
  } else {
    const [ins] = await db.insert(guide_page).values(values).returning({ id: guide_page.id });
    pageId = ins!.id;
  }

  await setSlugs(GUIDE_PAGE, pageId, sameSlugAllLocales(seed.slug));
  await setSourceContent(GUIDE_PAGE, pageId, {
    title: seed.title,
    intro: seed.intro,
    meta_title: seed.metaTitle,
    meta_description: seed.metaDescription,
  });

  // Sections/places have no public identity of their own yet (no admin to link to them),
  // so each run replaces the whole subtree rather than trying to diff it.
  const oldSections = await db
    .select({ id: guide_section.id, header_media_id: guide_section.header_media_id })
    .from(guide_section)
    .where(eq(guide_section.guide_page_id, pageId));
  const oldSectionIds = oldSections.map((s) => s.id);
  const oldPlaces = oldSectionIds.length
    ? await db
        .select({ id: guide_place.id, media_id: guide_place.media_id })
        .from(guide_place)
        .where(inArray(guide_place.guide_section_id, oldSectionIds))
    : [];

  // Image reuse pool. The rows are about to be replaced, but their *images* needn't be:
  // every asset the old subtree pointed at that this script uploaded is indexed by its
  // credit (= the photo it holds), and the new subtree takes from the pool before
  // uploading. Only seed-owned assets enter the pool, so an image a person attached is
  // never reused nor deleted (it simply loses its reference, like before). Assets left
  // unclaimed after the rebuild — the seed dropped or changed that photo — are deleted
  // (R2 object + row + alt), so re-runs neither re-upload nor leak orphans. Section
  // header and place images share the pool; it is per guide page (each asset was uploaded
  // for, and is only referenced from, this page's subtree), so deleting from it is safe.
  const oldMediaIds = [
    ...new Set(
      [...oldSections.map((s) => s.header_media_id), ...oldPlaces.map((p) => p.media_id)].filter(
        (id): id is string => Boolean(id),
      ),
    ),
  ];
  const pool = new Map<string, string>(); // credit → media_asset.id
  if (oldMediaIds.length) {
    const assets = await db
      .select({ id: media_asset.id, credit: media_asset.credit })
      .from(media_asset)
      .where(inArray(media_asset.id, oldMediaIds));
    for (const a of assets) {
      if (isSeedOwnedCredit(a.credit) && !pool.has(a.credit!)) pool.set(a.credit!, a.id);
    }
  }
  const claimed = new Set<string>();
  const acquire = async (img: ImageSeed): Promise<string> => {
    const existingId = pool.get(img.credit);
    if (existingId) {
      if (!claimed.has(existingId)) stats.reused++;
      claimed.add(existingId);
      // Keep the [T] alt in step with the seed (a no-op when unchanged).
      await setSourceContent("media_asset", existingId, { alt: img.alt });
      return existingId;
    }
    const id = await ingestImage(img);
    stats.uploaded++;
    pool.set(img.credit, id); // a second use of the same photo in this page shares it
    claimed.add(id);
    return id;
  };

  if (oldSectionIds.length) {
    for (const p of oldPlaces) await deleteContent(GUIDE_PLACE, p.id);
    for (const s of oldSectionIds) await deleteContent(GUIDE_SECTION, s);
    await db.delete(guide_section).where(eq(guide_section.guide_page_id, pageId)); // cascades places
  }

  for (const [i, section] of seed.sections.entries()) {
    const headerId = section.image ? await acquire(section.image) : null;
    const [sectionRow] = await db
      .insert(guide_section)
      .values({
        guide_page_id: pageId,
        position: i,
        layout: section.places?.length ? "featured_places" : section.image ? "with_media" : "standard",
        header_media_id: headerId,
      })
      .returning({ id: guide_section.id });
    const sectionId = sectionRow!.id;

    await setSourceContent(GUIDE_SECTION, sectionId, {
      title: section.title,
      body: section.body.join("\n\n"),
      local_tip: section.localTip ?? null,
    });

    for (const [pi, place] of (section.places ?? []).entries()) {
      const mediaId = place.image ? await acquire(place.image) : null;
      const [placeRow] = await db
        .insert(guide_place)
        .values({
          guide_section_id: sectionId,
          position: pi,
          category: place.category ?? null,
          address: place.address ?? null,
          phone: place.phone ?? null,
          price_tier: place.priceTier ?? null,
          opening_hours: place.openingHours ?? null,
          media_id: mediaId,
        })
        .returning({ id: guide_place.id });
      await setSourceContent(GUIDE_PLACE, placeRow!.id, {
        name: place.name,
        description: place.description ?? null,
      });
    }
  }

  // Drop the previous run's seed-owned images the new subtree didn't claim (photo removed
  // or changed in the seed). Nothing references them any more: the old rows are gone.
  let removed = 0;
  for (const id of new Set(pool.values())) {
    if (claimed.has(id)) continue;
    await deleteMedia(id);
    await deleteContent("media_asset", id);
    removed++;
  }
  stats.removed += removed;
  if (action === "uploaded" || action === "replaced") stats.uploaded++;
  if (action === "kept") stats.reused++;

  const placeCount = seed.sections.reduce((n, s) => n + (s.places?.length ?? 0), 0);
  const placeImages = seed.sections.reduce((n, s) => n + (s.places ?? []).filter((p) => p.image).length, 0);
  console.log(
    `  guide    ${existing ? "updated" : "created"}  ${seed.slug} (hero ${action}, ${seed.sections.length} sections, ${placeCount} places / ${placeImages} with image, ${removed} stale image(s) removed)`,
  );
}

/** Run-wide image counters (hero + section headers + place photos). */
const stats = { uploaded: 0, reused: 0, removed: 0 };

async function main() {
  // Read the `city` row directly (matching scripts/seed-demo.ts): the geography
  // *contract*'s reads are `unstable_cache`-wrapped and only work inside the Next.js
  // runtime, not a plain script.
  const [lisbon] = await db
    .select({ id: city.id, slug: city.slug })
    .from(city)
    .where(eq(city.slug, "lisbon"))
    .limit(1);
  if (!lisbon) {
    throw new Error("No published 'lisbon' city found — run scripts/seed-demo.ts first.");
  }

  if (process.env.DRY) {
    const rows = await db.select({ slug: guide_page.slug }).from(guide_page).orderBy(asc(guide_page.position));
    console.log(`DRY: would write ${GUIDES.length} guide pages for city '${lisbon.slug}'.`);
    console.log(`     existing: ${rows.length} guide pages (no writes made).`);
    return;
  }

  console.log(`seeding guide pages for city '${lisbon.slug}' (uploading covers to R2 where missing)…`);
  for (const [i, seed] of GUIDES.entries()) {
    await writeGuidePage(lisbon.id, i, seed);
  }
  console.log(
    `\n✓ ${GUIDES.length} published guide pages. Images: ${stats.uploaded} uploaded, ${stats.reused} reused, ${stats.removed} stale removed.\n  Next: /${"en"}/guides → the city's guide cards.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
