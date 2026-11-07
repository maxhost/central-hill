# Autores y categorías Blog — inputs por idioma

2026-11-06. Usuario autoriza implementar en la misma ficha, sin tabs: autor con
nombre y biografía EN/ES/PT/FR; categoría con nombre EN/ES/PT/FR. Web usa el texto
del idioma del post. Base main6445c99, tracked clean; sólo logo y symlink de media
untracked previos. Entrega main local + único3071, sin push/deploy/remoto. Ciudades,
barrios, FAQ/testimonios y restantes auxiliares quedan para otra petición.

## Inventario y contrato ejecutable

Los dos forms actuales escriben EN mediante saveAuthor/saveBlogCategory, con un
Save único; conservan slug, estado/avatar compartidos del autor y slug/color/orden
de categoría. Public Blog ya resuelve loadContent(locale) para listing/detail/
featured/related/privatepreview y metadata; snapshots conservan sólo author_id/
category_id. No duplicar identidades, asignaciones, fotos ni snapshots de posts.

Añadir translations opcional al input actual para compatibilidad con clientes
anteriores: categoría {es,pt,fr}:string; autor {es,pt,fr}:{name:string,bio:string|null}.
EN sigue name/bio originales. Targets trim/max80 categoría, max120 nombre autor,
max1000 bio; permiten blanco/null. EN nombre requerido, EN bio opcional. Omitir
translations conserva todos los targets anteriores; enviarlo aplica todos los
campos manuales: texto no vacío aprobado, vacío borra sólo esa hoja/idioma y usa
fallback EN. Una edición EN posterior no sobrescribe textos target existentes.

Queries de edición cargan filas authored RAW, incluidos pending, sin copiar
fallback EN dentro de inputs vacíos. Un Save explícito aprueba textos manuales;
GET/no-op navegación no modifica nada. Sin tabs, traducción automática, revisión
adicional, draft/Publish por idioma ni nuevas tablas/migración. Mantener handlers
actuales de shared columns, uploads y delete/in-use guards. Secuencia actual de
writes se conserva; no nueva promesa de atomicidad. Busy deshabilita controles.

El borrado EN de una bio merece tratamiento especial: setSourceContent actualmente
borra ese campo de TODOS los idiomas cuando recibe null/empty. ADR0067 autoriza
opción de kernel preserveTargetsOnClear:true, que limita esos clears a EN; default
mantiene la semántica histórica. Usarla en autor. Así bio EN vacía puede coexistir
con bio ES propia, incluso cuando un cliente antiguo omite translations. No editar
tablas de i18n desde Blog ni snapshot/restore secuencial de targets eliminados.

Opciones de autor/categoría del editor de posts añaden labels opcional por locale,
resuelto desde traducciones aprobadas con fallback EN/slug. Al cambiar tab del post
cambia sólo texto visible del selector, sin selección propia ni cambio de ID/
referencias/SEO/revisión/publicación. El usuario sigue eligiendo la identidad en EN.
Public y preview usan idioma del post, no idioma del navegador/admin. Save de ficha
invalida blog_post-list (ya etiqueta detalle/listado/featured/related), sitemap y
admin posts; no requiere republicar post ni altera sus snapshots/revisiones.

Cerrar segunda vía de autoría para author/blog_category en Translations extendiendo
política Blog existente: inbox/acciones/generador ya consultan esa política, enlaces
antiguos redirigen a /admin/authors/id o /admin/blog-categories/id. No borrar filas
antiguas ni quitar sección global. Sólo posts conservan query ?locale para tabs.

## Propiedad y workflow

Root estabiliza tipos/validación/interfaces y ADR antes de bifurcar consumidores.
Integración blog-reference-locales/integration en
/private/tmp/central-hill-blog-reference-locales-integration.

Root owns: este spec y QA handoff; ADR0067/index, AGENTS, roadmap/data-model;
src/core/i18n/content-write.ts (sólo flag descrito); src/slices/blog/reference-locale-types.ts;
admin/validation.ts y adiciones iniciales a query interfaces; contract exports;
server/editorial-translation-policy.ts; Translation README; messages4locales; fixtures/runtime/integración.

Backend worktree /private/tmp/central-hill-blog-reference-locales-backend rama
blog-reference-locales/backend. Own blog/admin/actions.ts (sólo dos Save calls/cache),
admin/queries.ts (sólo authors/categories reads/options), nuevo server/reference-locales.ts,
README.md, nuevos tests/blog-reference-locales.integration.test.ts y
tests/blog-reference-locales.test.ts. No core/types/schema/messages/UI/policy edits.
Usar flag root y costuras existentes. Verificar post snapshot/ID/rev intactos y
targets pending/raw/approved/fallback, campo por campo, ENclear y legacy clients.

UI worktree /private/tmp/central-hill-blog-reference-locales-ui rama
blog-reference-locales/ui. Own blog/admin/ui/author-form.tsx, category-form.tsx,
post-locale-editor.tsx (sólo Option type + option labels), nuevo
admin/ui/reference-locale-payload.ts y tests/blog-reference-payload.test.ts.
Inputs juntos EN/ES/PT/FR, sin tabs. Nombre y bio completos de autor por idioma;
hint fallbackEN, IDs/htmlFor/maxLength/errors/disabled adecuados. Conservar controles
actuales/shared/media pipeline. Usar diseño de fichas existente/Amenities, sin
rediseño amplio ni cambios de toolbar de posts. Leer skill Impeccable/craft-floor;
context launcher ya ejecutado una vez en esta conversación, no repetirlo.

Dos writers aislados, sin nested agents. Root cherry-pick secuencial; QA independiente
después de ensamblar. QA own docs/specs/blog-reference-locales-qa.md y artifacts
/private/tmp/central-hill-blog-reference-locales-qa/independent. Tres grupos acotados:
1autores/categorías New/Edit rawtargets/manualSave/reload/pendingapproval/fallback;
2post sameID en4tabs + public4locales nombre/bio/categoría + preview/related/list;
3renameEN/clearES/clearENbio y targets preservados, sin republicar posts, legacy
redirect/guards/unauth/mobile y hashes protegidos. No estética/screenshots loops ni
matriz expandida. Corrección sólo ante defecto real, confirmación dirigida.

## Entorno y verificación

Mantener actual-main dev3071PID8218/session41807 hasta candidato preparado. Root
controla único listener y devuelve main dev tras QA. Preservar storage9077PID30456,
propertylocalesqa DB5658/proxy4558, safeenv
/private/tmp/central-hill-building-status-qa/env.sh (Node22). No copiar env remoto.
Autorización vigente de contenido sintético en propertylocalesqa: SQL DB+rol y
hostname verificados antes de writes. No schema/migration, no autorización nueva
necesaria. Tests own e800 se limpian, browser nuevos e801 se retienen con IDs/media
registrados. Datos antiguos d/f/e78/e79 y fixtures previos protegidos con hashes.

Checks integrados reales: typecheck, lint (7warnings previos), tsx tests explícitos
Blog afectados/regresiones/kernel flag DB, build sólo tras cleanup e800 usando
CIRCLE_NODE_TOTAL=3/2workers y safeenv. No pnpm test/boundary placeholders. No
db:check obligatorio sin migración. QA sobre build producción3071, luego main ff
local y apertura final sólo lectura. No repetir matriz aprobada sin cambio/defecto.

## Progreso

Inventario/spec completados antes de implementar. Contratos root siguen.

Contratos root851b137 antes de consumidores; deps integración propias instaladas
con lockfile congelado desde caché local existente (517reused/0download), sin
modificar node_modules de main. Mensajes4locales agregados por root. Browserfixtures
nuevas e801 category1/author2/post3/related4 con4pubs rev7 y raw EN/ESpending/PTown/
FRblank; referencia foto d300 sólo lectura, position9999. GuardDB+role/hostname y
42hashes previos a seed en /private/tmp/central-hill-blog-reference-locales-qa/.

UI dfe7b2e integrado60a2476; backend415bbed integradof2ccea0. Backend5pure+5DB
pasaron y limpiaron e800. UI13pure/typecheck/lint0. Root49regresiones puras0.
Revisión detectó ENname sólo espacios aceptado por schema antiguo; root2864c61
trim+min1 antes de writes, regresión pura agregada al test integrado tras handoff.
No cambios de DB/esquema ni datos existentes. Compilación y QA siguen pendientes.

Candidato integrado c155184: root typecheck0, lint0/7warnings previos,59tests0
(54puros+5DB; incluye regresión whitespaceEN y default/opt-in kernel clears), e800
limpiados antes de build. Build0/136páginas con2workers, config intacta; warning
metadataBase de entorno sintético preexistente. Todos los logs en directorioQA.
Root comparó42hashes previos al seed/store con baseline independiente: idénticos.

QA arranca3grupos sobre producción3071PID31418/session66340, único listener desde
integración. Root detuvo sólo main8218/8212 tras verificar cwd. Login200, storage/
DB/proxy preservados. Main ff y runtime definitivo pendientes de QA.

QA independiente completó3grupos sobre c155184: inputs/Save/reload/rawpending;
selector+public4locales+related/JSONLD/privatepreview; ENrename/clears/ENbioclear/
fallback/legacyroutes/auth/mobile.0pageerrors,42hashes protegidos idénticos a antes
seed/store, todos los posts/pubs/drafts/revs y neutralrefs intactos. No defecto ni
corrección de producto en QA. Único ajuste de harness: JournalCard existente no
muestra authorbyline, se comprueba allí categoría y en detalle/preview el autor.
Nuevos e801 y autor32f7330c-3e42-477e-a053-84bea16ad0d5/categoría8e4e5605-dce4-
4360-8cb6-9569bb94303d retenidos, sin assets nuevos. Rootcomparación final en
final-protected-comparison.json; IDs exactos independent/owned-ids.json.

## Entrega local —2026-11-07

QA42b9ca7 aprobó c155184 sin correcciones de producto. Main ff6445c99→05c696b,
QA31418 detenido, único actual-main dev3071 PID35581/parent35575/session36923 con
cwd workspace verificado; syntheticDB5658/proxy4558/storage9077PID30456 preservados.
main-open.mjs sólo lectura confirmó200 cuatro fichas (New/Edit), cuatro nombres/
biografías autor y cuatro nombres categoría sin tabs, Post4tabs con IDs idénticos,
0pageerrors. No writes de contenido ni nueva matriz en apertura final. main-dev.log
conserva arranque. Sólo logo y symlink originales siguen untracked; todos los
worktrees/archivos/envs/artifacts preservados. Sin push/deploy/remoto. Cierre
documental posterior mediante gitlog-1. Próximos auxiliares requieren nueva petición.
