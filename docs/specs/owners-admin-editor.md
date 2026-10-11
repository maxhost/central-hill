# Spec + plan — Admin Owners editable sección a sección

**Fecha:** 2026-10-11 · **Slice principal:** `pages` · **Estado:** completado (S1–S7, 2026-10-11)
**Precedente:** `docs/specs/home-admin-editor.md` (mismo proceso, mismas piezas reutilizables)

## Objetivo

Que **todo** lo visible de `/[locale]/owners` (textos, botones, badges, imágenes, vídeos y SEO), salvo
los componentes de catálogo (tarjetas de testimonios y preguntas FAQ) y los **campos del formulario de
estimación** (labels y placeholders), se pueda editar desde `/admin/pages/owners`. El formulario debe
**seguir el orden de la página, sección a sección**, como el de Home.

**Reglas (owner, 2026-10-11):**
- **Sólo se añade.** No se borra ni se renombra ningún campo de `page_content.data`. Los campos nuevos
  son **opcionales**: si se dejan vacíos, la página se ve como hoy (texto i18n actual o foto actual). No
  hace falta migración, porque `data` es jsonb y `applyDefaults` rellena las claves que falten.
- **Las URLs no se editan ni se muestran** en el admin. A dónde apunta cada botón se decide en el sistema.
  Los enlaces que hoy son `#` (Choose plan, banda "Not sure", T&C/Privacy) **se quedan así** de momento.
- **Por ahora sólo inglés.** Un campo vacío usa el texto i18n, que ya existe o se añade en los 4 idiomas.
  Un campo relleno se muestra en todos los idiomas hasta que exista el arco de traducción por pestañas
  (ver `home-admin-editor.md` → "Modelo de traducción por pestañas"). Igual que la D1 de Home.
- **Autorización:** los cambios fuera de `pages` listados abajo (`core/ui`, shell `src/app`) no necesitan
  ADR aparte; los autoriza este spec.

## Cómo se publica

Igual que Home: `savePage` → `revalidatePage("owners")` invalida `page:owners` y revalida `/{locale}/owners`
en los 4 idiomas. Sólo el **código** de este spec necesita deploy.

---

## Campos ocultos en el editor (nuevo mecanismo)

Hoy el form-model pinta todos los campos del schema. Se añade una marca de schema
**`.meta({ admin_hidden: true })`**, que se lee igual que `media_accept`. Un campo con esa marca:
- **no se pinta** en el formulario;
- **conserva su valor**: el valor actual de `data` viaja en el estado del formulario y se guarda sin cambios.
  Así se cumple "sólo se añade" y el schema sigue validando (p. ej. `url` es obligatoria dentro de
  `ctaWithNote`).

En Owners se ocultan:

| Campo | Motivo |
|---|---|
| `why.cta_primary.url`, `why.cta_secondary.url` | URLs (el render usa `#worth` / `#start`) |
| `services.cta.url`, `dashboard.cta.url` | URLs (el render usa `#worth`) |
| `plans.helpers[0].cta.url` | URL (el render usa `#`) |
| `plans.tiers[].commission` | Nunca se pinta en la página; el % visible es `corner_badge` |

`ctaWithNote` está en el kernel (`core/validation/primitives`). No se toca: `schemas/owners.ts` define una
variante local `ctaWithNote.extend({ url: url.meta({ admin_hidden: true }) })`.

Queda disponible para Home: resolvería su abierto nº 1, pero aplicarlo allí no entra en este spec.

---

## Modelo de datos: añadidos a `ownersSchema` (`src/slices/pages/schemas/owners.ts`)

**T** = texto por idioma · **C** = compartido entre idiomas.

| Sección | Campo | Tipo | Clase | Vacío → |
|---|---|---|---|---|
| SEO | `seo.meta_title` | `seoShape.meta_title` | T | i18n `pages.owners.metaTitle` |
| SEO | `seo.meta_description` | `seoShape.meta_description` | T | i18n `pages.owners.metaDescription` (EN se alinea con el texto que hoy pone la ruta) |
| SEO | *(ya existe)* `og_image_media_id` (columna) | imagen | C | sin OG |
| Hero | `hero.image_media_id` | **pasa a opcional** (`"" \| uuid`) + hint | C | foto Unsplash actual |
| Hero | `hero.contact.label` | tStrOpt 40 | T | i18n `pages.owners.contactLabel` ("Contact Us") |
| Hero | `hero.contact.title` | tStrOpt 80 | T | i18n `pages.owners.contactTitle` ("Contact us") |
| Hero | `hero.contact.intro` | tStrOpt 280 | T | i18n `pages.owners.contactIntro` |
| Formulario | *(ya existen)* `earnings_form.{badge, headline, subheadline, cta_label, note}` | — | T | — |
| Formulario · paso 2 | `earnings_form.contact_step.title` | tStrOpt 120 | T | i18n `pages.estimateForm.contactTitle` |
| Formulario · paso 2 | `earnings_form.contact_step.lede` | tStrOpt 280 | T | i18n `pages.estimateForm.contactLede` |
| Formulario · paso 2 | `earnings_form.contact_step.submit_label` | tStrOpt 60 | T | i18n `pages.estimateForm.submit` |
| Formulario · paso 2 | `earnings_form.contact_step.back_label` | tStrOpt 30 | T | i18n `pages.estimateForm.back` |
| Formulario · paso 3 | `earnings_form.done_step.title` | tStrOpt 120 | T | i18n `pages.estimateForm.doneTitle` |
| Formulario · paso 3 | `earnings_form.done_step.body` | tStrOpt 400 | T | i18n `pages.estimateForm.doneBody` |
| Cifras | `stats` | **`fixed(4)` → `between(statFigure, 0, 8)`** | número C · `label` T | 0 filas → no se muestra la banda |
| Services | `services.badge.label` | tStrOpt 120 | T | i18n `pages.owners.servicesBadge` |
| Services | `services.badge.icon_key` | `optionalIconKey` | C | icono por defecto del componente |
| Services | `services.image_media_id` | **acepta además** MP4/WebM, WebP animado y Lottie (`optionalAnimated`) | C | foto Unsplash actual |
| Plans | `plans.popular_label` | tStrOpt 30 | T | i18n `pages.owners.popular` ("Most Popular") |
| Plans | `plans.choose_label` | tStrOpt 60, admite `{name}` | T | i18n `pages.owners.choosePlan` ("Choose {name}") |
| Plans | *(ya existe)* `tiers[].corner_badge` | — | T | etiqueta legible "Corner badge (e.g. 10%, +5%)" |
| Journey | *(ya existe)* `steps[].image_media_id` | sigue siendo imagen; se revisa el hint 3:4 | C | foto Pexels actual |
| Dashboard | `dashboard.badge.label` | tStrOpt 120 | T | i18n `pages.owners.dashboardBadge` |
| Dashboard | `dashboard.badge.icon_key` | `optionalIconKey` | C | icono por defecto |
| Dashboard | `dashboard.image_media_id` | **acepta además** MP4/WebM, WebP animado y Lottie | C | foto Unsplash actual |
| Testimonios | `testimonials.title` | tStrOpt 160 | T | i18n `pages.reviews.title` (como hoy) |
| FAQ | `faq.title` | tStrOpt 160 | T | i18n `pages.owners.faqTitle` |
| CTA final | `final_cta.eyebrow` | tStrOpt 60 | T | i18n `pages.owners.finalEyebrow` |
| CTA final | `final_cta.headline` | tStrOpt 160 | T | i18n `pages.owners.finalTitle` |
| CTA final | `final_cta.body` | tStrOpt 600 | T | i18n `pages.owners.finalCopy` (EN se alinea con el texto actual: "…Central Hill Apartments…") |
| CTA final | `final_cta.cta_label` | tStrOpt 80 | T | i18n `pages.owners.finalCta` |
| CTA final | `final_cta.contact_line` | tStrOpt 200 | T | se construye desde Settings: `phone · email · WhatsApp whatsapp` (igual que el panel propietario del CTA doble de Home) |
| CTA final | `final_cta.image_media_id` | `optionalImage` 4:5 | C | foto Pexels actual |

Notas:
- **Fijos con i18n en los 4 idiomas, no editables** (decisión del owner, "el formulario nunca queda vacío"):
  labels y placeholders de los pasos 1 y 2, opciones "Studio", prefijos de teléfono, los dos textos de
  checkbox (T&C / Privacy), aria-labels del stepper. Viven en `pages.estimateForm.*`.
- **Cifras:** se relaja de 4 fijas a 0–8, como la Home (spec S5). Las 4 filas actuales siguen siendo
  válidas, así que no hace falta pre-carga. Owners **no** gana título: el diseño es una banda sin
  encabezado. Si se quiere título, se añade después como `stats_title`.
- `faq_group_key` y `stats` se quedan en la raíz de `data`. `faq.title` y `testimonials.title` van en objetos
  aparte y el editor los junta en su tarjeta.
- `hero.image_media_id` opcional es una relajación compatible: el id sembrado sin asset ya cae a la foto
  de respaldo.

---

## Editor: formulario sección a sección (orden de la página)

`OWNERS_LAYOUT` en `src/slices/pages/admin/layout.ts`, registrado en `LAYOUTS.owners`. Los ids son estables
(serán la unidad del futuro "Traducir con IA"). Cualquier clave no reclamada cae en "Other".
`EditorCardId` pasa a ser la unión de los ids de Home y de Owners.

| # | id | Tarjeta | Contenido | Nota (sólo lectura) |
|---|---|---|---|---|
| 1 | `seo` | SEO & sharing | meta title, meta description, imagen OG | contador 70/200 |
| 2 | `hero` | Hero | imagen, título (`;` = salto de línea), texto, botón Contact (texto, título del modal, intro del modal) | "Use `;` to break the title into lines" |
| 3 | `earnings_form` | Earnings form | badge, título, subtítulo, botón y nota del paso 1; título, texto, botón enviar y volver del paso 2; título y texto del paso 3 | "Field labels, placeholders and checkboxes are fixed and translated automatically. The form doesn't send leads yet." |
| 4 | `stats` | Figures | lista 0–8 con "+ New figure" | "Without figures the band is hidden" |
| 5 | `why` | Why owners trust us | título, subtítulo, 6 beneficios, botón principal (texto + nota), botón secundario (texto) | — |
| 6 | `services` | Everything handled | título, subtítulo, 4 beneficios, botón (texto + nota), badge flotante (texto + icono), imagen o animación | hint 4:5 |
| 7 | `plans` | Plans | título, subtítulo, planes 1–4 (nombre, tag, corner badge, popular, features), texto de la pill, texto del botón "Choose", banda "Not sure" (título, texto, botón) | "Use `{name}` in the button text for the plan name" |
| 8 | `journey` | Growth path | título, subtítulo, 5 pasos (título, descripción, foto) | hint 3:4 |
| 9 | `dashboard` | Always in sight | como `services` | hint 4:5 |
| 10 | `testimonials` | Testimonials | título | "Reviews come from Testimonials" + enlace `/admin/testimonials` |
| 11 | `faq` | FAQ | grupo, título | "Questions are edited in FAQ" + enlace |
| 12 | `final_cta` | Closing CTA | eyebrow, título, texto, botón, línea de contacto, imagen | "Leave the contact line blank to build it from Settings" + enlace |

**Etiquetas legibles** (`pages.admin.labels`, 4 idiomas) para las claves que hoy salen crudas:
`earnings_form`, `contact_step`, `done_step`, `lede`, `submit_label`, `back_label`, `why`, `plans`, `tiers`,
`helpers`, `name`, `tag`, `corner_badge`, `is_popular`, `features`, `popular_label`, `choose_label`,
`journey`, `steps`, `dashboard`, `copy`, `contact`, `intro`, `testimonials`, `final_cta`, `contact_line`.
Más `itemLabels` / `addLabels` para tiers ("Plan"), features ("Feature"), steps ("Step") y stats.

### Selector de medios y hints (en inglés, como el resto del admin)

| Campo | `accept` | Hint |
|---|---|---|
| `hero.image_media_id` | `image` | "Full-bleed hero background (a dark overlay is applied). Landscape 16:9 — 1920×1080 px (min 1600×900), JPG or WebP, under 500 KB." |
| `services.image_media_id`, `dashboard.image_media_id` | `animated` | El mismo texto que el pitch de Home: "Portrait 4:5 — the frame is fixed at 4:5, so other ratios are cropped. Photo: 1200×1500 px (min 960×1200), JPG/WebP, under 500 KB. Video: MP4 (H.264), 1080×1350 or 1200×1500, no audio, 6–15 s loop, under 10 MB. Animated WebP: 1200×1500, under 5 MB. Lottie (.lottie or .json): 4:5 canvas (e.g. 1200×1500)." |
| `journey.steps[].image_media_id` | `image` | El actual (3:4, 900×1200, < 400 KB) |
| `final_cta.image_media_id` | `image` | "Closing band photo. Portrait 4:5 — 1200×1500 px, JPG or WebP, under 500 KB." |
| `og_image_media_id` | `image` | El de Home (1200×630) |

---

## Render público

- **Medios con `mime`:** `sideMedia()` sale de `guests-section.tsx` a un helper del slice
  (`ui/components/side-media.tsx`), sin cambiar su comportamiento. Lo usan Home (pitch) y Owners
  (services, dashboard). Si no hay asset, se usa la foto de respaldo actual.
- **Hero:** `ContactDialog` recibe `label` / `title` / `intro` = campo o i18n.
- **Formulario:** `OwnerEstimateForm` lee los textos fijos con `useTranslations("pages.estimateForm")` (el
  `NextIntlClientProvider` del layout ya expone los mensajes). Los textos editables de los pasos 2 y 3
  llegan como props opcionales, con el i18n como valor por defecto.
  **Efecto en Buildings** (`buildings-listing.tsx`, segundo consumidor): no pasa las props nuevas, así que
  su formulario muestra los textos i18n. En EN queda idéntico y en PT/ES/FR pasa a estar traducido. No se
  toca código de `buildings`.
- **Cifras:** `statFigureCells(stats)` + `statBandColumns(n)` (como Home). Con 0 filas no se pinta la banda,
  aunque el ancla `#numbers` se mantiene para el menú.
- **Badges:** `TwoColumnShowcase` ya admite `badge` y `badgeIcon`.
- **Planes:** `PricingCards` (`core/ui`) gana la prop `popularLabel?: string` (por defecto "Most Popular").
  El botón es `choose_label.replace("{name}", tier.name)`. Los `href` siguen siendo `#`.
- **Testimonios / FAQ:** `TestimonialsRow title` y `FaqSection title` = campo o i18n. La audiencia sigue
  mezclada (owner + guest), como hoy.
- **CTA final:** `FeatureCtaBand` con `final_cta.*` o i18n. La línea de contacto, si está vacía, se lee de
  Settings con el mismo helper que `dual-cta.tsx`. La imagen usa `MediaImage` o la foto Pexels.
- **SEO:** `buildOwnersMetadata(locale)` en el contrato de `pages` (lee `seo.*` y la OG, cae a i18n), igual
  que `buildHomeMetadata`. `src/app/[locale]/owners/page.tsx` sólo lo llama. Se corrige el comentario
  obsoleto "Content is the embedded mock (no DB)".

**Con todos los campos vacíos, la página queda idéntica a la actual** en los 4 idiomas. Hay dos
excepciones intencionadas: el formulario y las cadenas fijas pasan a estar traducidos en PT/ES/FR (antes
salían en inglés).

## Cambios fuera de `pages` (autorizados por este spec)

| Cambio | Dónde |
|---|---|
| `PricingCards`: prop `popularLabel?` (aditiva, por defecto la de hoy) | `core/ui/pricing-cards.tsx` |
| La ruta Owners llama a `buildOwnersMetadata` | `src/app/[locale]/owners/page.tsx` |
| Claves i18n nuevas (`pages.owners.*`, `pages.estimateForm.*`, `pages.admin.labels.*`) en 4 idiomas | `messages/{en,pt,es,fr}.json` |

---

## Plan por sesiones

Cada sesión la implementa un agente general-purpose. Después, el coordinador revisa el diff, ejecuta
typecheck, lint y los tests, y comprueba el admin real y la página pública con Playwright en modo headed
**sin guardar**. Cada commit necesita el OK del owner. El push, sólo cuando se pida.

**Política de tests (owner):** tests básicos de la superficie tocada, centrados en los inputs de medios y en
los campos ocultos. Cada sesión cabe en 10–15 minutos.

**S1 — Editor por secciones + campos ocultos.**
- Marca `admin_hidden` en el form-model: el campo no se pinta y su valor se conserva al guardar.
  Variante local de `ctaWithNote`. `commission` oculto.
- `OWNERS_LAYOUT` con las 12 tarjetas + "Other", notas y enlaces.
- Etiquetas legibles, `itemLabels` / `addLabels` (4 idiomas). `hero.image_media_id` pasa a opcional y se
  añaden los hints.
- Tests: campo oculto = no se pinta y se guarda sin cambios; layout resuelto sin claves perdidas.

**S2 — Textos nuevos con fallback.**
- `seo.*` + `buildOwnersMetadata` + ruta. `hero.contact.*`, `services.badge.*`, `dashboard.badge.*`,
  `plans.popular_label` (+ prop en `core/ui`), `plans.choose_label`, `testimonials.title`, `faq.title`.
- Claves i18n de fallback en 4 idiomas (alinear EN de `metaDescription`).
- Tests de fallback (`orMessage`) y de `{name}`.

**S3 — Formulario de estimación.**
- `pages.estimateForm.*` en 4 idiomas para todo lo fijo. `earnings_form.contact_step.*` / `done_step.*`
  editables.
- Verificar que Buildings sigue igual en EN y traducido en PT.

**S4 — Cifras como Home.**
- `stats` 0–8 con "+ New figure", `statBandColumns`, 0 filas → sin banda.

**S5 — Medios.**
- `side-media.tsx` extraído (Home sin cambios). Services y dashboard → `animated` (imagen, WebP animado,
  MP4/WebM, Lottie).
- Revisar el hint y el selector de las fotos de los 5 pasos.
- Tests del `accept` de cada campo de medios.

**S6 — CTA final editable.**
- `final_cta.*` con fallback i18n, línea de contacto desde Settings e imagen.
- Alinear EN de `finalCopy` con el texto actual.

**S7 — Cierre.**
- Recorrer `/owners` en los 4 idiomas con todo vacío (idéntico salvo las traducciones nuevas) y con todo
  relleno (tras una instantánea, restaurar después; `.env.local` apunta a la DB y R2 de PROD).
- Actualizar `pages/README.md`, `docs/data-model.md` → owners, `core/ui` README y este spec (estado final).

## Fuera de alcance

- Envío real de leads del formulario (`earnings_estimate`): el owner lo aplaza.
- Destino de los botones (`#` de los planes, banda "Not sure", T&C/Privacy, `#worth` / `#start`): lo decide
  el sistema más adelante.
- Labels y placeholders del formulario: fijos, traducidos.
- Tarjetas de testimonios y preguntas FAQ (sus catálogos). Filtrar testimonios por audiencia (se quedan
  mezclados).
- Arco de traducción por pestañas (EN/PT/ES/FR en el editor).
- Ocultar las URLs del admin de Home (el mecanismo queda listo; aplicarlo es otra decisión).

## Decisiones (owner, 2026-10-11)

1. Hero: el botón Contact, el título y la intro del modal se pueden editar.
2. Formulario: se pueden editar los títulos, textos, badges y botones de los 3 pasos. Labels, placeholders
   y checkboxes quedan fijos y traducidos a los 4 idiomas. Que todavía no envíe está bien.
3. Cifras: se editan igual que en Home.
4. Why, Services, Dashboard y la banda "Not sure": los textos se editan; las URLs se quitan del formulario.
5. Services y Dashboard: imagen opcional, que admite imagen, WebP, MP4 y Lottie, con hints de
   tamaño. Los badges se pueden editar.
6. Planes: se quita `commission` del formulario (el % editable es `corner_badge`). La pill y el botón
   "Choose" se pueden editar. Los enlaces `#` se quedan.
7. Journey: las fotos de cada paso se cambian desde el editor.
8. Testimonios: el título se puede editar y las reseñas siguen mezcladas.
9. FAQ: el título se puede editar.
10. CTA final: todo editable. La línea de contacto, si está vacía, sale de Settings.
11. SEO: meta title, meta description y OG, editables. Por ahora sólo en EN.
12. Idioma: por ahora sólo EN. Las pestañas de traducción se harán después.

**Decididas por el coordinador (revisables):** Owners no tiene título en la banda de cifras. La imagen del
hero pasa a opcional. Los badges llevan icono opcional, como el pitch de Home. La imagen del CTA final es
sólo foto, no animada.

---

## Estado final (2026-10-11)

Todas las sesiones están entregadas. Commits:

| Sesión | Commit | Qué entró |
|---|---|---|
| Spec | `394f696` | Este documento + plan por sesiones |
| S1 | `ea4c787` | Marca `.meta({ admin_hidden: true })` (`schemas/admin-hidden.ts`): el form-model la convierte en un nodo `hidden` que no se pinta y conserva su valor al guardar. Variante local `ownersCta` (URL oculta), `plans.helpers[0].cta.url` y `tiers[].commission` ocultos. `OWNERS_LAYOUT` con las 12 tarjetas + "Other", notas y enlaces. Etiquetas legibles, `itemLabels` / `addLabels` (4 idiomas). `hero.image_media_id` opcional con hint |
| S2 | `178d0d3` | `seo.*` + `buildOwnersMetadata` (contrato) + `seoMetadataInput` (puro); la ruta sólo lo llama. `hero.contact.*`, `services.badge.*`, `dashboard.badge.*`, `plans.popular_label` (+ prop `PricingCards.popularLabel` en `core/ui`), `plans.choose_label` (`orNamedMessage`, `{name}`), `testimonials.title`, `faq.title`. Claves i18n de fallback en 4 idiomas |
| S3 | `9dcb9e3` | `OwnerEstimateForm` lee todo lo fijo de `pages.estimateForm.*` (4 idiomas). `earnings_form.contact_step.*` / `done_step.*` editables, como props opcionales con el i18n por defecto |
| S4 | `a209711` | `stats` pasa de 4 fijas a 0–8 (`between(statFigure, 0, 8)`), "+ New figure", `statBandColumns`; 0 filas → sin banda (el ancla `#numbers` se mantiene) |
| S5 | `d218dc9` | `sideMedia()` extraído a `ui/components/side-media.tsx` (Home sin cambios). `services.image_media_id` y `dashboard.image_media_id` → `optionalAnimated` (imagen, WebP animado, MP4/WebM, Lottie) con el hint 4:5 del pitch de Home |
| S6 | `c6edbe5` | `final_cta.*` (eyebrow, título, texto, botón, línea de contacto, imagen 4:5) con fallback i18n. `ui/contact-line.ts`: `settingsContactLine` (compartido con el CTA doble de Home) + `ownersFinalContactLine` ("Call {phone}" localizado) |
| S7 | — | Recorrido de `/owners` con todo vacío en los 4 idiomas (sólo lectura) y documentación: `pages/README.md`, `docs/data-model.md` → owners y este cierre. `core/ui` no tiene un doc que liste las props de `PricingCards`, así que no se tocó |

### Verificación hecha

- **Tests por sesión** (`tests/pages-admin.test.ts`, `tests/pages.test.ts`), centrados en los medios y
  en los campos ocultos:
  - **S1:** un campo `admin_hidden` se convierte en un nodo `hidden` que envuelve el normal; en
    `ownersSchema` las URLs y `commission` están ocultas y las etiquetas no; los valores ocultos hacen
    el viaje completo por `applyDefaults` y siguen validando al guardar; `hero.image_media_id` acepta
    `""` y lleva su hint; el layout tiene 12 ids estables.
  - **S2:** las claves nuevas son opcionales, toleran vacío y tienen límite; son traducibles (los
    `icon_key` no); vacío → mensaje i18n, relleno → su texto; `{name}` en `orNamedMessage`;
    `seoMetadataInput` cae a i18n y conserva canonical / hreflang / OG; cada clave del layout se
    coloca una sola vez.
  - **S3:** todas las claves `pages.estimateForm.*` existen en los 4 idiomas con los mismos argumentos
    y etiquetas; los textos de los pasos 2 y 3 son opcionales, traducibles y su hint nombra el texto
    EN actual.
  - **S4:** 0–8 filas `statFigure` (las 4 filas guardadas siguen siendo válidas); con 4 filas la banda
    conserva sus 4 columnas.
  - **S5:** `accept` de cada medio (services/dashboard `animated` con hint 4:5; hero y pasos del
    journey `image`); los valores guardados (`""` y uuid) siguen siendo válidos.
  - **S6:** `final_cta` valida ausente, vacío y relleno; es traducible salvo la imagen; el texto que
    nombra cada hint coincide con el mensaje EN; línea de contacto: el campo gana, vacío → Settings
    con "Call", la Home no cambia.
- **Revisión del coordinador en cada sesión**, según el protocolo del plan: diff, typecheck + lint +
  tests, y el admin real y la página pública en Playwright headed **sin guardar**.
- **S7, recorrido de sólo lectura con todos los campos nuevos vacíos** (estado actual de la DB, dev
  server local):
  - `/{en,pt,es,fr}/owners` → 200, con las 10 secciones (`#worth #numbers #why #services #plans
    #journey #technology #testimonials #faq #start`).
  - **EN:** todos los textos fijos de la versión anterior al spec (`394f696`: literales de
    `owners-page.tsx`, de `owner-estimate-form.tsx` y el title/description de la ruta) aparecen
    tal cual, incluida la intro del diálogo de contacto. La línea de contacto del CTA final, construida
    desde Settings, es idéntica a la literal anterior.
  - **PT/ES/FR:** `<title>`, meta/OG description, botón Contact y diálogo, todo el formulario (labels,
    placeholders, Studio, aria-labels, checkboxes, Voltar/Enviar, paso 3), badges de services y
    dashboard, pill "Most Popular", botones "Choose {name}", títulos de testimonios y FAQ y el CTA
    final completo (incluida la línea "Ligue / Llame al / Appelez le …") salen traducidos.
  - Lo que sigue en inglés en PT/ES/FR es contenido de la DB (EN, esperado: sólo se edita en EN) o
    código fuera de este spec; ver Abiertos nº 8.
- **Las sesiones no escriben en DB / R2.** Ninguna añadió migraciones ni scripts de pre-carga: las 4
  filas de `stats` ya eran válidas con 0–8 y todos los campos nuevos son opcionales.
- **S7, prueba real en PROD (OK del owner, 2026-10-11)**, contra la DB y R2 de producción desde el dev
  server local:
  - Instantánea de la fila `owners` → desde el admin (Playwright headed) se rellenaron 13 campos nuevos
    (meta title, botón y título del diálogo Contact, título del paso 2, badges de services y dashboard,
    pill, "Choose {name}", títulos de testimonios y FAQ, eyebrow y línea de contacto del CTA final) y se
    subió un WebM a services → **Guardar**.
  - En la DB: los valores nuevos quedaron guardados y **las URLs y `commission` ocultas se conservaron
    intactas** (`https://www.centralhill.pt/en/owners`, 15/18/22/25 %).
  - `/en/owners` y `/pt/owners` mostraron los 12 textos y el `<title>`; "Choose {name}" se pintó
    como "S7 Pick Core"; el `<video>` de services se reprodujo desde R2 (`readyState` 4, en marcha).
  - Restauración: la fila volvió a la instantánea (`data` idéntico, `updated_at` y OG originales); el
    objeto de R2 y la fila `media_asset` de prueba se borraron (URL pública → 404; 151 assets, como
    antes). La web desplegada no llegó a mostrar los textos de prueba: su caché `page:owners` es
    independiente de la del dev server local.

## Abiertos (para decidir después)

1. **WebP animado y Lottie en services/dashboard sin probar con subida real.** El vídeo sí se probó en
   PROD (ver "Verificación hecha"). Los otros dos tipos usan el mismo `sideMedia()` ya verificado en la
   Home. El Lottie además depende del CORS GET del bucket (Home, abierto nº 2).
2. **Buildings: el paso 1 del formulario sigue en inglés.** `buildings-listing.tsx` pasa sus propios
   textos del paso 1 (badge "Earn +25%", título, subtítulo, botón "Calculate My Earnings") en inglés
   fijo. Los labels, placeholders y los pasos 2 y 3 ya salen traducidos (verificado en `/pt/buildings`).
   Es código del slice `buildings`.
3. **`admin_hidden` disponible para la Home.** Resolvería su abierto nº 1 (ocultar
   `hero.cta_primary.url` y `guests_pitch.cta.url`). Aplicarlo es otra decisión.
4. **El formulario de estimación no envía leads** (`earnings_estimate`), y los enlaces `#` (botones
   "Choose" de los planes, banda "Not sure", T&C / Privacy) siguen muertos. El destino lo decide el sistema.
5. **Testimonios mezclados** (owner + guest), como antes. Filtrar por audiencia queda para después.
6. **Arco de traducción por pestañas** (`home-admin-editor.md` → "Modelo de traducción por pestañas"),
   incluido el id estable por fila para `stats`.
7. **Post-deploy: no hace falta nada.** No hay pre-carga ni escrituras directas en DB, y con los campos
   vacíos la página renderiza los fallbacks i18n. Basta el deploy del código, que regenera la página ISR.
8. **Inglés fijo fuera de la DB en PT/ES/FR** (no lo cubre este spec):
   - `alt` de las fotos de respaldo en `owners-page.tsx` (`HERO_FALLBACK_ALT`, `SERVICES_FALLBACK_ALT`,
     `DASHBOARD_FALLBACK_ALT`, `CTA_FALLBACK_ALT`), que sólo se usan mientras no hay asset;
   - `aria-label="Customer testimonials"` en `ui/components/testimonials-marquee.tsx`;
   - el submenú "Owners" del header (`OWNERS_SECTIONS` en `settings/ui/site-header.tsx`, slice
     `settings`), y también los de Real Estate y About.
   - El comentario de cabecera de `schemas/owners.ts` aún dice que las cifras salen de
     `company_settings` (obsoleto desde la migración 0009; sólo es un comentario).
