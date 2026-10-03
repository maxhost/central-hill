/**
 * Static content for the 7 real guest services with a detail page today (Airport Transfer,
 * Sintra Tour, Fátima Tour, Boat Tour, Surf Experience, Chef at Home, Luggage Storage).
 *
 * Mirrors `ui/services-listing.tsx`: source content (prices, itineraries, menus, conditions)
 * copied/adapted from the live centralhill.pt service pages, authored once in English and
 * rendered verbatim regardless of locale — no database read, no [T] translation yet. This is
 * an accepted interim gap (matching the listing page) until the backoffice can create/edit/
 * translate services (see slice README → Deferred). `slug` is stable across locales for now.
 */

export interface PriceRow {
  label: string;
  cells: string[];
}

export interface PriceTable {
  columns: string[];
  rows: PriceRow[];
  footnote?: string;
}

export interface OptionItem {
  name: string;
  desc?: string;
}

export interface OptionGroup {
  title: string;
  items: OptionItem[];
}

export interface ItineraryStep {
  time: string;
  title: string;
  text: string;
}

export interface ExtraOption {
  label: string;
  price: string;
  desc: string;
}

export interface Partner {
  name: string;
  desc: string;
  cta: string;
  url: string;
}

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface ServiceContent {
  slug: string;
  category: string;
  /** Iconoir key (kebab-case) — the icon font isn't loaded in the app shell yet, same
   *  deferred gap as `services-listing.tsx`'s card icons. */
  icon: string;
  name: string;
  tagline: string;
  heroImage: GalleryImage;
  durationLabel?: string;
  priceFromLabel?: string;
  intro: string[];
  highlights?: string[];
  itinerary?: ItineraryStep[];
  optionGroups?: OptionGroup[];
  pricing?: PriceTable;
  extras?: ExtraOption[];
  partners?: Partner[];
  notes?: string[];
  gallery?: GalleryImage[];
}

const BOOK_DISCLAIMER =
  "Arranged through your dedicated guest contact — send an enquiry and we'll confirm availability, price and payment.";

export const SERVICES: ServiceContent[] = [
  {
    slug: "airport-private-transfer",
    category: "Arrival",
    icon: "iconoir-car",
    name: "Airport Private Transfer",
    tagline:
      "A driver waiting with your name on a board — door to door, any hour of the day or night.",
    heroImage: {
      src: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1900&q=70",
      alt: "Private car waiting outside the airport at dusk",
    },
    durationLabel: "Available 24/7",
    priceFromLabel: "From €72",
    intro: [
      "The moment you land, your private driver is already watching your flight. One transfer, no queues, no surprises — just a smooth, direct ride between the airport and your apartment door, available around the clock.",
      "Add a return transfer for the day you leave, or ask your guest contact to arrange a pickup from anywhere else in the city.",
    ],
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
    notes: [
      "Extra luggage beyond the included allowance may require a larger vehicle (+€25).",
      "A waiting-time charge of €40 applies from 1h30 after landing.",
      "Free cancellation up to 24 hours before the transfer.",
      BOOK_DISCLAIMER,
    ],
  },
  {
    slug: "sintra-tour",
    category: "Day Trip",
    icon: "iconoir-binocular",
    name: "Sintra Tour",
    tagline:
      "Palaces, cliffs and coastline — Sintra, Cabo da Roca and Cascais in one unhurried day.",
    heroImage: {
      src: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1900&q=70",
      alt: "Fairytale palace and lush gardens in the hills of Sintra",
    },
    durationLabel: "Full day · ~8 hours",
    priceFromLabel: "From €65 / person",
    intro: [
      "A full day with a private driver-guide through Sintra's fairytale hills, the dramatic cliffs of Cabo da Roca — mainland Europe's westernmost point — and the seafront promenade of Cascais.",
      "The pace is yours: linger longer at one stop, as long as you're back in Lisbon by early evening.",
    ],
    itinerary: [
      { time: "08:30", title: "Pickup", text: "Your driver-guide meets you at the apartment." },
      {
        time: "08:30 – 12:30",
        title: "Sintra",
        text: "Explore the National Palace and either Pena Palace or Quinta da Regaleira — we suggest choosing one; Sintra rewards an unhurried visit.",
      },
      { time: "12:30 – 13:30", title: "Lunch", text: "A stop to enjoy a local meal (not included)." },
      {
        time: "13:30 – 14:30",
        title: "Cabo da Roca",
        text: "Stand at the westernmost point of continental Europe.",
      },
      {
        time: "14:30 – 16:00",
        title: "Cascais",
        text: "A walk along the seafront promenade and marina.",
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
    notes: [
      "Monument tickets and meals are not included.",
      "Free cancellation up to 24 hours before the tour.",
      "Guide available in Portuguese, English or Spanish; a dedicated driver joins for groups over 8.",
      BOOK_DISCLAIMER,
    ],
    gallery: [
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Initiation_Well_in_Quinta_da_Regaleira_-_Sintra_%2816277476688%29.jpg",
        alt: "The spiral Initiation Well at Quinta da Regaleira, Sintra",
      },
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Farol_do_Cabo_da_Roca%2C_Cabo_da_Roca%2C_the_westernmost_point_of_continental_Europe_%2850657181383%29.jpg?width=1200",
        alt: "The lighthouse at Cabo da Roca, the westernmost point of continental Europe",
      },
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/8/8c/View_from_the_Praia_da_Rainha_%28Beach%29_in_Cascais%2C_Portugal.jpg",
        alt: "The seafront promenade and beach at Cascais, Portugal",
      },
    ],
  },
  {
    slug: "fatima-tour",
    category: "Day Trip",
    icon: "iconoir-compass",
    name: "Fátima Tour",
    tagline:
      "Fátima, Batalha, Nazaré and Óbidos — faith, history and the Atlantic coast in a single day.",
    heroImage: {
      src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1900&q=70",
      alt: "Grand sanctuary square under an open sky",
    },
    durationLabel: "Full day · ~9 hours",
    priceFromLabel: "From €86 / person",
    intro: [
      "A day trip to the spiritual heart of Portugal: the Sanctuary of Fátima, the Gothic Monastery of Batalha, the record-breaking waves of Nazaré, and the whitewashed medieval walls of Óbidos.",
    ],
    itinerary: [
      { time: "08:30", title: "Pickup", text: "Your driver-guide meets you at the apartment." },
      {
        time: "08:30 – 12:00",
        title: "Fátima",
        text: "Free time at the Sanctuary and the Basilica of the Most Holy Trinity.",
      },
      {
        time: "12:00 – 14:00",
        title: "Batalha",
        text: "Visit the Monastery of Batalha and stop for lunch (not included).",
      },
      { time: "14:00 – 15:00", title: "Nazaré", text: "See the Guinness World Record waves from the clifftop." },
      { time: "15:00 – 16:30", title: "Óbidos", text: "Wander the medieval walled village." },
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
    notes: [
      "Monument tickets and meals are not included.",
      "Free cancellation up to 24 hours before the tour.",
      "Guide available in Portuguese, English or Spanish; a dedicated driver joins for groups over 8.",
      BOOK_DISCLAIMER,
    ],
    gallery: [
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/b/bd/Batalha_September_2021-2.jpg",
        alt: "The Gothic facade of the Monastery of Batalha",
      },
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/0/01/Nazar%C3%A9_-_Praia_do_Norte_%2825302065368%29.jpg",
        alt: "The record-breaking waves at Praia do Norte, Nazaré",
      },
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/a/a7/Obidos_April_2009-4b.jpg",
        alt: "A whitewashed street inside the medieval walls of Óbidos",
      },
    ],
  },
  {
    slug: "boat-tour",
    category: "On the Water",
    icon: "iconoir-sea-waves",
    name: "Boat Tour",
    tagline: "A private sailboat or catamaran on the Tagus — your route, your hours, your pace.",
    heroImage: {
      src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1900&q=70",
      alt: "Sailboat gliding across the Tagus river at golden hour",
    },
    durationLabel: "2–8 hours",
    priceFromLabel: "From €199",
    intro: [
      "See Lisbon the way it was meant to be seen — from the water. Choose a sailboat or catamaran, pick your duration, and sail past Belém's monuments, the hills of Alfama or out to the open Atlantic off Cascais.",
      "Add a barbecue on board or an open bar to turn the afternoon into something to remember.",
    ],
    optionGroups: [
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
    notes: [BOOK_DISCLAIMER],
  },
  {
    slug: "surf-experience",
    category: "Experience",
    icon: "iconoir-swimming",
    name: "Surf Experience",
    tagline: "A 2.5-hour lesson at Carcavelos beach, built for every level.",
    heroImage: {
      src: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1900&q=70",
      alt: "Surfer riding a clean wave along the Portuguese coast",
    },
    durationLabel: "~2.5 hours",
    priceFromLabel: "€40 / person",
    intro: [
      "Lisbon's mild Atlantic swell makes Carcavelos one of Portugal's best places to learn. An English-speaking instructor takes your group of up to six through the basics on the sand before heading into the water for your first waves.",
    ],
    highlights: [
      "Board, wetsuit and insurance included",
      "One instructor per group of up to 6",
      "If conditions are poor, the instructor can move the lesson to a better beach",
      "Contact available around the clock",
    ],
    pricing: {
      columns: ["Price"],
      rows: [{ label: "Per person", cells: ["€40"] }],
    },
    notes: [
      "Free cancellation up to 24 hours before the lesson.",
      "In case of bad weather the lesson may be relocated, postponed or cancelled — the surf school makes the final call on conditions, with a full refund if it can't be rescheduled.",
      BOOK_DISCLAIMER,
    ],
  },
  {
    slug: "chef-at-home",
    category: "At Home",
    icon: "iconoir-pizza-slice",
    name: "Chef at Home",
    tagline:
      "A three-course Portuguese dinner, cooked in your apartment by someone who's spent a lifetime perfecting it.",
    heroImage: {
      src: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1900&q=70",
      alt: "Chef plating a refined dish in a home kitchen",
    },
    durationLabel: "One evening, in your apartment",
    priceFromLabel: "€35 / person",
    intro: [
      "Be surprised in the comfort of your apartment by the best of Portuguese home cooking.",
      "Central Hill partners with 55+, a local social organisation that champions cooks over 55 — giving experienced home cooks the chance to keep doing what they love, for guests who want a truly authentic meal.",
      "Enjoy a full Portuguese menu — starter, main course, wine, bread and dessert — without leaving home.",
    ],
    optionGroups: [
      {
        title: "Starters — choose one",
        items: [{ name: "Caldo Verde" }, { name: "Leek à Brás" }, { name: "Tomato Soup" }, { name: "Portuguese Cheese Board" }],
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
        items: [{ name: "Apple Tart" }, { name: "\"Baba de Camelo\"" }],
      },
    ],
    pricing: {
      columns: ["Price"],
      rows: [{ label: "Per person", cells: ["€35"] }],
    },
    notes: [
      "Includes one bottle of wine (red or white) for every four guests, plus bread.",
      "A vegetarian adaptation is available on request.",
      BOOK_DISCLAIMER,
    ],
    gallery: [
      {
        src: "https://images.unsplash.com/photo-1591825729269-caeb344f6df2?auto=format&fit=crop&w=1200&q=70",
        alt: "Friends sharing a home-cooked meal together around the table",
      },
    ],
  },
  {
    slug: "luggage-storage",
    category: "Convenience",
    icon: "iconoir-suitcase",
    name: "Luggage Storage",
    tagline: "Two trusted partners so you can enjoy Lisbon right up to your flight — bag-free.",
    heroImage: {
      src: "https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&w=1900&q=70",
      alt: "Neatly stacked suitcases beside a luggage trolley",
    },
    intro: [
      "Your apartment can't hold your bags after check-out, but Lisbon doesn't have to stop there. We've partnered with two trusted companies so you can explore freely until it's time to leave.",
    ],
    partners: [
      {
        name: "Bounce",
        desc: "Secure storage locations across the city — drop your bags off after check-out and collect them whenever suits you.",
        cta: "Find a location",
        url: "https://www.bouncestorage.com",
      },
      {
        name: "Luggit",
        desc: "Door-to-door pickup and delivery, including straight to the airport. Central Hill guests save 10%.",
        cta: "Book with 10% off",
        url: "https://luggit.app",
      },
    ],
    notes: [
      "Luggit is a pickup-and-delivery service — book at least 24 hours ahead.",
      "Request your Luggit pickup before the 11:00 check-out time.",
    ],
  },
];

export function getServiceContent(slug: string): ServiceContent | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export function listServiceSlugs(): string[] {
  return SERVICES.map((s) => s.slug);
}
