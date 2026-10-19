# ADR0040 — JSON por idioma: Guardar borrador y Publicar

2026-10-18. Decisión de producto cerrada por el usuario; implementación pendiente.
Piloto Home antes de Owners. Se sustituye para páginas adaptadas la decisión anterior
Pages siempre live y el flujo de aprobación de traducciones. No cambia el resto del CMS.

Pages conserva un documento JSON completo por idioma y estado: `published` y `draft`
en una fila propia `(page_key, locale)`. Guardar borrador escribe sólo `draft` del idioma
seleccionado. Publicar valida ese JSON y, en una sola operación condicionada por revisión,
lo pasa a `published`, pone `draft=NULL` y aumenta la revisión. La fila/revisión permanece:
un editor viejo no puede resucitar un borrador eliminado. Otros idiomas no se publican,
no se limpian ni se sobrescriben.

Preview privada: draft guardado del idioma si existe; en otro caso published del idioma.
Web pública: exclusivamente published. Mismo renderer para ambas; ISR permanece público.
Sin autosave/live preview, review/approve/stale, historial de versiones, workflow editorial,
publicación conjunta ni reconstrucción completa del sitio.

La tabla nueva pertenece a Pages. Los JSON publicados ya contienen copy localizada;
no consultan estados de aprobación ni escriben traducciones al publicar. Se preservan los
valores públicos actuales de los cuatro idiomas al inicializar; no se borran filas legacy.
Los textos legacy aún no publicados se preservan como borrador del idioma, sin publicarlos.
Los formularios/catálogos de otros slices conservan sus flujos actuales.

Los campos compartidos se siguen editando en EN. Cada JSON de idioma conserva una copia
para publicación independiente: publicar medios/listas EN no altera la versión pública ES
ni un borrador ES existente. Un nuevo borrador target se prepara desde el template EN más
reciente, conservando sus textos por IDs estables. Un borrador target existente se mantiene
exacto; no hay sincronización destructiva por cambios en EN.

El kernel i18n y sus seams no necesitan cambios en este arco. El editor genérico de
Translations redirige Home al editor contextual y sus mutaciones legacy para Home se
bloquean; no existe una segunda vía de publicar/aprobar por fuera de Publicar.
Otras páginas/entidades mantienen su comportamiento hasta adaptarse explícitamente.

Consecuencia: migración aditiva de una tabla, modelo/publicación genéricos reutilizables,
adaptador Home actualizado y QA de persistencia/aislamiento acotado. Las implementaciones
por página posteriores consumen contratos estabilizados, con un propietario por editor.

## Follow-up: ephemeral live preview

The user subsequently requested local unsaved preview. Home may send its current form
envelope to an authenticated read-only renderer, with debouncing and latest-response
guards. Render through the same Home composition, no DB write/auto-save/public invalidation.
Local blob media metadata is accepted only in this ephemeral read path, never publication
or persistence. Existing per-locale Save draft/Publish semantics remain unchanged.
The previous no-live-preview/saved-only restriction is superseded only for this adapter.
See home-live-preview-execution.md for boundaries and verification.

## Shared editor rollout

The user authorized the common engine and contextual UI for Home, Owners, Buildings
listing, Real Estate and Guest after the spec/plan handoff. The ephemeral preview follow-up
now applies to these explicitly registered adapters. Each uses the same independent
page/locale draft, publication and revision semantics; other pages keep their existing
workflow. No new table or kernel change. Public forms remain the existing implementations.
