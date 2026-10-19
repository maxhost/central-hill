# Handoff — siguiente arco Owners contextual

**Alcance actual de conversión:** [spec común](page-editor-platform-spec.md) y
[plan](page-editor-platform-plan.md) prevalecen. Owners se adapta conservando su formulario
actual. Releases/selector/captura/Leads de Forms descritos aquí quedan pendientes en otro arco
y no bloquean esta conversión. Este documento conserva el inventario/propuesta histórica;
no se ha implementado Forms público ni debe declararse completo al terminar el editor.

2026-10-18. El usuario aceptó Home y pidió handoff/plan para Owners. **Sólo plan**:
no empezar implementación de Owners por abrir este documento.

**En espera:** implementar primero page-locale-drafts-handoff.md y ADR0040. Después
retomar Owners, eventualmente en tanda paralela según page-editors-parallel-plan.md.

## Punto de partida

Checkout /private/tmp/central-hill-home-contextual-integration,
rama home-contextual/integration. Home entrega97d8bc5; código6359b6d QA aprobado,
informe14d85fd. Ajuste posterior solicitado por el usuario: SEO EN/ES/PT/FR en toolbar
junto a Desktop/Tablet/Mobile, inspector derecho y fuera de Sections/Element.
Código SEO3c55a1b. Ver sus comprobaciones en el handoff de Home; no asumir97d8bc5
como base final.
Crear rama/worktree Owners desde el HEAD final indicado allí y registrar hash/status.

Leer AGENTS.md, CLAUDE.md, docs/multi-agent-workflow.md, ADR0039 y:
- owners-contextual-editor-plan.md: alcance y dependencias auditadas.
- home-contextual-editor-delivery.md y home-contextual-editor-qa.md.
- form-builder/02-handoff.md, Forms README y ADR0038.
- owners-admin-editor.md como referencia histórica de campos; sus restricciones
  antiguas EN-only/formulario fijo no gobiernan el nuevo arco.

## Decisiones que se conservan

Reusar shell/bridge/renderer público con adaptador Owners; no copiar el editor completo.
Preview del JSON draft persistente cuando existe, published cuando no. Guardar borrador
y Publicar por idioma, sin aprobación de traducciones. Publicar EN no toca el JSON ES.
SEO por idioma en toolbar, OG con autoría compartida desde EN. Mantener diseño/secciones/anchors/medios y campos ocultos actuales.
Identidad estable en TODAS las listas movibles, incluidas features anidadas por plan.

Owners tiene formulario propio: selector Forms y reemplazo del wizard actual en su
misma tarjeta. El builder conserva campos/pasos/copy/idiomas/destinatario. Requiere
releases/publicación, renderer, captura anónima y contrato Leads reales; el test staff
actual no es envío público. No convertir Buildings ni otros formularios globales.

Antes de delegar: spec ejecutable, ADR de Forms público, contratos y migraciones raíz,
write sets exactos. Dos implementadores aislados por fase y QA independiente del integrado.
QA normal proporcional; no matriz global. Sólo nuevos datos/DB/storage sintéticos.
Preservar Home3065 y sus entornos anteriores. Operaciones locales seguras y QA automáticos
ya autorizados; no repetir preguntas funcionales. Neon producción/GitHub requieren
aprobación separada. Sin main/push/despliegue/envíos reales en la entrega local.

## Estado al cerrar este plan

No implementación Owners pendiente a medio hacer; no credenciales productivas copiadas.
Fuentes auditadas y aceptación/semánticas propuestas están en el plan. Las elecciones
SQL/schema y archivos exactos se cierran por el orquestador en la spec de ejecución antes
de consumidores. El cambio de ubicación SEO corresponde a Home, no a una conversión Owners.
