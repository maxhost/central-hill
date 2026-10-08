# Auditoría de consistencia visual y de componentes — 2026-10-07

Vuelta por todas las páginas públicas (en `en`; mismas plantillas en pt/es/fr) tras cerrar
`docs/plan-iconos-y-detalles.md`. Método:
- **Código:** dos revisiones de solo lectura de los 13 componentes de página. Cada sección se clasifica como `core/ui` / componente del slice / RAW.
- **Render:** estilos computados con Playwright a 1440 y 390 px, agrupados por rol (h1, h2, eyebrow, h3, botones, texto). Script en el scratchpad de la sesión.

Base de partida: ya no queda `.mk`, `mock.css`, `PAGE_STYLE`, CDN ni hex crudo en clases. Las 166 URLs dan 200 y ninguna imagen está rota.

## Lo que ya es consistente (medido)
- **h1 de hero:** igual en 8 páginas: Fraunces 68/71 px (40 px en móvil), crema. Home lleva 88 px a propósito (hero grande). Los 3 detalles (servicio, guía, post) comparten `DetailTitle`: 60 px (36 px en móvil).
- **h2 de sección (`SectionHead`):** 44 títulos en 11 páginas con la misma firma (50 px, 30 px en móvil). Las bandas oscuras también coinciden entre sí (5).
- **Eyebrow:** la misma tipografía y color en todas partes. Solo varía la separación con el título: 17 px normal; 10 px dentro de los `ContentBlock` de servicio y guía; 19 px en 3 casos.
- **Header y footer:** idénticos en todas las páginas.

## Verificado por el coordinador (bugs reales)
1. ✅ *Resuelto (`95a13cb`).* **Owners y Buildings sin JS:** el contenido de `Reveal` se queda en `opacity:0` (8/8 y 4/4 bloques). Guests, About y Services sí tienen el fallback `<noscript>`.
2. ✅ *Resuelto:* ahora apunta a `#estimate`, el calculador de la misma página. **Enlace roto** en `buildings-listing.tsx:138`: apunta a `/${locale}#owners`, sección que Home ya no tiene (ADR 0031).
3. **El formulario de Real Estate no envía nada:** `StaticFormCard` hace `preventDefault`. Ya existe `DealEnquiryForm`.
4. **Inglés fijo en el listado de Guides:** eyebrow "Explore the City" (`:98`) y todo el `CenteredCtaBand` (`:140-143`).
5. ✅ *Resuelto (ADR 0035):* un único botón, el `.btn` del mock (3 px, 14 × 28; `sm` 11 × 20), en todos los sitios. Medido después: solo quedan dos firmas (52 px y 46 px), más el "Search" del widget de Avantio. **Dos sistemas de botón en el contenido:** `ButtonLink` usa 6 px de radio y 44–46 px de alto. `ActionBand`, `SplitCtaPanels`, `AsideCta` y el CTA del `BodyRenderer` llevan botones propios (3 px de radio, 52 px de alto). Se ve en "Check availability" (edificio), los CTA de Guests, "Browse apartments" (guía) y "Get a free estimate" / "List your property" (post).

## Hallazgos de las revisiones de código (sin verificar uno a uno)

### Alta (se ve)
- **Cierre de página:** el mismo rol lo resuelven 7 componentes distintos:

  | Página | Componente |
  |---|---|
  | Home | `DualCtaPanels` |
  | Guests | `SplitCtaPanels` |
  | Owners | `FeatureCtaBand` |
  | Buildings | `FeaturePanel` |
  | Detalle de edificio | `ActionBand` |
  | Services | `FeatureCtaBand` |
  | Guides y Blog | `CenteredCtaBand` |
- **Cabecera de listado:** Services y Guides usan `Hero`; Blog usa `PageHead`.
- **Sección "relacionados" en los 3 detalles:**

  | Detalle | Fondo | Columnas | Separación | Otros |
  |---|---|---|---|---|
  | Servicio | normal | 4 | 22 px | — |
  | Guía | banda alt | 3 | 26 px | botón "All guides" |
  | Post | normal | 3 | 26 px | `SectionHead flush mb-[34px]`, después de la newsletter |
- **Detalle de edificio:**
  - La sección de apartamentos es RAW: título propio en lugar de `SectionHead` (`:395-425`).
  - Breadcrumb y badge "New" también son RAW.
  - La FAQ está rehecha a mano (`:451-459`) en lugar de `FaqSection`.
  - `SpecStrip` va dentro del `Container` de 1280 px, desalineado con las secciones de 1240.
- **Listado de Buildings:**
  - La rejilla de tarjetas y el calculador son RAW.
  - Usa el `Section`/`Container` antiguos (64–160 px, `max-w-7xl`) y una banda alt al 26 % (lo estándar es 38 %).
  - Cifras fijas en el `StatBand` ("400,000+", "€55M+") que pueden desfasarse de Settings.
  - Página entera en inglés fijo.
- **Listado de Blog:** las pestañas y el post destacado usan `pt-[48px]` / `pt-[52px]` sin padding inferior. `SectionHead` va con `flush mb-[34px]` / `[28px]` frente a los 54 px por defecto.
- **Breadcrumbs de los detalles:**
  - Guía y post enlazan dos migas a la misma URL.
  - El JSON-LD tampoco coincide: el servicio tiene 2 elementos y no incluye Home; la guía tiene 4, con una URL repetida.
- **Real Estate:** el texto del badge sale dos veces (`badge` y `cta.note` iguales, `:238/242`, `:290/293`).
- **`AsideCta`:** con foto en la guía y sin foto en el post.
- **Byline del post:** es RAW (`blog-post.tsx:172-183`).

### Media (patrón de código)
- **Anclas:**
  - `scrollMarginTop: 130` en línea: 9 en Owners y 1 en Real Estate (`:416`; el resto de esa página usa 84).
  - Guía y blog usan 96 px; `ContentBlock` usa 84 px.
  - En la guía, `scroll-mt-[96px]!` y `mt-0! border-t-0! pt-0!` sobre `AsideCta`. El blog ya usa el prop `divided`.
- **Constantes copiadas:**
  - Por todos los slices: `SECTION_SHELL`, `SECTION_WRAP`, `ALT_BAND`, el degradado del hero `rgba(18,16,13,…)` (5 copias), `gallerySizes`, `META_TAG` y la carcasa de tarjeta (hover + sombra, 4 copias).
  - Párrafo de prosa `max-w-[66ch] text-[17px]` en 3 sitios; el `<article>` del blog es de 68ch.
- **Componentes de `core/ui` con `<h2>` propio:** `EditorialSplit`, `StepGallery`, `FeatureCtaBand`, `ProseSection` y `ActionBand` (no usan `SectionHead`).
- **Botones fuera de `ButtonLink`:** el "Book Now" del header.
- **`Reveal`:** en los listados solo lo usa Services; Guides y Blog son estáticos. En Home, la FAQ no lleva `Reveal`.
- **i18n fijo en inglés:**
  - Owners: `SERVICES_BADGE` y `DASHBOARD_BADGE`, la banda final y las etiquetas de `ContactDialog`.
  - `deal-enquiry-section.tsx` entero.
  - Las etiquetas de la oficina en About.
- **Datos fijos:** la línea de contacto en Owners y Buildings (Home y Guests la leen de Settings). El formulario de estimación de Buildings tiene los props fijos (Owners los lee del CMS).

### Baja
- `→` en unas etiquetas de CTA sí y en otras no.
- El eyebrow de testimonios y portfolio se ve en unas páginas y en otras no.
- Iconos de bullet a 24 px en Home y 26 px en el resto.
- Estrella del servicio a 15 px; las demás a 16 px.
- El fallback `<noscript>` está escrito de dos formas.
- Estados vacíos con alineación distinta.
- Sombras `rgba` crudas.
- `pt-[50px]` en la sección Story de About.
