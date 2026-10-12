# Spec + plan — Admin Guests editable sección a sección

**Fecha:** 2026-10-11 · **Slice principal:** `pages` · **Estado:** completado (S1–S5; S6 docs)
**Precedentes:** `home-admin-editor.md`, `owners-admin-editor.md`, `real-estate-admin-editor.md` (mismo
proceso, mismas piezas reutilizables). Base técnica: `guest-page-db-wiring.md` (migración `0012`).

## Objetivo

Que **todo** lo visible de `/[locale]/guests` (textos, botones, iconos, imágenes, vídeos y SEO), salvo los
componentes de catálogo (tarjetas de buildings del carrusel, tarjetas de testimonios con su badge y
preguntas FAQ), se pueda editar desde `/admin/pages/guest`, con un formulario **sección a sección en el
orden de la página**, como Home y Owners.

**Reglas (owner, 2026-10-11):**
- **Sólo se añade.** No se borra ni se renombra ningún campo de `page_content.data`. Los campos nuevos son
  **opcionales**: vacío → la página se ve como hoy (texto i18n actual o foto actual). Sin migración (`data`
  es jsonb; `applyDefaults` rellena las claves que falten).
- **Las URLs no se editan ni se muestran** en el admin. El destino de cada botón lo fija el código (ver
  "Destinos de los botones"). Los valores guardados se conservan (`admin_hidden`) pero el render ya no los usa.
- **Por ahora sólo inglés.** Un campo relleno se muestra en los 4 idiomas hasta el arco de traducción por
  pestañas. Todo fallback nuevo (incluido el alt de la imagen de respaldo) se añade en i18n en **en, pt, es, fr**.
- Medios e iconos se comparten entre idiomas; los textos (incluido el alt editable) son por idioma.
- **Autorización:** los cambios fuera de `pages` listados abajo (`core/ui`, `settings`, shell `src/app`,
  `messages/*`) no necesitan ADR aparte; los autoriza este spec.

## Cómo se publica

Igual que el resto: `savePage("guest")` → `revalidatePage("guest")` invalida `page:guest` y revalida
`/{locale}/guests` en los 4 idiomas. Sólo el **código** de este spec necesita deploy.

---

## Destinos de los botones (fijos en código)

| Botón | Destino |
|---|---|
| Hero CTA ("Browse Our Apartments") | `/{locale}/buildings` |
| Why CTA | `/{locale}/buildings` |
| Portfolio CTA ("View All Properties") | `/{locale}/buildings` |
| Services teaser CTA | `/{locale}/services` |
| What to do CTA | `/{locale}/guides` |
| Dual CTA, panel guest ("Browse Our Apartments") | `/{locale}/buildings` |
| Dual CTA, panel owner | **abre el modal de contacto** (el mismo `ContactDialog` del icono mail del navbar), `source="guests-dual-cta"` |

**Decisión D1 (confirmada por el owner, 2026-10-11):** el owner pidió `https://central-hill-umber.vercel.app/en/…`.
Se implementa como **ruta relativa con el idioma activo** (`/{locale}/buildings`, …). En el deploy de Vercel
resuelve exactamente a esa URL para EN, lleva a `/pt/…` a un visitante portugués y sigue funcionando
cuando cambie el dominio. Es el mismo patrón que la navegación interna del resto de páginas. `localizeUrl`
deja de hacer falta y se borra.

## Campos ocultos en el editor

Se reutiliza `.meta({ admin_hidden: true })` (Owners S1). En `schemas/guest.ts`, variantes locales
`cta.extend({ url: hiddenUrl })` y `ctaWithNote.extend({ url: hiddenUrl })` (el kernel no se toca):

`hero.cta.url`, `why.cta.url`, `portfolio.cta.url`, `services_teaser.cta.url`, `activities_teaser.cta.url`,
`dual_cta.guest.cta.url`, `dual_cta.owner.cta.url`.

---

## Modelo de datos: añadidos a `guestSchema` (`src/slices/pages/schemas/guest.ts`)

T = traducible (por idioma) · C = compartido entre idiomas.

| Sección | Campo | Tipo | Clase | Vacío → |
|---|---|---|---|---|
| SEO | `seo.meta_title` | `seoShape.meta_title` | T | i18n `pages.guests.metaTitle` (lo de hoy) |
| SEO | `seo.meta_description` | `seoShape.meta_description` | T | i18n `pages.guests.metaDescription` |
| SEO | *(ya existe)* `og_image_media_id` (columna) | imagen | C | sin OG |
| Hero | `hero.poster_media_id` | `optionalImage` (hint de Home) | C | poster Unsplash actual |
| Hero | *(ya existe)* `hero.video_media_id`, eyebrow, headline, subheadline, `cta.label` | — | — | — |
| Welcome | `welcome.image_media_id` | **pasa a `optionalAnimated`**: imagen, WebP animado, MP4/WebM, Lottie | C | foto Unsplash actual |
| Welcome | `welcome.image_alt` | tStrOpt 160 | T | alt del asset → i18n `pages.guests.welcomeAlt` |
| Welcome | `welcome.guarantee_icon_key` | `optionalIconKey` | C | `percentage-circle` |
| Why | *(ya existe todo)*; sólo se oculta la URL | — | — | — |
| Portfolio | *(ya existe)* `cta.note` | — | T | **ahora sí se pinta** (hoy es un campo muerto) |
| Services teaser | `services_teaser.items[].image_media_id` | `optionalImage` | C | foto Pexels actual de esa posición |
| What to do | `activities_teaser.items[].image_media_id` | `optionalImage` | C | foto Pexels actual de esa posición |
| Testimonios | `testimonials.eyebrow` | tStrOpt 60 | T | i18n `pages.reviews.eyebrow` ("Reviews") |
| Testimonios | `testimonials.title` | tStrOpt 160 | T | i18n `pages.reviews.titleGuests` |
| Testimonios | `testimonials.intro` | tStrOpt 400 | T | sin subtítulo (como hoy) |
| FAQ | `faq.title` | tStrOpt 160 | T | i18n `pages.faqTitle` |
| FAQ | *(ya existe)* `faq_group_key` (select de grupos) | — | C | sin sección FAQ |
| Dual CTA | `dual_cta.owner.contact.title` | tStrOpt 80 | T | i18n `settings…contactDialog.title` ("Contact us") |
| Dual CTA | `dual_cta.owner.contact.intro` | tStrOpt 280 | T | i18n `settings…contactDialog.intro` |

Notas:
- Las tarjetas de los teasers siguen siendo **6 fijas**; `iconCard` se extiende localmente
  (`iconCard.extend({ image_media_id: optionalImage(HINT).optional() })`), sin tocar `_shared.ts` para Home.
- `welcome.image_media_id` como `optionalAnimated` es una relajación compatible (una imagen sigue valiendo).
- `testimonials` y `faq` van en objetos aparte; `faq_group_key` se queda en la raíz y el editor los junta.

---

## Editor: formulario sección a sección (orden de la página)

`GUEST_LAYOUT` en `src/slices/pages/admin/layout.ts`, registrado en `LAYOUTS.guest`. Ids estables; lo no
reclamado cae en "Other". `EditorCardId` suma los ids nuevos.

| # | id | Tarjeta | Contenido | Nota (sólo lectura) |
|---|---|---|---|---|
| 1 | `seo` | SEO & sharing | meta title, meta description, imagen OG | contador 70/200 |
| 2 | `hero` | Hero | vídeo, poster, eyebrow, título, subtítulo, texto del botón | "The button always opens Buildings" |
| 3 | `welcome` | Welcome | título, lede, texto (línea en blanco = párrafo), línea de garantía + icono, imagen/vídeo/animación, alt | — |
| 4 | `why` | Why book directly | eyebrow, título, intro, 4 beneficios (icono, título, texto), botón (texto + nota) | — |
| 5 | `portfolio` | Portfolio | eyebrow, título, intro, botón (texto + nota) | "Properties come from Buildings (featured)" + enlace `/admin/buildings` |
| 6 | `services_teaser` | Services teaser | eyebrow, título, intro, 6 tarjetas (icono, título, texto, foto), botón (texto + nota) | "The button always opens Services" |
| 7 | `activities_teaser` | What to do | igual que 6 | "The button always opens Guides" |
| 8 | `testimonials` | Testimonials | eyebrow, título, subtítulo | "Reviews come from Testimonials (audience Guest)" + enlace |
| 9 | `faq` | FAQ | grupo, título | "Questions are edited in FAQ" + enlace |
| 10 | `dual_cta` | Closing CTA | panel guest (eyebrow, título, texto, botón); panel owner (eyebrow, título, texto, botón, título e intro del modal) | "The owner button opens the contact form. Contact line comes from Settings" + enlace |

### Selector de medios y hints (en inglés)

| Campo | `accept` | Hint |
|---|---|---|
| `hero.video_media_id` | `video` | El actual (16:9, 1920×1080, MP4 H.264, < 8 MB) |
| `hero.poster_media_id` | `image` | El de Home: "Shown while the video loads and when it can't play. Use a still from the video. 1920×1080 (16:9), JPG or WebP, under 400 KB." |
| `welcome.image_media_id` | `animated` | "Landscape 3:2 — the frame is about 540×380 px on desktop and a full-width strip 280 px tall on tablet/mobile, and the media is cropped to fill it, so keep the subject centred. Photo: 1500×1000 px (min 1200×800), JPG/WebP, under 500 KB. Video: MP4 (H.264), 1500×1000 or 1200×800, no audio, 6–15 s loop, under 10 MB. Animated WebP: 1200×800, under 5 MB. Lottie (.lottie or .json): 3:2 canvas (e.g. 1200×800)." (corregido en S3: la celda de `IntroSplit` es horizontal, no 4:5) |
| `*_teaser.items[].image_media_id` | `image` | "Card background (a dark overlay is applied, centre-cropped). Landscape 3:2 — 1200×800 px (min 900×600), JPG or WebP, under 300 KB." |
| `og_image_media_id` | `image` | El de Home (1200×630) |

---

## Render público

- **URLs:** destinos fijos de la tabla de arriba. Se borra `localizeUrl`.
- **Hero:** `poster` = `heroPosterSrc(media[poster_media_id])` o el Unsplash actual. `type` del `<source>`
  según el `mime` del vídeo (MP4/WebM).
- **Welcome:** `sideMedia()` (`ui/components/side-media.tsx`) para imagen/vídeo/WebP animado/Lottie; sin
  asset → foto Unsplash. Alt = `image_alt` → alt del asset → `t("guests.welcomeAlt")`. Icono de la garantía
  = `guarantee_icon_key` o `percentage-circle`.
- **Portfolio:** se pasa `ctaNote={portfolio.cta.note || undefined}` a `FeaturedPortfolio`.
- **Teasers:** `image` de cada tarjeta = URL optimizada del asset (mismo enfoque que `heroPosterSrc`:
  `getImageProps`, un candidato ~1200 px) o la foto Pexels de esa posición.
- **Testimonios:** `TestimonialsRow` gana `intro?` (en el slice). `eyebrow`/`title` = campo o i18n.
- **FAQ:** `FaqSection title` = `faq.title` o `t("faqTitle")`.
- **Dual CTA:** panel guest → `/{locale}/buildings`. Panel owner → el botón es un `ContactDialog`
  (`label` = `owner.cta.label`, `title`/`intro` = campo o i18n del header, `source="guests-dual-cta"`),
  con el **mismo aspecto** que el botón actual del panel oscuro (incluida la "→"). Línea de contacto sigue
  saliendo de Settings.
- **SEO:** `buildGuestMetadata(locale)` en el contrato de `pages` (`seo.*` + OG, fallback i18n), con
  `seoMetadataInput`, como Owners/Real Estate. La ruta sólo lo llama.

**Con todos los campos nuevos vacíos, la página queda idéntica a la actual** en los 4 idiomas, con tres
cambios intencionados: los botones van a rutas fijas por idioma, se pinta la nota del portfolio que ya hay en
la BD, y el botón owner del CTA final abre el modal en vez de navegar a `/owners`.

## Cambios fuera de `pages` (autorizados por este spec)

| Cambio | Dónde |
|---|---|
| `SplitCtaPanels`: panel acepta `action?: ReactNode` que sustituye al enlace (aditivo; sin él, igual que hoy) | `core/ui/split-cta-panels.tsx` |
| `ContactDialog`: prop aditiva para que el disparador use una clase de botón dada (p. ej. `triggerClassName`) | `slices/settings/ui/components/contact-dialog.tsx` |
| La ruta Guests llama a `buildGuestMetadata` | `src/app/[locale]/guests/page.tsx` |
| Claves i18n nuevas (`pages.guests.welcomeAlt`, `pages.admin.labels.*`, notas del layout) en 4 idiomas | `messages/{en,pt,es,fr}.json` |

---

## Plan por sesiones

Cada sesión la implementa un agente general-purpose. Después, el coordinador revisa el diff, ejecuta
typecheck, lint y los tests (`npx tsx --test …`), y comprueba el admin real y la página pública con
Playwright headed **sin guardar**. Cada commit necesita el OK del owner. El push, sólo cuando se pida.

**Política de tests (owner):** tests básicos de la superficie tocada, centrados en los inputs de medios y en
los campos ocultos. Cada sesión cabe en 10–15 minutos.

**S1 — Editor por secciones + URLs fijas.**
- Variantes locales de `cta`/`ctaWithNote` con `url` oculta (7 campos). Render con destinos fijos; se borra
  `localizeUrl`. Se pinta la nota del portfolio.
- `GUEST_LAYOUT` (10 tarjetas + "Other"), notas y enlaces, etiquetas legibles e `itemLabels` (4 idiomas).
- Tests: URLs ocultas = no se pintan y se guardan sin cambios; layout sin claves perdidas.

**S2 — SEO y textos con fallback.**
- `seo.*` + `buildGuestMetadata` + ruta. `testimonials.{eyebrow,title,intro}` (+ prop `intro` en
  `TestimonialsRow`), `faq.title`.
- Tests de fallback (`orMessage`).

**S3 — Hero y Welcome (medios).**
- `hero.poster_media_id` + `heroPosterSrc`; `type` del vídeo por mime.
- `welcome.image_media_id` → `optionalAnimated` + `sideMedia`; `welcome.image_alt` + `pages.guests.welcomeAlt`
  en 4 idiomas; `welcome.guarantee_icon_key`.
- Tests del `accept` de cada campo y del orden del alt.

**S4 — Fotos de las tarjetas de los teasers.**
- `image_media_id` opcional en las 12 tarjetas, hint 3:2, URL optimizada o Pexels por posición.
- Tests: `accept=image`, fallback por posición.

**S5 — CTA final con modal.**
- `SplitCtaPanels.action`, prop de clase en `ContactDialog`, `dual_cta.owner.contact.{title,intro}`.
- Verificar que el header (los dos `ContactDialog`) y Owners hero quedan igual; el modal envía un lead
  `kind = "contact"` con `source = "guests-dual-cta"` (sin enviar en la verificación).

**S6 — Cierre.**
- Recorrer `/guests` en los 4 idiomas con todo vacío y con todo relleno (instantánea antes, restaurar
  después; `.env.local` apunta a la DB y R2 de PROD; borrar los assets de prueba).
- Actualizar `pages/README.md`, `docs/data-model.md` → guest, README de `core/ui` y `settings`, y este spec
  (estado final). Marcar `guest-page-db-wiring.md` como superado en lo que toca a URLs.

## Fuera de alcance

- Tarjetas del carrusel de buildings (catálogo), badge "Guest"/rating de los testimonios, preguntas FAQ.
- Número de tarjetas de Why (4) y de los teasers (6): siguen fijos.
- Arco de traducción por pestañas (EN/PT/ES/FR en el editor).
- Cambiar los destinos de los botones desde el admin.

---

## Estado final (2026-10-12)

Las sesiones S1–S5 están entregadas; S6 cierra la documentación. Commits:

| Sesión | Commit | Qué entró |
|---|---|---|
| Spec | `ef12d31` | Este documento + plan por sesiones |
| S1 | `bc0f7e0` | Variantes locales `guestCta` / `guestCtaWithNote` con la URL `admin_hidden` (7 campos). Render con destinos fijos por idioma (`ctaRoutes(locale)`); `localizeUrl` borrado. Se pinta `portfolio.cta.note`. `GUEST_LAYOUT` (10 tarjetas + "Other"), notas y enlaces, etiquetas e `itemLabels` (4 idiomas) |
| S2 | `71f22fb` | `seo.*` + `buildGuestMetadata` (contrato); la ruta sólo lo llama. `testimonials.{eyebrow,title,intro}` (+ prop `intro` en `TestimonialsRow`) y `faq.title`, con fallback i18n vía `orMessage` |
| S3 | `8be3252` | `hero.poster_media_id` (`heroPosterSrc`) y `type` del `<source>` por mime. `welcome.image_media_id` → `optionalAnimated` con `sideMedia()`; `welcome.image_alt` (→ alt del asset → `pages.guests.welcomeAlt`, 4 idiomas); `welcome.guarantee_icon_key` |
| S4 | `f9e9677` | `image_media_id` opcional en las 12 tarjetas de los teasers (hint 3:2); `ui/optimized-src.ts` (`optimizedSrc`, `cssUrlSafe`, `cardBgSrc`); fallback Pexels por posición |
| S5 | `f4b9b83` | `SplitCtaPanels.action` + `splitCtaButtonClassName` (`core/ui`), `ContactDialog.triggerClassName` (`settings`), `dual_cta.owner.contact.{title,intro}`; el botón owner del CTA final abre el modal (`source = "guests-dual-cta"`) |
| S6 | — | Documentación: `pages/README.md` ("Guests content model"), `docs/data-model.md` → guest, README de `settings`, aviso en `guest-page-db-wiring.md` y este cierre |

### Desviaciones y hallazgos durante la implementación

- **D1 confirmada:** rutas fijas relativas con el idioma activo (`/{locale}/buildings`, `/services`,
  `/guides`) en vez de las URLs absolutas `https://central-hill-umber.vercel.app/en/…`. Los `cta.url`
  guardados se conservan (ocultos) pero el render no los usa.
- **S1:**
  - `portfolio.cta.note` está **vacío en PROD**, así que la nota del portfolio no se ve hasta que
    alguien la rellene en el editor (el render ya la pinta cuando hay texto).
  - Además de las notas de la tabla del editor, las tarjetas Why y Portfolio llevan también la nota
    "The button always opens Buildings" (Portfolio, junto a la de Buildings destacados).
- **S3:**
  - El hint de `welcome.image_media_id` se corrigió de 4:5 a **horizontal 3:2**: la celda de
    `IntroSplit` mide ~540×380 en escritorio y es una franja a todo el ancho de 280 px de alto a
    ≤880px.
  - `admin/form-model.ts` trata ahora también `*_icon_key` (no sólo `icon_key`) como selector de
    icono, para `welcome.guarantee_icon_key`.
  - El envoltorio del medio de Welcome (`welcomeSideMedia`) quita el radio de `sideMedia()` (la foto
    de esta página siempre ha sido de esquinas rectas) y mantiene el *cover* de la celda. Un asset
    de imagen sin dimensiones cae a un `<img>` simple, como antes.
- **S4:**
  - Nuevo `src/slices/pages/ui/optimized-src.ts`: `optimizedSrc(asset, w, h)` (un candidato de
    `getImageProps`, URL cruda si el optimizador falla), `cssUrlSafe` (para el `url(...)` sin comillas
    de `PhotoFeatureGrid`) y `cardBgSrc` (asset optimizado o Pexels de esa posición).
    `heroPosterSrc` ahora delega en `optimizedSrc`.
  - Tamaños medidos de las tarjetas: ~377×260 en la rejilla de 3 columnas de escritorio, ~360×260 a
    2 columnas y hasta ~584×260 a 1 columna; se pide una caja de 600×400 CSS → candidato `w=1200`.
- **S5:**
  - `SplitCtaPanels`: cada panel lleva `cta` **o** `action` (un `ReactNode` que sustituye al enlace);
    `splitCtaButtonClassName(tone)` exporta la clase del botón estándar. Sin `action`, igual que antes.
  - `ContactDialog.triggerClassName`: sustituye las clases del `variant` (Guests pasa
    `splitCtaButtonClassName("dark")` y añade la "→"). Sin la prop, header y hero de Owners quedan igual.
  - El lead usa `source = "guests-dual-cta"`: es un string libre, **leads no se tocó**.
  - El grupo `faq` (`faq_group_key`) está **sin asignar en PROD**, así que la sección FAQ no aparece
    en `/guests` hasta que se elija un grupo en el editor.

### Verificación hecha

- **Tests por sesión** (`pages/tests/pages-admin.test.ts`, `pages/tests/pages.test.ts`): URLs
  ocultas (nodos `hidden`, se guardan sin cambios), layout de 10 ids sin claves perdidas, fallbacks
  `orMessage` de SEO / testimonios / FAQ, `seoMetadataInput` de `/guests`, `accept` de cada medio
  (poster `image`, welcome `animated`, tarjetas `image`), orden del alt, `cardBgSrc` por posición y
  `dual_cta.owner.contact` opcional.
- **Revisión del coordinador en cada sesión**: diff, typecheck + lint + tests, y el admin real y la
  página pública en Playwright headed **sin guardar**.
- **Las sesiones no escriben en DB / R2.** Sin migración ni pre-carga: todos los campos nuevos son
  opcionales.
- QA PROD: pendiente (la hará el owner; el clasificador del modo automático bloqueó el guardado de prueba el 2026-10-12, sin escrituras).

## Abiertos (para decidir después)

1. **Prueba real de guardado en PROD** con subidas (poster del hero, medio de Welcome —imagen, vídeo,
   WebP animado y Lottie— y fotos de las tarjetas de los teasers). Pendiente (ver "QA PROD").
2. **`portfolio.cta.note` vacío y FAQ sin grupo en PROD**: contenido, no código; se rellena desde el editor.
3. **Arco de traducción por pestañas** (`home-admin-editor.md` → "Modelo de traducción por pestañas").
   Hasta entonces el contenido de la DB sale en EN en PT/ES/FR.
4. **Post-deploy: no hace falta nada.** Sin migración ni escrituras en DB; con los campos vacíos la
   página renderiza los fallbacks.
