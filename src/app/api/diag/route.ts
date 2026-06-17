import { NextResponse } from "next/server";

/**
 * TEMPORARY diagnostic endpoint — surfaces the runtime error behind the /admin 500 on
 * Netlify (whose function logs aren't reachable here). Runs each suspect step in
 * isolation and reports which throws + a short stack. Remove once the cause is fixed.
 */
export const dynamic = "force-dynamic";

function cap(e: unknown) {
  return {
    error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    stack: e instanceof Error ? e.stack?.split("\n").slice(0, 8) : null,
  };
}

export async function GET() {
  const out: Record<string, unknown> = {};

  out.env = {
    NODE_ENV: process.env.NODE_ENV,
    hasSecret: Boolean(process.env.BETTER_AUTH_SECRET),
    hasAuthUrl: Boolean(process.env.BETTER_AUTH_URL),
    hasDbUrl: Boolean(process.env.DATABASE_URL),
  };

  try {
    const { headers } = await import("next/headers");
    const { auth } = await import("@core/auth");
    const session = await auth.api.getSession({ headers: await headers() });
    out.getSession = { ok: true, hasSession: Boolean(session), user: session?.user?.email ?? null };
  } catch (e) {
    out.getSession = { ok: false, ...cap(e) };
  }

  try {
    const { getTranslations } = await import("next-intl/server");
    const t = await getTranslations("backoffice");
    out.getTranslations = { ok: true, sample: t("dashboard.title") };
  } catch (e) {
    out.getTranslations = { ok: false, ...cap(e) };
  }

  return NextResponse.json(out);
}
