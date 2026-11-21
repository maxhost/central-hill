import assert from "node:assert/strict";
import { test } from "node:test";
import {
  defaultLegalPage,
  LEGAL_PAGE_KEYS,
  legalPageDescriptor,
  legalPageDraftSchema,
  legalPagePublishSchema,
  pickLegalPageSnapshot,
} from "../legal-page-content";
import { prepareTargetEnvelope, sharedEnvelope } from "../editorial-content";
import type { PageEnvelope } from "../editorial-types";

const envelope = (text: string): PageEnvelope<"privacy_policy"> => ({
  schemaVersion: 1,
  ogImageMediaId: null,
  content: {
    title: text,
    body: [{ type: "paragraph", text }],
    seo: { meta_title: text, meta_description: text },
  },
});

test("legal defaults are editable drafts and never publish empty policy text", () => {
  for (const key of LEGAL_PAGE_KEYS) {
    assert.ok(legalPageDraftSchema.safeParse(defaultLegalPage(key)).success);
    assert.equal(
      legalPagePublishSchema.safeParse(defaultLegalPage(key)).success,
      false,
    );
  }
  assert.equal(
    legalPagePublishSchema.safeParse({
      ...envelope(" ").content,
      body: [{ type: "divider" }],
    }).success,
    false,
  );
  assert.ok(
    legalPagePublishSchema.safeParse(envelope("Authored policy").content)
      .success,
  );
});

test("Rich policy schema rejects unsafe links, unsupported media and divergent formatted text", () => {
  const content = envelope("Policy").content;
  const malicious = {
    ...content,
    body: [
      {
        type: "paragraph",
        text: "click",
        inline: [{ text: "click", href: "javascript:alert(1)" }],
      },
    ],
  };
  assert.equal(legalPageDraftSchema.safeParse(malicious).success, false);
  assert.equal(
    legalPageDraftSchema.safeParse({
      ...content,
      body: [
        { type: "image", media_id: "4f9ea77f-021d-4d69-8c47-392b9db260ad" },
      ],
    }).success,
    false,
  );
  assert.equal(
    legalPageDraftSchema.safeParse({
      ...content,
      body: [
        {
          type: "paragraph",
          text: "plain",
          inline: [{ text: "different", bold: true }],
        },
      ],
    }).success,
    false,
  );
  assert.ok(
    legalPageDraftSchema.safeParse({
      ...content,
      body: [
        {
          type: "paragraph",
          text: "Contact",
          inline: [
            {
              text: "Contact",
              href: "mailto:example@example.test",
              bold: true,
            },
          ],
        },
      ],
    }).success,
  );
});

test("a translated document keeps its whole structure, links and SEO after EN changes", () => {
  const english = envelope("New English");
  english.content.body.push(
    { type: "heading", level: 2, text: "Additional section" },
    { type: "list", ordered: true, items: ["One", "Two"] },
  );
  const spanish = envelope("Texto español");
  const before = structuredClone(spanish);
  const descriptor = legalPageDescriptor("privacy_policy");
  const prepared = prepareTargetEnvelope(english, spanish, descriptor);
  assert.deepEqual(prepared, before);
  prepared.content.title = "Local working change";
  assert.deepEqual(spanish, before);
  assert.deepEqual(
    sharedEnvelope(english, descriptor),
    sharedEnvelope(spanish, descriptor),
  );
  assert.notEqual(
    sharedEnvelope<"privacy_policy">(
      { ...english, ogImageMediaId: "4f9ea77f-021d-4d69-8c47-392b9db260ad" },
      descriptor,
    ),
    sharedEnvelope(spanish, descriptor),
  );
});

test("a first target tab seeds from English without sharing object references", () => {
  const english = envelope("English baseline");
  const prepared = prepareTargetEnvelope(
    english,
    null,
    legalPageDescriptor("privacy_policy"),
  );
  assert.deepEqual(prepared, english);
  prepared.content.body.push({ type: "paragraph", text: "Português" });
  assert.equal(english.content.body.length, 1);
});

test("public snapshot selects own publication or complete EN fallback, never a draft", () => {
  const english = envelope("Published EN");
  const spanish = envelope("Publicado ES");
  const rows = [
    { locale: "en", published: english },
    { locale: "es", published: spanish },
    { locale: "pt", published: null, draft: envelope("Private PT") },
  ];
  assert.deepEqual(pickLegalPageSnapshot(rows, "es"), spanish);
  assert.deepEqual(pickLegalPageSnapshot(rows, "pt"), english);
  assert.deepEqual(pickLegalPageSnapshot(rows, "fr"), english);
  assert.equal(
    pickLegalPageSnapshot([{ locale: "en", published: null }], "pt"),
    null,
  );
  assert.equal(pickLegalPageSnapshot([], "en"), null);
  assert.equal(
    pickLegalPageSnapshot(
      [
        {
          locale: "en",
          published: {
            ...english,
            content: defaultLegalPage("privacy_policy"),
          },
        },
      ],
      "pt",
    ),
    null,
  );
});

test("EN publication updates fallback while independently published ES stays byte-for-byte", () => {
  const spanish = envelope("ES independent");
  const serialized = JSON.stringify(spanish);
  const english = envelope("EN revised");
  english.content.body.push({
    type: "list",
    ordered: false,
    items: ["A", "B", "C"],
  });
  const rows = [
    { locale: "en", published: english },
    { locale: "es", published: spanish },
  ];
  assert.deepEqual(pickLegalPageSnapshot(rows, "es"), spanish);
  assert.equal(JSON.stringify(spanish), serialized);
  assert.deepEqual(pickLegalPageSnapshot(rows, "pt"), english);
});

test("legal OG adopts the source-only picker in working state and keeps own publication until Publish", () => {
  const english = envelope("English");
  const spanish = envelope("Español");
  spanish.content.seo.meta_title = "Título propio";
  const before = structuredClone(spanish);
  english.ogImageMediaId = "4f9ea77f-021d-4d69-8c47-392b9db260ad";
  const prepared = prepareTargetEnvelope(
    english,
    spanish,
    legalPageDescriptor("privacy_policy"),
  );
  assert.deepEqual(prepared.content, before.content);
  assert.equal(prepared.ogImageMediaId, english.ogImageMediaId);
  assert.deepEqual(spanish, before);
  const rows = [
    { locale: "en", published: english },
    { locale: "es", published: spanish, draft: prepared },
  ];
  assert.deepEqual(pickLegalPageSnapshot(rows, "es"), before);
  assert.deepEqual(pickLegalPageSnapshot(rows, "pt"), english);
  assert.deepEqual(
    pickLegalPageSnapshot(
      [
        { locale: "en", published: english },
        { locale: "es", published: prepared },
      ],
      "es",
    ),
    prepared,
  );
  assert.deepEqual(spanish, before);
});
