import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isIP } from "node:net";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { createBlueprint } from "../domain";
import { addFieldToColumn, addRow } from "../layout";
import { validateAttachments } from "../server/attachments";
import * as validation from "../validation";
import { buildContactSnapshot, publicContactNotification } from "../server/public-notification";
import { capturedContactFields, deriveCapturedContactTitle } from "../../leads/admin/derive";
import { createResendProvider } from "../../../core/email/resend";
import type { ContactCaptureInput } from "../../leads/form-capture-types";
import type { FormBlueprint, FormField, FormValues } from "../types";
import type { PublicContactInput } from "../public-types";

function load<T>(path: string, dependencies: Record<string, unknown>): T {
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(code, { exports: compiled.exports, module: compiled, console: { error: () => undefined }, require: (name: string) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency ${name}`);
    return dependencies[name];
  } });
  return compiled.exports as T;
}
function fixture() {
  let definition = createBlueprint("contact");
  const add = (type: FormField["type"], label: string, required: boolean, consent = false) => {
    const field: FormField = { id: crypto.randomUUID(), type, label, placeholder: "", help: "", required, consent, options: [] };
    definition = addRow(definition, definition.steps[0]!.id, 1);
    definition = addFieldToColumn(definition, definition.rows.at(-1)!.columns[0]!.id, field);
    return field;
  };
  const date = add("date", "Arrival date", true);
  const file = add("file", "Your document", false);
  const consent = add("checkbox", "Aviso exacto de privacidad", false, true);
  const values: PublicContactInput["values"] = Object.fromEntries(definition.fields.filter(f => f.type !== "file").map(field => [field.id, field.type === "email" ? "person@example.test" : field.type === "checkbox" ? false : field.type === "date" ? "2026-11-12" : "A response"]));
  const form = { id: crypto.randomUUID(), name: "Own public contact", revision: 7, recipient: "staff@example.test" };
  const fingerprint = "a".repeat(64);
  const input: PublicContactInput = { id: form.id, expectedRevision: 7, locale: "es", fingerprint, submissionKey: crypto.randomUUID(), values, honeypot: "" };
  return { definition, date, file, consent, form, fingerprint, input };
}
function actionHarness() {
  const own = fixture();
  const state = { assigned: true, sourcePresent: true, rateAllowed: true, rateCalls: 0, queries: 0, captures: [] as ContactCaptureInput[], sent: [] as unknown[], captureStatus: "created" as "created" | "duplicate" | "stale" | "conflict", mailOk: true };
  const actions = load<typeof import("../server/public-actions")>("../server/public-actions.ts", {
    "node:net": { isIP }, "next/headers": { headers: async () => new Headers({ "x-forwarded-for": "198.51.100.10, 127.0.0.1", "user-agent": "Own test" }) },
    "drizzle-orm": { sql }, "zod": { z }, "@core/db/client": { db: { execute: async () => { state.queries++; return { rows: [{ assigned: state.assigned }] }; } } },
    "@core/email": { sendEmail: async (message: unknown) => { state.sent.push(message); return { ok: state.mailOk, id: "console" }; } },
    "@slices/leads/contract": { captureFormContact: async (input: ContactCaptureInput) => { state.captures.push(input); return { status: state.captureStatus, leadId: "own-lead" }; } },
    "@slices/settings/contract": { headerContactAssignmentGuard: () => sql`true` },
    "./public-queries": { assignableHeaderFormGuard: () => sql`true`, readPublicFormSource: async () => state.sourcePresent ? { form: own.form, definition: own.definition, fingerprint: own.fingerprint } : null },
    "./attachments": { validateAttachments }, "../validation": validation,
    "./public-rate-limit": { admitPublicContact: async () => { state.rateCalls++; return state.rateAllowed; } },
    "./public-notification": { buildContactSnapshot, publicContactNotification },
  });
  return { ...own, state, submit: actions.submitHeaderContactForm };
}

test("public snapshots preserve localized labels, display options and exact accepted checkbox text", () => {
  const own = fixture();
  const select: FormField = { id: crypto.randomUUID(), type: "select", label: "Idioma elegido", placeholder: "", help: "", required: true, options: [{ id: crypto.randomUUID(), label: "Português" }], consent: false };
  let definition: FormBlueprint = addRow(own.definition, own.definition.steps[0]!.id, 1);
  definition = addFieldToColumn(definition, definition.rows.at(-1)!.columns[0]!.id, select);
  const snapshot = buildContactSnapshot(own.form, definition, { ...own.input.values, [select.id]: select.options[0]!.id, [own.consent.id]: true }, "es", own.fingerprint);
  assert.equal(snapshot.fields.at(-1)?.displayValue, "Português");
  assert.equal(snapshot.fields.find(f => f.id === own.consent.id)?.label, "Aviso exacto de privacidad");
  assert.equal(snapshot.fields.find(f => f.id === own.consent.id)?.value, true);
  const oldLabels = capturedContactFields(snapshot);
  definition.fields[0]!.label = "Later renamed field";
  assert.notEqual(oldLabels?.[0]?.label, "Later renamed field");
  assert.equal(deriveCapturedContactTitle(snapshot, { email: "person@example.test" }), "person@example.test");
  assert.equal(deriveCapturedContactTitle(snapshot, {}), own.form.name);
  assert.equal(deriveCapturedContactTitle(null, { contact_name: "Legacy name" }), "Legacy name");
});

test("payload hash includes verified attachment bytes, never stores base64", () => {
  const own = fixture();
  const metadata = { kind: "file" as const, name: "same.pdf", type: "application/pdf", size: 3 };
  const values: FormValues = { ...own.input.values, [own.file.id]: metadata };
  const a = buildContactSnapshot(own.form, own.definition, values, "en", own.fingerprint, [{ filename: metadata.name, contentType: metadata.type, content: Buffer.from("abc").toString("base64") }]);
  const b = buildContactSnapshot(own.form, own.definition, values, "en", own.fingerprint, [{ filename: metadata.name, contentType: metadata.type, content: Buffer.from("abd").toString("base64") }]);
  assert.notEqual(a.payloadHash, b.payloadHash);
  assert.deepEqual(a.fields, b.fields);
  assert.equal(JSON.stringify(a).includes(Buffer.from("abc").toString("base64")), false);
});

test("honeypot returns silently before DB, rate or capture", async () => {
  const h = actionHarness();
  assert.equal((await h.submit({ ...h.input, honeypot: "bot" })).ok, true);
  assert.equal(h.state.queries, 0); assert.equal(h.state.rateCalls, 0); assert.equal(h.state.captures.length, 0);
});
test("client recipient/source/unknown fields are rejected without capture", async () => {
  const h = actionHarness();
  const result = await h.submit({ ...h.input, recipient: "attacker@example.test" } as PublicContactInput);
  assert.equal(result.ok, false);assert.equal(h.state.queries, 0);
  const unknown = await h.submit({ ...h.input, values: { ...h.input.values, [crypto.randomUUID()]: "unexpected" } });
  assert.equal(unknown.ok, false);assert.equal(h.state.captures.length, 0);
});
test("unassigned, missing, stale revision and changed localization stop before upload admission", async () => {
  const h = actionHarness(); h.state.assigned = false;
  assert.deepEqual(JSON.parse(JSON.stringify(await h.submit(h.input))), { ok: false, code: "stale" });
  h.state.assigned = true;h.state.sourcePresent = false;
  assert.equal((await h.submit(h.input)).ok, false);
  h.state.sourcePresent = true;
  assert.equal((await h.submit({ ...h.input, expectedRevision: 6 })).ok, false);
  assert.equal((await h.submit({ ...h.input, fingerprint: "b".repeat(64) })).ok, false);
  assert.equal(h.state.rateCalls, 0);assert.equal(h.state.sent.length, 0);
});
test("all fields validate server-side, including dates and forged file answers", async () => {
  const h = actionHarness();
  const result = await h.submit({ ...h.input, values: { ...h.input.values, [h.date.id]: "2026-02-30", [h.file.id]: "fake.pdf" } });
  assert.equal(result.ok, false);
  if (!result.ok) { assert.ok(result.fieldErrors?.[h.date.id]);assert.ok(result.fieldErrors?.[h.file.id]); }
  assert.equal(h.state.captures.length, 0);assert.equal(h.state.sent.length, 0);
});
test("rate admission precedes upload validation/capture", async () => {
  const h = actionHarness();h.state.rateAllowed = false;
  const result = await h.submit(h.input, {} as FormData);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { ok: false, code: "rate_limited" });
  assert.equal(h.state.captures.length, 0);
});
test("valid attached PDF produces a captured contact and public notification with configured recipient/reply-to", async () => {
  const h = actionHarness(), upload = new FormData();
  upload.append(h.file.id, new File(["%PDF-1.7\nhello\n%%EOF"], "own.pdf", { type: "application/pdf" }));
  assert.equal((await h.submit(h.input, upload)).ok, true);
  assert.equal(h.state.captures.length, 1);assert.equal(h.state.sent.length, 1);
  const capture = h.state.captures[0]!;
  assert.equal(capture.email, "person@example.test");assert.equal(capture.ipAddress, "198.51.100.10");
  assert.equal(capture.snapshot.formId, h.form.id);assert.equal(capture.snapshot.fields.find(f => f.id === h.file.id)?.type, "file");
  const message = h.state.sent[0] as ReturnType<typeof publicContactNotification>;
  assert.equal(message.to, "staff@example.test");assert.equal(message.replyTo, "person@example.test");
  assert.match(message.subject, /^\[Contact\]/);assert.doesNotMatch(message.subject, /test/i);
  assert.equal(message.attachments?.[0]?.filename, "own.pdf");
});
test("only unique capture winner notifies; stale capture or key conflict never notifies", async () => {
  for (const status of ["duplicate", "stale", "conflict"] as const) {
    const h = actionHarness();h.state.captureStatus = status;
    const result = await h.submit(h.input);
    assert.equal(result.ok, status === "duplicate");assert.equal(h.state.sent.length, 0);
  }
});
test("failed provider result does not fail captured lead", async () => {
  const h = actionHarness();h.state.mailOk = false;
  assert.equal((await h.submit(h.input)).ok, true);assert.equal(h.state.captures.length, 1);
});
test("public Resend payload uses existing adapter, recipient, reply-to and attachment with no real mail", async () => {
  const own = fixture();
  const snapshot = buildContactSnapshot(own.form, own.definition, own.input.values, "pt", own.fingerprint);
  let payload: Record<string, unknown> = {};
  const provider = createResendProvider("synthetic-only", "sender@example.test", async (_url, init) => {
    payload = JSON.parse(String(init?.body));return new Response(JSON.stringify({ id: "simulated-message" }), { status: 200 });
  });
  const message = publicContactNotification(snapshot, own.form.recipient, "own-lead", "person@example.test", [{ filename: "own.pdf", contentType: "application/pdf", content: "cGRm" }]);
  assert.equal((await provider.send(message)).ok, true);
  assert.deepEqual(payload.to, [own.form.recipient]);assert.equal(payload.reply_to, "person@example.test");
  assert.equal(payload.from, "sender@example.test");assert.ok(Array.isArray(payload.attachments));
  assert.deepEqual(await createResendProvider("synthetic-only", "sender@example.test", async () => new Response("rejected", { status: 429 })).send(message), { ok: false, error: "Resend rejected the request (429)" });
  assert.deepEqual(await createResendProvider("synthetic-only", "sender@example.test", async () => { throw Error("timeout"); }).send(message), { ok: false, error: "Resend request failed or timed out" });
});
