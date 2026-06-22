import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";

/**
 * Guest services page — the approved `mock/services.html` embedded 1:1 inside the live app
 * shell. The mock's body markup is rendered verbatim; its page-only styles are scoped under
 * `.mk` (shared design system lives in `src/app/mock.css`) so nothing leaks to Home/admin.
 * No database is read here — content is static, matching the mock exactly. The real
 * header/footer + i18n come from the app layout. (Iconoir glyphs use the mock's `<i class>`
 * markup; the icon font is not loaded in the app shell, so those marks render blank — an
 * accepted gap matching the other rebuilt pages.)
 */

const PAGE_STYLE = `
.mk .pcard .ph .svc-ico{position:absolute;left:16px;bottom:16px;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:var(--surface);color:var(--accent-deep);font-size:24px;box-shadow:0 8px 22px -12px rgba(0,0,0,.5);z-index:2}
.mk .svc-tag{position:absolute;left:16px;top:16px;z-index:2;font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:600;color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:100px;padding:6px 12px}
.mk .howstrip{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--line) 26%,var(--bg))}
.mk .howstrip .wrap{padding-top:54px;padding-bottom:54px}
.mk .how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:30px}
.mk .how-item{display:flex;gap:16px;align-items:flex-start}
.mk .how-item .hico{flex:0 0 auto;width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:var(--surface);border:1px solid var(--line);color:var(--accent-deep);font-size:24px}
.mk .how-item h4{font-family:var(--serif);font-size:19px;font-weight:500;color:var(--ink);margin:2px 0 6px}
.mk .how-item p{font-size:14px;line-height:1.65;color:var(--ink-soft);margin:0}
@media(max-width:820px){.mk .how-grid{grid-template-columns:1fr}}
.mk .cta-band{background:var(--feature);color:var(--on-feature);text-align:center;transition:background .4s var(--ease)}
.mk .cta-band .wrap{padding-top:84px;padding-bottom:84px}
.mk .cta-band .eyebrow{color:var(--feature-accent)}
.mk .cta-band h2{font-family:var(--serif);font-weight:500;font-size:clamp(30px,4vw,46px);line-height:1.08;color:var(--on-feature);max-width:660px;margin:14px auto 18px}
.mk .cta-band p{color:var(--on-feature-soft);max-width:560px;margin:0 auto 30px;font-size:16px;line-height:1.7}
.mk .cta-band .cta-note{margin-top:26px;font-size:13px;letter-spacing:.04em;color:var(--on-feature-soft)}
`;

const BODY = (locale: Locale) => `
<!-- HERO -->
<section class="hero compact" style="padding:0">
  <img src="https://images.unsplash.com/photo-1469022563428-aa04fef9f5a2?auto=format&fit=crop&w=1900&q=70" alt="Sunlit Lisbon street with pastel façades and a tram climbing the hill">
  <div class="wrap">
    <span class="eyebrow">For Our Guests</span>
    <h1>Make the Most of Your Stay</h1>
    <p>A curated collection of services and experiences to make your time in Lisbon effortless — from a private transfer the moment you land to a chef preparing dinner in your apartment. Booked through your guest contact, every detail is handled by people who know the city.</p>
  </div>
</section>

<!-- SERVICES GRID -->
<section>
  <div class="wrap">
    <div class="sec-head center reveal">
      <span class="eyebrow">Guest Services &amp; Experiences</span>
      <h2 class="section-title">Everything you need, beautifully arranged</h2>
      <p class="lede">Hand-picked partners and trusted local guides, available across all of our stays. Add any service to your booking and we'll take care of the rest.</p>
    </div>

    <div class="pf-grid reveal">

      <a class="pcard" href="#">
        <div class="ph">
          <span class="svc-tag">Arrival</span>
          <img src="https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=900&q=70" alt="Private car waiting outside the airport at dusk">
          <span class="svc-ico"><i class="iconoir-car" aria-hidden="true"></i></span>
        </div>
        <div class="pbody">
          <h3>Airport Private Transfer</h3>
          <p style="font-size:14px;color:var(--ink-soft);margin-top:10px">Door-to-door transfers between the airport and your apartment, with a professional driver who tracks your flight and meets you in the arrival hall. Available 24/7, with luggage allowance included.</p>
          <div class="view">View details →</div>
        </div>
      </a>

      <a class="pcard" href="#">
        <div class="ph">
          <span class="svc-tag">Day Trip</span>
          <img src="https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=70" alt="Fairytale palace and lush gardens in the hills of Sintra">
          <span class="svc-ico"><i class="iconoir-binocular" aria-hidden="true"></i></span>
        </div>
        <div class="pbody">
          <h3>Sintra Tour</h3>
          <p style="font-size:14px;color:var(--ink-soft);margin-top:10px">A private, full-day guided excursion through the charming village of Sintra, the National Palace and the hilltop Pena Palace — finishing at Cabo da Roca, Europe's westernmost point, and the seaside town of Cascais.</p>
          <div class="view">View details →</div>
        </div>
      </a>

      <a class="pcard" href="#">
        <div class="ph">
          <span class="svc-tag">Day Trip</span>
          <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=70" alt="Grand sanctuary square under an open sky">
          <span class="svc-ico"><i class="iconoir-compass" aria-hidden="true"></i></span>
        </div>
        <div class="pbody">
          <h3>Fátima Tour</h3>
          <p style="font-size:14px;color:var(--ink-soft);margin-top:10px">A guided day trip from Lisbon to Fátima, one of Portugal's most revered centres of Catholic faith, taking in the Monastery of Batalha, the dramatic coastline at Nazaré and the medieval walled village of Óbidos.</p>
          <div class="view">View details →</div>
        </div>
      </a>

      <a class="pcard" href="#">
        <div class="ph">
          <span class="svc-tag">On the Water</span>
          <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=70" alt="Sailboat gliding across the Tagus river at golden hour">
          <span class="svc-ico"><i class="iconoir-sea-waves" aria-hidden="true"></i></span>
        </div>
        <div class="pbody">
          <h3>Boat Tour</h3>
          <p style="font-size:14px;color:var(--ink-soft);margin-top:10px">A private tour along the Tagus aboard a luxurious catamaran or sailboat, in 2, 4 or 8-hour options. Glide past Lisbon's landmarks and add a barbecue or open bar to make the day your own.</p>
          <div class="view">View details →</div>
        </div>
      </a>

      <a class="pcard" href="#">
        <div class="ph">
          <span class="svc-tag">Experience</span>
          <img src="https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=900&q=70" alt="Surfer riding a clean wave along the Portuguese coast">
          <span class="svc-ico"><i class="iconoir-swimming" aria-hidden="true"></i></span>
        </div>
        <div class="pbody">
          <h3>Surf Experience</h3>
          <p style="font-size:14px;color:var(--ink-soft);margin-top:10px">A 2.5-hour session at Carcavelos beach with an English-speaking instructor, ideal for surfers of all levels. Board, wetsuit and insurance are all included.</p>
          <div class="view">View details →</div>
        </div>
      </a>

      <a class="pcard" href="#">
        <div class="ph">
          <span class="svc-tag">At Home</span>
          <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=70" alt="Chef plating a refined dish in a home kitchen">
          <span class="svc-ico"><i class="iconoir-pizza-slice" aria-hidden="true"></i></span>
        </div>
        <div class="pbody">
          <h3>Chef at Home</h3>
          <p style="font-size:14px;color:var(--ink-soft);margin-top:10px">A Portuguese chef cooks an authentic three-course meal — starter, main course and dessert, paired with wine — in your apartment. Delivered in partnership with 55+, a local organisation celebrating experienced cooks over 55.</p>
          <div class="view">View details →</div>
        </div>
      </a>

      <a class="pcard" href="#">
        <div class="ph">
          <span class="svc-tag">Convenience</span>
          <img src="https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&w=900&q=70" alt="Neatly stacked suitcases beside a luggage trolley">
          <span class="svc-ico"><i class="iconoir-suitcase" aria-hidden="true"></i></span>
        </div>
        <div class="pbody">
          <h3>Luggage Storage</h3>
          <p style="font-size:14px;color:var(--ink-soft);margin-top:10px">Secure storage for your bags after check-out, through our trusted partners BOUNCE for city-wide drop-off and LUGGIT for door-to-door pickup and delivery, including to the airport, with a 10% guest discount.</p>
          <div class="view">View details →</div>
        </div>
      </a>

      <a class="pcard" href="#">
        <div class="ph">
          <span class="svc-tag">Convenience</span>
          <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=70" alt="Fresh groceries and produce arranged on a kitchen counter">
          <span class="svc-ico"><i class="iconoir-shopping-bag" aria-hidden="true"></i></span>
        </div>
        <div class="pbody">
          <h3>Grocery Delivery</h3>
          <p style="font-size:14px;color:var(--ink-soft);margin-top:10px">Arrive to a fully stocked fridge. Order your groceries online for delivery straight to the apartment, ready and waiting at your chosen time.</p>
          <div class="view">View details →</div>
        </div>
      </a>

      <a class="pcard" href="#">
        <div class="ph">
          <span class="svc-tag">Family</span>
          <img src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=70" alt="Child playing happily with toys at home">
          <span class="svc-ico"><i class="iconoir-emoji" aria-hidden="true"></i></span>
        </div>
        <div class="pbody">
          <h3>Baby-Sitting</h3>
          <p style="font-size:14px;color:var(--ink-soft);margin-top:10px">Accredited carers for children of all ages, so you can enjoy an evening out with complete peace of mind. Arranged through a trusted local social institution.</p>
          <div class="view">View details →</div>
        </div>
      </a>

    </div>
  </div>
</section>

<!-- HOW IT WORKS / VALUE STRIP -->
<div class="howstrip">
  <div class="wrap">
    <div class="sec-head center reveal" style="margin-bottom:38px">
      <span class="eyebrow">How It Works</span>
      <h2 class="section-title">Arranged for you, end to end</h2>
    </div>
    <div class="how-grid reveal">
      <div class="how-item">
        <span class="hico"><i class="iconoir-chat-bubble" aria-hidden="true"></i></span>
        <div>
          <h4>Booked through your guest contact</h4>
          <p>Tell your dedicated guest contact what you'd like and we'll handle the scheduling, partners and payments for you.</p>
        </div>
      </div>
      <div class="how-item">
        <span class="hico"><i class="iconoir-home-simple" aria-hidden="true"></i></span>
        <div>
          <h4>Available across all stays</h4>
          <p>Every service is offered at each of our Lisbon apartments — add it before you arrive or any time during your stay.</p>
        </div>
      </div>
      <div class="how-item">
        <span class="hico"><i class="iconoir-headset" aria-hidden="true"></i></span>
        <div>
          <h4>Looked after 24/7</h4>
          <p>Our local guest team is on hand around the clock, so plans can change and questions get answered, day or night.</p>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- CTA BAND (feature) -->
<section class="cta-band">
  <div class="wrap">
    <span class="eyebrow">Planning your stay?</span>
    <h2>Find your apartment, then we'll handle the rest</h2>
    <p>Choose from fourteen handpicked addresses across Lisbon's most storied neighbourhoods — and layer on any of the services above to make the stay your own.</p>
    <a class="btn btn-light" href="/${locale}/buildings">Browse Our Apartments →</a>
    <div class="cta-note">All services are arranged through our 24/7 guest team · info@centralhill.pt · WhatsApp +351 910 075 725</div>
  </div>
</section>
`;

export async function ServicesListing({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  return (
    <div className="mk" data-page="services">
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
      <div dangerouslySetInnerHTML={{ __html: BODY(locale) }} />
    </div>
  );
}
