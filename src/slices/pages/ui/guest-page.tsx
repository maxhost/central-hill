import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";
import { getGuestPage } from "../contract";
import { FaqSection } from "./components/faq-section";

/**
 * Guests page — the approved `mock/guest.html` embedded 1:1 inside the live app shell.
 * The mock's body markup is rendered verbatim; its page-only styles are scoped under `.mk`
 * (the shared design system lives in `src/app/mock.css`) so nothing leaks to Home/admin.
 * No database is read here — content is static, matching the mock exactly. The real
 * header/footer + i18n come from the app layout. The hero <video> is the mock's static
 * markup (autoplay/muted/loop); no client JS is wired.
 */

const PAGE_STYLE = `
.mk .ico{font-size:30px;line-height:1;color:var(--accent-deep);display:inline-block;margin-bottom:18px}
.mk .welcome{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center}
.mk .welcome img{width:100%;height:100%;object-fit:cover;min-height:380px}
.mk .welcome .guarantee{margin-top:22px;font-weight:600;color:var(--accent-deep);font-size:16px;display:inline-flex;align-items:center;gap:10px}
.mk .welcome .guarantee i{font-size:22px}
.mk .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
.mk .feat{background:var(--surface);border:1px solid var(--line);padding:34px 30px}
.mk .feat h3{font-size:20px;margin-bottom:8px}
.mk .feat p{font-size:14.5px;color:var(--ink-soft)}
@media(max-width:880px){.mk .welcome{grid-template-columns:1fr;gap:32px}.mk .welcome img{min-height:280px}.mk .feat-grid{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.mk .feat-grid{grid-template-columns:1fr}}
`;

// An optional, editable <FaqSection> island is rendered between the page body and the closing
// dual-CTA (outside `.mk` to avoid mock.css leak), chosen per page via `faq_group_key`. The
// static body is split here around it.
const BODY_TOP = (locale: Locale) => `
<!-- HERO -->
<section class="hero compact" style="padding:0">
  <video autoplay muted loop playsinline poster="https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1900&q=72">
    <source src="https://videos.pexels.com/video-files/16592055/16592055-hd_1920_1080_60fps.mp4" type="video/mp4">
  </video>
  <div class="wrap">
    <span class="eyebrow">For Guests · Portugal</span>
    <h1>Where Every Stay Becomes a Story</h1>
    <p>Handpicked, professionally managed apartments in the heart of Portugal's most captivating destinations.</p>
    <div class="hero-cta">
      <a class="btn btn-accent" href="/${locale}/buildings">Browse Our Apartments →</a>
    </div>
  </div>
</section>

<!-- WELCOME -->
<section>
  <div class="wrap">
    <div class="welcome reveal">
      <div>
        <h2 class="section-title">Welcome to Central Hill</h2>
        <p class="lede" style="margin-top:18px">Every city has a soul — and we'll help you find it.</p>
        <p style="margin-top:14px;color:var(--ink-soft)">At Central Hill, we handpick properties in the heart of Portugal's most captivating destinations, so you wake up where the culture, the food, and the people are. Our team is with you from the first message to the last goodbye.</p>
        <span class="guarantee"><i class="iconoir-percentage-circle" aria-hidden="true"></i> Book directly with us for the best price, guaranteed</span>
      </div>
      <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=70" alt="Bright, design-led Central Hill apartment interior">
    </div>
  </div>
</section>

<!-- WHY BOOK DIRECTLY -->
<section class="alt">
  <div class="wrap">
    <div class="sec-head center reveal">
      <span class="eyebrow">Best Price, Guaranteed</span>
      <h2 class="section-title">Why Book Directly With Us?</h2>
      <p class="lede" style="margin:16px auto 0">Book direct and unlock perks you won't get on the big platforms — better prices, more flexibility, and personal care.</p>
    </div>
    <div class="grid-3 reveal" style="grid-template-columns:repeat(4,1fr)">
      <div class="bcard"><i class="ico iconoir-percentage-circle" aria-hidden="true"></i><h3>Get the Best Prices</h3><p>You won't find our apartments cheaper anywhere else — enjoy an average saving of €213 per reservation versus Airbnb, Booking and other platforms.</p></div>
      <div class="bcard"><i class="ico iconoir-key" aria-hidden="true"></i><h3>Early Check-In</h3><p>Enter the apartment sooner than everyone else and start your trip the moment you arrive. (Pending availability.)</p></div>
      <div class="bcard"><i class="ico iconoir-suitcase" aria-hidden="true"></i><h3>Early Luggage Drop</h3><p>Arriving before check-in time? We can let you drop your luggage at the apartment early, hands-free.</p></div>
      <div class="bcard"><i class="ico iconoir-gift" aria-hidden="true"></i><h3>Special Discounts</h3><p>Enjoy exclusive discounts on services and activities booked with us during your stay.</p></div>
    </div>
    <div class="cta-row reveal" style="justify-content:center"><a class="btn btn-accent" href="/${locale}/buildings">Browse Our Apartments →</a><span class="cta-note">View the full portfolio of available apartments across Portugal.</span></div>
  </div>
</section>

<!-- PORTFOLIO -->
<section>
  <div class="wrap">
    <div class="sec-head center reveal">
      <span class="eyebrow">The Portfolio</span>
      <h2 class="section-title">Explore Our Portfolio</h2>
      <p class="lede" style="margin:16px auto 0">Carefully selected properties across Portugal's most iconic locations — each chosen for its character and exceptional guest experience.</p>
    </div>
    <div class="pf-grid reveal">
      <a class="pcard" href="/${locale}/buildings/sample"><div class="ph"><span class="badge">★ Featured</span><img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=70" alt="Big Bairro Alto living space"></div><div class="pbody"><h3>Big Bairro Alto by Central Hill</h3><div class="pmeta">8 Bedrooms · Up to 27 Guests</div><div class="view">View →</div></div></a>
      <a class="pcard" href="/${locale}/buildings/sample"><div class="ph"><img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=70" alt="Central Downtown apartment interior"></div><div class="pbody"><h3>Central Downtown by Central Hill</h3><div class="pmeta">2 Bedrooms · Up to 6 Guests</div><div class="view">View →</div></div></a>
      <a class="pcard" href="/${locale}/buildings/sample"><div class="ph"><img src="https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=900&q=70" alt="Large Bairro Alto View apartment with city outlook"></div><div class="pbody"><h3>Large Bairro Alto View by Central Hill</h3><div class="pmeta">4 Bedrooms · Up to 10 Guests</div><div class="view">View →</div></div></a>
    </div>
    <div class="cta-row reveal" style="justify-content:center"><a class="btn btn-ghost" href="/${locale}/buildings">View All Properties →</a><span class="cta-note">Browse our full portfolio across Portugal.</span></div>
  </div>
</section>

<!-- SERVICES TEASER -->
<section class="alt">
  <div class="wrap">
    <div class="sec-head center reveal">
      <span class="eyebrow">Services</span>
      <h2 class="section-title">Make the Most of Your Stay</h2>
      <p class="lede" style="margin:16px auto 0">We go beyond accommodation. From the moment you land to every adventure in between, our team is here to make your Portugal experience unforgettable.</p>
    </div>
    <div class="feat-grid reveal">
      <div class="feat"><i class="ico iconoir-car" aria-hidden="true"></i><h3>Private Transfers</h3><p>Seamless airport and city transfers, ready the moment you land.</p></div>
      <div class="feat"><i class="ico iconoir-binocular" aria-hidden="true"></i><h3>Day Tours</h3><p>Guided escapes to Portugal's most iconic sights and hidden corners.</p></div>
      <div class="feat"><i class="ico iconoir-sea-waves" aria-hidden="true"></i><h3>Boat Trips</h3><p>See the coastline and the Tagus from the water on a private cruise.</p></div>
      <div class="feat"><i class="ico iconoir-swimming" aria-hidden="true"></i><h3>Surf Experience</h3><p>Catch your first wave with expert local instructors on Atlantic beaches.</p></div>
      <div class="feat"><i class="ico iconoir-pizza-slice" aria-hidden="true"></i><h3>Chef at Home</h3><p>A private chef cooks Portuguese flavours right in your apartment.</p></div>
      <div class="feat"><i class="ico iconoir-suitcase" aria-hidden="true"></i><h3>Luggage Storage</h3><p>Drop your bags and explore freely before check-in or after checkout.</p></div>
    </div>
    <div class="cta-row reveal" style="justify-content:center"><a class="btn btn-accent" href="/${locale}/services">Explore All Services →</a><span class="cta-note">See details, pricing, and availability.</span></div>
  </div>
</section>

<!-- WHAT TO DO TEASER -->
<section>
  <div class="wrap">
    <div class="sec-head center reveal">
      <span class="eyebrow">What to Do</span>
      <h2 class="section-title">The Best of Portugal</h2>
      <p class="lede" style="margin:16px auto 0">Whether you're exploring a vibrant city, a medieval village, or a stunning coastline — Portugal never runs out of extraordinary things to discover.</p>
    </div>
    <div class="feat-grid reveal">
      <div class="feat"><i class="ico iconoir-bank" aria-hidden="true"></i><h3>Explore Historic Districts</h3><p>Wander cobblestone streets and timeless neighbourhoods full of character.</p></div>
      <div class="feat"><i class="ico iconoir-medal" aria-hidden="true"></i><h3>Visit UNESCO World Heritage Sites</h3><p>From Sintra's palaces to centuries-old monuments and town centres.</p></div>
      <div class="feat"><i class="ico iconoir-pizza-slice" aria-hidden="true"></i><h3>Taste Portuguese Food &amp; Wine</h3><p>Pastéis de nata, fresh seafood, and world-class wine regions await.</p></div>
      <div class="feat"><i class="ico iconoir-sea-waves" aria-hidden="true"></i><h3>Relax on Stunning Beaches</h3><p>Golden sands and dramatic Atlantic coastline, never far away.</p></div>
      <div class="feat"><i class="ico iconoir-music-double-note" aria-hidden="true"></i><h3>Experience Music &amp; Festivals</h3><p>Fado nights, summer festivals, and a year-round cultural calendar.</p></div>
      <div class="feat"><i class="ico iconoir-map" aria-hidden="true"></i><h3>Day Trips &amp; Hidden Gems</h3><p>Medieval villages and lesser-known spots just beyond the city.</p></div>
    </div>
    <div class="cta-row reveal" style="justify-content:center"><a class="btn btn-ghost" href="/${locale}/guides">Discover More →</a></div>
  </div>
</section>

<!-- TESTIMONIALS -->
<section class="alt">
  <div class="wrap">
    <div class="sec-head center reveal"><span class="eyebrow">Reviews</span><h2 class="section-title">We Care About Our Guests</h2></div>
    <div class="t-grid reveal">
      <div class="tcard"><div class="ttype">Guest</div><div class="stars">★★★★★</div><blockquote>“The apartment was spotless, beautifully presented, and in the perfect location. Check-in was completely seamless. Easily the best apartment we've ever rented in Europe.”</blockquote><div class="tauthor"><b>Emma &amp; James</b> · United Kingdom</div></div>
      <div class="tcard"><div class="ttype">Guest</div><div class="stars">★★★★★</div><blockquote>“We have stayed at multiple Central Hill properties over the years and the standard is consistently excellent. We always know exactly what to expect — and it always exceeds it.”</blockquote><div class="tauthor"><b>Lars Andersen</b> · Denmark</div></div>
      <div class="tcard"><div class="ttype">Guest</div><div class="stars">★★★★★</div><blockquote>“Perfect stay for our family of six. The apartment was immaculate, the neighbourhood was extraordinary, and the support team resolved a small issue within 20 minutes.”</blockquote><div class="tauthor"><b>Sophie Martin</b> · France</div></div>
    </div>
  </div>
</section>

`;

const BODY_BOTTOM = (locale: Locale) => `
<!-- DUAL CTA -->
<section>
  <div class="wrap">
    <div class="dual reveal">
      <div class="dcol">
        <span class="eyebrow">Guests</span><h3>Planning a Stay? Find your perfect apartment.</h3>
        <p>Browse our full portfolio of professionally managed apartments across Portugal's most sought-after locations — studios to 8-bedrooms, for every type of stay.</p>
        <a class="btn btn-solid" href="/${locale}/buildings">Browse Our Apartments →</a>
        <div class="contact-line">Bookings +351 910 075 725 · info@centralhill.pt</div>
      </div>
      <div class="dcol owner">
        <span class="eyebrow">Owners</span><h3>Own a Property? Start earning more.</h3>
        <p>Find out what your property could earn with a free, no-obligation profitability analysis. Our team will assess your property and come back within 48 hours.</p>
        <a class="btn btn-accent" href="/${locale}/owners">Get Your Free Earnings Estimate →</a>
        <div class="contact-line">Call +351 910 075 725 · info@centralhill.pt · WhatsApp +351 910 075 725</div>
      </div>
    </div>
  </div>
</section>
`;

export async function GuestPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [page, t] = await Promise.all([getGuestPage(locale), getTranslations("pages")]);
  const faqGroupKey = page?.content.faq_group_key ?? "";

  return (
    <>
      <div className="mk" data-page="guests">
        <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
        <div dangerouslySetInnerHTML={{ __html: BODY_TOP(locale) }} />
      </div>
      {faqGroupKey ? (
        <div id="faq" style={{ scrollMarginTop: 130 }}>
          <FaqSection
            locale={locale}
            groupKey={faqGroupKey}
            eyebrow={t("faqEyebrow")}
            title={t("faqTitle")}
          />
        </div>
      ) : null}
      <div className="mk" data-page="guests">
        <div dangerouslySetInnerHTML={{ __html: BODY_BOTTOM(locale) }} />
      </div>
    </>
  );
}
