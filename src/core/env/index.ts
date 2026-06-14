import { z } from "zod";

/**
 * Server-only environment validation (conventions.md → Security: "Secrets only
 * via env, validated at boot"). Parsed lazily where imported; public statically
 * rendered routes never import this (they don't touch the DB).
 */
const EnvSchema = z.object({
  DATABASE_URL: z.url(),

  // R2 (media) — optional until the media pipeline is wired.
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().optional(),

  // Better Auth (backoffice).
  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().optional(),

  // Avantio / email / translation.
  AVANTIO_ACCOUNT_ID: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_API_KEY: z.string().optional(),
  /** Staff inbox lead notifications are sent to (ADR 0011/0016). Optional until wired. */
  LEAD_NOTIFY_TO: z.string().optional(),
  TRANSLATE_API_KEY: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
export type Env = z.infer<typeof EnvSchema>;
