# QA independiente — contacto configurable del encabezado

Fecha: 2026-11-12. **APROBADO para integración funcional local** del candidato `68a61719c51210577ed7507729c268392725b8ae` en `/private/tmp/central-hill-header-contact-integration`, producción QA `http://localhost:3082`. Resend real pendiente de configuración y recepción, fuera de esta aprobación.

## Identidad y alcance

- DB/rol/host verificados por guard: `headercontactqa20261112` / `headercontactqa20261112` / `headercontactqa20261112.local`. Todas las escrituras de QA fueron a ese dataset aislado.
- EMAIL_PROVIDER console; almacenamiento local 9081. No uploads a R2 ni llamadas de envío a Resend. Login normal con la cuenta local autorizada; no extracción de cookies/tokens/storageState.
- Root entregó checkpoint/restauración, build, typecheck/lint y pruebas DB/core. QA no repitió builds ni modificó fuente/env/runtime. HEAD y working tree permanecen en el candidato; solo symlink público preexistente sin trackear.

## Evidencia real de QA

Tres grupos acotados, **27 comprobaciones/casos registrados**, todos aprobados a la primera; cero pageerrors/adminerrors y cero escrituras externas bloqueadas/intentadas por los navegadores. Sin corrección de producto ni repetición de matriz.

1. `qa/prepare-browser.json` y `qa/group1.json`: creación A/B desde Admin y Save recipient; selector Settings→A persiste Save/reload y enlace a editor; popup anónimo EN sin nombre interno/recipient ni textos de prueba; título una sola vez; dos columnas; Date/File conservados al Next/Back. Archivo >5 MiB rechazado en cliente; archivo de contenido falso rechazado por servidor y regreso al paso anterior sin lead.
2. Envío real del formulario público hacia el servidor QA: un lead con nueve campos, fecha sin conversión, opción con label exacto, metadata PDF y consentimiento exacto, `marketing_consent=false`; no form_test_submission. BO muestra labels históricos y no UUID como etiqueta.
3. Replay **del POST real de la acción pública**, sin extraer autenticación: mismo payload/clave no duplica; misma clave con email alterado se rechaza; dos POST concurrentes con una clave nueva producen exactamente un lead. El log console contiene una notificación por cada ganador y ninguna por replay/colisión.
4. `qa/group2.json`: ES y FR desktop, PT desde contacto del drawer móvil en otra página; títulos/campos aprobados, campo FR pendiente utiliza EN sin filtrar texto pendiente. PT una columna, viewport sin overflow, foco contenido y Escape. Captura pública PT guarda labels/aviso de consentimiento PT exactos.
5. `qa/group3.json`: A abierto rechaza stale después de seleccionar B, sin consulta extra; nuevo popup muestra B. Archivar B asignado se rechaza con mensaje recuperable. Save EN y Approve PT actualizan público sin Page Publish. Editar el label de A después no cambia el lead histórico.
6. Prueba privada guardada de B continúa en form_test_submission con delivery logged y sin lead público. Null vuelve al contacto original. About y Service inline, y los ContactDialog propios de Owners/Buildings/Guests, conservan sus formularios anteriores.

Las definiciones A/B y recipient/título inicial se crearon/guardaron mediante UI. Los nueve tipos/estructura/120 textos target de A se completaron mediante seed SQL limitado a ese nuevo formulario para reducir preparación del editor; esto no se presenta como prueba browser de crear cada campo/traducción. Save EN posterior y Approve PT de B sí se probaron desde UI.

## IDs de fixtures retenidos en QA

- A: `46941454-7694-4b98-9524-d3646ed2ba27`.
- B: `2c6d95d5-7485-4f5d-b2ec-a24508af13de`.
- Leads: `c1ad3d79-eff6-4e97-813e-d8bc599fe279` EN; `8635def3-4114-4b62-87af-dd2de78263c9` EN carrera; `38359cf6-2e54-4b4b-90e1-a13575e3535d` PT.
- Test privado: `e9374630-a20a-4b6c-96ad-8223c741dab0` de B, delivery logged.
- Settings del dataset QA termina con header_contact_form_id null. Fixtures propias retenidas, sin limpieza de contenido ajeno.

## Protección de datos y límites de la prueba

`qa/protected-check.json`: 36 tablas de negocio ajenas exactas antes/después; filas originales de form_definition/form_test_submission/lead/lead_field exactas al excluir únicamente A/B y sus nuevas capturas. Ledger31 exacto. Settings, sus10 filas de traducción y contadores rate-limit son cambios autorizados de este dataset y no se declaran exactos. El main3071/authored clone no fue leído/escrito ni conmutado por QA.

Root aporta por separado pruebas reales de serialización, primer Save/singleton y límites rate entre procesos. QA revisó esas costuras y los guards del candidato, pero no presenta esos comandos root como tests browser propios. Omisión de cliente viejo y estados vacío/inválido están respaldados por source/tests de root, no por simulación browser de un bundle antiguo.

Se inspeccionaron visualmente Settings con A seleccionado, popup EN con campos/date/file y popup PT móvil: legibles, jerarquía coherente, sin recorte horizontal. El modal móvil desplaza su contenido dentro del viewport. No se abrió una iteración estética adicional.

Recepción real por Resend, entrega/recepción de adjuntos y DNS/remitente no comprobados porque la configuración está pendiente. Console demuestra construcción de notificación y captura durable, no entrega de correo.

## Archivos

Scripts y JSON de los tres grupos, baseline/after/protected-check y fixtures en `/private/tmp/central-hill-header-contact/qa/`; 15 capturas PNG de evidencia. `qa-runtime.log` del root conserva exclusivamente las notificaciones sintéticas del candidato. No defectos de producto abiertos en el alcance comprobado.

## Apertura de main después de integrar

QA confirmó main3071PID2270/cwd workspace: Settings200 con nueva sección y opción
por defecto actual; Forms200; contacto EN/PT200 con fallback; cero pageerrors.
Solo login normal y lectura, sin Save/Create/Publish/upload/submit. Comparación
del artefacto migration-main.json:47tablas previas exactas yledger31. Evidencia
main-open.json/main-open.png/main-contact-en.png/main-contact-pt.png en el root
de artefactos. El QA no reinició ni cambió código/env/DB del main.
