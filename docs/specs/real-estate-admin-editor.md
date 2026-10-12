# Spec + plan — Admin Real Estate editable sección a sección

**Fecha:** 2026-10-11 · **Slice principal:** `pages` · **Estado:** completado (S1–S7, 2026-10-11)
**Precedentes:** `docs/specs/home-admin-editor.md`, `docs/specs/owners-admin-editor.md` (mismo proceso, mismas
piezas reutilizables: `admin_hidden`, `side-media.tsx`, `contact-line.ts`, `seoMetadataInput`, `orMessage`)

## Objetivo

Que **todo** lo visible de `/[locale]/real-estate` (textos, botones, imágenes, vídeos, el PDF del capability
statement y el SEO) se pueda editar desde `/admin/pages/real_estate`, salvo:
- los componentes de catálogo (preguntas del FAQ, que siguen en `/admin/faq`);
- los **campos del formulario de enquiry** (labels, placeholders y opciones), que pasan a i18n fijo en los 4 idiomas.

El formulario del admin debe **seguir el orden de la página, sección a sección**, como en Home y Owners. Todo
lo que hoy está en inglés fijo y sigue sin editarse (alts de respaldo, formulario, submenú del header) pasa a i18n
en **EN/PT/ES/FR**, para dejarlo listo para el arco de traducción.

**Reglas (owner, las mismas que en Owners):**
- **Sólo se añade.** No se borra ni se renombra ningún campo de `page_content.data`. Los campos nuevos son
  **opcionales**: si se dejan vacíos, la página se ve como hoy. No hace falta migración (`data` es jsonb y
  `applyDefaults` rellena las claves que falten).
- **Las URLs no se editan ni se muestran.** Los botones siguen apuntando a sus anclas (`#deal-enquiry`,
  `#deal-structures`). Las URLs guardadas se ocultan con `admin_hidden` y conservan su valor.
- **Por ahora sólo inglés en el editor.** Un campo vacío usa el texto i18n, que ya existe o se añade en los 4
  idiomas. Un campo relleno se muestra en todos los idiomas hasta que exista el arco de traducción por pestañas
  (`home-admin-editor.md` → "Modelo de traducción por pestañas").
- **Autorización:** los cambios fuera de `pages` listados abajo (`core/media`, `backoffice`, `settings`, shell
  `src/app`) no necesitan ADR aparte; los autoriza este spec.

## Cómo se publica

Igual que Owners: `savePage` → `revalidatePage("real_estate")` invalida `page:real_estate` y revalida
`/{locale}/real-estate` en los 4 idiomas. Sólo el **código** de este spec necesita deploy. Excepción: el submenú
del header vive en el layout, así que también se regenera con el deploy.

---

## Auditoría (punto de partida, 2026-10-11)

Leyenda: ✅ editable · 🔒 i18n fijo · 🔗 otro slice/Settings · ⚙️ hardcodeado · 👻 está en el schema pero la web no lo usa

| Sección | Hoy | Problema |
|---|---|---|
| Editor | sin layout propio (una card por clave raíz) | sin card de SEO / OG; URLs 👻 visibles |
| SEO | ⚙️ title/description EN en la ruta | `pages.realEstate.metaTitle` / `metaDescription` existen pero están muertas |
| Hero | ✅ textos e imagen | imagen sin hint; alt de respaldo ⚙️ EN; `cta_*.url` 👻; el CTA 2 apunta a `capability_statement_media_id` pero **el uploader no acepta PDF** |
| Partners | ✅ | `cta_*.url` 👻; `cta_secondary.note` 👻 |
| Capabilities / Asset Types | ✅ | sólo foto; alts ⚙️ EN; `cta.url` 👻 |
| Deal Structures / Market / Track Record / Process | ✅ todo | `pages.realEstate.featuredModel` muerta |
| FAQ | grupo ✅, preguntas 🔗 | título 🔒 `faqTitle` |
| Enquiry | ⚙️ **todo en EN fijo en los 4 idiomas** | contacto con email `realestate@…` y LinkedIn `href="#"`; el form no envía |
| Submenú del header | ⚙️ 10 labels EN en `settings/ui/site-header.tsx` | no se traducen |

---

## Campos ocultos en el editor

Mismo mecanismo que Owners (`schemas/admin-hidden.ts`). Variante local `realEstateCta = ctaWithNote.extend({ url: … admin_hidden })`
y lo mismo para el `{ label, url }` del hero.

| Campo | Motivo |
|---|---|
| `hero.cta_primary.url`, `hero.cta_secondary.url` | URLs (el render usa `#deal-enquiry` / el PDF) |
| `partners.cta_primary.url`, `partners.cta_secondary.url` | URLs (`#deal-enquiry` / `#deal-structures`) |
| `partners.cta_secondary.note` | Nunca se pinta (`EditorialSplit` sólo tiene una nota, la del CTA principal) |
| `capabilities.cta.url`, `asset_management.cta.url` | URLs (`#deal-enquiry`) |

---

## Modelo de datos: añadidos a `realEstateSchema` (`src/slices/pages/schemas/real-estate.ts`)

**T** = texto por idioma · **C** = compartido entre idiomas.

| Sección | Campo | Tipo | Clase | Vacío → |
|---|---|---|---|---|
| SEO | `seo.meta_title` | `seoShape.meta_title` | T | i18n `pages.realEstate.metaTitle` (EN se alinea con el title actual de la ruta: "Real Estate Partnerships — Central Hill") |
| SEO | `seo.meta_description` | `seoShape.meta_description` | T | i18n `pages.realEstate.metaDescription` (EN se alinea con la description actual de la ruta) |
| SEO | *(ya existe)* `og_image_media_id` (columna) | imagen | C | sin OG |
| Hero | `hero.image_media_id` | **pasa a opcional** (`"" \| uuid`) + hint | C | foto Unsplash actual |
| Hero | `hero.capability_statement_media_id` | **acepta PDF** (accept `document`) + hint | C | el botón va a `#deal-enquiry` (como hoy) |
| Capabilities | `capabilities.image_media_id` | **`optionalAnimated`** (imagen, WebP animado, MP4/WebM, Lottie) | C | foto Unsplash actual |
| Asset Types | `asset_management.image_media_id` | **`optionalAnimated`** | C | foto Unsplash actual |
| Deal Structures | *(ya existe)* `models[].feature_label` | — | T | si `featured` y está vacío → i18n `pages.realEstate.featuredModel` ("Recommended"). Hoy vacío = sin badge; en PROD el card destacado tiene "Most Flexible", así que no cambia nada visible |
| FAQ | `faq.title` | tStrOpt 160 | T | i18n `pages.realEstate.faqTitle` |
| Enquiry | `deal_enquiry.headline` | tStrOpt 160 | T | i18n `pages.realEstate.enquiryTitle` ("Ready to Explore a Partnership?") |
| Enquiry | `deal_enquiry.lede` | tStrOpt 600 | T | i18n `pages.realEstate.enquiryLede` |
| Enquiry | `deal_enquiry.contact_title` | tStrOpt 120 | T | i18n `pages.realEstate.enquiryContactTitle` ("Contact Our Institutional Team Directly") |
| Enquiry | `deal_enquiry.submit_label` | tStrOpt 80 | T | i18n `pages.dealEnquiryForm.submit` ("Submit Partnership Enquiry") |
| Enquiry | `deal_enquiry.note` | tStrOpt 200 | T | i18n `pages.dealEnquiryForm.note` |

Notas:
- `faq_group_key` se queda en la raíz; `faq.title` va en un objeto aparte y el editor los junta en su tarjeta.
- **Alts de respaldo** (`HERO_FALLBACK_ALT`, `CAP_FALLBACK_ALT`, `ASSET_FALLBACK_ALT`) → i18n
  `pages.realEstate.{heroAlt, capabilitiesAlt, assetsAlt}` en 4 idiomas. Sólo se usan mientras no hay asset;
  el alt de un asset subido sigue siendo el del `media_asset`.
- `hero.image_media_id` opcional es una relajación compatible: el id sembrado sin asset ya cae a la foto.

### Formulario de enquiry: i18n fijo (decisión del owner)

Todo lo del formulario pasa a `pages.dealEnquiryForm.*` en los 4 idiomas y **no se edita** en el admin:
- títulos de grupo ("Organisation Details", "Asset Details", "Additional Information") y sus tags ("Required", "Optional");
- los ~12 labels y placeholders;
- las opciones de los 3 selects.

**Preparado para traducir y para el futuro envío:** cada opción tiene un **valor estable en inglés** (`value`:
`apartments`, `apart_hotel`, `hotel`, `mixed`, `corporate_housing`; `operating`, `in_development`,
`acquisition`; `fixed_rent`, `management_commission`, `hybrid`, `open`) y sólo la etiqueta visible se traduce.
Así, cuando el form envíe a leads, el valor guardado no depende del idioma. `FormSelect` (`core/ui`) gana
opciones `{ value, label }` de forma aditiva (string sigue funcionando).

Los `id` / `name` de los campos no cambian (el ancla `#deal-enquiry` tampoco). **El form sigue sin enviar**
(decisión del owner); conectarlo a leads queda fuera de alcance.

### Contacto del enquiry: desde Settings (decisión del owner)

Las tres líneas salen del singleton `company_settings`:

| Línea | Fuente | Label (i18n fijo) |
|---|---|---|
| Email | `settings.email` → `mailto:` | `pages.realEstate.contactEmail` ("Email:") |
| Tel | `settings.phone` → `tel:` (sin espacios) | `pages.realEstate.contactPhone` ("Tel:") |
| LinkedIn | `settings.social.linkedin` (texto "Central Hill Apartments" → i18n `contactLinkedinText`) | `pages.realEstate.contactLinkedin` ("LinkedIn:") |

Una línea cuyo dato no existe en Settings no se pinta. **Cambio visible aceptado:** el email pasa de
`realestate@centralhillapartments.com` a `info@centralhill.pt` (el de Settings en PROD), y LinkedIn deja de ser
`#` y enlaza a `https://linkedin.com/company/centralhill`. El teléfono es el mismo.

---

## Editor: formulario sección a sección (orden de la página)

`REAL_ESTATE_LAYOUT` en `src/slices/pages/admin/layout.ts`, registrado en `LAYOUTS.real_estate`. Los ids son
estables (serán la unidad del futuro "Traducir con IA"). Cualquier clave no reclamada cae en "Other".
`EditorCardId` suma los ids de Real Estate.

| # | id | Tarjeta | Contenido | Nota (sólo lectura) |
|---|---|---|---|---|
| 1 | `seo` | SEO & sharing | meta title, meta description, imagen OG | contador 70/200 |
| 2 | `hero` | Hero | imagen, eyebrow, título, texto, botón 1 (texto), botón 2 (texto) + PDF | "Button 2 downloads the PDF; without a PDF it scrolls to the enquiry form" |
| 3 | `partners` | Built for institutional partners | título, subtítulo, 4 beneficios, botón principal (texto + nota), botón secundario (texto) | — |
| 4 | `capabilities` | Institutional-grade management | título, subtítulo, 3 beneficios, botón (texto + nota/badge), imagen o animación | hint 4:5 |
| 5 | `asset_management` | Asset types | como `capabilities`, 6 beneficios | hint 4:5 |
| 6 | `deal_structures` | Deal structures | título, subtítulo, 3 modelos, nota legal | "A featured card without a badge text shows “Recommended”" |
| 7 | `market` | Why Portugal | como hoy | — |
| 8 | `track_record` | Track record | como hoy | — |
| 9 | `process` | Process | como hoy | "Step numbers follow the order" |
| 10 | `faq` | FAQ | grupo, título | "Questions are edited in FAQ" + enlace `/admin/faq` |
| 11 | `deal_enquiry` | Enquiry | título, texto, título del contacto, botón, nota | "Email, phone and LinkedIn come from Settings" + enlace; "Form fields are fixed and translated automatically. The form doesn't send enquiries yet." |

**Etiquetas legibles** (`pages.admin.labels`, 4 idiomas) para las claves que hoy salen crudas, entre otras:
`partners`, `capabilities`, `asset_management`, `deal_structures`, `models`, `tagline`, `featured`,
`feature_label`, `points`, `market`, `fundamentals`, `regulatory`, `thesis`, `track_record`, `tiles`,
`caption`, `process`, `positioning`, `capability_statement_media_id`, `deal_enquiry`, `contact_title`.
Más `itemLabels` / `addLabels` para models ("Model"), points ("Point"), tiles ("Tile"), steps ("Step"),
benefits ("Benefit").

### Selector de medios y hints (en inglés, como el resto del admin)

| Campo | `accept` | Hint |
|---|---|---|
| `hero.image_media_id` | `image` | El del hero de Owners: "Full-bleed hero background (a dark overlay is applied). Landscape 16:9 — 1920×1080 px (min 1600×900), JPG or WebP, under 500 KB." |
| `hero.capability_statement_media_id` | **`document`** (nuevo) | "Capability statement downloaded by hero button 2. PDF, under 20 MB. Leave blank and the button scrolls to the enquiry form." |
| `capabilities.image_media_id`, `asset_management.image_media_id` | `animated` | El 4:5 del pitch de Home / services de Owners (foto, MP4, WebP animado, Lottie) |
| `og_image_media_id` | `image` | El de Home (1200×630) |

---

## Render público

- **SEO:** `buildRealEstateMetadata(locale)` en el contrato (`server/metadata.ts`, mismo patrón que
  `buildOwnersMetadata` con `seoMetadataInput`). `src/app/[locale]/real-estate/page.tsx` sólo lo llama. Se quita
  el comentario obsoleto "Content is the embedded mock (no DB)".
- **Hero:** el botón 2 enlaza al PDF (`media.url`, `target="_blank"`, `rel="noopener"`) si hay asset; si no, a
  `#deal-enquiry` (como hoy). Alt de respaldo desde i18n.
- **Capabilities / Asset Types:** `sideMedia()` (`ui/components/side-media.tsx`) elige `<img>` / `<video>` /
  Lottie por `mime`. Sin asset → foto de respaldo con alt i18n.
- **Deal Structures:** `featureLabel = m.feature_label || (m.featured ? t("realEstate.featuredModel") : "")`.
- **FAQ:** `FaqSection title = orMessage(faq.title, t("realEstate.faqTitle"))`.
- **Enquiry:** `DealEnquirySection` recibe por props los textos editables (con i18n por defecto) y el contacto
  construido desde Settings; lee lo fijo con `getTranslations("pages.dealEnquiryForm")`. Sigue sin enviar.
- **Submenú del header:** `REAL_ESTATE_SECTIONS` pasa a claves `settings.subnav.realEstate.*` en 4 idiomas
  (mismo texto EN; se corrige "Portugal- Market Opportunity" → "Portugal Market Opportunity"). Hrefs sin cambios.

**Con todos los campos vacíos, la página queda idéntica a la actual en EN**, salvo dos cambios intencionados:
el contacto del enquiry sale de Settings (email `info@…` y LinkedIn real) y el `-` del submenú. En PT/ES/FR pasan
a salir traducidos: SEO, alts de respaldo, título del FAQ, todo el enquiry y el submenú.

## Cambios fuera de `pages` (autorizados por este spec)

| Cambio | Dónde |
|---|---|
| Tipo de medio `document` (`application/pdf`): `DOCUMENT_MIMES`, `mediaKind` "document", límite de tamaño, comprobación `%PDF-` al finalizar, sin sharp ni dimensiones | `core/media/mime.ts`, `core/media/server/ingest.ts` |
| `MEDIA_FIELD_ACCEPT.document` + icono/nombre de archivo en vez de miniatura en `MediaField` | `slices/backoffice/ui/media-accept.ts`, `media-field.tsx` |
| `MEDIA_ACCEPTS` gana `"document"` | `slices/pages/schemas/media-accept.ts` |
| `FormSelect`: opciones `{ value, label }` además de string (aditivo) | `core/ui/form-card.tsx` |
| Submenú Real Estate → i18n | `slices/settings/ui/site-header.tsx` + `messages/*` (`settings.subnav.realEstate.*`) |
| La ruta llama a `buildRealEstateMetadata` | `src/app/[locale]/real-estate/page.tsx` |
| Claves i18n nuevas (`pages.realEstate.*`, `pages.dealEnquiryForm.*`, `pages.admin.labels.*`, `settings.subnav.*`) en 4 idiomas | `messages/{en,pt,es,fr}.json` |

---

## Plan por sesiones

Cada sesión la implementa un agente general-purpose. Después, el coordinador revisa el diff, ejecuta
typecheck, lint y los tests (`npx tsx --test …`, comprobando el exit code), y revisa el admin real y la página
pública con Playwright headed **sin guardar**. Cada commit necesita el OK del owner. El push, sólo cuando se pida.

**Política de tests (owner):** tests básicos de la superficie tocada, centrados en los inputs de medios y los
campos ocultos. Cada sesión cabe en 10–15 minutos.

**S1 — Editor por secciones + campos ocultos.**
- Variantes locales con `admin_hidden` (URLs + `partners.cta_secondary.note`).
- `REAL_ESTATE_LAYOUT` con las 11 tarjetas + "Other", notas y enlaces.
- Etiquetas legibles, `itemLabels` / `addLabels` (4 idiomas). `hero.image_media_id` opcional + hint.
- Tests: campos ocultos no se pintan y se guardan sin cambios; layout sin claves perdidas ni repetidas.

**S2 — SEO, FAQ, badge destacado y alts.**
- `seo.*` + `buildRealEstateMetadata` + ruta (alinear EN de `metaTitle` / `metaDescription` con la ruta actual).
- `faq.title` con fallback; fallback `featuredModel`; alts de respaldo a i18n (4 idiomas).
- Tests de fallback (`orMessage`) y de `seoMetadataInput` con `/real-estate`.

**S3 — Medios animados en capabilities y asset types.**
- `optionalAnimated` + hints 4:5, render con `sideMedia()`.
- Tests del `accept` de cada medio; los valores guardados (`""`) siguen siendo válidos.

**S4 — PDF del capability statement.**
- Tipo `document` en `core/media` (mime, ingest con comprobación `%PDF-`) y en el backoffice (accept, vista
  del archivo sin miniatura).
- `capability_statement_media_id` con accept `document` + hint; render del botón 2.
- Tests: `document` sólo acepta PDF; un no-PDF con extensión `.pdf` se rechaza al finalizar; los otros accept no cambian.

**S5 — Enquiry.**
- `deal_enquiry.*` editables, contacto desde Settings, `pages.dealEnquiryForm.*` en 4 idiomas con valores
  estables en los selects (`FormSelect` `{ value, label }`).
- Tests: claves en los 4 idiomas con los mismos argumentos; línea omitida si falta el dato en Settings.

**S6 — Submenú del header.**
- `settings.subnav.realEstate.*` en 4 idiomas; `REAL_ESTATE_SECTIONS` las lee. Hrefs iguales.
- Test: las 10 claves existen en los 4 idiomas.

**S7 — Cierre.**
- Recorrer `/real-estate` en los 4 idiomas con todo vacío (sólo lectura).
- Prueba real en PROD **sólo con OK del owner**: instantánea de la fila, rellenar campos, subir un WebM a
  capabilities y un PDF al capability statement, guardar, verificar, restaurar la fila y borrar los assets
  (objeto R2 + fila `media_asset`), reiniciar el dev server.
- Actualizar `pages/README.md`, `docs/data-model.md` → real_estate y este spec (estado final).

## Fuera de alcance

- **Envío real del formulario** (conectarlo a leads `deal_enquiry`): el owner lo aplaza. Los valores estables
  de los selects lo dejan preparado.
- Destino de los botones (anclas fijas).
- Preguntas del FAQ (su catálogo).
- Arco de traducción por pestañas.
- Submenús de Owners y About (mismo patrón que S6; se pueden añadir después con el mismo cambio).

## Decisiones (owner, 2026-10-11)

1. SEO editable como en Owners y Buildings. El botón 2 del hero acepta un PDF subido a R2.
2. CTA 1 y CTA 2 mantienen sus anclas; las URLs se quitan del editor.
3. Capabilities y Asset Types: imagen, MP4/WebM, WebP animado y Lottie. Textos del CTA y nota editables, URL oculta.
   Alts de respaldo en EN/ES/PT/FR (i18n).
4. La clave `featuredModel` se revisa para que tenga uso cuando lleguen las traducciones (→ fallback del badge).
5. FAQ: el título se puede editar.
6. Enquiry: título, texto, título del contacto, botón y nota editables; todo preparado para EN/ES/PT/FR.
   Labels, placeholders y opciones del form → i18n fijo como en Owners. Contacto desde Settings. Sin envío por ahora.
7. Submenú del header: los labels pasan a i18n en EN/ES/PT/FR.

**Decididas por el coordinador (revisables):** `partners.cta_secondary.note` se oculta (no se pinta en
ningún sitio). `featuredModel` se usa como fallback del badge de un modelo destacado sin texto. El hero sigue
siendo sólo foto (no animada). Sólo se traduce el submenú de Real Estate, no los de Owners y About.

---

## Estado final (2026-10-11)

Todas las sesiones están entregadas. Commits:

| Sesión | Commit | Qué entró |
|---|---|---|
| Spec | `e609c22` | Este documento + plan por sesiones |
| S1 | `e789678` | Variantes locales `realEstateCta` / `heroCta` con la URL `admin_hidden`; `partners.cta_secondary.note` oculta. `REAL_ESTATE_LAYOUT` con las 11 tarjetas + "Other", notas y enlaces. Etiquetas legibles, `itemLabels` / `addLabels` (4 idiomas). `hero.image_media_id` opcional con el hint del hero de Owners |
| S2 | `acf86cb` | `seo.*` + `buildRealEstateMetadata` (contrato); la ruta sólo lo llama (EN de `metaTitle` / `metaDescription` = el title/description que tenía la ruta). `faq.title` con fallback, fallback `featuredModel` del badge destacado, alts de respaldo → `pages.realEstate.{heroAlt, capabilitiesAlt, assetsAlt}` (4 idiomas) |
| S3 | `91980a4` | `capabilities.image_media_id` y `asset_management.image_media_id` → `optionalAnimated` (hint 4:5), render con `sideMedia()` |
| S4 | `51b3801` | Tipo de medio `document` (PDF): `core/media` (mime, límite, comprobación `%PDF-` al finalizar, sin sharp) y backoffice (accept, vista de archivo sin miniatura). `capability_statement_media_id` acepta `document` + hint; `capabilityStatementHref`: sólo un PDF resuelto es el enlace del botón 2 (pestaña nueva), si no `#deal-enquiry` |
| S5 | `dce6e24` | `deal_enquiry.*` editables con fallback i18n; formulario en `pages.dealEnquiryForm.*` (4 idiomas) con valores estables en los selects (`FormSelect` ya admitía `{ value, label }`, `core/ui` no se tocó); contacto desde Settings (`enquiryContactLines` en `ui/contact-line.ts`) |
| S6 | `ec1b988` | Submenú Real Estate del header → `settings.subnav.realEstate.*` (4 idiomas) desde `settings/ui/subnav-sections.ts`; hrefs iguales; corregido "Portugal- " |
| S7 | — | Recorrido de `/real-estate` con todo vacío en los 4 idiomas (sólo lectura) y documentación: `pages/README.md` ("Real Estate content model"), `docs/data-model.md` → real_estate y este cierre |

### Verificación hecha

- **Tests por sesión** (`pages/tests/pages-admin.test.ts`, `pages/tests/pages.test.ts`,
  `settings/tests/subnav.test.ts`, `core/media/tests/media-inputs.test.ts`,
  `backoffice/tests/media-accept.test.ts`):
  - **S1:** URLs y la nota secundaria de partners son nodos `hidden` y las etiquetas no; los valores
    ocultos hacen el viaje por `applyDefaults` y validan al guardar; `hero.image_media_id` acepta `""`
    con su hint; el layout tiene 11 ids estables y cada clave se coloca una sola vez; etiquetas en 4 idiomas.
  - **S2:** `seo` y `faq` opcionales, con límite y traducibles; vacío → mensaje i18n (título del FAQ,
    badge); `seoMetadataInput` para `/real-estate` (canonical + hreflang); el EN de la meta coincide con
    el literal anterior de la ruta; claves nuevas en 4 idiomas.
  - **S3:** `accept` `animated` con hint 4:5 en capabilities / asset types, `image` en el hero; `""` y
    uuid siguen siendo válidos.
  - **S4:** `document` sólo acepta PDF; un no-PDF con extensión `.pdf` se rechaza al finalizar; los
    otros accept no cambian; el campo sigue siendo opcional y tolera `""`; `capabilityStatementHref`.
  - **S5:** `deal_enquiry` opcional, con límite y traducible; cada hint nombra su EN por defecto (= copy
    anterior); todas las claves `pages.dealEnquiryForm.*` y las nuevas `pages.realEstate.*` en 4 idiomas
    con los mismos argumentos; línea de contacto omitida si falta el dato en Settings.
  - **S6:** las 10 claves existen y no están vacías en los 4 idiomas; el EN coincide con el literal
    anterior salvo el typo.
  - Al cierre: `pnpm typecheck` 0, `pnpm lint` 0 (5 warnings ajenos al spec), 156 tests en verde (exit 0).
- **Revisión del coordinador en cada sesión**, según el protocolo del plan: diff, typecheck + lint +
  tests, y el admin real y la página pública en Playwright headed **sin guardar**.
- **S7, recorrido de sólo lectura con todos los campos nuevos vacíos** (estado actual de la DB, dev
  server local, HTML servidor):
  - `/{en,pt,es,fr}/real-estate` → 200, con las 10 secciones (`#top #partners #capabilities #manage
    #deal-structures #market #track-record #process #faq #deal-enquiry`).
  - **EN:** los textos fijos de la versión anterior al spec (`b5e83d2`: title/description de la ruta
    —también en OG—, alts de `real-estate-page.tsx`, título del FAQ, todo `deal-enquiry-section.tsx`
    —título, texto, contacto, ~30 labels/placeholders/opciones, botón y nota— y los 10 labels del
    submenú en `site-header.tsx`) aparecen tal cual. Únicas diferencias, las aceptadas: el email del
    contacto pasa a `info@centralhill.pt`, LinkedIn enlaza a `https://linkedin.com/company/centralhill`
    (antes `#`) y el submenú dice "Portugal Market Opportunity". El badge destacado sigue siendo
    "Most Flexible" (de la DB). Sin PDF, los dos botones del hero van a `#deal-enquiry`.
  - **PT/ES/FR:** `<title>`, meta/OG description, alts de respaldo, título del FAQ, todo el bloque de
    enquiry (título, texto, título y labels del contacto —"Tel.:", "E-mail :"—, grupos, labels,
    placeholders, opciones de los selects con los mismos `value` EN, botón y nota) y el submenú de
    Real Estate salen traducidos.
  - Lo que sigue en inglés en PT/ES/FR es contenido de la DB (EN, esperado: sólo se edita en EN):
    hero (eyebrow "Real Estate Partnerships", título, botones), todas las secciones, el badge "Most
    Flexible" y las preguntas del FAQ (catálogo `faq`). También, por diseño, "Central Hill Apartments"
    (texto del enlace LinkedIn, marca), el placeholder `+351 …` y las opciones que se escriben igual
    ("Hotel", "Apart-hotel"). Fuera de este spec: los submenús de Owners y About del header (ver Abiertos).
- **Las sesiones no escriben en DB / R2.** Ninguna añadió migraciones ni scripts de pre-carga: todos
  los campos nuevos son opcionales.
- **Prueba real en PROD (guardar, subir un WebM y un PDF): la hace el owner.**

## Abiertos (para decidir después)

1. **Subida real a R2 de un PDF y un WebM sin probar.** Pendiente de la prueba en PROD (plan S7):
   PDF al capability statement (comprobación `%PDF-` y botón 2 en pestaña nueva) y WebM a capabilities.
   El WebP animado y el Lottie usan el mismo `sideMedia()` verificado en Home/Owners (el Lottie depende
   del CORS GET del bucket, Home abierto nº 2).
2. **El formulario de enquiry no envía.** Leads ya tiene `kind = 'deal_enquiry'` y los selects tienen
   valores estables en inglés; conectarlo es otra decisión.
3. **Submenús de Owners y About del header siguen en inglés fijo** (`OWNERS_SECTIONS` /
   `ABOUT_SECTIONS` en `settings/ui/site-header.tsx`; verificado en `/pt`). Mismo cambio que S6.
4. **Arco de traducción por pestañas** (`home-admin-editor.md` → "Modelo de traducción por pestañas").
   Hasta entonces el contenido de la DB sale en EN en PT/ES/FR.
5. **Post-deploy: no hace falta nada.** Sin migración, sin pre-carga ni escrituras en DB; con los campos
   vacíos la página renderiza los fallbacks i18n. El deploy regenera la página ISR y el layout (submenú).
6. **Claves i18n muertas** en `pages.realEstate`: `partnersEyebrow`, `enquiryEyebrow`, `enquiryCta`
   (ningún código las lee; las de `services.detail.*` con el mismo nombre son otras). Borrarlas o darles
   uso queda para el arco de traducción.
7. **Comentario de cabecera de `schemas/real-estate.ts` obsoleto**: dice que sólo hero, partners,
   market y FAQ son editables (hoy lo es todo). Sólo es un comentario.
