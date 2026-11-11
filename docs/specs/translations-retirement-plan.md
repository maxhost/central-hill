# Plan para retirar Translations

Cierre: producto `b30a18c` aprobado por QA independiente:52/52ciclos y Q6.
Ver [informe](translations-retirement-qa.md). Este inventario conserva el estado
previo a la retirada; sus consultas/bandeja se describen en pasado.

Ampliación del pedido 2026-11-11: el [spec de producto](translations-retirement-spec.md)
y el [plan por lotes](translations-retirement-execution-plan.md) concretan equipo
A/B + QA/orquestador, revisión adversarial previa y E2E incrementales/finales de
las nueve Pages, un Blog post, servicio y guía en EN/ES/PT/FR. Este inventario se
conserva como evidencia de la auditoría; el plan por lotes gobierna la ejecución.

2026-11-11. Auditoría de código sobre main `f947c4f` y consultas de lectura en
`propertylocalesqa` local, DB/rol verificados. El usuario confirma que FAQ conserva
grupos independientes por idioma. Esta entrega documenta el plan; no retira la
sección ni modifica contenido, esquema, permisos o publicaciones.

Translations puede retirarse como interfaz y flujo genérico. Los campos públicos
activos tienen edición en su contexto. La excepción de autoría es `city.intro`:
su traducción no tiene controles propios, pero tampoco tiene un renderizador
público actual y no justifica crear otro editor. Se conservan sus valores.

## Qué sigue dentro de la bandeja

La consulta actual excluye Pages adaptadas, Blog, Properties, Guides, Testimonials,
Settings y navegación fija. La función real `buildInbox`, aplicada a las filas
locales con esas exclusiones, produce 31 entidades de seis tipos:

| Tipo | Entidades locales | Campos presentes | Dónde se editan ahora | Resolución |
| --- | ---: | --- | --- | --- |
| `service` | 2 | `name`, `excerpt`, `body`, `duration_label`, `price_suffix`, `cta_label`, `meta_title`, `meta_description`, `detail`, `copy:itineraryTitle`, `copy:whatsappCta` | `/admin/services/[id]`, EN/ES/PT/FR, borrador y publicación por idioma | Retirar la vía genérica duplicada. |
| `service_category` | 1 | `name` | `/admin/service-categories/[id]`, cuatro inputs | Retirar la vía duplicada. |
| `amenity` | 2 | `label` | `/admin/amenities/[id]`, cuatro inputs | Retirar la vía duplicada. |
| `city` | 3 | `name`, `intro` | `/admin/cities/[id]`: cuatro nombres, ALT por idioma y una introducción fuente | Nombre/ALT cubiertos. Conservar `intro` histórico sin añadir traducción a la ficha. |
| `neighbourhood` | 5 | `name` | Dentro de `/admin/cities/[cityId]`, cuatro nombres en cada barrio | Resolver su ciudad al redirigir. |
| `faq_item` | 18 | `question`, `answer` | `/admin/faq/[groupId]`; cada idioma de Page elige su grupo propio | Retirar traducción genérica manteniendo grupos, contenido y selección. |

Los contadores derivados son 210 celdas: 186 missing, 5 stale, 0 needs review y
19 approved. Son estados de la tabla histórica, no una medida de cobertura de los
editores actuales ni una lista de contenido que deba generarse antes del cierre.
No hay entidades huérfanas entre estos seis tipos en esta base.

Estos números describen únicamente el entorno local. No se ha inventariado la
base remota para esta revisión. Antes de una entrega remota, revisar por lectura
si existen tipos/campos adicionales que necesiten una decisión explícita.

## Cobertura fuera de esa bandeja

| Contenido | Superficie vigente y comportamiento |
| --- | --- |
| Home, Owners, Buildings listing, Real Estate, Guests, Services listing, About, Guides listing y Blog listing/sidebar | Pages, nueve claves adaptadas, snapshots propios por idioma y Save draft/Publish. Incluyen su copy, SEO y estadísticas públicas. |
| Blog posts | `/admin/posts/[id]`, contenido completo por idioma, SEO, imágenes y cuerpo. |
| Building, Apartment y sus FAQ | Editor Building y Apartment anidado; publicaciones por idioma. Las FAQ de Building pertenecen a ese editor y son distintas de FAQ general. |
| Guides, sections y places | `/admin/guides/[id]`, árbol completo por idioma. |
| Authors y Blog categories | Fichas propias: nombre/bio del autor y nombre de categoría en cuatro idiomas. |
| Testimonials | Ficha propia con Quote EN/ES/PT/FR; los demás atributos siguen compartidos. |
| Settings | Website, Hours Label, Book Now Label/URL y Earn With Us Label tienen controles por idioma. Contactos y horario numérico siguen compartidos. Los antiguos stats y bloques retirados no necesitan otra interfaz. |
| Navegación | Textos EN/ES/PT/FR, orden y enlaces fijos en código; `nav_item` histórico ya está excluido y sus reviews redirigen a Settings. |
| ALT de imágenes | Controles junto a cada imagen: `media_alts`/`mediaAlts` por documento e idioma; campos propios existentes de Pages/Blog reutilizados. Author, City y Settings usan cuatro inputs por dueño+imagen. Se conserva el fallback a ALT histórico y luego al texto correspondiente. |
| Forms | `/admin/forms/[id]` ya tiene edición y guardado EN/ES/PT/FR. Aunque no hay formularios locales, `form_definition` **no está excluido** de la bandeja/acciones genéricas y podría aparecer al crearlo. Incluirlo en el cierre completo. Su colocación pública sigue siendo un trabajo separado. |

Que no haya filas locales de Settings, Forms o `media_asset.alt` no significa que
esas funciones no existan: se han revisado sus formularios, escritores y lectores.
No se ha creado contenido para demostrar su presencia.

## Decisiones sobre las opciones especiales

**FAQ: grupos independientes, confirmado por el usuario.** El selector de Page
por idioma elige referencias; no traduce preguntas. El editor del grupo carga y
guarda una versión de cada pregunta/respuesta mediante la fuente técnica `en`.
Puede contener los textos del idioma al que se destina ese grupo. Así funciona
el modelo actual de grupos separados, sin tabs ni etiqueta de idioma nuevos.
No se puede afirmar que haya cuatro versiones editables dentro de un mismo grupo.
No se necesita esa función para el modelo elegido.

El lector público de FAQ sigue resolviendo traducciones aprobadas históricas.
Se mantiene ese comportamiento para no cambiar publicaciones existentes. Si un
grupo conserva targets históricos, pueden seguir apareciendo al seleccionarlo en
ese idioma; retirar Translations no los borra ni los sustituye automáticamente.
Una futura edición de esos targets dentro del grupo sería otra decisión, no un
requisito del modelo confirmado. Localmente hay seis grupos y ninguna traducción
target de FAQ; About EN/PT selecciona sus grupos separados y ES/FR no elige FAQ.

**City intro: conservar como dato histórico.** Geography lo entrega en su DTO,
pero los consumidores públicos actuales no lo muestran. La introducción visible
de una guía es `guide_page.intro`, ya editable en Guides. Mantener la introducción
fuente que existe en City y sus filas históricas; no construir otro editor para
cerrar esta sección.

**ALT: política ya resuelta por ADR0076.** El texto pertenece al contenido que usa
la imagen. Los ALT globales históricos permanecen como fallback de lectura;
los controles nuevos no escriben el asset compartido ni alteran otros documentos.
No se necesita una biblioteca global de medios ni un backfill.

## Implementación propuesta

1. Retirar `translationAdminScreens` de la composición del panel. Eliminar la
   bandeja y sus controles de revisión/Generate/Approve/Reset/Clear de la UI.
   La ruta autenticada `/admin/translations`, incluidos sus filtros antiguos,
   redirigirá a `/admin/pages`.
2. Conservar compatibilidad de enlaces `/admin/translations/[type]/[id]` mediante
   redirecciones autenticadas a los editores propietarios. Mantener los destinos
   existentes para Pages, Blog, Properties, Guides, Testimonials y Settings;
   añadir Services, categorías de servicio, Amenities, City, barrio→City,
   FAQ item→grupo y Forms. Resolver identidades y padres mediante contratos de
   las slices, validar IDs y usar un destino estable cuando falte la entidad.
   Para `media_asset`, sin dueño único, usar `/admin/pages`, sin elegir
   arbitrariamente uno de sus consumidores. Tipos desconocidos tampoco deben
   reconstruir una pantalla genérica. Conservar la selección de idioma donde el
   editor la admita; no basta con añadir `?locale=` si el destino no lo consume.
3. Cerrar los seis entrypoints antiguos: `saveField`, `clearField`, `approveField`,
   `resetField`, `approveEntity`, `generateEntityDrafts`, y la exportación directa
   `generateDrafts`. La retirada debe negar **todos** los tipos, incluidos Forms
   y desconocidos; ampliar una lista de exclusiones deja abierta la misma vía.
   Si se mantienen stubs por compatibilidad, exigir autenticación y devolver una
   denegación antes de leer/escribir contenido o llamar al proveedor. No iniciar
   generación automática desde los editores como sustitución.
4. Retirar enlaces y notas que mandan al usuario al flujo antiguo. Hay referencias
   en `pages/admin/ui/page-editor.tsx`, hoy fuera de la ruta de las nueve Pages
   adaptadas. Limpiar mensajes/tests/docs que describen la sección como activa;
   revisar `TranslationFieldRow` y el grupo visual de navegación antes de retirar
   exports compartidos. No eliminar tipos de rol ni modificar permisos como parte
   de esta tarea.
5. Mantener `core/i18n`, sus APIs de lectura/escritura y `hashSource`, las tablas
   `translation`/`slug`, snapshots editoriales, fallbacks y valores históricos.
   Taxonomías, FAQ, Settings, Forms y bootstraps siguen usando esas piezas.
   La retirada no requiere migración, cambios de contenido ni republicaciones.

## Verificación de la futura implementación

- Comprobar ausencia del menú/enlaces y redirecciones de los tipos anteriores,
  incluidos padres faltantes, IDs inválidos y acceso sin sesión.
- Verificar que las seis acciones y el generador directo no realizan escrituras
  ni llamadas al proveedor, también para un tipo desconocido y `form_definition`.
- Hacer una pasada acotada de los editores propietarios y lectura pública
  EN/ES/PT/FR: Publications, FAQ elegida por idioma, nombres auxiliares,
  Settings y ALT. Guardado/recarga sólo con fixtures nuevas en entorno aislado;
  no sustituir, borrar o restaurar contenido existente para fabricar pruebas.
- Comparar hashes/conteos del contenido protegido y filas históricas antes y
  después. Cualquier fixture se limita a sus identidades propias. No convertir
  estados missing/stale antiguos en aprobaciones o traducciones automáticas.
- Typecheck, lint, pruebas relevantes y build en el candidato aislado; QA
  independiente y entrega local según el procedimiento del repositorio.

## Evidencia y límites de esta revisión

Fuentes principales: `translation/admin/{queries,derive,actions}.ts`,
`translation/admin/ui/review.tsx`, `translation/server/generate.ts`, registros
editoriales de Pages y políticas de Blog/Properties/Guides, formulario y
bootstrap de Services, fichas auxiliares, `faq/admin/{queries,actions}.ts`,
`faq/server/queries.ts`, Geography/Guides, Forms y ADR0068/ADR0076.

Inventario de tipos/campos, referencias FAQ y bandeja reconstruida con la función
real en `/private/tmp/central-hill-translations-retirement-review/`:
`inventory.json`, `details.json`, `inbox.json`. Las lecturas SQL no modificaron
contenido ni traducciones. La comprobación visual autenticada quedó pendiente:
la revisión automática rechazó obtener un token de sesión de la base y firmar una
cookie. No se ejecutó ese método ni se intentó eludir el rechazo.

No se ejecutaron tests/build ni se reinició localhost para esta revisión. El
servidor local 3071 permanece activo. No hay cambios de código, contenido,
esquema, roles, base remota, push o despliegue.
