# Editor de la página Guides — auditoría, spec y plan

Fecha: 2026-10-18. Estado: implementación en curso; contratos y editor integrados, público y QA pendientes.
Decisiones de ciudades confirmadas por el usuario en esta sesión.

## Objetivo y alcance

Ampliar `/admin/pages/guides` siguiendo el patrón de `/admin/pages/home` y
`/admin/pages/services`, manteniendo el diseño de `/{locale}/guides`.
Permitir editar SEO, hero, medios, textos, labels e iconos de la página, y activar
un filtro real por ciudad. El CMS de cada guía y su árbol de secciones/lugares
será otra tarea; no se implementa en esta fase.

No se ocultan ciudades individualmente. Un único checkbox «Mostrar filtro por
ciudades» controla la barra y el comportamiento del índice:

- Activado: seleccionar una ciudad filtra sus guías y sus recomendaciones.
- Desactivado: no hay barra; se muestran los grupos de todas las ciudades y las
  recomendaciones globales, siguiendo la selección actual de hasta tres tipos.

La configuración no cambia Cities, Buildings, estados de publicación, rutas de
las guías individuales ni sitemap. No se crean ciudades automáticamente.

## Base y evidencia

Base Git: `38426f716fd3a584ba4b5c185f8bed1addbb5055`, rama local main.
Hay trabajo pendiente del sidebar, aprobado visualmente por el usuario, que debe
preservarse: cuatro mensajes; archivos de backoffice, Buildings, Services, Blog,
Testimonials y Geography; documento `buildings-sidebar-submenu.md`.
Antes de implementar se debe registrar el commit que capture ese trabajo o la
base final acordada, y los worktrees exactos. Esta spec no autoriza descartarlo.

Auditoría realizada por tres agentes de solo lectura: editor/datos, público e UX.
Referencia: https://central-hill-umber.vercel.app/es/guides y las cuatro capturas
del usuario. HTTP directo con curl: 200. HTML auditado: h1 «Guías de ciudad, por
quienes viven aquí»; h2 «Guías de Lisbon», «Nuestras Recomendaciones» y cierre
«Make It a Stay to Remember». No se ha hecho QA visual del nuevo editor porque
todavía no existe. Copia temporal del HTML: /private/tmp/central-hill-guides-live.html.

Hallazgos:

1. Ya existe la clave/fila `page_content.guides` y la ruta genérica del editor.
   Actualmente su esquema solo contiene `guide_aside`, CTA compartido de los
   detalles. Se amplía la misma fila; no se reemplaza ni se agrega una página.
2. El índice no consulta Pages. Usa mensajes `guides.*`, foto temporal Unsplash,
   tres chips estáticos y datos de Guides. Los chips actuales no hacen nada.
3. «Explore the City», el cierre y los metadatos aún tienen inglés literal.
   Ya hay mensajes `guides.citiesEyebrow`, `metaTitle` y `metaDescription` útiles.
4. Las guías se agrupan desde `guide_page` y ciudades publicadas. Las
   recomendaciones salen de `guide_place`, primera candidata válida por tipo
   restaurant/viewpoint/beach. No son contenido duplicable dentro de Pages.
5. `page:guides` y la revalidación por layout de los cuatro idiomas ya existen,
   incluyendo detalles que consumen el CTA lateral. Mantenerlos.
6. No se prevé migración, nueva dependencia ni cambio de kernel.

## Formulario: tarjetas y campos

Reutilizar PageEditor, media queue, campos derivados de Zod y layout por tarjetas.
Conservar el guardado inmediato y comunicar «Guardar publica los cambios».

| ID estable | Tarjeta | Campos |
| --- | --- | --- |
| seo | SEO y redes sociales | meta_title, meta_description; OG image existente fuera del JSON |
| hero | Hero | eyebrow, headline, body; video_media_id opcional y poster_media_id (foto de fondo y respaldo) |
| city_filter | Filtro por ciudades | enabled; label de barra, note, soon_label, location_icon_key |
| catalogue | Listado de guías | eyebrow, plantilla headline con `{city}`, view_label, empty_message; overrides de iconos por las nueve plantillas existentes |
| recommendations | Recomendaciones | eyebrow, headline, body, labels restaurant/viewpoint/beach; location_icon_key |
| final_cta | CTA final | eyebrow, headline, body, cta_label; destino fijo localizado `/buildings` |
| guide_aside | CTA dentro de las guías | objeto actual completo: image_media_id, eyebrow, title, body, cta_label |

No inventar botones en el hero ni imágenes/vídeos en secciones que hoy no los
muestran. El vídeo corresponde al hero; OG, poster y CTA lateral son imágenes.
El hero es decorativo: alt vacío en el fondo; el CTA lateral conserva alt del
asset traducido. No añadir un campo alt sin efecto. Si se ofrece un override
local del aside, debe cablearse y probarse sin cambiar el alt global de Media.

Los títulos/medios de tarjetas y nombres/direcciones/imágenes de lugares seguirán
viniendo de Guides. Nombres de ciudades desde Geography; no editar copias aquí.
Notas del editor distinguen contenido automático y CTA compartido. No enlazar
hacia un CMS de guías que aún no existe. Icono vacío hereda Settings/defaults.
Los overrides del índice no cambian iconos de los detalles.

## Contratos y compatibilidad

Ampliar `pages/schemas/guides.ts` con bloques opcionales. Mantener `guide_aside`,
sus campos, límites y paths `block:guide_aside.*`. Conservar `defaultGuides` tal
como representa la migración0016; añadir un default editorial separado si hace
falta. No editar migraciones históricas ni romper el test que las compara.

Añadir `GuidesPage = PageResult<GuidesContent>` y `getGuidesPage(locale)` al
contrato de Pages. Fila ausente usa el aside histórico y overrides editoriales
vacíos. Validar source antes de resolver medios. Bloques inválidos/targets
inválidos deben tener fallback por bloque/campo, sin borrar un aside válido por
un error ajeno del índice. Source inválido en el editor no se debe reemplazar y
sobrescribir silenciosamente: informar del problema antes de un guardado destructivo.

Añadir `buildGuidesMetadata(locale)` al contrato y usarlo desde la ruta. SEO vacío
hereda `guides.metaTitle/metaDescription` del idioma; OG vacío usa Settings según
el patrón Services. Canonical y hreflang absolutos, cuatro idiomas y x-default.

Textos vacíos conservan fallbacks del idioma visitante. Los literales ingleses
existentes entran en mensajes de los cuatro idiomas, con EN equivalente al actual;
ES/PT/FR se traducen en lugar de perpetuar ese fallo. No materializar defaults
ingleses en campos vacíos al guardar. Textos `[T]` se traducen por paths; booleanos,
UUID, iconos y medios son neutrales.

`catalogue.headline` acepta vacío o una plantilla con `{city}`; es el único token
permitido. Validar source; si un target aprobado es inválido, fallback seguro de
ese campo. Sustituir texto de forma segura, sin HTML ni eval.

**Checkbox y legacy:** el scaffolding genérico convierte booleanos ausentes en
false, ignorando defaults de Zod. Normalizar datos de Guides ANTES de applyDefaults
con un helper propio: `city_filter.enabled` ausente → true; false explícito se
conserva. Así abrir/guardar una fila antigua no desactiva el filtro. No cambiar el
scaffolding de las demás páginas para resolver este caso.

Contrato de integridad del editor: PageEditBundle/PageEditModel distingue
sourceStatus = absent | valid | invalid para Guides; otras páginas no cambian.
Si absent, guides-defaults inicializa SOLO el aside desde defaultGuides, para que
su title y cta_label obligatorios permitan el primer guardado. Si valid, conserva
íntegro el aside existente. Si invalid, no aplica una reparación silenciosa:
getPageEditModel transmite sourceInvalid=true; la ruta genérica lo pasa a
PageEditor, que muestra el error y bloquea Save. Prop opcional con default false
para los demás editores. savePage también rechaza fuente corrupta que el payload
pretenda sobrescribir sin reparación explícita fuera de esta tarea.

## Filtro público y recomendaciones

La barra debe ser funcional. Implementar una isla local de Guides reutilizando
ChipBar con onSelect (ya soportado) y aria-pressed; no modificar core/ui.
Selección inicial: primera ciudad con guías publicadas en el orden actual.
Cambiar ciudad actualiza conjuntamente guías y recomendaciones; sin navegación
completa ni queries request-time que conviertan la página ISR en dinámica.

Obtener ciudades mediante el contrato de Geography ya existente. Usar city.id
como identidad para selección y joins, nunca nombre ni slug traducido.
Ciudades publicadas sin guías se muestran «Próximamente», sin acción ni selección. El handler ignora expresamente keys próximas o ausentes
del conjunto disponible, también con teclado; aria-disabled solo no lo impide.
Conservar los placeholders actuales Porto/Cascais cuando no haya una ciudad real
correspondiente; no crear filas globales. El helper de presentación puede usar el
catálogo fuente EN, además del localizado, para identificar esos placeholders
heredados y evitar duplicados. La asociación a una ciudad real usa su UUID; los
keys reservados de placeholders son solo de presentación. Probar la equivalencia
con slugs localizados distintos. No usar comparaciones con nombres traducidos.

Si no hay ciudades disponibles, no seleccionar una próxima: mostrar empty_message
y ninguna recomendación. Si enabled=false, no renderizar chips ni filtros
ocultos que sigan actuando; mostrar todos los grupos y recomendaciones globales.
Si solo hay una ciudad disponible, su chip sigue operativo/seleccionado y los
placeholders próximos conservan su estado actual.

Ampliar el query de recomendaciones de forma compatible:
`listTopRecommendations(locale, limit = 3, scope?: { cityIds: readonly string[] })`.
Sin scope conserva el comportamiento global. Scope vacío devuelve []. Las dos
variantes tienen claves de caché diferentes (global frente a scope vacío). Filtrar
candidatos ANTES de elegir primera por tipo; cache key con UUID deduplicados y
ordenados, manteniendo `guide-list` y `city-list`. Para barra activa, preparar hasta
tres por cada ciudad disponible; para barra desactivada, preparar las globales.
No filtrar globalmente listGuideCityGroups/listGuideParams ni tocar detail/sitemap.

La isla recibe contenido ya resuelto/seguro, sin lecturas directas a DB, evitando
cargar todos los árboles de secciones/lugares de cada guía. Mantener cards y links
en HTML SSR accesible para crawlers; la selección controla paneles con hidden y
estado accesible. Evitar duplicación de IDs entre paneles y headings vacíos.

## Medios y guardado

Extender guardas de savePage para key=guides: UUID, existencia y MIME antes de
escribir. Hero acepta fotos JPEG/PNG/WebP/AVIF y vídeo MP4/WebM. Imagen animada WebP
puede seguir el patrón existente; no hace falta habilitar Lottie para este hero.
Usar optionalVideo/accept=video para video_media_id y optionalImage/accept=image
para poster_media_id: no usar optionalAnimated/accept=animated, que ofrecería
Lottie fuera de alcance. Sin vídeo, poster_media_id es la foto de fondo; con vídeo
es su poster y still de reduced motion. Foto vacía usa el fallback actual.
OG, poster y aside solo imagen. Archivo inválido, upload fallido o referencia
inexistente → error sin falso éxito. Mantener isPreparing/flush/busy de PageEditor.

Reutilizar dentro de Pages la lógica ya existente de vídeo/poster/reduced motion
por extracción local o wrapper; Guides consume únicamente exports del contrato.
Vídeo mute, inline, sin audio automático; con reduced motion mostrar imagen
estática y no descargar/reproducir vídeo. Fallback a foto vigente sin asset propio.

Guardar mantiene `page:guides`, rutas layout EN/PT/ES/FR y dependencias guide-list,
city-list y Settings. Nunca invalidar solo el índice si cambia guide_aside.

## Plan de ejecución con agentes

Primero capturar la base y cambios del sidebar; registrar branch/worktree real,
HEAD y estado de cada escritor antes de delegar. No copiar .env.local remoto.
Los paths siguientes son asignaciones propuestas, no worktrees ya creados.

**Orquestador: contratos primero y archivos compartidos**

- Pages: schemas/guides.ts, contract.ts, server/queries.ts, server/metadata.ts,
  admin/actions.ts, admin/queries.ts; nuevo admin/guides-defaults.ts.
- Guides: contract.ts, server/queries.ts; nuevo helper puro de scope de
  recomendaciones `guides/server/recommendation-scope.ts` y su test
  `guides/tests/recommendation-scope.test.ts`.
- src/app/[locale]/guides/page.tsx;
  src/app/(admin)/admin/(panel)/pages/[key]/page.tsx (pasar sourceInvalid);
  pages/admin/ui/page-editor.tsx (mensaje de integridad y bloqueo);
  messages/{en,pt,es,fr}.json.
- READMEs Pages/Guides, docs/data-model.md, esta spec, QA/handoff y AGENTS.md.
- Define getters, shape, defaults, scope y exports de secciones antes de consumidores.
- No kernel ni Geography writes previstos. Cualquier expansión se registra antes.

**Implementador A: editor**

- pages/admin/layout.ts, pages/admin/ui/schema-fields.tsx (solo ayudas de Guides).
- Nuevo pages/admin/guides-media-validation.ts.
- Nuevos pages/tests/guides-editor.test.ts y guides-media-validation.test.ts;
  pages/tests/pages-admin.test.ts y pages.test.ts para regresiones existentes.
- Tarjetas, labels contextuales, guardado legado; entrega en branch propio.

**Implementador B: público**

- guides/ui/guides-listing.tsx.
- Nuevos guides/ui/components/guides-city-filter.tsx,
  guides/ui/listing-presentation.ts y guides/tests/listing-presentation.test.ts.
- Nuevos pages/ui/components/guides-sections.tsx, guides-media.tsx y, si necesita
  isla propia, guides-loop-media.tsx; nuevo pages/tests/guides-content.test.ts.
- No importar internos de Pages desde Guides ni modificar el CMS de detalles.
- Consumir contratos y exports acordados; entrega en branch propio.

Solo el orquestador integra. Un QA independiente revisa el candidato integrado;
implementadores corrigen dentro de su scope y QA repite casos afectados. Ningún
agente cambia archivos compartidos asignados al orquestador. Sin push ni deploy.
La autorización y frontera de commits/integración se confirmarán al lanzar la
implementación. La ejecución ahora autorizada y su frontera local se registran abajo.

## Aceptación y verificación de implementación futura

1. Guides en Pages abre el editor ampliado con las siete tarjetas; los demás
   editores y la navegación recientemente aprobada conservan su comportamiento.
2. Fila antigua solo con aside y fila ausente: formulario válido; guardar sin
   cambios no borra aside ni desactiva filtro; texto vacío conserva fallbacks.
3. enabled=false oculta barra y muestra todos los grupos; recarga persiste false.
   true restaura barra y selección conjunta; no cambia datos ni URLs de Cities.
4. Con al menos dos ciudades disponibles, cada chip filtra ambos bloques. Probar
   lugares válidos alternativos por tipo: no filtrar solo ganadores globales.
5. Próximamente no recibe selección; nuevos publicados aparecen sin duplicados
   de placeholders. Sin guías/recomendaciones, empty state correcto sin enlaces muertos.
6. Textos/labels/iconos/SEO/media guardados afectan su superficie en cuatro idiomas.
   `{city}` válido, traducción inválida y copia demasiado larga se manejan por campo.
7. Subida real de imagen y vídeo, poster/OG/aside; guardar/recargar; MIME/UUID
   inválidos, fallo de upload, staff y acceso denegado. Solo fixtures aisladas.
8. Canonical/hreflang/OG correctos; guardado refresca índice y CTA de detalles sin
   reiniciar servidor ni borrar caches manualmente. Publicación de guía/ciudad
   mantiene sus dependencias ISR; no se destruye el listado de static params.
9. Desktop/móvil, teclado, foco, aria-pressed/hidden, textos largos, sin overflow;
   reduced motion muestra still. No se atribuye a QA lo que no se probó.

Checks al implementar según workflow: Node22/pnpm, typecheck, lint, build, pruebas
reales por archivos explícitos de Pages/Guides afectados y SEO; db:check si se
introduce migración (no prevista). pnpm test y boundary:check son placeholders.
El usuario dispensó pruebas automatizadas en los ajustes pequeños del sidebar;
no se han ejecutado checks de implementación en esta fase documental. La
estrategia de verificación del editor se deja visible para acordarla al lanzarlo.

Entorno local disponible: preview en worktree service-detail-integration,
127.0.0.1:3059; DB ficticia servicedetailqa vía proxy4458/Postgres5558 y bucket
S3rver9058. Identificar de nuevo el entorno y crear fixtures de Guides antes de
QA: localhost por sí solo no prueba aislamiento. No usar .env.local de la raíz.

## Fuera de alcance

CRUD de guías individuales/secciones/lugares; selección manual de recomendaciones;
crear o despublicar ciudades; reordenar layout público; page builder; URLs libres
para CTAs internos; traducción automática nueva; migraciones remotas o despliegue.

Revisión cruzada final: editor/datos y público revisaron esta spec; correcciones
de integridad, fila ausente, accept de medios, aliases de placeholders, handler
de próximos y caché global/vacío incorporadas. Sin implementación ni QA aprobada.

## Ejecución autorizada — 2026-10-18

Usuario: «vamos con la implementacion si estamos listos». Sidebar y planificación
capturados en main local `00c836a` antes de iniciar. Orquestador escribe en
`/private/tmp/central-hill-guides-integration`, branch `guides-page/integration`.
Worktrees previstos A `/private/tmp/central-hill-guides-editor`, branch
`guides-page/editor`; B `/private/tmp/central-hill-guides-public`, branch
`guides-page/public`. Registrar commit contractual al delegar.

Ampliaciones concretas del scope raíz: nuevo `pages/server/guides-content.ts`
(salvamento por bloque source y fallback target por campo) y
`pages/tests/guides-defaults.test.ts`; helper scope/test con paths ya acordados.
`pages/admin/guides-media-validation.ts` se mueve a propiedad del orquestador,
porque savePage debe poder importarlo en la base contractual; A lo revisa y
escribe su test sin modificar ese archivo. El contrato exporta secciones
GuidesHero/GuidesFinalCta con props `{page:GuidesPage, locale:Locale}`; sus stubs
transitorios en la base son reemplazados exclusivamente por B antes de QA.

Todos los paths de asignación usan prefijo `src/slices/` salvo app/messages/docs.
A conserva propiedad exclusiva layout.ts, schema-fields.tsx y sus 4tests.
B conserva listado/filtro/helper de presentación, secciones/medios y sus tests.
Root es único escritor de contratos/queries/actions/page-editor/messages/docs.
QA independiente prepara fixtures bajo `/private/tmp/central-hill-guides-qa`;
DB nueva `guidespageqa`, proxy4458/Postgres5558, bucket dedicado9060 y app3060.
El preview del usuario3059 y su DB servicedetailqa se mantienen intactos.

Entrega autorizada: commits locales e integración de candidato aprobado en main
local, sin push/deploy ni writes remotos, siguiendo el flujo que venimos usando.
Pendientes: implementación A/B, integración, checks y QA browser/save-reload.

Contrato aterrizado en `3a5ccd9`; typecheck exit0 y cuatro tests contractuales
(defaults/salvamento/targets/scope cache) exit0 antes de delegar. A y B creados desde
ese commit en los worktrees/branches arriba indicados. Root reserva además los
helpers/test roots declarados en esta sección de ejecución. Directorios y branch
reales se verifican por cada agente antes de editar. Stubs públicos solo en base
intermedia, nunca se consideran implementación lista.

Dependencias integración: pnpm install --offline falló por tarball ausente en el
store actual; se copiaron dependencias ya instaladas del worktree QA anterior
(solo node_modules, sin env/credentials). Sin cambios en package/lockfile.

Implementador A entregó `fddd2d6`, integrado como `3baca4a`: cuatro paths del
write set; typecheck/lint0,146tests0 y detectorUI[]. Rootlint de contratos0.
QAinfra confirmó DB y rol guidespageqa independientes,21migrations0..20,5JPEG,
vídeo de prueba y fixtures Lisbon+Porto con guías/recomendaciones localizadas,
Cascais publicada sin guías y Coimbra draft. Auth de prueba se verificará por
formulario, no se asume desde el hash. Ninguna credencial remota copiada.
