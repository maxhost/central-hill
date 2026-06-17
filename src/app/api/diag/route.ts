import { NextResponse } from "next/server";

/**
 * TEMPORARY diagnostic endpoint — surfaces the runtime error behind the /admin 500 on
 * Netlify (whose function logs aren't reachable here). Runs each suspect step of the
 * panel layout in isolation and reports which throws + a short stack. `?redirect=1`
 * probes whether `redirect()` itself 500s on the Netlify runtime. Remove once fixed.
 */
export const dynamic = "force-dynamic";

function cap(e: unknown) {
  return {
    error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    stack: e instanceof Error ? e.stack?.split("\n").slice(0, 10) : null,
  };
}

export async function GET(req: Request) {
  // Probe: does redirect() 500 on Netlify? (the unauthenticated /admin path).
  if (new URL(req.url).searchParams.get("redirect")) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
  }

  const out: Record<string, unknown> = {};
  out.env = {
    NODE_ENV: process.env.NODE_ENV,
    hasSecret: Boolean(process.env.BETTER_AUTH_SECRET),
    hasAuthUrl: Boolean(process.env.BETTER_AUTH_URL),
    hasDbUrl: Boolean(process.env.DATABASE_URL),
  };

  try {
    const { getStaff } = await import("@core/auth");
    const staff = await getStaff();
    out.getStaff = { ok: true, staff };
  } catch (e) {
    out.getStaff = { ok: false, ...cap(e) };
  }

  try {
    const { composeAdminNav } = await import("@slices/backoffice/contract");
    const mods = await Promise.all([
      import("@slices/pages/contract"),
      import("@slices/buildings/contract"),
      import("@slices/apartments/contract"),
      import("@slices/testimonials/contract"),
      import("@slices/faq/contract"),
      import("@slices/geography/contract"),
      import("@slices/services/contract"),
      import("@slices/blog/contract"),
      import("@slices/leads/contract"),
      import("@slices/translation/contract"),
      import("@slices/settings/contract"),
    ]);
    const screens = [
      mods[0].pagesAdminScreens,
      mods[1].buildingsAdminScreens,
      mods[2].apartmentsAdminScreens,
      mods[3].testimonialsAdminScreens,
      mods[4].faqAdminScreens,
      mods[5].geographyAdminScreens,
      mods[6].servicesAdminScreens,
      mods[7].blogAdminScreens,
      mods[8].leadsAdminScreens,
      mods[9].translationAdminScreens,
      mods[10].settingsAdminScreens,
    ].flat();
    const nav = composeAdminNav(screens, "admin");
    out.composeNav = { ok: true, groups: nav.length };
  } catch (e) {
    out.composeNav = { ok: false, ...cap(e) };
  }

  return NextResponse.json(out);
}
