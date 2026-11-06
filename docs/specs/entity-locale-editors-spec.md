# Contenidos del CMS — edición y publicación por idioma

2026-11-05. **Piloto Blog aceptado y autorizado para implementación local.**
Base auditada: `2aa031d`, rama `main`, checkout
`/Users/maxi/Documents/claude-workspace/central-hill`.
Usuario autorizó implementación y pruebas en DB local sintética; las fases
posteriores no están iniciadas. Savepoint documental `48ae09c`. Plan del piloto: [Blog](blog-post-locale-editors-plan.md).

## Objetivo y secuencia

Gestionar cada contenido y sus idiomas en su propio editor, con el mismo modelo
mental que Pages: pestañas EN / ES / PT / FR, **Guardar borrador** y **Publicar**
para el idioma seleccionado. El usuario confirma traducción **manual**; la
automatización queda para una fase posterior.

Orden solicitado:

1. Artículos individuales de Blog: piloto de persistencia, publicación e interfaz.
2. Edificios y apartamentos: idioma propio y enlaces de reserva localizados.
3. Servicios individuales: contenido, presentación y acciones localizadas.
4. Guías individuales: guía completa, secciones y lugares.
5. Cobertura de entidades auxiliares y retirada de la sección Translations.

Las fases 2–5 son una hoja de ruta. Cada fase necesita su inventario, spec de
ejecución y aceptación antes de implementarse. La fase 1 tiene el alcance cerrado
propuesto más abajo; no incluye convertir otros tipos de contenido.

## Evidencia actual y consecuencias

| Área | Situación en el código auditado | Consecuencia |
|---|---|---|
| Pages | Nueve adaptadores con JSON draft/published y revisión por idioma; excluidos de la bandeja genérica | Reutilizar sus reglas e interfaz, conservando el comportamiento actual |
| Blog Posts | `PostForm` edita EN; `savePost` escribe campos fuente, relaciones y slugs, y revalida inmediatamente | Añadir tabs no basta: Guardar debe dejar de cambiar la versión pública |
| Cuerpo de Blog | JSON de bloques completo en `translation`, sin IDs persistentes por bloque | Editar un documento completo por idioma; evitar fusiones por posición |
| Estado y medios | `blog_post.status`, portada, autor, categoría y relacionados son globales | Congelar sus referencias en la publicación de cada idioma |
| Slugs de Blog | El guardado actual vuelve a escribir el mismo slug en los cuatro idiomas | Conservar slugs existentes; impedir que un guardado borre slugs localizados |
| Reservas | `building.avantio_url` y `apartment.avantio_url` son columnas únicas | Resolver un destino por idioma en todos sus consumidores |
| Guías | Árbol `guide_page → guide_section → guide_place`; guardados granulares con posibilidad de persistencia parcial | Publicar un agregado consistente por idioma, con identidades estables |
| Translations | Sigue gestionando artículos, catálogos, guías y entidades auxiliares | Retirada progresiva, ligada a cobertura funcional |
| Traducción automática | `getTranslateProvider()` devuelve `identity`: copia la fuente | No presentar generación automática como traducción disponible |

Fuentes: `src/slices/{blog,buildings,apartments,services,guides}/schema.ts`,
`src/slices/blog/admin/{actions,queries,validation}.ts`,
`src/slices/blog/admin/ui/{post-form,body-editor}.tsx`,
`src/slices/blog/server/{queries,publish}.ts`,
`src/slices/pages/editorial-registry.ts`,
`src/slices/translation/{admin/queries,admin/actions,server/generate}.ts` y
`src/core/i18n/translate.ts`. Auditoría de código, sin consulta de contenido real.

## Contrato común de producto

### Un contenido, cuatro espacios de trabajo

- Cambiar de idioma conserva los cambios locales de los demás idiomas durante
  la sesión. No guarda ni publica. No exige publicar EN antes de traducir.
- Cada pestaña distingue: sin publicación, publicado, borrador guardado y cambios
  locales sin guardar. Un idioma puede estar publicado y tener un nuevo borrador.
- Guardar borrador persiste sólo el idioma seleccionado. Recargar recupera lo
  guardado; un cambio local aún sin guardar no se recupera tras recarga.
- Publicar valida y publica el borrador ya guardado del idioma seleccionado.
  Está deshabilitado si no existe borrador o hay cambios locales pendientes en
  ese idioma. El estado pendiente de otro idioma no lo bloquea.
- Publicar no elimina ni sobrescribe borradores ni trabajo local de otros idiomas.
- No hay aprobar/revisar/stale en los contenidos adaptados. Tampoco autosave,
  publicación de todos los idiomas, historial ni traducción automática en el piloto.
- Un fallo conserva el formulario y sus cambios. Conflictos de revisión se
  explican; recargar requiere advertir del trabajo que se perdería.
- Salir del contenido avisa si cualquier idioma iniciado tiene cambios locales.
  Cancelar/Escape mantiene el trabajo; continuar descarta sólo lo no guardado.
  Un borrador guardado puede quedar sin publicar. `beforeunload` cubre recarga/cierre
  hasta donde lo permite el navegador; no se promete recuperación automática.

### Publicación y compatibilidad

- El público consume exclusivamente la versión publicada de su idioma; nunca el
  draft ni un valor sin guardar. Las lecturas públicas no inicializan datos.
- Para contenido nuevo, un idioma sin publicación no aparece en su listado,
  detalle, relacionados, sitemap ni hreflang. No publicar EN implícitamente en ES.
- Para contenido existente, capturar como baseline lo que ya se ve en cada
  idioma, incluyendo sus fallbacks legacy. Así no desaparecen URLs ni textos al
  activar el nuevo flujo. La UI identifica que existe una publicación; no afirma
  que el texto heredado esté traducido.
- Tras el baseline no hay fallback dinámico de un idioma adaptado al nuevo EN.
  Publicar EN no cambia el contenido publicado ES/PT/FR.
- Las traducciones legacy no aprobadas se preservan como borrador, separadas de
  la versión pública. Las filas originales se conservan.
- Distinguir ausencia de fila —compatibilidad legacy de sólo lectura— de una fila
  con `published=null` —sin publicación—. Esta última nunca reactiva el fallback.
- Las dependencias externas siguen perteneciendo a sus dueños: editar el nombre
  de un autor o una categoría no se convierte en edición del artículo. La
  independencia por idioma cubre el documento propio, no congela todo el CMS.

### Interfaz y preview

Modo de uso: operación editorial por el mismo personal que utiliza Pages. Se
mantienen los componentes y el lenguaje visual del backoffice. Sin rediseño público.

- Cabecera persistente: identidad del contenido, pestañas de idioma, estado y las
  dos acciones editoriales. Indicar el idioma de destino junto a las acciones.
- Estado visible con texto, sin depender sólo del color; tabs accesibles por
  teclado y foco estable al escribir, guardar y cambiar de idioma.
- Reutilizar las piezas públicas del editor de Pages desde Backoffice cuando
  encajen. No convertir un artículo en una fila `page_content`.
- Preview privada del artículo real mediante su renderer público, con el estado
  local del idioma seleccionado y Refresh. Debounce y protección de respuestas
  fuera de orden según la plataforma actual; sin guardado ni invalidación pública.
- Preview sin indexación ni JSON-LD de borrador; formularios y acciones externas
  inertes. Medios locales sólo en memoria hasta el guardado explícito.
- Si un bloque está incompleto, preview informa de ello y representa lo que sea
  válido sin presentar silenciosamente una versión anterior como actual. Los
  errores de preview no borran el draft ni obligan a publicar para ver cambios.
- En móvil, controles accesibles y alternancia clara entre edición y preview,
  siguiendo el shell existente. Los errores aparecen junto al campo y permiten
  localizar también un bloque largo del cuerpo.
- Secciones del piloto: datos del artículo, cabecera/portada, cuerpo, botón propio
  y relacionados; SEO mediante su acceso dedicado. La identidad EN/idioma del
  contenido no debe confundirse con el idioma de interfaz del backoffice.

## Piloto Blog: alcance cerrado propuesto

Rutas editoriales conservadas: `/admin/posts`, `/admin/posts/new`,
`/admin/posts/[id]`. Pages → Blog sigue editando el listado y el CTA lateral
compartido; este piloto edita los artículos reales.

### Campos y propiedad

| Grupo | Campos | Autoría y publicación |
|---|---|---|
| Texto | `title`, `excerpt`, `body`, `meta_title`, `meta_description` | Editables y publicados por idioma |
| Botón propio | `cta_label`, `cta_url` | Ambos localizados; pareja completa o ambos vacíos |
| Lectura | `reading_minutes` | Editable por idioma y nullable; conservar ausencia legacy, la longitud puede variar al traducir |
| Referencias/medios | `category_id`, `author_id`, portada, OG, `related_ids` | Autoría EN, snapshot por idioma |
| Exposición editorial | `is_featured`, fecha editorial `published_at` | Autoría EN, snapshot por idioma; sin programación automática |
| Identidad | UUID del post y slugs existentes | Estables; no son traducciones de texto |
| Ciclo de vida | Archivado/eliminación del artículo | Global, secundario y explícito; no depende del tab activo |

La fecha editorial mostrada en el artículo es diferente del timestamp técnico de
publicación de su snapshot. Una fecha futura no programa una publicación.

EN sigue siendo la autoría de referencias compartidas. Preparar un target sin
draft desde el último EN guardado —draft si existe, si no publicado— conservando
su texto y cuerpo target existentes. Las referencias compartidas quedan visibles
como heredadas de EN; si esta preparación cambia su documento publicado, marcar
cambios pendientes. Un draft target ya existente se abre tal cual. Publicar EN no
sincroniza ni reordena automáticamente otros drafts o publicaciones.

El cuerpo es un documento completo por idioma: mismos tipos de bloque de
`body.ts`, con texto, pies/alt y CTA internos localizados. Puede tener distinto
número/orden de bloques; no se alinea ni mezcla por índice con EN. Las imágenes
del cuerpo pertenecen a ese documento y pueden seleccionarse por idioma. No
introducir IDs de bloque ni una herramienta de sincronización estructural en el
piloto. Mantener foco y claves de edición estables durante operaciones locales.

Al abrir un idioma sin contenido propio se puede preparar una copia local del
último EN guardado, identificada como punto de partida para traducir. No se
persiste ni publica al abrir la pestaña. Ninguna operación de otro idioma puede
volver a copiar EN sobre un draft existente.

### Slugs: límite deliberado del piloto

Los enlaces de reserva localizados son un requisito de la fase de inmuebles;
no requieren cambiar las URLs públicas de los artículos.

En Blog se conservan los slugs de cada idioma existentes. Para artículos nuevos,
el primer guardado EN reserva un slug base con el mecanismo existente en los
cuatro idiomas; sigue sin hacer público el contenido. Después se muestra la URL
de cada idioma en sólo lectura. No se vuelven a escribir los cuatro slugs al
guardar o publicar. Cambiar slugs de un artículo ya creado y añadir redirecciones
queda fuera del piloto; no normalizar slugs legacy diferentes a un único valor.
Esta restricción es una propuesta de alcance para revisión, no una limitación
actual atribuida al producto.

### Crear, guardar y publicar

1. Crear abre EN. El primer Guardar borrador EN crea identidad y reserva el slug;
   no requiere cuerpo terminado, portada ni publicar. Sí un slug válido y las
   referencias mínimas de categoría/autor exigidas por la identidad actual.
2. Con identidad guardada se habilita el trabajo persistente ES/PT/FR. Puede
   traducirse y publicarse ES antes que EN. No hay dependencia de EN publicado.
3. Guardar valida tipos, límites, referencias no vacías y el documento acotado;
   admite texto requerido incompleto y bloques en construcción, hasta192KiB UTF8
   por envelope. Preview completo acotado a256KiB por el bridge existente. No guardar JSON
   arbitrario. Vacíos de medios pendientes sólo como ausencia explícita válida.
4. La cola de medios finaliza los uploads necesarios antes de persistir. Guardar
   un idioma no sube medios pendientes que sólo pertenecen a otro idioma.
5. Publicar exige título, excerpt, cuerpo válido no vacío y portada resuelta;
   valida autor/categoría, medios, CTA y referencias con las reglas existentes.
   SEO opcional conserva fallbacks actuales. Relacionados: hasta tres, sin propio
   ID ni duplicados; mostrar sólo los publicados en el idioma del visitante.
6. Publicar mueve draft a published y limpia sólo ese draft con revisión atómica.
   El botón de publicar no llama al antiguo guardado live.

No usar el actual selector `status=published` como segunda acción editorial.
La lista de posts resume el estado por idioma. Archivar conserva documentos y
oculta globalmente el artículo; eliminar mantiene una confirmación explícita.
No añadir retirada por idioma ni restauración de publicaciones en este piloto.

### Compatibilidad del botón y contenido compartido

El botón propio del post reemplaza sólo el botón del CTA lateral compartido,
igual que hoy. Al vaciar ambos campos vuelve el botón compartido localizado.
No se duplican su título, descripción ni la newsletter dentro del post.
CTA y URLs de bloques se validan conforme a su uso, preservando enlaces legacy
admitidos; destinos externos nuevos HTTP(S), sin protocolos ejecutables. No
reescribir links arbitrarios del cuerpo automáticamente al cambiar de idioma.

### Persistencia y contratos propuestos

Una tabla **propiedad de Blog**, `blog_post_locale_content`, con clave única
`(post_id, locale)`, FK al post y borrado acorde con su ciclo de vida:

- `draft`, `published`: JSONB nullable, envelope versionado y validado;
- `revision`: entero monotónico por idioma, permanece al limpiar draft;
- timestamps de guardado/publicación y actor staff textual;
- snapshot de campos propios, referencias y medios; sin bytes ni URLs resueltas.

La tabla `blog_post` conserva identidad y archivado. Las columnas/relaciones
legacy quedan para compatibilidad; no se convierten en una segunda fuente de
los campos ya adaptados. Para documentos nuevos la exposición pública se decide
por snapshot, no por el antiguo estado global `draft/published`; `archived`
continúa siendo un cierre global. Adaptar también consultas que actualmente
filtran sólo `blog_post.status='published'` o hacen joins con sus referencias viejas.

Save y Publish usan compare-and-swap de revisión. Publicación en una operación
atómica; el driver actual es Neon HTTP: no asumir disponible `db.transaction()`.
La creación/reserva de identidad debe ser idempotente y recuperable si falla un
paso; una identidad o slug reservado sin snapshot nunca habilita una URL pública.
Las acciones y preview verifican autorización en servidor. El piloto conserva
los permisos actuales de edición de posts; no concede permisos nuevos a un rol
por mostrarle pestañas ni por redirigirlo desde Translations. Si se necesita
migrar el trabajo de un rol exclusivamente traductor, se debe cerrar su acceso
explícitamente antes de retirar su vía anterior; no ampliar permisos globales
como efecto lateral de esta adaptación.

Inicialización staff idempotente de los cuatro baselines existentes antes de la
primera mutación. Preservar versiones públicas y targets pendientes; conflicto o
payload legacy inválido bloquea su reemplazo y pide resolución, sin convertir
silenciosamente un cuerpo inválido en vacío. Registrar/revisar el tratamiento de
campos opcionales vacíos y slugs ausentes antes de codificar el importador.

La implementación documentará una ADR específica: ADR0040 se limita a Pages.
No convertir Pages en almacén polimórfico ni extraer ahora un motor genérico de
persistencia para todos los slices. Reutilizar contratos UI de Backoffice y el
patrón editorial; Blog conserva sus modelos, validación y consultas.

### Activación y Translations

Al activar Blog Posts en el nuevo flujo:

- La bandeja excluye `blog_post`; revisión directa redirige al post y conserva
  el locale solicitado cuando sea válido.
- Todas las acciones de editar/aprobar/resetear/borrar/generar legacy para
  `blog_post` se rechazan antes de escribir. El guardado EN live anterior también
  queda cerrado. No se borran filas originales.
- Los demás tipos siguen funcionando. La protección se resuelve mediante el
  contrato de Blog; Translation no consulta tablas ajenas directamente.
- Scripts fuente, seeds y backfills de Blog no pueden quedar como otra vía
  soportada de publicación. Inventariarlos y bloquear o declarar retirados sus
  caminos de escritura para contenido adaptado.
- Desplegar el nuevo lector, el editor y los bloqueos forma una activación
  coherente. No habilitar una vía de escritura legacy durante un bootstrap.

### Público, SEO e ISR

Conservar las firmas públicas de Blog cuando sea posible. Listado, destacado,
detalle, relacionados y consumidores externos obtienen el mismo snapshot
publicado por idioma. Autores/categorías y medios se resuelven por sus contratos.

Canonical, hreflang, `BlogPosting`, breadcrumbs, sitemap y parámetros estáticos
usan sólo idiomas con publicación efectiva y sus slugs reales. Revalidar los tags
que usan las consultas y los consumidores, incluidas dependencias del sitemap;
guardar draft o visitar preview no invalida público. Es aceptable invalidar un
tag compartido de todos los idiomas si las lecturas siguen aisladas: invalidación
de caché y publicación de contenido son operaciones distintas.

## Fase 2: edificios y apartamentos

Mantener el workspace de apartamentos dentro de su edificio; no crear otro menú.
Idiomas y publicación siguen el contrato común. Antes de implementar, cerrar la
separación entre datos operativos compartidos —capacidad, ubicación, IDs Avantio,
asociación al edificio— y snapshots editoriales. No hacer que traducir cambie
inventario o recalcule contadores multiplicados por número de idiomas.

En cada idioma se edita el destino de reserva (`booking_url` en el modelo
editorial propuesto), aunque los nombres legacy sean `avantio_url`:

- Baseline conserva la URL actual en los cuatro idiomas; no inventar destinos.
- Un nuevo override vacío hereda la URL de reserva base de la entidad. La UI lo
  explica; vaciar no significa desactivar reservas. Una desactivación necesitará
  un control explícito y su spec, no se deduce de una traducción vacía.
- Resolver el fallback al publicar y guardar el destino efectivo en el snapshot;
  una modificación futura de EN no cambia por sí sola el enlace ES publicado.
- En ausencia de URL de entidad conservar el fallback de cada superficie actual
  —enlace interno, `#book` o booking general—, usando el idioma solicitado.
- Cubrir tarjetas de edificios, listados/teasers, detalle, tarjetas de
  apartamentos y banda de reserva; no sólo el input del backoffice.
- Mantener `booking_enabled` y la semántica actual de destinos internos/externos.
  El código auditado incluye `avantioBookingUrl("en")` en detalle de edificio:
  inventariar y resolver ese uso explícito del inglés dentro de esta fase.
- Dirección e ID Avantio no son traducciones. No modificar la integración del
  motor de búsqueda Home/Avantio para implementar estos enlaces.

FAQs de edificio entran en el agregado de ese edificio por idioma con IDs estables.
Amenities siguen siendo taxonomía referenciada; sus labels necesitan cobertura
propia antes de retirar Translations. La publicación/visibilidad de un apartamento
y su edificio padre debe cerrarse en la spec de esta fase, incluyendo contadores.

## Fase 3: servicios individuales

Aplicar idiomas a textos, SEO, duración textual, CTA label/URL y copy de todos los
módulos existentes. Conservar `booking_type` enquiry/external/none, formularios y
presentación condicional; sin nuevos envíos de correo ni cambio de proveedor.
Precio, rating, categoría e IDs de medios tienen autoría compartida definida en
su spec. La publicación del servicio actualiza también sus tarjetas/carouseles.
Las categorías de servicios requieren editor propio o una fase auxiliar.

## Fase 4: guías, secciones y lugares

Propuesta de unidad editorial: **una guía completa por idioma**, incluyendo el
árbol de secciones/lugares con IDs estables, orden, visibilidad, módulos y enlaces.
Editar una sección o lugar usa el idioma activo de la guía; Guardar/Publicar
indica que afecta la guía completa de ese idioma. Evitar docenas de unidades
independientes con publicación parcial de un árbol incoherente.

Localizar copy, SEO, CTA de secciones y links website/booking de lugares cuando
corresponda; distinguir horarios descriptivos/categorías visibles de teléfono,
coordenadas e identidad de ciudad. Slugs compuestos ciudad/guía, recomendaciones,
mosaico, índice y contadores deben leer el mismo árbol publicado por idioma.
No seguir haciendo mutaciones live de hijos mientras su padre usa snapshots.
La autoría de estructura/medios y su preparación entre idiomas se cerrará con
fixtures de cambios/reordenación/borrado antes de empezar esta fase.

## Retirada final de Translations

Las cuatro fases principales no garantizan cobertura total. Inventariar los
`entity_type` reales mediante lectura autorizada cuando llegue el cierre. Como
mínimo revisar autores y categorías Blog, categorías Services, amenities,
geografía/ciudades, metadatos de medios y otras FAQs o taxonomías registradas.
No afirmar que todas estén presentes en la DB a partir de este análisis de código.

Asignar cada tipo a un editor localizado o mantener una herramienta auxiliar
accesible. Sólo entonces retirar navegación/rutas de la sección global, con
redirecciones desde enlaces antiguos y sin borrar datos legacy como efecto lateral.
No cambiar el kernel i18n completo ni las traducciones de interfaz por terminar
el piloto de artículos.

## Aceptación y límites de esta entrega documental

El plan de Blog define escenarios funcionales, responsables y pruebas. Una vez
autorizada la implementación, se verifica guardar/reabrir, publicar un idioma,
aislar los demás, preview, compatibilidad, enlaces y SEO en entorno sintético
aislado. Las revisiones puramente estéticas siguen L0 y las valida el usuario.

La entrega documental inicial añadió sólo spec y plan; después se autorizó
el piloto y la DB sintética. El plan registra su implementación y verificaciones.
No hay push/despliegue ni escritura Neon remoto; se conserva el logo no rastreado.
Localhost3071 conserva su entorno actual conectado a Neon remoto: no es una DB
de pruebas. No usarlo para guardar/publicar fixtures.
