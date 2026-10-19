# Handoff para clear — editor común Pages

2026-10-18. Usuario validó Home, el fix de foco y el live preview. Acordó el editor común
para Owners, Buildings listado, Real Estate y Guest; pidió **spec/plan y luego clear antes
de implementar**. Este handoff es documentación: no hay implementación de esa conversión
ni agentes lanzados. No interpretar leerlo como autorización para empezar antes del nuevo
encargo del usuario.

## Base y lectura mínima

Checkout con esta documentación:
/private/tmp/central-hill-page-drafts-integration
Rama page-drafts/integration. HEAD antes de este cierre8de459a; verificar HEAD documental
final y status al retomar. Producto ejecutable sigue8da3519, QA independiente f8d7c91.
No confundir nuevo commit documental con otro build. Spec/plan no cambian Home actual.

Leer en este orden:
1. AGENTS.md, CLAUDE.md y docs/multi-agent-workflow.md.
2. [Spec cerrada](page-editor-platform-spec.md).
3. [Plan de ejecución/ownership/QA](page-editor-platform-plan.md).
4. ADR0040 (draft/publish + live follow-up), Home live QA y código real de los files asignados.
5. README Pages/Backoffice y Buildings antes de su seam de composición.

Los planes anteriores page-editors-parallel-plan.md y owners-contextual-editor-plan.md
son referencias históricas. Prevalece esta spec: no About y sí Buildings LISTADO; Forms
público va en otro arco. No restaurar la antigua dependencia de Forms para bloquear Owners.

## Decisiones cerradas

- Un motor y un PageContextualEditor común; adaptadores, sin cuatro copias de Home.
- Primero generalización + Home; Owners segundo para probar planes/features anidados;
  después Buildings, Real Estate y Guest con máximo dos implementadores simultáneos.
- Mismo shell, Sections/Element, SEO EN/ES/PT/FR en toolbar, live preview temporal300ms,
  Guardar borrador/Publicar independientes por página/idioma, revisión/CAS persistentes.
- Refresh muestra locales sin guardar; no autosave ni publicación por preview. Reload sólo
  recupera estado guardado. Preservar foco/caret y scroll/selección; keyboard tests reales.
- Reusar page_locale_content, snapshots/bootstrap legacy sin pérdidas/público idéntico,
  IDs estables incluidas strings y listas por ID de padre, medios/fallbacks por identidad.
- Renderer público único por página con PageResult inyectable; grid Buildings por su slice
  y contract, publicado/readonly. No /admin/buildings ni entidades individuales.
- Formularios actuales se mantienen; no selector Forms ni nuevas releases/captura/Leads/
  emails. No afirmar que esos envíos se arreglaron por convertir su editor.
- Raíz posee contratos/registry/rutas/messages/shared/seam Buildings; dos escritores en
  worktrees con scopes disjuntos y QA independiente al final. Nada de tres escritores.
- Máximo10tests nuevos focales; regresión Home afectada una vez, no149tests ni matrices.
  Globals una vez integrado, QA consume logs; un pase agrupado desktop/mobile y sólo
  confirmación de fallos reales. Plan enumera comandos/archivos y casos concretos.
- No DDL previsto; si aparece justificar y reservar siguiente número real antes de ejecutar.

## Entorno y preservación

No se creó DB/worktree/preview nuevo para esta documentación. Al implementar proponer nuevo
pageeditorsqa, preview3068/storage9068, DB5628/proxy4528 y verificar disponibilidad real.
Branch/checkouts de tarea están en el plan; contratos root aterrizan antes de consumidores.
No copiar .env productivos. Validar SQL current_database/current_user antes de writes/build.

Home/live actual3067: /private/tmp/central-hill-page-drafts-integration,
PID25042/session29066, pagedraftsqa5618/proxy4518/storage9067, storage PID90200/session59103.
Artefactos QA /private/tmp/central-hill-home-live-qa y /private/tmp/central-hill-page-drafts-qa.
Home3065 y otros entornos se preservan; no reutilizar sus DB para fixture writes.
No sobrescribir3067 automáticamente: la tanda nueva se revisa en3068 o puerto libre registrado.

QA/DB/sandbox seguro local ya autorizado, sin repetidas preguntas funcionales; restricciones
reales del entorno siguen aplicando. Sin main/push/deploy/GitHub/Neon producción/envíos reales.

## Cómo empezar tras clear

Con la nueva orden de implementación: confirmar base/status y dependencias, crear integración
nueva, verificar entorno aislado, aterrizar tipos/contratos coherentes y registrar el hash;
sólo entonces delegar los dos scopes de motor/UI. No empezar creando cuatro editores de página
sobre el backend Home-hardcoded. Cada fase tiene gate y ownership en el plan.

Prompt para el nuevo contexto:

> Lee AGENTS.md y docs/specs/page-editor-platform-handoff.md en
> /private/tmp/central-hill-page-drafts-integration. Sigue page-editor-platform-spec.md y
> page-editor-platform-plan.md. Implementemos el editor común para Owners, Buildings listado,
> Real Estate y Guest, conservando Home, formularios actuales y QA acotado. Producto base8da3519;
> verifica el HEAD documental final antes de crear la nueva integración. Sólo entrega local,
> sin main/push/despliegue/producción.

## Verificación de esta entrega

Sólo Markdown/AGENTS. Comprobar diff --check, enlaces y scope documental. No tests/build de
producto, migraciones, cambios DB, nuevos procesos o agentes por este cierre de planificación.

Cierre documental verificado: git diff --check exit0;55enlaces locales resueltos y scope
exacto de7archivos Markdown (3nuevos spec/plan/handoff, AGENTS y3notas de precedencia en
planes previos). Sin cambios src/messages/drizzle/package/lockfile ni entorno. No se corrió
ningún test/build de producto por documentación. El commit de cierre figura en HEAD y en la
respuesta de entrega; comprobarlo al volver antes de ramificar implementación.


## Cierre posterior de implementación

Nueva orden del usuario ejecutada desde8223f4a en
/private/tmp/central-hill-page-editors-integration, rama page-editors/integration.
Código final7e13d9f, independientemente QA-aprobado tras pase acotado y confirmación del
fix de indicador Unsaved por orden de claves JSON. [Entrega](page-editor-platform-delivery.md),
[registro de ejecución](page-editor-platform-plan.md), [QA](page-editor-platform-qa.md).
Nuevo preview3068/DBpageeditorsqa, sin main/push/despliegue/producción. Los archivos de
planificación en el checkout anterior y sus entornos se conservaron; no seguir este texto
histórico como si la conversión todavía no estuviera implementada.
