import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";

/**
 * About page — the approved `mock/about.html` embedded 1:1 inside the live app shell.
 * The mock's body markup is rendered verbatim; its page styles are scoped under `.mk`
 * (see `src/app/mock.css` for the shared design system) so nothing leaks to Home/admin.
 * No database is read here — content is static, matching the mock exactly. The real
 * header/footer + i18n come from the app layout. (The contact form is the mock's static
 * markup for now; wiring it to the leads action is a follow-up.)
 */

const PAGE_STYLE = `
.mk .ico{font-size:30px;line-height:1;color:var(--accent-deep);display:inline-block;margin-bottom:18px}
.mk .story-copy{max-width:760px}
.mk .story-copy p{font-size:17px;color:var(--ink-soft);margin-bottom:18px}
.mk .val-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}
.mk .val{background:var(--surface);padding:38px 30px}
.mk .val .vnum{font-family:var(--serif);font-size:42px;line-height:1;color:var(--accent);opacity:.85;margin-bottom:18px}
.mk .val h3{font-size:21px;margin-bottom:10px}
.mk .val p{font-size:14.5px;color:var(--ink-soft)}
.mk .dept-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}
.mk .dept{background:var(--surface);padding:38px 32px}
.mk .dept h3{font-size:20px;margin-bottom:10px}
.mk .dept p{font-size:14.5px;color:var(--ink-soft)}
.mk .cert-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
.mk .cert{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:38px 32px;text-align:center}
.mk .cert .ico{margin-bottom:16px;font-size:38px}
.mk .cert h3{font-size:22px;margin-bottom:6px}
.mk .cert .cert-body{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent-deep);font-weight:600;margin-bottom:14px}
.mk .cert p{font-size:14px;color:var(--ink-soft)}
.mk .comm{display:grid;grid-template-columns:1.05fr .95fr;gap:64px;align-items:center}
.mk .comm img{aspect-ratio:4/5;object-fit:cover;width:100%;border-radius:4px}
.mk .comm h2{font-size:clamp(28px,3.4vw,44px);margin:14px 0 18px}
.mk .comm p{color:var(--ink-soft);margin-bottom:16px}
.mk .touch-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}
.mk .touch{background:var(--surface);padding:40px 34px;display:flex;flex-direction:column}
.mk .touch h3{font-size:23px;margin-bottom:10px}
.mk .touch p{font-size:15px;color:var(--ink-soft);flex:1}
.mk .touch .view{margin-top:18px;font-size:14px;color:var(--accent-deep);font-weight:600}
.mk .contact-split{display:grid;grid-template-columns:.9fr 1.1fr;gap:1px;background:var(--line);border:1px solid var(--line);margin-top:48px}
.mk .office{background:var(--feature);color:var(--on-feature);padding:48px 44px}
.mk .office h3{color:#fff;font-size:26px;margin-bottom:22px}
.mk .office .ofield{margin-bottom:20px}
.mk .office .olbl{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--feature-accent);font-weight:600;margin-bottom:6px}
.mk .office .oval{font-size:15px;color:var(--on-feature-soft);line-height:1.7}
.mk .office .oval a{color:var(--on-feature)}
.mk .cform{background:var(--surface);padding:48px 44px}
.mk .cform h3{font-size:26px;margin-bottom:8px}
.mk .cform .cform-sub{font-size:14px;color:var(--ink-soft);margin-bottom:24px}
.mk .cfield{margin-bottom:18px}
.mk .cfield label{display:block;font-size:12px;letter-spacing:.04em;font-weight:600;color:var(--ink);margin-bottom:7px}
.mk .cfield input,.mk .cfield textarea{width:100%;font-family:var(--sans);font-size:15px;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:4px;padding:13px 14px;transition:.2s var(--ease)}
.mk .cfield textarea{resize:vertical;min-height:130px}
.mk .cfield input:focus,.mk .cfield textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}
.mk .cform-two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.mk .cform .btn{justify-content:center}
@media(max-width:980px){
  .mk .val-grid{grid-template-columns:1fr 1fr}
  .mk .dept-grid,.mk .cert-grid,.mk .touch-grid{grid-template-columns:1fr 1fr}
  .mk .comm{grid-template-columns:1fr;gap:32px}
  .mk .contact-split{grid-template-columns:1fr}
}
@media(max-width:680px){
  .mk .val-grid,.mk .dept-grid,.mk .cert-grid,.mk .touch-grid,.mk .cform-two{grid-template-columns:1fr}
  .mk .office,.mk .cform{padding:36px 28px}
}
`;

const BODY = (locale: Locale) => `
<section class="hero compact" aria-label="Who We Are">
  <img src="https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1900&q=70" alt="Rooftops and historic streets of Lisbon at golden hour">
  <div class="wrap">
    <span class="eyebrow">Who We Are</span>
    <h1>Portugal's Hospitality Management Company.</h1>
    <p>Since 2012, Central Hill Apartments has been turning properties into high-performing hospitality assets — and turning guests into people who feel genuinely at home. We manage short-term, mid-term, and corporate rentals across Portugal's most sought-after locations, combining deep local knowledge with AI-driven technology and an uncompromising commitment to quality.</p>
  </div>
</section>

<section id="story">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">How We Started</span>
      <h2 class="section-title">From a Clear Vision to a Growing Platform</h2>
    </div>
    <div class="story-copy reveal">
      <p>Central Hill Apartments was founded in 2012, identifying Lisbon as a city of exceptional hospitality opportunity — a destination where guests wanted more than a hotel room; they wanted to feel genuinely part of the city. We started with that conviction and a clear operational model: that professional, data-driven management of well-located residential assets could consistently outperform the market while delivering an experience worth returning to.</p>
      <p>Over more than a decade, that process has produced one of Portugal's most established hospitality management platforms. We have built the operational infrastructure, the technology stack, and the institutional relationships needed to manage assets at scale — from individual apartments to full buildings, corporate housing programmes, and strategic real estate partnerships.</p>
      <p>Today, Central Hill operates across Portugal's most in-demand urban markets, delivering consistent above-market returns for property owners, dependable occupancy for corporate clients, and institutional-grade performance for investment partners. The company we are now is the direct result of the discipline, systems, and expertise built over twelve years of active asset management.</p>
    </div>
  </div>
</section>

<section class="stats" style="padding:0" aria-label="Central Hill in numbers">
  <div class="wrap" style="padding-top:58px;padding-bottom:58px">
    <div class="stats-grid reveal" style="grid-template-columns:repeat(5,1fr)">
      <div class="stat"><div class="num">2012</div><div class="lbl">Year Founded</div></div>
      <div class="stat"><div class="num">40+</div><div class="lbl">Apartments Managed</div></div>
      <div class="stat"><div class="num">14</div><div class="lbl">Buildings in Prime Locations</div></div>
      <div class="stat"><div class="num">60,000+</div><div class="lbl">Guests Hosted Worldwide</div></div>
      <div class="stat"><div class="num">6,000+</div><div class="lbl">Reservations per Year</div></div>
    </div>
  </div>
</section>

<section id="serve" class="alt">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Our Platform</span>
      <h2 class="section-title">One Platform. Three Audiences.</h2>
      <p class="lede" style="margin-top:18px">Central Hill Apartments operates across three interconnected service lines, each supporting the others. Whether you are a guest looking for a home away from home, a property owner seeking to maximise your asset's potential, or an institutional partner exploring a management agreement — this is your platform.</p>
    </div>
    <div class="grid-3 reveal">
      <div class="bcard">
        <i class="iconoir-suitcase ico" aria-hidden="true"></i>
        <h3>For Guests</h3>
        <p>Professionally managed, fully equipped apartments in Portugal's most desirable locations. Every property is quality-checked, consistently maintained, and backed by 24/7 support — so every stay is exactly what it should be.</p>
      </div>
      <div class="bcard">
        <i class="iconoir-home ico" aria-hidden="true"></i>
        <h3>For Property Owners</h3>
        <p>Full-service property management that removes every burden and maximises every opportunity. AI-driven dynamic pricing, professional photography, 24/7 guest management, maintenance, and a real-time performance dashboard — all included.</p>
      </div>
      <div class="bcard">
        <i class="iconoir-bank ico" aria-hidden="true"></i>
        <h3>For Institutional Partners</h3>
        <p>Flexible management structures designed for investment funds, developers, and large-scale operators. Fixed rent, management commission, or hybrid models — with full operational management, transparent reporting, and institutional-grade governance.</p>
      </div>
    </div>
  </div>
</section>

<section id="values">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">What We Stand For</span>
      <h2 class="section-title">What Guides Us</h2>
      <p class="lede" style="margin-top:18px">Our values are not statements on a wall. They are the criteria by which we select properties, build partnerships, and measure success. They have remained constant since 2012.</p>
    </div>
    <div class="val-grid reveal">
      <div class="val">
        <div class="vnum">01</div>
        <h3>Quality Without Compromise</h3>
        <p>We apply the same standard of care to every property we manage — in its presentation, its maintenance, and its guest experience.</p>
      </div>
      <div class="val">
        <div class="vnum">02</div>
        <h3>Transparency in Everything</h3>
        <p>Owners have real-time access to performance data. Partners receive full, accurate reporting. Trust is built through information, not withheld by it.</p>
      </div>
      <div class="val">
        <div class="vnum">03</div>
        <h3>Local Knowledge, Applied</h3>
        <p>Over a decade learning Portugal's hospitality markets — their rhythms, their regulations, and their opportunities. That knowledge shapes every decision we make.</p>
      </div>
      <div class="val">
        <div class="vnum">04</div>
        <h3>People at the Centre</h3>
        <p>Great hospitality is ultimately about people. We invest in our team, care for our guests, respect our owners' assets, and take our role in the community seriously.</p>
      </div>
    </div>
  </div>
</section>

<section id="organised" class="alt">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Our Structure</span>
      <h2 class="section-title">How We Are Organised</h2>
      <p class="lede" style="margin-top:18px">Behind every well-managed property is a team of specialists working in close coordination. Central Hill Apartments is structured around six areas of expertise, each essential to the performance of every asset we manage.</p>
    </div>
    <div class="dept-grid reveal">
      <div class="dept">
        <i class="iconoir-settings ico" aria-hidden="true"></i>
        <h3>Operations &amp; Property Management</h3>
        <p>Manages day-to-day property performance, housekeeping, maintenance, and quality inspections across all buildings.</p>
      </div>
      <div class="dept">
        <i class="iconoir-bell ico" aria-hidden="true"></i>
        <h3>Guest Experience &amp; Support</h3>
        <p>Available 24/7, ensuring every guest interaction — from pre-arrival to post-checkout — is handled with care and professionalism.</p>
      </div>
      <div class="dept">
        <i class="iconoir-peace-hand ico" aria-hidden="true"></i>
        <h3>Owner Relations &amp; Partnerships</h3>
        <p>The dedicated point of contact for property owners, institutional partners, and corporate clients throughout the management relationship.</p>
      </div>
      <div class="dept">
        <i class="iconoir-graph-up ico" aria-hidden="true"></i>
        <h3>Revenue &amp; Pricing Technology</h3>
        <p>Combines AI-powered dynamic pricing with hands-on revenue strategy to optimise nightly rates and occupancy across all platforms.</p>
      </div>
      <div class="dept">
        <i class="iconoir-wrench ico" aria-hidden="true"></i>
        <h3>Maintenance &amp; Asset Protection</h3>
        <p>Proactive inspections and rapid-response maintenance protect the long-term value of every asset under our management.</p>
      </div>
      <div class="dept">
        <i class="iconoir-clipboard-check ico" aria-hidden="true"></i>
        <h3>Finance &amp; Compliance</h3>
        <p>Manages owner payouts, financial reporting, regulatory filings, and certification maintenance with full transparency.</p>
      </div>
    </div>
  </div>
</section>

<section id="certifications">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">What We Stand For</span>
      <h2 class="section-title">Independently Verified</h2>
      <p class="lede" style="margin-top:18px">Our certifications and memberships represent a commitment to operating to the highest standards — verified by recognised independent bodies in Portugal and internationally.</p>
    </div>
    <div class="cert-grid reveal">
      <div class="cert">
        <i class="iconoir-medal ico" aria-hidden="true"></i>
        <h3>ALEP Member</h3>
        <div class="cert-body">Associação do Alojamento Local em Portugal</div>
        <p>National association representing local accommodation operators. Membership signals compliance with industry best practices.</p>
      </div>
      <div class="cert">
        <i class="iconoir-shield-check ico" aria-hidden="true"></i>
        <h3>Clean &amp; Safe Certified</h3>
        <div class="cert-body">Turismo de Portugal</div>
        <p>Quality and safety certification awarded by Portugal's national tourism authority, recognising our hygiene and guest safety standards.</p>
      </div>
      <div class="cert">
        <i class="iconoir-check-circle ico" aria-hidden="true"></i>
        <h3>I-PRAC Certified</h3>
        <div class="cert-body">International Property Rental Approval Certification</div>
        <p>International certification body verifying vacation rental operators worldwide, assuring guests and partners of our professional standards.</p>
      </div>
    </div>
  </div>
</section>

<section id="community" class="alt">
  <div class="wrap">
    <div class="comm reveal">
      <img src="https://images.unsplash.com/photo-1591825729269-caeb344f6df2?auto=format&fit=crop&w=900&q=70" alt="People sharing a meal together at a community table in Lisbon">
      <div>
        <span class="eyebrow">Our Responsibility</span>
        <h2>Giving Back to the Communities We Call Home</h2>
        <p>Central Hill Apartments is a business rooted in Lisbon, and we take our responsibility to the city and its communities seriously. We are proud partners of 55+ — a Lisbon-based social organisation that empowers people over 55 to remain active and fulfilled — through which we offer guests authentic experiences including Chef at Home services delivered by 55+ members. We also actively support Movimento Famílias Solidárias, a volunteer-led initiative that provides monthly essential goods baskets to families in need across Lisbon.</p>
        <p>We additionally work with Santa Casa da Misericórdia de Lisboa, donating items and furniture to support their social care programmes, and maintain ongoing engagement with a number of other local Lisbon organisations through in-kind support, volunteering, and donations.</p>
      </div>
    </div>
  </div>
</section>

<section id="contact">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Get in Touch</span>
      <h2 class="section-title">Let's Start a Conversation</h2>
    </div>
    <div class="touch-grid reveal">
      <a class="touch" href="/${locale}/buildings">
        <i class="iconoir-suitcase ico" aria-hidden="true"></i>
        <h3>Planning a Stay?</h3>
        <p>Browse our apartments and book directly for the best price.</p>
        <span class="view">Browse Apartments →</span>
      </a>
      <a class="touch" href="/${locale}/owners">
        <i class="iconoir-home ico" aria-hidden="true"></i>
        <h3>Own a Property?</h3>
        <p>Get a free, no-obligation earnings estimate and find out what your property could achieve.</p>
        <span class="view">Get My Free Estimate →</span>
      </a>
      <a class="touch" href="/${locale}/real-estate">
        <i class="iconoir-bank ico" aria-hidden="true"></i>
        <h3>Institutional Partner?</h3>
        <p>Discuss investment structures, asset management, and partnership models with our team.</p>
        <span class="view">Discuss a Partnership →</span>
      </a>
    </div>

    <div class="contact-split reveal">
      <div class="office">
        <h3>Our Office</h3>
        <div class="ofield">
          <div class="olbl">Address</div>
          <div class="oval">Rua da Bempostinha 21A<br>1150-065 Lisboa, Portugal</div>
        </div>
        <div class="ofield">
          <div class="olbl">Bookings</div>
          <div class="oval"><a href="tel:+351910075725">+351 910 075 725</a></div>
        </div>
        <div class="ofield">
          <div class="olbl">Check-in</div>
          <div class="oval"><a href="tel:+351912310632">+351 912 310 632</a></div>
        </div>
        <div class="ofield">
          <div class="olbl">Email</div>
          <div class="oval"><a href="mailto:info@centralhill.pt">info@centralhill.pt</a></div>
        </div>
        <div class="ofield">
          <div class="olbl">Website</div>
          <div class="oval"><a href="https://www.centralhill.pt">www.centralhill.pt</a></div>
        </div>
        <div class="ofield">
          <div class="olbl">Office Hours</div>
          <div class="oval">Monday – Friday · 09:30 – 18:00</div>
        </div>
      </div>

      <form class="cform" onsubmit="return false">
        <h3>Send Us a Message</h3>
        <div class="cform-sub">Tell us how we can help and we'll be in touch shortly.</div>
        <div class="cform-two">
          <div class="cfield">
            <label for="cf-name">Name</label>
            <input id="cf-name" type="text" name="name" placeholder="Your full name" autocomplete="name">
          </div>
          <div class="cfield">
            <label for="cf-email">Email</label>
            <input id="cf-email" type="email" name="email" placeholder="you@email.com" autocomplete="email">
          </div>
        </div>
        <div class="cfield">
          <label for="cf-subject">Subject</label>
          <input id="cf-subject" type="text" name="subject" placeholder="What is this about?">
        </div>
        <div class="cfield">
          <label for="cf-message">Message</label>
          <textarea id="cf-message" name="message" placeholder="Write your message…"></textarea>
        </div>
        <button type="submit" class="btn btn-accent">Send Message <i class="iconoir-send-diagonal" aria-hidden="true"></i></button>
      </form>
    </div>
  </div>
</section>
`;

export async function AboutPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  return (
    <div className="mk" data-page="about">
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
      <div dangerouslySetInnerHTML={{ __html: BODY(locale) }} />
    </div>
  );
}
