# Servicios individuales — handoff local

Fecha: 2026-10-18. Estado: implementación y QA independiente aprobadas; entrega local preparada.

Savepoint anterior intacto: `a1107f859944e98757134bdb25d776976d51023f`, etiqueta
`savepoint/pre-service-detail-editor-2026-10-18`. Código candidato:
`9faffe95789d31984c69b03b00d6af0ded03fec0`, rama `service-detail/integration`.
El commit documental que contiene este cierre se integra por fast-forward en main local;
`git log -1` identifica el HEAD final. No cambia el código probado al cerrar documentación.

Editor `/admin/services/new` y `/admin/services/[id]`: siete secciones independientes,
campos contextuales, ocultar/recargar/reactivar conservando datos, herencia, EUR exactos,
precio destacado separado de tabla/extras,38overrides traducibles,7overrides de iconos,
portada/galería/OG/miniaturas, SEO existente y guardas con errores/foco. El layout público
permanece fijo. CTA enquiry ahora respeta su label guardado, incluyendo labels históricos.

ADR0036 corrige atribución para staff textual y UUID sin inventar IDs ni perder autor:
`translation.updated_by_user_id` text nuevo, legacyUUID preservado cuando corresponde.
Migración0019 añade configuración neutral de presentación;0020 añade actor text. Solo
aplicadas en DBs locales ficticias. Un despliegue futuro debe aplicar ambas antes del
código que consulta las columnas; no hay push, deploy ni migración remota en esta entrega.

Checks finales en código9faffe9: typecheck/lint,240tests reales,db:check y pnpm build
exit0. Lint conserva5warnings previos; db0008 conserva advertencia de breakpoint.
BuildTurbopack generó134páginas con fixtures de QA. Logs final-*.log y todos los scripts
están en `/private/tmp/central-hill-service-detail-qa`. Informe y casos:
[QA](service-detail-editor-qa.md), [spec](service-detail-editor-execution.md),
[ADR0036](../decisions/0036-translation-actor-attribution.md).

Primera ronda independiente verificó persistencia real de los diez patrones en cuatro
idiomas, ocho combinaciones, copy/iconos, medios JPEG, actor source/target UUID/text,
ACL, corrupción, fallos parciales/recuperación e ISR. HallazgoAC18 de barra móvil larga
que tapaba FAB y footer corregido mediante altura real, espacio al final del body y
cleanup por viewport/navegación. Retest sobre9faffe9 aprobado: FAB/footercopyright/idioma accesibles y cleanup desktop/SPA correcto.

Sin constructor libre, preview de borrador completo, compra de opciones ni proveedorLLM
nuevo. Alt sigue compartido en Media, con ayuda en el formulario. Guardas de salida
cubren enlaces propios y beforeunload, no interceptan el menú lateral global. Subidas
reales QA ejercitaron JPEG; validación MIME cubre imágenes admitidas, sin inspección de
frames/animación. Detalles de límites y evidencia constan en QA, sin claims de CI automático.

Worktrees preservados: integración `/private/tmp/central-hill-service-detail-integration`,
A `/private/tmp/central-hill-service-detail-editor`, B `/private/tmp/central-hill-service-detail-public`.
Entorno ficticio: DB/proxy dedicados5558/4458, S3rver9058, appbuild3059 sesión20972.
No credenciales de producción copiadas. Dev3058 detenido por owner antes de build.
No se eliminan worktrees ni otros procesos del usuario.

## Archivos de esta entrega

Lista completa contra savepoint, incluyendo documentos nuevos que se capturan al cerrar:

- `AGENTS.md`
- `docs/data-model.md`
- `docs/decisions/0036-translation-actor-attribution.md`
- `docs/decisions/README.md`
- `docs/specs/handoff-service-detail-editor.md`
- `docs/specs/service-detail-editor-execution.md`
- `docs/specs/service-detail-editor-qa.md`
- `drizzle/0019_service_presentation.sql`
- `drizzle/0020_translation_actor_attribution.sql`
- `drizzle/meta/0019_snapshot.json`
- `drizzle/meta/0020_snapshot.json`
- `drizzle/meta/_journal.json`
- `messages/en.json`
- `messages/es.json`
- `messages/fr.json`
- `messages/pt.json`
- `src/core/i18n/actor-attribution.ts`
- `src/core/i18n/content-write.ts`
- `src/core/i18n/schema.ts`
- `src/core/i18n/tests/actor-attribution.test.ts`
- `src/slices/services/README.md`
- `src/slices/services/admin/actions.ts`
- `src/slices/services/admin/form-model.ts`
- `src/slices/services/admin/queries.ts`
- `src/slices/services/admin/service-media-validation.ts`
- `src/slices/services/admin/ui/detail-editor.tsx`
- `src/slices/services/admin/ui/service-copy-editor.tsx`
- `src/slices/services/admin/ui/service-form.tsx`
- `src/slices/services/admin/ui/service-section-controls.tsx`
- `src/slices/services/admin/validation.ts`
- `src/slices/services/contract.ts`
- `src/slices/services/copy.ts`
- `src/slices/services/presentation.ts`
- `src/slices/services/schema.ts`
- `src/slices/services/server/queries.ts`
- `src/slices/services/tests/services-copy.test.ts`
- `src/slices/services/tests/services-detail-view.test.ts`
- `src/slices/services/tests/services-editor-model.test.ts`
- `src/slices/services/tests/services-media-validation.test.ts`
- `src/slices/services/tests/services-presentation.test.ts`
- `src/slices/services/tests/services-save-guards.test.ts`
- `src/slices/services/ui/components/service-booking-card.tsx`
- `src/slices/services/ui/components/service-mobile-bar.tsx`
- `src/slices/services/ui/detail-view-model.ts`
- `src/slices/services/ui/service-detail.tsx`
- `src/slices/services/validation.ts`
