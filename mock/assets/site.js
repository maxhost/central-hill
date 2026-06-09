/* =====================================================================
   Central Hill — shared mock behaviour (kernel)
   - Injects the palette switcher + preview flag on every page
   - Nav: transparent over hero → frosted on scroll
   - Subtle scroll reveal (respects prefers-reduced-motion)
   Pages opt in via: <body data-theme="warm-editorial" data-page="Buildings">
   ===================================================================== */
(function () {
  var PALETTES = [
    { id: "warm-editorial", name: "Warm Editorial",          dot: "#B5562D" },
    { id: "deep-green",     name: "Deep Luxe Green",         dot: "#1F5C45" },
    { id: "coastal",        name: "Coastal Portugal",        dot: "#2C6E8F" },
    { id: "monochrome",     name: "Monochrome Boutique",     dot: "#111111" },
    { id: "terracotta",     name: "Terracotta Mediterranean",dot: "#C0653A" },
    { id: "sand-navy",      name: "Sand & Navy",             dot: "#1C3A5E" }
  ];
  var body = document.body;

  /* ---- inject palette switcher ---- */
  var sw = document.createElement("div");
  sw.className = "switcher";
  sw.setAttribute("role", "group");
  sw.setAttribute("aria-label", "Color palette preview");
  sw.innerHTML =
    '<div class="sw-title">Palette preview</div>' +
    '<div class="sw-dots" id="swDots"></div>' +
    '<div class="sw-name" id="swName"></div>' +
    '<div class="sw-hint">Click a swatch to preview · shared across pages</div>';
  body.appendChild(sw);

  var flag = document.createElement("div");
  flag.className = "mock-flag";
  flag.textContent = "Static design preview · " + (body.dataset.page || "Central Hill");
  body.appendChild(flag);

  var dots = sw.querySelector("#swDots");
  var nameEl = sw.querySelector("#swName");

  function apply(id) {
    var p = PALETTES.filter(function (x) { return x.id === id; })[0] || PALETTES[0];
    body.setAttribute("data-theme", p.id);
    nameEl.textContent = p.name;
    try { localStorage.setItem("ch-theme", p.id); } catch (e) {}
    [].forEach.call(dots.children, function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.id === p.id));
    });
  }
  PALETTES.forEach(function (p) {
    var b = document.createElement("button");
    b.className = "sw-dot";
    b.dataset.id = p.id;
    b.style.background = p.dot;
    b.title = p.name;
    b.setAttribute("aria-label", p.name);
    b.setAttribute("aria-pressed", "false");
    b.onclick = function () { apply(p.id); };
    dots.appendChild(b);
  });
  var saved;
  try { saved = localStorage.getItem("ch-theme"); } catch (e) {}
  apply(saved || body.getAttribute("data-theme") || "warm-editorial");

  /* ---- nav: transparent over a dark hero → frosted on scroll.
          Pages without a dark hero (or with body[data-nav="solid"]) get the SOLID
          frosted nav from the top, so light-background pages (e.g. Blog) stay legible. ---- */
  var nav = document.querySelector("header.nav");
  if (nav) {
    var hero = document.querySelector(".hero");
    var solidNav = body.dataset.nav === "solid" || !hero;
    if (solidNav) {
      nav.classList.add("scrolled");
      body.style.paddingTop = nav.offsetHeight + "px";
    } else {
      // Frost the nav the moment the user scrolls (>2px); transparent only at the very top.
      var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 2); };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  /* ---- subtle scroll reveal ---- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    [].forEach.call(document.querySelectorAll(".hero video"), function (v) {
      v.removeAttribute("autoplay"); try { v.pause(); } catch (e) {}
    });
  }
  var els = document.querySelectorAll(".reveal");
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    [].forEach.call(els, function (el) { io.observe(el); });
  } else {
    [].forEach.call(els, function (el) { el.classList.add("in"); });
  }
})();
