# Spec + plan — Admin Home editable sección a sección

**Fecha:** 2026-10-11 (rev. 2, con las decisiones del owner) · **Slice principal:** `pages` · **Estado:** aprobado para implementar

## Objetivo

Que **todo** lo visible de la Home (textos, botones, imágenes, vídeos, iconos y SEO) que no sea un
componente de catálogo (buscador Avantio, tarjetas de edificios, tarjetas de servicios, preguntas FAQ)
se pueda editar desde `/admin/pages/home`, y que el formulario **siga el orden de la página, sección a
sección**.

**Regla de oro de este cambio: sólo se añade.** No se quita ni se renombra ningún campo existente de
`page_content.data`. Todos los campos nuevos son **opcionales**: vacíos, la página se ve como hoy (texto
i18n actual / foto actual). La única excepción deliberada es la banda de cifras (ver S5). No hace falta
migración: `data` es jsonb y el editor ya rellena las claves ausentes (`applyDefaults`).

**Autorización (owner, 2026-10-11):** los cambios fuera de `pages` listados abajo (kernel `core/media`,
`core/ui`, slice `backoffice`, shell `src/app`, dependencia nueva para Lottie) **no requieren ADR aparte**;
quedan autorizados por este spec. Se documentan en el README de cada zona tocada.

## Cómo se publica

Guardar en el admin **no** dispara un build vía GitHub. `savePage` → `revalidatePage("home")`
(`src/slices/pages/server/publish.ts`) invalida el tag `page:home` y hace `revalidatePath` de `/en`, `/pt`,
`/es`, `/fr`: regeneración ISR on-demand, en segundos, sin deploy. Todos los campos nuevos viven en
`page_content.data`, así que quedan cubiertos sin tocar nada. Sólo el **código** de este spec necesita
deploy.

---

## Diagnóstico: por qué no se puede subir el vídeo del hero

No es un límite de tamaño. `core/media/server/ingest.ts` ya acepta `video/mp4` y `video/webm` hasta
**200 MB**, con subida directa navegador → R2. El fallo está en el editor: `schema-fields.tsx` renderiza
`<MediaField>` **sin** `accept`, y `MediaField` usa por defecto `accept="image"`. Por eso el diálogo de
archivos sólo deja elegir imágenes, también para `hero.video_media_id`.

Además, `hero.video_media_id` es hoy `mediaId` **obligatorio**. Pasa a opcional (`""` = vídeo de
respaldo), lo que relaja la validación sin romper datos existentes.

---

## Modelo de datos: añadidos a `homeSchema` (`src/slices/pages/schemas/home.ts`)

Columna **Clase**: `T` = texto traducible (por idioma). `C` = compartido entre idiomas (se edita en EN).
Ver "Modelo de traducción por pestañas".

| Sección | Campo nuevo | Tipo | Clase | Vacío → |
|---|---|---|---|---|
| SEO | `seo.meta_title` | `seoShape.meta_title` (tStrOpt 70) | T | i18n `pages.home.metaTitle` |
| SEO | `seo.meta_description` | `seoShape.meta_description` (tStrOpt 200) | T | i18n `pages.home.metaDescription` |
| SEO | *(ya existe)* `og_image_media_id` (columna) | imagen | C | sin OG |
| Hero | `hero.eyebrow` | tStrOpt 60 | T | i18n `pages.home.heroEyebrow` |
| Hero | `hero.poster_media_id` | imagen opcional | C | póster de Unsplash actual |
| Hero | `hero.video_media_id` | **pasa a opcional** (`"" \| uuid`) | C | vídeo de Pexels actual |
| Cifras | `stats.title` | tStrOpt 160 | T | i18n `pages.stats.title` |
| Cifras | `stats.figures` | lista **0–8** de `statFigure` | número C · `label` T | **sin filas → no se muestra la banda** |
| Pitch huéspedes | `guests_pitch.badge.label` | tStrOpt 120 | T | `guests_pitch.cta.note` (como hoy) |
| Pitch huéspedes | `guests_pitch.badge.icon_key` | icono opcional | C | `check` |
| Pitch huéspedes | `guests_pitch.image_media_id` | **acepta además** MP4/WebM, WebP animado y Lottie (`.lottie` y `.json`) | C | foto de Unsplash actual |
| Portfolio | `portfolio.title` | tStrOpt 160 | T | i18n `pages.portfolio.title` |
| Portfolio | `portfolio.cta_label` | tStrOpt 80 | T | i18n `pages.portfolio.viewAll` |
| Portfolio | `portfolio.card_view_label` | tStrOpt 40 | T | i18n `pages.portfolio.view` ("View →") |
| FAQ | `faq.title` | tStrOpt 160 | T | i18n `pages.faqTitle` |

Notas:
- **Cifras.** `statFigure` se mueve de `schemas/owners.ts` a `schemas/_shared.ts` (mismo slice) y se
  reutiliza: `label` (texto), `to` (número, sólo dígitos), `prefix` / `suffix` opcionales ("€", "+",
  "M+") y `group` (separador de miles). Owners sigue con sus 4 fijas; la Home usa `between(statFigure, 0, 8)`.
- `faq_group_key` **se queda donde está** (raíz de `data`). `faq.title` va en un objeto aparte y el editor
  junta los dos en la misma tarjeta.
- Los textos nuevos son `tStr` / `tStrOpt`, así que entran solos en `translatablePaths`.

### Regla de idioma hasta que exista el sistema de traducción (D1)

Por ahora **sólo se edita en inglés**. Un campo nuevo **vacío** usa el texto i18n actual (ya traducido a
los 4 idiomas). Un campo **relleno** se muestra con ese texto en todos los idiomas (comportamiento actual
del overlay: sin traducción aprobada, cae a EN), hasta que el sistema de pestañas permita traducirlo.

---

## Modelo de traducción por pestañas (futuro; este spec se prepara para él)

Así debe funcionar el editor cuando se implemente el sistema de traducción. No se construye en este spec,
pero lo que se haga aquí no debe impedirlo.

1. **Pestañas EN · PT · ES · FR** en cada página del editor (p. ej. `/admin/pages/home`). Cada pestaña
   muestra el formulario completo con los valores de su idioma.
2. **Textos (T): por idioma.** Un cambio de texto en EN se guarda sólo en EN y **no** se copia a PT/ES/FR.
   Cada idioma se traduce en su pestaña.
3. **Medios (imágenes y vídeos): compartidos.** Se editan en EN; al guardar EN se aplican a todos los
   idiomas. En PT/ES/FR se muestran como sólo lectura, con la nota "Se edita en EN".
4. **Botón "Traducir con IA" en cada sección** de las pestañas PT/ES/FR. Envía los textos EN de esa sección
   al LLM (`core/i18n/translate`) y vuelca la traducción **en el formulario** de la pestaña activa, sin
   guardar. El usuario revisa y guarda.
5. **Guardar es por pestaña.** Guardar en EN guarda los textos EN y los medios compartidos. Guardar en PT
   guarda sólo los textos PT (filas `translation`, `field = block:<path>`).
6. **Cambiar de pestaña no pierde lo editado.** El estado del formulario vive por idioma en el cliente
   (los 4 a la vez). Aviso de "cambios sin guardar" por pestaña y al salir de la página.

### Lo que este spec deja preparado

- **Cada campo está clasificado como T o C** (tabla de arriba). Las **secciones del layout** tienen un `id`
  estable: son la unidad del futuro botón "Traducir con IA".
- **Compartido (C), confirmado por el owner:** imágenes, vídeos e **iconos**. También la categoría de
  servicios y el grupo FAQ (son selectores, no texto).
- **Cifras:** la **cantidad de filas y el número** de cada fila son compartidos. El **texto** de cada fila es
  por idioma: EN "Bookings 65" y ES "Reservas 65" (mismo 65, etiqueta traducida).
- **URLs:** no se editan desde el admin de la Home (todas son navegaciones internas). Hoy el schema aún
  tiene dos campos de URL, `hero.cta_primary.url` (Avantio) y `guests_pitch.cta.url`. **No se quitan en
  este spec** (regla "sólo se añade"). Quedan como están (compartidos, en EN) y se decide aparte si se
  ocultan del editor y pasan a fijos en código como el botón secundario del hero.
- **Ajuste pendiente para el arco de traducción: filas variables.** Las traducciones se guardan por ruta con
  índice (`stats.figures.2.label`). Si en EN se borra o reordena una fila, las traducciones de PT/ES/FR de
  esa lista quedan desalineadas. El arco de traducción debe resolverlo (id estable por fila, o invalidar
  las traducciones de la lista al cambiar su estructura). Afecta a `stats.figures` y a cualquier lista
  variable futura.
- **Ajustes ya conocidos del pipeline:** `savePage` no escribe filas fuente y hay un desajuste de tags de
  caché. Ver `docs/plan-iconos-y-detalles.md` → "Fuera de este plan".

---

## Editor: formulario sección a sección (orden de la página)

Hoy el editor pinta una tarjeta por clave raíz de `data`, en el orden del schema. Se añade un **layout de
editor por página** (`src/slices/pages/admin/layout.ts`, sólo `home` por ahora). Define tarjetas con un
`id` estable, su orden y qué rutas de `data` contiene cada una. **Cualquier clave fuera del layout se pinta
al final en una tarjeta "Otros"**, así que nunca desaparece un campo.

| # | id | Tarjeta | Contenido | Nota informativa (sólo lectura) |
|---|---|---|---|---|
| 1 | `seo` | SEO y redes | meta title, meta description, imagen OG | contador de caracteres 70/200 |
| 2 | `hero` | Hero | vídeo, póster, antetítulo, título, subtítulo, botón principal (texto + URL), botón secundario (texto) | "El botón secundario siempre lleva a /owners" |
| — | — | *(Buscador Avantio)* | — | "Se configura en Settings" + enlace |
| 3 | `stats` | Cifras | título + lista de datos (**"+ Nuevo dato"** añade una fila: texto + número + prefijo/sufijo/miles; cada fila se puede quitar) | "Sin datos, la banda no se muestra" |
| 4 | `guests_pitch` | Pitch huéspedes | título, subtítulo, 4 beneficios, botón (texto, URL, nota), etiqueta flotante (texto + icono), imagen/animación lateral | hint de tamaños 4:5 |
| 5 | `portfolio` | Portfolio destacado | título, texto del botón "View all", texto del botón de la tarjeta | "Las tarjetas salen de Edificios (destacados, por posición)" + enlace |
| 6 | `services_carousel` | Partners & Services | antetítulo, título, 3 garantías, categoría | "Las tarjetas salen de Servicios" + enlace |
| 7 | `faq` | FAQ | grupo, título | "Las preguntas se editan en FAQ" + enlace |
| 8 | `dual_cta` | CTA doble final | panel propietario y panel huésped (imagen, antetítulo, título, texto, botón) | "Enlaces fijos: /owners y Avantio. La línea de contacto sale de Settings" |

El form-model ya admite listas variables con botón "+ añadir". Sólo se cambia la etiqueta del botón de
`stats.figures` a "+ Nuevo dato" (las etiquetas del admin, en los 4 idiomas).

### Selector de medios por campo

El nodo `media` del form-model gana una propiedad `accept`:

| Campo | `accept` | Admite |
|---|---|---|
| `hero.video_media_id` | `video` | MP4, WebM |
| `guests_pitch.image_media_id` | `animated` | JPG, PNG, WebP (incl. animado), AVIF, MP4, WebM, Lottie `.lottie` y `.json` |
| resto de `*_media_id` | `image` (como hoy) | JPG, PNG, WebP, AVIF |

Se declara en el schema (metadata de Zod en el campo) y el form-model la lee igual que hoy lee `.describe()`
para el hint. Sin metadata → `image`, así que ningún campo existente cambia.

### Textos de ayuda (hints, en inglés como el resto del admin)

- **Hero video:** "Background loop. MP4 (H.264), 1920×1080 (16:9), no audio, 10–20 s, ideally under 15 MB
  (max 200 MB)."
- **Hero poster:** "Shown while the video loads and when it can't play. Use a still from the video.
  1920×1080 (16:9), JPG or WebP, under 400 KB."
- **Guests pitch media:** "Portrait 4:5 — the frame is fixed at 4:5, so other ratios are cropped.
  Photo: 1200×1500 px (min 960×1200), JPG/WebP, under 500 KB. Video: MP4 (H.264), 1080×1350 or
  1200×1500, no audio, 6–15 s loop, under 10 MB. Animated WebP: 1200×1500, under 5 MB. Lottie (.lottie
  or .json): 4:5 canvas (e.g. 1200×1500)."
- **Datos de cifras:** se reutilizan los de Owners ("Count-up target, digits only…").

---

## Render público

- **Mapa de medios con `mime`:** `resolve.ts` ya lee `asset.mime`. Se añade a un tipo propio del slice
  (`PageMedia = MediaImageData & { mime }`).
- **Hero:** `poster` = asset de `poster_media_id`, optimizado con `getImageProps` de `next/image`; si falta,
  el póster actual. `eyebrow` = campo o i18n.
- **Cifras:** la Home deja de usar las cifras de empresa de Settings. `StatBand` recibe las filas de
  `stats.figures`, mapeadas con el mismo helper que Owners. **0 filas → no se pinta la banda** (título
  incluido). Las columnas en escritorio siguen al número de filas: 1–5 → N columnas; 6 → 3×2; 7–8 → 4
  columnas. En móvil sigue a 2. `StatBand.columns` (`core/ui`) amplía su unión de `3|4|5` a `1–5`; cambio
  aditivo, Owners/About no cambian.
- **Pitch huéspedes:** `TwoColumnShowcase` ya admite `badge` y `badgeIcon`. El nodo de imagen se elige por
  `mime`:
  - `image/*` → `MediaImage` (Next sirve el WebP animado sin optimizar; **verificar**);
  - `video/*` → `<video autoplay muted loop playsinline>` con `aspect-[4/5] object-cover`;
  - Lottie → isla cliente con carga diferida (el player sólo baja si hay Lottie), mismo marco 4:5.
- **Portfolio:** `FeaturedPortfolio` (de `pages`) gana la prop `viewLabel`. `title` y `ctaLabel` ya existen.
- **FAQ:** `title` = campo o i18n.
- **Metadatos:** `generateMetadata` lee `seo.*` y cae a i18n. Se construye en un helper del contrato de
  `pages`, y `src/app/[locale]/page.tsx` sólo lo llama.

## Cambios fuera de `pages` (autorizados por este spec)

| Cambio | Dónde |
|---|---|
| WebP animado: no aplanarlo al normalizar (`sharp` con `animated: true`, o saltar la normalización si es animado) | `core/media/server/ingest.ts` |
| Lottie como medio: mimes `application/json` (`.json`) y `application/zip` / `.lottie`, sin blurhash ni dimensiones de sharp; validar que el JSON es un Lottie (`v`, `w`, `h`, `layers`) | `core/media/server/ingest.ts` |
| `accept`: `video` y `animated` | `backoffice/ui/media-field.tsx` |
| Miniatura del admin para Lottie (etiqueta "Lottie", como hoy "Video") | `backoffice/ui/media-field.tsx` |
| Player Lottie: `@lottiefiles/dotlottie-web` (lee `.lottie` y `.json`), versión fijada, isla cliente diferida | `package.json` + componente en `pages` |
| `StatBand.columns` → `1 \| 2 \| 3 \| 4 \| 5` | `core/ui/stat-band.tsx` |
| Home llama al helper de metadatos de `pages` | `src/app/[locale]/page.tsx` |
| CORS del bucket R2: revisar que el dominio de producción esté en `AllowedOrigins` | config R2 (no código) |

---

## Plan por sesiones

Cada sesión es entregable sola y cierra con el DoD: typecheck + lint + tests de la superficie tocada, claves
i18n del admin en 4 idiomas y revisión adversarial. Sin commits sin OK explícito.

**Política de tests (owner, 2026-10-11):** nada de suites exhaustivas. Tests básicos sobre la superficie
tocada en cada sesión, con foco en los **inputs de medios**: qué tipos acepta cada campo (imagen, vídeo,
WebP animado, Lottie `.lottie` / `.json`) y qué rechaza, en el form-model, el `accept` del selector y el
ingest. Todo lo que corra una sesión (typecheck + lint + tests + verificación) cabe en **10–15 min como
máximo**.

**S1 — Vídeo del hero. Arregla lo que hoy está roto.**
- Nodo `media` con `accept`; `hero.video_media_id` → `video` y opcional. `MediaField` admite `accept="video"`.
- Prueba de punta a punta en el deploy: subir un MP4 real → objeto en R2 → guardar → `/en` y `/pt`
  muestran el vídeo nuevo tras la revalidación.

**S2 — Formulario sección a sección.**
- `admin/layout.ts` con las 8 tarjetas (`id` estable) + "Otros". Notas informativas con enlaces y tarjeta
  SEO arriba.

**S3 — Textos nuevos con fallback.**
- `seo.*` (+ helper de metadatos), `hero.eyebrow`, `stats.title`, `portfolio.{title,cta_label,card_view_label}`,
  `faq.title`, `guests_pitch.badge.{label,icon_key}`. Tests de fallback.

**S4 — Póster del hero.**
- `hero.poster_media_id` + `getImageProps`.

**S4 (cierre) — Pre-carga de cifras.** Ejecutar `scripts/backfill-home-stats.ts` al final de S4 (ver S5):
copia las 4 cifras actuales de Settings a `stats.figures` (EN: número + etiqueta; las etiquetas PT/ES/FR
existentes también, cuando la tabla de traducción lo permita). Es idempotente (no pisa filas ya cargadas).
⚠️ Entre la ejecución y el deploy de S5, guardar la Home desde el admin borraría esas filas (el schema de
S4 aún no las conoce y Zod descarta claves desconocidas): desplegar S5 justo después, o re-ejecutar el
script tras el deploy.

**S5 — Cifras editables en la Home.**
- `statFigure` → `_shared.ts`, helper de mapeo compartido con Owners, `stats.figures` 0–8 con
  "+ Nuevo dato", `StatBand.columns` ampliado.
- La Home deja de leer las cifras de Settings. Como el script de pre-carga ya corrió al final de S4, la
  banda no desaparece. Después se editan o borran libremente.

**S6 — Medio lateral animado del pitch.**
- 6a: MP4/WebM en el marco 4:5 + hint.
- 6b: WebP animado que sobrevive a la normalización (`core/media`).
- 6c: Lottie `.lottie` + `.json`: ingest, `accept`, miniatura del admin, player diferido.

**S7 — Cierre.**
- Recorrer la Home en los 4 idiomas con todo vacío (idéntica a hoy salvo cifras, ver S5) y con todo
  relleno.
- Actualizar `pages/README.md`, `docs/data-model.md` → home, READMEs de `core/media` / `backoffice` /
  `core/ui`, y este spec.

## Fuera de alcance

- Buscador Avantio, tarjetas de edificios (salvo el texto "View"), tarjetas de servicios y preguntas FAQ:
  vienen de sus propios catálogos.
- Enlaces fijos por diseño: botón secundario del hero → `/owners`, paneles del CTA doble → `/owners` /
  Avantio. Línea de contacto del CTA doble (Settings).
- Cifras de About, del listado de Edificios y del detalle de edificio (se quedan como están).
- El sistema de traducción por pestañas: sección de arriba, arco propio.

## Decisiones (resueltas 2026-10-11)

- **ADR:** no hacen falta ADR aparte; este spec autoriza los cambios fuera de `pages`.
- **D1:** por ahora sólo inglés; campo vacío → texto i18n actual.
- **D2:** Lottie en los dos formatos, `.lottie` y `.json`.
- **URLs:** no editables desde el admin Home por ahora; las dos existentes se mantienen (ver arriba).
- **D3:** sin casilla; la Home sólo muestra cifras si se cargan en su editor, en filas variables (0–8)
  con "+ Nuevo dato".
