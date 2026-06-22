import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { OwnerSubnavReveal } from "./components/owner-subnav-reveal";
import { OwnerStatsCounter } from "./components/owner-stats-counter";
import { TestimonialsRow } from "./components/testimonials-row";

/**
 * Owners page — a focused conversion landing embedded 1:1 inside the live app shell.
 * The mock's body markup is rendered verbatim; its page styles are scoped under `.mk`
 * (see `src/app/mock.css` for the shared design system) so nothing leaks to Home/admin.
 * The static body is split around one shared React island — the testimonials marquee — which
 * is the only piece that reads the DB (via the testimonials contract, like the home).
 *
 * Sections (owner direction): hero + earnings form, the animated "numbers" band, then the
 * full marketing flow — why / services / plans (up to 4 tiers) / journey / technology /
 * testimonials / faq — and the closing CTA. Per owner request the per-section *eyebrow* labels
 * were dropped (the big section titles stay); the "★ Earn +25%" badge sits inside the form card
 * (highlighted); the `why` section uses the home's Editorial-Split layout; `services`
 * ("Everything Handled") and `dashboard` ("Always in Sight") use the home's Image-Showcase layout
 * (4 benefit highlights + CTA beside a 4:5 image with a floating badge) — `dashboard` mirrored
 * with the image on the left; the `testimonials` section is the shared <TestimonialsRow> marquee
 * (the home "Partners & Guests" carousel), rendered outside `.mk` to avoid style leak. Marketing
 * sections are mirrored in the owners schema (editor-ready, drizzle 0005→0007). (The static body
 * content is still markup for now; wiring it to the DB + leads action is a follow-up.)
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
.mk .owner-showcase .wrap{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
.mk .owner-showcase .sh-text h2{font-size:clamp(28px,3.4vw,44px);line-height:1.12;margin:0;color:var(--ink)}
.mk .owner-showcase .sh-sub{margin-top:18px;font-size:18px;line-height:1.6;color:var(--ink-soft)}
.mk .owner-showcase .sh-list{list-style:none;margin:32px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:22px 32px}
.mk .owner-showcase .sh-list li{display:flex;gap:14px}
.mk .owner-showcase .sh-list .ic{width:26px;height:26px;flex:0 0 auto;margin-top:2px;color:var(--accent-deep)}
.mk .owner-showcase .sh-list h3{font-size:17px;margin:0 0 5px;color:var(--ink)}
.mk .owner-showcase .sh-list p{font-size:14px;line-height:1.55;color:var(--ink-soft);margin:0}
.mk .owner-showcase .sh-cta{margin-top:36px}
.mk .owner-showcase .sh-note{margin-top:14px;font-size:14px;color:var(--ink-soft)}
.mk .owner-showcase .sh-media{position:relative}
.mk .owner-showcase .sh-media img{aspect-ratio:4/5;width:100%;object-fit:cover;border-radius:3px;display:block}
.mk .owner-showcase .sh-badge{position:absolute;bottom:-20px;left:-16px;display:flex;align-items:flex-start;gap:10px;max-width:15rem;background:var(--surface);border:1px solid var(--line);border-radius:3px;padding:16px 20px;box-shadow:0 24px 50px -20px rgba(0,0,0,.4)}
.mk .owner-showcase .sh-badge .ic{width:20px;height:20px;flex:0 0 auto;margin-top:1px;color:var(--accent-deep)}
.mk .owner-showcase .sh-badge span{font-size:14px;line-height:1.4;color:var(--ink)}
.mk .owner-showcase.reverse .sh-media{order:-1}
.mk .owner-showcase.reverse .sh-badge{left:auto;right:-16px}
.mk .plans{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;align-items:start}
.mk .plan{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:34px 26px;display:flex;flex-direction:column;position:relative;transition:.3s var(--ease)}
.mk .plan:hover{transform:translateY(-4px);box-shadow:0 24px 50px -30px rgba(0,0,0,.42)}
.mk .plan.popular{border-color:var(--accent);box-shadow:0 24px 54px -28px color-mix(in srgb,var(--accent) 55%,transparent)}
.mk .plan .pop-tag{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--accent);color:#fff;font-size:11px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;padding:6px 16px;border-radius:30px}
.mk .plan .pname{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent-deep);font-weight:600}
.mk .plan .ptag{font-family:var(--serif);font-size:25px;color:var(--ink);margin:10px 0 22px;line-height:1.2}
.mk .plan ul{list-style:none;margin:0 0 28px;flex:1}
.mk .plan li{font-size:14.5px;color:var(--ink-soft);padding:9px 0 9px 28px;position:relative;border-top:1px solid var(--line)}
.mk .plan li:first-child{border-top:0}
.mk .plan li::before{content:"";position:absolute;left:0;top:14px;width:14px;height:8px;border-left:2px solid var(--accent);border-bottom:2px solid var(--accent);transform:rotate(-45deg)}
.mk .plan .btn{width:100%;justify-content:center}
.mk .plan-helpers{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:80px}
.mk .plan-helper{background:color-mix(in srgb,var(--line) 38%,var(--bg));border:1px solid var(--line);border-radius:8px;padding:30px 32px}
.mk .plan-helper h4{font-family:var(--serif);font-size:21px;font-weight:500;color:var(--ink);margin-bottom:8px}
.mk .plan-helper p{font-size:14.5px;color:var(--ink-soft);margin-bottom:18px}
.mk .steps{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}
.mk .step{background:var(--surface);padding:36px 28px}
.mk .step .snum{font-family:var(--serif);font-size:46px;line-height:1;color:var(--accent);opacity:.85;margin-bottom:16px}
.mk .step h3{font-size:20px;margin-bottom:9px}
.mk .step p{font-size:14px;color:var(--ink-soft)}
.mk .faq{max-width:820px;margin:0 auto;border-top:1px solid var(--line)}
.mk .faq details{border-bottom:1px solid var(--line)}
.mk .faq summary{list-style:none;cursor:pointer;padding:24px 44px 24px 4px;position:relative;font-family:var(--serif);font-size:20px;color:var(--ink);transition:color .2s}
.mk .faq summary::-webkit-details-marker{display:none}
.mk .faq summary:hover{color:var(--accent-deep)}
.mk .faq summary::after{content:"+";position:absolute;right:6px;top:22px;font-family:var(--sans);font-size:24px;color:var(--accent);transition:transform .25s var(--ease)}
.mk .faq details[open] summary::after{transform:rotate(45deg)}
.mk .faq .faq-a{padding:0 44px 26px 4px;font-size:15.5px;color:var(--ink-soft);max-width:70ch}
@media(max-width:980px){.mk .owner-hero .wrap{grid-template-columns:1fr;gap:34px}.mk .owner-pitch .wrap{grid-template-columns:1fr;gap:36px}.mk .owner-pitch .pitch-text{position:static}.mk .owner-showcase .wrap{grid-template-columns:1fr;gap:36px}.mk .owner-showcase .sh-media,.mk .owner-showcase.reverse .sh-media{order:-1}.mk .owner-showcase .sh-badge{left:0}.mk .owner-showcase.reverse .sh-badge{left:0;right:auto}.mk .plans{grid-template-columns:repeat(2,1fr)}.mk .plan-helpers{grid-template-columns:1fr}.mk .steps{grid-template-columns:1fr 1fr}}
@media(max-width:680px){.mk .est-two{grid-template-columns:1fr}.mk .owner-showcase .sh-list{grid-template-columns:1fr}.mk .plans{grid-template-columns:1fr}.mk .steps{grid-template-columns:1fr}}
`;

const OWNERS_BODY_TOP = `
<nav class="owner-subnav" aria-label="Owner page sections">
  <div class="wrap">
    <a href="#worth">What's My Property Worth?</a>
    <a href="#numbers">Numbers That Speak for Themselves</a>
    <a href="#why">Why Owners Choose Us</a>
    <a href="#services">Everything Done for You</a>
    <a href="#plans">Find Your Perfect Plan</a>
    <a href="#journey">Your Growth Path</a>
    <a href="#technology">Full Visibility from Anywhere</a>
    <a href="#testimonials">What Our Owners Say</a>
    <a href="#faq">Got Questions? We Have Answers.</a>
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

<section id="services" class="alt owner-showcase">
  <div class="wrap">
    <div class="sh-text reveal">
      <h2>Everything Handled. Nothing Overlooked.</h2>
      <p class="sh-sub">From the first listing to each guest's departure, Central Hill Apartments manages every detail so you don't have to.</p>
      <ul class="sh-list">
        <li>
          <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 6l1.5-2h5L16 6"/></svg>
          <div><h3>Listing &amp; Marketing</h3><p>Professional photography, copy and multi-channel distribution across Airbnb, Booking.com and direct.</p></div>
        </li>
        <li>
          <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>
          <div><h3>Reservations &amp; Guest Care</h3><p>24/7 multilingual communication, calendar and seamless check-in/out — every stay runs smoothly.</p></div>
        </li>
        <li>
          <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 6l-2 2-4-4 2-2a2.8 2.8 0 0 1 4 4z" transform="translate(-3 0)"/><path d="M3 21l9-9M5 14l5 5"/></svg>
          <div><h3>Housekeeping &amp; Maintenance</h3><p>Hotel-standard cleaning, premium linen and proactive upkeep keep your home guest-ready.</p></div>
        </li>
        <li>
          <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-9"/><path d="M21 7v5h-5"/></svg>
          <div><h3>Revenue &amp; Compliance</h3><p>AI-driven pricing, monthly reporting and full Alojamento Local licensing &amp; tax support.</p></div>
        </li>
      </ul>
      <div class="sh-cta"><a class="btn btn-accent" href="#worth">See how we manage your home →</a></div>
      <p class="sh-note">Fully managed, end to end — you stay informed, we do the work.</p>
    </div>
    <div class="sh-media reveal">
      <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=72" alt="Designer-furnished Lisbon apartment, guest-ready">
      <div class="sh-badge">
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        <span>Every detail handled — you stay free.</span>
      </div>
    </div>
  </div>
</section>

<section id="plans">
  <div class="wrap">
    <div class="sec-head center reveal">
      <h2 class="section-title">A Management Plan Built Around Your Goals</h2>
      <p class="lede" style="margin:16px auto 0">Choose the level of service that suits your property and ambitions. Every plan includes AI-driven pricing and a 24/7 owner dashboard.</p>
    </div>

    <div class="plans reveal">
      <div class="plan">
        <div class="pname">Starter</div>
        <div class="ptag">Listing &amp; bookings only</div>
        <ul>
          <li>Listing creation &amp; optimisation</li>
          <li>Multi-channel distribution</li>
          <li>AI-powered dynamic pricing</li>
          <li>Secure payment handling</li>
          <li>Monthly owner report</li>
          <li>24/7 owner dashboard access</li>
        </ul>
        <a class="btn btn-ghost" href="#">Choose Starter</a>
      </div>

      <div class="plan">
        <div class="pname">Essential</div>
        <div class="ptag">Core full management</div>
        <ul>
          <li>Listing creation &amp; optimisation</li>
          <li>Reservation management 24/7</li>
          <li>AI-powered dynamic pricing</li>
          <li>Professional cleaning coordination</li>
          <li>Monthly owner report</li>
          <li>24/7 owner dashboard access</li>
        </ul>
        <a class="btn btn-ghost" href="#">Choose Essential</a>
      </div>

      <div class="plan popular">
        <span class="pop-tag">Most Popular</span>
        <div class="pname">Premium</div>
        <div class="ptag">Full-service management</div>
        <ul>
          <li>Everything in Essential</li>
          <li>Dedicated account manager</li>
          <li>Professional photography</li>
          <li>Interior styling advice</li>
          <li>Multi-platform distribution</li>
          <li>Revenue &amp; yield optimisation</li>
          <li>Priority maintenance response</li>
          <li>Legal &amp; fiscal guidance</li>
        </ul>
        <a class="btn btn-accent" href="#">Choose Premium</a>
      </div>

      <div class="plan">
        <div class="pname">Concierge</div>
        <div class="ptag">Bespoke white-glove service</div>
        <ul>
          <li>Everything in Premium</li>
          <li>Bespoke guest experience design</li>
          <li>VIP concierge for guests</li>
          <li>Luxury welcome packs</li>
          <li>Tailored analytics &amp; reporting</li>
          <li>Dedicated property consultant</li>
          <li>Guaranteed income option</li>
          <li>Multi-property portfolio management</li>
        </ul>
        <a class="btn btn-ghost" href="#">Choose Concierge</a>
      </div>
    </div>

    <div class="plan-helpers reveal">
      <div class="plan-helper">
        <h4>Found a better commission?</h4>
        <p>We match the best commissions and plans in the market.</p>
        <a class="btn btn-ghost" href="#">Contact Us for More Information</a>
      </div>
      <div class="plan-helper">
        <h4>Not sure which plan is right for you?</h4>
        <p>Our team will assess your property and recommend the best plan. Start with a free, no-obligation Profitability Study.</p>
        <a class="btn btn-accent" href="#">Get Your Free Earnings Estimate →</a>
      </div>
    </div>
  </div>
</section>

<section id="journey" class="alt">
  <div class="wrap">
    <div class="sec-head center reveal">
      <h2 class="section-title">Getting Started Is Simple</h2>
      <p class="lede" style="margin:16px auto 0">From first contact to first booking, we handle everything. Here is what to expect.</p>
    </div>
    <div class="steps reveal">
      <div class="step">
        <div class="snum">01</div>
        <h3>Free Property Assessment</h3>
        <p>We evaluate your property's rental potential, location, and estimated returns — at no cost and with no obligation.</p>
      </div>
      <div class="step">
        <div class="snum">02</div>
        <h3>Tailored Proposal</h3>
        <p>You receive a personalized management proposal with projected revenue, recommended plan, and full commission transparency.</p>
      </div>
      <div class="step">
        <div class="snum">03</div>
        <h3>Onboarding &amp; Setup</h3>
        <p>Professional photography, listing creation, platform registration, and property preparation — all handled within days.</p>
      </div>
      <div class="step">
        <div class="snum">04</div>
        <h3>Live Management</h3>
        <p>Your property goes live across all platforms. We manage bookings, guests, cleaning, and maintenance 24/7.</p>
      </div>
      <div class="step">
        <div class="snum">05</div>
        <h3>Monthly Reporting &amp; Payouts</h3>
        <p>You receive a detailed performance report and your earnings every month — clear, transparent, and always on time.</p>
      </div>
    </div>
  </div>
</section>

<section id="technology" class="owner-showcase reverse">
  <div class="wrap">
    <div class="sh-text reveal">
      <h2>Your Property, Always in Sight</h2>
      <p class="sh-sub">Our owner dashboard gives you real-time visibility into every aspect of your property's performance — from anywhere in the world.</p>
      <ul class="sh-list">
        <li>
          <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M14.5 9.5a2.5 2 0 0 0-2.5-1.5c-1.4 0-2.5.8-2.5 2s1.1 2 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2a2.5 2 0 0 1-2.5-1.5"/></svg>
          <div><h3>Live Revenue Tracking</h3><p>Your earnings and projected monthly income at a glance, updated in real time.</p></div>
        </li>
        <li>
          <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M8 14h3M8 17h6"/></svg>
          <div><h3>Booking Calendar</h3><p>Full visibility of reservations, blocked dates and availability across all platforms.</p></div>
        </li>
        <li>
          <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>
          <div><h3>Occupancy &amp; Performance</h3><p>Track occupancy rates, average nightly rate and review scores over any period.</p></div>
        </li>
        <li>
          <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>
          <div><h3>Alerts &amp; Statements</h3><p>Instant alerts for bookings and check-ins, plus downloadable monthly statements anytime.</p></div>
        </li>
      </ul>
      <div class="sh-cta"><a class="btn btn-accent" href="#worth">Explore the owner dashboard →</a></div>
      <p class="sh-note">Real-time visibility into your property, 24/7.</p>
    </div>
    <div class="sh-media reveal">
      <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=72" alt="Owner dashboard showing live revenue and occupancy">
      <div class="sh-badge">
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        <span>Real-time data, from anywhere.</span>
      </div>
    </div>
  </div>
</section>

`;

// The "What our owners say" section is rendered by the shared <TestimonialsRow> React island
// (the same infinite marquee as the home "We Care About Our Partners & Guests" section), so the
// body is split here — top sections above the carousel, faq + closing CTA below it.
const OWNERS_BODY_BOTTOM = `
<section id="faq">
  <div class="wrap">
    <div class="sec-head center reveal">
      <h2 class="section-title">Questions? We Have Answers.</h2>
    </div>
    <div class="faq reveal">
      <details>
        <summary>What types of properties does Central Hill Apartments manage?</summary>
        <div class="faq-a">We manage all property types across Portugal, from compact studios to large 8-bedroom apartments accommodating up to 27 guests. Whether you own a single apartment or a growing portfolio, we have the right plan for you.</div>
      </details>
      <details>
        <summary>How does your pricing and commission work?</summary>
        <div class="faq-a">We operate on a commission model — we earn when you earn. Your personalized proposal includes a full, transparent breakdown of all fees and platform commissions with no hidden costs.</div>
      </details>
      <details>
        <summary>Do I need to be in Portugal to work with Central Hill Apartments?</summary>
        <div class="faq-a">Not at all. Many of our owners are based overseas. Our fully remote management model means you can monitor your property and receive your earnings from anywhere in the world.</div>
      </details>
      <details>
        <summary>How quickly can my property be listed?</summary>
        <div class="faq-a">Most properties are live within 5 business days of completing onboarding. This includes professional photography, listing creation, and platform setup.</div>
      </details>
      <details>
        <summary>What happens if there is damage to my property?</summary>
        <div class="faq-a">We conduct check-out inspections after every stay. All bookings are covered by platform guarantee schemes, and our team handles any damage claims directly on your behalf.</div>
      </details>
      <details>
        <summary>Can I block dates for personal use?</summary>
        <div class="faq-a">Absolutely. Your property remains yours. You can block any dates through your owner dashboard at any time, with no restrictions or extra charges.</div>
      </details>
      <details>
        <summary>Do you handle legal and tax compliance?</summary>
        <div class="faq-a">Yes. We provide guidance on Alojamento Local licensing, AIMA registration requirements, and local tax obligations specific to Portugal.</div>
      </details>
    </div>
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
    <>
      <div className="mk" data-page="owners">
        <style dangerouslySetInnerHTML={{ __html: OWNERS_STYLE }} />
        <OwnerSubnavReveal />
        <OwnerStatsCounter />
        <div dangerouslySetInnerHTML={{ __html: OWNERS_BODY_TOP }} />
      </div>
      {/*
       * Shared testimonials marquee (same component/visual as the home "Partners & Guests"
       * section). Rendered OUTSIDE the `.mk` wrapper so `mock.css`'s bare-element rules don't
       * leak into its Tailwind markup. The wrapper carries the `#testimonials` anchor + scroll
       * offset that the owner sub-nav links to.
       */}
      <div id="testimonials" style={{ scrollMarginTop: 130 }}>
        <TestimonialsRow locale={locale} showEyebrow={false} />
      </div>
      <div className="mk" data-page="owners">
        <div dangerouslySetInnerHTML={{ __html: OWNERS_BODY_BOTTOM }} />
      </div>
    </>
  );
}
