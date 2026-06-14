import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@core/auth";

/**
 * Better Auth HTTP endpoint (backoffice only — ADR 0009). Mounts sign-in,
 * sign-out, session, etc. under `/api/auth/*`. Dynamic by nature; never
 * statically rendered.
 */
export const { GET, POST } = toNextJsHandler(auth);
