import assert from "node:assert/strict";
import { test } from "node:test";
import { Buffer } from "node:buffer";
import sharp from "sharp";
import { createBlueprint, newField } from "../domain";
import { addFieldToColumn, addRow } from "../layout";
import { MAX_FILE_BYTES, MAX_TOTAL_FILE_BYTES } from "../file-policy";
import { validateAttachments } from "../server/attachments";
import { testNotification } from "../server/notification";
import type { FormBlueprint } from "../types";

const pdf = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n");

function fileDefinition(count = 1): FormBlueprint {
  let definition = createBlueprint("contact");
  definition = { ...definition, fields: [], rows: [] };
  for (let index = 0; index < count; index++) {
    definition = addRow(definition, definition.steps[0]!.id, 1);
    definition = addFieldToColumn(definition, definition.rows.at(-1)!.columns[0]!.id, { ...newField("file"), label: `Attachment ${index + 1}`, required: true });
  }
  definition.replyToFieldId = null;
  return definition;
}

function upload(definition: FormBlueprint, bytes: Uint8Array = pdf, name = "document.pdf", type = "application/pdf") {
  const form = new FormData();
  form.append(definition.fields[0]!.id, new File([new Uint8Array(bytes)], name, { type }));
  return form;
}

test("PDF bytes become an exact email attachment, with only readable metadata persisted", async () => {
  const definition = fileDefinition();
  definition.fields[0]!.label = "Documento adjunto";
  const id = definition.fields[0]!.id;
  const result = await validateAttachments(definition, upload(definition, pdf, "../private/Cédula\r\n.pdf"));
  assert.deepEqual(result.fieldErrors, {});
  assert.deepEqual(result.files[id], { kind: "file", name: "Cédula__.pdf", type: "application/pdf", size: pdf.length });
  assert.equal(result.attachments[0]!.filename, "Cédula__.pdf");
  assert.equal(result.attachments[0]!.contentType, "application/pdf");
  assert.deepEqual(Buffer.from(result.attachments[0]!.content, "base64"), pdf);
  assert.doesNotMatch(JSON.stringify(result.files), /content|base64|%PDF/);
  const notification = testNotification("Service request", "staff@example.test", definition, result.files, "test-123", result.attachments);
  assert.match(notification.text, /Documento adjunto: Cédula__\.pdf \(application\/pdf, \d+ bytes\)/);
  assert.deepEqual(notification.attachments, result.attachments);
  assert.doesNotMatch(notification.text, /\[object Object\]|%PDF|\/private\//);
});

test("genuine JPEG, PNG, GIF, WebP and AVIF files pass with exact byte preservation", async () => {
  const definition = fileDefinition();
  for (const [format, extension, mime] of [
    ["jpeg", "jpg", "image/jpeg"], ["png", "png", "image/png"],
    ["gif", "gif", "image/gif"], ["webp", "webp", "image/webp"],
    ["avif", "avif", "image/avif"],
  ] as const) {
    const bytes = await sharp({ create: { width: 2, height: 2, channels: 3, background: "white" } }).toFormat(format).toBuffer();
    const checked = await validateAttachments(definition, upload(definition, bytes, `photo.${extension}`, mime));
    assert.deepEqual(checked.fieldErrors, {}, format);
    assert.equal(checked.files[definition.fields[0]!.id]!.type, mime);
    assert.deepEqual(Buffer.from(checked.attachments[0]!.content, "base64"), bytes);
  }
});

test("exactly 5 MiB is accepted and one extra byte is rejected before email construction", async () => {
  const definition = fileDefinition();
  const bytes = Buffer.alloc(MAX_FILE_BYTES, " ");
  pdf.subarray(0, -6).copy(bytes);
  Buffer.from("%%EOF\n").copy(bytes, bytes.length - 6);
  const boundary = await validateAttachments(definition, upload(definition, bytes));
  assert.deepEqual(boundary.fieldErrors, {});
  assert.equal(boundary.files[definition.fields[0]!.id]!.size, MAX_FILE_BYTES);
  assert.equal(Buffer.from(boundary.attachments[0]!.content, "base64").length, MAX_FILE_BYTES);
  const oversized = await validateAttachments(definition, upload(definition, Buffer.alloc(MAX_FILE_BYTES + 1)));
  assert.match(oversized.fieldErrors[definition.fields[0]!.id]!, /5 MB/);
  assert.deepEqual(oversized.attachments, []);
  assert.deepEqual(oversized.files, {});
});

test("empty, unsupported, renamed and spoofed content cannot produce an attachment", async () => {
  const definition = fileDefinition();
  const png = await sharp({ create: { width: 1, height: 1, channels: 3, background: "white" } }).png().toBuffer();
  for (const data of [
    upload(definition, new Uint8Array(), "empty.pdf"),
    upload(definition, pdf, "document.exe", "application/pdf"),
    upload(definition, pdf, "document.pdf", "image/png"),
    upload(definition, Buffer.from("<script>alert(1)</script>"), "spoof.pdf"),
    upload(definition, Buffer.from("%PDF-1.4\ntruncated"), "truncated.pdf"),
    upload(definition, png, "renamed.pdf"),
    upload(definition, pdf, "renamed.png", "image/png"),
    upload(definition, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), "image.svg", "image/svg+xml"),
  ]) {
    const checked = await validateAttachments(definition, data);
    assert.ok(checked.fieldErrors[definition.fields[0]!.id]);
    assert.deepEqual(checked.attachments, []);
    assert.deepEqual(checked.files, {});
  }
});

test("duplicate, unknown, non-file fields and invalid multipart payloads are rejected", async () => {
  const definition = fileDefinition();
  const id = definition.fields[0]!.id;
  const duplicate = upload(definition);
  duplicate.append(id, new File([pdf], "second.pdf", { type: "application/pdf" }));
  const unknown = upload(definition);
  unknown.append(crypto.randomUUID(), new File([pdf], "extra.pdf", { type: "application/pdf" }));
  const text = new FormData(); text.append(id, "document.pdf");
  const nonFileField = new FormData(); nonFileField.append("unknown", "hello");
  for (const data of [duplicate, unknown, text, nonFileField, {} as FormData]) {
    const checked = await validateAttachments(definition, data);
    assert.ok(Object.keys(checked.fieldErrors).length);
    assert.deepEqual(checked.attachments, []);
    assert.deepEqual(checked.files, {});
  }
  assert.deepEqual(await validateAttachments(definition), { files: {}, attachments: [], fieldErrors: {} });
});

test("aggregate attachment limit permits 20 MiB and rejects overflow without partial output", async () => {
  const definition = fileDefinition(5);
  const bytes = Buffer.alloc(MAX_FILE_BYTES, " ");
  pdf.subarray(0, -6).copy(bytes);
  Buffer.from("%%EOF\n").copy(bytes, bytes.length - 6);
  const form = new FormData();
  for (const field of definition.fields.slice(0, 4)) form.append(field.id, new File([new Uint8Array(bytes)], `${field.id}.pdf`, { type: "application/pdf" }));
  const boundary = await validateAttachments(definition, form);
  assert.deepEqual(boundary.fieldErrors, {});
  assert.equal(boundary.attachments.length, 4);
  assert.equal(Object.values(boundary.files).reduce((total, value) => total + value.size, 0), MAX_TOTAL_FILE_BYTES);
  form.append(definition.fields[4]!.id, new File([pdf], "overflow.pdf", { type: "application/pdf" }));
  const overflow = await validateAttachments(definition, form);
  assert.equal(Object.keys(overflow.fieldErrors).length, 5);
  assert.deepEqual(overflow.attachments, []);
  assert.deepEqual(overflow.files, {});
});

test("a later invalid file discards earlier valid metadata and attachments", async () => {
  const definition = fileDefinition(2);
  const form = upload(definition);
  form.append(definition.fields[1]!.id, new File(["invalid"], "wrong.png", { type: "image/png" }));
  const checked = await validateAttachments(definition, form);
  assert.ok(checked.fieldErrors[definition.fields[1]!.id]);
  assert.deepEqual(checked.files, {});
  assert.deepEqual(checked.attachments, []);
});


test("email attachments follow visual field order rather than submitted multipart order", async () => {
  const definition = fileDefinition(2);
  const form = new FormData();
  form.append(definition.fields[1]!.id, new File([pdf], "second.pdf", { type: "application/pdf" }));
  form.append(definition.fields[0]!.id, new File([pdf], "first.pdf", { type: "application/pdf" }));
  const checked = await validateAttachments(definition, form);
  assert.deepEqual(checked.fieldErrors, {});
  assert.deepEqual(checked.attachments.map(file => file.filename), ["first.pdf", "second.pdf"]);
});
