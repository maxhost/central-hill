# Handoff local — Forms builder

2026-10-18. Arco iniciado antes del editor contextual de páginas a petición del usuario.
Proveedor confirmado **Resend** (la mención a SendGrid quedó corregida).

## Entrega

Rama `form-builder/integration`, checkout `/private/tmp/central-hill-form-builder-integration`.
Base377cffd; contratosb0fee3d; candidato funcional corregidoe33f078.
Spec/plan: [00-execution](00-execution.md). QA independiente: [01-qa](01-qa.md).
QA independiente aprobado: informe localb7d8d4c. Cierre posterior sólo documental.

`http://127.0.0.1:3064/admin/forms`. Usuario sintético local:
formbuilderqa@example.test / test1234. Tres plantillas base independientes: Contacto,
Newsletter y Owner profitability. Se pueden crear múltiples formularios, añadir/quitar/
ordenar campos/opciones/pasos, usar una/dos columnas, configurar reglas y mensajes,
traducir en EN/ES/PT/FR y probar la versión guardada. Canvas seleccionable e inspector;
preview desktop/mobile; archivo/restauración. Aprobación/fallback/stale según CMS actual.

Formularios creados siguen siendo borradores de catálogo: no están conectados a
páginas públicas. Selector por página, releases/publicación y sustitución de formularios
existentes se implementarán al construir el editor visual. Home sigue con Avantio.
El wizard público actual de Owners sigue visual; la plantilla nueva sí es comprobable
en la prueba staff, sin afirmar una integración pública que todavía no existe.

## Resend y entorno

Transporte de producción preparado por `core/email`, seleccionado explícitamente con
EMAIL_PROVIDER=resend, RESEND_API_KEY y EMAIL_FROM. Un recipient válido por formulario;
reply-to opcional tomado de un campo email. API keys/sender no editables desde CMS.
No cuenta, credenciales, dominio ni envíos reales configurados en este arco.

QA usa PostgreSQL17 + proxy Neon locales, DB/role formbuilderqa, puertos5598/4498,
red central-hill-form-builder-qa. Migraciones0000..0022 sólo aplicadas allí. R2 ficticio,
sin uploads. Pruebas Resend con clave ficticia y captura/intercepción en preload:
mail-capture.jsonl; ninguna solicitud al proveedor. La aceptación simulada en QA no
prueba entrega real. Resultado de prueba distingue accepted/logged/skipped/failed;
el snapshot de datos/consentimiento se guarda antes del intento de notificación.
Preview final: **EMAIL_PROVIDER=console**, no correos reales. Selector comprobado con
resultado `{ok:true,id:"console"}`. Server3064 PID16368/sesión23653, logserver-console.log.
El anterior servidor de QA PID2556 se detuvo por su dueño; las otras previews no se tocaron.

Entorno/scripts/logs/capturas en /private/tmp/central-hill-form-builder-qa.
Checkouts de implementadores preservados: form-builder/backend y form-builder/editor.
Previews3059–3063 y concepto3070 preservados. No main, push, despliegue, GitHub ni
Neon producción. Ninguna credencial de producción copiada a agentes.

## Archivos y comprobación

Cambios completos: `git diff --name-only 377cffd..HEAD`. Nuevos archivos Forms bajo
src/slices/forms (types/domain/schema/contract/validation, server, admin/ui,
4messages, tests y README),2rutas app/admin/forms + registro del shell, namespace/nav,
core email/Resend/env/tests, nuevo seam i18n targetSnapshotCtes y export,
migración0022+snapshot/journal, ADR0038 y documentación de arquitectura/spec/handoff.
No código público Pages/Settings/Leads modificado; Leads sólo se verifica como consumidor
del seam de email. Mock3070 intacto.

Checks registrados en spec: typecheck/lint/build/db:check exit0,28tests relevantes
exit0. Warnings históricos:7lint y1migración0008. Checks finales sobree33f078: typecheck-final.log/lint-final.log/tests-final.log/
build-final.log/db-check-final.log, todos exit0;28/28tests. QA01 confirma correcciones
puntuales; no P1/P2 abiertos. PT/FR comprobados por claves y estructura sin repetir
el flujo de envío en cada idioma; entrega real de correo no forma parte del QA local.
El detector de diseño no produjo salida; no se presenta como sustituto de revisión visual.

## Estado de Git al cierre

Código aprobadoe33f078; QAb7d8d4c; commit posterior de documentación sin cambios de
producto. La integración no deja archivos sin versionar; todos los archivos nuevos
se incluyen en los commits. Worktrees de implementadores preservados; sus symlinks
node_modules son locales/no versionados. Dos Contact drafts sintéticos adicionales
del harness quedan junto a los tres ejemplos completos, documentados en QA.
