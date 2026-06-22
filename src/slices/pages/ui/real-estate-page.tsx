import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";

/**
 * Real Estate page — the approved `mock/real-estate.html` embedded 1:1 inside the live app
 * shell. The mock's body markup is rendered verbatim; its page styles are scoped under `.mk`
 * (see `src/app/mock.css` for the shared design system) so nothing leaks to Home/admin.
 * No database is read here — content is static, matching the mock exactly. The real
 * header/footer + i18n come from the app layout. The Iconoir CDN stylesheet (used by the
 * mock's `<i class="iconoir-… ico">` glyphs) is imported inside this page's scoped `<style>`.
 *
 * Follow-up: the "Submit Partnership Enquiry" form is the mock's static markup (onsubmit
 * disabled, no action wired). Wiring it to the leads slice's deal-enquiry action is a
 * separate task. The mock's reveal-on-scroll JS isn't loaded, so `.reveal` is neutralised in
 * mock.css and all content renders immediately.
 */

const PAGE_STYLE = `
@import url("https://cdn.jsdelivr.net/npm/iconoir/css/iconoir.css");

/* 4-up grid (partner types) reusing grid-3 seam look */
.mk .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}
.mk .grid-4 .bcard{padding:38px 30px}
.mk .ico{font-size:30px;line-height:1;color:var(--accent-deep);display:inline-block;margin-bottom:18px}

/* partnership-model cards */
.mk .models{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;align-items:start}
.mk .model{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:38px 32px;display:flex;flex-direction:column;position:relative;transition:.3s var(--ease)}
.mk .model:hover{transform:translateY(-4px);box-shadow:0 24px 50px -30px rgba(0,0,0,.42)}
.mk .model.featured{border-color:var(--accent);box-shadow:0 24px 54px -28px color-mix(in srgb,var(--accent) 55%,transparent)}
.mk .model .feat-tag{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--accent);color:#fff;font-size:11px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;padding:6px 16px;border-radius:30px}
.mk .model h3{font-size:26px;margin-bottom:6px}
.mk .model .mtag{font-size:13.5px;letter-spacing:.04em;color:var(--accent-deep);font-weight:600;text-transform:uppercase;margin-bottom:22px}
.mk .model ul{list-style:none;margin:0;flex:1}
.mk .model li{font-size:14.5px;color:var(--ink-soft);padding:11px 0 11px 28px;position:relative;border-top:1px solid var(--line)}
.mk .model li:first-child{border-top:0}
.mk .model li::before{content:"";position:absolute;left:0;top:16px;width:14px;height:8px;border-left:2px solid var(--accent);border-bottom:2px solid var(--accent);transform:rotate(-45deg)}
.mk .model-note{margin-top:34px;font-size:13.5px;color:var(--ink-soft);text-align:center;max-width:80ch;margin-left:auto;margin-right:auto}

/* why portugal blocks */
.mk .why-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line)}
.mk .why-block{background:var(--surface);padding:40px 36px}
.mk .why-block h3{font-size:22px;margin-bottom:12px}
.mk .why-block p{font-size:15px;color:var(--ink-soft);margin-bottom:14px}
.mk .why-block p:last-child{margin-bottom:0}
.mk .thesis{list-style:none;margin:0}
.mk .thesis li{font-size:14.5px;color:var(--ink-soft);padding:10px 0 10px 28px;position:relative;border-top:1px solid var(--line)}
.mk .thesis li:first-child{border-top:0}
.mk .thesis li::before{content:"";position:absolute;left:0;top:15px;width:14px;height:8px;border-left:2px solid var(--accent);border-bottom:2px solid var(--accent);transform:rotate(-45deg)}

/* track-record stat tiles */
.mk .tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}
.mk .tile{background:var(--surface);padding:40px 34px;text-align:center}
.mk .tile .tval{font-family:var(--serif);font-size:clamp(42px,5vw,58px);line-height:1;color:var(--accent);font-weight:500}
.mk .tile .tlbl{font-size:13px;letter-spacing:.04em;font-weight:600;color:var(--ink);margin:14px 0 6px;text-transform:uppercase}
.mk .tile .tcap{font-size:13.5px;color:var(--ink-soft)}

/* numbered process steps */
.mk .steps{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}
.mk .step{background:var(--surface);padding:36px 28px}
.mk .step .snum{font-family:var(--serif);font-size:46px;line-height:1;color:var(--accent);opacity:.85;margin-bottom:16px}
.mk .step h3{font-size:19px;margin-bottom:9px}
.mk .step p{font-size:14px;color:var(--ink-soft)}

/* FAQ accordions */
.mk .faq{max-width:820px;margin:0 auto;border-top:1px solid var(--line)}
.mk .faq details{border-bottom:1px solid var(--line)}
.mk .faq summary{list-style:none;cursor:pointer;padding:24px 44px 24px 4px;position:relative;font-family:var(--serif);font-size:20px;color:var(--ink);transition:color .2s}
.mk .faq summary::-webkit-details-marker{display:none}
.mk .faq summary:hover{color:var(--accent-deep)}
.mk .faq summary::after{content:"+";position:absolute;right:6px;top:22px;font-family:var(--sans);font-size:24px;color:var(--accent);transition:transform .25s var(--ease)}
.mk .faq details[open] summary::after{transform:rotate(45deg)}
.mk .faq .faq-a{padding:0 44px 26px 4px;font-size:15.5px;color:var(--ink-soft);max-width:70ch}

/* deal-enquiry form */
.mk .enquiry{display:grid;grid-template-columns:.85fr 1.15fr;gap:56px;align-items:start}
.mk .enquiry-intro h2{font-size:clamp(30px,3.6vw,46px)}
.mk .enquiry-intro .lede{margin-top:18px}
.mk .contact-direct{margin-top:34px;border-top:1px solid var(--line);padding-top:26px;font-size:14.5px;color:var(--ink-soft);line-height:1.9}
.mk .contact-direct b{display:block;color:var(--ink);font-size:12px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px}
.mk .contact-direct a{color:var(--accent-deep);font-weight:600}
.mk .form-card{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:38px 36px 34px;box-shadow:0 30px 60px -34px rgba(0,0,0,.45)}
.mk .fgroup{margin-bottom:30px}
.mk .fgroup-title{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent-deep);font-weight:600;margin-bottom:18px;padding-bottom:10px;border-bottom:1px solid var(--line)}
.mk .ffield{margin-bottom:16px}
.mk .ffield label{display:block;font-size:12.5px;letter-spacing:.03em;font-weight:600;color:var(--ink);margin-bottom:7px}
.mk .ffield input,.mk .ffield select,.mk .ffield textarea{width:100%;font-family:var(--sans);font-size:15px;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:4px;padding:13px 14px;transition:.2s var(--ease)}
.mk .ffield textarea{resize:vertical;min-height:110px}
.mk .ffield input:focus,.mk .ffield select:focus,.mk .ffield textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}
.mk .ftwo{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mk .form-card .btn{width:100%;justify-content:center;margin-top:6px}
.mk .form-note{text-align:center;font-size:12.5px;color:var(--ink-soft);margin-top:14px}

@media(max-width:980px){
  .mk .grid-4{grid-template-columns:1fr 1fr}
  .mk .models{grid-template-columns:1fr}
  .mk .why-grid{grid-template-columns:1fr}
  .mk .tiles{grid-template-columns:1fr 1fr}
  .mk .steps{grid-template-columns:1fr 1fr}
  .mk .enquiry{grid-template-columns:1fr;gap:34px}
}
@media(max-width:680px){
  .mk .grid-4,.mk .tiles,.mk .steps,.mk .ftwo{grid-template-columns:1fr}
}
`;

const BODY = (_locale: Locale) => `
<!-- SECTION 1 — HERO -->
<section class="hero compact" id="top">
  <img src="https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1900&q=70" alt="Aerial view of Lisbon's historic skyline and tiled rooftops at dusk">
  <div class="wrap">
    <div class="eyebrow">Real Estate Partnerships</div>
    <h1>Your Asset. Our Expertise. Institutional Returns.</h1>
    <p>Central Hill Apartments is the hospitality management partner for investment funds, real estate developers, large-scale operators, and corporate clients seeking to unlock the full revenue potential of their assets in Portugal.</p>
    <div class="hero-cta">
      <a class="btn btn-accent" href="#deal-enquiry">Discuss a Partnership →</a>
      <a class="btn btn-light" href="#">Download Our Capability Statement →</a>
    </div>
  </div>
</section>

<!-- positioning statement band -->
<section class="alt" style="padding:48px 0">
  <div class="wrap">
    <p class="lede reveal" style="max-width:78ch;font-size:19px">We bring together AI-driven pricing technology, deep operational expertise, and a proven track record in Portugal's most competitive rental markets to deliver measurable, institutional-grade performance — at any scale.</p>
  </div>
</section>

<!-- SECTION 2 — WHO WE WORK WITH -->
<section id="partners">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="eyebrow">Our Partners</div>
      <h2 class="section-title">Built for Institutional Partners</h2>
      <p class="lede" style="margin-top:16px">Central Hill Apartments works with organisations that think at scale. Whether you represent a real estate investment fund, a development company, a large property operator, or a corporate seeking managed accommodation solutions, we have the operational depth, deal flexibility, and market knowledge to meet your requirements.</p>
    </div>
    <div class="grid-4 reveal">
      <div class="bcard">
        <i class="iconoir-bank ico" aria-hidden="true"></i>
        <h3>Investment Funds &amp; Asset Managers</h3>
        <p>We partner with real estate funds and institutional asset managers seeking reliable, data-driven hospitality management for residential and mixed-use assets. Our reporting infrastructure, performance dashboards, and flexible deal structures are designed to meet institutional governance requirements.</p>
      </div>
      <div class="bcard">
        <i class="iconoir-ruler-combine ico" aria-hidden="true"></i>
        <h3>Real Estate Developers</h3>
        <p>From pre-opening strategy to full operational management, we work with developers bringing new residential, apart-hotel, or hospitality assets to market. We advise on unit mix, yield optimisation, and guest experience design from the planning stage through to stabilised operation.</p>
      </div>
      <div class="bcard">
        <i class="iconoir-city ico" aria-hidden="true"></i>
        <h3>Large-Scale Property Operators</h3>
        <p>We support operators managing multiple properties or buildings who want to consolidate under a single, high-performance management partner. Our technology stack and operational model scale efficiently across any size of portfolio, with no loss of quality or control.</p>
      </div>
      <div class="bcard">
        <i class="iconoir-airplane ico" aria-hidden="true"></i>
        <h3>Corporate &amp; Relocation Clients</h3>
        <p>Companies relocating employees, international organisations seeking managed accommodation in Portugal, and corporate travel managers benefit from our professionally managed portfolio. Consistent standards, direct billing, and dedicated account management ensure a seamless experience for both the organisation and its people.</p>
      </div>
    </div>
  </div>
</section>

<!-- SECTION 3 — WHAT WE OFFER -->
<section class="alt" id="capabilities">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="eyebrow">Our Capabilities</div>
      <h2 class="section-title">Institutional-Grade Management, End to End</h2>
      <p class="lede" style="margin-top:16px">We operate at the intersection of hospitality excellence and real estate performance. Our capabilities cover every dimension of asset management — from technology and distribution to operations and strategic partnership.</p>
    </div>
    <div class="grid-3 reveal">
      <div class="bcard">
        <i class="iconoir-stats-up-square ico" aria-hidden="true"></i>
        <h3>Digital Excellence</h3>
        <p>Multi-platform distribution across Airbnb, Booking.com, and direct channels. AI-powered dynamic pricing updated daily. Automated financial reporting, occupancy analytics, and a real-time performance dashboard accessible by asset managers and fund controllers.</p>
      </div>
      <div class="bcard">
        <i class="iconoir-settings ico" aria-hidden="true"></i>
        <h3>Operational Mastery</h3>
        <p>Professional housekeeping and linen services. 24/7 guest concierge. Premium amenities and quality assurance protocols. Regular property inspections. Rapid-response maintenance with preventive asset protection built into every management contract.</p>
      </div>
      <div class="bcard">
        <i class="iconoir-peace-hand ico" aria-hidden="true"></i>
        <h3>Strategic Partnership</h3>
        <p>Project design consultancy at the planning stage. Dedicated account management throughout the contract term. Performance benchmarking against market comparables. Proactive recommendations for yield improvement and capital expenditure prioritisation.</p>
      </div>
    </div>
  </div>
</section>

<!-- SECTION 4 — ASSET CLASSES -->
<section id="manage">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="eyebrow">What We Manage</div>
      <h2 class="section-title">A Management Partner for Every Asset Type</h2>
      <p class="lede" style="margin-top:16px">From individual apartments to full buildings, boutique hotels, and corporate housing programmes — our operational model adapts to the asset, not the other way around.</p>
    </div>
    <div class="grid-3 reveal">
      <div class="bcard">
        <i class="iconoir-home ico" aria-hidden="true"></i>
        <h3>Residential Apartments</h3>
        <p>Individual units and full residential buildings managed as short-term, mid-term, or long-term rental assets. Studios through to 8-bedroom apartments accommodating up to 27 guests, across Portugal's most in-demand urban locations.</p>
      </div>
      <div class="bcard">
        <i class="iconoir-building ico" aria-hidden="true"></i>
        <h3>Hotels &amp; Boutique Hotels</h3>
        <p>Full operational management of hotel assets, including front-of-house, guest experience design, revenue management, and distribution strategy. We bring the rigour of institutional hospitality management to properties of any scale, from boutique independents to larger branded opportunities.</p>
      </div>
      <div class="bcard">
        <i class="iconoir-city ico" aria-hidden="true"></i>
        <h3>Apart-Hotels &amp; Mixed-Use</h3>
        <p>Managed accommodation assets that combine hotel services with apartment-style living — ideal for developers and funds seeking flexible, high-yield hospitality products positioned between traditional residential and hotel categories.</p>
      </div>
      <div class="bcard">
        <i class="iconoir-community ico" aria-hidden="true"></i>
        <h3>Corporate Housing</h3>
        <p>Professionally managed, fully serviced apartments for corporate clients, relocating executives, and international organisations. Consistent standards, flexible lease terms from 30 days, direct invoicing, and dedicated account management for HR and travel managers.</p>
      </div>
      <div class="bcard">
        <i class="iconoir-design-pencil ico" aria-hidden="true"></i>
        <h3>Development Consultancy</h3>
        <p>Pre-opening management services for developers bringing new assets to market. Unit mix optimisation, interior design direction, FF&amp;E specification, licensing and regulatory compliance, platform registration, and full operational launch.</p>
      </div>
      <div class="bcard">
        <i class="iconoir-reports ico" aria-hidden="true"></i>
        <h3>Portfolio Management</h3>
        <p>Multi-building and multi-city portfolio management for investment funds and large operators. Consolidated reporting, standardised operating procedures, and economies of scale — managed through a single operational partner with full transparency.</p>
      </div>
    </div>
  </div>
</section>

<!-- SECTION 5 — PARTNERSHIP MODELS -->
<section class="alt" id="deal-structures">
  <div class="wrap">
    <div class="sec-head center reveal">
      <div class="eyebrow">Deal Structures</div>
      <h2 class="section-title">Deal Structures Built Around Your Risk Profile</h2>
      <p class="lede" style="margin:16px auto 0">We offer three core partnership models designed to align with different investment strategies, risk appetites, and return expectations. All models include full management, technology access, and institutional reporting.</p>
    </div>
    <div class="models reveal">
      <div class="model">
        <h3>Fixed Rent</h3>
        <div class="mtag">Guaranteed income, maximum certainty</div>
        <ul>
          <li>Guaranteed monthly rent regardless of occupancy</li>
          <li>Contract terms: 10–25 years</li>
          <li>Zero revenue variability — full income certainty</li>
          <li>Ideal for funds requiring predictable cash flows</li>
          <li>Asset maintenance obligations shared</li>
          <li>Annual rent review mechanism</li>
          <li>Full operational management by Central Hill</li>
        </ul>
      </div>
      <div class="model featured">
        <span class="feat-tag">Most Flexible</span>
        <h3>Management Commission</h3>
        <div class="mtag">Maximum upside, pure performance</div>
        <ul>
          <li>Revenue-based model: total receipts minus management fee</li>
          <li>Contract terms: 3–25 years</li>
          <li>Owner captures full revenue upside</li>
          <li>Transparent monthly reporting and payouts</li>
          <li>Ideal for operators seeking market-rate returns</li>
          <li>Performance KPIs agreed at contract stage</li>
          <li>Full operational management by Central Hill</li>
        </ul>
      </div>
      <div class="model">
        <h3>Hybrid Model</h3>
        <div class="mtag">Balanced risk and reward</div>
        <ul>
          <li>Guaranteed base rent plus revenue share above threshold</li>
          <li>Contract terms: 10–25 years</li>
          <li>Downside protection with upside participation</li>
          <li>Ideal for funds seeking blended return profiles</li>
          <li>Revenue share trigger agreed at contract stage</li>
          <li>Regular performance review meetings</li>
          <li>Full operational management by Central Hill</li>
        </ul>
      </div>
    </div>
    <p class="model-note">All partnership models are subject to individual asset assessment and negotiation. Contract structures, commission rates, and performance targets are agreed on a case-by-case basis.</p>
  </div>
</section>

<!-- SECTION 6 — WHY PORTUGAL -->
<section id="market">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="eyebrow">Portugal — Market Opportunity</div>
      <h2 class="section-title">Portugal: One of Europe's Strongest Hospitality Markets</h2>
      <p class="lede" style="margin-top:16px">Portugal consistently ranks among Europe's top-performing short-term rental markets, combining exceptional tourism growth, favourable regulation, strong international demand, and some of the continent's highest yields on residential real estate.</p>
    </div>
    <div class="why-grid reveal">
      <div class="why-block">
        <h3>Market Fundamentals</h3>
        <p>Portugal welcomed over <strong>30 million tourists</strong> in 2024, with Lisbon and Porto ranking among the most visited cities in Southern Europe. International arrivals continue to grow year-on-year, driven by leisure, remote working, and corporate relocation demand.</p>
        <p>Short-term rental yields in Lisbon's prime locations consistently outperform traditional residential letting by <strong>20–40%</strong>, with average occupancy rates above <strong>75%</strong> in managed, professionally operated properties.</p>
      </div>
      <div class="why-block">
        <h3>Regulatory Environment</h3>
        <p>Portugal's Alojamento Local framework provides a clear, stable regulatory structure for short-term rental operations. Central Hill's regulatory compliance team manages all licensing, tax registration, and reporting obligations on behalf of our partners.</p>
      </div>
      <div class="why-block">
        <h3>Why Lisbon Specifically</h3>
        <p>Lisbon is one of Europe's fastest-growing luxury travel destinations and a leading hub for corporate relocation, technology companies, and international organisations establishing European bases. The city's combination of climate, culture, infrastructure, and relative affordability continues to attract high-value, long-stay demand.</p>
      </div>
      <div class="why-block">
        <h3>Investment Thesis</h3>
        <ul class="thesis">
          <li>Strong and growing tourism demand year-round</li>
          <li>Corporate relocation and mid-term rental demand rising</li>
          <li>Prime residential yields 20–40% above long-term letting</li>
          <li>Stable regulatory framework with clear compliance path</li>
          <li>Undersupply of professionally managed, institutional-grade stock</li>
          <li>Lisbon positioned as a tier-1 European destination</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- SECTION 7 — TRACK RECORD -->
<section class="alt" id="track-record">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="eyebrow">Proven Performance</div>
      <h2 class="section-title">Performance You Can Measure</h2>
      <p class="lede" style="margin-top:16px">Our track record is built on consistent, data-driven results across a growing portfolio of managed assets. We report transparently, benchmark rigorously, and continuously optimise performance for every asset under management.</p>
    </div>
    <div class="tiles reveal">
      <div class="tile"><div class="tval">85%+</div><div class="tlbl">Average Occupancy</div><div class="tcap">Across all managed properties year-round</div></div>
      <div class="tile"><div class="tval">+25%</div><div class="tlbl">Revenue Premium</div><div class="tcap">Vs. traditional residential letting</div></div>
      <div class="tile"><div class="tval">24/7</div><div class="tlbl">Operational Coverage</div><div class="tcap">Guest support, reporting, and management</div></div>
      <div class="tile"><div class="tval">10+</div><div class="tlbl">Years of Experience</div><div class="tcap">Managing assets in Portugal's prime markets</div></div>
      <div class="tile"><div class="tval">14+</div><div class="tlbl">Buildings Managed</div><div class="tcap">Across Lisbon's most in-demand locations</div></div>
      <div class="tile"><div class="tval">100%</div><div class="tlbl">Transparent Reporting</div><div class="tcap">Real-time dashboard access for all partners</div></div>
    </div>
  </div>
</section>

<!-- SECTION 8 — HOW IT WORKS -->
<section id="process">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="eyebrow">The Process</div>
      <h2 class="section-title">A Structured Path from First Conversation to Full Performance</h2>
      <p class="lede" style="margin-top:16px">Our onboarding process is designed for institutional partners. Every step is documented, timeline-driven, and managed by a dedicated account team.</p>
    </div>
    <div class="steps reveal">
      <div class="step">
        <div class="snum">01</div>
        <h3>Asset Assessment &amp; Commercial Proposal</h3>
        <p>We conduct a detailed assessment of your asset — location, unit mix, current performance, and market positioning — and present a tailored commercial proposal including projected yield, recommended partnership model, and contract terms.</p>
      </div>
      <div class="step">
        <div class="snum">02</div>
        <h3>Due Diligence &amp; Contract Negotiation</h3>
        <p>Our legal and commercial team works with your advisors to structure and finalise the management agreement. All performance KPIs, reporting cadence, revenue share triggers, and exit terms are agreed and documented.</p>
      </div>
      <div class="step">
        <div class="snum">03</div>
        <h3>Operational Onboarding</h3>
        <p>We handle all elements of the operational setup: professional photography, platform registration and listing creation, pricing strategy implementation, staff assignment, and property preparation — typically completed within 10–15 business days.</p>
      </div>
      <div class="step">
        <div class="snum">04</div>
        <h3>Asset Goes Live</h3>
        <p>Your property launches across all distribution channels simultaneously. AI-powered pricing begins optimising daily rates from day one. Your account manager is active and reporting from the first booking.</p>
      </div>
      <div class="step">
        <div class="snum">05</div>
        <h3>Ongoing Management &amp; Reporting</h3>
        <p>Monthly performance reports delivered to your agreed format. Quarterly review meetings with your account manager. Continuous yield optimisation and strategic recommendations as market conditions evolve.</p>
      </div>
    </div>
  </div>
</section>

<!-- SECTION 9 — INSTITUTIONAL FAQ -->
<section class="alt" id="faq">
  <div class="wrap">
    <div class="sec-head center reveal">
      <div class="eyebrow">Questions &amp; Answers</div>
      <h2 class="section-title">Questions We Hear from Institutional Partners</h2>
    </div>
    <div class="faq reveal">
      <details>
        <summary>What minimum scale of asset do you work with?</summary>
        <div class="faq-a">We work with individual buildings through to multi-property portfolios. There is no minimum unit count for institutional partnerships, though our management fee structures are most efficient for assets with 5 or more units. We are also able to discuss portfolio-level agreements covering multiple buildings or locations.</div>
      </details>
      <details>
        <summary>What contract terms do you offer?</summary>
        <div class="faq-a">Contract terms vary by partnership model. Fixed rent agreements typically run for 10–25 years. Management commission agreements are available from 3 years, with renewal options. Hybrid structures typically mirror fixed rent terms. All contracts include clearly defined performance review milestones and exit provisions.</div>
      </details>
      <details>
        <summary>How is financial reporting structured for institutional partners?</summary>
        <div class="faq-a">We provide monthly financial reports in a format agreed at contract stage — including gross revenue, management fees, net owner proceeds, occupancy rates, average daily rate (ADR), and RevPAR. Partners also have real-time access to their asset's performance dashboard. Bespoke reporting formats for fund administrators and asset managers can be accommodated.</div>
      </details>
      <details>
        <summary>How do you handle regulatory compliance?</summary>
        <div class="faq-a">Central Hill manages all Alojamento Local licensing, AIMA registration, tourist tax calculation and payment, and local regulatory requirements on behalf of our partners. We monitor regulatory developments proactively and notify partners of any material changes affecting their asset.</div>
      </details>
      <details>
        <summary>Can you manage assets we are currently developing or acquiring?</summary>
        <div class="faq-a">Yes. We offer pre-opening consultancy services to developers and acquiring funds, including unit mix advice, interior design direction, FF&amp;E specification, licensing pre-registration, platform setup, and full operational launch. Engaging us at the planning stage typically results in faster time-to-revenue and higher initial occupancy rates.</div>
      </details>
      <details>
        <summary>What performance guarantees do you offer?</summary>
        <div class="faq-a">Under our fixed rent model, income is fully guaranteed regardless of occupancy. Under our management commission and hybrid models, we agree performance KPIs at contract stage and report transparently against them monthly. While market performance is inherently variable, our track record demonstrates consistent above-market outcomes across our managed portfolio.</div>
      </details>
      <details>
        <summary>Do you work with international partners and funds?</summary>
        <div class="faq-a">Yes. A significant proportion of our institutional partners are based outside Portugal. We provide all reporting in English, accommodate different time zones for review meetings, and our legal and commercial documentation is available in English. We work with advisors and legal counsel in multiple jurisdictions.</div>
      </details>
    </div>
  </div>
</section>

<!-- SECTION 10 — DEAL ENQUIRY -->
<section id="deal-enquiry">
  <div class="wrap">
    <div class="enquiry">
      <div class="enquiry-intro reveal">
        <div class="eyebrow">Start a Conversation</div>
        <h2>Ready to Explore a Partnership?</h2>
        <p class="lede">Whether you represent an investment fund, a development company, a large property operator, or a corporate seeking managed accommodation — we want to hear from you. Complete the enquiry form below and one of our senior team will respond within 24 hours.</p>
        <div class="contact-direct">
          <b>Contact Our Institutional Team Directly</b>
          Email: <a href="mailto:realestate@centralhillapartments.com">realestate@centralhillapartments.com</a><br>
          Tel: <a href="tel:+351910075725">+351 910 075 725</a><br>
          LinkedIn: <a href="#">Central Hill Apartments</a>
        </div>
      </div>

      <form class="form-card reveal" onsubmit="return false">
        <div class="fgroup">
          <div class="fgroup-title">Organisation Details</div>
          <div class="ffield">
            <label for="company">Company / Fund Name</label>
            <input id="company" name="company" type="text" placeholder="Your organisation">
          </div>
          <div class="ffield">
            <label for="contact">Contact Name &amp; Title</label>
            <input id="contact" name="contact" type="text" placeholder="Name, role">
          </div>
          <div class="ftwo">
            <div class="ffield">
              <label for="email">Email Address</label>
              <input id="email" name="email" type="email" placeholder="name@company.com">
            </div>
            <div class="ffield">
              <label for="phone">Phone Number</label>
              <input id="phone" name="phone" type="tel" placeholder="+351 …">
            </div>
          </div>
          <div class="ffield">
            <label for="country">Country / Jurisdiction</label>
            <input id="country" name="country" type="text" placeholder="e.g. Portugal, United Kingdom">
          </div>
        </div>

        <div class="fgroup">
          <div class="fgroup-title">Asset Details</div>
          <div class="ffield">
            <label for="asset-type">Type of Asset</label>
            <select id="asset-type" name="asset-type">
              <option value="" selected disabled>Select asset type…</option>
              <option>Apartments</option>
              <option>Apart-hotel</option>
              <option>Hotel</option>
              <option>Mixed</option>
              <option>Corporate housing</option>
            </select>
          </div>
          <div class="ftwo">
            <div class="ffield">
              <label for="units">Number of Units or Keys</label>
              <input id="units" name="units" type="text" placeholder="e.g. 24">
            </div>
            <div class="ffield">
              <label for="locations">Location(s) in Portugal</label>
              <input id="locations" name="locations" type="text" placeholder="e.g. Lisbon, Porto">
            </div>
          </div>
          <div class="ffield">
            <label for="status">Current Status</label>
            <select id="status" name="status">
              <option value="" selected disabled>Select current status…</option>
              <option>Operating</option>
              <option>In development</option>
              <option>Acquisition phase</option>
            </select>
          </div>
          <div class="ftwo">
            <div class="ffield">
              <label for="model">Target Partnership Model</label>
              <select id="model" name="model">
                <option value="" selected disabled>Select model…</option>
                <option>Fixed rent</option>
                <option>Management commission</option>
                <option>Hybrid</option>
                <option>Open to discussion</option>
              </select>
            </div>
            <div class="ffield">
              <label for="timeline">Anticipated Start Date / Timeline</label>
              <input id="timeline" name="timeline" type="text" placeholder="e.g. Q3 2026">
            </div>
          </div>
        </div>

        <div class="fgroup">
          <div class="fgroup-title">Additional Information</div>
          <div class="ffield">
            <label for="notes">Tell us more about your asset and what you are looking to achieve</label>
            <textarea id="notes" name="notes" placeholder="Your goals, asset details, any specific requirements…"></textarea>
          </div>
        </div>

        <button class="btn btn-accent" type="submit">Submit Partnership Enquiry →</button>
        <p class="form-note">A senior member of our institutional team will respond within 24 hours.</p>
      </form>
    </div>
  </div>
</section>
`;

export async function RealEstatePage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  return (
    <div className="mk" data-page="real-estate">
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
      <div dangerouslySetInnerHTML={{ __html: BODY(locale) }} />
    </div>
  );
}
