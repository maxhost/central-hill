# Spec + plan — Admin Buildings (listado) editable sección a sección

**Fecha:** 2026-10-11 · **Slices:** `pages` (datos + editor + secciones) y `buildings` (composición del listado) · **Estado:** spec aprobado, sin implementar
**Precedentes:** `docs/specs/home-admin-editor.md`, `docs/specs/owners-admin-editor.md` (mismo proceso, mismas piezas reutilizables)

## Objetivo

Que **todo** lo visible de `/[locale]/buildings` (el listado; no el detalle `/buildings/[slug]`) se pueda
editar desde **`/admin/pages/buildings`**: SEO, hero, panel "For Owners", banda de cifras y calculadora de
ganancias. Quedan fuera las **tarjetas de edificios** (catálogo, se editan en `/admin/buildings`) y los
**labels y placeholders del formulario de estimación** (fijos y traducidos en `pages.estimateForm.*`, como en
Owners). El formulario del editor sigue el orden de la página, sección a sección.

**Hoy la página no tiene fila `page_content`:** todo son literales en
`src/slices/buildings/ui/buildings-listing.tsx` y en la ruta `src/app/[locale]/buildings/page.tsx`.

**Reglas (owner, igual que Home/Owners):**
- **Sólo se añade.** Clave nueva `buildings` en `page_content`. Todos los campos de texto son **opcionales**: vacío →
  el texto de hoy (i18n `pages.buildings.*`, EN = literal actual). Con todo vacío la página queda idéntica en EN.
- **Las URLs no se editan.** El CTA del panel Owners sigue yendo a `#estimate`.
- **Por ahora sólo inglés.** Un campo relleno se muestra en los 4 idiomas hasta el arco de pestañas
  (`home-admin-editor.md` → "Modelo de traducción por pestañas"). Un campo vacío sale traducido (i18n).
- **Medios compartidos entre idiomas.** La foto de la calculadora admite imagen, WebP animado, MP4/WebM y Lottie,
  como el pitch de Home y services/dashboard de Owners.
- **Autorización:** los cambios fuera de `pages` listados abajo (slice `buildings`, ruta `src/app`, `messages/*`)
  no necesitan ADR aparte; los autoriza este spec.

## Cómo se publica

`savePage` → `revalidatePage("buildings")` invalida `page:buildings` y revalida `/{locale}/buildings` en los 4
idiomas (no es `SECTION_KEYS`: el detalle de cada edificio no muestra nada de esta fila).

---

## Modelo de datos: `buildingsSchema` (`src/slices/pages/schemas/buildings.ts`, nuevo)

**T** = texto por idioma · **C** = compartido entre idiomas.

| Sección | Campo | Tipo | Clase | Vacío → |
|---|---|---|---|---|
| SEO | `seo.meta_title` | `seoShape.meta_title` | T | i18n `pages.buildings.metaTitle` ("Buildings — Central Hill") |
| SEO | `seo.meta_description` | `seoShape.meta_description` | T | i18n `pages.buildings.metaDescription` (EN = texto actual de la ruta) |
| SEO | `og_image_media_id` (columna existente) | imagen | C | sin OG |
| Hero | `hero.image_media_id` | `optionalImage` 16:9 | C | foto Unsplash actual (`HERO_IMG`) |
| Hero | `hero.eyebrow` | tStrOpt 60 | T | `pages.buildings.heroEyebrow` ("Lisbon · Portugal") |
| Hero | `hero.headline` | tStrOpt 160 | T | `pages.buildings.heroTitle` ("Strategic Properties in Prime Locations") |
| Hero | `hero.copy` | tStrOpt 600 | T | `pages.buildings.heroCopy` |
| Hero | `hero.contact.label` | tStrOpt 40 | T | `pages.owners.contactLabel` ("Contact Us", ya existe) |
| Hero | `hero.contact.title` | tStrOpt 80 | T | `pages.owners.contactTitle` ("Contact us") |
| Hero | `hero.contact.intro` | tStrOpt 280 | T | `pages.owners.contactIntro` |
| Panel Owners | `owner_panel.eyebrow` | tStrOpt 60 | T | `pages.buildings.ownerEyebrow` ("For Owners") |
| Panel Owners | `owner_panel.title` | tStrOpt 160 | T | `pages.buildings.ownerTitle` |
| Panel Owners | `owner_panel.body` | tStrOpt 400 | T | `pages.buildings.ownerBody` |
| Panel Owners | `owner_panel.cta_label` | tStrOpt 80 | T | `pages.buildings.ownerCta` ("Get Your Free Earnings Estimate →") |
| Panel Owners | `owner_panel.contact_line` | tStrOpt 200 | T | se construye desde Settings con "Call {phone}" (`ownersFinalContactLine`, igual que el CTA final de Owners) |
| Cifras | `stats.title` | tStrOpt 160 | T | `pages.buildings.statsTitle` ("Numbers That Speak for Themselves") |
| Cifras | `stats.figures` | `between(buildingsFigure, 0, 8)` | número C · `label`/`description` T | 0 filas → no se pinta la banda (título incluido) |
| Calculadora | `calculator.badge` | tStrOpt 60 | T | `pages.buildings.calcBadge` ("Earn +25%") |
| Calculadora | `calculator.headline` | tStrOpt 160 | T | `pages.buildings.calcTitle` |
| Calculadora | `calculator.subheadline` | tStrOpt 280 | T | `pages.buildings.calcSubtitle` |
| Calculadora | `calculator.cta_label` | tStrOpt 80 | T | `pages.buildings.calcCta` ("Calculate My Earnings") |
| Calculadora · paso 2 | `calculator.contact_step.{title, lede, submit_label, back_label}` | igual que Owners | T | `pages.estimateForm.*` |
| Calculadora · paso 3 | `calculator.done_step.{title, body}` | igual que Owners | T | `pages.estimateForm.*` |
| Calculadora | `calculator.media_media_id` | `optionalAnimated` 4:5 | C | foto Pexels actual (`CALC_FALLBACK_IMG`) |

Notas:
- **`buildingsFigure`** = `statFigure.extend({ description: tStrOpt({ max: 120 }) })` (local en `schemas/buildings.ts`;
  `statFigure` de `_shared.ts` no se toca). Es la segunda línea bajo la etiqueta que hoy pinta esta banda.
- **Los subesquemas `contact_step` / `done_step`** se reutilizan de Owners (se extraen a `_shared.ts` sin cambiar
  su forma, o se importan desde `owners.ts`; el agente elige lo menos invasivo).
- **`defaultBuildings`** (en el mismo archivo): los textos vacíos y las 3 cifras actuales:
  `400000` + "+" agrupado / "Bookings Completed" / "Across all managed properties"; `12` + "+" / "Years of Experience" /
  "Optimizing owner returns in Portugal"; "€" + `55` + "M+" / "Revenue Generated" / "For our property owners".
  Lo usan la migración, el render cuando no hay fila y los tests.
- **Registro:** `pageKey` y `pageSchemas` / `translatablePathsByPage` (`schemas/index.ts`), el tipo de `key` en
  `schema.ts` (es `text`, sin enum en la DB), `PAGE_PATH.buildings = "buildings"` en `server/publish.ts`.
- **Migración `drizzle/0017_pages_buildings_row.sql`** (sólo datos, como la 0016): inserta la fila `buildings` con
  `defaultBuildings` y `ON CONFLICT DO NOTHING`. Hace falta para que el editor abra con las 3 cifras: sin fila,
  `applyDefaults` mostraría 0 cifras y el primer guardado ocultaría la banda.
- Las claves i18n `buildings.title` / `intro` / `metaTitle` / `metaDescription` existentes (no usadas) no se
  tocan: sólo se añade.

---

## Editor: formulario sección a sección

`BUILDINGS_LAYOUT` en `src/slices/pages/admin/layout.ts`, registrado en `LAYOUTS.buildings`. Ids estables.
`EditorCardId` gana `BUILDINGS_CARD_IDS`. La página aparece en `/admin/pages` (lista de `PAGE_KEYS`).

| # | id | Tarjeta | Contenido | Nota (sólo lectura) |
|---|---|---|---|---|
| 1 | `seo` | SEO & sharing | meta title, meta description, imagen OG | contador 70/200 |
| 2 | `hero` | Hero | imagen, eyebrow, título, texto, botón Contact (texto, título e intro del modal) | — |
| — | `buildings_grid` (info) | Buildings | — | "The building cards come from Buildings" + enlace `/admin/buildings` |
| 3 | `owner_panel` | For owners panel | eyebrow, título, texto, botón, línea de contacto | "The button scrolls to the earnings calculator. Leave the contact line blank to build it from Settings" + enlace a Settings |
| 4 | `stats` | Figures | título, lista 0–8 con "+ New figure" (número, prefijo, sufijo, separador, etiqueta, descripción) | "Without figures the band is hidden" |
| 5 | `calculator` | Earnings calculator | badge, título, subtítulo, botón (paso 1); título, texto, enviar, volver (paso 2); título, texto (paso 3); foto/vídeo/animación | "Field labels, placeholders and checkboxes are fixed and translated automatically. The form doesn't send leads yet." |

Etiquetas legibles (`pages.admin.labels`, 4 idiomas) para las claves nuevas que salgan crudas (`owner_panel`,
`calculator`, `media_media_id`, `description`, …) + `itemLabels` / `addLabels` de `figures` (reutilizar los de Home).

### Hints de medios (en inglés)

| Campo | `accept` | Hint |
|---|---|---|
| `hero.image_media_id` | `image` | El de Owners: "Full-bleed hero background (a dark overlay is applied). Landscape 16:9 — 1920×1080 px (min 1600×900), JPG or WebP, under 500 KB." |
| `calculator.media_media_id` | `animated` | El del pitch de Home / services de Owners (4:5: foto 1200×1500, MP4 H.264 sin audio 6–15 s < 10 MB, WebP animado < 5 MB, Lottie lienzo 4:5) |
| `og_image_media_id` | `image` | El de Home (1200×630) |

---

## Render público

Las secciones editables pasan al slice `pages` y se exportan por su **contrato** (como ya se hace con
`OwnerEstimateForm`). `buildings-listing.tsx` sólo compone: hero → grid (sigue en `buildings`) → panel → cifras →
calculadora.

- **`pages/contract.ts`** exporta:
  - `getBuildingsPage(locale)` (lee `page:buildings`, parsea con `buildingsSchema`, cae a `defaultBuildings`);
  - componentes servidor `BuildingsHero`, `BuildingsOwnerPanel`, `BuildingsStats`, `BuildingsCalculator`
    (en `pages/ui/components/buildings-sections.tsx` o similar), que reciben el contenido ya leído + `locale`;
  - `buildBuildingsMetadata(locale)` (con `seoMetadataInput`, canonical `/{locale}/buildings` + hreflang como hoy).
- **Hero:** `Hero` con las mismas clases que hoy; fondo `MediaImage` o la foto Unsplash; textos `orMessage(campo, i18n)`;
  `ContactDialog` con label/title/intro = campo o i18n. `source="buildings-hero"` se mantiene.
- **Panel Owners:** `FeaturePanel` con `cta.href = "#estimate"` fijo; línea de contacto =
  `ownersFinalContactLine(campo, settings, "Call {phone}")`. En EN debe salir idéntica al literal actual.
- **Cifras:** `StatBand` con `title`, celdas = `statFigureCells` + `description`, `columns = statBandColumns(n)`
  (3 cifras → 3 columnas, como hoy). 0 cifras → no se pinta.
- **Calculadora:** `OwnerEstimateForm` con badge/título/subtítulo/botón = campo o i18n y los overrides de los pasos 2 y 3.
  Foto con `side-media.tsx` (imagen / vídeo / WebP animado / Lottie según el mime) en el marco 4:5 actual; sin asset →
  foto Pexels. `id="estimate"` se mantiene.
- **Ruta:** `src/app/[locale]/buildings/page.tsx` llama a `buildBuildingsMetadata`. Se corrige el comentario obsoleto
  "Content is the embedded mock (no DB)". `revalidate = 3600` se queda.

**Con todos los campos vacíos, `/en/buildings` queda idéntica a la actual.** En PT/ES/FR los textos fijos
(hero, panel, cifras, calculadora, SEO) pasan a salir traducidos — cambio intencionado, cierra el abierto nº 2 de Owners.

## Cambios fuera de `pages` (autorizados por este spec)

| Cambio | Dónde |
|---|---|
| El listado compone las secciones del contrato de `pages`; se borran los literales y constantes (`HERO_IMG`, `CALC_FALLBACK_IMG`… pasan a `pages`) | `src/slices/buildings/ui/buildings-listing.tsx` |
| La ruta llama a `buildBuildingsMetadata` | `src/app/[locale]/buildings/page.tsx` |
| Migración de datos (fila `buildings`) | `drizzle/0017_pages_buildings_row.sql` + journal |
| Claves i18n nuevas (`pages.buildings.*`, `pages.admin.*`) en 4 idiomas | `messages/{en,pt,es,fr}.json` |

---

## Plan por sesiones

Un agente general-purpose por sesión. Después, el coordinador revisa el diff, ejecuta typecheck, lint y tests
**comprobando él mismo el exit code**, y mira el admin real y la página pública con Playwright headed **sin guardar**.
Cada commit necesita el OK del owner. El push, sólo cuando se pida.

**Política de tests:** básicos sobre la superficie tocada, centrados en los inputs de medios y en los fallbacks.
Cada sesión cabe en 10–15 minutos.

**S1 — Datos + editor.**
- `schemas/buildings.ts` (`buildingsSchema`, `buildingsFigure`, `defaultBuildings`, hints) y registro de la clave
  (`schemas/index.ts`, `schema.ts`, `publish.ts`).
- Migración 0017 (sólo datos) + entrada del journal; `pnpm db:check` verde. **No se ejecuta contra la DB** (PROD).
- `BUILDINGS_LAYOUT` con las 5 tarjetas + info del grid + "Other"; etiquetas, `itemLabels`/`addLabels` (4 idiomas).
- Tests: schema valida `defaultBuildings`, vacío y relleno; `accept` de hero (`image`) y calculadora (`animated`);
  layout sin claves perdidas.

**S2 — Render + SEO.**
- `getBuildingsPage`, `buildBuildingsMetadata`, las 4 secciones en `pages` y su export en el contrato.
- `buildings-listing.tsx` compone; la ruta usa el metadata. Claves `pages.buildings.*` en 4 idiomas (EN = literales).
- Línea de contacto desde Settings; cifras con `description` y `statBandColumns`; foto de la calculadora con `side-media`.
- Tests: fallbacks (`orMessage`), línea de contacto (campo gana / vacío → Settings), `seoMetadataInput`, cifras → celdas.

**S3 — Cierre.**
- Recorrido `/{en,pt,es,fr}/buildings` con la fila por defecto (EN idéntico al actual; PT/ES/FR traducido).
- Con el OK del owner: aplicar la migración 0017 en PROD (`pnpm db:migrate`), y la prueba real (instantánea → rellenar
  campos + subir un WebM a la calculadora → guardar → verificar → restaurar fila y borrar el asset → reiniciar el dev server).
- Actualizar `pages/README.md`, `buildings/README.md`, `docs/data-model.md` (página `buildings`) y este spec (estado final).

## Post-deploy

- Ejecutar la migración 0017 en PROD **antes o junto** al deploy (si el código llega sin la fila, la página se ve igual
  — usa `defaultBuildings` — pero el editor abriría sin cifras).

## Fuera de alcance

- Tarjetas de edificios y la página de detalle `/buildings/[slug]`.
- Filtro de ubicación (oculto por dirección del cliente).
- Envío real de leads del formulario; labels y placeholders del formulario (fijos, traducidos).
- Arco de traducción por pestañas.
- `alt` de las fotos de respaldo y aria-labels en inglés (como en Owners, abierto nº 8).

## Decisiones (owner, 2026-10-11)

0. SEO editable desde `/admin/pages/buildings`.
1. Hero: todo editable (imagen, eyebrow, título, texto, botón y modal de contacto).
3. Panel "For Owners": todo editable (la línea de contacto también; vacía → Settings). La URL del botón sigue fija.
4. Cifras: editables como en Home (título + 0–8 filas), con la descripción de cada cifra.
5. Calculadora: todo editable (pasos 1–3) y la foto admite imagen, WebP animado y MP4 (y Lottie), como Home y Owners.

**Decididas por el coordinador (revisables):** la imagen del hero es sólo foto (como Owners; Home usa vídeo en su
hero, se puede añadir después); la línea de contacto vacía usa el formato "Call {phone}" de Owners, que es el que hoy
se ve literal; la fila se crea por migración para que las cifras no se pierdan en el primer guardado.
