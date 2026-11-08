import assert from "node:assert/strict";
import test from "node:test";
import { resolveMediaAlt } from "@core/media/alt";
import {
  checkBlogEnvelope,
  prepareBlogTarget,
  sharedBlogValuesMatch,
} from "../server/post-locale-validation";
import {
  emptyPostEnvelope,
  changePostField,
  type PostWorkspace,
} from "../admin/ui/post-editor-state";
import {
  authorFormValues,
  authorLocalePayload,
} from "../admin/ui/reference-locale-payload";
import { authorSaveInput } from "../admin/validation";

const photo = "d3010000-0000-4000-8000-000000000001";
const nextPhoto = "d3010000-0000-4000-8000-000000000002";

test("old Blog snapshots remain byte-shape compatible; new descriptions validate without shared photo changes", () => {
  const old = emptyPostEnvelope(photo, photo);
  assert.deepEqual(checkBlogEnvelope(old).envelope, old);
  const next = structuredClone(old);
  next.content.media_alts = { [photo]: "  Lisbon rooftops  " };
  const checked = checkBlogEnvelope(next).envelope!;
  assert.equal(checked.content.media_alts?.[photo], "Lisbon rooftops");
  assert.equal(sharedBlogValuesMatch(checked, old), true);
  next.content.media_alts[photo] = "a".repeat(501);
  assert.equal(checkBlogEnvelope(next).envelope, undefined);
  next.content.media_alts = { "not-a-media-id": "Description" };
  assert.equal(checkBlogEnvelope(next).envelope, undefined);
});

test("a first target adopts EN descriptions, own target text survives EN and photo replacement", () => {
  const en = emptyPostEnvelope(photo, photo);
  en.content.cover_media_id = photo;
  en.content.media_alts = { [photo]: "English scene" };
  const es = prepareBlogTarget(en, null);
  assert.deepEqual(es.content.media_alts, en.content.media_alts);
  es.content.media_alts = { [photo]: "Escena propia" };
  en.content.media_alts[photo] = "Changed English scene";
  const prepared = prepareBlogTarget(en, es);
  assert.equal(prepared.content.media_alts?.[photo], "Escena propia");
  en.content.cover_media_id = nextPhoto;
  const replaced = prepareBlogTarget(en, es);
  assert.equal(
    resolveMediaAlt(
      replaced.content.media_alts,
      replaced.content.cover_media_id,
      "Existing fallback",
    ),
    "Existing fallback",
  );
  assert.equal(
    resolveMediaAlt(prepared.content.media_alts, photo, "Legacy"),
    "Escena propia",
  );
});

test("changing a Blog ALT edits only the active working copy, leaving saved and public snapshots untouched", () => {
  const source = emptyPostEnvelope(photo, photo);
  source.content.cover_media_id = photo;
  source.content.media_alts = { [photo]: "English" };
  const states = Object.fromEntries(
    (["en", "es", "pt", "fr"] as const).map((locale) => [
      locale,
      {
        model: {
          locale,
          revision: 1,
          templateRevision: locale === "en" ? null : 1,
          draft: null,
          published: structuredClone(source),
          working: structuredClone(source),
        },
        errors: {},
        notice: "",
        conflict: false,
      },
    ]),
  ) as PostWorkspace;
  const next = changePostField(states, "es", "media_alts", {
    [photo]: "Español",
  });
  assert.equal(next.es.model.working.content.media_alts?.[photo], "Español");
  assert.equal(next.es.model.published?.content.media_alts?.[photo], "English");
  assert.equal(next.en, states.en);
  assert.equal(next.pt, states.pt);
  assert.equal(states.es.model.working.content.media_alts?.[photo], "English");
});

test("Author form loads raw four-language ALT without copying EN and keeps omitted legacy payloads valid", () => {
  const values = authorFormValues({
    id: photo,
    slug: "author",
    status: "published",
    avatar_media_id: photo,
    name: "Author",
    bio: null,
    avatar_alts: { en: "Portrait", es: "Retrato pendiente", pt: "", fr: "" },
  });
  assert.deepEqual(values.avatar_alts, {
    en: "Portrait",
    es: "Retrato pendiente",
    pt: "",
    fr: "",
  });
  const payload = authorLocalePayload(values, photo);
  assert.deepEqual(payload.avatar_alts, values.avatar_alts);
  assert.equal(authorSaveInput.safeParse(payload).success, true);
  const legacy = { ...payload };
  delete legacy.avatar_alts;
  assert.equal(authorSaveInput.safeParse(legacy).success, true);
});
