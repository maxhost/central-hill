"use server";
import { listContactFormOptions } from "@slices/forms/server-contract";
/** Catalogue refresh does not save or reinitialize any About snapshot. */
export async function listAboutContactForms() {
  return listContactFormOptions();
}
