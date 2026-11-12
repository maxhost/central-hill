"use server";
import type { PublicContactInput, PublicContactResult } from "../public-types";
/** Contract scaffold replaced by implementer B before integration. */
export async function submitHeaderContactForm(_input: PublicContactInput, _uploads?: FormData): Promise<PublicContactResult> {
  return { ok: false, code: "server" };
}
