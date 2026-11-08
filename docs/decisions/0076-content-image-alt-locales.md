# ADR0076 — Content-owned image ALT in localized forms

2026-11-08. Accepted for the user's image-picker ALT request.

Images remain shared. Descriptions belong to the content and its language, not to
the asset globally. An optional `media_alts: Record<UUID,string>` in the existing
entity content JSON, and `mediaAlts` on a PageEnvelope, stores descriptions by
stable media identity. No schema change, backfill or asset translation write.
The existing locale inheritance/custom and explicit Save draft/Publish lifecycle
applies: drafts cannot alter public ALT or another document using the same photo.
Existing sibling image_alt / Blog body alt fields remain authoritative and keep
their existing controls, without a duplicate ALT control for the same image slot.
Missing/blank values retain the current approved asset ALT / content fallback.

`core/media/alt.ts` is a client-safe public helper/schema: UUID keys, max500 entries,
max500 characters per description. Core change is root-owned. The Backoffice
contract exposes MediaAltProvider/MediaAltField for controlled nested image fields;
only image previews get ALT, never videos, Lottie or documents. No global media
library, generic Translation removal, navigation or role refactor in this task.

Non-tab forms use four language inputs beside their image and existing translation
storage keyed to that owner and `image_alt:<mediaUUID>`. Public targets require approval
and blank targets use EN, then the pre-existing fallback. `core/media/owner-alt.ts`
is the client-safe schema/raw-reader contract; owner-alt-write.ts is the server-only
validated-action write seam. Omitted payloads preserve rows; EN clear preserves targets. Original source/target asset rows remain untouched.
