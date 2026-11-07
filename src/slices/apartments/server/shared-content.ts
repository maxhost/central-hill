import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@core/db/client";
import type { PropertySharedState } from "@slices/backoffice/contract";
import {
  APARTMENT_SHARED_KEYS,
  type ApartmentEditorialContent,
  type ApartmentEnvelope,
} from "../editorial-types";
import { apartment_shared_content } from "../schema";
import {
  LegacyApartmentError,
  readApartmentIdentity,
  readApartmentLocaleRows,
  type ApartmentIdentity,
  type ApartmentLocaleRow,
} from "./editorial-bootstrap";
import {
  apartmentSharedContent,
  checkApartmentEnvelope,
  emptyApartmentEnvelope,
  overlayApartmentShared,
  semanticEqual,
} from "./editorial-validation";
export async function readApartmentSharedState(
  identity: ApartmentIdentity,
  rows: ApartmentLocaleRow[],
): Promise<PropertySharedState<ApartmentEditorialContent>> {
  const [stored] = await db
    .select()
    .from(apartment_shared_content)
    .where(eq(apartment_shared_content.apartment_id, identity.id))
    .limit(1);
  if (stored) {
    if (
      stored.data?.schemaVersion !== 1 ||
      !stored.data.content ||
      APARTMENT_SHARED_KEYS.some(
        (key) => !Object.hasOwn(stored.data.content, key),
      ) ||
      Object.keys(stored.data.content).length !== APARTMENT_SHARED_KEYS.length
    )
      throw new LegacyApartmentError();
    const checked = checkApartmentEnvelope(
      overlayApartmentShared(emptyApartmentEnvelope(), stored.data.content),
    );
    if (!checked.envelope) throw new LegacyApartmentError();
    return {
      revision: stored.revision,
      content: apartmentSharedContent(checked.envelope),
    };
  }
  const en = rows.find((row) => row.locale === "en");
  const published =
    en?.published ?? rows.find((row) => row.published)?.published;
  const effective: ApartmentEnvelope =
    published ?? en?.draft ?? emptyApartmentEnvelope();
  const content = apartmentSharedContent(effective);
  const pending = en?.draft ? apartmentSharedContent(en.draft) : null;
  return {
    revision: 0,
    content,
    ...(published && pending && !semanticEqual(content, pending)
      ? { working: pending }
      : {}),
  };
}
/** Pure reads only. Common data never creates locale publications. */
export async function getApartmentSharedState(id: string) {
  const identity = await readApartmentIdentity(id);
  if (!identity) return null;
  return readApartmentSharedState(
    identity,
    await readApartmentLocaleRows(identity),
  );
}
