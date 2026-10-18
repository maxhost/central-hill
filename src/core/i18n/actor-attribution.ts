import { z } from "zod";

/** ADR 0036: preserve real auth IDs, with compatibility for legacy UUID attribution. */
export function translationActorAttribution(userId?: string) {
  return {
    updated_by: userId && z.uuid().safeParse(userId).success ? userId : null,
    updated_by_user_id: userId || null,
  };
}
