# R2 media pipeline — provisioning runbook (spec §12 steps 3–7)

Companion to `docs/specs/r2-media-pipeline.md`. That document says *what* and *why*; this one is the
ordered checklist for actually turning it on. **Steps 1–2 are already shipped** (`94e227a`,
`fca3667`, ADR 0027) — the render side is done and inert until the first real upload exists.

Two columns of work run here:

| | Owner (dashboard work — nobody else can do it) | Agent (code) |
|---|---|---|
| A | Create bucket, public URL, token, CORS | — |
| B | Load env vars into Vercel + `.env` | — |
| C | — | Endpoint fix, Cache-Control fix, build assertion |
| D | — | Migration, normalisation, media library |

**Status (2026-09-12):** A1–A3 done, B local `.env` done and verified against the live bucket, **C
done** (ADR 0024). Outstanding for the owner: **A4 (CORS)** and **B1 (Vercel variables)**.

---

## STEP 0 — the day-one blocker ✅ CLOSED

The open question was whether Cloudflare offers the public `r2.dev` development URL for an
**EU-jurisdiction** bucket, since the whole public-host decision rests on it (spec §1.2).

**It does.** The bucket is live on `…eu.r2.cloudflarestorage.com` with a working
`https://pub-*.r2.dev` public URL, verified by a full round trip. No fallback to a custom domain is
needed.

---

## STEP A — Cloudflare R2 (dashboard)

### A1. Create the bucket

Cloudflare dashboard → **R2** → *Create bucket*.

| Field | Value |
|---|---|
| Name | `central-hill-media` |
| Location / Jurisdiction | **European Union** |

⚠️ **Jurisdiction is immutable after creation.** Getting this wrong means creating a new bucket and
re-uploading everything. Data residency is ADR 0015; this is not optional.

### A2. Enable the public development URL

Bucket → **Settings** → *Public access* → **R2.dev subdomain** → Allow access.

Copy the resulting URL. It looks like `https://pub-<hash>.r2.dev`.
→ this is **`R2_PUBLIC_BASE_URL`** (no trailing slash).

> Why the managed URL and not a custom domain: the client's domain still points at Avantio and there
> is no Cloudflare zone. It is safe *because* `next/image` shields R2 — the optimizer fetches each
> original once per (image, width, format), so visitors never hit `r2.dev`. Moving to a custom domain
> later is one env var + a redeploy, because we store `r2_key` and never absolute URLs.

### A3. Create a scoped API token

R2 → **Manage API tokens** → *Create API token*.

| Field | Value |
|---|---|
| Permission | **Object Read & Write** |
| Scope | **Apply to specific buckets only → `central-hill-media`** |
| TTL | no expiry (rotate manually) |

🔒 **Never an account-wide token.** This credential reaches a browser-facing presign path; its blast
radius must be one bucket.

The result screen shows three things you need — **copy all three now, the secret is shown once**:

| Shown as | Goes into |
|---|---|
| Access Key ID | `R2_ACCESS_KEY_ID` |
| Secret Access Key | `R2_SECRET_ACCESS_KEY` |
| Endpoint / "Use jurisdiction-specific endpoints for S3 clients" | `R2_S3_ENDPOINT` |

**Copy the endpoint the dashboard shows — do not assemble it from a pattern.** An EU bucket does
*not* live on the generic `https://<account>.r2.cloudflarestorage.com` host the code used to
hardcode — confirmed against this bucket, where that host returns `NotFound`. Ours is
`…<account>.eu.r2.cloudflarestorage.com`. With the wrong host, presign mints URLs pointing nowhere
and every single upload fails (spec §3.1, fixed in C1).

`R2_ACCOUNT_ID` is the Account ID from the R2 overview page (also in the dashboard URL).

### A4. CORS — without this, every upload fails in the browser

The admin uploads **straight from the browser to R2**, so the bucket must accept it.

Bucket → **Settings** → *CORS policy* → Edit → paste:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://central-hill-umber.vercel.app"
    ],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type", "cache-control"],
    "ExposeHeaders": ["etag"],
    "MaxAgeSeconds": 3600
  }
]
```

Notes:
- 🔴 **`cache-control` is load-bearing, not hygiene.** The upload island now sends it and it is part
  of the request signature, so the browser will ask for it at preflight and the upload is blocked
  outright if the bucket does not allow it. Same for `content-type`. This is not optional.
- Add the production domain to `AllowedOrigins` the day the site moves off the `.vercel.app` host.
- **Vercel preview deployments get a unique URL each time**, and CORS origins cannot be wildcarded
  mid-string. So uploads will work **locally and in production, not from a preview deploy**. That is
  acceptable — the backoffice is staff-only and previews are for review — but don't file it as a bug.

---

## STEP B — Load the variables

Six variables, same values in all environments:

```
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID          ← secret
R2_SECRET_ACCESS_KEY      ← secret
R2_BUCKET                 = central-hill-media
R2_PUBLIC_BASE_URL        = https://pub-<hash>.r2.dev
R2_S3_ENDPOINT            ← copied from A3, NOT guessed
```

All six are already in the local `.env` and verified against the live bucket. What is left is
loading them into **Vercel**.

### B1. Vercel — via the dashboard (recommended)

1. Vercel → the **central-hill** project → **Settings** → **Environment Variables**.
2. For each variable: *Key*, *Value*, and tick **all three** of Production / Preview / Development.
3. Mark the two credentials as **Sensitive** so the value can't be read back.
4. Save.

⚠️ **Adding a variable does not change any existing deployment.** You must **redeploy** afterwards:
Deployments → latest → ⋯ → *Redeploy*. If the push-to-main webhook is being flaky again, an empty
commit re-triggers it:

```bash
git commit --allow-empty -m "chore: redeploy for R2 env" && git push
```

### B2. Vercel — via the CLI (equivalent)

```bash
cd /Users/maxi/claude-workspace/central-hill
vercel link                       # one-off, links this dir to the project

# repeat per variable × per environment (it prompts for the value)
vercel env add R2_BUCKET production
vercel env add R2_BUCKET preview
vercel env add R2_BUCKET development

vercel env ls                     # verify
vercel --prod                     # redeploy so the build picks them up
```

### B3. Local

```bash
vercel env pull .env.local        # pulls what you just set
```

or append the same six lines to `.env` by hand — `.env.example` documents all six. **Already done
locally.**

### B4. 🔴 The trap that makes everything look fine and still break

`next.config.ts` reads `R2_PUBLIC_BASE_URL` **at build time** to compute
`images.remotePatterns`. If it is missing *at the moment the build runs*, the list is `[]` — and then
**every optimised R2 image returns 400 at runtime**, while the dashboard shows the variable present
and correct. The variable arrived, just too late.

Concretely, this means:
- set the variables **before** you redeploy, not after;
- any environment that builds without it produces a broken-images deployment.

C3 added a build-time assertion, so this now fails loudly at build instead of silently in
production. Verified in both directions: without the variable the build stops with an actionable
message; with it, all 99 pages prerender.

---

## STEP C — code fixes ✅ DONE

| # | Change | Spec | Kernel? |
|---|---|---|---|
| C1 | `R2_S3_ENDPOINT` in the env schema, preferred by `core/media/server/r2.ts` over today's hardcoded host (kept as fallback). `.env.example` updated. | §3.1 | yes → ADR 0024 |
| C2 | `Cache-Control: public, max-age=31536000, immutable` on every upload — signed **and** echoed by `media-field.tsx`. Keys are `${uuid}/${filename}`, immutable by construction, so a 1-year immutable cache is a fact rather than a bet. | §3.4 | yes |
| C3 | Build-time assertion for §B4. | §3.5 | yes |

**All three are done** (ADR 0024) and verified end to end against the live bucket: presign → PUT →
finalize → public GET → delete.

> The spec was wrong about C2 in a way only probing the real bucket revealed. Setting `CacheControl`
> on the command does **nothing** on its own: by default the presigner signs `host` alone, hoists
> nothing into the query string, and a PUT with *no headers at all* returns 200 and stores the object
> **with no cache directive**. The directive is whatever the browser sends. Both headers are now in
> `signableHeaders`, so omitting or tampering with either is a 403 at upload time instead of a
> silent, permanent misconfiguration. That is exactly why A4 is not optional.

After A4 + B1, **the first real upload from the backoffice can succeed.**

---

## STEP D — the rest, in order

| # | Work | Depends on | Notes |
|---|---|---|---|
| D1 | **Migration** — `storage`/`stream_uid`/`bytes`/`duration_seconds`/`poster_media_id`, `r2_key` nullable, CHECK constraint | C | Additive + numbered. **Run `pnpm db:check` first** — this repo has a known journal-ordering trap. Widening `r2_key` to nullable touches an existing column → ADR (golden rule 4). |
| D2 | **Upload-time normalisation** — cap the longest edge at 3000px, apply-then-strip EXIF orientation, keep the colour profile, skip when already within budget | C | Amends ADR 0018 ("only the original lands in R2") → ADR 0025. Without it, a 12 MB 6000×4000 JPEG gets re-read whole for every size/format. |
| D3 | **Media library at `/admin/media`** — paginated, filter by kind, dims/bytes/mime | C | `deleteMedia` exists and *nothing calls it*: assets can be created but never browsed, reused or removed, so orphans accumulate from the first upload. |
| D4 | **Reference-safe delete** | D3 | Check every `*_media_id` column and `media_id[]` array across slices; refuse with the list of referencing entities. ADR 0018 explicitly defers refcount GC to the admin slices, so it is this work's job. A blind delete silently blanks a live page. |
| D5 | **Reuse in the pickers** — "choose existing" mode | D3 | Today picking the same logo twice uploads it twice. |
| D6 | **Alt-text authoring** | D3 | Written through the `core/i18n` seam (ADR 0019) as a `[T]` field, so it joins the translation pipeline for all four locales. |
| D7 | **Orphan sweep** — staff-triggered report, not a cron | D3 | Rows referenced by nothing, R2 objects with no row. Manual review, explicit deletion. |

---

## Video (spec §7) — separate track, separate account

Cloudflare **Stream**, not R2. Not a cost call: we have *no* transcoding capability at all (no ffmpeg
on Vercel serverless), so R2-only means whatever the client uploads is what every visitor downloads.
~$5/mo + ~$1 per 1,000 delivered minutes.

- Needs its own env: `CF_STREAM_ACCOUNT_ID`, `CF_STREAM_API_TOKEN` (scoped to Stream only),
  `CF_STREAM_CUSTOMER_SUBDOMAIN` — loaded exactly as in step B.
- ⚠️ **Stream is asynchronous.** After upload the video is queued and transcoding; it is *not*
  immediately playable, so finalize cannot HEAD it the way R2 does. The admin needs a `processing`
  state, a status poll and a preview that appears when ready. Real UX work, not a detail.
- The ~1h spike — how to render a Stream video as a muted autoplay background loop — **needs no
  account and no decisions**, and gates the `MediaVideo` design. It can run in parallel with all of
  the above.

---

## Done means

- [ ] An image uploaded in `/admin` appears on a public page, served from `/_next/image`, with
      `srcset`, correct dimensions and a blur placeholder.
- [ ] Nothing in the emitted HTML points at `pub-*.r2.dev` directly.
- [ ] Deleting a referenced asset is refused, with the referencing entities named.
- [ ] Both token scopes and the rotation procedure are written down.
- [ ] ADRs 0024–0026 written (0027 already is).
