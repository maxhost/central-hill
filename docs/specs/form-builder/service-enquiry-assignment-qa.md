# QA independiente — Service enquiry Forms

2026-11-12. **APROBADO para integración funcional local** del candidato exacto
`1651d49a2a3717560ffb0374025d96b6a538f5c8`, producto `23fd910`, servido desde
`/private/tmp/central-hill-service-enquiry-integration` en3086.39 casos funcionales,
cero defectos de producto y cero pageerrors/adminerrors. No corrección de producto
ni nueva compilación requerida durante QA. Resend real queda fuera de esta aprobación.

## Entorno y separación

Host/DB/rol exactos `serviceenquiryqa20261112.local` / `serviceenquiryqa20261112` /
`serviceenquiryqa20261112`; preload propio a4558, Node22.23.3, EMAIL_PROVIDERconsole,
medios9081. Login normal con cuenta local; sin extraer tokens/cookies/storageState.
Toda mutación del harness exige RUN_SERVICE_ENQUIRY_QA=approved y guard SQL de identidad
antes de queries. QA no modificó producto, env, runtime ni cachés directamente.
Main3071/authoredmain excluidos. Ninguna escritura de medios, DDL, remoteDB/R2,
configuración externa ni correo real.

Checkpoint del root verificado antes de producto: tag
`restore/service-enquiry-2026-11-12-1794511343983`, código0f9e9f8;49tablas/1515filas
inclauth/ledger31, dos restores exactos,1364objetosGit/183mediosSHA. El clon QA se
inspeccionó inicialmente de sololectura y se tomaron huellas completas antes de crear
fixtures. El ejemplo4e1e32d3-927d-47de-8b57-dee7a1079e2b, private-airport-transfer,
estaba publicado/enquiry con slugs4locales y sin filas service_locale_content/shared:
la prueba cubrió su proyección legacy y bootstrap perezoso reales.

## Casos funcionales reales

- Editor/publicación,7casos. Público inicial EN/ES/PT/FR conserva sección/campos de
  contacto legacy. Selector al final de Booking con A, links crear/editar en otra
  pestaña y refresh que preserva selección y texto local. Target readonly refleja
  ENworking sin publicar y regresa a EN reteniendo trabajo. SinSave y después de
  SaveDraft público aún legacy; reload mantiene A en ENdraft. PrimerSave crea4filas
  locales conservando publicaciones legacy. ENdraft bloquea archive. PublishEN activa
  A4locales, no cambia JSONpublished/drafttarget, mantiene título/intro/contactos y
  un solo form sin heading de Forms duplicado.
- Captura,10casos. Público anónimo EN A doscolumnas,9tipos/2steps, DTOsinrecipient/test.
  File>5MiB rechazado cliente; PDF con bytes falsos rechazado servidor sin lead y
  retorna al paso del File. Date/File y respuestas sobreviven Next/Back. Un contacto
  real se registra como kindcontact/source service:<UUIDcanónico>, snapshotserviceId,
  campos/labels/options/date/filemetadata/consent exactos y marketingfalse. BO muestra
  categoría Contact y etiquetas legibles sin UUID como label. POST anónimo real replay
  idempotente; misma key con payload alterado rechazada; dos POST concurrentes con
  key nueva producen un solo lead. Una notificación console por ganador.
- Locales,3casos. ES/FR/PT muestran textos aprobados; PhoneFR pendiente usa EN sin
  exponer el texto pendiente. PTmóvil una columna sin overflow y captura conserva
  labels/aviso de consentimiento portugueses. No datos privados del Form en HTML.
- Creación,7casos:3iniciales retenidos +4pendientes completados desde el mismo Service.
  UI `/admin/services/new` ofrece selector antes de persistir identidad; primerSave
  guarda A y nueva ficha draft, EN público404. Para evitar uploads, únicamente el
  draft/shared/columna espejo del nuevo Service recibe por SQL un puntero a una imagen
  local existente válida; esto es preparación de fixture, no prueba de uploader.
  UI PublishEN muestra A; PTsinpublicar sigue404. UI PT Save/Publish sin cambios
  mantiene modeinherit y omite enquiry_form_id; edición de bodyPT se publica como
  custom sin alterar selección común A. POST real usando autoridad válida del segundo
  servicio y mismoForm rechaza la key del primero sin otro lead. Referencia manual
  malformed solo en el nuevo Service preserva H1/contenido/contacto legacy y el GET
  no la corrige; después se restaura el snapshot válido. La invalidación se ejercita
  con SaveEN real de A, todavía asignado al ejemplo. Null+PublishEN retira la elección
  del nuevo Service sin afectar A del ejemplo.
- Lifecycle,12casos. ServiceA independiente de headerB, chef-at-home legacy y contactos
  About/Guest/RealEstate originales. Con A compartido Header+Service, ENdraftB no
  invalida A abierto; capturaService siguecontact y Header siguecontact/header-contact.
  POSTs con keys cruzadas rechazan ambos sentidos. SaveEN y ApprovePT de A actualizan
  campos públicos sin cambiar revisión/publicaciónService; histórico mantiene label
  antiguo. PublishedA y draftB bloquean archive por separado después de retirar otros
  usos. PublishB vuelve A abierto stale sin lead extra, público nuevo usaB y bloquea
  archive. TeststaffB registra una prueba logged separada sin lead público. External
  conserva B y enlace externo sin secciónenquiry; none conservaB sin sección; elegir
  Form no cambia bookingtype. B sigue reservado mientrasexternal/none. ServiceArchive
  produce404 y conserva reserva de B; Restore recupera publicaciónB sin draft.
  Null+PublishEN final restaura exactamente campos/botón y copy/contactos legacy EN/PT.

A se creó desde template newsletter y sus capturas siguen siendo contact por la
ubicaciónService, no por la plantilla. A/B, nombre/recipient/source inicial se crearon
y guardaron por UI. La definición9tipos/2steps y120textostarget de A se prepararon
por SQL exclusivamente sobre A después de su creación: no se presenta ese seed como
cobertura browser del builder. Saves posteriores/ApprovePT se probaron por UI.

## Tanda visual y revisión de fuente

Una tanda posicionada, revisada también por root, sin correcciones: selector Booking
con helpers alineados y separación de SEO, enquiryEN desktop doscolumnas con columna
izquierda original intacta, PTmóvil una columna y Date/File/hint/botones legibles.
Capturas: `visual-selector-desktop.png`, `public-A-EN-step1.png`,
`public-A-PT-mobile.png`, `public-A-PT-mobile-lower.png`; `visual-batch.json` errores0.
No ronda estética adicional ni matriz global repetida.

Revisión de fuente independiente: referencia fuera de sharedvivo, autoridad ENpublished,
identidad UUIDservice+IDForm+published_at independiente de draftrevision/slug, guard
status/enquiry/publicacióndelidioma. Targets no crean autoridad ni custom por selección.
Publicinvalidref se separa de validación del contenidoService. Save/Publish/Archive/
Restore/Delete usan el lock de contacto antes del graphlock, snapshot fresco en
statementmutación separado. Guardas de disponibilidad/revisión dentro de mutación y
captura. Uso/archivo mira ENdraftORpublished, también servicios ocultos o non-enquiry,
case-insensitive; cuatro placements anteriores preservados. Contratos server-only y
DTOsinrecipient. EndpointService específico deriva source canónico y snapshotserviceId;
hash/sources impiden replays entre servicios/placements. Cuotasglobales/personales
compartidas, atomicidad/consent/marketingfalse/files y winner-onlynotification reutilizados.

Root aporta214pure/render y10realDB integrados, typecheck0, lint0(7oldwarnings),
dbcheck31, detector[] y build0/215static/2workers. Build tuvo retries automáticos60s
BuildingsES/FR y GuestEN/PT, sin producto/configsource cambiado. Se distinguen estos
comandos de los39casos browser. Omisiónantigua/tampering/uppercase,2servicios+
4placements con payloadsidénticos, carreraslocks/freshsnapshot y límites no repetidos
en navegador usan la evidencia de dominio/DB de root/writers.

## Incidencias del harness y ejecución acotada

`group-create.mjs` completó3casos y publicó el bodycustomPT; luego esperaba un tag
`main` inexistente en el layout público. Se corrigió solo el selector de lectura a
`body`. `group-create-resume.mjs` confirma customPT ya guardado y ejecuta únicamente
los4casos pendientes con el mismo Service; no recreación ni repetición de Save/Publish.
Ningún pageerror/adminerror ni defecto de producto asociado.

La primera comparación final de protección había aprobado todas las huellas y falló
al comparar Dateobjeto del driver con stringJSON del baseline en created_at del
Service. Se normalizó únicamente el valor del harness mediante JSON y se finalizó
la comparación de sololectura. Ningún dato cambió ni prueba browser se repitió.

Comandos Node22: prepare-browser0; seed-layout0; group1-editor0; group2-capture0;
group2-locales0; visual-mobile-lower0; group-create1 por selectorharness tras3casos;
group-create-resume0 completando4pendientes; group3-lifecycle0; final-data0;
protected-check1 por Date/stringharness y protected-check0 tras normalización.
Las restricciones sandbox de conexión requirieron escalación local autorizada; no se
recurrió a otro destino. Ningún runtime ni caché se reinició por QA.

## Conservación final y fixtures retenidos

`protected-check.json` aprobado:31tablas ajenas completas exactas, originalesForms/
FormTest/Leads/LeadFields y todasPages exactos, otrosServices+locale/shared/media
exactos,158slugs originales exactos,751translationrows originales exactos salvo
Settings permitido, ledger31exacto. El Serviceejemplo conserva todos sus campos
comunes originales salvo updated_at esperado y las relacionesmedia ordenadas exactas;
rowIDs de gallery y snapshotslegacy bootstrap son la excepción deliberada del clon.
Auth queda fuera de huellasnegocio por login normal.

`final-data.json` aprobado:5leads públicos (4contact/service:UUIDdel ejemplo y
1contact/header-contact),1testprivadoBdeliverylogged, exactamente1console notification
por ganador. Ninguna captura del nuevo Service. Targetpublished/draftdel ejemplo se
mantiene exacto a la línea base después del primerSave durante todo lifecycle.
EjemploEN y nuevoServiceEN terminan formnull/draftnull; Headernull. NuevoService
PTcustom y demás fixtures se conservan solo en el clon QA. Ninguna limpieza de datos
originales ni fixtures en authoredmain.

- FormA `eedb5f0d-f650-4e2d-81b9-23c3c7595e4e` (newsletter).
- FormB `6ce0c10e-94a4-4655-bb19-3dbda503f4df` (contact).
- NuevoService `52b83420-1e3d-42a7-b2f0-d872d4b5a52e`, slugservice-enquiry-qa-20261112-new.
- LeadEN `f93d0e23-f1c7-40c9-b52c-cb9818ab74b6`; carrera `956ee563-c6f3-40fc-9c3c-77d7f2a7dd2d`;
  PT `e59b21ca-98f9-48ab-adab-6878e96e4d25`. Dos últimosganadores constan en final-data.json.
- TestprivadoB `aeb45326-d751-4288-b136-0d098ec9d19b`.

Evidencia/scripts/JSON/capturas privados en `/private/tmp/central-hill-service-enquiry/qa`;
logconsole `/private/tmp/central-hill-service-enquiry/qa-runtime.log`; este informe en
`/private/tmp/central-hill-service-enquiry/qa-independent.md`. HEADintegration verificado
sin difftracked después de ejecutar QA. No bloqueantes abiertos para integraciónlocal.

**Resend sigueconsole/unconfigured.** Console no demuestra envío o recepción real de
correo/adjuntos. MainFF/aperturareadonly/conservación authoreddata y detener solo runtimeQA
corresponden a root; QA no los ejecutó.
