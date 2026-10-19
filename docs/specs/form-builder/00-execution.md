# Constructor de formularios — spec y ejecución

2026-10-18. Base377cffd. Rama form-builder/integration, checkout
/private/tmp/central-hill-form-builder-integration, inicialmente limpio.
Proveedor confirmado por el usuario: **Resend**; la referencia final a SendGrid fue
un error corregido explícitamente. Implementación local autorizada con dos
implementadores y QA independiente. No main, push, despliegue, GitHub ni Neon producción.
Conservar previews3059–3063 y concepto3070.

## Resultado y límites

Catálogo /admin/forms para crear múltiples formularios desde Contacto, Newsletter o
Owner profitability (EARN +35% / Get your free profitability study). Nombre interno,
destinatario por formulario, borrador/archivo. Plantillas editables: añadir/quitar/
ordenar campos, asignarlos a pasos, una/dos columnas, ancho completo/medio. Tipos:
text, email, tel, textarea, number, select, checkbox. IDs UUID estables de campos,
opciones y pasos; select envía ID estable, conserva label en snapshot. Reglas required,
límites numéricos, textos de ayudas/placeholders, opciones y consentimientos.
Máximo40campos,6pasos,30opciones/campo; sin archivos, lógica condicional, pagos ni HTML.

Editor contextual propio: canvas izquierdo seleccionable, inspector derecho, modo
preview desktop/mobile, formulario/paso/campo seleccionables; botones de mover
accesibles, sin dependencia de drag-and-drop. Mensajes success/error, submit/next/
back/cancel editables. Cancel limpia valores/paso; volver conserva valores; validar
paso antes de avanzar, servidor vuelve a validar todo al enviar. Prueba explícita
sobre versión guardada; cambios sin guardar nunca se envían inadvertidamente.

EN fuente, ES/PT/FR tabs. Estructura/reglas/destinatario compartidos sólo editables
en EN. Textos traducibles por paths estables, guardar traducción en revisión o
aprobar explícitamente, fallback EN, mostrar stale. No traducción de datos enviados.

Este arco no incluye selector de formulario por página ni sustituye formularios
públicos. Home conserva Avantio; formularios actuales siguen con Leads. Owners wizard
actual es visual sin submit real: no afirmar que ya usa este constructor. No publicación
pública en esta fase: borradores con prueba staff y archivo. Versiones/publicación,
placements y su revalidación se especificarán al hacer el editor contextual de páginas.

Emails mediante core/email→Resend. EMAIL_PROVIDER=resend, RESEND_API_KEY, EMAIL_FROM.
Una casilla validada por formulario; reply-to opcional de un campo email válido.
Prueba requiere staff, persiste snapshot exacto y valores en form_test_submission
antes del intento. Resultado distingue aceptación por proveedor, consola, omitido y
fallo; nunca prometer entrega final. Todo el QA usa datos y transporte sintéticos.

## Contratos y ownership

ADR0038. Raíz aterriza types.ts, domain.ts (templates/textpaths/localización), schema.ts,
contract.ts antes de consumidores. API dentro del slice:
- listForms(): Promise<FormRecord[]>; getFormEditor(id): Promise<FormEditorModel|null>.
- createForm(template:FormTemplate,name:string): Promise<FormResult<{id:string}>>.
- saveForm(SaveFormInput): Promise<FormResult<{revision:number}>>.
- saveFormLocale(SaveFormLocaleInput): Promise<FormResult<{revision:number}>>.
- archiveForm(id:string,expectedRevision:number,archived:boolean): mismo revision result.
- testForm(TestFormInput): FormResult<{submissionId:string;delivery:DeliveryState}>.
Todas acciones requireStaff y validación servidor. Conflictos dejan borrador local intacto.
getFormEditor incluye traslaciones state+stale; usar approvedBlueprint para prueba.
Revisión aumenta en cualquier guardado estructural o traducción, CTE atómico fuente/target.

Asignaciones (cada escritor en worktree propio, contratos commit antes de iniciar):
- A backend: /private/tmp/central-hill-form-builder-backend, rama form-builder/backend.
  Sólo src/slices/forms/server/**, src/slices/forms/validation.ts,
  src/slices/forms/tests/**, src/slices/forms/README.md.
- B UI: /private/tmp/central-hill-form-builder-editor, rama form-builder/editor.
  Sólo src/slices/forms/admin/**, src/slices/forms/ui/**,
  src/slices/forms/messages/{en,pt,es,fr}.json.
- Raíz: src/slices/forms/{types.ts,domain.ts,schema.ts,contract.ts}, kernel email/env,
  kernel i18n target-snapshot seam/index, core tests de seams/email, migración0022
  y meta generada, shell/routes app/admin/forms, carga namespaces i18n/nav labels,
  docs/ADRs/catálogos/modelo/AGENTS. Ningún archivo compartido con dos escritores.
- QA independiente: sólo informe docs/specs/form-builder/01-qa.md; scripts/evidencia
  en /private/tmp/central-hill-form-builder-qa; no correcciones silenciosas de producto.

Interfaz UI: FormCatalog({forms:FormRecord[]}); FormEditor({model:FormEditorModel}).
Componentes exportados desde contract por raíz al integrar. Acciones server según
nombres anteriores, import interno del mismo slice. UI no maneja credenciales.

## Entregables y aceptación

1. Contratos/ADR/spec y tres blueprints (raíz).
2. Catálogo persistente + validación dinámica + textos por idioma (A).
3. Editor contextual + runtime de prueba desktop/mobile (B).
4. Resend + registro de prueba y composición/migración local (raíz+A).
5. QA normal independiente, correcciones puntuales, handoff local (QA+raíz).

Crear Contacto, añadir/quitar/mover campo, cambiar grid/textos y guardar/recargar.
Crear Newsletter y Owner; wizard valida, avanza/vuelve/cancela y confirma. Cambiar
ES sin alterar EN/estructura; guardar/revisar/aprobar y comprobar fallback. Prueba con
transporte fake registra destino, snapshot y payload Resend correcto. Probar un error
de validación y conflicto normal; sin matriz extensa ni pruebas repetidas sin motivo.
Anon no entra al admin ni acciones. Un pase agrupado desktop/mobile y una confirmación
si hay correcciones. Usuario puede crear2–3 formularios manualmente en preview aislada.

Checks integrados Node22/pnpm: typecheck, lint, tsx --test explícito tests del slice y
email/seam afectados, build, db:check. pnpm test/boundary:check son placeholders.
No SEO/ISR público nuevo; confirmar que no se tocaron rutas públicas existentes.

## Entorno y progreso

Pendiente aprovisionar formbuilderqa aislada; preview objetivo3064, PostgreSQL5598,
proxy4498, todos a verificar libres. No usar credenciales de producción. No uploads.
Contratos aterrizados en b0fee3d; backend7768804 integrado como0dd23a9.
Implementador A/B verificaron sus worktrees/branch/base limpio antes de editar.
PostgreSQL17 + local Neon proxy creados, identidad DB/role formbuilderqa comprobada.
Migraciones0000..0022 sólo aplicadas allí. Usuario staff sintético creado. Resend usa
clave ficticia y preload que captura en mail-capture.jsonl; no tráfico al proveedor.
Checks preliminares:3tests del transporte exit0; db:check exit0 (warning histórico0008).
Primer intento tsx en sandbox falló EPERM socket, rerun autorizado local exit0.
Integración UI/checks finales/QA completados; ver cierre al final.

## Candidato integrado y verificaciones

Candidato4cd453c (contratosb0fee3d, backend7768804→0dd23a9,
editorcee0982→50420c5, validaciónae98b5d→0a4ec57). Checkouts de implementadores
preservados con sus commits; único no versionado allí: symlink local node_modules.
Integración limpia al enviar a QA; ejecución local sin cambios a main.

En /private/tmp/central-hill-form-builder-integration, `source
/private/tmp/central-hill-form-builder-qa/env.sh`, Node22.23.3:

| Check en candidato4cd453c | Exit / evidencia |
|---|---|
| `pnpm typecheck` | 0; typecheck.log |
| `pnpm lint` | 0;7warnings históricos (mock/site3, mock/contextual2, postcss1, i18n/schema1); lint.log |
| `pnpm exec tsx --test src/slices/forms/tests/forms.test.ts src/core/email/tests/resend.test.ts src/slices/leads/tests/leads.test.ts src/slices/leads/tests/leads-admin.test.ts src/core/i18n/tests/actor-attribution.test.ts` | 0;28/28; tests.log |
| `pnpm build` | 0;build.log, repetido tras última corrección UI para verificar el candidato exacto |
| `pnpm db:check` | 0;23migraciones, warning histórico0008; db-check.log |

Logs en /private/tmp/central-hill-form-builder-qa. Detector Impeccable ejecutado
una vez sobre admin/ui de Forms: exit0 sin salida; no sustituye revisión visual.
Revisión manual de boundaries: Forms consume Backoffice sólo por contract;
core/i18n conserva ownership de escrituras de traducción, shell agrega screens y
rutas delgadas. No cambios de código en rutas/componentes públicos existentes;
no nuevos tags/SEO públicos porque todavía no existen placements.

Preview3064: nextdev PID2556, sesión3469, checkout de integración. DB/role
formbuilderqa, PostgreSQL17 puerto5598, proxy4498, red central-hill-form-builder-qa.
QA inició sobre4cd453c y aprobó ejecutablee33f078 tras correcciones acotadas; ver01-qa.md.

## Cierre local

**QA independiente aprobado** sobre códigoe33f078; informe localb7d8d4c.
Hallazgo P2 stepProgress corregido en4idiomas. Revisión de raíz detectó carrera de
edición mientras guardaba: fieldset/cambioidioma se bloquean en pending; QA confirmó
la corrección sin repetir la matriz. Capturas desktop/mobile inspeccionadas por QA
(y raíz sobre las mismas imágenes). No P1/P2 abiertos dentro del alcance.

Checks finales **sobree33f078**, todos exit0: typecheck-final.log,
lint-final.log (mismos7warnings históricos), tests-final.log (28/28),
build-final.log, db-check-final.log (mismo warning0008). Comprobación literal de102
llamadas i18n presente en todos los JSONs EN/PT/ES/FR; exit0.

Preview final3064 reiniciada por su dueño en **EMAIL_PROVIDER=console** para pruebas
manuales del usuario, PID16368, sesión23653, logserver-console.log. Selector real de
core/email comprobado en proceso local: resultado `{ok:true,id:"console"}`; no envío.
El QA anterior de Resend usó exclusivamente fake capture/rechazo503, con marcador de
fallo retirado. No se promete entrega real ni configuración de dominio/credenciales.

Handoff [02-handoff](02-handoff.md). Entrega permanece en rama de tarea, sin main,
push, deploy, GitHub o Neon producción. Se conservan todos los worktrees/commits y
previews anteriores. Quedan únicamente las exclusiones deliberadas (placements,
publicación/release pública y editor contextual de páginas) para el siguiente arco.

Follow-up L0 de estilo solicitado por usuario: selector de plantilla normalizado con
`appearance-none` y chevron, sólo en catálogo. Browser confirma ambos controles38px,
misma alineación/fuente14px/fondo/radio; seleccionar plantilla sigue funcionando.
ESLint del archivo y diff-check exit0; captura localstyle-fix.png. Sin cambios de lógica.
