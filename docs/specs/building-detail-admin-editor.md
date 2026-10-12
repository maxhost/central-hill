# Spec + plan: admin anidado de Edificios → Apartamentos y detalle de edificio

**Fecha:** 2026-10-11
**Slices:** `buildings` (espacio de trabajo del edificio, formulario, detalle público) y `apartments` (lista y formulario dentro del edificio)
**Rutas:** shell `src/app`
**Estado:** S1–S3 entregadas; S4 (documentación) hecha; prueba real de guardado pendiente (QA del owner)
**Precedentes:** `docs/specs/buildings-admin-editor.md` (listado). La auditoría del detalle se presentó en el chat el 2026-10-11.

## Objetivo

Hoy hay tres pantallas sueltas: `/admin/buildings`, `/admin/amenities` y `/admin/apartments`. Los apartamentos se gestionan en una tabla global y se asignan con un selector de edificio.

El owner quiere un flujo **anidado**:

1. Se crean amenities, en su pantalla, que no cambia.
2. Se crean edificios.
3. **Dentro de un edificio** se edita el edificio y se crean y gestionan **sus** apartamentos.
4. **Dentro de un apartamento** se edita el apartamento.

Además:
- El formulario del edificio se reordena en el orden de la página pública `/[locale]/buildings/[slug]`, con textos de ayuda precisos.
- Se arregla el fallback `#book` del detalle (D7).

**La auditoría concluyó que todo el contenido propio del edificio ya es editable.** Los ~20 textos de plantilla (🔒 `buildings.*` y `apartments.*` en `messages/*.json`) son globales y **no se vuelven editables** (D1). Por eso **no hay `page_content` nuevo ni migración**.

## Decisiones (owner, 2026-10-11)

| | Decisión |
|---|---|
| D1 | Los textos de plantilla del detalle son globales y siguen fijos en i18n. No se editan. |
| D2 | (Sin efecto por D1.) Las migas tampoco se editan. |
| D3 | No hay overrides de texto por edificio. |
| D4 | **"Apartamentos" sale del menú.** Los apartamentos sólo se gestionan dentro de su edificio. |
| D5 | Amenities se queda **como está**: pantalla propia y sin creación rápida desde el edificio. |
| D6 | **No** se puede mover un apartamento a otro edificio. El edificio queda fijado al crearlo. |
| D7 | La banda final de reserva pasa a ser el ancla `#book`. Su CTA se oculta si el edificio no tiene URL de Avantio. |

**Decididas por el coordinador (revisables):**
- El orden de los apartamentos se cambia con ↑↓ en la lista del edificio, como en las FAQ. El campo numérico `position` sale del formulario, y un apartamento nuevo se añade al final.
- Las tarjetas de apartamento sin URL propia siguen apuntando a `#book`, que ahora baja a la banda con el botón del edificio. Hoy los 6 edificios tienen URL y ninguno de los 34 apartamentos la tiene.

---

## Arquitectura de información

```
Menú → Contenido
├─ Edificios      /admin/buildings                         lista (columna "Apartamentos": publicados / total)
│  ├─ Nuevo       /admin/buildings/new                     formulario del edificio (sin pestañas hasta guardar)
│  └─ {edificio}  /admin/buildings/[id]                    ESPACIO DE TRABAJO (layout común)
│     │           cabecera: ← Edificios · nombre · estado · "Ver en web ↗" (sólo si está publicado)
│     │           pestañas: [ Edificio ] [ Apartamentos (N) ]
│     ├─ Edificio      /admin/buildings/[id]                         formulario del edificio
│     └─ Apartamentos  /admin/buildings/[id]/apartments              lista del edificio + "+ Nuevo apartamento"
│        ├─ Nuevo      /admin/buildings/[id]/apartments/new          formulario (edificio fijado)
│        └─ {apto}     /admin/buildings/[id]/apartments/[aptId]      formulario (edificio fijado)
└─ Amenities      /admin/amenities                         sin cambios
```

**Rutas antiguas:** se mantienen como redirecciones, para no romper enlaces ni marcadores.

| Ruta antigua | Redirige a |
|---|---|
| `/admin/apartments` | `/admin/buildings` |
| `/admin/apartments/new` | `/admin/buildings` |
| `/admin/apartments/[id]` | `/admin/buildings/{building_id}/apartments/[id]` (o 404 si no existe) |

**Menú:**
- `apartmentsAdminScreens` pasa a ser `[]`, con un comentario que remite a este spec. El layout del panel no cambia.
- "Edificios" queda resaltado en todas las rutas anidadas, porque `admin-nav` ya compara con `startsWith`.

### Lista de apartamentos del edificio

| Columna | Contenido |
|---|---|
| Orden | Botones ↑ / ↓ (deshabilitados en los extremos) |
| Foto | Miniatura de la portada, o un hueco gris con el placeholder |
| Nombre | Enlace al formulario, más el badge si lo tiene |
| Estado | `StateBadge` (publicado / borrador / archivado) |
| Specs | `2 dorm · 3 camas · 4 huésp. · 65 m²` |
| Avantio | ✓ si tiene `avantio_url`; si no, "— usa la del edificio" |

- Si no hay apartamentos, `EmptyState` con el botón "+ Nuevo apartamento".
- Si el edificio está publicado y ningún apartamento lo está, aviso: "La sección *Apartments in this Building* no se muestra hasta que publiques al menos uno".

### Formulario del apartamento (dentro del edificio)

- Mismos campos que hoy menos **edificio** y **posición**: estado · nombre · badge · dormitorios / huéspedes / camas / m² · portada · Avantio (ID + URL).
- La cabecera muestra "← Apartamentos" (vuelve a la pestaña) y el nombre.
- Guardar un apartamento nuevo lleva a `/admin/buildings/[id]/apartments/{nuevo}`. Borrar lleva a `/admin/buildings/[id]/apartments`.
- **Textos de ayuda** (claves i18n de admin, en 4 idiomas):
  - portada: "Card photo, 4:3, at least 1200×900 px. Leave blank for the placeholder."
  - badge: "Short label on the card (e.g. *Terrace*). Leave blank for none."
  - Avantio URL: "Leave blank to use the building's booking link."

### Formulario del edificio, reordenado según la página pública

Sólo cambian el orden, las tarjetas (`AdminCard`) y los textos de ayuda. **Ningún campo nuevo y ningún campo eliminado.**

| # | Tarjeta | Campos (hoy) | Ayuda nueva (EN, 4 idiomas) |
|---|---|---|---|
| 1 | Estado | status, `is_featured`, `is_new` | `is_new` → "Shows the ★ New flag on the hero and the listing card." · `is_featured` → "Listing only." |
| 2 | Hero | name, slug, ciudad, barrio, dirección, portada | portada → "Hero background and card photo. Landscape 16:9, at least 2400×1350 px." · slug → "Changing it changes the public URL." |
| 3 | Galería | gallery | "Mosaic under the hero. Landscape 4:3, at least 1600×1200 px. The first photo is the large tile." |
| 4 | The Building | headline, `description_intro`, `description_neighbourhood` | headline → "Leave blank to use the building name." · párrafos → "One paragraph per line." · barrio → "Leave blank to hide *The Neighbourhood*." |
| 5 | Amenities | `amenity_ids` | "Create or rename amenities in Amenities." (con enlace) |
| 6 | FAQ | faq | "Leave empty to hide the FAQ section." |
| 7 | Reserva | `avantio_id`, `avantio_url`, `booking_enabled` | URL → "Book band button, and fallback for apartments without their own link." · `booking_enabled` → "Listing card links straight to Avantio instead of this page." |
| 8 | Tarjeta del listado | teaser | "Shown on the /buildings card and as the SEO description fallback." |
| 9 | Ubicación en mapa | latitude, longitude | "Not shown on the site yet." |
| 10 | SEO | `meta_title`, `meta_description`, OG image | OG → "1200×630 px. Leave blank to use the cover." |

En `/admin/buildings/new` el formulario es el mismo, sin el layout de pestañas. Al guardar lleva a `/admin/buildings/[id]`, como hoy.

---

## Render público (D7)

En `src/slices/buildings/ui/building-detail.tsx`:
- El `id="book"` sale de la línea "Booking powered by Avantio" y pasa a un wrapper `<div id="book" className="scroll-mt-[84px]">` alrededor de `ActionBand`, que siempre se pinta.
- Si `detail.avantio.url` es null: `ActionBand` va **sin** `cta` y **sin** `note` (la nota habla de Avantio).
- Las tarjetas sin URL siguen yendo a `#book`, que ahora baja a la banda.

En `src/core/ui/action-band.tsx`:
- `cta` pasa a ser **opcional**. Es un cambio aditivo: si falta, no se pinta la columna del botón. El resto no cambia.

## Datos y acciones

**Sin migración.** Todo usa columnas existentes.

| Pieza | Slice | Qué |
|---|---|---|
| `listApartmentsAdmin({ buildingId? })` | apartments | Filtro opcional. Añade `badge`, `bedsCount`, `sizeM2`, `hasAvantioUrl` y `cover` (preview) |
| `countApartmentsByBuilding()` | apartments | `Map<buildingId, { total, published }>`, para la columna de la lista de edificios |
| `moveApartment(id, "up" \| "down")` | apartments | Intercambia `position` con el vecino del **mismo edificio**, normaliza 0..n-1 y llama a `revalidateApartment` |
| `saveApartment` | apartments | Al crear, `position = max + 1` del edificio. Al editar, **rechaza** un `building_id` distinto del guardado (`validation`, campo `building_id`; D6). Revalida las rutas anidadas, no `/admin/apartments` |
| `deleteApartment` | apartments | Revalida las rutas anidadas |
| `getBuildingWorkspace(id)` | buildings | `{ id, name, status, publicPath }` para la cabecera |
| `BuildingWorkspaceHeader` | buildings (`admin/ui`) | Cabecera y pestañas. Recibe `apartmentsCount` por prop: buildings no lee apartments |
| `BuildingsAdminList({ apartmentCounts })` | buildings | La columna "Apartamentos" muestra `publicados / total` y enlaza a la pestaña |

**Composición sin cruzar internals entre slices:**
- Las rutas de `src/app` llaman a las queries de los dos slices y pasan los datos por props, igual que hoy `apartments/[id]/page.tsx` combina `apartments` con `listBuildingOptions()` del contrato de `buildings`.
- `buildings` no importa nada de `apartments`.

## Cambios fuera de los slices (autorizados por este spec)

| Cambio | Dónde |
|---|---|
| `layout.tsx` del espacio de trabajo y rutas anidadas `apartments/`, `apartments/new`, `apartments/[aptId]` | `src/app/(admin)/admin/(panel)/buildings/[id]/…` |
| Redirecciones de las rutas antiguas | `src/app/(admin)/admin/(panel)/apartments/…` |
| La lista de edificios recibe los conteos | `src/app/(admin)/admin/(panel)/buildings/page.tsx` |
| `cta` opcional en `ActionBand` (aditivo) | `src/core/ui/action-band.tsx` |
| Claves i18n de admin nuevas (pestañas, ayudas, avisos) en 4 idiomas | `messages/{en,pt,es,fr}.json` |

---

## Plan por sesiones

Un agente general-purpose por sesión. Después el coordinador:
1. revisa el diff;
2. ejecuta typecheck, lint y tests **comprobando él mismo el exit code**;
3. mira el admin real y la página pública con Playwright headed, **sin guardar**.

Cada commit necesita el OK del owner. El push, sólo cuando se pida.

**Política de tests:** básicos sobre la superficie tocada. Cada sesión cabe en 10–15 minutos.

**S1: espacio de trabajo del edificio.**
- `getBuildingWorkspace`, `BuildingWorkspaceHeader` y `layout.tsx` de `/admin/buildings/[id]`, con cabecera, pestañas y "Ver en web".
- `BuildingForm` sin su propia cabecera ni "← volver" dentro del espacio de trabajo (prop `variant: "new" | "workspace"`).
- `countApartmentsByBuilding` y la columna `publicados / total` en la lista de edificios.
- `apartmentsAdminScreens = []`.
- Pestaña Apartamentos: ruta creada con la lista filtrada simple (`listApartmentsAdmin({ buildingId })`).
- Tests: `countApartmentsByBuilding` y el filtro por edificio.

**S2: apartamentos dentro del edificio.**
- Lista completa: miniatura, specs, Avantio, ↑↓ con `moveApartment`, vacío y aviso de "ninguno publicado".
- Rutas `new` y `[aptId]` anidadas: 404 si el apartamento no es de ese edificio.
- `ApartmentForm` con el edificio fijado (sin selector ni posición), redirecciones nuevas y textos de ayuda.
- `saveApartment`: añade al final y rechaza el cambio de edificio.
- Redirecciones de `/admin/apartments*`.
- Tests: `moveApartment` (vecino del mismo edificio, extremos), posición al crear, rechazo del cambio de edificio.

**S3: formulario del edificio reordenado + D7.**
- Tarjetas en el orden de la tabla y textos de ayuda (4 idiomas).
- `ActionBand` con `cta` opcional, `#book` en la banda, sin CTA ni nota si no hay URL.
- Tests: `ActionBand` sin `cta` no pinta el enlace; el detalle sin URL no tiene `href="#book"` huérfano en la banda.

**S4: cierre.**
- Recorrido headed del flujo completo: edificios → edificio → pestañas → apartamento → volver, y redirecciones antiguas. **Sin guardar.**
- Actualizar `buildings/README.md`, `apartments/README.md`, los contratos (docs) y este spec (estado final).
- La prueba real de guardado (crear, reordenar y borrar un apartamento de prueba en PROD) sólo se hace con el OK del owner. Receta: instantánea → acción → verificar → restaurar.

## Fuera de alcance

- Editar los textos de plantilla del detalle (D1) y overrides por edificio (D3).
- Creación rápida de amenities desde el edificio (D5) y mover apartamentos entre edificios (D6).
- Mapa con lat/long, página propia de apartamento, galería por apartamento.
- Arco de traducción por pestañas.

---

## Estado (2026-10-11)

S1, S2 y S3 están entregadas. S4 está a medias: el recorrido de sólo lectura y la documentación están
hechos; falta la prueba real de guardado, que hace el owner. Commits:

| Sesión | Commit | Qué entró |
|---|---|---|
| Spec | `130f874` | Este documento + plan por sesiones |
| S1 | `2b779d0` | Espacio de trabajo `/admin/buildings/[id]` (`layout.tsx`): cabecera con "← Edificios", nombre, estado y "Ver en web ↗" (sólo publicado) + pestañas Edificio / Apartamentos (N); 404 si el edificio no existe. `getBuildingWorkspace`, `BuildingWorkspaceHeader`, `BuildingWorkspaceTabs`. `BuildingForm` con `variant: "new" \| "workspace"`. `countApartmentsByBuilding` y la columna `publicados / total` (enlaza a la pestaña); los conteos los compone la ruta, buildings no lee apartments. `apartmentsAdminScreens = []`. Pestaña Apartamentos con `listApartmentsAdmin({ buildingId })`. `admin/derive.ts` (`apartmentListWhere`, `tallyApartmentCounts`) + tests |
| S2 | `a20114a` | Lista completa del edificio (miniatura, specs, Avantio, ↑↓ con `moveApartment`, vacío y aviso de "ninguno publicado"). Rutas anidadas `apartments/new` y `apartments/[aptId]` (404 si el apartamento es de otro edificio). `ApartmentForm` con el edificio fijado, sin selector ni posición, y textos de ayuda. `saveApartment`: posición `max + 1` al crear y rechazo del cambio de edificio (D6); revalida las rutas anidadas. Redirecciones de `/admin/apartments*`. Helpers `nextApartmentPosition`, `sortApartmentSlots`, `planApartmentMove`, `isBuildingChange` + tests. Claves i18n en 4 idiomas |
| S3 | `897b3e1` | `BuildingForm` en 10 tarjetas en el orden de la página pública, con textos de ayuda (4 idiomas). `ActionBand` con `cta` opcional (aditivo, `core/ui`); en el detalle, `#book` envuelve la banda final, que va sin CTA ni nota si el edificio no tiene URL de Avantio (D7). Test de `ActionBand` |
| S4 | — | Recorrido de sólo lectura del flujo (coordinador) y documentación: `buildings/README.md`, `apartments/README.md`, comentario del contrato de `apartments` y este estado. **Pendiente:** prueba real de guardado |

`docs/vertical-slices.md` y `docs/architecture.md` no describen las rutas de admin de edificios ni de
apartamentos, así que no se tocaron.

### Desviaciones

- **El headline sigue siendo obligatorio**, así que no se añadió su ayuda "Leave blank to use the
  building name." (contradiría la validación). Decisión del owner pendiente (Abiertos nº 1).
- **La ayuda del slug es una clave nueva, `slugPublicHint`**, porque `slugHint` la comparte el
  formulario de amenities y no debía decir que cambia la URL pública.
- **El aviso de S2 también sale cuando un edificio publicado no tiene ningún apartamento**, no sólo
  cuando tiene apartamentos y ninguno está publicado: en los dos casos la sección no se muestra.
- **Los textos de ayuda reutilizan las claves `*Hint` que ya existían** (`coverHint`, `ogImageHint`,
  `avantioUrlHint`, `bookingEnabledHint`, `badgeHint`…) cambiando su texto, en vez de crear claves
  nuevas.
- **Se borraron 4 claves de sección muertas** (`identity`, `location`, `media`, `descriptions` de
  `buildings.admin.sections`), que dejaron de usarse con el nuevo orden de tarjetas.
- **El test de `#book` cubre `ActionBand`** (sin `cta` no pinta enlace ni nota) en lugar de renderizar
  `BuildingDetail`, que lee la DB. El detalle sin URL se comprobó en el recorrido.

## Abiertos

1. **¿Headline opcional?** Decisión del owner. Si se hace opcional, basta con relajar la validación y
   añadir la ayuda "Leave blank to use the building name.": el detalle ya cae al nombre
   (`detail.headline || detail.name` en `building-detail.tsx`).
2. **Prueba real de guardado pendiente — la hace el owner como QA** en PROD: crear, reordenar y
   borrar un apartamento de prueba, y guardar el formulario del edificio. Receta: instantánea de las
   filas → acción → verificar en el admin y en la página → restaurar.
3. **Claves i18n sin uso que se conservan:** `apartments.admin.fields.position`, `positionHint` y
   `fields.building` (el formulario ya no muestra esos campos). Se pueden borrar más adelante.
4. **`getBuildingWorkspace` se llama dos veces en la pestaña Apartamentos** (layout y página, para el
   estado del aviso). Aceptable: una consulta pequeña por id.
5. **Un `[id]` / `[aptId]` que no es UUID probablemente da 500 en vez de 404** (la consulta a Postgres
   falla con el uuid inválido). Es el patrón que ya existía en las rutas de admin.

### Verificación hecha

- **Por sesión:** typecheck + lint + tests en verde, con el exit code comprobado por el coordinador.
  57 tests de los slices tocados, 54 de `pages` y 3 de `action-band`.
- **Recorridos headed de sólo lectura (coordinador, Playwright), sin guardar:**
  - **S1:** pestañas Edificio / Apartamentos y su estado activo, cabecera con estado y "Ver en web",
    columna `publicados / total` y su enlace, 404 de un edificio inexistente.
  - **S2:** lista del edificio (miniaturas, specs, Avantio, ↑↓), formulario nuevo y de edición con el
    edificio fijado, redirecciones de `/admin/apartments*`, 404 de un apartamento de otro edificio.
  - **S3:** el formulario en 10 tarjetas en el orden de la tabla y la banda `#book` con su CTA en
    `bairro-alto-view`.
  - **S4:** recorrido completo por navegación real: menú → Edificios → fila → pestaña Apartamentos →
    apartamento → "← Apartments" → "+ New apartment" → pestaña Edificio → "← Buildings"; las
    redirecciones de `/admin/apartments` y `/admin/apartments/new`; `/admin/buildings/new` sin pestañas.
    Sin errores de página.
- **No hubo escrituras en PROD** (ni DB ni R2).
