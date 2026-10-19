# QA independiente — editor común Pages

2026-10-18 (sesión local America/Guayaquil; artefactos SQL posteriores a04:00UTC del19).
**Estado: aprobado independientemente en `7e13d9f70c866647c5d14307c3ee2c539b89a1a7`.**
QA-1 corregido y confirmado; ningún hallazgo bloqueante ni check requerido pendiente.

## Candidato y aislamiento

QA verificó checkout `/private/tmp/central-hill-page-editors-integration`, rama
`page-editors/integration`, inicialmente limpio en `cf9064b8ee723aecf62945f574e41c7627d02611`.
El pase funcional utilizó el build de `bc2037f0d49fef7eda82e15f10c47f7ebe036e4b`:
corrección de tipos Home/fixture Owners posterior al primer typecheck, sin cambio funcional.
El retest final usa `7e13d9f70c866647c5d14307c3ee2c539b89a1a7`, rebuild completo y
servidor3068 PID73105/session55343; el orquestador sustituyó sólo su servidor anterior.
Lectura de AGENTS, CLAUDE, procedimiento multiagente, spec/plan/ejecución, ADR0040 y
README Pages/Backoffice/Buildings. QA escribe únicamente este informe en el repositorio;
los fixes de producto corresponden al orquestador.

Identidad SQL real antes de operar: `current_database()=pageeditorsqa`,
`current_user=pageeditorsqa`. Nueva DB/proxy5628/4528, storage9068 con bucket/directorio
local pageeditorsqa, aplicación3068 production build. Staff, cinco páginas, Settings y
edificio publicado **Synthetic QA House** son sintéticos. Env propio en
`/private/tmp/central-hill-page-editors-qa/env.sh`; Node22.23.3, correo console.
Sin credenciales productivas copiadas ni envíos/formularios públicos ejecutados.

Los artefactos/checkouts/DB de3065/3067 permanecen intactos; este informe no afirma que
sus servidores anteriores sigan escuchando. No main/push/deploy/GitHub/Neon producción.

## Checks y evidencia consumida

El orquestador ejecutó los globals; QA leyó sus logs, sin repetirlos:

| Comando | Resultado / evidencia en directorio QA |
|---|---|
| `pnpm typecheck` | Primer pase exit2 en cf9064b, conservado en typecheck-initial.log; anotaciones de tipos corregidas, nuevo pase exit0 en bc2037f, typecheck.log |
| `pnpm lint` | exit0,7warnings preexistentes; lint.log |
| `pnpm exec tsx --test src/slices/pages/tests/page-locale-drafts.test.ts src/slices/pages/tests/page-locale-drafts.integration.test.ts src/slices/pages/tests/home-live-preview.test.ts src/slices/backoffice/tests/page-editor-bridge.test.ts src/slices/pages/tests/editorial-engine.test.ts src/slices/pages/tests/editorial-engine.integration.test.ts src/slices/pages/tests/owners-editorial-adapter.test.ts src/slices/pages/tests/buildings-editorial-adapter.test.ts src/slices/pages/tests/real-estate-editorial-adapter.test.ts src/slices/pages/tests/guest-editorial-adapter.test.ts` | exit0,26casos:16regresiones existentes+10nuevos; tests.log |
| Corrección de tipos: tests Home/Owners afectados y ESLint focal | exit0,6casos; tests-type-fix.log y lint-type-fix.log |
| `pnpm build` | exit0 en bc2037f, build.log; servidor3068 listo en server.log |
| Fix QA-1: `pnpm typecheck`, ESLint focal y test de editorial-engine afectado | todos exit0,1caso existente ampliado; typecheck-dirty-fix.log / lint-dirty-fix.log / tests-dirty-fix.log |
| Fix QA-1: `pnpm build` | exit0 en7e13d9f, build-dirty-fix.log; server-dirty-fix.log Ready106ms |

No DDL nuevo; no se requiere db:check. Las migraciones existentes0000..0023 se aplicaron
sólo al nuevo entorno sintético. No se cuentan los scripts placeholder test/boundary:check.
Los71casos legacy About/Pages fueron verificados por el implementador UI en5586819,
según registro root; QA no los volvió a ejecutar ni reclama su autoría.

Pase de navegador real por Playwright:
`source /private/tmp/central-hill-page-editors-qa/env.sh && node /private/tmp/central-hill-page-editors-qa/browser.cjs`.
Los servicios locales requirieron permiso técnico de sandbox tras EPERM4528, antes de
ejecución funcional. El primer intento escalado quedó pendiente y fue cancelado por la
interrupción del orquestador; no fue una cancelación del usuario ni un rechazo automático.
La ejecución posterior funcionó. `browser-state.json` conserva todos los checkpoints;
`browser.log` contiene la última continuación. Hubo correcciones del harness para salir
de SEO hacia Sections/Hero y elegir un enlace visible de navegación, sin cambios de producto.
Se continuó desde cada checkpoint pendiente, sin repetir los flujos ya validados.
Última continuación guards exit0. Los browsers se cierran con finally.

## Comprobaciones funcionales realizadas

- **Home:** teclado continuo con foco/caret, renderer real en vivo, Refresh del snapshot
  local sin cambio de URL del iframe, guardado explícito/reload del borrador y público
  anterior intacto. Mobile390 con inspector y acciones accesibles, sin overflow exterior.
  La publicación posterior de Owners dejó la fila completa Home EN (published/draft/
  revision/timestamp) y su salida pública exactamente iguales.
- **Owners:** mover un plan conserva sus features; mover una feature del plan reordenado
  conserva el texto y scope de identidad del padre. Mover Journey intercambia fotos
  fallback con sus pasos originales. Draft/reload verifican contenido e IDs SQL.
  ES con SEO propio mientras EN SEO está vacío; guardar ES y luego editarlo localmente.
  Publicar EN deja intacta toda la fila ES (published/draft/revision/timestamp), su público
  anterior y el trabajo local en la pestaña. Guardar/publicar ES y reload recuperan el
  headline/SEO publicados. Teclado continuo adicional en mobile ES conserva foco/caret
  y actualiza realmente el renderer, antes de guardar/publicar.
- **Buildings:** live EN→draft→reload→publish; headline/title/description públicos coinciden.
  Stats editor presente; catálogo publicado visible antes/después y sin el nombre del
  edificio en el snapshot editorial. La lista Element conserva el item externo catalogue
  y la comprobación DOM final confirma su inspector sin inputs/textarea/select editables.
  No edición de entidades Buildings.
- **Real Estate:** mismo flujo corto EN con SEO; movimiento de deal model y sus points
  anidados; upload PDF en `hero.capability_statement_media_id`, guardado y publicación.
  SQL confirma `application/pdf`; CTA privada apunta al PDF local guardado, distinto de
  `hero.cta_secondary.url`. Mobile390 del inspector anidado y acciones, sin overflow exterior.
- **Guest:** mismo flujo corto EN con SEO; reorder de teaser conserva stock fallback por
  identidad. Imagen pendiente en su primer teaser se decodifica mediante blob same-origin
  en el CSS background del renderer sin incrementar media_asset antes de Save.
  Save/reload/publish conserva el media ID, orden/legacy IDs y salida pública. Mobile390
  del inspector y acciones, sin overflow exterior. La comprobación readonly final verifica
  el r2_key guardado en el CSS background, ningún blob y el texto del hermano reordenado.
- **Preview/legacy:** anónimo→login; embedded y apertura directa bloquean submit y navegación
  de un enlace real. Directa contiene noindex y respuesta `private, no-cache, no-store`.
  Review de traducciones Owners redirige al editor común; review de Building continúa
  siendo su editor legacy. Sin errores JavaScript de página en el pase agrupado.

Screenshots desktop/mobile por página en el directorio QA:
`home-mobile.png`, `owners-mobile.png`, `owners-desktop-published.png`,
`buildings-mobile.png`, `buildings-desktop-published.png`,
`real_estate-mobile.png`, `real_estate-desktop-published.png`,
`guest-mobile.png`, `guest-desktop-published.png`.
QA inspeccionó visualmente las capturas, además de las aserciones DOM/SQL.
El asset sintético inicial qa.png representa otra UI; su apariencia dentro de algunos
heroes procede del fixture y limita la evaluación fotográfica, no de un iframe recursivo.

## Revisión de código

Un PageContextualEditor administra las cinco keys; Home delega mediante wrapper. Registry
servidor y descriptor serializable separados; misma composición pública inyectada en
preview, seam Buildings mediante su contract, sin copiar su grid. Imports nuevos entre
slices por contract; sin cambios kernel, paquete/lockfile o migraciones.

Revisión de `savePage`, redirect Pages y guards de Translation: registry limita el cambio
a las cinco páginas; las seis mutaciones/generator/review/inbox legacy consultan la policy
del contrato Pages. Publicación invalida sólo `page:<key>:<locale>` y su path (guest→guests,
real_estate→real-estate); Save/live no invalidan ni publican. Mensajes nuevos EN/PT/ES/FR;
SEO y getters públicos consumen published independiente. Esta revisión no se presenta
como enforcement automático de límites de slices ni como una matriz de navegador4idiomas.

## Hallazgo QA-1 — estado Unsaved falso tras recargar ES

Severidad media, **resuelto y confirmado** en7e13d9f. Candidato original bc2037f.

Reproducción: guardar y publicar Owners ES con SEO propio y EN SEO vacío; recargar el
editor y seleccionar ES, sin editar. El shell muestra **Unsaved changes**. Esperado:
mostrar published cuando los valores/orden de listas son idénticos al published guardado.
La comparación en `admin/ui/page-contextual-editor.tsx:isDirty` usa JSON.stringify de
objetos cuyos keys tienen distinto orden tras preparar target y leer JSONB.

Confirmación independiente de sólo lectura:
`source /private/tmp/central-hill-page-editors-qa/env.sh && node /private/tmp/central-hill-page-editors-qa/diagnose.cjs`,
exit0. `dirty-diagnosis.json`: EN/ES draft=false, JSON equality=false, semantic equality=true;
seo aparece al final del working y al principio de published. No pérdida de texto ni
publicación cruzada. Evidencia visible: owners-desktop-published.png.

Root corrigió la comparación compartida mediante `sameEditorialSnapshot`: orden de claves
de objetos indiferente, orden de arrays significativo. Se amplió el caso engine existente
con igualdad semántica/cambio de texto/reorder, sin aumentar el presupuesto10casos nuevos.

Retest independiente exacto:
`source /private/tmp/central-hill-page-editors-qa/env.sh && node /private/tmp/central-hill-page-editors-qa/retest.cjs`,
exit0 en7e13d9f; evidencia `retest.log`. Owners ES recarga **Published**, Publish deshabilitado
sin draft. Una edición real mediante teclado mobile pasa a **Unsaved changes**, actualiza
el renderer y conserva foco/caret. Reload descarta esa edición y vuelve al contenido original
**Published**. Las cuatro filas Owners (published/draft/revision/timestamp) quedan exactamente
iguales antes/después. Sin errores JavaScript. No se repitieron los cinco flujos de publicación.
La misma sesión cerró sólo las dos observaciones readonly requeridas de catalogue/Guest.
Browser cerrado en finally. Capturas: `owners-es-clean-reload-desktop.png`,
`owners-es-real-edit-mobile.png`, `owners-es-clean-reload-mobile.png`.

## Límites del alcance

Pase funcional acotado desktop/mobile con Owners como única prueba completa EN/ES.
No matriz16combinaciones, batería de submits/emails ni pruebas de captura pública Forms.
No se afirma arreglar los formularios existentes. Se comparó público por headline/SEO/
catálogo y filas persistentes, sin depender de los contadores animados.
