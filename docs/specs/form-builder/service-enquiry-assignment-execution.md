# Ejecución — Service enquiry Forms

2026-11-12. En curso. Handoff retomado a petición del usuario.

Auditoría de locale-store, locale-model/public, schemas, formulario, queries y rutas:
shared vive en Save, snapshots se activan por Publish independiente. Se elige autoridad
EN publicada fuera de shared; ver plan para contratos y write sets. Services no tiene
preview editorial público/privado existente; no se amplía ese sistema en esta tarea.

Checkpoint completo verificado antes de producto/delegación: tag
`restore/service-enquiry-2026-11-12-1794511343983` sobre `0f9e9f8`.
49 tablas/1515 filas, auth+ledger31, dos restores exactos; 1364 objetos Git/183 medios
SHA256 exactos. Privado `/private/tmp/central-hill-service-enquiry/checkpoint` incluye
dump/archivo/env/preload/local-files/manifiestos y RESTORE.md pareado. El primer intento
sandbox no pudo conectar localhost; repetición autorizada fuera de sandbox completó
sin modificar authoredmain. Nuevas bases restore y QA separadas, anteriores intactas.

Main3071 PID42708/parent42702 y media9081 PID42630 retenidos. Working tree solo tenía
PNGlogo y ambos symlinks públicos preexistentes; se preservan.

## Entorno y revisión previa

Implementadores aislados en service-enquiry/services y service-enquiry/forms; cada uno
tiene nueva DB schema-only serviceenquiryservicesqa20261112/serviceenquiryunitqa20261112,
env privado y preload de host/DB/rol exactos. Integration usa clon QA completo propio.
QA independiente revisa contratos y prepara harness con conservación antes/después;
sin navegador/escrituras hasta candidato verificado. Dependencias integration copiadas
por clonefile para Turbopack, sin alterar node_modules del usuario.

Los procesos heredados main/media dejaron de escuchar antes de la primera captura de
editor, fuera de acciones de esta tarea. Se reabrieron mismos scripts/archivos/env con
Node22 y preload original obligatorio; no cambio de DB/caché. Baseline readonly pasó
con espera de hidratación, sin Save ni captura de formulario. Dos intentos de harness
previos: login antes de hidratar y screenshot con ocultado de caret antes de hidratar
editor; el segundo provocó warning dev de atributos y POST de logging bloqueado.
Se corrigió solo espera de harness; no se deduce defecto de producto. Tercer pase0
pageerrors/0writes bloqueadas. Booking screenshot conserva diseño vigente.

Conservación main tras reapertura: 44 tablas de negocio+ledger/1504 filas exactas al
checkpoint; auth excluida únicamente por login local normal. Env/logo/ambos symlinks
SHA o destino exactos. Ninguna fixture ni escritura de contenido en main.

## Candidato integrado y comprobaciones

B `9305096` integrado `104d172`; A producto `84b50a6` integrado `23fd910`.
Write sets aislados respetados. A amplía también el guard antiguo saveService:
comprueba ausencia de adaptación dentro de la mutación serializada, evitando que
una petición legacy preleída altere booking/status después del primer Save editorial.
Delete se serializa; las limpiezas de contenido/slugs conservan sus rutas existentes.
PublicContactForm recibe className opcional con default previo mt-6; Service usa mt-0
porque ContactForm anterior era bare. No hay wrapper form adicional.

Root214 pruebas integradas afectadas pasan:204 del conjunto inicial +10 del único
archivo Service model que necesitaba cargar PNG/global AsyncLocalStorage/env fuera de
Next. Se corrigió solo harness privado y se repitió ese archivo, no los204 aprobados.
Primer CLI tsx no pudo abrir IPC en sandbox; se usó node --import tsx sin ese listener.
Typecheck0 tras copiar next-env.d.ts ignorado de main al checkout nuevo; lint0 con
7warnings antiguos, dbcheck31 con warning0008 histórico y detectorUI[]0. Nada de esto
requiere cambio de producto/SQL/config. Node22 explícito en comandos, default shell24.

Siete casos DB Forms sobre código integrado, base propia unitqa,0fallos/0skip:
archivo About/Guest/RealEstate, cuotas durables, Service draft/published/targets/identity,
captura contacto atómica/replays entre2Services+4ubicaciones/concurrentwinner y captura
en espera que observa desasignación fresca. B había pasado79pure/render+7DB y lint
antes de integrar. Sus primeros fallos de captura fueron hash del seed previo al
ordenamiento JSONB; harness corregido lee definición realmente guardada.

Build completo0 con preload privado limitado a2workers/4queries por worker,
sin override en next.config producto. Compilación14.8s y TypeScript13.5s pasaron;
generación estática215/215 rutas0 en8.1min, después de reintentos automáticos de60s
enBuildings ES/FR yGuest EN/PT (dos por ruta). No corrección/cambio producto ni
segundo build. Diagnóstico readonly PG durante generación:22idle+1active de400
conexiones máximas; sin evidencia de saturación. Caches/build/logs conservados.
Runtime deproducciónQA3086 listo para arrancar después del build completo aprobado.

A follow-up pruebas `5c31091` integrado `ed71e2a`, sin cambios producto respecto23fd910.
Tres casos DB propios: lifecycle real (alta/Save/Publish/targets/omisión/null/invalidref/
external/none/archivo/2Services) aprobado; dos concurrencias deterministas aprobadas
en services-db-locks-deterministic.log. Cada psql holder mantiene HEADER lock hasta
observar la mutación esperando en pg_locks; cambia status/revision del Form antes
de soltar. Save y Publish rechazan con conflicto y draft/published/revision exactos;
READCOMMITTED comprobado. Las primeras esperas de2s no alcanzaban el preflight y eran
fallos de timing del harness; se reemplazaron por control explícito y se repitieron
solo esos2casos. Lifecycle previo retenido. Limpieza solo UUIDs propios fallidos;
service/category/media/forms/slug/locale/shared propios terminan0. Typecheck final0
con archivo de pruebas nuevo. Total afectado214pure/render +10casosDB, todos pasan.
