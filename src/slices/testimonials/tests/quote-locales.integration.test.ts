import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@core/db/client";
import {
  deleteContent,
  loadTranslationRows,
  setSourceContent,
  setTargetTranslation,
} from "@core/i18n";
import { testimonial } from "../schema";
import { saveTestimonial } from "../admin/actions";
import { getTestimonialForEdit } from "../admin/queries";
import { listTestimonials } from "../server/queries";
import { TESTIMONIAL_QUOTE_LOCALES } from "../quote-locale-types";

const GUEST = "e8300000-0000-4000-8000-000000000001";
const OWNER = "e8300000-0000-4000-8000-000000000002";
const DRAFT = "e8300000-0000-4000-8000-000000000003";
const ARCHIVED = "e8300000-0000-4000-8000-000000000004";
const IDS = [GUEST, OWNER, DRAFT, ARCHIVED];
const actor = "testimonial-quote-backend";
let verified = false;
const targets = { es: "Cita ES", pt: "Citação PT", fr: "Citation FR" };
const raw = (id = GUEST) => loadTranslationRows({ type: "testimonial", id });
const row = async () =>
  (await db.select().from(testimonial).where(eq(testimonial.id, GUEST)))[0];
const save = async (overrides: Record<string, unknown> = {}) => {
  const result = await saveTestimonial({
    id: GUEST,
    audience: "guest",
    rating: 4,
    author_name: "Synthetic quote guest",
    author_country: "Portugal",
    property_location: "Synthetic location",
    position: 9997,
    status: "published",
    quote: "English quote",
    ...overrides,
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  return result;
};

before(async () => {
  assert.equal(new URL(process.env.DATABASE_URL ?? "http://invalid.test").hostname, "propertylocalesqa.local");
  const who = await db.execute(sql`select current_database() as database,current_user as role`);
  assert.deepEqual(who.rows[0], { database: "propertylocalesqa", role: "propertylocalesqa" });
  assert.equal((await db.select().from(testimonial).where(inArray(testimonial.id, IDS))).length, 0);
  for (const id of IDS) assert.equal((await raw(id)).length, 0);
  verified = true;
  await db.insert(testimonial).values([
    { id: GUEST, audience: "guest", author_name: "Synthetic quote guest", author_country: "Portugal", property_location: "Synthetic location", rating: 4, position: 9997, status: "published" },
    { id: OWNER, audience: "owner", author_name: "Synthetic quote owner", author_country: "Portugal", rating: 5, position: 9998, status: "published" },
    { id: DRAFT, audience: "guest", author_name: "Synthetic quote draft", author_country: "Portugal", rating: 3, position: 9999, status: "draft" },
    { id: ARCHIVED, audience: "owner", author_name: "Synthetic quote archived", author_country: "Portugal", rating: 2, position: 10000, status: "archived" },
  ]);
  for (const id of IDS) {
    await setSourceContent("testimonial", id, { quote: id === GUEST ? "English quote" : `English ${id}` }, { updatedBy: actor });
  }
  await setTargetTranslation("testimonial", GUEST, "quote", "es", "Pending ES quote", {
    sourceValue: "English quote", state: "needs_review", updatedBy: actor,
  });
  await setTargetTranslation("testimonial", GUEST, "quote", "pt", "Existing PT quote", {
    sourceValue: "English quote", state: "approved", updatedBy: actor,
  });
});

after(async () => {
  if (!verified) return;
  await db.delete(testimonial).where(inArray(testimonial.id, IDS));
  for (const id of IDS) await deleteContent("testimonial", id);
  assert.equal((await db.select().from(testimonial).where(inArray(testimonial.id, IDS))).length, 0);
  for (const id of IDS) assert.equal((await raw(id)).length, 0);
});

test("edit reads pending target quotes and missing blanks without materializing or approving", async () => {
  const beforeRows = await raw(), beforeScalar = await row();
  const edit = await getTestimonialForEdit(GUEST);
  assert.equal(edit?.quote, "English quote");
  assert.deepEqual(edit?.translations, { es: "Pending ES quote", pt: "Existing PT quote", fr: "" });
  assert.equal((await listTestimonials("es", "guest")).find((r) => r.id === GUEST)?.quote, "English quote");
  assert.equal((await listTestimonials("pt", "guest")).find((r) => r.id === GUEST)?.quote, "Existing PT quote");
  assert.deepEqual(await raw(), beforeRows);
  assert.deepEqual(await row(), beforeScalar);
});

test("one Save approves trimmed manual quotes without changing neutral data", async () => {
  const before = await row();
  await save({ quote: "  English quote  ", translations: { es: " Cita ES ", pt: " Citação PT ", fr: " Citation FR " } });
  const edit = await getTestimonialForEdit(GUEST);
  assert.deepEqual(edit?.translations, targets);
  const targetRows = (await raw()).filter((r) => r.locale !== "en");
  assert.equal(targetRows.length, 3);
  assert.ok(targetRows.every((r) => r.state === "approved"));
  assert.deepEqual({ ...await row(), updated_at: undefined }, { ...before, updated_at: undefined });
  for (const locale of TESTIMONIAL_QUOTE_LOCALES) {
    const quote = (await listTestimonials(locale, "guest")).find((r) => r.id === GUEST)?.quote;
    assert.equal(quote, locale === "en" ? "English quote" : targets[locale]);
  }
});

test("older clients omitting targets preserve exact authored rows after an EN change", async () => {
  const before = (await raw()).filter((r) => r.locale !== "en");
  await save({ quote: "Changed English quote" });
  assert.deepEqual((await raw()).filter((r) => r.locale !== "en"), before);
  assert.equal((await getTestimonialForEdit(GUEST))?.quote, "Changed English quote");
  assert.deepEqual((await getTestimonialForEdit(GUEST))?.translations, targets);
  for (const locale of ["es", "pt", "fr"] as const) {
    assert.equal((await listTestimonials(locale)).find((r) => r.id === GUEST)?.quote, targets[locale]);
  }
});

test("clearing only ES uses current EN while keeping custom PT and FR public", async () => {
  await save({ quote: "Latest English quote", translations: { ...targets, es: "   " } });
  const rows = await raw();
  assert.equal(rows.some((r) => r.locale === "es"), false);
  assert.deepEqual((await getTestimonialForEdit(GUEST))?.translations, { ...targets, es: "" });
  assert.equal((await listTestimonials("es", "guest")).find((r) => r.id === GUEST)?.quote, "Latest English quote");
  for (const locale of ["pt", "fr"] as const) {
    assert.equal((await listTestimonials(locale, "guest")).find((r) => r.id === GUEST)?.quote, targets[locale]);
  }
});

test("published/audience/order filters and shared author/rating remain valid in every locale", async () => {
  for (const locale of TESTIMONIAL_QUOTE_LOCALES) {
    const mixed = (await listTestimonials(locale)).filter((r) => IDS.includes(r.id));
    assert.deepEqual(mixed.map((r) => r.id), [GUEST, OWNER]);
    const guests = (await listTestimonials(locale, "guest")).filter((r) => IDS.includes(r.id));
    const owners = (await listTestimonials(locale, "owner")).filter((r) => IDS.includes(r.id));
    assert.deepEqual(guests.map((r) => r.id), [GUEST]);
    assert.deepEqual(owners.map((r) => r.id), [OWNER]);
    assert.deepEqual(
      { authorName: guests[0]?.authorName, authorCountry: guests[0]?.authorCountry, propertyLocation: guests[0]?.propertyLocation, rating: guests[0]?.rating },
      { authorName: "Synthetic quote guest", authorCountry: "Portugal", propertyLocation: "Synthetic location", rating: 4 },
    );
  }
});

test("invalid whitespace or missing-record saves do not alter existing quote/scalar rows", async () => {
  const beforeRows = await raw(), beforeScalar = await row();
  const invalid = await saveTestimonial({
    id: GUEST, audience: "guest", rating: 4, author_name: "Synthetic quote guest", author_country: "Portugal",
    property_location: "Synthetic location", position: 9997, status: "published", quote: "   ", translations: targets,
  });
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.error, "validation");
  const missing = await saveTestimonial({
    id: "e8300000-0000-4000-8000-000000000099", audience: "guest", rating: 4,
    author_name: "Synthetic missing", author_country: "Portugal", property_location: null,
    position: 9999, status: "published", quote: "Missing quote", translations: targets,
  });
  assert.deepEqual(missing, { ok: false, error: "not_found" });
  assert.deepEqual(await raw(), beforeRows);
  assert.deepEqual(await row(), beforeScalar);
});
