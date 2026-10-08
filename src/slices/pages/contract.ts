/**
 * Public contract of slice `pages` (S9) — the ONLY surface other slices may import.
 *
 * `pages` owns the five **editable fixed marketing pages** (Home, Owners, Real Estate,
 * About, Guest landing) plus the `blog` and `guides` rows (the copy those sections show outside
 * a post/guide: the sidebar CTAs), stored one row per `key` in `page_content`, each validated by a
 * fixed per-page Zod schema (ADR 0012 / docs/data-model.md → Page content model). The
 * slice is **pure composition**: it reads its own `page_content` rows and resolves their
 * [T] blocks + media, then its UI embeds the dynamic/shared pieces through *other slices'
 * contracts* (buildings featured, testimonials, faq, services, settings) — it never holds
 * foreign tables. See docs/vertical-slices.md → S9.
 *
 * Has no read of another slice's internals: the page-section components call the embedded
 * slices' own cached+tagged queries, so a publish in those slices busts the composed page
 * automatically (Next associates a route's full-route cache with every data-cache tag read
 * during render). This contract therefore only owns the `page:<key>` tag.
 */
import type { MediaImageData } from "@core/media";
import type {
  AboutContent,
  GuestContent,
  HomeContent,
  OwnersContent,
  PageKey,
  RealEstateContent,
} from "./schemas";

/** Entity type used for translation keys (`block:<dot.path>`) and cache tags. */
export const PAGE_CONTENT = "page_content" as const;

/**
 * Cache tag this slice owns — one singleton per page `key` (conventions.md → Cache
 * tags). On save+publish the admin (S12) busts `page:<key>` and revalidates the path.
 */
export const PAGE_TAGS = {
  page: (key: PageKey) => `page:${key}`,
} as const;

/**
 * A resolved page: its `content` is the page's fixed schema with every [T] leaf already
 * resolved for the locale (approved target, else source `en`); `media` maps every
 * `*_media_id` referenced in the content to its R2 image data (use `.url` for hero
 * videos); `ogImage` is the optional social-card override.
 */
export interface PageResult<T> {
  content: T;
  media: Record<string, MediaImageData>;
  ogImage: MediaImageData | null;
}

export type HomePage = PageResult<HomeContent>;
export type OwnersPage = PageResult<OwnersContent>;
export type GuestPage = PageResult<GuestContent>;
export type RealEstatePage = PageResult<RealEstateContent>;
export type AboutPage = PageResult<AboutContent>;

/**
 * The CTA at the bottom of a blog post's sticky aside (the `blog` row's `post_aside`), ready for
 * `core/ui` `AsideCta`: copy resolved for the locale, `cta.href` = the locale's `/owners`.
 */
export interface BlogAsideCta {
  eyebrow?: string;
  title: string;
  body?: string;
  cta: { label: string; href: string };
}

/**
 * The accommodation CTA at the bottom of a guide's sticky aside (the `guides` row's
 * `guide_aside`): `cta.href` = the locale's `/buildings`; `image` null → render
 * `GUIDE_ASIDE_FALLBACK_IMAGE`.
 */
export interface GuideAsideCta extends BlogAsideCta {
  image: MediaImageData | null;
}

export type {
  AboutContent,
  GuestContent,
  HomeContent,
  OwnersContent,
  PageKey,
  RealEstateContent,
} from "./schemas";

export {
  getAboutPage,
  getBlogAsideCta,
  getGuestPage,
  getGuideAsideCta,
  getHomePage,
  getOwnersPage,
  getRealEstatePage,
} from "./server/queries";

/** Fallback photo (`{ url, alt }`) for the guide aside CTA while no image is picked. */
export { GUIDE_ASIDE_FALLBACK_IMAGE } from "./schemas/guides";

/**
 * Backoffice contribution (S12). `pagesAdminScreens` is spread into
 * `composeAdminNav` by the admin panel layout; the list + schema-driven editor
 * mount under `app/(admin)/admin/(panel)/pages/…`. Pure data — safe to import anywhere.
 */
export { pagesAdminScreens } from "./admin/screens";

/**
 * The Owners hero's 3-step earnings-estimate wizard: `OwnerEstimateForm` — a self-contained
 * client component (step + property-count state in React) built on `core/ui`'s `form-card`
 * primitives, step-1 copy parameterized (steps 2/3 are fixed, identical on every consumer).
 * Any slice embedding this same wizard (e.g. Buildings' listing "earnings calculator") just
 * renders it — once per page (its field ids are fixed). It replaced the former
 * `OwnerEstimateForm` markup + `EstFormStepper`/`EstFormWizard` DOM-island trio; those two
 * exports are gone (nothing to mount any more).
 */
export { OwnerEstimateForm } from "./ui/components/owner-estimate-form";
