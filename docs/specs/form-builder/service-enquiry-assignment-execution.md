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
