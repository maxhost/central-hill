# Mock build contract (read before building any page mock)

Shared rules + snippets every per-page agent MUST follow so pages stay consistent and connected.
Build static HTML page mocks for "Central Hill" (premium furnished-rentals, Lisbon). Reference vibe:
ukio.com (warm boutique-premium) + lovelystay.com (information architecture).

## Hard boundary rules
- Write ONLY your assigned file in `mock/`. Do NOT edit/create any other file.
- Do NOT modify the shared kernel (`mock/assets/site.css`, `mock/assets/site.js`) or sibling pages.
  You MAY read `mock/assets/site.css` to learn classes + the 6-palette CSS-variable system.
- The kernel auto-injects the palette switcher and handles nav-scroll + scroll reveal — do NOT add
  palettes, `:root` tokens, or switcher code. A SMALL page-only `<style>` is allowed ONLY for
  page-unique components and MUST use kernel variables: `--ink, --ink-soft, --bg, --surface, --line,
  --accent, --accent-deep, --feature, --feature-accent, --on-feature, --on-feature-soft`.

## Head (verbatim — note the Iconoir stylesheet)
```
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/iconoir/css/iconoir.css">
<link rel="stylesheet" href="assets/site.css">
```
Body opens: `<body data-theme="warm-editorial" data-page="PAGE NAME">` and ends with `<script src="assets/site.js"></script>`.

## Icons — Iconoir ONLY, NEVER emojis
Syntax: `<i class="iconoir-NAME" aria-hidden="true"></i>`. Size/color with a small page class, e.g.
`.ico{font-size:30px;line-height:1;color:var(--accent-deep);display:inline-block;margin-bottom:18px}`.
ONLY use class names from this VERIFIED list (others may not render; if unsure use `iconoir-sparks`):
airplane, bank, bed, bell, bell-notification, binocular, bonfire, book-stack, bookmark, building,
calendar, camera, car, cart, chat-bubble, chat-lines, check, check-circle, city, clipboard-check,
clock, coins, coins-swap, community, compass, crown, delivery-truck, design-pencil, dollar-circle,
edit-pencil, euro, filter, fire-flame, gift, globe, graph-up, group, gym, half-moon, headset, home,
home-simple, internet, journal, key, leaf, light-bulb, lock, mail, map, map-pin, medal, megaphone,
money-square, music-double-note, page, page-edit, palette, peace-hand, people-tag, percentage-circle,
phone, pin, pizza-slice, presentation, priority-up, privacy-policy, quote-message, reports, rss-feed,
ruler-combine, sea-and-sun, sea-waves, search, send-diagonal, settings, shield-check, sparks, star,
stats-report, stats-up-square, suitcase, sun-light, swimming, tools, tree, trophy, umbrella, user,
user-crown, user-star, wallet, wifi, wrench.

## Canonical NAV (paste verbatim, first in body)
```
<header class="nav">
  <div class="wrap nav-inner">
    <a class="brand" href="home.html">Central<span>Hill</span></a>
    <nav class="links">
      <a href="owners.html">Owners</a><a href="buildings.html">Buildings</a><a href="real-estate.html">Real Estate</a>
      <a href="guest.html">Guests</a><a href="about.html">About Us</a><a href="blog.html">Blog</a>
    </nav>
    <div class="nav-cta">
      <a class="btn btn-ghost" href="buildings.html">Book Now</a>
      <a class="btn btn-solid" href="owners.html">List Your Property →</a>
    </div>
    <button class="menu-btn" aria-label="Menu">☰</button>
  </div>
</header>
```

## Canonical FOOTER (paste verbatim, before the script)
```
<footer>
  <div class="wrap">
    <div class="f-grid">
      <div>
        <div class="brand">Central<span style="color:var(--feature-accent)">Hill</span></div>
        <div class="f-contact">Call +351 910 075 725<br>info@centralhill.pt<br>WhatsApp +351 910 075 725</div>
        <div class="f-social"><a href="#">f</a><a href="#">in</a><a href="#">ig</a></div>
      </div>
      <div><h4>For Owners</h4><ul><li><a href="owners.html">Earnings Estimate</a></li><li><a href="owners.html">Owner Services</a></li><li><a href="#">Owner Dashboard</a></li><li><a href="owners.html">Pricing &amp; Plans</a></li><li><a href="owners.html">List Your Property</a></li><li><a href="real-estate.html">Real Estate Partnerships</a></li></ul></div>
      <div><h4>Guests &amp; Company</h4><ul><li><a href="buildings.html">Browse Apartments</a></li><li><a href="guest.html">Guest Services</a></li><li><a href="about.html">About Us</a></li><li><a href="blog.html">Blog</a></li><li><a href="about.html">Contact</a></li></ul></div>
    </div>
    <div class="f-bottom"><span>© 2026 Central Hill Apartments · Lisbon, Portugal</span><span>EN · PT · ES · FR</span></div>
  </div>
</footer>
```

## Reusable kernel classes (prefer these; don't reinvent)
`.wrap` `.eyebrow` `.lede` `h2.section-title` `.sec-head[.center]` `.btn .btn-accent/.btn-solid/.btn-ghost/.btn-light`
`.hero[.compact]` `.stats/.stats-grid/.stat` `.grid-3 .bcard` `.pf-grid .pcard .badge .ph .pbody .pmeta .view`
`.t-grid .tcard .ttype .stars` `.story` `.dual .dcol[.owner]` `.alt` `.reveal` (add to section heads/grids).
For card icons inside `.bcard`, replace the SVG with `<i class="iconoir-..." aria-hidden="true"></i>` and a `.ico` class.

## Verified image pool
`https://images.unsplash.com/<id>?auto=format&fit=crop&w=1200&q=70` (hero w=1900, cards w=900).
Interiors: photo-1545324418-cc1a3fa10c00, photo-1502672260266-1c1ef2d93688, photo-1560185007-cde436f6a4d0,
photo-1518780664697-55e3ad937233, photo-1522708323590-d24dbb6b0267, photo-1560448204-e02f11c3d0e2,
photo-1493809842364-78817add7ffb, photo-1600585154340-be6161a56a0c, photo-1600607687939-ce8a6c25118c,
photo-1600566753086-00f18fb6b3ea, photo-1564013799919-ab600027ffc6, photo-1505691938895-1758d7feb511
Lisbon/city/exterior: photo-1585208798174-6cedd86e019a, photo-1580323956656-26bbb1206e34,
photo-1591825729269-caeb344f6df2, photo-1469022563428-aa04fef9f5a2, photo-1486406146926-c627a92ad1ab,
photo-1512917774080-9991f1c4c750, photo-1449844908441-8829872d2607, photo-1570129477492-45c003edd2be,
photo-1554995207-c18c203602cb, photo-1502005229762-cf1b2da7c5d6, photo-1551038247-3d9af20df552,
photo-1583847268964-b28dc8f51f92, photo-1513635269975-59663e0ac1ad, photo-1555881400-74d7acaacd8b
All `<img>` need width-appropriate params + descriptive `alt`.

## Quality bar
Premium restraint matching the existing pages (home.html, owners.html): generous whitespace, serif headings
via kernel, accent only on actions, consistent Iconoir icons. Valid HTML. Page-only CSS via kernel vars so it
adapts to ALL 6 palettes. Self-check before finishing: only your file changed; nav/footer verbatim; Iconoir
(no emojis); no palette/switcher code; images have alt.
