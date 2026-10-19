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
Contratos en preparación; ningún implementador iniciado todavía.
