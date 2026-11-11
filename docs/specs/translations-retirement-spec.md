# Spec de retirada del traductor global

2026-11-11. Base de auditoría: main `f947c4f`. Pedido: especificar primero,
construir el plan, someterlo a revisión adversarial y después implementar mediante
dos implementadores, un QA independiente y el orquestador. La implementación y
sus E2E se entregarán por etapas pequeñas. Este documento define el resultado;
el [plan de ejecución](translations-retirement-execution-plan.md) define el orden.

## Resultado de producto

El administrador trabaja en los editores propietarios de cada contenido e idioma.
No existe una sección global para generar, revisar o aprobar traducciones. Las
URLs antiguas llevan al editor correspondiente. Se mantienen las publicaciones,
borradores, datos históricos, URLs públicas, SEO, imágenes y fallbacks actuales.

La retirada comprende la UI y el pipeline genérico S14. No elimina el sistema
multilingüe, el kernel `core/i18n` ni la tabla `translation`. Las fichas que usan
esa tabla siguen guardando normalmente. No se introduce traducción automática
en los editores visuales como sustitución.

## Alcance confirmado

- Nueve Pages: `home`, `owners`, `buildings`, `real_estate`, `guest`, `services`,
  `about`, `guides`, `blog`; Blog article sidebar y Guides aside donde se muestran.
- Blog posts, Services, Guides y sus árboles completos, Properties y sus FAQ,
  Amenities, categorías, Authors, Testimonials, City/barrios, Settings y Forms.
- FAQ general conserva **grupos independientes por idioma**, confirmados por el
  usuario. Cada Page/idioma elige su grupo. No se añaden traducciones internas,
  tabs ni etiqueta de idioma al grupo. Las FAQ de Building siguen en Building.
- `city.intro` y los ALT globales anteriores se conservan. No hay un renderizador
  público actual para `city.intro`. ALT se edita junto a la imagen conforme ADR0076.

No se incluye una biblioteca de medios, refactor de roles, nuevas migraciones,
borrado/backfill de datos, cambios de slugs, publicación remota o despliegue.

## Requisitos verificables

| ID | Requisito |
| --- | --- |
| TR01 | Ningún menú, botón, enlace o nota activa del panel ofrece el traductor global. No queda un grupo de navegación vacío. |
| TR02 | `/admin/translations`, con o sin filtros antiguos, exige sesión staff y redirige a `/admin/pages`. |
| TR03 | Las rutas de entidad antiguas exigen sesión antes de resolver contenido y siguen la tabla de destinos inferior. No renderizan una review genérica para ningún tipo. |
| TR04 | Las seis acciones genéricas niegan todo tipo/campo, incluido `form_definition` y valores desconocidos. Autenticación normal antes de devolver la denegación. No consultan ni modifican contenido, slugs, snapshots o estados. Las lecturas normales de autenticación no se confunden con lecturas editoriales. |
| TR05 | `generateDrafts` ya no genera ni escribe. Si se conserva su firma por compatibilidad, falla de forma explícita antes de cargar un proveedor o contenido. No necesita abrir una sesión para rechazar una operación que ya no existe. |
| TR06 | Las antiguas pantallas, queries de bandeja, derivación y controles de Generate/Edit/Approve/Reset/Clear desaparecen cuando no tienen consumidores. Sólo pueden quedar rutas de compatibilidad y stubs de denegación documentados. |
| TR07 | Los editores propietarios conservan su guardado, publicación por idioma, herencia/custom y fallbacks. Ninguna Page o entidad requiere usar Translations para completar el flujo. |
| TR08 | Se conservan las tablas y APIs del kernel usadas por fichas y lectores: traducciones, slugs, atribución, hash de fuente y snapshots. No se eliminan campos/filas por estar missing, stale, sin fuente o sin consumidor público actual. |
| TR09 | Las publicaciones y borradores existentes no cambian por abrir o redirigir una URL antigua. Las acciones retiradas tampoco los alteran. |
| TR10 | FAQ conserva la selección independiente por Page/idioma; vacío no hereda de EN. El lector conserva targets históricos aprobados y su fallback actual. |
| TR11 | Los ALT propios conservan aislamiento por documento/idioma; un borrador no modifica el público ni otro documento que reutilice la foto. Los ALT globales anteriores continúan como fallback. |
| TR12 | Los E2E demuestran por navegador la edición/guardado/recarga/publicación y salida pública de las nueve Pages y un Blog post, servicio y guía, en EN/ES/PT/FR. |
| TR13 | Se prueba ausencia de filtración de borradores y aislamiento entre idiomas; una publicación target no publica cambios pendientes en EN u otros targets. |
| TR14 | Las actualizaciones públicas resultan de Save/Publish y la invalidación ordinaria. No se acepta como prueba un cache flush, borrar `.next`, reiniciar el servidor o publicar otra página para forzar visibilidad. |
| TR15 | Código de cada etapa se integra antes de su QA. El QA registra el commit exacto, entorno, comandos, casos, evidencia y resultado; no aprueba código que no ejercitó. |
| TR16 | Las pruebas editoriales escriben sólo en una base nueva y aislada de la tarea con identidades sintéticas propias. Los datos y runtime actuales del usuario se conservan. |
| TR17 | No se entrega la retirada con un E2E requerido omitido o reemplazado por un test de DTO/SSR. Un fallo anterior a esta tarea se identifica y reproduce separadamente; no se presenta la batería completa como aprobada. |

## Compatibilidad de enlaces

Los destinos se obtienen con contratos de las slices. La ruta app no accede a
tablas ajenas. Los resolutores no escriben, publican ni invalidan caches.

| Tipo antiguo | Destino |
| --- | --- |
| `page_content` | Page correspondiente mediante su identidad existente. |
| `blog_post`, `author`, `blog_category` | Post, Author o categoría Blog existentes. |
| `building`, `apartment`, `building_faq` | Building/Apartment propietario según su política actual. |
| `guide_page`, `guide_section`, `guide_place` | Guide propietario según su política actual. |
| `testimonial` | Ficha Testimonial. |
| `company_settings`, `nav_item` | `/admin/settings`. |
| `service`, `service_category` | `/admin/services/[id]`, `/admin/service-categories/[id]`. |
| `amenity` | `/admin/amenities/[id]`. |
| `city`, `neighbourhood` | City; resolver el padre de barrio. |
| `faq_item` | `/admin/faq/[groupId]`; resolver el grupo padre. |
| `form_definition` | `/admin/forms/[id]`. |
| `media_asset` | `/admin/pages`: no hay un dueño único que se pueda elegir arbitrariamente. |
| Tipo desconocido o ID inválido | `/admin/pages`, sin pantalla genérica, excepción SQL ni redirección abierta. |

Un padre ausente se dirige a su catálogo (`/admin/cities`, `/admin/faq`,
`/admin/guides` o `/admin/buildings`, según corresponda). Una ficha directa cuyo
ID válido ya no existe puede mantener su 404 nativo. Un `page_content` válido sin
Page reconocida vuelve a `/admin/pages`. Conservar el idioma sólo cuando el editor
destino realmente consume esa selección; un `?locale=` ignorado no demuestra
retención. La implementación no debe ampliar la refactorización de los editores
para satisfacer una promesa de URL que hoy no soportan.

## Contrato E2E

Una unidad E2E es **superficie + idioma + ciclo completo**, no una visita ni una
aserción HTTP. Hay 48 unidades principales: 9 Pages × 4 idiomas + 3 entidades ×
4 idiomas. El sidebar de artículo Blog requiere además cuatro ciclos desde su
editor propio; Guides aside se verifica como contenido de Guides en la guía
pública. Esos cuatro ciclos extra no se confunden con otro Blog post.

| Grupo | Editor y resultado público por idioma |
| --- | --- |
| P1 Home | `/admin/pages/home` → `/{locale}`. |
| P2 Owners | `/admin/pages/owners` → `/{locale}/owners`. |
| P3 Buildings listing | `/admin/pages/buildings` → `/{locale}/buildings`. |
| P4 Real Estate | `/admin/pages/real_estate` → `/{locale}/real-estate`. |
| P5 Guests | `/admin/pages/guest` → `/{locale}/guests`. |
| P6 Services listing | `/admin/pages/services` → `/{locale}/services`. |
| P7 About | `/admin/pages/about` → `/{locale}/about`. |
| P8 Guides listing | `/admin/pages/guides` → `/{locale}/guides`, aside correspondiente en la guía sintética. |
| P9 Blog listing | `/admin/pages/blog` → `/{locale}/blog`. |
| P9a Blog article sidebar | `/admin/pages/blog/article-sidebar` → artículo sintético público. |
| B1 Blog post | `/admin/posts/[id]` → `/{locale}/blog/[slug]`, incluyendo cuerpo y referencias localizadas. |
| S1 Servicio | `/admin/services/[id]` → `/{locale}/services/[slug]`, incluyendo texto de detalle y CTA. |
| G1 Guía | `/admin/guides/[id]` → `/{locale}/guides/[city]/[slug]`, incluyendo sección y lugar del árbol. |

Cada grupo se ejecuta por separado, en serie sobre sus propias identidades. Los
dos implementadores no hacen pruebas DB contra los fixtures del QA. Las suites
unitarias/de integración que creen o retiren sus propios slots usan otro target
nuevo separado, por ejemplo `translationsretirementunitqa`, con verificación
estricta de host/DB/rol. Las guardas existentes no se relajan para aceptar cualquier
base terminada en `qa`; tampoco se ejecutan suites con guardas de tareas antiguas
contra esas bases anteriores.

Antes del primer E2E, incluidos los incrementales, el QA entrega un manifiesto de campos por superficie que enlaza
descriptor/schema → control del editor → aserción pública. Incluye los textos
públicos configurados de todas sus secciones, copy de CTA, listas, rich text,
SEO y ALT cuando existen. Los fixtures habilitan las secciones y tipos de campo
necesarios; no basta una palabra en el Hero. Los campos compartidos, secciones
sin renderer y módulos externos se identifican expresamente y no se inventan
como texto traducible. Ninguna exclusión se registra silenciosamente como pass.

Ciclo de cada unidad:

1. Registrar baseline de publicaciones/revisiones y seleccionar el idioma en el
   editor visual. Escribir por controles reales textos válidos y diferenciados
   EN/ES/PT/FR según el manifiesto. No insertar el contenido que se pretende
   probar mediante SQL, llamadas directas a acciones o endpoints ocultos.
2. Guardar borrador, salir/recargar y verificar los valores. Comprobar que el
   público sigue mostrando el baseline; preview privado muestra el borrador.
3. Publicar mediante el botón del editor. Abrir el público sin cookies de Admin,
   esperar la actualización normal con timeout acotado y comprobar los campos
   en DOM visible/atributos/metadata según corresponda.
4. Verificar `title`, descripción y alternates/canonical donde se autoran; no
   confundir el texto serializado en scripts RSC con contenido público visible.
5. Comprobar que los otros tres idiomas y sus borradores no cambiaron. Tras las
   cuatro unidades, comparar EN/ES/PT/FR completos y reabrir sus editores.

Los textos son fixtures manuales de prueba; se valida el flujo funcional, no la
calidad lingüística de un proveedor. En un caso acotado por familia se comprueba
también el modo heredar/custom y su fallback, sin sobrescribir un target propio.
También se intercala un caso de borradores simultáneos por familia (una Page,
Post, Service y Guide): guardar por navegador cambios textuales EN y ES aún sin
publicar; registrar sus drafts/revisiones y sus publicaciones distintas; guardar
y publicar PT y probar que sólo PT cambió públicamente. EN/ES conservan sus
drafts/revisiones y públicos baseline, FR permanece intacto. Completar luego
EN/ES desde esos drafts con los controles normales del editor. No introducir
cambios compartidos de estructura/media para esta prueba de aislamiento textual.
La comparación no puede aprobarse si no había drafts pendientes. Se intercala
dentro de las cuatro unidades de la familia, sin duplicar la matriz entera.
FAQ se prueba en una Page con cuatro grupos distintos y un target vacío; ALT,
en las familias con imagen, se observa en `img.alt` tras Publish. Se comprueba
también el comportamiento histórico de FAQ/ALT con fixtures dedicadas que tengan
targets aprobados anteriores, sin convertirlos a un almacenamiento nuevo.

## Entorno de QA y conservación

El inventario local existente no sirve para escribir los nueve fixed Page keys:
varios ya contienen trabajo previo. No se hará snapshot/delete/restore de esas
Pages, ni se reutilizarán cuentas/sesiones existentes para fabricar autenticación.

El orquestador debe preparar y registrar una base **nueva de esta tarea**,
`translationsretirementqa` (o un nombre nuevo equivalente si ya existe), con rol
y hostname locales permitidos explícitamente. Aplicar el esquema existente en
esa base vacía es preparación de QA, no una nueva migración de producto. Antes
de cualquier DDL/fixture/build verificar host, `current_database()` y `current_user`.
Si no hay infraestructura local disponible, resolverla antes de esas operaciones.
No usar Neon remoto ni ejecutar DDL sobre `propertylocalesqa` como alternativa.

Cuenta Admin sintética propia creada por el flujo normal de Better Auth en esa
base y login normal desde el navegador. Secretos sólo en archivos ignorados con
permisos restrictivos; nunca en git, salidas de herramientas o reportes. No leer
tokens de sesiones ajenas ni construir cookies de autenticación manualmente.
No cambiar roles de cuentas actuales. Email desactivado, proveedor de traducción
sin llamadas reales y widgets de reservas sin envíos.

DB, servidor, `.next`, media y puerto de QA separados de main3071. Elegir puertos
libres en el preflight y registrar PID/cwd; preservar el localhost del usuario.
Preparar imágenes sintéticas locales y medios propios, sin uploads a R2 remoto
ni cambios de assets antiguos. Los bytes deben estar disponibles antes del build.

El manifiesto de fixtures reserva IDs/keys propios, todos los nueve slots Page
ausentes en la nueva base, referencias publicadas suficientes, cuatro grupos FAQ,
post/servicio/guía y sus auxiliares. Los baselines públicos se crean antes del
build; las ediciones verificadas se realizan después por navegador. Conservar
evidencia/fixtures en el entorno aislado para reproducibilidad, salvo limpieza
explícita sólo de identidades propias. No borrar bases/worktrees/caches al cerrar.
La matriz principal parte de publicaciones propias EN/ES/PT/FR en modo custom,
sin drafts, con valores diferenciados. El manifiesto registra por separado
published, draft y working; los casos de herencia usan fixtures/expectativas
dedicadas y no confunden la proyección de EN en working con una publicación.

## Equipo y gates

- Orquestador: spec, plan, decisiones, contratos compartidos, entorno, integración
  secuencial, revisión del resultado, comparaciones de conservación y entrega.
- Implementador A: cierre de acciones/generador y retirada interna del pipeline.
- Implementador B: redirecciones/compatibilidad y retirada de superficies de UI
  asignadas. Cada uno recibe una unidad pequeña y un write set explícito.
- QA independiente: revisión adversarial previa del plan, manifiesto/harness,
  E2E incremental, regresión final y reporte. No implementa correcciones de producto.

Gates: spec → plan → adversarial resuelto → contratos/entorno → lotes pequeños
integrados + QA por lote → cierre completo + E2E final → entrega local. No se
salta un gate para mantener ocupados a los agentes. Un hallazgo se asigna a su
dueño, se corrige y se revalida sólo en sus dependencias afectadas.

La batería final se ejecuta sobre el producto completo, ya retirado el traductor.
Los E2E incrementales no sustituyen esa petición final del usuario. Se conserva
el resultado de un grupo final aprobado mientras no cambie su código/dependencias,
fixtures o entorno. No se repite la matriz completa por cambios sólo documentales.

## Cierre

`pnpm typecheck`, `pnpm lint`, tests explícitos de acciones/resolutores y regresión
relevante, build con entorno de QA verificado, 48 unidades principales y cuatro
del sidebar aprobadas, checks de compatibilidad y conservación aprobados. Los
scripts `pnpm test` y `boundary:check` son placeholders y no sirven como prueba.

Ningún caso requerido sin ejecutar se etiqueta como aprobado. El reporte distingue
defecto de producto, problema de fixture/harness e infraestructura. Sólo el
orquestador integra el candidato aprobado en main local; no hay push/deploy.
Conservar el main3071 actual hasta que la entrega local esté lista; cualquier
cambio de runtime final se registra y termina con una apertura de lectura, sin
repetir guardados sobre el contenido del usuario.

Estado 2026-11-11: spec y plan aprobados documentalmente por QA independiente;
AD01–AD04 cerrados en el [adversarial](translations-retirement-adversarial.md).
Comienza preparación de entorno/contratos. La aprobación documental no afirma
que el producto ni los E2E ya estén implementados o aprobados.
