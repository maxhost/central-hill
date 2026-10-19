# Handoff — segunda tanda del editor común

Usuario validó la entrega7e13d9f/cierre13fdec8 y pidió plan para Pages Services, Guides,
About y Blog, como la tanda anterior. Este encargo es sólo spec/plan: no implementación,
agentes, worktrees/DB nuevos, procesos, tests/build ni cambios de producto.

Leer AGENTS, CLAUDE, docs/multi-agent-workflow.md, [spec](page-editor-editorial-pages-spec.md),
[plan](page-editor-editorial-pages-plan.md), ADR0037/0040 y código actual de los scopes.
Base de esta planificación13fdec8 limpia en
/private/tmp/central-hill-page-editors-integration (page-editors/integration).
El HEAD final documental debe verificarse al retomar; el ejecutable3068 sigue7e13d9f.

## Confirmaciones y decisiones del plan

- /es/guides es el listado; /admin/pages/guides edita su contenido editorial. No confundir
  con /admin/guides para fichas /{locale}/guides/{city}/{slug}. HTTP200/canonical/H1 leídos
  del sitio de referencia, y wiring confirmado en código; no se certifica commit remoto.
- Reusar mismo motor/UI para los4adapters restantes; no rehacerlos ni copiar Home.
- Tanda1 Services/About; tanda2 Guides/Blog. Dos escritores disjuntos, raíz contratos y
  compartidos, QA independiente. Paths/write sets exactos en plan, sin agentes lanzados en este encargo.
- Bootstrap necesita seam por adapter: Guides salvage/validación {city}, Blog empty-source
  versus targets stale, About IDs/destinos/fotos existentes, defaults públicos equivalentes.
  Fuente inválida puede tener fallback público de lectura pero no se repara al adoptar.
- Guides: enabled ausente=true y colapso inspector/Element al false sin borrar valores.
  About8listas existentes, medios máximo29; Services3pasos de orden fijo, máximo5refs;
  Guides4refs; Blog1OG. Límites200000/256KiB actuales, sin DDL previsto.
- Shared asides no viven en listings: superficie privada shared_aside al seleccionar ese
  bloque, mismo componente extraído del detalle; no insertar una falsa sección pública.
  Newsletter Blog permanece la actual. No nueva captura/Forms/entidades/search.
- Publicar Blog/Guides invalida tag y subárbol sólo del idioma; fichas cacheadas muestran
  aside/newsletter sin rebuild. CTA propio de un post conserva prioridad sobre botón global.
- Máximo10tests nuevos y43regresiones existentes afectadas previstos, globals una vez,
  un pase agrupado browser y confirmación sólo de defectos. No149tests/71legacy por rutina.

## Entorno y siguientes pasos

3068 validado se preserva: DBpageeditorsqa5628/proxy4528/storage9068; última entrega runtime
PID73105/session55343, storagePID39697/session78716 (verificar procesos reales al retomar).
No sustituirlo automáticamente. Nuevo entorno propuesto3069/9069/5638/4538 pageeditors2qa;
puertos sin listener en planificación, verificar antes de lanzar. No existe todavía.
QA/local ya autorizado automáticamente; restricciones reales sandbox vigentes. No main,
push/deploy/GitHub/producción. Guard de tests debe apuntar sólo a nueva DB/rol verificada.

Con una futura orden de implementación: confirmar HEAD/status, crear nueva integración,
provisionar fixture aislada, aterrizar contratos/export/seams coherentes y registrar hash,
sólo entonces delegar tanda1. No activar keys nuevas por ampliar el tipo antes de integrar
sus lectores/renderers/policy. No editar producto por leer este handoff.

Prompt de retomada sugerido:

> Lee AGENTS.md y docs/specs/page-editor-editorial-pages-handoff.md en
> /private/tmp/central-hill-page-editors-integration. Implementemos la segunda tanda
> Services/About/Guides/Blog siguiendo su spec, plan y QA acotado. Conserva3068 y los
> workflows de entidades fuera de scope. Sólo entrega local, sin main/push/despliegue/producción.

Verificación documental: registrar diff --check/enlaces/scope al cerrar este encargo.
No tests/build/DB de producto por una planificación exclusivamente documental.

Cierre documental: diff --check exit0;53enlaces locales resueltos; scope exacto4archivos
Markdown (AGENTS y3nuevos documentos). Sin src/messages/drizzle/package/lockfile, sin tests,
build ni DB. Commit de cierre en HEAD al retomar.
