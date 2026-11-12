# Service individual → Consulta del servicio → Forms

2026-11-12. Implementado localmente y aprobado por QA independiente. Alcance: creación y
edición de cada `/admin/services`, nunca Pages → Services ni una selección global.

## Auditoría y autoridad

Services usa `service_locale_content` con snapshots draft/published por idioma y
`service_shared_content` vivo. Save actualiza inmediatamente los datos compartidos
y sus columnas espejo; Publish consume el draft guardado del idioma, incrementa su
revisión y `published_at`. Targets inherit siguen EN working al editar, pero su
publicación es independiente; custom mantiene texto propio. GET proyecta legacy sin
escribir. Nueva ficha tiene UUID cliente estable y reserva identidad draft al primer
Save válido; no es pública hasta Publish. Slugs existentes permanecen inmutables en
este editor. Archive/restore cambia visibilidad sin consumir drafts.

Decisión: `content.enquiry_form_id?: string | null` exclusivamente en snapshot EN,
fuera de SERVICE_SHARED_KEYS. EN Save draft privado; EN Publish activa la elección
común EN/ES/PT/FR sin tocar snapshots target. Target no es autoridad, no puede cambiar
la selección ni tomar modo custom por verla. Omisión antigua conserva EN anterior;
null explícito retira. No schema, migración, backfill, defaults materializados ni
GET writes. Validar UUID/disponibilidad/recipient/definición y repetir guard bajo lock
en Save/Publish. Referencias manuales inválidas no eliminan contenido público.

Solo booking_type enquiry muestra el formulario configurado. External/none conservan
su comportamiento, sin cambiar automáticamente booking_type al elegir Form. Guardar
la elección mientras external/none es válido; al pasar a enquiry usa EN publicado.
Los shared existentes siguen su semántica viva; el cambio no los rediseña.

## Checkpoint obligatorio completado

Tag `restore/service-enquiry-2026-11-12-1794511343983`, código `0f9e9f8`.
Privado `/private/tmp/central-hill-service-enquiry/checkpoint`: 49 tablas/1515 filas,
incluyendo auth y ledger31; columnas/constraints/conteos/huellas exactos en dos nuevas
restauraciones `serviceenquiryrestore20261112` y `serviceenquiryqa20261112`. 1364 objetos
Git y 183 medios SHA256 exactos. Env/preload/logo/symlinks preservados. RESTORE.md
recupera código+DB en checkout/base nuevos tras preservar el estado posterior, sin
mezclar automáticamente leads recientes. Restore DB excluida de QA.

## Contratos, experiencia y captura

Selector en tarjeta Booking del formulario común alta/edición: catálogo Forms con
nombre/disponibilidad/motivo, sin selección mantiene contacto actual; crear/editar en
otra pestaña y refresh sin perder ediciones. EN editable, targets read-only con acceso
EN. Ayuda explica activación por Publish EN y uso solo enquiry; Forms Save/Approve
actualiza campos públicos sin republicar Service. No se añade un sistema de preview
de Services: actualmente no existe; ninguna selección sin guardar sale al público.
Mantener sección #enquire, título/intro/contactos, sin duplicar heading de Forms ni
anidar forms. Runtime público existente con nueve tipos/filas/columnas/pasos/Date/File.

Services añade contrato server-only `readServiceEnquiryAssignment(serviceId)`,
`serviceEnquiryAssignmentGuard(serviceId,locale,formId,identity)` y
`serviceEnquiryUsageGuard(formId)`. Identidad SQL incluye UUID estable del servicio,
ID publicado y published_at EN, nunca draft revision/slug. Guard exige service visible,
booking enquiry, EN publicado y publicación del idioma solicitado. Forms expone
`readServiceEnquiryForm(serviceId,locale)` y acción explícita `submitServiceEnquiryForm`.
Public DTO/input añade serviceId UUID solo para esta ubicación. Nunca destinatario,
slug/destino libre o kind del cliente. Origen servidor `service:<UUID canónico>`;
kind contact independientemente de template. Snapshot conserva serviceId y origen
verificado; payload hash incluye servicio e identidad, evitando replays cruzados entre
servicios y con las cuatro ubicaciones existentes. Hashes/replays anteriores intactos.

Reutilizar captura atómica lead+fields/histórico/consent/marketingfalse, winner-only
console/email, cuotas durables globales/personales compartidas, honeypot, errores y
adjuntos PDF/imágenes 5MiB/20MiB. Bytes solo email, nunca persistidos/media pública.

Save/Publish/Archive/restore y delete Service se coordinan con HEADER_CONTACT_LOCK
(antes del graph lock7159,1), statements separados READ COMMITTED y mutación fresca.
Validación Form previa + guard revisión/status dentro de mutación. Forms Archive
bloqueado por EN draft OR published de cualquier servicio, incluso oculto/archivado o
external/none; target refs ignoradas, UUID case-insensitive. Cuatro guards previos
conservados. Forms Save/Approve invalida service-list y rutas públicas de servicios
asignados en cuatro idiomas, preservando invalidaciones anteriores.

## Write sets y secuencia

Raíz: checkpoint/envs/bases/worktrees, este plan/ejecución/ADR0084, integración,
verificación afectada, build y conservación authoredmain/apertura final readonly.

Implementador A aislado: `src/slices/services/**`, rutas admin Services, mensajes
Services. Incluye tipos/validación/editor/autoridad/server-contract/cache y pruebas
Services. Render llama API Forms acordada de B. No edita Forms/Leads/core.

Implementador B aislado: `src/slices/forms/**`, `src/slices/leads/form-capture-types.ts`
y, solo si necesario, capture-form-contact. Incluye acción/query/DTO/runtime,
archive/cache/notificación y pruebas Forms. Consume server-contract Services acordado;
no edita Services/Pages/Settings/core. Dependencias cruzadas por contratos únicamente.

Cada escritor usa su DB schema-only nueva y preload exacto; no authoredmain ni DB de
otro escritor. Integración por commits en worktree separado. QA independiente escribe
solo fixtures propias en `serviceenquiryqa20261112`, con conservación antes/después.
QA puede revisar el plan inicialmente pero no ejecutar antes del candidato verificado.

Pruebas afectadas: omisión/null/tampering/inherit/custom/creación/Publish separado,
invalid fallback, revisión/archivo concurrente y fresh snapshot, identidad estable,
dos servicios/mismo Form/crosskeys con cuatro ubicaciones, atomicidad/consent/files.
Browser agrupado: alta y edición real ejemplo, refresh preserva cambios, Save draft
sin leak, Publish EN cuatro idiomas sin tocar targets, captura histórica/Date/File,
Forms Save/Approve sin ServicePublish, stale/archivo ambos snapshots/null, external/
none, independencia de otros servicios/header/About/Guest/RealEstate, test staff.
Una tanda visual desktop/móvil y corrección focal solo si defecto. Typecheck/lint,
dbcheck31 sin aplicar SQL y build completo. Sin matriz global repetida.

Main3071 PID42708 y media9081 PID42630 se conservan; Node22, env actual y preload
`/private/tmp/central-hill-neon-content-local-copy/runtime.cjs` requeridos. Sin fixtures
ni Save en authoredmain. Resend console/unconfigured; sin correo real ni setup externo,
remoteDB/R2writes, push/deploy, limpieza de roles/bases/cachés/envs/media/worktrees.
