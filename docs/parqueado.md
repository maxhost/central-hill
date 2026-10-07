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
propio. Aplicarla también a los otros títulos sobre banda oscura: `CenteredCtaBand` (Guides),
`FeatureCtaBand` (Owners) y `ActionBand` (detalle de edificio, que además usa un título más pequeño). Es un cambio en `src/core/ui/`, así que formalmente requiere ADR (regla de oro 3).
