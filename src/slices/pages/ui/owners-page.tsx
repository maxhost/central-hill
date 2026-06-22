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
 * Owner direction (drizzle/0004 + 0005): the page is intentionally short — hero + earnings
 * form, the animated "numbers" band, an editorial "why owners trust us" section, and the
 * closing CTA. The "★ Earn +25%" badge sits inside the form card (highlighted). The `why`
 * section mirrors the home's Editorial-Split layout (sticky text + CTAs beside a hairline
 * benefit list) and is editor-ready (owners schema → `why`); the `services / plans /
 * journey / dashboard / testimonials / faq` sections were removed. (The page content is
 * static markup for now; wiring it to the DB + leads action is a follow-up.)
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
.mk .owner-pitch .wrap{display:grid;grid-template-columns:.9fr 1.1fr;gap:64px;align-items:start}
.mk .owner-pitch .pitch-text{position:sticky;top:120px}
.mk .owner-pitch .pitch-sub{margin-top:18px;font-size:18px;line-height:1.6;color:var(--ink-soft)}
.mk .owner-pitch .pitch-cta{margin-top:28px;display:flex;flex-wrap:wrap;gap:14px}
.mk .owner-pitch .pitch-note{margin-top:14px;font-size:14px;color:var(--ink-soft)}
.mk .owner-pitch .pitch-list{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.mk .owner-pitch .pitch-list li{display:flex;gap:20px;padding:24px 0;border-bottom:1px solid var(--line)}
.mk .owner-pitch .pitch-list .ic{width:28px;height:28px;flex:0 0 auto;margin-top:2px;color:var(--accent-deep)}
.mk .owner-pitch .pitch-list h3{font-size:19px;margin:0 0 6px}
.mk .owner-pitch .pitch-list p{font-size:15px;line-height:1.6;color:var(--ink-soft);margin:0}
@media(max-width:980px){.mk .owner-hero .wrap{grid-template-columns:1fr;gap:34px}.mk .owner-pitch .wrap{grid-template-columns:1fr;gap:36px}.mk .owner-pitch .pitch-text{position:static}}
@media(max-width:680px){.mk .est-two{grid-template-columns:1fr}}
`;

const OWNERS_BODY = `
<nav class="owner-subnav" aria-label="Owner page sections">
  <div class="wrap">
    <a href="#worth">What's My Property Worth?</a>
    <a href="#numbers">Numbers That Speak for Themselves</a>
    <a href="#why">Why Owners Choose Us</a>
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

<section id="why" class="owner-pitch">
  <div class="wrap">
    <div class="pitch-text">
      <span class="eyebrow">Why owners choose us</span>
      <h2 class="section-title">Why Property Owners Trust Central Hill Apartments</h2>
      <p class="pitch-sub">We turn your property into a high-performing asset — fully managed, transparent, and optimised for maximum returns.</p>
      <div class="pitch-cta">
        <a class="btn btn-accent" href="#worth">Get your free estimate →</a>
        <a class="btn btn-ghost" href="#start">Talk to us</a>
      </div>
      <p class="pitch-note">Free, no obligation — reply within 48h.</p>
    </div>
    <ul class="pitch-list">
      <li>
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H4V4"/><path d="M4 16.5L12 9L15 12L19.5 7.5"/></svg>
        <div><h3>AI-Powered Pricing</h3><p>Our dynamic pricing engine analyses market data in real time, adjusting your rates daily for maximum occupancy at the best possible price.</p></div>
      </li>
      <li>
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.74534 4H17.3132C17.3132 4 16.4326 17.2571 12.0293 17.2571C9.87826 17.2571 8.56786 14.0935 7.79011 10.8571C6.97574 7.46844 6.74534 4 6.74534 4Z"/><path d="M17.3132 4C17.3132 4 18.2344 3.01733 19 2.99999C20.5 2.96603 20.7773 4 20.7773 4C21.0709 4.60953 21.3057 6.19429 19.8967 7.65715C18.4876 9.12 16.9103 10.4 16.2684 10.8571"/><path d="M6.74527 4.00001C6.74527 4.00001 5.78547 3.00614 4.99995 3.00001C3.49995 2.9883 3.22264 4.00001 3.22264 4.00001C2.92908 4.60953 2.69424 6.19429 4.1033 7.65715C5.51235 9.12001 7.14823 10.4 7.79004 10.8572"/><path d="M8.50662 20C8.50662 18.1714 12.0292 17.2571 12.0292 17.2571C12.0292 17.2571 15.5519 18.1714 15.5519 20H8.50662Z"/></svg>
        <div><h3>Profit-First Management</h3><p>Every decision is guided by one goal: maximising your returns — from listing optimisation to upsell strategies, we leave no revenue on the table.</p></div>
      </li>
      <li>
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8.4C18 6.70261 17.3679 5.07475 16.2426 3.87452C15.1174 2.67428 13.5913 2 12 2C10.4087 2 8.88258 2.67428 7.75736 3.87452C6.63214 5.07475 6 6.70261 6 8.4C6 15.8667 3 18 3 18H21C21 18 18 15.8667 18 8.4Z"/><path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"/></svg>
        <div><h3>24/7 Owner Dashboard</h3><p>Monitor your property's performance in real time — bookings, revenue, occupancy and guest reviews — from anywhere in the world.</p></div>
      </li>
      <li>
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20V19C5 15.134 8.13401 12 12 12C15.866 12 19 15.134 19 19V20"/><path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"/></svg>
        <div><h3>Dedicated Account Manager</h3><p>A named point of contact who knows your property personally. No call centres, no uncertainty — just reliable, expert support.</p></div>
      </li>
      <li>
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10C20 14.4183 12 22 12 22C12 22 4 14.4183 4 10C4 5.58172 7.58172 2 12 2C16.4183 2 20 5.58172 20 10Z"/><path d="M12 11C12.5523 11 13 10.5523 13 10C13 9.44772 12.5523 9 12 9C11.4477 9 11 9.44772 11 10C11 10.5523 11.4477 11 12 11Z" fill="currentColor"/></svg>
        <div><h3>Deep Local Expertise</h3><p>We operate on the ground in Portugal, with an unmatched understanding of seasonal trends, regulations and the best channels for your property.</p></div>
      </li>
      <li>
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 17L21 21"/><path d="M3 11C3 15.4183 6.58172 19 11 19C13.213 19 15.2161 18.1015 16.6644 16.6493C18.1077 15.2022 19 13.2053 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11Z"/></svg>
        <div><h3>Full Transparency</h3><p>Detailed monthly reports, real-time dashboards and complete financial visibility. You stay in control, even when we handle everything.</p></div>
      </li>
    </ul>
  </div>
</section>

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
