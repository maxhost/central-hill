# Plan — cerrar advertencias y nueve tests heredados

2026-11-22. Estado: plan preparado; implementación NO iniciada. Este documento permite ejecutar el trabajo en una ventana limpia con dos implementadores, QA independiente y un orquestador.

## Punto de partida y autorización

El usuario autorizó integrar el candidato de feedback y preparar este nuevo trabajo separado. El merge local ya se realizó por fast-forward: main pasó de `931a28bb3b7b6becc874d595af7dbe0a0353591a` al candidato exacto aprobado `80bd3f376ffb4a479cdee3e8bc5c083452afd4cc`. No hubo conflictos, push ni deploy. La fuente de producto coincide con el build aprobado `15aea40dceb06726604d9f6a8caa23d959f42eb0`: 1205 archivos no documentales, incluidos 968 de src/messages. La documentación fue el único delta del commit final.

El trabajo anterior de feedback está terminado e integrado: 309 contratos aprobados, 104 pruebas focales sin skips, typecheck/build sin errores y QA independiente. Leer sus documentos `docs/specs/editor-save-publish-feedback-{plan,execution,qa}.md` y ADR0089 para preservar los contratos. Este plan NO reabre su matriz completa.

El nuevo plan está en `plan/baseline-quality-cleanup-2026-11-22`, worktree `/private/tmp/central-hill-baseline-quality-plan`, nacido de main `80bd3f3`. Se ejecutará después en ramas de implementación separadas; no iniciar las correcciones al leer este documento como entrega de planificación. La futura ejecución entrega primero un candidato validado. No autoriza otro merge a main, push, deploy, migraciones ni escrituras externas.

## Objetivo y límites

Cerrar los 17 hallazgos conocidos: siete warnings ESLint, una advertencia histórica del comprobador de migraciones y nueve tests Pages fallidos. Recuperar una señal de calidad útil sin ocultar errores, debilitar pruebas ni modificar reglas de negocio para satisfacer expectativas antiguas.

Los nueve fallos se reprodujeron en el plan base `73eac08` y en el candidato inicial con nombres y detalles expected/actual idénticos. El reporte amplio conservado fue 70 tests: 61 pass y nueve fail; no atribuir ese número sin ejecutar la suite actual al empezar. No son nueve capturas visuales rotas: son aserciones de estructura, claves i18n y metadatos de esquema. Antes de cambiar algo, reproducir los hallazgos sobre el nuevo main y registrar la línea base exacta.

Se permiten cambios mínimos a tests desactualizados, las traducciones admin realmente faltantes, código muerto o sintaxis equivalente de los warnings y el checker local de migraciones con sus pruebas. Quedan fuera rediseño/UI global, datos o publicaciones authored, reglas MIME/ratios, visibilidad de campos retirados, semántica Save/Publish, schema/SQL/journal/ledger, auth, proveedores, secretos, configuración de build y límites de archivos. No modificar core salvo retirar el import `sql` demostrado sin uso. Si aparece un defecto funcional diferente, registrarlo y evaluar su alcance antes de ampliar el trabajo.

## Inventario cerrado de hallazgos

| ID | Archivo/contrato | Hallazgo y criterio de resolución |
|---|---|---|
| L01–L03 | `mock/assets/site.js`, líneas originales 43/60/85 | Tres `catch (e)` sin uso. Mantener manejo de errores, storage, pausa de video y comportamiento del mock; usar binding opcional cuando corresponda. |
| L04–L05 | `mock/contextual-editor/editor.js`, líneas originales 11/15 | `saved` se asigna pero no se lee; `sourceValues` no se usa. Revisar también asignaciones posteriores y efectos antes de retirar código. Guardado, Apply, cambio de idioma y preview del mock conservan su comportamiento. |
| L06 | `postcss.config.mjs` | Exportación anónima. Dar nombre al mismo objeto, preservando exactamente el plugin y opciones; no cambiar el pipeline CSS. |
| L07 | `src/core/i18n/schema.ts` | Import `sql` sin uso. Retirarlo sin tocar exports, columnas, constraints ni forma del esquema. |
| M01 | `scripts/check-migration-order.ts` / SQL0008 | Reconocer explícitamente una excepción histórica inmutable; preservar la detección de problemas nuevos. No editar SQL aplicado. Ver sección siguiente. |
| T01 | Owners layout | El test espera 12 IDs pero añade `other` al pasar root keys ocultas. Usar el contrato real de campos visibles y comprobar cobertura única, sin perder el fallback de raíces visibles no reclamadas. |
| T02 | Buildings media hints | Espera 4:5 fijo; el hint vigente describe desktop siguiendo altura del formulario y tablet/mobile 4:5. Acreditar ese contrato sin cambiar el producto ni reducir la prueba a “hay texto”. |
| T03 | Buildings layout | Espera cinco IDs y recibe `other`. Mismo análisis de raíces visibles/ocultas y cobertura que T01. |
| T04 | Real Estate layout | Espera once IDs y recibe `other`. Mismo análisis, preservando todos los campos activos y el orden previsto. |
| T05 | Guest layout | Espera diez IDs y recibe `other`. Mismo análisis; no volver a montar contenido legacy oculto. |
| T06 | Guest layout + i18n | Falta `pages.admin.layout.links.guides` en la primera aserción que falla en EN. Revisar las cuatro locales EN/ES/PT/FR y todas las claves que el test recorre; completar labels admin correctos si faltan, sin textos authored ni traducción automática de contenido. |
| T07 | Guest Welcome media hint | Test espera texto viejo “about 540×380”; contrato vigente es frame 3:2 fijo en desktop/tablet/mobile, crop centrado y safe area. Preservar aceptación de medios, tamaños y semántica Welcome. |
| T08 | Guest teaser legacy | Test busca array y descriptor devuelve `hidden`. Separar legado preservado de controles activos; afirmar explícitamente el estado oculto y el contrato activo real, sin borrar la prueba ni exponer el campo. |
| T09 | About media inventory | Expectativa omite `about.contact.cards[].image_media_id`, actualmente image. Incluir el slot real, preservando el mapa completo de aceptación y los slots animated existentes. |

Todos los T están en `src/slices/pages/tests/pages-admin.test.ts`. Consultar también `src/slices/pages/admin/layout.ts`, `src/slices/pages/admin/ui/page-editor.tsx`, los descriptores/schemas vigentes, los renderers públicos y ADR0088. El renderer legacy ya filtra `field.node.kind !== 'hidden'` antes de llamar `resolveEditorLayout`; no alterar el resolver ni la UI sólo para satisfacer un test que le pasa otras entradas. El editor contextual activo debe seguir intacto.

Los nueve tests contienen múltiples aserciones: corregir la primera puede descubrir otra dentro del mismo contrato. Registrar cada descubrimiento y su evidencia; no convertir expectativas en una copia ciega del resultado ni ampliar silenciosamente el inventario. No marcar como desactualizada una ausencia real de traducción sin revisar el consumidor.

## Resolución segura de M01

`drizzle/0008_faq_groups_and_page_faq_key.sql` contiene cuatro statements sin `--> statement-breakpoint`; funciona con el driver actual. Su SHA256 vigente es `73dc6c8dd704099ed5a81d15cb568a2f82950c150e514aee394c7d22d5bb2538`. Ya está aplicado y su hash forma parte del ledger. Está prohibido insertar separadores, reescribir SQL, cambiar journal/snapshots/timestamps, reparar ledger o generar una migración vacía para quitar este warning.

Propuesta concreta: el checker reconoce únicamente ese tag con ese hash completo como excepción histórica revisada, con motivo y alcance de driver documentados. La salida puede informar la excepción de forma explícita, sin warning accionable de “edite el archivo”. No debe ignorar otros archivos ni usar prefijos de hash. Un hash diferente en el tag exceptuado debe fallar como drift, no pasar por la excepción. La detección genérica de múltiples statements sin separador sigue activa para cualquier otro archivo. Preservar el análisis de comentarios, literales y dollar-quoted blocks y los checks de orden/relación SQL-journal/cadena de snapshots. Esta excepción no certifica una migración a otro driver; ese cambio queda fuera de alcance.

QA exige controles negativos ejecutados en fixtures de filesystem temporales, nunca mutando `drizzle/` del repo ni conectando una DB: excepción exacta aceptada y visible; hash cambiado rechazado; otro SQL multistatement sin separador todavía advertido; SQL con separadores y bloques/literales bien analizados; orden de journal, SQL faltante y cadena rota todavía rechazados. Reutilizar pruebas existentes si las hay; no crear un framework general nuevo para este cambio acotado.

## Equipo, ramas y propiedad

El orquestador crea/restaura/checkpoints, integra commits, ejecuta gates, revisa el lote visual y entrega el candidato. Antes de delegar, fija contratos y paths. Dos implementadores en paralelo y QA independiente; ninguna misma ruta tiene dos escritores.

| Responsable | Rama sugerida | Propiedad |
|---|---|---|
| Implementador A | `baseline-quality/pages-tests` | Los nueve tests Pages, helpers focales en su ámbito y las claves admin faltantes en `messages/{en,es,pt,fr}.json`. Primero justificar expectativa vs producto; no modificar schemas/renderers salvo defecto real acordado con el orquestador. |
| Implementador B | `baseline-quality/lint-migration-check` | Los cuatro archivos de los siete warnings, `scripts/check-migration-order.ts`, pruebas focales y nota técnica de M01. Cero SQL/migrations/schema edit. |
| QA independiente | `baseline-quality/qa` | Scripts, fixtures/evidencias privadas, reproducción de baseline, revisión de cambios y reporte de aceptación. No corrige producto ni expectativas para hacerlas pasar. Devuelve defectos al propietario por el orquestador. |
| Orquestador | `fix/baseline-quality-cleanup` | Integración aislada, ejecución/conservación y documentación final. Sólo incorpora después de revisar los contratos de cada escritor. |

QA valida el SHA exacto, no sólo ramas o un working tree. Si hay corrección de producto, integrar commit, generar candidato/build nuevo y repetir sólo casos afectados y preocupaciones justificadas. No reclasificar evidencia de una versión previa como ejecutada en el SHA nuevo; documentar equivalencia de fuente para lo heredado.

## Secuencia de ejecución en ventana limpia

1. Leer `AGENTS.md`, este plan, el handoff y las pruebas/logs previos. Inspeccionar estado de main y worktrees sin limpiar nada. Si main avanzó desde `80bd3f3`, incorporar su estado en la rama aislada y volver a fijar baseline antes de validar.
2. PRIMERO crear un punto de restauración NUEVO y pareado de código/datos actuales, incluyendo auth y ledger. Capturar env, logos, symlinks, targets reales, procesos y estado Git privado. Verificar bundle/archive/manifiestos y restaurar el dump en DOS DB nuevas: una intacta y una exclusivamente QA. Comparar esquema efectivo, constraints, objetos SQL, conteos y hashes completos. Normalizar únicamente diferencias físicas justificadas, nunca datos. Guardar RESTORE.md que preserve estado posterior y restaure en checkout/DB NUEVOS. Si los targets media ya están vacíos, documentarlo y no afirmar que el checkpoint conserva assets antiguos ausentes. No comenzar producto antes de verificarlo.
3. El checkpoint anterior `/private/tmp/central-hill-editor-feedback/checkpoint` corresponde al código antiguo `931a28b`: conservarlo, pero NO usarlo como reemplazo del nuevo checkpoint post-merge. Baseline conocido de autoría al integrar: 49 tablas/1534 filas incluidas auth/ledger32. Verificar estado actual, no asumir que seguirá igual.
4. Crear worktrees y ramas separados para integración/A/B/QA. Crear DB, rol, host, almacenamiento, bucket y configuración privados nuevos. No reutilizar los DB/builds/caches/fixtures de tareas anteriores. Raíz privada sugerida `/private/tmp/central-hill-baseline-quality`; propuestas de puertos 3097/4573/9096 sólo si una inspección demuestra que están libres. Nunca matar procesos ajenos para usarlos.
5. Baseline: ejecutar lint completo, db:check y la suite COMPLETA Pages antes de cambios; registrar los 17 hallazgos y cualquier divergencia. Guardar los 32 hashes SQL/journal/snapshots y schema exportado para probar que permanecen iguales.
6. Ejecutar A y B en paralelo. Cada uno entrega commit, explicación de la causa real, tests/casos cubiertos y límites; no declarar error nuevo “preexistente” sin prueba contra la base.
7. Integrar en rama aislada, revisar diff por alcance y correr gates. Fijar candidato inmutable y archivar fuente/config; construir producción aislada con Node22 y QA DB propia, configuración de producto original. No copiar `.next` de autoría ni un symlink de dependencias que escape de la raíz Turbopack. Conservar intentos/caches; no cambiar producto para acelerar QA.
8. QA ejecuta la matriz acotada siguiente contra el build real. Login normal con cuenta sólo de su DB. Los intercepts de red no pueden fabricar Save, Publish, subida o imágenes exitosos. Conservar secretos fuera de Git.
9. Verificar conservación final, registrar ejecución y reporte QA, commit documental y firma del SHA final con comparación de blobs contra el build. Entregar candidato, resultados y limitaciones. No merge, push ni deploy en esta ejecución futura.

## Matriz de aceptación acotada

Antes de implementar, convertir los IDs siguientes en una matriz finita con artefactos y estado; ninguna entrada planned/blocked/fallo de harness cuenta como pass. La suite completa puede acreditar varios contratos, pero mapearlos explícitamente.

- **L01–L07:** lint completo termina con cero errors y cero warnings, sin disable/ignore/quiet ni bajar reglas. Revisar que los cambios son equivalentes; no añadir tests redundantes para retirar un import.
- **T01–T09:** los nueve tests conocidos pasan y la suite completa Pages pasa sin skips nuevos ni aserciones borradas. Mantener cobertura de todos los campos visibles una sola vez, ocultos fuera de UI, fallback `other` para raíces visibles realmente no reclamadas, ratios/hints vigentes, mapa de slots y claves en cuatro locales. Registrar nuevo total y causalidad de cada corrección.
- **M01a–M01g:** siete fixtures aisladas para excepción exacta, drift, otro multistatement, separadores/dollar quotes, journal fuera de orden, SQL faltante y cadena de snapshots rota. El baseline real final debe reportar 32 migraciones consistentes y cero warnings accionables, con excepción histórica visible y todos los hashes originales exactos.
- **R01:** los 104 tests focales de feedback/queue/RTE/Guide/Service/Blog previamente aprobados siguen pasando sin skips. Reutilizar sus comandos/logs y revisar fuente afectada; no repetir la matriz de 309 contratos ni la antigua matriz de ratios de Welcome sin razón.
- **R02:** typecheck y build de producción terminan sin errores; configuración y opciones de PostCSS equivalentes. `pnpm test` es un placeholder que imprime “no test runner wired yet”: NO sirve como evidencia.
- **R03:** smoke de los dos mocks, con storage permitido y denegado: theme/navigation/reduced-motion y ciclo del editor demo (edición, idioma, Apply/Save). Sin errores JS nuevos ni pérdida de comportamiento. No probar guardado CMS en los mocks.
- **R04:** inspección browser read-only en QA de Owners, Buildings, Real Estate, Guest y About (cinco rutas), verificando controles activos/ocultos y labels sin claves crudas ni errores JS. Si un consumidor legacy con la nueva clave está montado, comprobarla en las cuatro locales. Si está desmontado, declarar esa subparte N/A con fuente y mantener la validación completa i18n; no montar un editor legacy artificialmente para fingir E2E.
- **R05:** regresión de feedback Pages en una fixture exclusivamente QA: ES incompleto → Save permitido según contrato → Publish rechazado con error ES, tab roja y destino de foco; corregir por UI → Save→Publish ES real. Comparar EN/PT/FR completos antes/después y GET público propio/fallback según contrato. No requiere repetir uploads si queue/media permanecen idénticos. Si se tocan, ampliar la prueba afectada antes de aceptar.
- **R06:** un lote visual conjunto desktop y móvil de los controles/labels que efectivamente cambiaron; no un rediseño global. Sólo repetir defectos visuales reales.
- **C01:** conservación schema/constraints/49 tablas y hashes por fila de originales, auth y ledger; manifest de fixtures por identidad, sin excluir tablas completas. También env/logos/symlinks, procesos ajenos y hashes de TODOS los SQL/journal/snapshots exactos.
- **C02:** SHA final firmado por QA, bytes de fuente/producto iguales al build probado; documentación posterior sólo hereda firma con comparación exacta y aprobación del nuevo SHA.

Los siete controles M01 pueden agruparse por ejecución, pero necesitan cada aserción positiva/negativa explícita. Una advertencia nueva sin estudiar no se silencia para conseguir cero. Si cualquier gate no puede cerrarse, entregar su estado real y no afirmar candidato validado.

## Comandos y evidencia de referencia

Usar Node 22.23.3 disponible actualmente en `/Users/maxi/.nvm/versions/node/v22.23.3/bin/node` o verificar otro Node22 equivalente. Ejecutar desde el worktree correcto y guardar salida/código de retorno; resolver deps existentes sin actualización de lockfile. La suite Pages usa JSX automático y alias/shim de su tsconfig:

    TSX_TSCONFIG_PATH=src/slices/pages/tests/tsconfig.json node --import tsx --test src/slices/pages/tests/pages-admin.test.ts
    pnpm lint
    pnpm typecheck
    pnpm db:check
    pnpm build

R01 corresponde a estos doce archivos; varios generan casos en bucles, por eso el número de declaraciones no es el total de 104. Correrlos con el mismo loader/tsconfig JSX del comando anterior, todos en una sola ejecución o en grupos con resultados agregados sin doble conteo:

- `src/slices/backoffice/tests/editor-feedback.test.ts`
- `src/slices/pages/tests/editor-feedback.test.ts`
- `src/slices/guides/tests/editor-feedback.test.ts`
- `src/slices/guides/tests/editor-group-feedback.test.ts`
- `src/slices/services/tests/editor-feedback.test.ts`
- `src/slices/services/tests/editor-action-results.test.ts`
- `src/slices/services/tests/service-locale-form-state.test.ts`
- `src/slices/services/tests/editor-public-link.test.ts`
- `src/slices/services/tests/editor-transport-context.test.ts`
- `src/slices/blog/tests/editor-feedback.test.ts`
- `src/slices/blog/tests/post-rich-text-feedback.test.ts`
- `src/slices/blog/tests/post-body-upload-completion.test.ts`

Verificar primero el comando del runner contra el checkout; si falla la infraestructura, corregir sólo el harness, no contarlo como fallo/pase de producto. `db:check` sólo lee filesystem; no ejecutar db:migrate/db:push/db:generate, ni siquiera para quitar M01.

Referencias privadas previas (lectura; preservar):

- `/private/tmp/central-hill-editor-feedback/baseline-nine-comparison.json` y `baseline-nine-targeted.log` / `candidate-nine-targeted.log`: nueve fallos idénticos base/candidato.
- `/private/tmp/central-hill-editor-feedback/root-lint-build5.log` y `root-dbcheck-attempt1.log`: siete warnings y advertencia0008 exactos.
- `/private/tmp/central-hill-editor-feedback/qa/final-signoff.json`, `matrix-final.json`, `evidence/originals-check.json`, `evidence/final-fixture-identities.json` (todos bajo ese directorio QA): aceptación anterior y alcance de fixtures.
- `/private/tmp/central-hill-editor-feedback/authorized-main-integration.json`: recibo de este merge autorizado, estado untracked/env/logos/symlinks exacto.

## Estado local que se debe preservar

Repo principal `/Users/maxi/Documents/claude-workspace/central-hill`, main `80bd3f3` después del merge. Al preparar este plan, main3071 estaba ausente desde el inicio del trabajo previo y no se reabrió; media9081 original PID8524 permanece. Inspeccionar estado real al ejecutar, no depender de PIDs históricos. Si se necesita abrir autoría por una instrucción posterior, conservar `.env.local` original y el preload requerido `/private/tmp/central-hill-navbar-logo/runtime.cjs`; no apuntar main a QA.

En la inspección de entrega, QA3096, bridge4572 y almacenamiento9095 no tenían listener; son los puertos previos de esa QA. Inspeccionar de nuevo cada proceso antes de actuar; conservar todas sus DBs/worktrees/builds/caches/artifacts y cualquier proceso previo activo. Sus credenciales y guard de host/rol sólo sirven para su DB, no copiarlos como acceso a la nueva base. Conservar las once entradas originales env/logo/symlink; los tres untracked originales del main son el logo PNG y `public/neoncontentlocal`, `public/propertylocalesqa`. Nunca limpiar/checkout/reemplazar esos paths para dejar Git “limpio”. Ningún setup de mail real, R2 remoto, credenciales Git, despliegue, SQL remoto o cambio de permisos forma parte de este plan.

## Entregables futuros

Commits A/B trazables y candidato aislado; ejecución con causas y límites; reporte QA con matriz terminal y manifiestos privados; checkpoint nuevo con dos restores verificados y RESTORE.md; recibos de conservación y SHA final exacto. Si todo pasa, quedar listo para decisión posterior de merge, sin efectuarla automáticamente.
