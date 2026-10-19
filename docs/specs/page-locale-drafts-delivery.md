# Home: Guardar borrador y Publicar por idioma — entrega local

Actualización: fix de foco63a628a, verificado por raíz en escritura continua EN/ES y móvil.
La aprobación independiente original corresponde a b4bb282; ver seguimiento en QA.
Preview3067 actualizado PID5230/session43430.

2026-10-18. Base e06272b; contratos4b49471. Código integrado b4bb282 en
page-drafts/integration, /private/tmp/central-hill-page-drafts-integration.
QA independiente aprobado, informe fd7892c. Sólo documentación de cierre después del código
probado. No merge a main, push, GitHub, despliegue ni escritura de producción.

## Comportamiento

Las dos acciones afectan sólo EN/ES/PT/FR seleccionado. Guardar persiste un JSON privado;
Publicar valida el draft guardado, publica atómicamente y borra sólo ese draft, conservando
la revisión. No publica con cambios locales pendientes en ese idioma. Los demás idiomas
conservan published, draft y trabajo React. La preview privada usa draft guardado o published;
la web y SEO leen published, con ISR por idioma. Estructura/medios se editan en EN; los targets
preparan su primer draft desde el template EN guardado conservando textos por IDs.
Home queda fuera del flujo genérico de aprobar/revisar traducciones y sus antiguas mutaciones
servidor se bloquean. Bootstrap idempotente conserva los cuatro públicos legacy y textos
pendientes como draft, incluyendo SEO ES con SEO EN vacío. No toca otras páginas/Forms.

## Cambios

- Pages schema/contrato/types/registry y migration0023 con snapshot/journal generados.
- Persistencia/validación/modelos/actions/preview/publication/editorial-policy nuevos.
- Home editor y shell: estado por idioma, dos acciones, SEO target siempre editable.
- Getter Home publicado y renderer compartido con inyección privada; rutas staff adaptadas.
- Guards/redirect/inbox en Translation y acciones legacy Home; mensajes EN/ES/PT/FR.
- Nueve pruebas focales, README de Pages/Translation, data-model, plan/spec/handoff/QA.

Lista exacta: git diff --name-only e06272b..b4bb282, más los documentos de cierre
registrados después. Artefactos y logs de QA fuera del repo en
/private/tmp/central-hill-page-drafts-qa; no archivos de producto sin registrar.

## Verificación

Código b4bb282: pnpm typecheck0; pnpm lint0 con7 warnings preexistentes;
pnpm exec tsx --test src/slices/pages/tests/page-locale-drafts.test.ts
src/slices/pages/tests/page-locale-drafts.integration.test.ts0 (9/9);
pnpm db:check0 (warning previo0008); pnpm build0. Node22.23.3.
No se cuentan pnpm test ni boundary:check (placeholders). No se repitió la batería149.
Retries de infraestructura documentados en el plan: IPC del sandbox y symlink Turbopack,
resueltos sin cambios de producto. QA independiente aprobó el flujo funcional EN/ES
desktop/mobile: guardar/recargar/preview, aislamiento y trabajo local ES, publicación ES,
SEO/canonical/hreflang y guard anónimo. Ver [informe QA](page-locale-drafts-qa.md).
Una aserción final del harness confundió «preview» con «review»; se corrigió sólo el selector
y continuó con comprobaciones de lectura, sin repetir guardados ni todo el flujo.

## Preview y entorno

http://127.0.0.1:3067/admin/pages/home
Sintético: pagedraftsqa DB/role, PostgreSQL5618/proxy4518, storage9067.
Staff pagedraftsqa@example.test / test1234. Correo consola.
Migrations0000..0023 sólo en esta DB local fresca (psql ON_ERROR_STOP; log preservado).
Home3065 y sus DB/objetos/procesos siguen preservados, igual que los demás previews.
Server raíz PID92677/session3471, storage session59103/PID90200. Env/harness/logs en directorio QA;
node_modules local con dependencias existentes, sin cambios de package/lockfile.
Worktrees backend/editor conservados con commits7c7fed8 y4757ec4/bc44d6b.

Siguiente arco: Owners depende de esta base y de Forms público real; no incluido aquí.

## Archivos de entrega

```text
AGENTS.md
docs/data-model.md
docs/specs/page-locale-drafts-delivery.md
docs/specs/page-locale-drafts-handoff.md
docs/specs/page-locale-drafts-plan.md
docs/specs/page-locale-drafts-qa.md
docs/specs/page-locale-drafts-spec.md
drizzle/0023_page_locale_content.sql
drizzle/meta/0023_snapshot.json
drizzle/meta/_journal.json
messages/en.json
messages/es.json
messages/fr.json
messages/pt.json
src/app/(admin)/admin/(panel)/pages/[key]/page.tsx
src/app/(admin)/admin/preview/home/page.tsx
src/slices/backoffice/page-editor-types.ts
src/slices/backoffice/ui/page-editor-shell.tsx
src/slices/pages/README.md
src/slices/pages/admin/actions.ts
src/slices/pages/admin/editorial-actions.ts
src/slices/pages/admin/editorial-queries.ts
src/slices/pages/admin/editorial-store.ts
src/slices/pages/admin/editorial-validation.ts
src/slices/pages/admin/home-actions.ts
src/slices/pages/admin/ui/home-contextual-editor.tsx
src/slices/pages/contract.ts
src/slices/pages/editorial-content.ts
src/slices/pages/editorial-registry.ts
src/slices/pages/editorial-types.ts
src/slices/pages/schema.ts
src/slices/pages/server/editorial-policy.ts
src/slices/pages/server/editorial-preview.ts
src/slices/pages/server/editorial-publication.ts
src/slices/pages/server/editorial-translation-policy.ts
src/slices/pages/server/queries.ts
src/slices/pages/tests/page-locale-drafts.integration.test.ts
src/slices/pages/tests/page-locale-drafts.test.ts
src/slices/pages/ui/home-page.tsx
src/slices/translation/README.md
src/slices/translation/admin/actions.ts
src/slices/translation/admin/queries.ts
src/slices/translation/admin/ui/review.tsx
src/slices/translation/server/generate.ts
```
