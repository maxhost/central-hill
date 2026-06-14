import { createAuthClient } from "better-auth/react";

/**
 * Browser-side Better Auth client for backoffice client components (login form,
 * sign-out). Talks to the handler at `/api/auth` on the current origin — no
 * server-only code, safe to import from `"use client"` modules. Kept in its own
 * entry point so server modules never pull the React client in.
 */
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
