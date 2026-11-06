# Blog — corrección conceptual a formulario y rich text

2026-11-06. Usuario confirma título en input separado, body de escritura continua
con toolbar e imágenes insertables, portada/imagenSEO/SEO en forms. Tabs EN/ES/PT/FR
y Save draft/Publish por idioma se conservan. Se autoriza corregir Blog; no se
extiende aún a Properties ni implementar Services. Pages mantiene su editor.

Base6e59976 property-locales/integration. Cambios documentales Services pendientes
se capturan como propuesta antes de código: AGENTS, entity-locale-editors-spec y
service-locale-editors-{spec,plan}. Preservar public/propertylocalesqa sin rastrear
y todos los previews3071/3072/3073, DBs, logo y worktrees. Sin main merge/push/deploy.

Integración propuesta blog-form/integration, /private/tmp/central-hill-blog-form-integration.
Dos writers en /private/tmp/central-hill-blog-form-richtext (blog-form/richtext) y
/private/tmp/central-hill-blog-form-ui (blog-form/ui). Se crean tras contratos.

Resultado: formulario editorial amplio, título/resumen/body como columna principal;
metadata/categoría/autor/fecha/featured/relacionados, portada, SEO/OG y CTA en grupos
de formulario. Toolbar body títulosH2/H3/H4, negrita/cursiva, enlaces, listas, cita,
separador, undo/redo e insertar imagen con MediaField/scoped queue actual. No canvas
de sitio, inspector contextual ni preview embebida. Public preview separado opcional
sólo si usa estado guardado; no perder borradores ni reintroducir guardado live.

Se incorpora Tiptap React/StarterKit/PM cliente, sin servicio externo ni core changes.
ADR0059 explica dependencia y extensión JSON aditiva: text plano sigue en cada
bloque, inline opcional [{text,bold?,italic?,href?}], listas inline_items opcional.
Schemas aceptan legacy sin cambios, marks validados, mismos límites, sin HTML
persistido/renderizado. Rich runs deben concatenar exactamente al texto plano.
Mantener los8tipos y campos legacy, sin pérdidas al abrir/guardar contenido viejo.

Root único writer: package.json/pnpm-lock, blog/body.ts y server/post-locale-validation.ts,
contract/exports si hacen falta; mensajes4locales (blog.richText namespace),
backoffice/ui/admin-workspace.tsx, docs/ADR0059 y docs de continuidad/entrega;
config/harness/env sólo artifact. Root instala dependencias y fija commit contractual.
A Richtext: nuevos blog/admin/ui/post-rich-text-editor.tsx, post-rich-text-nodes.tsx,
blog/admin/rich-text-codec.ts, blog/ui/components/inline-rich-text.tsx y modificación
body-renderer.tsx; tests/post-rich-text-codec.test.ts y tests/post-rich-text-render.test.tsx.
B Form: blog/admin/ui/post-locale-editor.tsx y nuevo post-editor-form-layout.tsx si
necesita; tests/post-form-layout.test.tsx si aporta prueba de conducta real, no snapshots.
No writer toca rutas, schemas, persistencia ni archivos del otro.
QA independiente: sólo docs/specs/blog-form-editor-qa.md; artifacts externos propios.

Contrato A: PostRichTextEditor({value:PostBody,onChange(next),previews,onPreview,errors?,
disabled?,localeKey:string}) controla documento sin rerender/reset de caret por cada
keystroke; localeKey cambia con idioma y recupera estado correcto sin stale closures.
Codec exports postBodyToEditorDocument(body), editorDocumentToPostBody(document);
sin dependencia React/DB y roundtrip exacto legacy. Los tipos JSONEditorDocument
se definen en codec y A es dueño. B sólo importa PostRichTextEditor, no internals.
A usa namespace blog.richText y keys fijados root antes de consumidores.

Shared writer files backend/persistence existentes se preservan; root sólo añade
validación de inline sin cambiar Save/Publish/actor/revisiones. Cualquier expansión
de ownership se registra antes de editar. No callers cross-slice internos nuevos.

QA funcional necesario por serialización/comportamiento: typecheck/lint, focused
codec/render + existing Blogstate/validation/backend/bridge afectados, build; no
migración ni db:check nueva requerida. Browser real4idiomas, inputtítulo/bodytoolbar/
inlineformat/link/list/quotes/images, contenidoslegacy8tipos, Save/reload/Publish
aislados, newfirst/secondSave, guardas/caret/undo/mobile/SEOmedia. Ronda agrupada
y retest dirigido, sin matriz ampliada. Sólo estética futura sería L0.

Entorno: reutilizar DB sintética postlocalesqa autorizada para Blog y storage9072;
fixtures nuevos de namespace propio, no cambiar fixtures anteriores del usuario.
Preview nuevo3075 propuesto, sin detener3072/3073. Verificar current_database/user
antes de mutar. No nueva DB/migración, no remoto, sin credenciales productivas.
Si entorno o autorización existente no alcanzan, completar trabajo libre de DB y
solicitar sólo el acceso faltante concreto; no repetir permisos ya concedidos.

Lectura oficial Tiptap React y React node views:
https://tiptap.dev/docs/editor/getting-started/install/react
https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react

Usuario confirma explícitamente: input título separado; body continuo con toolbar
y posibilidad de insertar imágenes; forms portada/SEO/imagen social. Dependencias
Tiptap3.33.0 instaladas exactas en checkout aislado. Contratos root preparados
con inline opcional e inline_items, validación de igualdad texto/run y linksseguros.
Node22 typecheck de contratos se registra antes de delegar. Namespace blog.richText
con43keys en4idiomas. PostRichTextEditor props exactas arriba; A importa tipos
InlineTextRun desde body.ts; inline render tipado `InlineRichText({text,runs?})`.
Root ajuste workspace: posts usan ancho de formulario/sidebar normal; Pages sigue
su modo actual. El workspaceKey de posts permanece estable New->Edit.

Ajuste de entorno antes de cualquier mutación: el checkout incluye Properties
y requiere tabla0025; postlocalesqa sólo tiene0024. No aplicar0025 allí ni tocar
su schema. Reutilizar propertylocalesqa ya autorizada, schema completo0025, con
fixtures Blog nuevos y IDs propios. Sin mutar fixtures existentes de Properties
ni Blog3072. Storage nuevo9075 copia sólo bytes sintéticos existentes de9073,
sin alterar el servidor anterior; preview3075. No nueva DB ni migración.
La aprobación existente de propertylocalesqa y pruebas sintéticas se conserva.

Aprobación de la nueva combinación task/DB PENDIENTE: auto-review rechazó antes
de ejecutar el comando de fixtures de Blog en propertylocalesqa, por no quedar
clara la cobertura de la autorización previa (Blog nombraba postlocalesqa). Se
pide permiso explícito al usuario; no inferirlo. Script seed.cjs preparado como
archivo revisable, no ejecutado; no login/Save/Publish/upload hasta respuesta.
La frase anterior sobre autorización conservada no cubre esta ampliación según
el auto-review. Build/lecturas y checks sin DB pueden continuar. No workaround.

Candidato integrado5ec115a: typecheck/lint0 (7warnings previos),43/43focused0,
build0, sin DB writes. Root detectó el draft de lista con marcas+ítem vacío;
A corrige con aff212d integrado como f207abb y regresión draft acepta/Publish
rechaza. Retest enfocado+build final en curso; preview3075 propio detenido para
servir sólo ese build final. Detector3UI: un warning semántico border-l-2 del
blockquote, mismo tratamiento del renderer público, no fallo de funcionalidad.
QA independiente fuente sin bloqueantes adicionales; navegador persistente
permanece pendiente de aprobación DB explícita. No reclamar aprobación funcional.

Root amplía ownership documental antes de editar: src/slices/blog/README.md,
docs/data-model.md y docs/decisions/README.md para registrar formato aditivo y
corrección de autoría; no cambios de kernel/schemaDB.

Checkpoint actual: f207abb funcional; source reviewb7a253a sin aprobación funcional.
8tests dirigidos y build final0. Runtime final3075 PID44052/session37321 loginGET200,
storage9075/session34225. Entrega registra pendiente explícito de permiso DB y
procedimiento de reanudación, no tarea terminada/QA aprobada.

Usuario responde explícitamente: «Sí, autorizo esas pruebas sintéticas en
propertylocalesqa». Se levanta el bloqueo para seed propio f*, login y QA normal
en3075, sin migraciones ni modificación de fixtures anteriores/Blog3072/remoto.
Checkpoint previo1a0888c conserva el estado anterior pendiente; siguientes notas
y entrega deben registrar esta autorización y los resultados reales.

QA confirma bloqueante en52f61b6: reload/Save de draft muestra false dirty, con
working/draft iguales según deepEqual pero distinto orden de keys JSONB/codec.
Root amplía ownership antes de editar a blog/admin/ui/post-editor-state.ts y
blog/tests/post-editor-state.test.ts: igualdad semántica JSON preservando orden
de arrays, tests key order vs cambios reales. A corrige setEditable emitUpdate
y onUpdate sin docChanged para no preparar targets sin edición. QA detenido en
punto seguro; integrar ambas correcciones y retestar reload/Publish/idiomas.

Dentro de la misma corrección, root impide changePostField para valores iguales
semánticamente. StarterKit tiene TrailingNode: una normalización puede cambiar
el doc interno sin editar body publicado. Regresión prueba que ese echo no adopta
cover EN al montar FR y que una edición real sí prepara referencias, preservando
la publicación. QA ya planificó precisamente esa confirmación de mount FR.

Cierre funcional: QA completa grupos restantes sobre8064fab, sin bloqueantes:
clean reload/Publish, targets igual initialserver,4idiomas aislados, media/markup/
SEO público, móvil y NewdosSavesUUIDestable. Typecheck/scopedlint/build final0,
16regresiones dirigidas0. Root inspeccionó desktop/móvil juntos: UI corresponde
a input título+body continuo+forms metadata. Nuevo runtime3075PID61394/session90409.
Sin nuevas rondas amplias ni casos pendientes; informe final se enlaza en entrega.

QA funcional independiente aprobada en984e9a0, candidato8064fab,18grupos
acotados exitosos. No hallazgos bloqueantes ni casos requeridos pendientes.
Entrega final enlaza informe/entorno y root conserva todos los previews.
