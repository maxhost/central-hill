# Plan por sesiones: iconos (Iconoir) + detalle de blog y de guía

**Creado:** 2026-10-06. **Estado:** en curso (sesiones 0–3d hechas; sigue 4). Cada sesión es autocontenida: se puede hacer
`/compact` o `/clear` entre sesiones. Para retomar, basta con decir "seguimos con la sesión N de
`docs/plan-iconos-y-detalles.md`".

Reglas que aplican a todas las sesiones (ver `CLAUDE.md` y la memoria del proyecto):
- Sin commits ni push sin OK explícito; un commit por bloque.
- Consistencia > fidelidad al mock: si un componente de `core/ui` ya cumple ese rol en otra
  página, se copia su configuración.
- Modo coordinador cuando convenga: agentes en worktree que **nunca** commitean, máximo 2–4 a la
  vez; el coordinador junta, verifica, reinicia `pnpm dev -p 3011` y pide revisión.
- Verificación: `pnpm typecheck`, `pnpm lint`, tests del slice (`npx tsx --test …`), capturas
  Playwright a 1440 y 390 px contra la referencia (mock o "antes").
- Node 22.x es el runtime del repo (en local hoy hay 24.20.0; es una diferencia de entorno).

---

## Contexto (resultado de la investigación del 2026-10-06)

### Imágenes rotas en R2
67 de 151 `media_asset` (todos creados el **2026-10-03**, las fotos Pexels de las guías) dan 404
en `R2_PUBLIC_BASE_URL/<r2_key>`. Existen en el bucket bajo `central-hill-media/<r2_key>`: se
subieron cuando el endpoint local llevaba ese sufijo. Se ve, por ejemplo, en
`/en/guides/lisbon/beaches-near-lisbon` (hero y cabeceras de sección vacías).

### Iconos: situación actual (tres sistemas)
- **A. Clases `iconoir-*`** desde el CDN (jsDelivr, sin versión fija), cargadas vía el
  `@import` de `src/app/mock.css` (lo importan 7 rutas: about, blog, buildings, guests, guides,
  owners, services) y vía un `<link>` en `services/ui/service-detail.tsx`.
  - Nombre desde la DB: `guest-page.tsx` (`iconClass(icon_key)`); `service-card.tsx`
    (`service_category.icon`).
  - Nombre fijo en el código: `about-page.tsx` (ignora el `icon_key` de `audiences`),
    `services-listing.tsx`, `guide-card.tsx`, `guides-listing.tsx`, `recommendation-card.tsx`,
    `blog/.../post-meta.tsx`.
  - En `core/ui`: `page-head.tsx` (`iconoir-search` fijo); `chip-bar.tsx` (`icon` es un
    **string** de clase). `BenefitCards`, `PhotoFeatureGrid`, `IconFeatureGrid` y
    `CertificationCards` reciben un `ReactNode`.
- **B. Registro SVG** `src/slices/pages/ui/components/icon.tsx`: 27 claves, fallback `sparks`;
  12 de ellas no son de Iconoir (dibujadas a mano).
  - Nombre desde la DB: los benefits de Home (`blocks.tsx`), las assurances
    (`services-carousel.tsx`), `guests-section.tsx`.
  - Fijo por posición, **ignorando la DB**: `owners-page.tsx` (`WHY/SERVICES/DASHBOARD_ICON_KEYS`)
    y `real-estate-page.tsx` (`PARTNER_ICON_KEYS`).
- **C. SVG escritos a mano en el código**:
  - Real Estate: `CAPABILITY_ICONS` / `ASSET_ICONS`, que ignoran el `icon_key` de la DB.
  - Sprite de servicios: `service-icons.tsx` (`FACT_ICONS`, trazo 1.6).
  - Buildings: `building-detail.tsx`, con un check genérico para las amenities (ignora
    `amenity.icon`) más 4 `SPEC_ICONS`.
  - Chrome: carousel, form-card, two-column-showcase, header, locale switcher, contact dialog,
    owner-estimate-form, toast del admin.
  - El de WhatsApp se queda: es el logo de la marca.

### Opciones medidas
- **CSS global de Iconoir en `globals.css`:** 2,2–2,9 MB sin comprimir (167–250 KB gzip). Se
  cargaría en **todas** las páginas y en el admin, y bloquea el render. No tiene `@layer`, así
  que pisa `hidden`/`flex` de Tailwind. Una clave que no existe pinta un cuadrado relleno.
  **Descartado** por rendimiento.
- **`iconoir-react`:** cada icono es un `"use client"`. Buscar por nombre (claves de la DB)
  mete los 1.385 iconos en el cliente. **Descartado.**
- **Elegido (pendiente de aceptar el ADR):** componente `core/ui/icon.tsx`,
  `<Icon name="…" />`, server-only, generado desde los SVG de `iconoir/icons/regular`
  (1.383 iconos 24×24, trazo 1.5, ~734 B por icono). El SVG va inline en el HTML estático.
  Sin CSS, sin JS ni CDN. Unos 2–3 KB gzip por página. Valida el nombre y usa un fallback.
  Los componentes cliente reciben el icono como `ReactNode`.

### Datos que hay que corregir
- `chart` no existe en Iconoir: pasa a `graph-up` (`seed-demo`, migraciones 0005–0007 de
  Owners). Se arregla con datos o backfill; **no se editan migraciones**.
- `spark` existe, pero es otro dibujo distinto de `sparks` (el que se ve hoy).
- `pin` (de `FACT_ICONS`) es una chincheta: pasa a `map-pin`.
- `home` del registro dibuja `home-simple`.
- Owners y Real Estate empezarán a mostrar el `icon_key` de la DB: antes de activarlo, hacer
  un backfill con los nombres que se ven hoy.

### Mapeo de iconos sin equivalente exacto (a elegir a ojo)
`trending-up` → `stat-up`/`graph-up` · `calendar-lines` → `calendar` · `bar-chart` →
`stats-report` · `bell-alt` → `bell-notification` · `landmark` → `bank` · `trowel` → sin
equivalente (`tools`/`hammer`) · `buildings` → `city` · Real Estate `development`/`portfolio`
sin equivalente claro · dormitorios (puerta) sin equivalente · `lang` (bocadillo) →
`language`/`chat-lines`.

---

## Sesión 0: arreglar las 67 imágenes rotas de R2 *(requiere OK: escribe en el bucket)*
**✅ Hecha el 2026-10-06.** Se copiaron los 67 objetos y los 151 assets dan 200. Las 75 copias
con prefijo se dejan en el bucket (decisión del usuario).
- **Objetivo:** que todas las `media_asset` respondan 200 en su URL pública.
- **Pasos:**
  1. Script de un solo uso (en el scratchpad, no en el repo), con `CopyObject` de
     `central-hill-media/<key>` a `<key>` para los 67. No toca la DB.
  2. Verificar con HEAD que los 151 assets dan 200.
  3. Borrar las copias con prefijo (opcional, OK aparte). Incluye las 8 antiguas de
     bairro-alto-view.
- **Hecho cuando:** la guía `beaches-near-lisbon` muestra el hero y las cabeceras.
- **Commit:** ninguno (es una operación de datos). Anotarlo en la memoria.

## Sesión 1: ADR 0033 + componente `<Icon>` en `core/ui` (kernel)
**✅ Hecha el 2026-10-06** (ver ADR 0034). Cambios respecto a lo previsto:
- `iconoir` va en devDependencies y el mapa generado se commitea.
- `<Icon>` se importa desde `@core/ui/icon`, no desde el barrel (los componentes cliente lo
  importan).
- El `iconKey` estricto vive en `core/validation/icon-key.ts`: en `primitives.ts` metía la
  lista de nombres (~7 KB gzip) en el JS de todas las páginas públicas.
- `chart` pasó a `graph-up` en `seed-demo.ts` y en el test de `pages`.
- Backfill hecho en la DB: la fila `owners` tenía 3 `chart` y ahora tiene `graph-up`. Las 5
  páginas pasan el schema estricto.
- **Objetivo:** dejar listo el sistema único, sin migrar páginas todavía.
- **Pasos:**
  1. Pasar el borrador de `docs/parqueado.md` a `docs/decisions/README.md`.
     - **Número nuevo: 0034**, porque la 0033 ya está tomada ("Home's section components →
       core/ui").
     - Opción B (SVG inline en el servidor desde el paquete `iconoir`).
     - Arreglar de paso el índice del README, al que le falta la 0033.
  2. `pnpm add iconoir` (fijar versión; la investigada es 7.12.1).
  3. Script `scripts/generate-icons.ts` que genera `src/core/ui/icons/iconoir-map.ts`
     (`import "server-only"`; nombre → contenido SVG). Commitear el mapa generado o generarlo
     en el build: decidirlo en el ADR.
  4. `src/core/ui/icon.tsx`:
     - API `<Icon name size? strokeWidth? className? title? />`, con `aria-hidden` por defecto;
     - nombre inválido → `sparks` + `console.warn` en dev;
     - exportar `ICON_NAMES` / `isIconName`.
  5. `core/validation/primitives.ts` `iconKey`: validar contra `ICON_NAMES`.
  6. Tests: nombres válidos/inválidos y fallback.
  7. Verificar que el mapa **no** llega al cliente: `pnpm build` y grep de un path de icono en
     `.next/static`. Medir el tamaño del bundle del servidor.
- **Hecho cuando:** `<Icon name="sparks" />` se renderiza en una página de prueba y el mapa no
  aparece en los chunks del cliente.
- **Commits:** ADR · dependencia + generador + componente + validación.

## Sesión 2: migrar iconos, lote 1 (las páginas con iconos desde la DB)
**✅ Hecha el 2026-10-06.** Cambios respecto a lo previsto:
- Hecho por el coordinador solo (sin agentes): eran ~15 ficheros.
- `service-icons.tsx` se borró ya (nadie más lo usaba). Las rutas de Services, Guests y About
  ya no importan `mock.css`.
- `FACT_ICONS`: `pin` → `map-pin`; el schema sigue aceptando `pin` y lo normaliza al leer.
  Backfill de los 3 `detail` (en) con `pin`, y `seed-services` actualizado.
- Home: backfill `home` → `home-simple` y `spark` → `sparks` (lo que se veía), y `seed-demo`.
- **About, paso 5 no hecho:** About no lee `page_content` para nada (todo el copy es fijo) y sus
  12 `icon_key` son `spark` de relleno. Los iconos fijos pasan a `<Icon>`; conectar About a la
  DB es otra tarea.
- Cambios visibles: el hecho "idiomas" pasa del bocadillo al globo de Iconoir `language`; la
  estrella de la valoración es `star` relleno.
- **Páginas:** Home (registro B), Guests (A), Services listing + detail (A + sprite C), About (A).
- **Pasos:**
  1. Reemplazar `iconClass` / `<i class="iconoir-…">` / `<Icon>` del registro / el sprite de
     servicios por `core/ui` `<Icon>`.
  2. Fijar el tamaño con `size` (no `text-*`).
  3. Quitar el `<link>` de Iconoir de `service-detail.tsx` y el `ICONOIR_CSS`.
  4. `FACT_ICONS`: mapear a nombres de Iconoir. `pin` → `map-pin`: migración de datos en el
     seed y en el JSON `detail`.
  5. About: leer el `icon_key` de `audiences` en vez de los fijos.
  6. Capturas antes/después a 1440, 980 y 390 px. Revisar el trazo (1.5) y el tamaño.
- **Modo:** se puede repartir en 2 agentes en worktree (pages / services).
- **Commits:** uno por página.

## Sesión 3: migrar iconos, lote 2 + datos + adiós a `mock.css`
**✅ Hecha el 2026-10-06.** Cambios respecto a lo previsto:
- Hecho por el coordinador, con un agente solo para los docstrings de `core/ui` (solo comentarios).
- Mapeos elegidos a ojo con una hoja de comparación (glifo antiguo vs candidatos):
  - Owners: services `camera`/`calendar`/`wrench`/`stat-up`; dashboard `dollar-circle`/
    `calendar`/`stats-up-square`/`bell`. `why` ya coincidía.
  - Real Estate: partners `bank`/`ruler-combine`/`city`/`send`; capabilities `graph-up`/
    `settings`/`shield-check`; assets `home`/`building`/`city`/`group`/`edit-pencil`/
    `stats-up-square`.
  - Buildings specs: `house-rooms` (dormitorios), `bed`, `user`, `maximize` (tamaño).
- Backfill en la DB de `owners` y `real_estate` con esos nombres (copia previa en el
  scratchpad); `seed-demo` y `defaultCapabilities` igual.
- Amenities: tenían `icon` nulo. Backfill de las 8 (`wifi`, `air-conditioner`, `elevator`,
  `cutlery`, `washing-machine`, `tv`, `key`, `city`); sin `icon` se pinta `check-circle`.
  `amenityInput.icon` pasa al `iconKey` estricto (+ test).
- `ChipBar.icon` y `PageHeadSearch.icon` son `ReactNode` (el padre server pasa `<Icon>`).
  El chip "Lisbon" pasa de `pin` (chincheta) a `map-pin`, como en la sesión 2.
- `GuideCard`: el `<Icon>` necesita `align-baseline` (el preflight de Tailwind pone
  `vertical-align: middle` a los `svg`); sin eso la tarjeta quedaba 7,6 px más baja.
- Todos los nombres de icono de la DB son válidos.
- Verificado: alturas de página idénticas antes/después a 1440 y 390 en las 7 páginas.
- **No hecho:** el chrome (carousel, form-card, two-column-showcase, settings) y el selector de
  iconos del admin: pasan a las sesiones 3b y 3c.
- Hay que reiniciar `pnpm dev` borrando `.next/dev/cache/fetch-cache` tras un backfill por SQL:
  las consultas van con `unstable_cache` y no hay endpoint de revalidación.
- **Páginas:**
  - Owners y Real Estate (leer `icon_key` de la DB; backfill previo con los nombres actuales).
  - Buildings detail (`amenity.icon` + specs).
  - Blog (`post-meta`), Guides (`guide-card`, `recommendation-card`, listing).
  - `core/ui` `ChipBar` (`icon` pasa de string a `ReactNode`, ajustar los callers) y
    `PageHead` (search).
  - El chrome opcional: carousel, form-card, two-column-showcase, settings.
- **Datos:**
  - Backfill de `chart` → `graph-up`, `spark` → `sparks` donde corresponda.
  - Revisar que todo `icon_key` de la DB sea válido antes de activar la validación estricta.
- **Limpieza:**
  - Quitar los 7 `import "../../mock.css"` de las rutas.
  - Borrar `src/app/mock.css` cuando nada lo use.
  - Borrar el registro `pages/ui/components/icon.tsx` y `service-icons.tsx`.
  - Actualizar los docstrings de `core/ui` que mencionan `mock.css`.
- **Admin (opcional, puede ir en sesión aparte):** selector de iconos con vista previa en
  `category-form`, en los campos de los esquemas de pages y en el editor de servicios.
- **Hecho cuando:** `grep -r "iconoir-" src` solo encuentra el generador y el mapa, no hay CDN y
  ninguna ruta importa `mock.css`.
- **Commits:** uno por página/bloque + la limpieza.

## Sesión 3b: iconos de interfaz en Iconoir (enmienda al ADR 0034)
**✅ Hecha el 2026-10-07** (enmienda en el ADR 0034). Cambios respecto a lo previsto:
- `<UiIcon>` (`@core/ui`, también en el barrel) con 17 iconos (~1,2 KB gzip). Comparte el
  `<svg>` exterior con `<Icon>` (`icons/icon-svg.tsx`).
- En componentes server de las slices se usa `<Icon>` (header `user`, valoración, estrellas de
  testimonios, "★ New"/"Featured"); `<UiIcon>` solo en cliente y en `core/ui`.
- Props opcionales de icono: `ContactDialog.icon`, `LocaleSwitcher.icon`,
  `TwoColumnShowcase.badgeIcon`. `PropertyCard.badge` pasa a `ReactNode`.
- Admin: además de toast y nav-form, todos los ↑ ↓ ✕ de filas (body-editor, media-field,
  schema-fields, detail-editor, building-form) y el ✓/✗ de la cola de subidas. Los botones sin
  nombre accesible reciben `aria-label`/`title` con las claves ya existentes
  `backoffice.media.moveUp/moveDown/remove` (sin claves nuevas).
- Tamaños ajustados a ojo para igualar los glifos: cerrar 28 px, menú 20, estrellas de
  testimonios 0,9 em, valoración 12 px. Alturas idénticas antes/después en 8 páginas a 1440 y 390.
- Cambios visibles: el usuario del header pasa de relleno a contorno; globo `language`.
- **Se quedan como texto:** las flechas tipográficas `→`/`←` de CTAs y enlaces "volver"
  (son parte del texto), las ★ del admin de testimonios (una va dentro de `<option>`) y el
  `+`→`×` en CSS de `FormAccordion`/`FaqAccordion`. Pasarlos también es decisión aparte.
- **Por qué:** todo icono debe ser de Iconoir para que luego se pueda elegir desde el admin.
  Lo que queda dibujado a mano es interfaz, y varias piezas son componentes cliente, que no
  pueden importar `<Icon>` (server-only).
- **Decisión (OK del usuario, 2026-10-06):**
  - Enmienda al ADR 0034: un subconjunto **cliente** generado desde Iconoir con los iconos de
    interfaz por defecto (~15, ~5 KB): chevrons, plus/minus, xmark, user, mail, language,
    check, star y los de aviso del toast.
  - Cada componente cliente acepta además un icono opcional por prop (un `ReactNode` que dibuja
    el server). Así un icono elegido en el admin llega dibujado y el cliente no carga los 1.383.
- **Reemplazar:**
  - `core/ui`: carousel (flechas), form-card (chevron del select, +/− del stepper),
    `TwoColumnShowcase` (check de los bullets), `mobile-drawer` (`✕`/`☰`).
  - settings: header (user), contact-dialog (mail, `✕`), locale-switcher (globo, chevron),
    footer-newsletter (`✕`).
  - pages: owner-estimate-form (check final), services-carousel (estrella de la valoración).
  - backoffice: toast (4 avisos + cerrar), nav-form (`✕`).
  - Los `★` de texto ("New", "Featured") de hero, buildings y property-card.
  - Se queda el logo de WhatsApp (marca).
- **Hecho cuando:** no queda ningún `<svg>` a mano ni glifo de texto como icono fuera de
  `core/ui/icon*` y WhatsApp. Las capturas coinciden a 1440 y 390.

## Sesión 3c: iconos editables desde el backoffice + selector
**✅ Hecha el 2026-10-07** (enmienda 2 del ADR 0034). Decisiones del usuario: sprite en `/public`,
iconos de rol en Settings y About en una sesión aparte (la 3d).
- **Sprite:** `pnpm icons:generate` escribe además `public/icons/iconoir-7.12.1.svg` (un
  `<symbol>` por icono) y `ICON_SPRITE_URL` en `names.ts`. Solo lo carga el admin; un test
  comprueba que coincide con el mapa.
- **Selector:** `IconField` + `SpriteIcon` en `backoffice/ui/icon-field.tsx`, exportados en el
  contract junto a `MediaField`: buscador + rejilla de los 1.383 iconos. Las claves
  `backoffice.icon.*` están en los 4 idiomas. Se usa en:
  - todos los `icon_key` de los esquemas de pages (`form-model`: nodo `icon`; la etiqueta es
    "Icon");
  - el `icon` de las categorías de servicios (ahora `iconKey` estricto);
  - el icono de los key facts de servicios (cualquier nombre; desaparece `FACT_ICONS` con sus
    claves `factIcons.*`; `pin` se sigue leyendo como `map-pin`).
- **Site icons:** columna `company_settings.site_icons` (jsonb, migración 0015, aplicada en
  dev). Los valores por defecto están en `settings/site-icons.ts` y son lo que se veía antes;
  el read model rellena lo que falte o no sea válido. Se exponen como `SiteGlobals.icons` y se
  editan en Settings → "Site icons". Son:
  - header: cuenta, contacto e idioma;
  - el pin de ubicación (lugares + chip de ciudad);
  - el reloj del blog;
  - las 4 specs de apartamento;
  - un icono por plantilla de guía (sustituye a `TEMPLATE_ICON`).
- Verificado: los 4 tipos de página pintan los mismos SVG que antes; el sprite se dibuja en
  Chromium; typecheck y lint limpios; tests de settings, pages, services y core/ui en verde.
  Los 3 tests desfasados de settings-admin se arreglaron (al fixture le faltaban campos).
- **No hecho (pasa a la 3d):** los iconos de About, una pantalla de admin para las amenities
  (el `icon` se guarda y se valida, pero no hay dónde editarlo) y el badge de
  `TwoColumnShowcase` (ninguna página lo usa).

### Plan original de la 3c
- **Objetivo:** que todo icono de contenido se pueda elegir en el admin.
- **Hoy fijos en el código (pasan a `icon_key` en la DB + editor):**
  - About: los 12 `icon_key` existen pero no se leen. Va con conectar About a `page_content`.
  - Guides: el icono por plantilla (`TEMPLATE_ICON`) y el pin de los lugares.
  - Buildings: las specs de las tarjetas de apartamento.
  - Blog: el reloj de `PostMeta`.
  - `TwoColumnShowcase`: el check de los bullets sin icono.
  - Interfaz que tenga sentido editar (p. ej. el header, en settings).
- **Selector de iconos** con buscador y vista previa, en `core/ui` del admin. Lo usan
  `category-form`, los campos `icon_key` de los esquemas de pages, el editor de servicios y
  las amenities.
- Datos: migraciones aditivas donde haga falta un campo nuevo; backfill con lo que se ve hoy.
- **Modo:** coordinador + agentes por slice (pages, guides, buildings, blog, settings).

## Sesión 3d: About a `page_content` + amenities + iconos fijos que quedan
**✅ Hecha el 2026-10-07.** Cambios respecto a lo previsto:
- **About:** el schema `about` se reescribió con las secciones reales de la página (la fila era
  el placeholder del seed: nunca editada y sin traducciones). Añade `stats`, eyebrows, `badge`,
  imágenes opcionales (vacío → la foto del mock), `logo_media_id` en las certificaciones y
  `contact.cards` (destino fijo por posición). Son 15 `icon_key`, no 12: también los 3 de las
  tarjetas de contacto.
  - `defaultAbout` (lo que se veía) alimenta el seed, el fallback del render y
    `scripts/backfill-about-content.ts`. Backfill aplicado en dev; la copia previa está en el
    scratchpad. Si la fila (o una entrada de caché) no cumple el schema, se pinta `defaultAbout`.
  - Verificado: alturas, SVG, imágenes y enlaces idénticos antes/después en en/pt a 1440 y 390.
- **Amenities:** `/admin/amenities` (lista, alta, edición y borrado con confirmación), con la
  pantalla de categorías de servicios como modelo. Etiqueta (en), slug único, `IconField` (vacío →
  `check-circle`) y grupo. Revalida `building-list`. Lo hizo un agente en un worktree.
- **Iconos fijos → site icons** (su texto vive en mensajes i18n, no en filas):
  - `search` (blog);
  - grupo "Services": `services_how_1..3`, `service_included`, `service_badge`, `service_note`,
    `service_photos` y `know_included/cancellation/practical`.
  - La clave de caché de `getGlobals` lleva la lista de claves de site icons: sin eso, una entrada
    cacheada antes de añadir una clave la devolvía `undefined` (se pintaba `sparks`).
- **Se quedan fijos:** las estrellas de valoración (`star` relleno), el `percentage-circle` de la
  garantía de Guests y los iconos de interfaz de `UiIcon` (admin y chrome).
- About: conectar la página a su fila de `page_content` (copy + los 12 `icon_key`), con un
  backfill de lo que se ve hoy.
- Pantalla de amenities en el admin de buildings (etiqueta + `IconField`).
- Iconos que siguen fijos en el código, por decidir si van a site icons o a datos:
  - services listing (`chat-bubble`/`home-simple`/`headset`);
  - las columnas de "Good to know" (`check-circle`/`calendar`/`info-circle`);
  - `view-grid` del detalle de servicio;
  - la lupa del blog.

## Sesión 4: mocks del detalle de blog y de guía
- **Objetivo:** `mock/blog-post.html` y `mock/guide-detail.html`, aprobados por el owner.
- **Base:** los estilos y bloques de `mock/service-detail.html` (mismo esqueleto: título,
  galería, dos columnas con lateral fijo, bloques, cierre, relacionados). Los iconos son de
  Iconoir.
- **Blog post:**
  - `DetailTitle`: breadcrumb Home/Blog/Categoría, eyebrow = categoría, h1, tagline = extracto,
    meta = autor · fecha · lectura.
  - Portada con una foto (mosaic `n1`).
  - Dos columnas: a la izquierda el artículo (prosa de 68ch, encabezados con la tipografía de
    los bloques); a la derecha, un lateral fijo con "En este artículo" (índice de los h2/h3
    del body) + el CTA del post.
  - Cierre con `NewsletterSignup` (igual que el listado).
  - Relacionados con `SectionHead` + `JournalCard` (la tarjeta del listado).
- **Guía:**
  - `DetailTitle`: breadcrumb Home/Guides/Ciudad, eyebrow = ciudad, h1, intro.
  - Mosaic con el hero + las imágenes de sección.
  - Dos columnas: a la izquierda un bloque por sección (texto, imagen, "Local tip" como
    callout, rejilla de lugares con la tarjeta del listado `RecommendationCard`); a la derecha,
    un lateral fijo con "En esta guía" (índice de secciones con anclas) + un CTA de
    alojamiento (buildings).
  - Cierre con "Otras guías de {ciudad}" usando `GuideCard`.
- **Decidir en la revisión:** el contenido exacto de cada lateral, el comportamiento del
  índice en móvil y el texto de los CTA.
- **Commit:** los mocks aprobados.

## Sesión 5: componentes compartidos + montaje de los dos detalles
- **Pasos:**
  1. **El coordinador, primero, para evitar conflictos:**
     - `core/ui` `TocList` (índice con anclas, resalta la sección activa, sticky dentro de
       `StickyAside`);
     - `core/ui` `Callout` (tip/nota; unifica el "Local tip" y el bloque `callout` del blog);
     - ambos presentacionales, sin i18n.
  2. **Dos agentes en worktree en paralelo:**
     - **blog:** `blog-post.tsx` + restilizar `BodyRenderer` (ids en los headings para el
       índice);
     - **guía:** `guide-page.tsx` + la unificación `PlaceCard` → `RecommendationCard`.
     - Ambos con `DetailTitle`, `MosaicGallery adaptive`, `DetailLayout`, `StickyAside`,
       `ContentBlock`, i18n en los 4 idiomas y comparación con capturas contra su mock.
  3. **El coordinador:** juntar, verificar, reiniciar dev y pedir revisión.
- **Commits:** core/ui · blog · guía.

## Sesión 6: limpieza final y docs
- Borrar el código muerto detectado:
  - `apartments/ui/building-apartments.tsx` + `components/apartment-card.tsx` (nadie los usa);
  - `PostCard` / `PlaceCard` si quedan sin uso tras la sesión 5.
- Actualizar `docs/parqueado.md` (quitar el borrador de iconos), la memoria de progreso y
  `.glados/architecture/*`:
  - ambigüedad de los iconos resuelta;
  - `mock.css` eliminado;
  - las páginas de detalle con componentes.
- Revisar de nuevo todas las rutas públicas buscando restos del mock (el mismo método que la
  auditoría del 2026-10-06).

---

## Fuera de este plan (anotado)
- 16 tests unitarios desfasados respecto a los esquemas del admin (tarea recomendada para
  GLaDOS).
- Formulario de consulta de servicios sin fecha/huéspedes (slice leads).
- Fátima sin rating; Babysitting sin "/ hour".
