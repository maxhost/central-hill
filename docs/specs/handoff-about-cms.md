# About CMS — handoff local

2026-10-18. Implementación y QA funcional independiente completadas.

## Código y entrega

Base6849427 (cierre documental Guides), savepoint
`savepoint/pre-about-cms-implementation-2026-10-18`. Código final
`d4e13c9`, rama `about-cms/integration`, worktree
`/private/tmp/central-hill-about-cms-integration`. El cierre documental se registra
por separado, sin cambiar el código construido/aprobado.

- Editor About refleja el fallback público si no existe fila y bloquea fuente inválida.
- Ocho listas acotadas permiten añadir/quitar/mover, conservando identidad y traducciones.
- Destinos de contacto y fotos fallback de audiencias viajan con su elemento.
- Historia/Organización/Comunidad aceptan fotos, WebP animado, MP4/WebM y Lottie;
  conservan marcos y alts. Badge icon editable. SEO/OG y labels continúan editables.
- Save valida referencias/MIME y usa snapshot+source sync atómicos, con revisión
  devuelta para guardados consecutivos. Traducciones aprobadas conservan identidad;
  retirar source impide recrear target huérfano. Fallos de traducción conservan draft.

Spec [about-cms-execution.md](about-cms-execution.md), auditoría
[about-cms-audit.md](about-cms-audit.md), QA funcional independiente
[about-cms-qa.md](about-cms-qa.md), decisión [ADR0037](../decisions/0037-about-stable-lists.md).
El usuario pidió reducir la verificación a funcionamiento normal: guardado/recarga,
página pública y carga de medios. No se deja una matriz adversarial como gate pendiente.

## Verificación real

- Node22.23.3/pnpm10.8.0. Typecheck integrado exit0; typecheck del ajuste final UI exit0.
- Suite explícita Pages/About/Translation/actor-attribution:167/167 exit0 sobre4d3e157;
  el cambio finald4e13c9 sólo añade manejo UI de error/draft y mensajes/docs.
- Lint integrado exit0 con5warnings históricos; lint del último UI edit exit0.
- Build final de **d4e13c9** exit0, incluido TypeScript, en runtime separado.
- Detector de UI integrado y del último archivo UI: exit0, `[]`. Diff-check exit0.
- QA independiente: controles de las8listas, Save+reload y segundo guardado; textos,
  icono de badge, SEO, traducciones y destinos EN/PT/ES/FR correctos sin rebuild.
- QA finald4e13c9: uploads reales de JPG/MP4/WebP animado desde el formulario,
  Save+reload y media cargada/decodificada en público. Desktop1440/móvil390 sin overflow.
- Prueba aislada de fuente retirada devolviófalse sin target huérfano. No se cuenta
  una espera browser de conflicto que coincidió con aria-live vacío ni se promete
  matriz completa de formatos/permisos/concurrencia. Detalles precisos en informe QA.

Logs/evidencia en `/private/tmp/central-hill-about-cms-qa/`:
`guard-tests.log`, `guard-lint.log`, `retention-typecheck.log`, `retention-lint.log`,
`retention-build.log`, `integrated-detector.json`, `retention-detector.json`,
`qa-lists-results.json`, `qa-media-basic-results.json` y capturas `qa-*.png`.
No se usaron pnpm test/boundary:check como verificación.

## Preview y preservación

- Público http://127.0.0.1:3062/es/about
- Editor http://127.0.0.1:3062/admin/pages/about
- Staff sintético `aboutcmsqa@example.test` / `test1234`.
- App final PID60973/sesión5489, cwd `/private/tmp/central-hill-about-cms-runtime`,
  checkout detached d4e13c9; log `server-final.log`. Runtime separado permitió
  construir sin interrumpir el primer grupo funcional de QA.
- DB/rolaboutcmsqa, PostgreSQL17 dedicado5578; proxy4478;
  redcentral-hill-about-cms-qa. S3rver9062 PID9890/sesión7024, bucketaboutcmsqa.
- Env y preload fake en la carpeta QA. Migraciones existentes0000..0021 aplicadas
  únicamente al entorno nuevo; **sin nueva migración** ni writes remotos.
- La preview conserva contenido sintético alterado por las comprobaciones; baseline
  previo en `qa-baseline.json`. Las fotos subidas son fixtures, no contenido real.
- Previews/worktrees3059/3060/3061 no fueron modificados, reiniciados ni reconstruidos.
  Guides sigue sin integrarse a main. Ningún main/push/despliegue en esta tarea.

A `/private/tmp/central-hill-about-cms-admin` (about-cms/admin), B
`/private/tmp/central-hill-about-cms-public` (about-cms/public), ambos preservados.
Sus symlinks locales `node_modules` son untracked, no archivos fuente ni commits.
Integración/runtime usan copias locales ignoradas. No queda código fuente untracked
fuera del cierre documental listado. No se copiaron credenciales de producción.

## Archivos contra baseline

- `AGENTS.md`
- `docs/data-model.md`
- `docs/decisions/0037-about-stable-lists.md`
- `docs/specs/about-cms-audit.md`
- `docs/specs/about-cms-execution.md`
- `docs/specs/about-cms-qa.md`
- `docs/specs/handoff-about-cms.md`
- `messages/en.json`
- `messages/es.json`
- `messages/fr.json`
- `messages/pt.json`
- `src/app/(admin)/admin/(panel)/pages/[key]/page.tsx`
- `src/core/i18n/content-write.ts`
- `src/core/i18n/index.ts`
- `src/core/i18n/source-snapshot.ts`
- `src/slices/pages/README.md`
- `src/slices/pages/about-content.ts`
- `src/slices/pages/admin/about-defaults.ts`
- `src/slices/pages/admin/about-media-validation.ts`
- `src/slices/pages/admin/about-save.ts`
- `src/slices/pages/admin/actions.ts`
- `src/slices/pages/admin/form-model.ts`
- `src/slices/pages/admin/layout.ts`
- `src/slices/pages/admin/queries.ts`
- `src/slices/pages/admin/ui/about-list-editor.tsx`
- `src/slices/pages/admin/ui/page-editor.tsx`
- `src/slices/pages/admin/ui/schema-fields.tsx`
- `src/slices/pages/contract.ts`
- `src/slices/pages/schemas/about.ts`
- `src/slices/pages/server/about-translations.ts`
- `src/slices/pages/server/queries.ts`
- `src/slices/pages/tests/about-content.test.ts`
- `src/slices/pages/tests/about-defaults.test.ts`
- `src/slices/pages/tests/about-editor.test.ts`
- `src/slices/pages/tests/about-media-validation.test.ts`
- `src/slices/pages/tests/about-presentation.test.ts`
- `src/slices/pages/tests/about-translations.test.ts`
- `src/slices/pages/tests/pages-admin.test.ts`
- `src/slices/pages/ui/about-page.tsx`
- `src/slices/pages/ui/about-presentation.ts`
- `src/slices/pages/ui/components/about-media.tsx`
- `src/slices/translation/README.md`
- `src/slices/translation/admin/actions.ts`
- `src/slices/translation/admin/ui/row-actions.tsx`
- `src/slices/translation/server/generate.ts`
