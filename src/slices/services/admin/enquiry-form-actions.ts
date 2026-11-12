"use server";
import { listContactFormOptions } from "@slices/forms/server-contract";
/** Refresh only the catalogue; never save or replace the service workspace. */
export async function listServiceEnquiryForms() {
  return listContactFormOptions();
}
