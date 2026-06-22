import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { OwnerSubnavReveal } from "./components/owner-subnav-reveal";
import { OwnerStatsCounter } from "./components/owner-stats-counter";

/**
 * Owners page — a focused conversion landing embedded 1:1 inside the live app shell.
 * The mock's body markup is rendered verbatim; its page styles are scoped under `.mk`
 * (see `src/app/mock.css` for the shared design system) so nothing leaks to Home/admin.
 * No database is read here — content is static. The real header/footer + i18n come from
 * the app layout.
 *
 * Owner direction (drizzle/0004): the page is intentionally short — hero + earnings form,
 * the animated "numbers" band, and the closing CTA. The "★ Earn +25%" badge sits inside
 * the form card (highlighted), and the former marketing sections (why / services / plans /
 * journey / dashboard / testimonials / faq) were removed. (The earnings form is the mock's
 * static markup for now; wiring it to the leads action is a follow-up.)
 */

const OWNERS_STYLE = `
.mk .owner-subnav{position:fixed;top:64px;left:0;right:0;z-index:40;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line);opacity:0;visibility:hidden;transform:translateY(-12px);pointer-events:none;transition:opacity .35s var(--ease),transform .35s var(--ease),visibility .35s var(--ease)}
.mk .owner-subnav.in{opacity:1;visibility:visible;transform:none;pointer-events:auto}
.mk .owner-subnav .wrap{display:flex;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:0}
.mk .owner-subnav .wrap::-webkit-scrollbar{display:none}
.mk .owner-subnav a{flex:0 0 auto;white-space:nowrap;font-size:13px;font-weight:500;color:var(--ink-soft);padding:14px 14px;border-bottom:2px solid transparent;transition:.2s var(--ease)}
.mk .owner-subnav a:hover{color:var(--accent-deep);border-bottom-color:var(--accent)}
.mk [id]{scroll-margin-top:130px}
.mk .owner-hero .wrap{display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:end}
.mk .owner-hero .hero-copy{max-width:34ch}
.mk .est-card{background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:34px 32px 30px;box-shadow:0 30px 60px -30px rgba(0,0,0,.5)}
.mk .est-card .earn-badge{display:inline-flex;align-items:center;gap:.5em;background:var(--accent);color:#fff;font-size:13px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;padding:9px 18px;border-radius:30px;margin-bottom:16px;box-shadow:0 10px 24px -10px color-mix(in srgb,var(--accent) 75%,transparent)}
.mk .est-card h3{font-size:26px;margin-bottom:8px}
.mk .est-card .est-sub{font-size:14px;color:var(--ink-soft);margin-bottom:22px}
.mk .est-field{margin-bottom:16px}
.mk .est-field label{display:block;font-size:12px;letter-spacing:.04em;font-weight:600;color:var(--ink);margin-bottom:7px}
.mk .est-field input,.mk .est-field select{width:100%;font-family:var(--sans);font-size:15px;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:4px;padding:13px 14px;transition:.2s var(--ease)}
.mk .est-field input:focus,.mk .est-field select:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}
.mk .est-two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mk .est-card .btn{width:100%;justify-content:center;margin-top:6px}
.mk .est-note{text-align:center;font-size:12.5px;color:var(--ink-soft);margin-top:14px}
@media(max-width:980px){.mk .owner-hero .wrap{grid-template-columns:1fr;gap:34px}}
@media(max-width:680px){.mk .est-two{grid-template-columns:1fr}}
`;

const OWNERS_BODY = `
<nav class="owner-subnav" aria-label="Owner page sections">
  <div class="wrap">
    <a href="#worth">What's My Property Worth?</a>
    <a href="#numbers">Numbers That Speak for Themselves</a>
    <a href="#start">Start Earning More Today</a>
  </div>
</nav>

<section id="worth" class="hero compact owner-hero" style="padding:0">
  <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1900&q=72" alt="Bright, designer-furnished Lisbon apartment interior">
  <div class="wrap">
    <div class="hero-copy">
      <h1>Your Property. Our Expertise. Maximum Returns.</h1>
      <p>Central Hill Apartments turns your property into a high-performing asset — fully managed, transparent, and optimized for maximum profit using AI-driven pricing and unmatched local expertise.</p>
    </div>

    <form class="est-card reveal" onsubmit="return false">
      <span class="earn-badge">★ Earn +25%</span>
      <h3>Get Your Free Earnings Estimate</h3>
      <p class="est-sub">Find out how much your property could earn — free, instant, no obligation.</p>
      <div class="est-field">
        <label for="addr">Property Address</label>
        <input id="addr" type="text" placeholder="Street, neighbourhood, city" autocomplete="off">
      </div>
      <div class="est-two">
        <div class="est-field">
          <label for="nprop">Nº of Properties</label>
          <select id="nprop">
            <option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option>
          </select>
        </div>
        <div class="est-field">
          <label for="nbed">Nº of Bedrooms</label>
          <select id="nbed">
            <option>Studio</option><option>1</option><option>2</option><option>3</option><option>4+</option>
          </select>
        </div>
      </div>
      <a class="btn btn-accent" href="#">Calculate My Earnings →</a>
      <p class="est-note">Free, instant, no obligation.</p>
    </form>
  </div>
</section>

<div id="numbers" class="stats">
  <div class="wrap stats-grid">
    <div class="stat"><div class="num" data-count data-to="400000" data-suffix="+" data-group="true">400,000+</div><div class="lbl">Bookings Completed</div></div>
    <div class="stat"><div class="num" data-count data-to="12" data-suffix="+">12+</div><div class="lbl">Years of Experience</div></div>
    <div class="stat"><div class="num" data-count data-to="55" data-prefix="€" data-suffix="M+">€55M+</div><div class="lbl">Revenue Generated</div></div>
    <div class="stat"><div class="num" data-count data-to="5" data-suffix="M+">5M+</div><div class="lbl">Guests Hosted</div></div>
  </div>
</div>

<section id="start" class="stats" style="padding:var(--section-y) 0">
  <div class="wrap" style="text-align:center;max-width:760px">
    <span class="eyebrow" style="color:var(--feature-accent)">Start Earning More Today</span>
    <h2 class="section-title" style="color:#fff;margin-top:14px">Ready to Make Your Property Work for You?</h2>
    <p style="color:var(--on-feature-soft);font-size:18px;margin:18px auto 0;max-width:60ch">Join the growing number of property owners across Portugal who trust Central Hill Apartments to deliver exceptional results. Start with a free, no-obligation profitability analysis.</p>
    <div style="margin-top:34px">
      <a class="btn btn-accent" href="#worth">Get Your Free Earnings Estimate →</a>
    </div>
    <p style="color:var(--on-feature-soft);font-size:14px;letter-spacing:.03em;margin-top:26px">
      Call +351 910 075 725 &nbsp;·&nbsp; info@centralhill.pt &nbsp;·&nbsp; WhatsApp +351 910 075 725
    </p>
  </div>
</section>
`;

export async function OwnersPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  return (
    <div className="mk" data-page="owners">
      <style dangerouslySetInnerHTML={{ __html: OWNERS_STYLE }} />
      <OwnerSubnavReveal />
      <OwnerStatsCounter />
      <div dangerouslySetInnerHTML={{ __html: OWNERS_BODY }} />
    </div>
  );
}
