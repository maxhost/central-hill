# Building status — QA funcional independiente

2026-11-06. **APROBADO en el alcance funcional acordado**, ejecutable **5077515**
(backend49d7eae + UI5077515), rama `building-status/integration`, checkout
`/private/tmp/central-hill-building-status-integration`, base52cf4bd.
No quedan bloqueos funcionales encontrados en esta ronda acotada.

[Spec y ejecución](building-status-form-correction.md).

## Alcance y entorno

La revisión se limita al ciclo Archivar/Guardar/Restaurar/Publicar de Building,
la conservación del trabajo local durante router.refresh y la actualización del
estado del workspace. **No se ejecutó QA estética, medición de geometría ni
capturas**. La columna, tamaños y demás cambios visuales L0 quedan para la revisión
del usuario en localhost. Apartment lifecycle queda fuera de esta corrección.

Browser Chromium headless contra el único preview **http://localhost:3071**,
Next dev desde el candidato, iniciado por root después de detener el main previo.
QA no inició/detuvo servidores. DB y rol comprobados mediante SQL antes de cada
script: ambos **propertylocalesqa**, Postgres5658/proxy4558. Env sintético y bloqueo
de Neon remoto en `/private/tmp/central-hill-building-status-qa/env.sh`.
No nueva migración, esquema, push, deploy ni escritura remota.

Sólo se mutó el fixture nuevo propio
`e7400000-0000-4000-8000-000000000001`, slug
`building-status-review-20261106`. Root lo preparó como legacy publicado con EN
fuente y cuatro slugs, inicialmente sin filas locale/shared. Las comprobaciones
usan sesión staff sintética, acciones reales y consultas reales; no datos ni
acciones sustituidos. Los fixtures anteriores d*/f*, e400/e500 y69a344cf/46559ec8
mantuvieron sus huellas. No se tocó contenido del usuario ni esas identidades.

Artefactos y harness:
`/private/tmp/central-hill-building-status-qa/independent`.

## Cinco grupos funcionales verificados

| Grupo | Resultado observado |
| --- | --- |
| Primer Archive legacy | Antes de archivar no existen snapshots; las cuatro URLs públicas responden200. Archive captura cuatro publicaciones EN originales con revisión0 antes de ocultarlas. Todas pasan a404, el badge dice Archived y desaparece View on site. El editor conserva la misma ruta y nombre/SEO PT aún sin guardar al volver a esa tab después del refresh. |
| Guardar archivado | Nombre/SEO PT y dirección común se guardan con status todavía archived, sin cambiar la publicación previa. Las cuatro URLs siguen404. Reload mantiene el draft y la dirección, con campos y Save operativos. |
| Restore | Sin publicar ni consumir drafts, activa las publicaciones anteriores. Las filas locale/revisiones/draft/published no cambian. Los cuatro idiomas recuperan el texto publicado anterior; la dirección común guardada se aplica. Texto local EN y PT modificado después del Save también sobrevive al refresh. Badge y View on site se actualizan y el editor no navega fuera. |
| Publish archivado | Tras volver a archivar, Save PT sigue dejando la identidad oculta. Publish activa status published y publica/limpia sólo el draft PT. Los otros idiomas conservan sus snapshots/revisiones y nombres publicados; PT muestra su nombre/SEO nuevo. Una confirmación dirigida demuestra que texto EN local sin guardar sobrevive al refresh de Publish PT. |
| Móvil funcional | A390×844 se accionan Archive/Restore desde el editor. Los botones completan sus acciones, actualizan badge/link, mantienen ruta y conservan el texto EN local. Restaurar no modifica snapshots. No se inspeccionó tamaño, ancho, alineación ni estética. |

`browser-errors.json` es una lista vacía. No se ampliaron matrices de auth/CAS ni
se repitieron checks ajenos al ciclo solicitado.

## Harness, continuaciones y resultados reales

Comandos ejecutados desde el checkout, con su env:

```sh
source /private/tmp/central-hill-building-status-qa/env.sh
node /private/tmp/central-hill-building-status-qa/independent/check.mjs
node /private/tmp/central-hill-building-status-qa/independent/continuation.mjs
node /private/tmp/central-hill-building-status-qa/independent/final.mjs
```

- `check.mjs`: grupo1 aprobado; Save del grupo2 se completó, pero el script salió1
  por selector ambiguo entre dos role=status con Draft saved. No fallo de producto.
- `continuation.mjs`: retoma el Save ya guardado, sin repetir Archive ni reiniciar
  datos. Grupos2 y3 aprobados. Publish PT del grupo4 se completó, pero una espera
  salió1 al coincidir badge Published y el mensaje Published. Tampoco fallo de producto.
- `final.mjs`: espera el badge de forma específica, confirma el Publish ya realizado
  y hace una sola confirmación dirigida del estado local durante Publish. Grupos4
  y5 aprobados; **exit0**. No nueva ronda amplia ni reset de fixtures.

Los logs y JSON originales se conservan: `check.log/results.json`,
`continuation.log/continuation-results.json`, `final.log/final-results.json`,
`protected-before.json` y `browser-errors.json`. Los intentos cortados del harness
no se presentan como ejecuciones exitosas; las cinco conductas tienen la evidencia
aprobada indicada arriba. No hubo correcciones de producto durante esta ronda.

## Fuente y verificación integrada

Revisión de la fuente integrada: Archive bootstrap antes de ocultar; Restore cambia
sólo identidad y elige draft cuando no existe publicación; Save permite archived
sin activar status; Publish activa la identidad sólo tras guardar correctamente la
publicación seleccionada en el mismo statement. El CTE de activación no compite
con el mirror común durante Publish. Los guards de revisión, herencia/fuente,
shared pending, referencias y publicaciones explícitas se conservan. Acciones
staff-gated invalidan superficies públicas y layout del workspace. UI no navega
al listado tras Archive/Restore y actualiza su estado local sin reemplazar tabs.

Root ejecutó sobre el integrado: typecheck exit0, lint exit0 (7warnings existentes),
**27/27 pruebas enfocadas** exit0, incluido el ciclo nuevo y regresiones anteriores,
y **pnpm build completo exit0**,101páginas, después del cleanup de fixtures de tests.
Logs en `/private/tmp/central-hill-building-status-qa/{typecheck,lint,tests,build}.log`.
Estas son verificaciones del orquestador, no suites duplicadas por el revisor.
No db:check nuevo porque no hubo cambios de esquema/migración.

La confirmación final del merge local y el arranque del checkout real de main
corresponde al cierre de root. Esta QA aprueba el candidato funcional probado;
la revisión visual L0 permanece expresamente con el usuario.
