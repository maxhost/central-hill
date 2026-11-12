# Real Estate → Enquiry → Forms

2026-11-12. Implementado localmente; QA independiente aprobado.
Solicitado por el usuario, mismo patrón About/Guest.

## Resultado y compatibilidad

/admin/pages/real_estate, elemento Enquiry: selector Form al final, inmediatamente después
de Note. Catálogo/admin/forms, nombre/disponibilidad/motivo, crear/editar enotra pestaña y
refresh sin perder cambios. Una selección común EN/ES/PT/FR, editableEN/read-onlytargets+
accesoEN; traducciones aprobadas Forms y fallbackEN. Activar solo al publicar RealEstateEN.
SaveDraft no cambia el público; PublishEN no publica ni modifica sus textos targets.

Referencia opcionalnullable deal_enquiry.form_id en el JSON existente. Ausencia/null/invalid
conserva el formulario estático actual de RealEstate, sin habilitarle envío ni sustituirlo
por el DealEnquiryForm antiguo que no tiene consumidores. Headline/lede/contacttitle/líneas
Settings/anchor#deal-enquiry permanecen de la sección. Cuando hay seleccionado, Forms
controla campos/filas/columnas/pasos/submit/consent/success/error; no duplicar heading ni
Description del Form. Submit label y Note de Page se conservan para el formulario anterior;
la ayuda del selector debe explicarlo. Header/About/Guest y otros CTAs permanecen independientes.

Nuevo formulario configurado sí captura en Leads como kind=deal_enquiry, origen fijo
source_page=real-estate-enquiry, independiente de templateinicial. Es la categoría existente
de consultas institucionales. No cliente-controlled kind ni destinatario. No cambios SQL,
DDLproducto/backfill/tablas. Ninguna escritura sintética sobre authoredmain.

## Checkpoint previo

Baseb7741ed. Solo PNGlogo+public/neoncontentlocal+public/propertylocalesqa preexistentes.
Checkpoint restore/real-estate-enquiry-2026-11-12-1794508510198, privado
/private/tmp/central-hill-real-estate-enquiry/checkpoint.49tablas/1514filas inclauth/ledger31,
columnas/constraints/conteos/huellas exactas en dos restauraciones nuevas:
realestateenquiryrestore20261112 y realestateenquiryqa20261112.1353objetosGit y183mediaSHA
exactos. Env/preload/código/archivos locales/symlinks preservados. RESTORE.md recupera ambos
código+DB juntos en nuevo checkout/base tras preservar el estado posterior; nunca sobrescribe
main ni fusiona automáticamente consultas posteriores. Mantener todos los puntos anteriores.

## Editorial y render

Solo publishedEN del JSON RealEstate decide la asignación pública común. Targets no pueden
alterarla; omitir campo en cliente viejo preserva, null explícito quita. No defaults
materializados: applyDefaults del adapter debe omitir exclusivamente el nuevo hiddenfield.
Validar UUID/existencia/definición/status/recipient en nueva elección, repetirPublish y
SQLguard dentro de mutación. Conservar revisión/template y EN-first rowlocks/editorlocaldraft.

Preview staff-only usa override explícito ENworking, también targettabs/unsaved; definición
Form guardada fresca, cuerpo inerte y sin captura/email. Referencia manual inválida nunca
elimina textosRealEstate ni se corrige al leer. No GETwrites/autosave. Reutilizar EnquirySplit
sustituyendo solo su slot del form, no anidar forms (FormCard es<form>). Mantener anchor,
contactos/panel y estilos existentes; usar frame presentacional equivalente si necesario.

## Captura, archivo y caché

Acción explícita submitRealEstateEnquiryForm relee autoridad publicada y definición vigente;
valida/captura/notifica por pipeline común. Derivar en servidor kinddeal_enquiry SOLO para
source real-estate-enquiry; los3orígenes anteriores siguencontact, hashes/replays intactos.
Replay también comprueba kind esperado además de ubicación/payload/form/revisión. Keycruzada
entre4ubicaciones nunca retorna éxito de otra; solo ganador notifica. Históricos/labels/
consentaceptado y marketingfalse, lead+fields atómicos. Sin avisoaceptado consent_atnull.

Cuotas durables/globales/honeypot son compartidos; alternar ubicación no multiplica cupos.
9tipos, filas1/2cols y múltiplessteps, Date/File retenidos; PDF/imágenes5MiB cada/20MiBtotal,
validación servidor, bytes solo email no media pública/persistencia/reintentos de adjuntos.

RealEstateSave/Publish se une al HEADER_CONTACT_LOCK existente juntoa Forms/Settings/About/
Guest/captura: lock statement separado y mutaciónREADCOMMITTED freshsnapshot. Guards de
asignación y revisión delForm dentro de captura; CAS/template/ordenlocks conservados.
Archive bloqueado por ENdraft O published RealEstate además de3ubicaciones anteriores;
targets no cuentan y UUIDcase-insensitive. Mensaje identifica lugares para desasignar.

ENPublish invalida tag común y4/<locale>/real-estate paths; FormsSave/Approve actualiza modelo
público y pathsusados sin republishRealEstate, manteniendo3invalidaciones anteriores. Contratos
server-only fuera de clientbarrels, sin cross-sliceinternalimports/ciclos ni cambios core.

## QA y entrega local

Dos implementadores aislados y QA independiente. DBs/writers schema-only propios; QAclone
propio con guard host/DB/rol/env/preload, fixturesA/B y excepciones dePages/Settings solo allí.
Comprobar ausencia/null/omisión/default, targettampering, draft/published/copylocal4, invalidez,
replays/crosskeys4/kind/atomicidad/consent/adjuntos/errorproveedor/locks frescos y archivo.

Browser agrupado desktop/mobile: selector bajoNote, refreshpreservaNote, links/estados,
previewENunsavedtargetinerte, SaveDraft/reload públicoanterior, PublishEN4sin tocar targets,
campos/filas/pasos/Date/File, captura deal_enquiry histórica, stale/identityDraft, archivo ambos
snapshots, FormSave/Approve sin PagePublish, nullestático. Regresiones focales Header/About/
Guest independientes/compartido y staffTest separado. No repetir matriz global previa.
Pruebas afectadas/typecheck/lint/build/dbcheck31 sin migraciones. Visualbatch1 y corrección
acotada solo si defecto real. Integración main local trasQA +apertura finalreadonly.

Resend sigueconsole/unconfigured; no correo real, externosetup, remoteDB/R2writes, push/deploy,
rolecleanup ni borrado de bases/envs/cachés/media/logos/worktrees/artifacts.
