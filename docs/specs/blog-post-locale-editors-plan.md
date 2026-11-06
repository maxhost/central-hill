# Blog Posts — plan del piloto de edición por idioma

2026-11-05. **Piloto Blog implementado y aprobado por QA funcional independiente.**
Producto y hoja de ruta: [spec](entity-locale-editors-spec.md).
Base auditada `2aa031d`; savepoint documental `48ae09c` en `main`.
Ejecución actual en `post-locales/integration`; ver registro al final.

## Resultado verificable

Un artículo real se crea y guarda como borrador EN, se edita manualmente en
ES/PT/FR y se publica por idioma desde `/admin/posts/[id]`. Publicar ES puede
preceder a publicar EN. Guardar nunca cambia lo público. Los idiomas existentes
conservan lo que se ve hoy y las traducciones pendientes se recuperan como drafts.

Blog es el piloto más acotado por no tener inventario ni un árbol de entidades
hijas publicables. Su dificultad principal es separar datos live de snapshots;
no se debe estimar como un cambio de pestañas únicamente. Los siguientes slices
se adaptan después de validar este piloto, en el orden acordado.

## Decisiones propuestas y supuestos explícitos

| Decisión | Propuesta para el piloto |
|---|---|
| Traducción | Manual; confirmado por el usuario. Sin proveedor automático |
| Acciones | Guardar borrador y Publicar para el idioma activo |
| Almacén | Tabla de snapshots propiedad de Blog; Pages conserva su tabla |
| Autoría común | Referencias/portada/OG/fecha/featured/relacionados desde EN, congelados por publicación |
| Cuerpo | Documento completo independiente por idioma; sin sincronización por índice |
| URL pública | Preservar slugs legacy; nuevos posts reservan slug base al crear; sin edición posterior en este piloto |
| Sin traducción | Nuevos idiomas sin snapshot quedan fuera del público; baseline legacy conserva los fallbacks actuales |
| Preview | Mismo renderer real y estado local privado, sin side effects |
| Archived | Estado global explícito que oculta todos los idiomas |
| Guías futuras | Un agregado guía/idioma; confirmar detalles en su propia fase |

La restricción de edición de slugs y el alcance compartido de campos se presentan
para revisar junto con el spec. No se ejecuta una implementación suponiendo que
este documento ya recibió aprobación de producto.

## 0. Preparar ejecución y entorno

Al recibir la solicitud de implementación:

1. Releer AGENTS, handoff y spec; fijar nuevo HEAD y cambios preexistentes. El
   commit documental final podrá ser distinto de la base auditada indicada aquí.
2. Crear rama/worktree de integración propuesto `post-locales/integration` en
   `/private/tmp/central-hill-post-locales-integration`. No crearlos ahora.
3. Registrar en este plan las rutas y ramas **reales**, permisos, puertos libres,
   candidatos y ownership antes de delegar. No reutilizar previews existentes.
4. Preparar propuesta concreta de DB/rol/storage sintéticos nuevos. Obtener
   autorización de cambios DB antes de crear/aplicar migraciones/fixtures, según
   el acuerdo vigente. No copiar `.env.local` ni credenciales Neon remotas.
5. Identificar Node22/pnpm disponibles. Verificar DB y rol por SQL antes de toda
   escritura de pruebas. Asignar preview nuevo sólo tras comprobar puerto libre.
6. Preservar3071 y todos los worktrees/artefactos anteriores, el logo no rastreado
   y la actualización de contactos expresamente aplazada.

No hay comandos de implementación ni autorización de producción en este plan.

## 1. Cerrar contratos antes de los consumidores

Responsable: orquestador. No lanzar escritores antes de este punto.

- Registrar ADR nueva, con número libre comprobado al ejecutar, que extienda el
  patrón de ADR0040 a artículos y documente límites del slug y del estado global.
- Definir `BlogPostEnvelopeV1`, modelo editorial por idioma y schemas de guardado
  tolerante/publicación estricta. Incluir referencias snapshot y cuerpo completo.
- Definir resultados de `getPostEditorialModel`, creación de identidad,
  `savePostLocaleDraft`, `publishPostLocaleDraft` y preview: revisión, errores de
  campo, conflicto, not_found y estado del idioma. Nombres definitivos se fijan
  antes de repartir; no dependen de importar internals de Pages.
- El resultado de una mutación sólo actualiza el modelo del idioma afectado.
  No `router.refresh()` que reconstruya el formulario completo y pierda otros tabs.
- Definir contrato de política Blog para que Translation detecte `blog_post`,
  redirija al editor y rechace escrituras. Evitar dependencia circular Blog ↔
  Translation; Blog no importa el generador legacy para este flujo manual.
- Auditar roles reales de Posts frente a Translations. Mantener gates de edición
  existentes y probar denegaciones en todas las acciones/preview. Cerrar el caso
  de personal con rol sólo traductor antes de retirar su acceso a Blog; no
  conceder acceso general al editor por el simple redirect.
- Probar viabilidad del CAS y bootstrap con Neon HTTP. Publicar no depende de
  `db.transaction()`; se implementa como escritura SQL condicional atómica sobre
  la fila del idioma. Bootstrap conserva los cuatro baselines de forma coherente
  y no sobrescribe filas ya inicializadas. La creación de identidad/slugs es
  recuperable sin publicar estados parciales.
- Definir cómo se reservan slugs nuevos con el seam de kernel existente, sin
  reescribir slugs legacy ni necesitar escribir slugs durante Publish.
- Definir revisión de archivado frente a Save/Publish concurrentes: el cierre
  global prevalece y no se puede volver a publicar desde una sesión obsoleta.
- Cerrar validación de tamaño/payload, medios, CTA y corrupción legacy. No heredar
  el comportamiento del parser actual que devuelve cuerpo vacío ante JSON inválido.

Migración propuesta: tabla `blog_post_locale_content`, FK al post, unique
post/locale, revisión y timestamps/actor textual. Asignar número al ejecutar;
no aplicar migraciones aquí. Si registrar el schema modifica `src/core/db`, la
ADR y el orquestador cubren ese archivo exacto; no autoriza cambios generales al kernel.

## 2. Reparto de escritura para la implementación autorizada

Dos implementadores en worktrees separados y un QA independiente después de la
integración, según el acuerdo del proyecto. Sólo el orquestador integra.

| Responsable | Archivos y tareas propuestos |
|---|---|
| Orquestador | Contratos/schema/ADR/migración; integración Translation; shell compartido si hiciera falta; mensajes globales; rutas; README y documentación |
| A: backend Blog | Persistencia, bootstrap, validación editorial, lecturas públicas/admin y publicación/revalidación; tests funcionales backend |
| B: interfaz Blog | Formulario/estado por idioma, BodyEditor, listado/estado, navegación, preview por adapter y anotaciones del renderer; verificación de interacción |
| QA independiente | Revisión integrada y escenarios acotados sobre entorno sintético; informe, sin fixes silenciosos |

Write set previsto del orquestador:

- `src/slices/blog/{schema,contract,editorial-types}.ts`;
  `src/slices/blog/admin/editorial-contract.ts` (nuevo, contrato cliente sin DB).
- `src/slices/translation/admin/{queries,actions}.ts`,
  `src/slices/translation/admin/ui/review.tsx`,
  `src/slices/translation/server/generate.ts` y su README.
- `src/slices/blog/server/editorial-translation-policy.ts` (nuevo, política).
- Rutas bajo `src/app/(admin)/admin/(panel)/posts/` y nueva ruta privada
  `src/app/(admin)/admin/preview/posts/[id]/page.tsx`; comprobar convivencia con
  las rutas preview actuales y gates de staff/noindex.
- `messages/{en,es,pt,fr}.json`, `drizzle/<nueva-migración>.sql`, metadatos de
  migración exigidos por el repo, registro de schema exacto que resulte necesario.
- `src/slices/backoffice/{contract,page-editor-types}.ts` y componentes compartidos
  sólo si aparece una extensión mínima: fijar los paths exactos antes de editar.
- Este plan, spec, informe de ejecución/QA/handoff nuevos, Blog README y docs del
  modelo de datos. Actualizar el inventario de autores/categorías pendientes.

Write set previsto de A:

- `src/slices/blog/admin/{actions,queries}.ts`;
  `admin/validation.ts` sólo lo necesario para retirar guardado live de posts sin
  alterar managers de autores/categorías.
- Nuevos `src/slices/blog/server/post-locale-{store,bootstrap,validation,model}.ts`,
  `admin/post-locale-actions.ts` y `admin/post-preview-actions.ts`.
- `src/slices/blog/server/{queries,publish}.ts`.
- Nuevos `src/slices/blog/tests/post-locale-*.test.ts` y ajustes de tests existentes
  sólo si su comportamiento quedó sustituido.

Write set previsto de B:

- `src/slices/blog/admin/ui/{post-form,body-editor,list}.tsx`;
  nuevos `post-locale-editor.tsx`, `post-editor-state.ts`,
  `post-editor-adapter.tsx` y `post-editor-preview.tsx` en ese directorio.
- `src/slices/blog/ui/blog-post.tsx`, `ui/components/body-renderer.tsx` y
  componentes propios que requieran anotación preview, nombrados antes de empezar.
- Tests puros de estado/navegación sólo si verifican una garantía significativa.

Son asignaciones propuestas, no permiso para ampliar directorios. Antes de
delegar registrar lista definitiva de nuevos/existentes y corregir paths al HEAD
de ejecución. Los contratos comunes se fijan/commitean primero. Cada escritor
verifica cwd/rama/HEAD/status. Los cambios a contratos los realiza el orquestador.

## 3. Backend, baseline y lectura pública

Implementador A, después de contratos:

1. Capturar baseline público real resuelto por idioma desde legacy, con sus slugs
   y referencias. Para post draft/archived no inventar publicaciones públicas.
   Preservar su material editorial como draft y su archivado como cierre global.
2. Importar targets no aprobados como drafts sobre su baseline efectivo,
   conservando también valores opcionales que no tienen fuente EN actual. No
   aprobar ni descartar targets; corrupción legacy produce error recuperable.
3. Implementar Save y Publish con revisión independiente y retorno acotado al
   idioma afectado. La revisión no desaparece al limpiar draft. El servidor
   verifica permisos, IDs, medios existentes y ownership de referencias.
4. Separar consultas privadas del renderer público. Leer published por idioma
   para tarjetas/detalle/featured/relacionados; resolver categorías/autores desde
   referencias snapshot, no desde joins antiguos de `blog_post`.
5. Distinguir fila ausente vs published null. Evitar que un nuevo post con estado
   global draft y un idioma publicado quede oculto por el antiguo filtro global.
6. Slugs/reservas no implican publicación. Params estáticos, alternates y sitemap
   deben filtrar visibilidad efectiva del idioma, también con fallback legacy.
7. Revalidar tags reales y dependencias del sitemap al publicar/archivar/eliminar.
   Eliminar limpia snapshots y recursos relacionales propios conservando las
   reglas de referencias entre artículos. Save draft no invalida público.
8. Implementar preview validada, privada y efímera del documento local, con medios
   temporales acotados. No llama al público cacheado para obtener el post draft.

El orquestador activa simultáneamente exclusión, redirección y todos los bloqueos
legacy, incluido `generateDrafts` directo y el antiguo `savePost`. Auditar scripts
que escriben Blog; no reejecutar semillas para resolver compatibilidad.

## 4. Editor y preview

Implementador B, contra contratos estables:

1. Crear estado independiente por locale, carga/errores por tab y las dos acciones
   con destino explícito. Reutilizar shell/controles de Pages vía Backoffice.
2. Primer guardado EN crea identidad; después continuar por idiomas sin publicar
   EN. Reemplazar estado global publicado por indicadores de cada idioma.
3. Conservar cambios de otros tabs al guardar/publicar y al recibir respuesta
   asíncrona. Respuestas viejas nunca pisan el locale seleccionado actualmente.
4. Usar BodyEditor sobre cuerpo completo por idioma. Permitir drafts incompletos;
   publicar lleva al campo/bloque inválido sin borrar el resto del trabajo.
5. Media queue sólo finaliza los archivos que requiere el guardado seleccionado.
   Si la API actual no permite aislarlos, comunicarlo al orquestador antes de
   modificar la cola compartida; no vaciar la cola global como atajo.
6. Preview del post real vía `BlogPostRenderer`, conservando su CTA propio y los
   elementos compartidos publicados de Pages. Sin newsletter activa ni enlaces
   de reserva accionables, sin JSON-LD privado, sin requests de escritura.
7. Aviso de salida sobre cualquier locale dirty; navegación/cancelación conserva
   foco y estado. Pestañas de idioma no disparan aviso porque no abandonan el post.
8. Estado por idioma en `/admin/posts`; distinguir ausencia de publicación de
   borrador pendiente. Archive/Delete secundarios explican su alcance global.

La dirección visual sigue el backoffice actual: header persistente, inspector a
la izquierda, sidebar colapsada en editor contextual y SEO dedicado cuando se
reutilice su shell. No abrir una fase de exploración estética ni rehacer el sitio.

## 5. Verificación funcional acotada tras integrar

Sin pruebas ahora: entrega documental. Para implementación futura, usar una sola
ronda integrada y retests de defectos corregidos, evitando matrices expansivas.

| Escenario | Evidencia requerida |
|---|---|
| Nuevo EN | Guardar incompleto, recargar; sin listado/detalle/sitemap público |
| Publicar ES antes de EN | ES público completo; EN/PT/FR siguen ausentes |
| Separación de estados | Editar EN y ES, guardar/publicar EN; ES local y draft persistido intactos |
| Recarga | Recupera draft guardado y no conserva falsamente cambios sólo locales |
| Concurrencia | Dos sesiones del mismo locale: stale Save/Publish rechaza; sin resucitar draft tras publicación; locales distintos no se bloquean |
| Baseline legacy | Cuatro versiones públicas equivalentes, target pendiente como draft, slugs localizados preservados; baseline repetido no pisa datos |
| Legacy inválido | JSON/cuerpo desconocido no se convierte en artículo vacío ni se sobreescribe; error recuperable |
| Cuerpo/medios | Texto, imagen/alt/caption, lista, quote/callout y CTA; target con distinto orden; upload seleccionado y preview temporal sin persistencia |
| CTA | Link/label distintos EN/ES; vaciar pareja vuelve al compartido; URL peligrosa rechazada |
| Preview | Cuatro locales, Refresh y respuesta fuera de orden; mismo renderer; submit/links externos inertes; cero mutaciones |
| Público/SEO | Listado, destacado, relacionados, metadata, JSON-LD, params, hreflang y sitemap consistentes con idiomas publicados |
| Retirada parcial | Review legacy redirige al post/locale; todas las mutaciones/generador rechazan Blog; otros tipos mantienen flujo |
| Permisos | Sin sesión y roles sin permiso no leen preview ni guardan/publican por acceso directo; redirect no amplía permisos |
| Navegación | Cambio de tab conserva cambios, salida Cancel/Escape/Continue, draft guardado puede dejarse sin publicar |
| Ciclo global | Archive oculta los cuatro idiomas sin perder documentos; sesión obsoleta no lo república; Delete respeta referencias |
| Viewports | Una ronda desktop/móvil y teclado/foco estable sobre el editor integrado |

Agrupar escenarios compatibles en fixtures/recorridos; no prometer un número de
tests independiente de cómo se implementen. QA revisa los resultados del candidato
y no repite suites pasadas sin cambios o defecto pendiente que lo justifique.

Comandos previstos con Node22, desde integración y con env sintético verificado:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm exec tsx --test <lista explícita de tests afectados>`; fijar paths reales
  en el registro de ejecución antes de correr. Incluir guards Translation y
  render/SEO afectados; no usar globs amplios como sustituto de selección.
- `pnpm db:check` por la nueva migración.
- `pnpm build` en entorno sintético; lecturas de build también deben estar aisladas.
- Browser funcional con Save/reload/Publish reales sólo en esa DB autorizada.

Registrar comandos exactos, exit codes, commit candidato y evidencia. Ni `pnpm
test` ni `boundary:check` cuentan como checks reales. Revisión explícita de
imports/contratos, campos públicos localizados, SEO e ISR. No ejecutar QA
automática de un ajuste puramente estético posterior; se mantiene la regla L0.

## 6. Cierre y siguiente fase

Tras QA funcional independiente y revisión del usuario, registrar candidato,
migración aplicada sólo en entorno autorizado, rutas, procesos, archivos
incluidos los no rastreados, límites y pendientes. Entrega local en rama de tarea;
sin integración a main, push, despliegue ni escritura Neon remota por defecto.
Commit/integración local seguirá el límite explícito de la solicitud futura.

Mantener `/admin/translations` para otros tipos y managers Blog auxiliares.
El éxito del piloto habilita preparar el spec concreto de edificios/apartamentos;
no autoriza arrancar automáticamente la siguiente fase.

## Registro de la fase documental previa

Se añadieron únicamente este plan y el spec enlazado. No se lanzaron agentes,
tests ni QA. No se consultó ni modificó contenido de DB ni se aplicaron
migraciones. Localhost3071 ya estaba activo y `/admin/login` respondió HTTP200
en la comprobación de arranque de esta conversación; no se reinició el proceso.
El logo previo no rastreado permanece ajeno a esta entrega. Sin commit/push/deploy.

## Ejecución autorizada —2026-11-05

Savepoint documental48ae09c, resuelto con git log -1. Usuario autoriza implementar
el piloto y crear DB sintética postlocalesqa, Postgres5648/proxy4548/storage9072,
preview3072 y pruebas Save/Publish sintéticas. Integración real
/private/tmp/central-hill-post-locales-integration, rama post-locales/integration.
Writers: /private/tmp/central-hill-post-locales-backend (post-locales/backend),
/private/tmp/central-hill-post-locales-ui (post-locales/ui). Se crearán desde el
commit de contratos antes de delegar. Node22.23.3/pnpm10.8.0. Sin Neon remoto,
main integration/push/deploy; conservar3071 y logo no rastreado.

Contratos definitivos: editorial-types.ts/admin/editorial-contract.ts;
getPostEditorialModel(id): BlogPostEditorialModel|null, con previews/slugByLocale.
SaveBlogPostDraftInput incluye postId UUID cliente estable, locale, expectedRevision,
templateRevision,payload y slug sólo para primera creación EN. Acciones públicas
Blog savePostLocaleDraft/publishPostLocaleDraft en admin/post-locale-actions.ts.
renderPostLivePreview(input:BlogPostPreviewInput) en admin/post-preview-actions.ts.
Archive secundario archivePost(postId) mismo archivo de acciones; deletePost
existente se conserva con limpieza de snapshots en FK. No acceso extra por rol:
Posts actual usa requireStaff() sin roles, igual que Translations.

Ownership final A: admin/actions.ts,admin/queries.ts,admin/validation.ts; nuevos
server/post-locale-store.ts,post-locale-bootstrap.ts,post-locale-validation.ts,
post-locale-model.ts;admin/post-locale-actions.ts,admin/post-preview-actions.ts;
server/queries.ts,server/publish.ts;tests/post-locale-*.test.ts.
B: admin/ui/post-form.tsx,body-editor.tsx,list.tsx; nuevos
post-locale-editor.tsx,post-editor-state.ts,post-editor-adapter.tsx,
post-editor-preview.tsx;ui/blog-post.tsx,ui/components/body-renderer.tsx.
Root: contratos/schema/migration0024/ADR0057; Translation paths listados; rutas
Posts/preview/posts/[id];mensajes;backoffice/ui/media-queue.tsx y
backoffice/ui/admin-workspace.tsx para modo enfocado; política Blog
server/editorial-translation-policy.ts;docs/README/spec/modelo.
A y B pueden añadir tests propios dentro del write set; no cambian contratos.
El listado UI B consume PostAdminListItem.localeStates opcional definido por A:
Partial<Record<Locale,{published:boolean,draft:boolean}>>.
Preview de A devuelve {ok:true,content:ReactNode}|{ok:false,error:'validation'|'server'};
B sólo anota renderer dentro de su ownership. Se mantiene el block set actual.
Verificación: pnpm typecheck/lint/build/db:check; tests explícitos nuevos de A
y consumidores afectados (fijar lista antes de ejecutar), browser funcional real
en3072/DB sintética. QA independiente tras integrar; ninguna prueba en3071.

Root scope addition: scripts/seed-blog.ts rejects legacy writes before mutation; DRY remains read-only. Migration metadata snapshot0024 also owned by root.

Entorno creado y verificado: SQL current_database/current_user=postlocalesqa;
containers central-hill-post-locales-db5648 y central-hill-post-locales-proxy4548
red central-hill-post-locales-qa. Migrations0000..0024 aplicadas con psql
ON_ERROR_STOP,25archivos exit0, migrations.log en
/private/tmp/central-hill-post-locales-qa. Proxy inicial falló porque Postgres
aún no estaba listo; reiniciado sólo ese proxy nuevo y verificación SQL exit0.
Storage9072 session8962 (bytes/HEAD/PUT sintéticos; no comprueba firma S3).
Env/preload/seed.sql/fixtures.json en ese artifact; credenciales sólo sintéticas.
Preload redirige postlocalesqa.local al proxy y rechaza Neon remoto. Preview3072
pendiente de integración. Imagen y artículo base incluyen ES publicado/PT pendiente,
slugs ES/PT diferentes, autor/categoría. No entorno previo modificado.

Root scope: page-editor-types.ts optional disabledLocales and ui/page-editor-shell.tsx honour it; existing Pages adapters unchanged. Stable Blog workspace key prevents first-save history update from remounting initial=null; true post routes key editor by postId.

QA media URLs use root-relative /postlocalesqa through an untracked public symlink
to artifact storage; this permits real Next image optimization without enabling
private remote IPs. S3 PUT/HEAD remains only local9072. Preserve this runtime
artifact outside commits. No product Next config/kernel change.

Contratos follow-up8758475 preserva reading_minutes=null legacy (sin metadata
de lectura), sin sustituir por5. Backend y UI consumen el cambio antes de
integrar. Documento editorial máximo192KiB UTF8, preview request256KiB;
se conserva el límite del bridge, sin ampliar guardas globales.
Verificación db:check exit0:25migraciones, warning0008preexistente.

Integración inicialc819e66: typecheck/lint exit0 (7warnings preexistentes),
46tests seleccionados exit0, incluidos11backend y3UI. C87dcd8 mejora badges
legacy y categorías snapshot; typecheck-final y lint afectado exit0.
Build inicial compila pero falla prerender por max_connections100 de DB
sintética (proxy:too many clients); sólo esa DB aumenta a400, se reinician
DB/proxy propios, SQL identidad verificada, build-final exit0 para c87dcd8.
Production3072 session41833 corre ese build durante primera QA independiente.
Source followups1e9dfc6/c3de364 mantienen traducciones locales sin draft tras
guardar/publicarEN y muestran bloqueo Delete por referencias; backend guard
pendiente de integrar, luego rebuild y confirmación dirigida QA.
No scanner/library de borrado media implementado en este checkout: sólo
core.media.deleteMedia y scripts históricos; no nueva UI delete ni cambio kernel.
3071 original dejó de tener listener sin acción nuestra; restablecido mismo
checkout/env Node22 dev sesión62782, sin migrar/guardar contenido.

QA detecta Delete de post relacionado que dejaría IDs invisibles y bloquearía
futuros Save. Corrección agrupada: rechazo explícito in_use si otro snapshot
draft/published referencia el post, manteniendo versiones ajenas; serialización
DB no interactiva para carrera Delete/Save. Mensajes cuatro locales y estado
visible Published/Not published + Draft saved + Unsaved se integran antes
del build candidato final. Revisión de diseño mecánica impeccable exit0 [].

Candidato2f67116: typecheck/lint/build0 y16tests afectados0 (12backend+4UI),
con Delete/Save race y rechazo draft/publicado. QA confirma caso posterior
a Publish target con referencias congeladas: helper30ce88a prepara referencias
EN al primer cambio real del target sin draft, manteniendo preview post-Publish
igual a público y todo texto/cuerpo/enlace propio. Sólo state/test cambiado;
5tests de estado/typecheck/lint afectados en confirmación, sin repetir DBsuite.
Luego rebuild final para confirmación funcional restante de QA.

Confirmación final antes del cierre: executable9b875d7 (code30ce88a)
con5state tests/typecheck/lint afectados0 y build-confirm0. Runtime3072
PID62000/sesión12717. Para imágenes nuevas en producción local, Next enumera
publicFolderItems al arrancar; el symlink solo no cubre uploads posteriores.
QA runtime usa start-preview.cjs con la configuración generada de ese mismo
build vía __NEXT_PRIVATE_STANDALONE_CONFIG, añadiendo sólo remotePatterns
127.0.0.1:9072/postlocalesqa/** y dangerouslyAllowLocalIP=true para el storage
sintético; R2_PUBLIC_BASE_URL se establece al endpoint local absoluto.
Producto next.config.ts no cambió y producción no habilita IPs privadas.
Login y optimizador real /_next/image con fixture local responden200.
El symlink sigue sirviendo los assets baseline relativos precalculados.
No fuente ejecutable cambió después del build; QA completa la ronda funcional.

QA navegador nuevo encuentra dos bloqueantes de flujo normal: tras primerSave
la revalidación RSC de /new podía regenerar UUID/key y reiniciar el formulario;
los drafts target creados sin portada congelaban null e impedían publicar al
añadir EN después. Corrección agrupada autorizada dentro del piloto: root retira
key inestable, UI navega realmente al ID tras primerSave manteniendo busy hasta
montar modelo guardado; operaciones posteriores no refrescan otras pestañas.
Control local explícito Use saved English details permite adoptar sólo metadata
EN conservando texto/cuerpo/enlaces y el draft original hasta Save. Backend usa
templateRevision no-null como adopción explícita también para target con draft,
con revisión y shared-match EN bajo CAS. Sin nueva migración/acción editorial.
Root añade mensajes cuatro locales y ADR; A store/test, B UI/state/test.
Después rebuild y confirmación sólo de estos flujos más aceptación restante.

Candidato de confirmación58ba96a integra fixes EN-adoption y primera navegación.
Typecheck-release/lint-release/tests-release19/build-release exit0;13backend
(DB/puro) +6UI. No fixtures/DB fuera de postlocalesqa. Runtime3072
PID69153/sesión73284, login200. QA confirma sólo correcciones y aceptación
restante; los recorridos existentes ya aprobados no se repiten. No cambios
ejecutables previstos después de este build.

## Cierre local

Ejecutable58ba96a aprobado independientemente; informe060c195. Confirmados
primer/segundo Save real, datos de idiomas independientes, metadata EN explícita
sin mutar draft hasta Save, dos uploads en cola aislados por idioma, ES público
antes de EN, siguiente edición de draft congelado recién publicado, imágenes
reales optimizer200, canonical/hreflang/sitemap, Delete referenciado sin mutar
publicaciones ajenas, denegación anónima real y Archive global conservando datos.
QA registra también baseline4locales, foco/preview/Refresh/sinwrites, reload,
navegación y móvil. No bloqueantes abiertos ni QA pendiente.

Entrega y manifest en blog-post-locale-editors-delivery.md; QA en
blog-post-locale-editors-qa.md. Runtime3072 PID69153/sesión73284 aprobado,
3071 original PID58381/sesión62782 restaurado y preservado. Root hace sólo
commit documental de cierre después de la aprobación; sin recompilar ni repetir
checks sin cambios de ejecutable. No main merge/push/deploy/Neon remoto.
User revisa localhost3072. No se arrancan fases siguientes automáticamente.
