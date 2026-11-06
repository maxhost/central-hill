# Blog Posts — plan del piloto de edición por idioma

2026-11-05. **Plan propuesto; implementación pendiente de solicitud expresa.**
Producto y hoja de ruta: [spec](entity-locale-editors-spec.md).
Base auditada `2aa031d` en `main`; sólo cambios documentales en esta entrega.

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

## Estado de esta sesión documental

Se añadieron únicamente este plan y el spec enlazado. No se lanzaron agentes,
tests ni QA. No se consultó ni modificó contenido de DB ni se aplicaron
migraciones. Localhost3071 ya estaba activo y `/admin/login` respondió HTTP200
en la comprobación de arranque de esta conversación; no se reinició el proceso.
El logo previo no rastreado permanece ajeno a esta entrega. Sin commit/push/deploy.
