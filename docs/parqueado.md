# Parqueado

Temas detectados y analizados, pero aplazados a propósito. Cada entrada explica cómo se retoma.
Una entrada con un ADR en borrador **no está aceptada**. Para aceptarla, se le asigna el número
definitivo y se mueve a `docs/decisions/README.md`.

---

## Título del `StatBand` (banda oscura) fuera del `SectionHead`

**Estado:** **parqueado** el 2026-10-05 (pendiente de decisión del usuario)

### Contexto
Al unificar los títulos de sección en `core/ui`'s `SectionHead` (Guests, Home, Owners, Buildings,
Real Estate), el único título que queda con el estilo antiguo (`text-3xl md:text-4xl`, crema) es el
de `StatBand` (`src/core/ui/stat-band.tsx`): "Numbers That Speak for Themselves" en Home
(`StatsBand`) y en el listado de Buildings. Owners renderiza `StatBand` sin título.

`SectionHead` solo tiene colores para fondo claro (`text-ink`, eyebrow `accent-deep`). Usarlo sobre
la banda oscura obligaría a sobrescribir colores desde fuera, que es justo el tipo de workaround que
la regla de consistencia descarta.

### Cómo se retoma
Añadir a `SectionHead` una variante para fondo oscuro (p. ej. `tone="dark"`: título
`text-on-feature`, eyebrow `feature-accent`) y usarla en el título de `StatBand`, quitando su `<h2>`
propio. Es un cambio en `src/core/ui/`, así que formalmente requiere ADR (regla de oro 3).

---

## ADR (borrador) 0033: Un único sistema de iconos, editable desde el backoffice

**Estado:** Propuesto · **parqueado** el 2026-10-05 (pendiente de decisión del usuario)

### Contexto
Al terminar de migrar Real Estate y Guests a componentes de `core/ui` (commits `ee670b7`,
`e4d530f`) vimos que el sitio usa **tres formas distintas** de pintar los iconos, todas a partir de
Iconoir:

| Sistema | Dónde | ¿El `icon_key` del backoffice cambia el icono? |
|---|---|---|
| **1. Hoja CSS de Iconoir** (`<i class="iconoir-…">`); se carga **solo** con el `@import` de jsDelivr dentro de `src/app/mock.css` | Guests, About, Services (listado y detalle), Blog, Guides; dentro de `core/ui`: `BenefitCards`, `PhotoFeatureGrid`, `IconFeatureGrid`, `ChipBar` | ✅ Sí, cualquier nombre de Iconoir |
| **2. Registro de SVG en línea** (`src/slices/pages/ui/components/icon.tsx`, ~27 paths copiados a mano) | Home, Owners, Real Estate `#partners` | ⚠️ Solo los nombres del registro; si no está, sale el icono genérico `sparks` |
| **3. SVG fijos por posición** en el código de la página | Real Estate `#capabilities`, `#manage`, `#process` (en `#process` son números) | ❌ No. El `icon_key` se guarda pero no se lee (`schemas/real-estate.ts`: *"stored but not rendered"*) |

Problemas que causa:
- **El cliente edita y no ve el cambio.** En Real Estate el `icon_key` se puede editar en el
  backoffice, pero la página lo ignora. En Home y Owners el cambio solo funciona con unos ~27 nombres.
- **Guests no puede dejar de importar `mock.css`.** La página ya está 100% en componentes, pero
  importa `mock.css` solo para conseguir la hoja de Iconoir (ver el README del slice `pages`).
- **Rendimiento.** Las páginas del sistema 1 dependen de una hoja CSS externa (CDN) que llega a
  través de un `@import` anidado. CLAUDE.md dice que "performance is the product".
- **Dos fuentes de verdad.** Los SVG del registro son copias a mano de Iconoir, y pueden quedar
  desactualizados respecto a la librería.
- `iconKey` (`core/validation/primitives.ts`) solo valida el formato kebab-case, no que el
  icono exista.

### Opciones
- **A. Hoja CSS de Iconoir global y separada de `mock.css`.** Se carga una vez (en el layout o por
  ruta) y todo usa `<i class="iconoir-{key}">`. Ventajas: es lo más simple, admite cualquier
  icono y no añade dependencias. Contras: sigue siendo CSS externo en cada página, y la hoja
  completa es pesada para los pocos iconos que se usan.
- **B. SVG en línea renderizado en el servidor a partir del paquete de Iconoir** (por ejemplo
  `iconoir-react`, o los SVG crudos del paquete `iconoir`). Un `<Icon name={icon_key} />` de
  `core/ui` resuelve el icono en el servidor (RSC/ISR), así que el SVG va directo en el HTML
  estático: sin CSS externo y sin JS de iconos en el cliente. Ventajas: admite cualquier icono,
  es lo más rápido y deja una única fuente de verdad. Contras: añade una dependencia (requiere este
  ADR) y hay que comprobar que las búsquedas dinámicas por nombre no metan la librería en el
  bundle del cliente.
- **C. Ampliar el registro manual (sistema 2) y usarlo en todo el sitio.** Ventajas: rápido y sin
  dependencias. Contras: el cliente solo puede elegir de la lista cerrada, y cada icono nuevo
  necesita que un desarrollador lo añada.

### Decisión propuesta
**B.** Un único componente `<Icon name={icon_key} />` en `core/ui`, renderizado en el servidor a
partir del paquete de Iconoir, sustituiría los tres sistemas. Además:
- **Real Estate y las demás páginas leerían siempre el `icon_key`** de la base de datos. Se
  eliminarían los SVG por posición (`PARTNER_ICON_KEYS`, `CAPABILITY_ICONS`, `ASSET_ICONS`),
  y los valores que hoy están fijos en el código pasarían a ser los `icon_key` por defecto.
- **Validación:** `iconKey` comprobaría que el nombre existe en Iconoir, con un fallback
  `sparks` para los datos antiguos.
- **Backoffice:** un selector de iconos con vista previa y búsqueda en lugar de texto libre (falta
  comprobar cómo se edita hoy el campo en `pages/admin/ui/schema-fields.tsx`).
- **Limpieza:** se quitaría el `@import` de Iconoir de `mock.css` y, cuando ninguna página lo
  necesite, el import de `mock.css` en la ruta de Guests.
- **Componentes:** los de `core/ui` que hoy reciben una clase `iconoir-*` (`BenefitCards`,
  `PhotoFeatureGrid`, `IconFeatureGrid`, `ChipBar`) seguirían recibiendo un `ReactNode`. Solo
  cambia lo que pasa quien los llama.

### Consecuencias
- El cliente podría cambiar cualquier icono, en cualquier página, desde el backoffice.
- Las páginas dejarían de depender de CSS externo para los iconos, y Guests (y las siguientes)
  podrían dejar de importar `mock.css`.
- Implica una dependencia nueva, un cambio en el kernel (`core/ui` y `core/validation`) y una
  migración por páginas. Se haría por slices, una página por agente.
- Riesgo: un `icon_key` mal escrito en datos existentes. Se mitiga con el fallback y validando los
  datos antes de activarlo.

### Cómo retomarlo
1. Decidir la opción (A, B o C) y aprobar el ADR. Después se mueve a `docs/decisions/README.md`
   con número definitivo.
2. Si es B: elegir el paquete y medir el impacto en el bundle con una prueba de concepto
   (una sección).
3. Migrar por páginas: Real Estate primero, porque hoy ignora el `icon_key`; después Home y
   Owners (registro manual); por último Guests, About, Services, Blog y Guides (CSS).
4. Añadir el selector de iconos al backoffice.
