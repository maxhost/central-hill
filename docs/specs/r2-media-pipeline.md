# Spec — Media pipeline: R2 for images, Cloudflare Stream for video

> **Slices:** kernel `core/media` (ADRs required) · `backoffice` (S12) · `pages`, `buildings` (render fixes)
> **Status:** decisions resolved (§1) — ready to implement, one spike gates §7
> **DB:** one additive migration (§6)

---

## 0. Audit — what already exists

ADR 0018 built most of the upload half. Verified against the tree on 2026-09-12:

| Piece | State |
|---|---|
| `media_asset` table, `alt` as a `[T]` field | ✅ migration `0000` |
| R2 S3 client, presigned direct PUT, finalize, `deleteMedia` | ✅ built |
| Server-side `sharp` dims + blurhash encode on finalize | ✅ built |
| Staff-gated admin actions + `MediaField`/`MediaGalleryField` | ✅ built |
| `sizes` on every `<MediaImage>` call site | ✅ **14/14 verified** — not a gap |
| `sharp` lazy-load + `serverExternalPackages` | ✅ (the Netlify libvips fix) |
| **The bucket, and every `R2_*` env var** | ❌ absent — the pipeline has never run once |
| **Optimised delivery for 13 backoffice-driven images** | ❌ **see §2 — the critical gap** |
| **Any video transcoding capability** | ❌ none, and none is possible on Vercel's runtime |

---

## 1. Decisions (resolved — recorded here, to become ADRs)

**1.1 Bucket jurisdiction: EU.** Consistent with ADR 0015. Immutable after creation. Forces §3.1.

**1.2 Public hostname: the R2 managed `pub-*.r2.dev` URL, not a custom domain.** There is no
Cloudflare zone available — the client's domain still resolves to Avantio's site.

This is safe *because of how we serve images*: with `next/image`, visitors never fetch from R2. The
Vercel optimizer fetches each original **once per (image, width, format)**, caches it, and serves all
traffic from its own edge. r2.dev's rate limit therefore applies to a handful of origin fetches, not
to visitor traffic.

Two conditions make that true, and both are work items here:
- **§2 must be fixed.** The 13 images that currently bypass the optimizer *would* hit r2.dev on every
  page view. Until they go through the optimizer, the premise above is false for them.
- **Video must not be served from r2.dev.** Video never passes through the image optimizer, so every
  visitor would stream megabytes straight from the rate-limited host. §1.3 resolves this.

**Migration cost later is genuinely near-zero:** we store `r2_key`, never absolute URLs, and
`mediaUrl()` composes from `R2_PUBLIC_BASE_URL`. Attaching a custom domain the day a zone exists is
**one env var + a redeploy**, with no content migration. One-time effect: the optimizer's cache keys
change, so images are re-optimised once.

**1.3 Video: Cloudflare Stream.** The deciding fact is not cost, it is that **we have no
transcoding capability at all** — ffmpeg is not viable on Vercel's serverless runtime. R2-only means
whatever the editor uploads is exactly what every visitor downloads; a 40 MB 4K AI-generated clip
would be served verbatim. The only R2-only mitigation is rejecting the upload and asking a
non-technical client to re-export, which will not hold in practice.

Stream gives transcoding, adaptive bitrate, automatic posters and CDN delivery, using the **same
browser-direct upload shape** we already built for R2. Cost at this scale is roughly $5/month storage
(sold in 1,000-minute blocks) plus ~$1 per 1,000 minutes delivered — single-digit dollars for short
loops. **The honest trade-off:** R2 egress is free, Stream delivery is metered; a background loop
autoplaying for every visitor is the one place that could grow, so §11 puts it on the watch list.

⚠️ **Gated on a spike (§7.1).** Rendering a Stream video as a *silent autoplay background loop* is not
something to design blind: the iframe embed is heavy and hard to style, leaving HLS + hls.js or a
direct MP4 URL. The current behaviour of Stream's MP4 download path is **not verified** and the
component design depends on it. One-hour spike, day one, before §7 is built.

**1.4 Hotlinked mock assets stay as fallbacks, not migrated.** Confirmed by the owner. The existing
`media[...]?.url ?? FALLBACK` pattern is already the desired behaviour — the work is to formalise it
(§8), not to move bytes. **This also removes the licensing exposure** raised earlier: we are not
copying third-party assets into our bucket, only continuing to reference them.

**1.5 Image resizing stays on `next/image` / Vercel.** Zero work, portable, and ADR 0018 already
names `MediaImage` as the seam for a future Cloudflare loader. Revisit only if the transformation
meter says so (§11).

**1.6 Alt text is in scope.** `media_asset.alt` is validated but written by no UI, so every image on
an SEO-critical multilingual site ships with an empty alt today.

---

## 2. 🔴 THE CRITICAL GAP — 13 backoffice images bypass the optimizer entirely

**Nine public pages are built as HTML strings and injected with `dangerouslySetInnerHTML`.** Inside
them, images are raw `<img src="${url}">`. Thirteen of those take their `src` straight from a
`media_asset` — i.e. from what the client uploads in the backoffice:

| File | Images |
|---|---|
| `pages/ui/owners-page.tsx` | hero, services, dashboard |
| `pages/ui/real-estate-page.tsx` | hero + a shared section helper (asset, capabilities) |
| `pages/ui/guest-page.tsx` | welcome |
| `buildings/ui/buildings-listing.tsx` | card covers (**every building**) |
| `buildings/ui/building-detail.tsx` | cover, hero, **whole gallery** |
| `pages/ui/components/dual-cta.tsx` | owner + guest panels (Home, JSX not string) |
| `pages/ui/components/guests-section.tsx` | showcase (Home, JSX not string) |

**Consequence:** every photo the client uploads for the portfolio — the most image-heavy, most
commercially important part of the site — is served as the **raw original**: no `srcset`, no
AVIF/WebP, no width/height (so CLS), no blurhash, no lazy-loading control. **Arc 2's entire goal is
defeated for the catalog**, and r2.dev would be hit directly on every page view (§1.2).

### 2.1 The fix — `mediaImgTag()` in the kernel

Do **not** rewrite nine pages back into JSX: large, risky, touches many slices for no user-visible
gain. Instead add one kernel helper that produces an optimised `<img>` **as an HTML string**, so it
drops into the existing templates.

Build it on **`getImageProps()` from `next/image`** — the official API for exactly this case. It
returns the computed `src`, `srcSet`, `sizes` and dimensions for use with a plain `<img>`, so we get
the optimizer without hand-assembling `/_next/image` URLs or coupling to that URL format.

The helper must:
- emit `srcset` + `sizes` + explicit `width`/`height` (CLS) + `loading`/`decoding`/`fetchpriority`;
- escape every attribute exactly as the existing `esc`/`escAttr` helpers do;
- **pass external fallback URLs through untouched** — Unsplash already serves
  `?auto=format&w=...&q=70` from its own CDN, so re-optimising it costs money and gains nothing;
- fall back to `public/placeholders/*.svg` when there is neither asset nor fallback.

For the two JSX components (`dual-cta`, `guests-section`) the fix is simpler: use `<MediaImage>`
directly when an asset exists, raw `<img>` only on the external-fallback branch.

---

# ARC 1 — The integration

## 3. Provisioning, and two latent bugs

### 3.1 🐛 The S3 endpoint is hardcoded — an EU bucket is unreachable
`core/media/server/r2.ts` builds `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`. An
EU-jurisdiction bucket (§1.1) is served from a **different hostname**, so presign would mint URLs
pointing nowhere and every upload would fail.

**Fix:** add `R2_S3_ENDPOINT` to the env schema and prefer it when set, keeping today's string as the
fallback. Copy the value from the endpoint the R2 dashboard shows for **this** bucket — do not
assemble it from a guessed pattern. Kernel change → ADR.

### 3.2 Create the bucket
- `central-hill-media`, **EU jurisdiction**.
- Enable the **public development URL**; record it as `R2_PUBLIC_BASE_URL`.
- **API token scoped to Object Read & Write on this one bucket** — never an account-wide token.
- ⚠️ **Verify on day one** that the public dev URL is in fact offered for an EU-jurisdiction bucket.
  It is expected to be, but it is unverified and it blocks everything downstream.

### 3.3 CORS — without it, every upload fails in the browser
The admin PUTs directly from the browser. Allow `PUT` from `http://localhost:3000`, the deployed
admin origin, and the future backoffice host. Allow the `content-type` **and `cache-control`**
headers (§3.4 adds the second), expose `etag`, set a sane `MaxAgeSeconds`.

### 3.4 🐛 Uploaded objects carry no `Cache-Control`
`presignUpload` signs only `Bucket`, `Key`, `ContentType`. Objects then serve with no cache
directive — yet these keys are **immutable by construction**: `r2_key` is `${uuid}/${filename}` and
a replacement gets a new uuid.

**Fix:** sign `CacheControl: "public, max-age=31536000, immutable"` into the `PutObjectCommand` and
send the matching header from the upload island. A signed header the browser omits makes R2 **reject
the request**, so both sides change together — and this is why §3.3 must allow `cache-control`.

### 3.5 Env vars, and a sharp edge that fails silently
Set in `.env` and in Vercel for **all three environments**: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`, `R2_S3_ENDPOINT`, plus the Stream vars
(§7.2).

⚠️ `next.config.ts` reads `R2_PUBLIC_BASE_URL` **at build time** to compute `images.remotePatterns`.
Missing at build → the list is `[]` → **every optimised R2 image 400s at runtime**, with correct-looking
env vars present, because they arrived too late. Add a build-time assertion so this fails loudly.

## 4. Closing the pipeline gaps

### 4.1 A real media library — `/admin/media`
`deleteMedia` exists and **nothing calls it**: assets can be created but never browsed, reused or
removed, so orphans accumulate from the first upload. Build a paginated library (newest first,
filter by kind, show dims/bytes/mime) with reuse and delete.

**Delete must be reference-safe.** ADR 0018 explicitly defers refcount GC to the admin slices, so it
is this spec's job: check every `*_media_id` column and `media_id[]` array across slices and refuse
with the list of referencing entities. A blind delete silently blanks a live page.

### 4.2 Reuse in the pickers
`MediaField`/`MediaGalleryField` can only upload new files — picking the same logo twice uploads it
twice. Add a "choose existing" mode backed by the library.

### 4.3 Alt-text authoring (§1.6)
Alt editor in the library, written through the `core/i18n` seam (ADR 0019) as a `[T]` field so it
joins the existing translation pipeline for all four locales.

### 4.4 Orphan sweep
A staff-triggered report — not a cron — listing rows referenced by nothing and R2 objects with no
row. Manual review, explicit deletion.

---

# ARC 2 — Making it fast

## 5. Upload-time normalisation (amends ADR 0018)

ADR 0018 says *only the original lands in R2*. Fine for a 2 MB export, bad for the 12 MB 6000×4000
JPEG a photographer will send: every new size/format re-reads the whole original.

On finalize, **images only**:
1. Re-read the object (R2 egress is free; the code already does this for metadata).
2. `sharp`: cap the longest edge at **3000px**, re-encode at high quality, **apply EXIF orientation
   and then strip EXIF** (an unrotated portrait is the classic bug here), keep the colour profile.
3. Write the normalised master back to the same key; record its real dimensions and `bytes`.
4. **Skip entirely when the original is already within budget**, so a hand-tuned export is never
   re-compressed.

Cost: one extra PUT per image, at staff volume. Benefit: the optimizer's source shrinks by an order
of magnitude.

## 6. Migration (one additive file)

```
ALTER TABLE media_asset
  ADD COLUMN storage          text NOT NULL DEFAULT 'r2',   -- 'r2' | 'stream'
  ADD COLUMN stream_uid       text,
  ADD COLUMN bytes            integer,
  ADD COLUMN duration_seconds integer,
  ADD COLUMN poster_media_id  uuid;
ALTER TABLE media_asset ALTER COLUMN r2_key DROP NOT NULL;
ALTER TABLE media_asset ADD CONSTRAINT media_asset_storage_ck CHECK (
  (storage = 'r2'     AND r2_key     IS NOT NULL) OR
  (storage = 'stream' AND stream_uid IS NOT NULL)
);
```

Dropping `NOT NULL` is a **widening** — no data loss, and existing rows are all `storage='r2'`. It is
still a change to an existing column, so it is covered by the ADR per golden rule 4. Numbered next in
sequence; **run `pnpm db:check` first** (this repo has a known journal-ordering trap).

## 7. Video on Stream

### 7.1 ⚠️ Spike first — one hour, gates everything below
Determine how to render a Stream asset as a **muted autoplay background loop**: direct MP4 URL vs
HLS + `hls.js` vs the iframe embed, and what each costs in bytes and control. **Do not build §7.3
before this is answered.** The finding goes in the ADR.

### 7.2 Upload path
Stream's **Direct Creator Upload** mints a one-time upload URL — the same architecture as our R2
presign, so `MediaField` changes shape very little. New env: `CF_STREAM_ACCOUNT_ID`,
`CF_STREAM_API_TOKEN` (scoped to Stream only), `CF_STREAM_CUSTOMER_SUBDOMAIN`.

⚠️ **Stream is asynchronous.** After upload the video is queued and transcoding; it is **not
immediately playable**, so finalize cannot simply HEAD it the way R2 does. The admin needs a
`processing` state, a status poll, and a preview that appears when ready. This is real UX work, not a
detail — budget for it.

### 7.3 Render
- `MediaVideo` in the kernel, choosing its source by `storage`.
- Poster always present — from Stream's generated thumbnail, or `poster_media_id`.
- `preload="none"` so the poster paints first and the loop streams after.
- **Respect `prefers-reduced-motion`:** show the poster, skip the loop. The hero currently autoplays
  unconditionally, which is an accessibility gap as well as a bandwidth one.

### 7.4 Retire the R2 video path
With Stream in place, drop `video/*` from the R2 mime allowlist and the 200 MB cap. Two backends, one
job each, no ambiguity about where a video lives.

## 8. Formalising the fallbacks (§1.4)

Today ~12 `*_FALLBACK_*` constants are scattered across five page files, with inconsistent
precedence (`??` in some places, `||` in others — these differ when the value is an empty string).

- Move them to **one module per slice**, adjacent to the page that uses them, clearly marked as mock
  art pending real photography.
- Make precedence uniform and explicit: **R2 asset → fallback URL → placeholder SVG**.
- `mediaImgTag()` (§2.1) must **not** route external fallbacks through our optimizer.
- `mediaUrl()` currently falls back to a root-relative `/${r2Key}` when `R2_PUBLIC_BASE_URL` is
  unset — a guaranteed 404 rendering as a broken image. Route that through the placeholders too.

## 9. Render-time

### 9.1 🔴 The blurhash is computed, stored, queried, shipped — and never rendered
Every slice selects `blurhash` into `MediaImageData`. `core/media/image.tsx` **never reads it**. We
pay to encode it, store it, join it and serialise it into every page's RSC payload, and the visitor
still sees a blank box.

Decode it to a tiny raster and hand `next/image` `placeholder="blur"` + `blurDataURL`. Because public
pages are ISR, the decode lands at build time, not per request. **~15 lines in one kernel file, and
the best effort-to-impact ratio in this spec** — which is why §12 ships it first.

### 9.2 LCP discipline
`priority` is set in three components today. Audit every above-the-fold image and ensure **exactly
one** LCP element per page carries it — over-marking is as harmful as under-marking. Add
`fetchPriority="high"` on the hero and a `preconnect` to the media host.

### 9.3 Formats and quality
Confirm `images.formats` puts AVIF ahead of WebP. **Next 16 requires allowlisting quality values via
`images.qualities`** — verify against the installed `next@^16.2.9` before relying on a non-default
`quality`; an unlisted value is rejected, not silently accepted.

---

## 10. Ops

- **Runbook** `docs/ops/media.md`: bucket settings, CORS JSON, both token scopes + rotation, Stream
  account config, what to do when an upload fails or a video stays stuck in `processing`.
- **Budgets**, checked in review: hero image ≤200 KB at 1440px, card ≤60 KB, LCP < 2.5 s on 4G,
  CLS ≈ 0.
- **Two meters to watch monthly:** Vercel image transformations (§1.5) and Stream delivery minutes
  (§1.3). Both are the trip-wires for revisiting a decision.

## 11. Verification

1. **Upload, real browser:** image + video via the admin against the real bucket/account. Object
   lands, row inserted, dims/blurhash/bytes populated, `Cache-Control` present on the response.
2. **CORS:** upload from localhost *and* the deployed admin. A missing origin must fail loudly.
3. **Delete safety:** deleting an in-use asset is refused with the referencing list.
4. **§2 regression — the one that matters:** upload a deliberately huge image via the backoffice for
   a building, then confirm on the live page that the delivered bytes are optimised, `srcset` is
   present, AVIF is negotiated and `width`/`height` are set. This is the test that proves arc 2
   actually works end to end.
5. **Blurhash visible mid-load**, screenshotted.
6. **Video:** poster paints first; reduced-motion shows the poster only; measure transferred bytes.
7. **Headless-Chrome sweep** over Home, Owners, Guests, Real Estate, Buildings, a building detail,
   Blog and Guides: zero console errors, no broken images, LCP recorded per page.
8. `pnpm typecheck && pnpm lint && pnpm build` green.
9. **Rollback:** unsetting `R2_PUBLIC_BASE_URL` degrades to placeholders, never to a broken build.

### 11.1 Doc corrections this work must make
- **ADR 0003 says Netlify; production runs on Vercel.** Correct it — §1.5 reasons about which
  optimizer bills us, so the hosting record must match reality.
- ADR 0018's "only the original lands in R2" is amended by §5; its video assumptions by §7.
- `docs/architecture.md:61` claims images are "stored in R2, served through the image pipeline" —
  true of the code, false of reality until this ships.

## 12. Sequencing

| # | Step | Depends on | Why here |
|---|---|---|---|
| 1 | **Blurhash wiring (§9.1)** | nothing | Visible win, no bucket, no decisions, no migration |
| 2 | **`mediaImgTag()` + 13 call sites (§2)** | nothing | Unblocks §1.2's premise; biggest correctness win |
| 3 | Bucket + token + CORS + env (§3.2–3.5) | 1.1 | Nothing visible yet |
| 4 | Endpoint + Cache-Control fixes (§3.1, §3.4) | 3 | First real upload can only work after these |
| 5 | Normalisation (§5) + migration (§6) | 4 | — |
| 6 | Media library, safe delete, reuse (§4.1–4.2) | 4 | The backoffice gap closes |
| 7 | Alt authoring (§4.3) + orphan sweep (§4.4) | 6 | SEO/a11y |
| 8 | **Stream spike (§7.1)** | — | Can run in parallel from day one |
| 9 | Stream upload + render (§7.2–7.4) | 6, 8 | — |
| 10 | Fallback formalisation (§8) | 2 | — |
| 11 | LCP/formats audit (§9.2–9.3) | 2, 5 | Measure last, once sources are right |

**Steps 1, 2 and 8 need no infrastructure and no decisions** — they can start immediately while the
bucket and the Stream account are being created.

## 13. ADRs to write

| ADR | Subject |
|---|---|
| 0024 | R2 provisioning: EU jurisdiction, r2.dev now / custom domain later, scoped token, immutable cache policy, endpoint from env |
| 0025 | Upload-time normalisation (amends 0018) |
| 0026 | Video on Cloudflare Stream: new vendor, `media_asset` becomes two-backend, R2 video path retired |
| 0027 | Optimised delivery inside HTML-string page builders (`getImageProps` → `mediaImgTag`) |
| 0003 | Correction: production hosting is Vercel, not Netlify |

## 14. Definition of Done

- [ ] Every §1 decision recorded as an ADR, not as an implementation detail.
- [ ] Kernel changes each covered by an ADR (golden rule 3).
- [ ] Migration additive + numbered, `pnpm db:check` clean, CHECK constraint verified.
- [ ] No slice edits another slice's files; the library lives in `backoffice`.
- [ ] i18n keys for **en, pt, es, fr** on every new admin string.
- [ ] **Zero backoffice-driven image bypasses the optimizer** (§2) — verified by §11.4, not asserted.
- [ ] §11 recorded with screenshots and per-page LCP numbers.
- [ ] Runbook written; both token scopes and rotation documented.
