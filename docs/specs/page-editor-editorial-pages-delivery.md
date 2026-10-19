# Entrega local — Pages Services/About/Guides/Blog

Código final `48cc3c2`, base documental `85676c3`. Integración
`/private/tmp/central-hill-page-editors-editorial-integration`, rama
`page-editors-editorial/integration`. QA independiente funcional aprobó el pase agrupado
sobre59c1ce3 y la confirmación focal del único ajuste de producto sobre48cc3c2.
Informe: [QA](page-editor-editorial-pages-qa.md),
[spec](page-editor-editorial-pages-spec.md), [plan](page-editor-editorial-pages-plan.md).
El commit de cierre documental queda en HEAD; no cambia el ejecutable.

## Resultado

Los nueve Pages usan motor común; Services/About/Guides/Blog completan el rollout.
Guardar borrador y Publicar por idioma, live temporal, SEO de toolbar y foco se conservan.
Services mantiene3pasos fijos,5medios y catálogo publicado separado. About conserva8listas,
IDs/traducciones/destinos/fotos y29medios. Guides conserva enabled ausente=true y colapso
sin borrar valores, template {city}, catálogo y selección pública real de ciudad.
Guides/Blog tienen superficie privada shared_aside con el componente real de sus fichas.
Blog conserva newsletter y prioridad del CTA propio del artículo. Publicar ambas keys
invalida el tag y subárbol sólo del locale. Formularios siguen bloqueados en preview.
No cambios en editores individuales, Forms/captura/envíos, kernel o migraciones de producto.

Bootstrap usa seam legacy por adapter: salvage Guides, targets válidos por hoja,
Blog no revive targets viejos para EN vacío; pendientes legacy permanecen privados y exactos.
Fuente corrupta bloquea adopción inicial; cuatro snapshots persistidos son autoridad.
El fix48cc3c2 evita resolver UUIDs media de Services legacy corrupto antes de cargar snapshots.

## Verificación real

Node22/pnpm. Typecheck0, lint global0 con warnings históricos; eslint focal de wrapper
Home y guard Services0. Exactamente10casos nuevos; suite integrada59casos =43regresiones
previstas+6About-editor por import form-model+10nuevos. Inicial58pass/1fail Buildings;
se restauró la excepción fallback histórica y corrigió fixture hero.image_media_id faltante.
Confirmación final sólo Buildings1pass0. Ninguna suite completa repetida por rutina.
Build integrado0 y build final48cc3c2 0. No db:check al no existir DDL nuevo de producto.
`pnpm test`/boundary:check placeholders no usados como evidencia. Imports revisados manualmente.

Un pase QA agrupado desktop1600/mobile390: Home breve foco/live/Refresh/reload,
Services/About flujo real draft/reload/publish/público/SEO, About listas/media/destinos/Settings,
Guides toggle/template/ciudades públicas/aside privado y ficha cacheada,
Blog EN/ES aislamiento draft+local/SEO/newsletter/aside y CTA propio/otra key intacta.
Acceso anónimo, shared_aside directo noindex/no-cache, submits bloqueados y entidad
Building sin conversión. Sin errores JavaScript observados. PT/FR conservados mediante
contratos/schema/messages/build/revisión; no se afirma matriz browser4×4.
Fallos de selectors/fixtures se retomaron desde checkpoint; no se atribuyen a producto.
Confirmación final focal de Services sobre48cc3c2: legacy media inválido,4snapshots
se conservan y editor200; ningún save/publish; fuente sintética restaurada en finally.

Logs/harness/capturas/fixtures: `/private/tmp/central-hill-page-editors-editorial-qa`.
`tests.log`, `tests-buildings-fixture-final.log`, `typecheck-legacy-guard.log`,
`lint.log`, `lint-legacy-guard.log`, `build-legacy-guard-final.log`, `browser-state.json`,
`browser.log`, `confirm.log`, `fixture-evidence.log`. Reporte independiente detalla límites.

## Entorno conservado

Preview nuevo http://127.0.0.1:3069/admin/pages/services, runtimePID8680/session73545.
DB/rol pageeditors2qa verificados SQL, DB5638/proxy4538, storage9069PID85502/session58008.
Containers central-hill-page-editors-editorial-{db,proxy}, red aislada propia.
Sólo migraciones existentes0000..0023 aplicadas a esa DB nueva; fixtures sintéticas pequeñas.
Imagen neutra nueva qa-neutral.png, clave antiguaqa.png también neutra; antigua caché de
imágenes de este runtime preservada como previous-image-cache en artefactos QA.
Corrección de fixture About mediante upload/save/reload/publish real, sin submit/email.

Preview3068 conserva checkout/build/DB originales: original limpio85676c3,
/private/tmp/central-hill-page-editors-integration, DBpageeditorsqa5628/proxy4528/storage9068.
Control final encontró3068 sin listener; se reabrió con SU build/env originales, sin rebuild
ni escrituras de contenido. AhoraPID9272/session34102; loginHTTP200 verificado junto a3069.
No se atribuye causa al cierre anterior. Ningún proceso3068 fue detenido por esta tarea.
Todas las worktrees de Services/About/Guides/Blog y artefactos previos se conservan.

Entrega exclusivamente local. Sin main, push, despliegue, GitHub ni escrituras en producción.

## Archivos cambiados desde85676c3

Incluye todos los archivos nuevos; al cerrar se verifica status limpio.

```text
AGENTS.md
docs/specs/page-editor-editorial-pages-delivery.md
docs/specs/page-editor-editorial-pages-handoff.md
docs/specs/page-editor-editorial-pages-plan.md
docs/specs/page-editor-editorial-pages-qa.md
docs/specs/page-editor-editorial-pages-spec.md
messages/en.json
messages/es.json
messages/fr.json
messages/pt.json
src/app/(admin)/admin/preview/[key]/page.tsx
src/slices/blog/README.md
src/slices/blog/contract.ts
src/slices/blog/ui/blog-listing.tsx
src/slices/blog/ui/blog-post.tsx
src/slices/blog/ui/components/blog-shared-aside.tsx
src/slices/blog/ui/components/newsletter-signup.tsx
src/slices/guides/README.md
src/slices/guides/contract.ts
src/slices/guides/ui/components/guide-shared-aside.tsx
src/slices/guides/ui/guide-page.tsx
src/slices/guides/ui/guides-listing.tsx
src/slices/pages/README.md
src/slices/pages/about-content.ts
src/slices/pages/adapters/about.ts
src/slices/pages/adapters/blog.ts
src/slices/pages/adapters/guides.ts
src/slices/pages/adapters/services.ts
src/slices/pages/admin/actions.ts
src/slices/pages/admin/editorial-actions.ts
src/slices/pages/admin/editorial-preview-route.tsx
src/slices/pages/admin/editorial-queries.ts
src/slices/pages/admin/editorial-store.ts
src/slices/pages/admin/editorial-ui-registry.ts
src/slices/pages/admin/form-model.ts
src/slices/pages/admin/guides-media-validation.ts
src/slices/pages/admin/home-contextual.ts
src/slices/pages/admin/live-preview-actions.tsx
src/slices/pages/admin/queries.ts
src/slices/pages/admin/services-media-validation.ts
src/slices/pages/admin/ui/page-contextual-editor.tsx
src/slices/pages/blog-content.ts
src/slices/pages/contract.ts
src/slices/pages/editorial-adapter-types.ts
src/slices/pages/editorial-registry.ts
src/slices/pages/editorial-types.ts
src/slices/pages/guides-content.ts
src/slices/pages/schemas/about.ts
src/slices/pages/server/editorial-adapters.ts
src/slices/pages/server/editorial-legacy.ts
src/slices/pages/server/editorial-policy.ts
src/slices/pages/server/editorial-publication.ts
src/slices/pages/server/queries.ts
src/slices/pages/services-content.ts
src/slices/pages/tests/about-editorial-adapter.test.ts
src/slices/pages/tests/blog-editorial-adapter.test.ts
src/slices/pages/tests/editorial-engine.integration.test.ts
src/slices/pages/tests/editorial-rollout.integration.test.ts
src/slices/pages/tests/editorial-rollout.test.ts
src/slices/pages/tests/editorial-test-environment.ts
src/slices/pages/tests/guides-editorial-adapter.test.ts
src/slices/pages/tests/page-locale-drafts.integration.test.ts
src/slices/pages/tests/services-editorial-adapter.test.ts
src/slices/pages/ui/about-page.tsx
src/slices/pages/ui/components/guides-sections.tsx
src/slices/pages/ui/components/services-sections.tsx
src/slices/services/README.md
src/slices/services/contract.ts
src/slices/services/ui/services-listing.tsx
```
