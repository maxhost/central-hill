import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@core/db/columns";

/**
 * Guides index ("What to Do in Lisbon") — the approved `mock/what-to-do.html`
 * embedded 1:1 inside the live app shell. The mock's body markup is rendered
 * verbatim; its page styles are scoped under `.mk` (see `src/app/mock.css` for
 * the shared design system) so nothing leaks to Home/admin. No database is read
 * here — content is static, matching the mock exactly. The real header/footer +
 * i18n come from the app layout. The city chips are the mock's decorative static
 * markup (no JS wired).
 */

const PAGE_STYLE = `
.mk .city-bar{border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--line) 26%,var(--bg))}
.mk .city-bar .wrap{padding-top:24px;padding-bottom:24px;display:flex;flex-wrap:wrap;align-items:center;gap:16px}
.mk .city-bar .cb-label{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);font-weight:600}
.mk .city-chips{display:flex;flex-wrap:wrap;gap:9px;flex:1;min-width:240px}
.mk .city-chip{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:500;letter-spacing:.01em;
  color:var(--ink-soft);background:var(--surface);border:1px solid var(--line);border-radius:100px;
  padding:9px 16px;cursor:pointer;transition:.2s var(--ease)}
.mk .city-chip:hover{border-color:var(--ink-soft);color:var(--ink)}
.mk .city-chip.is-active{background:var(--ink);border-color:var(--ink);color:var(--bg)}
.mk .city-chip.is-soon{color:var(--ink-soft);opacity:.7;cursor:default}
.mk .city-chip .soon{font-size:10px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--accent-deep);font-weight:600}
.mk .city-note{font-size:12px;letter-spacing:.04em;color:var(--ink-soft);white-space:nowrap}

.mk .gcard .ph::after{content:"";position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(18,16,13,0) 38%,rgba(18,16,13,.42) 100%)}
.mk .gcard .g-ico{font-size:28px;line-height:1;color:var(--accent-deep);display:inline-block;margin-bottom:14px}
.mk .gcard .pbody h3{font-size:22px}
.mk .gcard .g-teaser{font-size:14.5px;color:var(--ink-soft);margin-top:10px;line-height:1.55}

.mk .rec-loc{display:inline-flex;align-items:center;gap:6px;margin-top:14px;
  font-size:12.5px;letter-spacing:.04em;color:var(--ink-soft)}
.mk .rec-loc i{font-size:15px;color:var(--accent-deep)}
.mk .rec-type{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent-deep);font-weight:600}
`;

const BODY = (locale: Locale) => `
<section class="hero compact" style="padding:0">
  <img src="https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1900&q=70" alt="Sunlit rooftops, tiled façades and the Tagus river across Lisbon's historic centre">
  <div class="wrap">
    <span class="eyebrow">Guest Guide</span>
    <h1>The Best of Lisbon</h1>
    <p>What to do in Lisbon — our curated guide to the neighbourhoods, tables, beaches and viewpoints we send our guests to. Local favourites, gathered in one place.</p>
  </div>
</section>

<div class="city-bar">
  <div class="wrap">
    <span class="cb-label">Choose your city</span>
    <div class="city-chips">
      <button class="city-chip is-active"><i class="iconoir-pin" aria-hidden="true"></i>Lisbon</button>
      <button class="city-chip is-soon">Porto <span class="soon">Soon</span></button>
      <button class="city-chip is-soon">Cascais <span class="soon">Soon</span></button>
    </div>
    <span class="city-note">More cities coming as Central Hill grows.</span>
  </div>
</div>

<section>
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Explore the City</span>
      <h2 class="section-title">What to Do in Lisbon</h2>
      <p class="lede" style="margin-top:16px">Eight ways into the city — from the must-see monuments and miradouros to the tables, beaches and festivals just beyond them. Each guide is hand-written by our local team and updated through the season.</p>
    </div>

    <div class="pf-grid reveal">

      <a class="pcard gcard" href="#">
        <div class="ph"><img src="https://images.unsplash.com/photo-1591825729269-caeb344f6df2?auto=format&fit=crop&w=900&q=70" alt="Tiled façades and tram tracks winding through Lisbon's Alfama district"></div>
        <div class="pbody">
          <i class="iconoir-bank g-ico" aria-hidden="true"></i>
          <h3>Top Things to Do</h3>
          <p class="g-teaser">São Jorge Castle, the Jerónimos Monastery and Belém Tower, a ride on Tram 28, the miradouros and the rooftops — the must-see Lisbon, gathered in one place.</p>
          <div class="view">Explore →</div>
        </div>
      </a>

      <a class="pcard gcard" href="#">
        <div class="ph"><img src="https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=70" alt="A spread of Portuguese dishes and pastel de nata on a café table"></div>
        <div class="pbody">
          <i class="iconoir-pizza-slice g-ico" aria-hidden="true"></i>
          <h3>Where &amp; What to Eat</h3>
          <p class="g-teaser">Portuguese gastronomy from authentic tascas to two-star kitchens — fresh seafood, regional dishes and wines, plus the trendy markets, brunch spots and vegan tables we keep going back to.</p>
          <div class="view">Explore →</div>
        </div>
      </a>

      <a class="pcard gcard" href="#">
        <div class="ph"><img src="https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=900&q=70" alt="Golden Atlantic beach with rolling surf near Lisbon"></div>
        <div class="pbody">
          <i class="iconoir-sea-waves g-ico" aria-hidden="true"></i>
          <h3>Beaches near Lisbon</h3>
          <p class="g-teaser">Portugal has 900km of coastline and 300 days of sun a year. From Costa da Caparica and Carcavelos to wild Guincho and the crystal coves of Arrábida — all within easy reach of the city.</p>
          <div class="view">Explore →</div>
        </div>
      </a>

      <a class="pcard gcard" href="#">
        <div class="ph"><img src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=70" alt="A lively open-air festival crowd lit by warm evening light"></div>
        <div class="pbody">
          <i class="iconoir-music-double-note g-ico" aria-hidden="true"></i>
          <h3>Events &amp; Festivals</h3>
          <p class="g-teaser">Santos Populares in June, NOS Alive and Rock in Rio in summer, OutJazz in the parks and Web Summit in November — world-class music, sport and culture all year round.</p>
          <div class="view">Explore →</div>
        </div>
      </a>

      <a class="pcard gcard" href="#">
        <div class="ph"><img src="https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=900&q=70" alt="Hidden lanes and tiled façades in Lisbon's old town at dusk"></div>
        <div class="pbody">
          <i class="iconoir-binocular g-ico" aria-hidden="true"></i>
          <h3>Secrets of Lisbon</h3>
          <p class="g-teaser">Underground Roman galleries, the Feira da Ladra flea market, the city's oldest house and a glass of ginjinha at A Ginginha — the lesser-known corners only locals know.</p>
          <div class="view">Explore →</div>
        </div>
      </a>

      <a class="pcard gcard" href="#">
        <div class="ph"><img src="https://images.unsplash.com/photo-1580323956656-26bbb1206e34?auto=format&fit=crop&w=900&q=70" alt="Families exploring the gardens and grounds of a palace near Lisbon"></div>
        <div class="pbody">
          <i class="iconoir-group g-ico" aria-hidden="true"></i>
          <h3>Lisbon for Families &amp; Kids</h3>
          <p class="g-teaser">The Oceanário, Europe's oldest zoo, the hands-on Pavilion of Knowledge, riverside bike rides and dolphin-watching in Arrábida — easy days out the whole family will love.</p>
          <div class="view">Explore →</div>
        </div>
      </a>

      <a class="pcard gcard" href="#">
        <div class="ph"><img src="https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=900&q=70" alt="Friends gathered together in a bright Lisbon interior"></div>
        <div class="pbody">
          <i class="iconoir-community g-ico" aria-hidden="true"></i>
          <h3>Lisbon for Groups &amp; Friends</h3>
          <p class="g-teaser">Bairro Alto and Pink Street by night, rooftop bars and Tagus boat tours by day, surf lessons, tuk-tuk tours and the LX Factory — the experiences that work best together.</p>
          <div class="view">Explore →</div>
        </div>
      </a>

      <a class="pcard gcard" href="#">
        <div class="ph"><img src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=70" alt="Travellers gathered outside a sunny Lisbon café"></div>
        <div class="pbody">
          <i class="iconoir-compass g-ico" aria-hidden="true"></i>
          <h3>Information for Travellers</h3>
          <p class="g-teaser">Airport transfers and the metro, the Lisboa Card, the best neighbourhoods to base yourself, opening hours and emergency contacts — the practical know-how for a smooth stay.</p>
          <div class="view">Explore →</div>
        </div>
      </a>

    </div>
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <div class="sec-head reveal">
      <span class="eyebrow">Local Favourites</span>
      <h2 class="section-title">Top Recommendations</h2>
      <p class="lede" style="margin-top:16px">A taste of what's inside the guides — a table, a viewpoint and a beach our team returns to again and again.</p>
    </div>

    <div class="pf-grid reveal">

      <a class="pcard" href="#">
        <div class="ph"><img src="https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=70" alt="Plated seafood and wine at a traditional Lisbon restaurant"></div>
        <div class="pbody">
          <span class="rec-type">Restaurant</span>
          <h3 style="margin-top:8px">Ramiro</h3>
          <p style="font-size:14px;color:var(--ink-soft);margin-top:8px">A Lisbon institution for fresh seafood — work through the shellfish and finish with the famous steak sandwich, just as the locals do.</p>
          <span class="rec-loc"><i class="iconoir-map-pin" aria-hidden="true"></i>Avenida Almirante Reis</span>
        </div>
      </a>

      <a class="pcard" href="#">
        <div class="ph"><img src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=70" alt="Sweeping sunset view over the Tagus from a hilltop terrace in Lisbon"></div>
        <div class="pbody">
          <span class="rec-type">Viewpoint</span>
          <h3 style="margin-top:8px">Miradouro do Adamastor</h3>
          <p style="font-size:14px;color:var(--ink-soft);margin-top:8px">A local-favourite kiosk terrace with a cold beer in hand and sunset views over the Tagus and the Cristo Rei statue across the river.</p>
          <span class="rec-loc"><i class="iconoir-map-pin" aria-hidden="true"></i>Santa Catarina</span>
        </div>
      </a>

      <a class="pcard" href="#">
        <div class="ph"><img src="https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=900&q=70" alt="Wide Atlantic beach with surfers and golden sand near Lisbon"></div>
        <div class="pbody">
          <span class="rec-type">Beach</span>
          <h3 style="margin-top:8px">Costa da Caparica</h3>
          <p style="font-size:14px;color:var(--ink-soft);margin-top:8px">15km of golden Atlantic sand a short hop across the river — ideal for relaxing, families and surfing, with rental gear and beach bars all summer.</p>
          <span class="rec-loc"><i class="iconoir-map-pin" aria-hidden="true"></i>Almada · near Lisbon</span>
        </div>
      </a>

    </div>
  </div>
</section>

<section class="stats" style="padding:var(--section-y) 0">
  <div class="wrap" style="text-align:center;max-width:760px">
    <span class="eyebrow" style="color:var(--feature-accent)">Your Base in the City</span>
    <h2 class="section-title" style="color:#fff;margin-top:14px">Make It a Stay to Remember</h2>
    <p style="color:var(--on-feature-soft);font-size:18px;margin:18px auto 0;max-width:60ch">Explore Lisbon by day, then come home to a design-led apartment in one of the city's most storied neighbourhoods — professionally managed, ready when you are.</p>
    <div style="margin-top:34px">
      <a class="btn btn-accent" href="/${locale}/buildings">Browse Our Apartments →</a>
    </div>
  </div>
</section>
`;

/** Guides index ("What to Do") — static embed of the approved mock, no DB. */
export async function GuidesListing({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  return (
    <div className="mk" data-page="guides">
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
      <div dangerouslySetInnerHTML={{ __html: BODY(locale) }} />
    </div>
  );
}
