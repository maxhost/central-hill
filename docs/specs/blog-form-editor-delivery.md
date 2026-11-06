# Blog — formulario editorial y rich text

2026-11-06. **Implementado y verificado en alcance funcional local.**
Savepoint9ff9b76; código final **8064fab**, rama `blog-form/integration`, checkout
`/private/tmp/central-hill-blog-form-integration`.
QA independiente: **984e9a0**, [informe](blog-form-editor-qa.md).
[Spec/ejecución](blog-form-editor-execution.md), [ADR0059](../decisions/0059-blog-form-rich-text.md).

## Resultado confirmado

Título en input separado, body de escritura continua con barra de formato e
inserción de imágenes, portada y SEO/imagen social en formularios. Tabs EN/ES/PT/FR,
Save draft/Publish, referencias EN y adopción explícita, guardas y scoped uploads
conservados. No canvas, inspector contextual ni iframe en el editor de posts.
Pages mantiene su editor. Services no iniciado; su propuesta de UI queda pendiente
de adaptar a formularios antes de implementar. Properties no se rediseñó aquí.

Tiptap3.33.0 exacto sólo en admin. Codec preserva los ocho bloques legacy y sus
atributos. Formato de texto en runs opcionales JSON validados (bold/italic/href),
texto plano coincidente y React seguro, sin HTML persistido. No cambio de tablas,
migración ni kernel. Los endpoints privados de preview anteriores siguen por
compatibilidad, fuera de la interfaz principal de autoría.

## Verificación y correcciones

Node22.23.3/pnpm10.8.0. Artefactos `/private/tmp/central-hill-blog-form-qa`:

- Typecheck/lint global exit0 sobre5ec115a (7warnings existentes),43/43pruebas
  enfocadas exit0: codec/render, Blog body/admin/locale validation/state/headings
  y Backoffice page-editor-bridge. Comando `pnpm exec tsx --test` con esos8archivos
  explícitos; logs typecheck.log/lint.log/tests.log.
- Una lista con un ítem formateado y otro vacío no permitía draft. f207abb usa
  runs[] para el vacío; regresión draft acepta/Publish rechaza,8/8codec/render0.
- 52f61b6 asocia las etiquetas de campos nuevos con inputs; navegador confirma
  Caption/Alternative text/Attribution/Callout/Label/URL/Number/Link URL.
- QA confirmó false dirty tras Save/reload por orden de keys JSONB vs codec.
  a2a954e compara documentos semánticamente conservando orden de arrays;
  3f3b9ec suprime updates de setEditable y transacciones sin cambios;
  8064fab evita preparar referencias EN por ecos semánticos, incluido TrailingNode.
  Regresiones texto/formato/orden real vs keyorder/eco: **16/16** state+codec/render
  exit0, tests-echo-regression.log. No se repitió la suite amplia sin necesidad.
- Final8064fab: `pnpm typecheck`, ESLint de archivos afectados y `pnpm build`
  exit0; typecheck-echo-fixed.log/lint-echo-fixed.log/build-echo-fixed.log.
- Detector3UI: un warning de border-l-2 en cita semántica, estilo del renderer
  público existente. Root revisó juntos desktop y móvil finales; no pidió pulido.

QA real agrupada pasó: primer Save de los8bloques legacy exactos, escritura/Enter/
caret, formato/enlaces/lista/cita/undo/redo, paste semántico y rechazo sin pérdida,
2uploads reales cover+inline con normalización inmediata antes de reload, cuatro
idiomas Save/Publish/reload sin alterar otros documentos ni trabajo local oculto,
HTML público strong/em/a/img+SEO, móvil390 sin overflow/guardas, y New primer/segundo
Save estable (post7a6b4af0-52cc-4afd-8cfb-47b926b3648d, revisión2). Browser errors[].

El retest confirmó EN limpio y Publish habilitado al recargar. Para targets sin
draft, el servidor existente ya prepara referencias EN al construir working; la
UI conserva exactamente initial.working, no añade cambios al montar ni escribe
revisiones. Las publicaciones congeladas siguen intactas hasta Publish explícito.
No se cambió esa política backend como efecto de cambiar el formulario.

## Entorno, permisos y límites

Preview **http://localhost:3075/admin/posts/f4000000-0000-4000-8000-000000000001**,
PID61394/session90409; listado /admin/posts, nuevo /admin/posts/new.
Login sintético `propertyqa@example.test` / `PropertyLocalesQA2026!`.
DB/rol comprobados propertylocalesqa, Postgres5658/proxy4558; storage propio9075,
session34225, copia de bytes sintéticos anteriores y nuevos uploads sólo propios.

La rama necesita schema0025; postlocalesqa tenía0024 y se dejó intacta. Auto-review
rechazó inicialmente fixtures Blog en propertylocalesqa por la diferencia frente
a la autorización original. **El usuario luego autorizó explícitamente esas
pruebas en propertylocalesqa**. Seed propiof* y pruebas se ejecutaron sólo después,
sin migraciones ni modificación de fixtures previos. No queda permiso pendiente.
No se ejecutó workaround. Build inicial leyó el entorno sintético, no lo migró.

El seed preparado en artifacts aborta si sus IDs existen, no es para repetir
sobre los fixtures ya editados. QA conserva scripts/secuencia, resultados,
capturas e intentos de harness corregidos, sin resetear DB. Nuevos assets:
cover13257f9a-d691-452d-9aac-fdbc95e63241 e inline063dfa7f-fe6d-4498-b7fe-62c89a73a010.
Storage HTTP prueba bytes/normalización/scoped flush, no firmas S3/proveedor real.
Launcher ignorado permite sólo endpoint local9075; next.config del producto igual.
.env.local sólo sintético; preload bloquea Neon remoto. No envíos reales.

Preservados3071, Blog3072, Properties3073, sus fixtures/DBs/storage y worktrees,
y logo original. Sin main merge, push, deploy ni Neon remoto. Untracked de esta
integración: public/propertylocalesqa, symlink al storage propio. No limpiar ni
parar otros previews. Esta rama incluye el hito Properties anterior y el nuevo
formulario Blog;3072 conserva el editor anterior para comparación.

## Archivos frente al savepoint

```text
AGENTS.md
docs/data-model.md
docs/decisions/0059-blog-form-rich-text.md
docs/decisions/README.md
docs/specs/blog-form-editor-delivery.md
docs/specs/blog-form-editor-execution.md
docs/specs/blog-form-editor-qa.md
docs/specs/entity-locale-editors-spec.md
docs/specs/service-locale-editors-plan.md
docs/specs/service-locale-editors-spec.md
messages/en.json
messages/es.json
messages/fr.json
messages/pt.json
package.json
pnpm-lock.yaml
src/slices/backoffice/ui/admin-workspace.tsx
src/slices/blog/README.md
src/slices/blog/admin/rich-text-codec.ts
src/slices/blog/admin/ui/post-editor-state.ts
src/slices/blog/admin/ui/post-locale-editor.tsx
src/slices/blog/admin/ui/post-rich-text-editor.tsx
src/slices/blog/admin/ui/post-rich-text-nodes.tsx
src/slices/blog/body.ts
src/slices/blog/server/post-locale-validation.ts
src/slices/blog/tests/post-editor-state.test.ts
src/slices/blog/tests/post-rich-text-codec.test.ts
src/slices/blog/tests/post-rich-text-render.test.tsx
src/slices/blog/ui/components/body-renderer.tsx
src/slices/blog/ui/components/inline-rich-text.tsx
```

## Topbar follow-up —2026-11-06

User asks to distinguish sidebar toggle from Back. L0 interface refinement: global
toggle now uses the existing server-rendered Iconoir layout-left panel icon in a
ReactNode slot (no new kernel icon/API). Its labels say Hide/Show sidebar in4locales.
Blog's existing guarded All articles action moved into sticky editor header, with
a back chevron and explicit Back to articles label. No duplicate back button below.
Same leave guard and sidebar state behavior. No tests/automatic QA for this L0;
user validates3075. Source files admin-shell/admin-workspace/post-locale-editor +
messages4locales. Preview will use Next dev for immediate local iteration; existing
production build remains preserved. No DB/content writes or migrations.

Local3075 updated to Next dev PID87661/session87991, ready376ms. No automatic
tests/QA/typecheck/lint/build/detector in this aesthetic follow-up. User reviews
the header. Previous production build and all earlier artifacts are retained.

## Sidebar icon compilation correction —2026-11-06

User reported server-only build failure from the L0 follow-up. Root introduced
that import by using Icon in AdminShell; the mixed Backoffice contract is also
reached by client components, so an RSC slot did not isolate the import graph.
Fixed in **a171af2**: remove server Icon/slot; extend generated client UiIcon
allowlist with layout-left and render it in AdminWorkspace. ADR0060 covers this
root-owned core addition. Generator regeneration changed only ui-svg.ts; full
map/names/sprite remained identical. Back-to-articles behavior and labels retained.

Functional verification for this reported regression: pnpm typecheck0, pnpm lint0
(7existing warnings), pnpm exec tsx --tsconfig src/core/ui/tests/tsconfig.json
--test src/core/ui/tests/icon.test.ts10/10pass, pnpm build0. Browser actual Blog
editor and Forms both HTTP200, no pageerrors; sidebar hide/show toggles and Back
button present. No content writes/uploads/saves or migration; no broad QA matrix.
Logs/artifacts under /private/tmp/central-hill-blog-form-qa/sidebar-icon-fix.
Runtime remains Next dev3075 PID87661/session87991; no prior preview stopped.
