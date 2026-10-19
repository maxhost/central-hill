# Handoff para contexto nuevo — Home drafts por idioma

2026-10-18. Usuario pidió spec/plan ANTES de lanzar agentes. No implementación comenzada.

## Leer y verificar

Checkout /private/tmp/central-hill-home-contextual-integration, rama home-contextual/integration.
Base de producto3c55a1b; verificar el HEAD documental final/status al comenzar.
Leer AGENTS.md, CLAUDE.md, docs/multi-agent-workflow.md, ADR0040,
page-locale-drafts-spec.md y page-locale-drafts-plan.md. Home toolbar SEO ya está construida;
no repetir su implementación ni el QA completo previo.

## Decisiones cerradas del usuario

- Sólo Guardar borrador y Publicar; nada de aprobar/revisar traducciones.
- JSON persistido por idioma y preview de draft cuando existe, published cuando no.
- Ambas acciones por idioma seleccionado. Publicar EN borra sólo su JSON draft;
  ES publicado/draft/trabajo local permanecen intactos. No publicación conjunta.
- Publicación atómica, revisión por idioma que permanece tras borrar el JSON.
- SEO por idioma editable aunque EN vacío; toolbar SEO EN/ES/PT/FR.
- Home primero, Owners después. Mantener mismo renderer/ISR; no nuevo builder visual.
- Máximo10casos nuevos focalizados + un pase browser EN/ES desktop/mobile.
  Checks globales una vez en integrado; QA no los duplica. No149tests por rutina.
- QA/sandbox seguro local ya autorizado; no volver a pedir por tests. Neon producción/
  GitHub requieren autorización aparte; sin main/push/despliegue en entrega local.

## Ejecución

Nueva integración + worktrees backend/editor según plan. Raíz aterriza tabla/tipos/
contratos/registry antes de dos escritores con scope disjunto; QA independiente al final.
No credenciales productivas. Nuevo pagedraftsqa, preview propuesto3067; preservar3065.
No cambios Forms/Owners/catálogos en este arco. No kernel i18n rewrite.

Este diseño actualiza la decisión anterior always-live/review para páginas adaptadas.
Los JSON publicados completos evitan usar el estado approved del kernel para publicar Home;
el resto del CMS conserva el flujo existente. No perder traducciones legacy al bootstrap.

## Después

page-editors-parallel-plan.md describe la siguiente fase de adaptadores por página.
No lanzar agentes de página aún: primero cerrar esta base compartida y sus contratos.
Owners mantiene la dependencia adicional del catálogo Forms público; no marcarlo completo
con un selector sin renderer/captura reales.

Prompt sugerido para el nuevo contexto:
“Lee AGENTS.md y docs/specs/page-locale-drafts-handoff.md en
/private/tmp/central-hill-home-contextual-integration. Verifica HEAD y sigue la spec/plan
cerrados. Implementemos borrador y publicación POR IDIOMA en Home con el QA acotado acordado.”

## Verificación de esta entrega documental

Sólo Markdown/README/AGENTS; ningún cambio de código, migración ejecutada, DB o entorno.
Comprobaciones: git diff --check y enlaces locales de documentos nuevos. No correr pruebas
ni build de producto por documentación. Los documentos anteriores de Owners/SEO que raíz
había dejado pendientes se capturan aquí actualizados con las decisiones finales del usuario.
El producto actual sigue siendo3c55a1b en preview3065; drafts por idioma aún no implementados.
