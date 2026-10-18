# CMS de guías individuales — handoff local

2026-10-18. Estado: implementado y aprobado por QA independiente en rama de tarea.

## Código y alcance

Baseline estable `6a3c1ce`, tag `savepoint/pre-guides-cms-implementation-2026-10-18`.
Candidato de código `1a2739cb397daef05a7c226b48ee4d0ecb293998`, rama
`guides-cms/integration`, worktree `/private/tmp/central-hill-guides-cms-integration`.
La integración a main no forma parte de esta entrega en rama de tarea.

`/admin/guides` gestiona guías individuales, con árbol de secciones y lugares,
SEO/hero/OG, publicación/archivo, orden y módulos independientes. Ocultar conserva
contenido, IDs y traducciones; el público filtra TOC, contadores, mosaico y
recomendaciones de forma coherente. Horarios, web y reserva opcionales se muestran
en fichas de lugar. Pages mantiene CTA compartido y Settings los iconos.

Guardado granular por entidad y patches estrictos; omisión conserva, null limpia.
Conservar slugs localizados y comprobar ownership, MIME/referencias, URLs y estado
publicado efectivo. Operaciones secuenciales sin transacción global; fallo parcial
se informa y requiere recarga. IDs estables y reintentos evitan duplicados.

Spec: [ejecución](guides-cms-execution.md). Inventario:
[auditoría](guides-cms-audit.md). QA: [informe independiente](guides-cms-qa.md).
No hay push, despliegue ni writes de producción. No se copiaron .env.local remotos.

## Verificación

Root Node22.23.3/pnpm10.8.0: typecheck, lint,92tests explícitos integrados y build
exit0 sobre1a2739c. QA independiente PASS sobre ese código, incluidos retests del
orden UI/servidor y cierre archive/sitemap, recomendaciones y clear de traducciones.
Lint conserva5warnings históricos. db:check exit0,
warning histórico0008; journal22migraciones consistente. Detector Impeccable de UI
integrada exit0, []. Revisión manual de imports/límites sin imports interslice internos.
Logs en `/private/tmp/central-hill-guides-cms-qa/`:
`order-build.log`, `order-full-tests.log`, `order-lint.log`, `integrated-detector.json`.
No contar pnpm test/boundary:check como verificación: siguen siendo placeholders.

QA inicial detectó sitemap stale y referencia media_id de lugar no validada.
Correcciones root incluidas en bec225e y retest positivo independiente. Se redujeron
queries redundantes de slugs/medios sin prometer tiempos de producción desde QA local.
QA también encontró empate de posición al añadir tras borrar un elemento intermedio;
1a2739c incluye defaults de servidor y altas UI basados en máximo position+1.
El informe QA registra casos realmente ejercidos, fallos de harness y limitaciones.
Guardado no-op aislado de guía live1sección/3lugares:4431ms en transporte QA local;
sin comparación porcentual ni promesa de rendimiento de producción.

## Entorno y preservación

Preview: http://127.0.0.1:3061/admin/guides. App production PID64605/sesión98264,
log `server-order.log`; servidor anterior PID44880 detenido por root para rebuild.
Staff ficticio: guidescmsqa@example.test / test1234; editor UUID y roles negativos
adicionales se registran en manifest.json de QA, sin credenciales reales.

DB/rol guidescmsqa, PostgreSQL17 dedicado5568; proxy4468. S3rver9061/bucketguidescmsqa,
PID71268/sesión76507. Env fake y transporte local en QA env.sh/preload.cjs.
Migraciones0000..0021 aplicadas sólo allí;0021 añade presentation nullable y conservó
2/2filas previas null. Secuencia completa también probada en DB vacía guidescmsfreshqa.
El CLI db:migrate falló en transporte websocket local; SQL generado y ledger se
aplicaron con psql, exit0. No aplicar0021remotamente como efecto de esta entrega.

Corpus aislado:8variantes/59secciones/86lugares del literal seed y5imágenes sintéticas,
sin ejecutar seed-guides. El fallback público preexistente de AsideCta referencia una
imagen pública remota; QA lo distingue de sus writes/media sintéticos.
Previews3059/3060 y worktrees previos preservados.

Worktrees A `/private/tmp/central-hill-guides-cms-admin`, B
`/private/tmp/central-hill-guides-cms-public`, ambos desde contrato9f0a171.
A42958f6+65b61a2 integrados0b9ff43+6430676; Bc2c560d integrado92d52d5.
A corrección de orden e089612 integrada1a2739c; root defaults7f9c391.
Dependencias A/B son symlinks node_modules sin versionar; integración usa clon local
para Turbopack. No son archivos fuente ni se incluyen en commits.

## Límites intencionales

Sin vídeo de detalle, builder libre, mapa embebido, draft preview, redirects de slug,
ni overrides locales de CTA/iconos. Cambios de guía published se publican al guardar;
draft retira la guía. Targets approved stale siguen hasta revisión; no prometer LLM
real si no hay proveedor. El botón Back del navegador conserva comportamiento Next
normal; los enlaces internos y la salida del documento sí tienen guard de pendientes.
No reejecutar el seed tras edición humana sin una revisión específica de preservación.

## Archivos de código/documentación contra baseline

- `AGENTS.md`
- `docs/data-model.md`
- `docs/specs/guides-cms-execution.md`
- `docs/specs/guides-cms-qa.md`
- `docs/specs/handoff-guides-cms.md`
- `drizzle/0021_guide_section_presentation.sql`
- `drizzle/meta/0021_snapshot.json`
- `drizzle/meta/_journal.json`
- `messages/en.json`
- `messages/es.json`
- `messages/fr.json`
- `messages/pt.json`
- `src/app/(admin)/admin/(panel)/guides/[id]/page.tsx`
- `src/app/(admin)/admin/(panel)/guides/new/page.tsx`
- `src/app/(admin)/admin/(panel)/guides/page.tsx`
- `src/app/(admin)/admin/(panel)/layout.tsx`
- `src/slices/geography/contract.ts`
- `src/slices/geography/server/guide-city-options.ts`
- `src/slices/guides/README.md`
- `src/slices/guides/admin/actions.ts`
- `src/slices/guides/admin/media-validation.ts`
- `src/slices/guides/admin/model.ts`
- `src/slices/guides/admin/queries.ts`
- `src/slices/guides/admin/screens.ts`
- `src/slices/guides/admin/ui/editor-model.ts`
- `src/slices/guides/admin/ui/guide-editor.tsx`
- `src/slices/guides/admin/ui/guide-list.tsx`
- `src/slices/guides/admin/ui/guide-place-editor.tsx`
- `src/slices/guides/admin/ui/guide-section-editor.tsx`
- `src/slices/guides/admin/validation.ts`
- `src/slices/guides/contract.ts`
- `src/slices/guides/presentation.ts`
- `src/slices/guides/schema.ts`
- `src/slices/guides/server/publish.ts`
- `src/slices/guides/server/queries.ts`
- `src/slices/guides/tests/admin-actions.test.ts`
- `src/slices/guides/tests/admin-validation.test.ts`
- `src/slices/guides/tests/city-options.test.ts`
- `src/slices/guides/tests/detail-presentation.test.ts`
- `src/slices/guides/tests/editor-model.test.ts`
- `src/slices/guides/tests/format.test.ts`
- `src/slices/guides/tests/media-validation.test.ts`
- `src/slices/guides/tests/presentation.test.ts`
- `src/slices/guides/tests/translation-revalidation.test.ts`
- `src/slices/guides/ui/components/recommendation-card.tsx`
- `src/slices/guides/ui/format.ts`
- `src/slices/guides/ui/guide-page.tsx`
- `src/slices/translation/admin/actions.ts`

Este handoff, informe QA y actualización final AGENTS/spec se capturan en el
commit documental de cierre; no cambian el código revisado por QA.
