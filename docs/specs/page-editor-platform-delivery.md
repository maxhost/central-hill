# Editor común Pages — entrega local

Implementación autorizada desde8223f4a en rama page-editors/integration, checkout
/private/tmp/central-hill-page-editors-integration. Handoff de planificación y checkout
/private/tmp/central-hill-page-drafts-integration conservados; Home/live3067 no sustituido.

Un motor por key/idioma y un PageContextualEditor consumen descriptores serializables.
Home conserva wrapper compatible. Owners prueba planes/features anidados; Buildings
inyecta sólo contenido editorial en BuildingsListingRenderer por contract y conserva
catálogo publicado independiente. Real Estate conserva adjunto PDF en su CTA y Guest
conserva sus teasers/destinos. Formularios actuales sin selector Forms/captura/envíos nuevos.

IDs legacy_N resuelven índice original de traducción/fallback; UUID nuevos usan @UUID.
Metadata hija se ancla en identidad del padre, no posición. JSON Home no se reescribe por
la extracción. Draft/publicación/CAS y revisión persistente por página/idioma; preview
local efímera usa el mismo renderer público sin guardar/flush/invalidation.

Servidor nuevo PID73105/session55343, storage PID39697/session78716.
Acceso local sintético: pageeditorsqa@example.test / test1234.

Entorno nuevo: http://127.0.0.1:3068/admin/pages/home y paths owners/buildings/real_estate/guest.
SQL DB/rol pageeditorsqa, Postgres5628/proxy4528/storage9068, correo consola. Fixtures staff,
catálogo publicado pequeño y medios sintéticos; artefactos env/SQL/logs/screenshots en
/private/tmp/central-hill-page-editors-qa. Se aplicaron sólo migraciones existentes0000..0023;
no migración de producto nueva ni producción. Dependencias clonadas del lock existente.

Ejecución sigue [plan](page-editor-platform-plan.md), aceptación en
[spec](page-editor-platform-spec.md). Candidato ejecutable final: 7e13d9f. Typecheck/build exit0;26pruebas integradas
(16existentes+10nuevas) exit0 en cf9064b y6afectadas repetidas tras el fix de tipos bc2037f,
exit0. Lint global exit0 con7warnings históricos y eslint focal del fix exit0. Regresiones
legacy About/Pages71existentes comprobadas por B; sin cambios posteriores a esos controles.
Detector visual mecánico una vez: []. Sin db:check porque no hubo DDL nuevo.
QA completó el pase agrupado en bc2037f y encontró un indicador Unsaved falso por orden
de claves JSON tras recargar un target publicado. Fix7e13d9f compara objetos semánticamente,
conservando orden de arrays; typecheck/eslint focal/test engine existente/build exit0.
La confirmación independiente focal pasó exit0, incluyendo edición real/foco y recarga
Published sin cambios DB. **QA aprobado sin blockers** en [informe](page-editor-platform-qa.md). Entrega sólo en rama local: sin main/push/despliegue/GitHub.

Se preservaron los checkouts, DB y artefactos anteriores. Una comprobación lsof durante
esta entrega no encontró listeners3065/3067; no se detuvieron, reiniciaron ni sobrescribieron
procesos de esos entornos. Sus PIDs del handoff anterior son históricos. El nuevo3068 sí
está escuchando con el candidato compilado indicado.

## Archivos cambiados

Inventario exacto respecto a8223f4a, incluidos archivos nuevos:

```text
AGENTS.md
docs/decisions/0040-page-locale-drafts.md
docs/specs/page-editor-platform-delivery.md
docs/specs/page-editor-platform-handoff.md
docs/specs/page-editor-platform-plan.md
docs/specs/page-editor-platform-qa.md
docs/specs/page-editor-platform-spec.md
messages/en.json
messages/es.json
messages/fr.json
messages/pt.json
src/app/(admin)/admin/(panel)/pages/[key]/page.tsx
src/app/(admin)/admin/preview/[key]/page.tsx
src/app/(admin)/admin/preview/home/page.tsx
src/slices/backoffice/README.md
src/slices/buildings/README.md
src/slices/buildings/contract.ts
src/slices/buildings/ui/buildings-listing.tsx
src/slices/pages/README.md
src/slices/pages/adapters/buildings.ts
src/slices/pages/adapters/guest.ts
src/slices/pages/adapters/home.ts
src/slices/pages/adapters/owners.ts
src/slices/pages/adapters/real-estate.ts
src/slices/pages/admin/actions.ts
src/slices/pages/admin/buildings-media-validation.ts
src/slices/pages/admin/editorial-actions.ts
src/slices/pages/admin/editorial-preview-route.tsx
src/slices/pages/admin/editorial-queries.ts
src/slices/pages/admin/editorial-store.ts
src/slices/pages/admin/editorial-ui-registry.ts
src/slices/pages/admin/editorial-validation.ts
src/slices/pages/admin/guest-media-validation.ts
src/slices/pages/admin/home-contextual.ts
src/slices/pages/admin/live-preview-actions.tsx
src/slices/pages/admin/live-preview-validation.ts
src/slices/pages/admin/owners-media-validation.ts
src/slices/pages/admin/real-estate-media-validation.ts
src/slices/pages/admin/ui/about-list-editor.tsx
src/slices/pages/admin/ui/home-contextual-editor.tsx
src/slices/pages/admin/ui/page-contextual-editor.tsx
src/slices/pages/admin/ui/schema-fields.tsx
src/slices/pages/buildings-content.ts
src/slices/pages/contract.ts
src/slices/pages/editorial-adapter-types.ts
src/slices/pages/editorial-content.ts
src/slices/pages/editorial-identities.ts
src/slices/pages/editorial-registry.ts
src/slices/pages/editorial-types.ts
src/slices/pages/guest-content.ts
src/slices/pages/owners-content.ts
src/slices/pages/real-estate-content.ts
src/slices/pages/schema.ts
src/slices/pages/schemas/buildings.ts
src/slices/pages/schemas/guest.ts
src/slices/pages/schemas/owners.ts
src/slices/pages/schemas/real-estate.ts
src/slices/pages/server/editorial-adapters.ts
src/slices/pages/server/editorial-preview.ts
src/slices/pages/server/editorial-publication.ts
src/slices/pages/server/queries.ts
src/slices/pages/tests/buildings-editorial-adapter.test.ts
src/slices/pages/tests/editorial-engine.integration.test.ts
src/slices/pages/tests/editorial-engine.test.ts
src/slices/pages/tests/editorial-test-environment.ts
src/slices/pages/tests/guest-editorial-adapter.test.ts
src/slices/pages/tests/owners-editorial-adapter.test.ts
src/slices/pages/tests/page-locale-drafts.integration.test.ts
src/slices/pages/tests/real-estate-editorial-adapter.test.ts
src/slices/pages/ui/components/buildings-sections.tsx
src/slices/pages/ui/guest-page.tsx
src/slices/pages/ui/owners-page.tsx
src/slices/pages/ui/real-estate-page.tsx
src/slices/translation/README.md
```
