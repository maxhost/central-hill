import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";

/**
 * Building detail page — the approved `mock/building-detail.html` embedded 1:1
 * inside the live app shell. This is a DYNAMIC route, but the database is
 * disconnected: the mock's single example building ("Large Bairro Alto View")
 * is rendered statically for ANY slug. The mock's body markup is rendered
 * verbatim; its page styles are scoped under `.mk` (see `src/app/mock.css` for
 * the shared design system) so nothing leaks to Home/admin. The real
 * header/footer + i18n come from the app layout.
 *
 * The Avantio booking widget is, in the mock, a static "Booking powered by
 * Avantio" note plus CTAs pointing at the `#avantio` anchor — it is rendered
 * verbatim/static here and is NOT wired to a real engine. The image gallery,
 * spec strip and FAQ <details> are plain HTML/CSS (no mock JS needed);
 * `.reveal` is already neutralised in mock.css so content stays visible.
 */

const PAGE_STYLE = `
.mk .crumb{font-size:13px;letter-spacing:.02em;color:#ecdcc2;margin-bottom:6px}
.mk .crumb a{color:#ecdcc2;opacity:.85;transition:opacity .2s}
.mk .crumb a:hover{opacity:1;text-decoration:underline}
.mk .crumb span{opacity:.55;margin:0 8px}
.mk .crumb .here{opacity:.7}
.mk .hero .addr{font-size:16px;color:#f1ece2;max-width:none;margin:6px 0 0}
.mk .hero .flag{display:inline-block;background:var(--accent);color:#fff;font-size:11px;letter-spacing:.13em;text-transform:uppercase;padding:4px 10px;font-weight:600;margin-right:12px}
.mk .gallery{display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:1fr 1fr;gap:10px;border-radius:4px;overflow:hidden}
.mk .gallery img{width:100%;height:100%;object-fit:cover;display:block}
.mk .gallery .g0{grid-row:1/3}
@media(max-width:680px){.mk .gallery{grid-template-columns:1fr 1fr}.mk .gallery .g0{grid-row:auto;grid-column:1/3}}
.mk .specstrip{display:flex;flex-wrap:wrap;justify-content:space-between;gap:24px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:34px 0;margin-top:46px}
.mk .spec{flex:1 1 0;min-width:140px;text-align:center}
.mk .spec .n{font-family:var(--serif);font-size:clamp(30px,3.4vw,44px);line-height:1;color:var(--ink)}
.mk .spec .l{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);margin-top:10px}
.mk .prose{max-width:68ch}
.mk .prose p{color:var(--ink-soft);margin-bottom:18px;font-size:17px}
.mk .prose h3{font-size:clamp(24px,3vw,34px);margin:46px 0 16px}
.mk .pbody .check{margin-top:18px;display:inline-flex;align-items:center;gap:.45em;font-size:13.5px;font-weight:600;letter-spacing:.02em;color:var(--accent-deep);border-bottom:1px solid color-mix(in srgb,var(--accent-deep) 35%,transparent);padding-bottom:2px;transition:.2s}
.mk .pcard:hover .check{color:var(--accent)}
.mk .powered{font-size:12.5px;letter-spacing:.04em;color:var(--ink-soft);margin-top:30px;text-align:center}
.mk .powered b{color:var(--ink);font-weight:600}
.mk .am-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}
.mk .am{background:var(--surface);display:flex;align-items:center;gap:14px;padding:24px 26px}
.mk .am svg{width:22px;height:22px;flex:none;color:var(--accent-deep)}
.mk .am span{font-size:15px;color:var(--ink)}
@media(max-width:980px){.mk .am-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:680px){.mk .am-grid{grid-template-columns:1fr}}
.mk .faq{max-width:780px}
.mk .faq details{border-bottom:1px solid var(--line)}
.mk .faq summary{cursor:pointer;list-style:none;padding:24px 0;font-family:var(--serif);font-size:21px;color:var(--ink);display:flex;justify-content:space-between;align-items:center;gap:20px;transition:color .2s}
.mk .faq summary::-webkit-details-marker{display:none}
.mk .faq summary:hover{color:var(--accent-deep)}
.mk .faq summary::after{content:"+";font-family:var(--sans);font-size:24px;color:var(--accent-deep);line-height:1;transition:transform .25s var(--ease)}
.mk .faq details[open] summary::after{transform:rotate(45deg)}
.mk .faq details p{color:var(--ink-soft);font-size:16px;padding:0 0 26px;max-width:64ch}
.mk .bookband{background:var(--feature);color:var(--on-feature)}
.mk .bookband .inner{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:30px;padding:64px 0}
.mk .bookband .eyebrow{color:var(--feature-accent)}
.mk .bookband h2{font-size:clamp(28px,3.6vw,46px);color:#fff;margin:12px 0 14px;max-width:18ch}
.mk .bookband .sub{color:var(--on-feature-soft);font-size:15px;max-width:46ch}
.mk .bookband .act{display:flex;flex-direction:column;gap:12px;align-items:flex-start}
.mk .bookband .note{font-size:12.5px;color:var(--on-feature-soft);letter-spacing:.02em}
`;

const BODY = (locale: Locale) => `
<section class="hero compact" style="padding:0">
  <img src="https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1900&q=72" alt="Large Bairro Alto View — bright living room with city outlook">
  <div class="wrap">
    <nav class="crumb" aria-label="Breadcrumb">
      <a href="/${locale}">Home</a><span>/</span><a href="/${locale}/buildings">Buildings</a><span>/</span><span class="here">Large Bairro Alto View</span>
    </nav>
    <span class="eyebrow"><span class="flag">★ New</span>Bairro Alto · Lisbon</span>
    <h1>Large Bairro Alto View by Central Hill</h1>
    <p class="addr">Rua da Alegria 61, Lisbon</p>
  </div>
</section>

<section style="padding-bottom:0">
  <div class="wrap">
    <div class="gallery reveal">
      <img class="g0" src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=70" alt="Sunlit open-plan living and dining area">
      <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=70" alt="Designer kitchen with stone worktops" loading="lazy">
      <img src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=70" alt="Calm bedroom with linen bedding" loading="lazy">
      <img src="https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1200&q=70" alt="Bairro Alto rooftops and Lisbon skyline" loading="lazy">
      <img src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=70" alt="Cosy lounge corner with warm lighting" loading="lazy">
    </div>

    <div class="specstrip reveal">
      <div class="spec"><div class="n">6</div><div class="l">Apartments</div></div>
      <div class="spec"><div class="n">22</div><div class="l">Up to Guests</div></div>
      <div class="spec"><div class="n">14</div><div class="l">Beds</div></div>
      <div class="spec"><div class="n">Bairro Alto</div><div class="l">Neighbourhood</div></div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">The Building</span>
      <h2 class="section-title">A view over the heart of Lisbon</h2>
    </div>
    <div class="prose reveal">
      <p>Welcome to Large Bairro Alto View by Central Hill — a premium address on Rua da Alegria, set in one of Lisbon's most coveted locations, where the elegance of Avenida da Liberdade meets the creative energy of Príncipe Real and the soul of Bairro Alto.</p>
      <p>These spacious, high-quality apartments have been designed for those who want it all: a refined home base with the city's very best on the doorstep. Step outside and within moments you are immersed in Lisbon life at its most authentic and vibrant.</p>

      <h3>The Neighbourhood</h3>
      <p>Príncipe Real is Lisbon at its most sophisticated — a neighbourhood of wide, tree-lined streets, independent boutiques, and some of the finest restaurants and rooftop terraces in the city. The weekend farmers' market fills the garden square with local produce, artisan goods, and the easy pace of Lisbon's most discerning locals. The Botanical Garden, tucked quietly nearby, offers a rare green retreat in the heart of the city.</p>
      <p>Just steps further, Bairro Alto tells a different but equally compelling story. One of Lisbon's oldest quarters, its 16th-century grid of cobbled streets is unhurried by day — a place of sunlit café terraces, independent design shops, and the lingering scent of lunch drifting from neighbourhood restaurants. By night, the neighbourhood transforms entirely. Fado houses fill with haunting melody, bars spill onto the streets, and people of every background gather in the lanes with a glass in hand, drawn together by Lisbon's famously mild evenings and effortless sense of community.</p>
      <p>From this address, Lisbon's greatest neighbourhoods are yours to explore on foot — Chiado, Rossio, Alfama, and the riverside are all within comfortable walking distance.</p>
    </div>
  </div>
</section>

<section class="alt" id="apartments">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Bookable Units</span>
      <h2 class="section-title">Apartments in this Building</h2>
      <p class="lede" style="margin-top:16px">Six distinct homes under one roof. Choose the layout that suits your stay and book in real time — availability and pricing are live through our booking engine.</p>
    </div>

    <div class="pf-grid reveal">
      <a class="pcard" href="#avantio">
        <div class="ph"><span class="badge">Penthouse</span><img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=70" alt="Alegria Penthouse living space" loading="lazy"></div>
        <div class="pbody"><h3>Alegria Penthouse</h3><div class="pmeta">3 Bedrooms · Up to 6 Guests · 4 Beds</div><span class="check">Check availability →</span></div>
      </a>
      <a class="pcard" href="#avantio">
        <div class="ph"><img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=70" alt="Alegria Terrace apartment with outdoor space" loading="lazy"></div>
        <div class="pbody"><h3>Alegria Terrace</h3><div class="pmeta">2 Bedrooms · Up to 4 Guests · 3 Beds</div><span class="check">Check availability →</span></div>
      </a>
      <a class="pcard" href="#avantio">
        <div class="ph"><img src="https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=70" alt="Alegria Garden bright one-bedroom interior" loading="lazy"></div>
        <div class="pbody"><h3>Alegria Garden</h3><div class="pmeta">1 Bedroom · Up to 2 Guests · 1 Bed</div><span class="check">Check availability →</span></div>
      </a>
      <a class="pcard" href="#avantio">
        <div class="ph"><img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=70" alt="Alegria Loft studio with open layout" loading="lazy"></div>
        <div class="pbody"><h3>Alegria Loft</h3><div class="pmeta">Studio · Up to 2 Guests · 1 Bed</div><span class="check">Check availability →</span></div>
      </a>
      <a class="pcard" href="#avantio">
        <div class="ph"><img src="https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=900&q=70" alt="Alegria Classic two-bedroom apartment" loading="lazy"></div>
        <div class="pbody"><h3>Alegria Classic</h3><div class="pmeta">2 Bedrooms · Up to 5 Guests · 3 Beds</div><span class="check">Check availability →</span></div>
      </a>
      <a class="pcard" href="#avantio">
        <div class="ph"><img src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=70" alt="Alegria Skyline bedroom with city view" loading="lazy"></div>
        <div class="pbody"><h3>Alegria Skyline</h3><div class="pmeta">1 Bedroom · Up to 3 Guests · 2 Beds</div><span class="check">Check availability →</span></div>
      </a>
    </div>

    <div class="powered" id="avantio">Booking powered by <b>Avantio</b> — real-time availability and instant confirmation.</div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">What's Included</span>
      <h2 class="section-title">Building Amenities</h2>
    </div>
    <div class="am-grid reveal">
      <div class="am"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8.5a16 16 0 0120 0"/><path d="M5 12a11 11 0 0114 0"/><path d="M8.5 15.5a6 6 0 017 0"/><circle cx="12" cy="19" r="1"/></svg><span>Free WiFi</span></div>
      <div class="am"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="8" rx="2"/><path d="M7 17v1M12 17v2M17 17v1"/></svg><span>Air conditioning</span></div>
      <div class="am"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 3h16v18H4z"/><path d="M4 10h16M8 3v7"/><path d="M15 5.5h2"/></svg><span>Equipped kitchen</span></div>
      <div class="am"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="13" r="4.5"/><path d="M8 6h.01M11 6h.01"/></svg><span>Washing machine</span></div>
      <div class="am"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8"/></svg><span>Smart TV</span></div>
      <div class="am"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="2" width="12" height="20" rx="1.5"/><path d="M10 6h4"/><path d="M12 18v.01"/></svg><span>Elevator</span></div>
      <div class="am"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="10" width="16" height="11" rx="1.5"/><path d="M8 10V7a4 4 0 018 0"/><circle cx="12" cy="15.5" r="1.5"/></svg><span>Self check-in</span></div>
      <div class="am"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 14a4 4 0 118 0v6H8z"/><path d="M12 3v4M9 5l3 2 3-2"/></svg><span>Heating</span></div>
      <div class="am"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/></svg><span>Workspace</span></div>
      <div class="am"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 9h11v4a4 4 0 01-4 4H9a4 4 0 01-4-4z"/><path d="M16 10h2a2 2 0 010 4h-2"/><path d="M8 5V3M11 5V3"/></svg><span>Coffee machine</span></div>
      <div class="am"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="5"/><path d="M11.5 11.5L20 20"/><path d="M16 16h4v4"/></svg><span>Hairdryer</span></div>
      <div class="am"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21V8l6-4 6 4v13"/><path d="M15 21V11l6 0v10"/><path d="M6 9h.01M6 13h.01M6 17h.01"/></svg><span>City view</span></div>
    </div>
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Good to Know</span>
      <h2 class="section-title">Frequently Asked Questions</h2>
    </div>
    <div class="faq reveal">
      <details>
        <summary>How does check-in work?</summary>
        <p>Check-in is contactless and available from 3:00 PM. A few days before arrival you'll receive your personal access code and step-by-step directions to your apartment. Our guest team is reachable around the clock if you'd prefer to be met in person.</p>
      </details>
      <details>
        <summary>Is there an elevator in the building?</summary>
        <p>Yes. The building has a lift serving every floor, so all six apartments — including the penthouse — are easily accessible with luggage.</p>
      </details>
      <details>
        <summary>Are pets allowed?</summary>
        <p>We welcome well-behaved pets in selected apartments on request. Please let us know at the time of booking so we can confirm availability and arrange a small cleaning supplement.</p>
      </details>
      <details>
        <summary>How far is the city centre?</summary>
        <p>You're already in it. Chiado and the shops of Baixa are a 5–10 minute walk downhill, Príncipe Real is a few minutes uphill, and most of historic Lisbon is comfortably reachable on foot.</p>
      </details>
      <details>
        <summary>Is parking available?</summary>
        <p>The building is in a pedestrian-friendly, permit-only area, so we recommend the secure public car parks a short walk away. Share your arrival details and we'll point you to the closest option.</p>
      </details>
    </div>
  </div>
</section>

<section class="bookband" style="padding:0">
  <div class="wrap">
    <div class="inner reveal">
      <div>
        <span class="eyebrow">Reserve Your Stay</span>
        <h2>Book an Apartment in This Building</h2>
        <p class="sub">Pick your dates and unit — confirmation is instant.</p>
      </div>
      <div class="act">
        <a class="btn btn-accent" href="#avantio">Check Availability →</a>
        <span class="note">Real-time availability &amp; pricing via Avantio.</span>
      </div>
    </div>
  </div>
</section>
`;

export async function BuildingDetail({ locale }: { locale: Locale; slug: string }) {
  setRequestLocale(locale);
  return (
    <div className="mk" data-page="building">
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
      <div dangerouslySetInnerHTML={{ __html: BODY(locale) }} />
    </div>
  );
}
