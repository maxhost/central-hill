# Property forms — QA independiente local

2026-11-06. **Aprobado en el alcance funcional local acordado.** Candidato
**fed9fb8**, rama `property-forms/main-integration`, checkout
`/private/tmp/central-hill-property-forms-main-integration`, sobre main0e72983.
No quedan hallazgos de producto bloqueantes en esta ronda normal acotada.
El merge y arranque posterior desde el checkout real de main pertenecen al cierre
del orquestador; esta aprobación corresponde al candidato integrado probado.

[Alcance y ejecución](property-form-editors-execution.md),
[ADR0061](../decisions/0061-property-forms-and-shared-data.md).

## Entorno y procedimiento

Revisión independiente de fuente y una ronda funcional agrupada en Chromium
headless contra producción local **http://localhost:3071**. El usuario autorizó
posteriormente aplicar0026 y las escrituras sintéticas: la revisión provisional
anterior en8c6521b no había ejecutado persistencia ni otorgado aprobación funcional.

DB y rol comprobados por QA mediante SQL antes de cada script: ambos
**propertylocalesqa**, proxy4558, storage9077 con CORS3071. Env sintético en
`/private/tmp/central-hill-property-forms-qa/env-3071.sh`; el preload redirige el
host de QA al proxy local y rechaza Neon remoto. El orquestador aplicó únicamente
0026 y creó los fixtures nuevos antes de esta ronda. Storage HTTP sintético
permite PUT/GET/HEAD; no valida firmas S3.

QA usó sesión editor sintética, acciones reales del manifest y respuestas reales
Next-Action, sin sustituir datos, consultas, acciones ni contenido publicado.
Las esperas usan respuesta/estado visible o carga efectiva de imagen, sin pausas
fijas para declarar éxito. Los tres scripts comprobaron las operaciones en una
secuencia continua, sin resetear ni repetir baselines ya mutados.

Artefactos, scripts, resultados y capturas:
`/private/tmp/central-hill-property-forms-qa/independent`.

Comandos de QA ejecutados desde el candidato, todos **exit0**:

```sh
source /private/tmp/central-hill-property-forms-qa/env-3071.sh
node /private/tmp/central-hill-property-forms-qa/independent/baseline.mjs
node /private/tmp/central-hill-property-forms-qa/independent/media-apartments.mjs
node /private/tmp/central-hill-property-forms-qa/independent/new-mobile.mjs
```

Se modificaron sólo e400...001 Building, e500...001 Apartment, e700...001 FAQ y
media nueva de estos fixtures, más dos nuevas identidades propias creadas desde
los formularios: Building69a344cf-8a61-44e3-a35a-aa2d9869f70b y
Apartment46559ec8-b82f-49fb-be9b-cc532936feab. Identidades completas y slug en
`created-identities.json`. Los fixtures previos d*/f* mantuvieron exactamente sus
huellas y recuentos de identidad, snapshots Properties y snapshots/artículos Blog.
No se escribió Neon remoto ni se hizo push/deploy en esta revisión.

## Resultado funcional —10grupos aprobados

| Grupo | Evidencia observada |
| --- | --- |
| Legacy/GET/formulario | Cuatro detalles públicos iniciales resuelven EN anterior. GET público y ambos editores conservan sus tablas locale/shared vacías. PT pendiente Building/FAQ/Apartment se conserva. Controles tradicionales y SEO Apartment visibles, sin iframe ni selector Element. |
| EN y propiedad Building | Save EN propaga working a ES/FR sin contenido propio, mientras conserva nombre, SEO y reserva PT modificados pero aún sin guardar. El público EN continúa anterior hasta Publish. Save/Publish PT conserva EN publicado anterior. |
| Publicación Building | EN Publish no modifica la fila PT. ES y FR se guardan/publican explícitamente. Cuatro detalles reales muestran los nombres correctos; SEO y enlaces propios PT/FR se comprueban en HTML público. |
| Fotos/datos Building | Dos selecciones en cola no hacen PUT. Save PT sube exactamente portada+OG, normaliza previews fuera de blob y actualiza ambas imágenes y dirección en los cuatro idiomas publicados. El nombre/SEO PT nuevos siguen privados en draft; Save/reload los conserva. |
| Texto/SEO/reserva Apartment | PT pendiente y modificaciones locales sobreviven EN Save; ES hereda EN. Cuatro publicaciones independientes conservan nombres/SEO/booking propios, incluidos hrefs PT/FR reales en UnitCard. No nueva ruta pública Apartment. |
| Datos físicos Apartment | Save PT comparte portada nueva,9huéspedes,5camas,3dormitorios y88m². Cuatro páginas y sus strips muestran1/9/5; las columnas legacy también1/9/5. Texto/SEO PT nuevo continúa privado y persiste tras reload. Tercer upload real y preview normalizado comprobados. |
| Building nuevo | Primer y segundo Save navegan/conservan una identidad Edit y un único slug. Cambiar sólo dirección desde ES mantiene inherit. Primera edición textual/SEO PT fija custom y un EN Save posterior no la pisa; ES sigue EN. Publicar PT mantiene EN/ES sin publicación y EN404. |
| Apartment nuevo/padre | Primer/segundo Save usan un único UUID/ruta. Publicar child EN no revela el padre EN sin publicar. Child PT aparece tras su publicación con padre PT existente; Publish padre EN revela su child EN preparado. PT permanece independiente. |
| Móvil y guardas | Ambos formularios a390×844 guardan y recargan sin overflow. Escritura continua mantiene foco. Una edición PT oculta al pasar a EN dispara Back; Escape/Cancel conserva ese texto y permite volver a PT. Capturas desktop/móvil revisadas en una pasada acotada. |
| Preservación y media pública | Huellas d*/f* idénticas antes/después. Portada Apartment compartida carga realmente en público optimizado (complete y naturalWidth>0). Los tres registros de pageerror son listas vacías. |

Evidencia principal: `baseline-results.json`, `media-apartments-results.json`,
`new-mobile-results.json`, `shared-final.json`, `created-identities.json` y los
logs homónimos. Capturas: `building-desktop.png`, `apartment-desktop.png`,
`building-mobile.png`, `apartment-mobile.png`, `public-shared-pt.png`.
Las capturas completas pueden situar el header sticky en la posición del scroll
al capturarlas; los recorridos comprobaron los controles visibles y operativos.

## Fuente, correcciones y verificación integrada

Revisión acotada de modelos/estado, bootstrap legacy, Save/Publish y CTEs bajo
lock, esquema/contratos, lectura pública, contadores, validación, invalidación y
formularios. Primera edición real fija custom; no-op y common no personalizan.
Shared Save y locale draft comparten CAS/statement fresco, y el payload común
viejo de un text-only Save no restaura valores anteriores. GET no inicializa.
Imports cruzados revisados por contracts; no nuevo cambio kernel ni Blog.

La revisión inicial d3d160d encontró **P2: Publish directo de common pendiente de
un ENdraft antiguo**. Building podía exponerlo mediante fallback al publicar;
Apartment podía consumir su única copia. Correcciones fbd871d/8cbd0e0 rechazan
Publish mientras existe shared.working y piden Save primero. QA confirmó la
corrección en fuente; las regresiones DB preparadas se ejecutaron después en la
suite integrada real del orquestador. El guard del formulario ya impedía ese caso.

La primera ejecución DB del orquestador también encontró precedencia JSONB
incorrecta en las proyecciones localizadas; se corrigió en99c2d80/fed9fb8 antes
de esta ronda browser. No se contabilizan esos intentos fallidos como verificación
aprobada. Candidato fed9fb8: **104/104 casos reales**, typecheck, lint y db:check
exit0; full `pnpm build` exit0. Los7warnings lint y aviso metadataBase de build
son previos/de configuración local. Logs `main-tests.log`, `main-typecheck.log`,
`main-lint.log`, `main-db-check.log`, `main-build-final.log` bajo el directorio QA.
Son ejecuciones del orquestador, revisadas por QA; no suites duplicadas por el revisor.
El build previo compile-only no se confunde con este build completo posterior.

El código probado es el delta Properties seleccionado sobre main y conserva
Blog/topbar ya integrados. La equivalencia ejecutable con la rama de implementación
2bb313d fue comprobada por root; el candidato para este informe y browser es fed9fb8.

Observación no bloqueante conservada: en Apartment un draft inherit obsoleto tras
EN Save puede seguir diciendo Draft saved con Publish deshabilitado. Una ayuda
para guardar otra vez sería más clara; no habilita publicación obsoleta ni pierde
texto, y no se amplió esta entrega a una ronda de polishing.

No faltan checks funcionales requeridos dentro de la ronda acordada. La posterior
confirmación del arranque desde main real y del recurso estático de imágenes SSG
queda a cargo del orquestador como cierre local, sin nueva escritura de contenido.
