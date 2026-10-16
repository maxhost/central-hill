# Spec + plan — Admin About editable sección a sección

**Fecha:** 2026-10-16 · **Slice principal:** `pages` · **Estado:** completado (S1–S4; S5 docs)
**Precedentes:** `home-admin-editor.md`, `owners-admin-editor.md`, `real-estate-admin-editor.md`,
`guests-admin-editor.md` (mismo proceso, mismas piezas reutilizables).

## Objetivo

Que **todo** lo visible de `/[locale]/about` (textos, etiquetas, iconos, imágenes, logos y SEO) se pueda
editar desde `/admin/pages/about`, con un formulario **sección a sección en el orden de la página**, como en
las páginas anteriores. Excepciones: las preguntas del FAQ (catálogo) y los textos del formulario de contacto
compartido (ver D1).

**Punto de partida (auditoría 2026-10-16):** casi todo el contenido ya es editable (`schemas/about.ts`). Falta:
SEO (escrito en la ruta, sólo EN en los 4 idiomas), etiquetas del panel de oficina (escritas en código, EN en
los 4 idiomas), teléfono de check-in y web (literales en código), título del FAQ (i18n), alt de las fotos
(biblioteca de medios, que desaparecerá) y logos de certificaciones (externos, número fijo de 3). El editor
no tiene layout propio: hoy es el genérico, una tarjeta por bloque.

**Estado en PROD (lectura, 2026-10-16):** la fila `about` existe. No hay ninguna imagen ni logo subido (se ven
las fotos del mock), no hay grupo de FAQ asignado (la sección no aparece) y no hay imagen OG.

**Reglas (owner):**
- **Sólo se añade.** No se borra ni se renombra ningún campo de `page_content.data`. Los campos nuevos son
  **opcionales**: vacío → la página se ve como hoy (texto i18n o foto actual). La única relajación de tipo es
  `certifications.items` (ver abajo), compatible con los datos actuales.
- **Las URLs no se editan.** Los destinos de las 3 tarjetas de contacto siguen fijos por posición
  (`/{locale}/buildings`, `/owners`, `/real-estate`).
- **Por ahora sólo inglés.** Todos los textos nuevos son campos T (`tStr` / `tStrOpt`), así que el pipeline de
  traducción y las futuras pestañas EN/PT/ES/FR los recogen solos (`translatablePaths`). Todo fallback nuevo
  se añade en i18n en **en, pt, es, fr**.
- Medios e iconos se comparten entre idiomas; los textos (incluidos los alt) son por idioma.
- **Autorización:** los cambios fuera de `pages` listados abajo (`settings` + su migración, shell `src/app`,
  `messages/*`) no necesitan ADR aparte; los autoriza este spec.

## Decisiones del owner (2026-10-16)

| # | Tema | Decisión |
|---|---|---|
| 1 | SEO | Igual que el resto de páginas: `seo.meta_title`, `seo.meta_description` + imagen OG |
| 2 | Etiquetas del panel de oficina | Editables en About (campos T, preparados para traducción), fallback i18n |
| 3 | Teléfono de check-in y web | Se mueven a **Settings** (datos globales de la empresa) |
| 4 | Título del FAQ | Editable, como en Guests |
| 5 | Formulario de contacto | Como el diálogo de Guests (ver D1) |
| 6 | Alt de las fotos | Un alt editable por foto, como Welcome en Guests (la biblioteca de medios desaparecerá) |
| 7 | Logos de certificaciones | En R2. Filas que se añaden y quitan (como las preguntas de FAQ). Los 2 logos por defecto se copian ya a R2 |
| 8 | Editor | Layout por secciones en el orden de la página, como las anteriores |

**D1 — Formulario de contacto (confirmado por el owner, 2026-10-16):** en Guests lo editable del diálogo es su
**título e intro**; los campos, el consentimiento, el botón y los mensajes de éxito/error siguieron en i18n
`leads.*`, porque es el mismo formulario del header. En About el título y subtítulo del formulario **ya son
editables** (`contact.form.headline` / `subheadline`), así que este spec no añade nada más ahí.

---

## Modelo de datos: añadidos a `aboutSchema` (`src/slices/pages/schemas/about.ts`)

T = traducible (por idioma) · C = compartido entre idiomas.

| Sección | Campo | Tipo | Clase | Vacío → |
|---|---|---|---|---|
| SEO | `seo.meta_title` | `seoShape.meta_title` | T | i18n `pages.about.metaTitle` ("About Us — Central Hill") |
| SEO | `seo.meta_description` | `seoShape.meta_description` | T | i18n `pages.about.metaDescription` (el texto de hoy) |
| SEO | *(ya existe)* `og_image_media_id` (columna) | imagen | C | sin OG |
| Hero | `hero.image_alt` | tStrOpt 160 | T | i18n `pages.about.alts.hero` |
| Story | `story.image_alt` | tStrOpt 160 | T | i18n `pages.about.alts.story` |
| Organisation | `organisation.image_alt` | tStrOpt 160 | T | i18n `pages.about.alts.organisation` |
| Community | `community.image_alt` | tStrOpt 160 | T | i18n `pages.about.alts.community` |
| Certifications | `certifications.items` | **`fixed(…, 3)` → `between(…, 1, 12)`** | — | las 3 filas actuales |
| Certifications | `certifications.items[].logo_alt` | tStrOpt 160 | T | `issuer` de la fila |
| FAQ | `faq.title` | tStrOpt 160 | T | i18n `pages.faqTitle` |
| Contact | `contact.office_labels.{address, bookings, checkin, email, website}` | tStrOpt 40 c/u | T | i18n `pages.about.office.*` ("Address", "Bookings", "Check-in", "Email", "Website") |

Notas:
- Los alt van **por foto**. El orden del alt es: campo → i18n de la sección (el alt del asset de la biblioteca
  deja de usarse, porque la biblioteca desaparecerá). Los alt i18n son los alt actuales del mock, traducidos.
- Las 3 tarjetas de "Three Audiences" son fondos CSS (`PhotoFeatureGrid`, `url(...)`): no llevan `<img>` y por
  eso **no llevan alt**, igual que las tarjetas de los teasers de Guests.
- `certifications.items` pasa a número variable (mín. 1, máx. 12) con botón "+ New certification"
  (`pages.admin.addLabels.items` de esa ruta) y quitar fila. Los datos actuales (3 filas) siguen siendo
  válidos. La rejilla ya hace 3 → 2 → 1 columnas y admite más filas.
- Un logo vacío muestra el **icono** de la fila (como hoy la 3.ª, I-PRAC). Se **borran** los logos externos de
  `CERT_FALLBACK_LOGOS`: los 2 logos por defecto pasan a R2 (S4).
- La etiqueta "Office Hours" y los valores (dirección, teléfono de reservas, email, horario) siguen en
  **Settings**, que ya los tiene globales (la etiqueta del horario ya es T allí).
- `faq` va en un objeto aparte; `faq_group_key` se queda en la raíz y el editor los junta (como Guests).

## Settings: teléfono de check-in y web (`src/slices/settings`)

| Campo | Columna (`company_settings`) | Tipo | Valor inicial | Vacío → |
|---|---|---|---|---|
| Teléfono de check-in | `checkin_phone` | `text` nullable | `+351 912 310 632` | la fila "Check-in" no se pinta |
| Web | `website_url` | `text` nullable | `https://www.centralhill.pt` | la fila "Website" no se pinta |

- Migración nueva **`0018_settings_checkin_website.sql`**: `ADD COLUMN … ` + `UPDATE` con los valores actuales.
  Aditiva; no se edita ninguna migración anterior.
- Contrato: `SiteGlobals.checkinPhone` / `website`. El texto visible de la web es la URL sin `https://`.
- Editor de Settings: dos campos nuevos junto al teléfono y el email, con validación (teléfono como `phone`;
  URL `https://…`).
- ⚠️ **Orden en PROD:** la migración se aplica en la DB de PROD **antes del push** (el código nuevo lee las
  columnas). Requiere el OK del owner en ese momento.

---

## Editor: formulario sección a sección (orden de la página)

`ABOUT_LAYOUT` en `src/slices/pages/admin/layout.ts`, registrado en `LAYOUTS.about`. Ids estables; lo no
reclamado cae en "Other". `EditorCardId` suma los ids nuevos (`ABOUT_CARD_IDS`).

| # | id | Tarjeta | Contenido | Nota (sólo lectura) |
|---|---|---|---|---|
| 1 | `seo` | SEO & sharing | meta title, meta description, imagen OG | contador 70/200 |
| 2 | `hero` | Hero | foto, alt, eyebrow, título, texto de misión | — |
| 3 | `story` | How we started | eyebrow, título, 3 párrafos, foto, alt | — |
| 4 | `stats` | Company figures | 5 × número + etiqueta | "Numbers count up on the page" |
| 5 | `serve` | Three audiences | eyebrow, título, intro, 3 tarjetas (icono, título, texto, foto) | — |
| 6 | `values` | What guides us | eyebrow, título, intro, 4 valores | "Numbers 01–04 are automatic" |
| 7 | `organisation` | How we are organised | eyebrow, título, intro, etiqueta sobre la foto, foto, alt, 6 departamentos | — |
| 8 | `certifications` | Certifications | eyebrow, título, intro, filas (logo, alt, icono, título, emisor, texto) + añadir/quitar | "Without a logo the card shows its icon" |
| 9 | `community` | Giving back | eyebrow, título, 2 párrafos, foto, alt | — |
| 10 | `faq` | FAQ | grupo, título | "Questions are edited in FAQ" + enlace `/admin/faq` |
| 11 | `contact` | Let's start a conversation | eyebrow, título, 3 tarjetas (icono, título, texto, texto del enlace), título de la oficina, 5 etiquetas de la oficina, título y subtítulo del formulario | "Cards always open Buildings / Owners / Real Estate. Address, phones, email, website and hours come from Settings" + enlace `/admin/settings`. "Form fields are shared with the header contact form" |

Etiquetas legibles, `itemLabels` ("Paragraph 1", "Figure 1", "Audience 1", "Value 1", "Department 1",
"Certification 1", "Card 1") y `addLabels` en `pages.admin.*`, 4 idiomas.

### Selector de medios y hints (en inglés)

Hints con medidas exactas, medidas en la página (el agente las verifica en S2 con Playwright):

| Campo | `accept` | Hint (base; S2 ajusta a lo medido) |
|---|---|---|
| `hero.image_media_id` | `image` | "Full-bleed hero photo, cropped to fill the screen — keep the subject centred. Landscape 16:9 — 1920×1080 px (min 1600×900), JPG or WebP, under 500 KB." |
| `story` / `community` `.image_media_id` | `image` | Formato real de la celda de `IntroSplit` (en Guests resultó **3:2 horizontal**, no 4:5); se corrige el hint actual si no cuadra |
| `organisation.image_media_id` | `image` | "Portrait 4:5 — 1200×1500 px (min 960×1200), JPG or WebP, under 500 KB." (la foto se pinta `aspect-[4/5]`) |
| `serve.audiences[].image_media_id` | `image` | Medida real de la tarjeta de `PhotoFeatureGrid` (fondo con overlay oscuro, recortado al centro) |
| `certifications.items[].logo_media_id` | `image` | "Issuer logo on a transparent background, PNG or SVG. Shown about 48 px tall — upload at least 300 px wide, under 100 KB." |
| `og_image_media_id` | `image` | El de Home (1200×630) |

---

## Render público

- **SEO:** `buildAboutMetadata(locale)` en el contrato de `pages` (`seo.*` + OG, fallback i18n), con
  `seoMetadataInput`, como Owners/Guests. La ruta `src/app/[locale]/about/page.tsx` sólo lo llama.
- **Fotos:** `alt` = campo → `t("about.alts.<sección>")`, tanto con asset como con la foto de respaldo.
- **Certificaciones:** se pintan todas las filas; logo = asset de R2 (alt = `logo_alt` → `issuer`) o el icono.
- **FAQ:** `FaqSection title` = `faq.title` o `t("faqTitle")`.
- **Panel de oficina:** etiquetas = `contact.office_labels.*` → `t("about.office.*")`. Check-in y Website salen
  de `globals.checkinPhone` / `globals.website`; si están vacíos, la fila no se pinta. Se borran los literales
  `CHECKIN_PHONE` y `WEBSITE`.

**Con todos los campos nuevos vacíos, la página queda idéntica a la actual en EN.** Cambios intencionados: en
PT/ES/FR el SEO, los alt y las etiquetas de la oficina pasan a su idioma (hoy salen en inglés).

## Cambios fuera de `pages` (autorizados por este spec)

| Cambio | Dónde |
|---|---|
| Columnas `checkin_phone`, `website_url` + migración `0018` | `slices/settings/schema.ts`, `drizzle/0018_*.sql` (+ journal) |
| `SiteGlobals.checkinPhone` / `website`, campos en el editor de Settings | `slices/settings/{contract,server,admin}` |
| La ruta About llama a `buildAboutMetadata` | `src/app/[locale]/about/page.tsx` |
| Claves i18n nuevas (`pages.about.*`, `pages.admin.*`, `settings.admin.*`) en 4 idiomas | `messages/{en,pt,es,fr}.json` |

---

## Plan por sesiones

Cada sesión la implementa un agente general-purpose. Después, el coordinador revisa el diff, ejecuta
typecheck, lint y los tests (`npx tsx --test …`), y comprueba el admin real y la página pública con
Playwright headed **sin guardar**. Un commit por sesión, con el OK del owner. **Un solo push al final.**

**Política de tests (owner):** tests básicos de la superficie tocada, centrados en los inputs de medios y en
los fallbacks. Cada sesión cabe en 10–15 minutos.

**S1 — Editor por secciones + SEO + título del FAQ.**
- `ABOUT_LAYOUT` (11 tarjetas + "Other"), notas y enlaces, etiquetas, `itemLabels` (4 idiomas).
- `seo.*` + `buildAboutMetadata` + ruta; `pages.about.metaTitle` / `metaDescription` en 4 idiomas.
- `faq.title` con fallback `pages.faqTitle`.
- Tests: layout sin claves perdidas; fallbacks de SEO y FAQ (`orMessage`); `seoMetadataInput` de `/about`.

**S2 — Alt por foto + hints con medidas reales.**
- `image_alt` en hero, story, organisation y community; `pages.about.alts.*` en 4 idiomas (alt del mock).
- Medir con Playwright las celdas (hero, `IntroSplit`, showcase, tarjetas de audiencias) y dejar los hints con
  medidas exactas.
- Tests: `accept=image` de cada foto; orden del alt (campo → i18n).

**S3 — Settings (check-in y web) + etiquetas del panel de oficina.**
- Migración `0018` aditiva con los valores actuales; contrato y editor de Settings.
- `contact.office_labels.*` con fallback `pages.about.office.*` (4 idiomas); render desde Settings, fila oculta
  si vacío; borrar `CHECKIN_PHONE` / `WEBSITE`.
- Verificar que header, footer y el resto de usos de Settings quedan igual.
- La migración **no** se aplica en esta sesión: en local se prueba contra una rama/DB que la tenga, o se
  aplica en PROD con el OK del owner (ver ⚠️ arriba).
- Tests: validación de los campos nuevos de Settings; filas ocultas si vacíos; fallback de las etiquetas.

**S4 — Certificaciones: filas variables + logos en R2.**
- `between(certification, 1, 12)`, `logo_alt`, añadir/quitar filas en el editor (`addLabels`).
- Borrar `CERT_FALLBACK_LOGOS`; logo vacío → icono.
- **Carga de los logos (coordinador, autorizada por el owner el 2026-10-16):** descargar los 2 logos actuales
  (ALEP, Turismo de Portugal), subirlos por el editor real (dev local → R2 y DB de PROD) en las filas 1 y 2 con
  su alt, y guardar. Instantánea de la fila `about` antes de guardar. El código desplegado hoy ya lee
  `logo_media_id`, así que PROD los muestra en cuanto se guarda.
- Tests: `accept=image` del logo; 1–12 filas; orden del alt (campo → `issuer`).

**S5 — Cierre.**
- Recorrer `/about` en los 4 idiomas con todo vacío (salvo los logos) y comprobar que EN queda igual.
- Actualizar `pages/README.md` ("About content model"), README de `settings`, `docs/data-model.md` → about y
  settings, y este spec (estado final).
- Aplicar `0018` en PROD (con OK) si no se hizo en S3; después, el push único.

## Fuera de alcance

- Preguntas del FAQ (se editan en `/admin/faq`).
- Campos, consentimiento, botón y mensajes del formulario de contacto (`leads.*`, compartidos; ver D1).
- Número de filas fijas: cifras (5), audiencias (3), valores (4), departamentos (6), tarjetas de contacto (3).
- Arco de traducción por pestañas (EN/PT/ES/FR en el editor).
- Cambiar los destinos de las tarjetas de contacto desde el admin.

---

## Estado final (2026-10-16)

Las sesiones S1–S4 están entregadas; S5 cierra la documentación. Commits:

| Sesión | Commit | Qué entró |
|---|---|---|
| Spec | `1e27992` | Este documento: auditoría, decisiones del owner y plan por sesiones |
| S1 | `d3cb4b3` | `ABOUT_LAYOUT` (11 tarjetas + "Other"), notas y enlaces, etiquetas e `itemLabels` (4 idiomas). `listLabelKeys` + `itemLabelsByParent` en `form-model.ts` / `schema-fields.tsx`. `seo.*` + `buildAboutMetadata` (contrato); la ruta sólo lo llama. `faq.title` con fallback `pages.faqTitle` |
| S2 | `c9a3062` | `image_alt` en hero, story, organisation y community (→ i18n `pages.about.alts.*`, 4 idiomas). Hints con medidas reales (Playwright a 1440 / 1024 / 390 px); `SHOWCASE_IMG_HINT` propio para Organisation |
| S3 | `18ca04c` | Migración `0018` (`checkin_phone`, `website_url`), `SiteGlobals.checkinPhone` / `website`, campos y validación en el editor de Settings, clave de caché `GLOBALS_SHAPE`. `contact.office_labels.*` (→ `pages.about.office.*`); `ui/about-office.ts`; fuera `CHECKIN_PHONE` / `WEBSITE` |
| S4 | `21de7b1` | `certifications.items` → `between(…, 1, 12)` con añadir/quitar (`addLabelsByParent`), `logo_alt` (→ `issuer`, `ui/about-certifications.ts`), hint del logo en PNG. Borrado `CERT_FALLBACK_LOGOS`: sin logo, el icono |
| S5 | — | Documentación: `pages/README.md` ("About content model"), README de `settings`, `docs/data-model.md` → about y settings, y este cierre |

### Desviaciones y hallazgos durante la implementación

- **S1:**
  - Etiquetas de lista **por sección**: la clave `items` de About significa "Value" (`values.items`) y
    "Certification" (`certifications.items`), pero `pages.admin.itemLabels.items` ya era "Card" (Guests).
    `listLabelKeys(kind, path)` prueba primero `admin.<kind>ByParent.<padre>.<clave>` y luego la clave
    global; nuevo mapa `pages.admin.itemLabelsByParent` (4 idiomas). `useFieldLabels().item/add` reciben
    ahora la ruta completa.
  - `pages.about.metaDescription` **ya existía y no se usaba** (la ruta tenía su propio literal); se
    sobrescribió con el literal de la ruta en EN para que el fallback sea idéntico a lo que se veía.
  - Se reutilizaron los títulos de tarjeta existentes donde encajan: `seo` es "SEO & social" (no
    "SEO & sharing" como decía la tabla del spec), `hero` y `faq` también.
- **S2:**
  - Medidas tomadas: el hero es una franja de **1440×576** (portátil), **1024×576** (tablet) y
    **390×630** (móvil), siempre recortada → hint 16:9, 1920×1080.
  - La celda de `IntroSplit` mide **~536 px** de ancho en escritorio y su alto es el mayor entre el
    texto y la propia foto, así que una foto **4:5** se ve sin recortar: el hint recomienda **4:5, no
    3:2** (al revés que en Guests, donde el texto es más corto).
  - Organisation usa su propio `SHOWCASE_IMG_HINT`: marco fijo 4:5 (560×700 escritorio, 334×418 móvil).
  - Tarjetas de audiencias: ~377×287 / 305×333 / 334×300, recorte centrado → hint **4:3**, 1200×900.
  - El alt es **campo → i18n `pages.about.alts.*`**, con asset y con la foto de respaldo. El alt de la
    biblioteca de medios **ya no se lee**.
- **S3:**
  - La migración `0018` usa `ADD COLUMN IF NOT EXISTS` y un `UPDATE` con **`COALESCE`**: se puede
    reejecutar sin pisar un valor ya puesto.
  - **`0018` se aplicó en PROD el 2026-10-16** (coordinador, con OK del owner), **antes del push**.
  - Nueva clave de caché `GLOBALS_SHAPE = "v2"` en `getGlobals`, para no servir una entrada cacheada
    antes de que existieran los campos nuevos.
  - **Sin fila de settings, las filas Check-in y Website no se pintan** (no usan `DEFAULT_GLOBALS`);
    dirección, teléfono de reservas, email y horario siguen cayendo a los literales del mock.
- **S4:**
  - El pipeline de subida **no acepta SVG** (`core/media/mime.ts` → `IMAGE_MIMES`: JPEG, PNG, WebP,
    AVIF), así que el hint pide **PNG** transparente (no "PNG o SVG" como decía el spec).
  - **Carga de logos (coordinador, 2026-10-16, por el admin real → R2 y DB de PROD):**
    - ALEP: asset `f2f7bfed-3fcb-4f87-889b-bbc989ce432e`, PNG 685×616.
    - Turismo de Portugal: asset `1bae9d7a-2b1f-4c73-82c7-258802b89044`, PNG 202×70 — **por debajo de
      los 300 px recomendados**; es el original de la fuente.
    - Van en las filas 1 y 2 con sus alt originales. La fila 3 (I-PRAC) muestra su icono.
    - El diff contra la instantánea previa al guardado mostró **sólo** los logos y las claves nuevas
      vacías.

### Verificación hecha

- **Tests por sesión** (`pages/tests/pages-admin.test.ts`, `pages/tests/pages.test.ts`,
  `settings/tests/settings.test.ts`, `settings/tests/settings-admin.test.ts`): layout de 11 ids sin
  claves perdidas, orden de `listLabelKeys`, claves de layout y etiquetas en 4 idiomas; `seo` / `faq`
  opcionales y traducibles, meta EN = literales anteriores, `seoMetadataInput` de `/about`; `accept=image`
  de cada foto y del logo; orden del alt (campo → i18n; `logo_alt` → `issuer`); `office_labels`
  opcionales con fallback i18n; filas Check-in / Website ocultas si vacías; validación del teléfono de
  check-in y de la web `https://`; 1–12 certificaciones con las 3 filas actuales válidas; ningún logo
  externo en la página.
- **Revisión del coordinador en cada sesión**: diff, typecheck + lint + tests, y el admin real y la
  página pública en Playwright headed **sin guardar** (salvo el guardado autorizado de los logos en S4).
- **Escrituras en PROD, ambas con OK del owner el 2026-10-16:** la migración `0018` (S3) y el guardado
  de la fila `about` con los 2 logos (S4).
- **Recorrido S5 (2026-10-16, Playwright, 1440 y 390 px, en/pt/es/fr):** las 8 combinaciones dan 200, sin
  errores de consola, sin imágenes rotas y sin scroll horizontal. Título SEO traducido por idioma; etiquetas
  de la oficina traducidas (Morada / Dirección / Adresse…); los 2 logos salen de R2 con su alt; I-PRAC muestra
  su icono. "Office Hours" sigue en EN en PT/ES/FR porque la etiqueta viene de Settings (`office_hours_label`
  sin traducir) y el contenido de la DB ("Get in Touch", textos) sale en EN hasta el arco de pestañas.

## Abiertos (para decidir después)

1. **Logo de Turismo de Portugal más grande**: el actual mide 202×70, por debajo de los 300 px del hint.
   Se sustituye desde el editor cuando haya uno mejor.
2. **FAQ sin grupo en PROD**: la sección no aparece en `/about` hasta que se elija un grupo en el editor.
3. **Sin fotos subidas**: hero, story, organisation, community y audiencias siguen con las fotos del mock
   (fallback); tampoco hay imagen OG.
4. **Arco de traducción por pestañas** (`home-admin-editor.md` → "Modelo de traducción por pestañas").
   Hasta entonces el contenido de la DB sale en EN en PT/ES/FR.
5. **Auditoría de Services sigue aparcada** (el owner está replanteando etiquetas por servicio vs.
   globales); es la siguiente página del arco cuando se retome.
