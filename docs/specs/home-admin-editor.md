# Spec + plan — Admin Home editable sección a sección

**Fecha:** 2026-10-11 (rev. 2, con las decisiones del owner) · **Slice principal:** `pages` · **Estado:** **completado (2026-10-11)** — ver "Estado final" al final

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

---

## Estado final (2026-10-11)

Todas las sesiones están entregadas. Commits:

| Sesión | Commit | Qué entró |
|---|---|---|
| Spec | `60394f6` | Este documento + plan por sesiones |
| S1 | `bd76f81` | `accept` en el nodo `media` (`.meta({ media_accept })`); `hero.video_media_id` opcional y sólo vídeo (Home y Guest); rechazo en cliente (`media.wrongType`) |
| S2 | `45c3b93` | `admin/layout.ts` con las 8 tarjetas (`id` estable) + "Otros"; notas con enlaces; Guardar bloqueado mientras se preparan medios (`isPreparing`) |
| S2 (seguimiento) | `f9eb9d3` | El mismo bloqueo de Guardar en los otros 7 formularios con medios (Settings, Buildings, Apartments, Blog post/autor, Services, Cities) |
| S3 | `b8556af` | `seo.*` + `buildHomeMetadata`, `hero.eyebrow`, `stats.title`, `portfolio.*`, `faq.title`, `guests_pitch.badge.*`; fallback i18n (`orMessage`); etiquetas legibles del editor |
| S4 | `ae81fad` | `hero.poster_media_id` (`getImageProps`, w=1920, preload) + `scripts/backfill-home-stats.ts` |
| S5 | `d60c838` | `statFigure` en `_shared.ts`, `stats.figures` 0–8 con "+ New figure", `StatBand.columns` 1–5; la Home deja de leer las cifras de Settings |
| S6 | `6a48a1f` | Medio lateral del pitch: MP4/WebM, WebP animado (sin aplanar) y Lottie `.json`/`.lottie` (ingest con validación, tile "Lottie", player diferido) |
| S7 | — | Documentación: `pages/README.md`, `backoffice/README.md`, `docs/data-model.md`, `docs/architecture.md` (tipos de medio), `docs/specs/r2-runbook.md` (A5), `home-component-library/03-stat-band.md`, enmienda a ADR 0031 y este cierre |

### Verificación hecha

- **S1:** subida real de un MP4 al hero → objeto en R2 → guardar → la Home lo muestra tras la
  revalidación.
- **S6:** subida real de un MP4 y de un WebP animado al medio lateral del pitch: ambos se guardan y se
  reproducen (el WebP conserva sus 12 frames).
- **Lottie:** subida + validación verificadas contra R2 con un `.lottie` real (el rechazo y borrado
  de un archivo que no es Lottie está cubierto por tests de `core/media`). La reproducción en la página pública queda bloqueada **sólo**
  por el CORS del bucket (la URL pública `r2.dev` no envía `Access-Control-Allow-Origin` y el player
  hace `fetch`). **Aceptado por el owner como superado.**
- **S7 (repaso final):** con los 9 textos nuevos rellenos desde el admin, `/en` y `/pt` muestran los 8
  visibles y el `<title>` cambia (el título de FAQ no se pinta porque la Home no tiene grupo FAQ
  elegido, comportamiento esperado); al vaciarlos, ambos idiomas vuelven a sus textos i18n y la fila
  `home` queda idéntica a la instantánea previa. Con los campos vacíos la Home es igual a la de antes
  del spec (comprobado en S3–S5 en los 4 idiomas).
- typecheck + lint + tests básicos de la superficie tocada en cada sesión (incl. los tests de entradas
  de medios: qué acepta y qué rechaza cada campo).

## Abiertos (para decidir después)

1. **URLs editables en el admin de la Home.** `hero.cta_primary.url` y `guests_pitch.cta.url` siguen
   en el formulario, frente a la decisión del owner de "URLs no editables". Decidir si se ocultan del
   editor y pasan a fijas en código (como el botón secundario del hero).
2. **CORS GET del bucket R2.** Hace falta una regla GET/HEAD con los orígenes del sitio para que el
   Lottie se reproduzca en producción (`docs/specs/r2-runbook.md` → A5). Hasta entonces, no usar
   Lottie en la Home pública.
3. **Galería con selección múltiple:** si falla una parte de la selección, los archivos que sí se
   reservaron quedan en cola como huérfanos.
4. **Todo WebP del campo del pitch se sirve sin optimizar** (`unoptimized`), animado o no: el asset no
   tiene marca de "animado". Opción: guardar esa marca en el ingest (ya se detecta) y optimizar sólo
   los WebP estáticos.
5. **WASM de dotLottie desde jsdelivr.** `@lottiefiles/dotlottie-web` descarga su renderer WASM de un
   CDN externo; se podría servir desde el propio sitio.
6. **Arco de traducción por pestañas** (modelo ya descrito arriba), incluido el **id estable por fila**
   para listas variables (`stats.figures`) para que las traducciones no se desalineen al borrar o
   reordenar filas en EN.
7. **Paso post-deploy:** pulsar **Guardar** (sin cambios) en `/admin/pages/home` para que aparezca la
   banda de cifras. El script de pre-carga escribe directo en la DB y la lectura cacheada (tag
   `page:home`, sin `revalidate` por tiempo) no lo ve hasta que se invalida el tag.
