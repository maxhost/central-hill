# Editor común — Services, About, Guides y Blog

Spec y planificación solicitadas por el usuario después de validar la primera entrega.
Base documental13fdec8, ejecutable7e13d9f, checkout
/private/tmp/central-hill-page-editors-integration, rama page-editors/integration,
limpio al comenzar. Este encargo no inicia implementación, agentes, worktrees, DB ni preview.
Procedimiento: [plan](page-editor-editorial-pages-plan.md). Retomar: [handoff](page-editor-editorial-pages-handoff.md).

## Resultado propuesto y rutas confirmadas

Los cuatro editores restantes de Pages pasan al mismo PageContextualEditor, motor por
página/idioma y tabla page_locale_content de la entrega anterior. Al terminar son nueve
adaptadores explícitos; no nueve copias de React/actions/store.

| Key | Editor | Página pública | Fuera del contenido editorial Pages |
|---|---|---|---|
| services | /admin/pages/services | /{locale}/services | /admin/services, categorías y servicios individuales |
| about | /admin/pages/about | /{locale}/about | Settings, oficina, FAQ y formulario existente |
| guides | /admin/pages/guides | /{locale}/guides | /admin/guides, ciudades, guías, secciones, lugares y recomendaciones |
| blog | /admin/pages/blog | /{locale}/blog | /admin/posts, autores, categorías y artículos |

Confirmación Guides: src/app/[locale]/guides/page.tsx compone GuidesListing; ésta consume
getGuidesPage del contrato Pages. El editor de esa row es /admin/pages/guides. La URL
[referencia pública ES](https://central-hill-umber.vercel.app/es/guides) respondió HTTP200,
canonical /es/guides y H1 «Guías de ciudad, por quienes viven aquí» en esta lectura.
La comprobación remota confirma el listado; no prueba igualdad de commit entre Vercel y local.
Guías individuales usan /{locale}/guides/{city}/{slug} y su CMS /admin/guides.

Se conserva la interfaz validada: Sections/Element, SEO sólo en toolbar, EN/ES/PT/FR,
Desktop/Tablet/Mobile, selección desde preview, foco/caret y scroll. Exactamente Guardar
borrador y Publicar por key+locale, revisión persistente/CAS, target draft existente exacto,
preparación target sin draft desde último EN guardado manteniendo textos por identidad.
Live temporal300ms y Refresh local sin autosave/flush/writes/invalidación. Igualdad semántica
de snapshots mediante sameEditorialSnapshot, preservando orden de arrays; no reabrir QA-1.

No rediseño público, nuevas secciones, builder, cambios de límites/listas, búsqueda Blog,
selección Forms, nueva captura/envíos ni conversión de entidades individuales. Formularios
existentes (incluida newsletter Leads) se conservan, bloqueados en preview privada.

## Inventario confirmado en código

| Página | Campos y composición | Listas y medios |
|---|---|---|
| Services | seo, hero, intro, how_it_works, final_cta; catálogo publicado entre intro y pasos | how_it_works.items opcional, exactamente3 y fixed_order:true; 5refs máximas inclOG: hero/final mixtos y sus2posters imagen |
| About | seo, hero, story, stats, serve, values, organisation, certifications, community, faq, contact; oficina Settings | 8listas existentes; máximo29refs inclOG: hero1imagen, story/organisation/community3mixtos, audiences12imágenes, certifications12logos imagen |
| Guides | seo, hero vídeo/poster, city_filter, catalogue copy/icons, recommendations copy/icons, final_cta y guide_aside | Sin listas editoriales reordenables;4refs inclOG: vídeo, poster, aside imagen, OGimagen |
| Blog | seo, hero/search copy, featured heading, journal headings, newsletter y post_aside | Sin listas editoriales reordenables;1ref OGimagen. Newsletter compartida con artículos; aside no tiene imagen propia |

About mantiene story.narrative1–8, stats0–8, serve.audiences1–12, values.items1–12,
organisation.departments1–12, certifications.items1–12, community.copy1–8 y contact.cards1–12.
Reusar normalizeAbout/aboutIdentityErrors/retireAboutIds/aboutTranslationField, metadata
_list_ids/_retired_ids, destinos semánticos y fallback de foto por ID. No regenerar IDs
existentes ni «reparar» metadata malformada. Nueva contact.card inicia destination=buildings,
como el editor actual; moverla conserva destino. issuer no es [T]; logo_alt sí lo es.

Services no se convierte en lista libre de pasos: siempre tres, orden fijo, sin controles
add/remove/move. IDs para traducción deben mantener claves legacy numéricas equivalentes;
la ausencia de items conserva los tres fallbacks por posición, nunca oculta el bloque.

Guides enabled ausente significa true. No aplicar el default boolean=false del scaffolder
al baseline/editor. Con enabled=false se muestra sólo su toggle en inspector y Element;
los demás valores se conservan y reaparecen al reactivar. El colapso actual vive en NodeField
para el objeto completo; el editor común renderiza bindings hoja y necesita una política
serializable de visibilidad equivalente. No basta confiar en aquella condición antigua.
Catalogue.headline admite únicamente {city}; interpolación con nombre localizado y alias
por UUID de Geography. Publicar sin filtro conserva todos los grupos y recomendaciones
como en este encargo. Tarjetas, destinos y datos de catálogo siguen perteneciendo a Guides/Geography.

## Bootstrap: extensión real necesaria del motor

La tabla y CAS ya sirven; no se prevé DDL. Sin embargo legacyEditorialRows en este encargo valida el
schema completo, permite fallback especial sólo Buildings y superpone targets genéricamente.
Eso no reproduce todas las políticas de estas páginas. Antes de habilitarlas, raíz introduce
una seam servidor de snapshots legacy por adaptador, sin llamar getters públicos adaptados
ni crear ciclos getPublished→getPage→getPublished.

Equivalencia que debe probarse y conservarse:

- Services: row ausente/inválida conserva defaultServices={}, mensajes del locale, iconos
  Settings y visuales existentes; posters/OG son imagen, no vídeo. No guardar mensajes
  heredados como copy autorada sólo por abrir/guardar un campo distinto.
- About: resolución válida usa normalizeAbout+resolveAboutData y claves por IDs existentes.
  Renderer ausente/inválido conserva defaultAbout como en este encargo; el editor sigue bloqueando
  fuente corrupta antes de primer bootstrap, sin escribir una «reparación» silenciosa.
- Guides: guidesSourceContent rescata bloques válidos independientemente;
  guidesLocalizedContent valida targets por hoja y cae al source cuando {city}/otro valor
  traducido es inválido. La fuente existente inválida sigue bloqueada para edición inicial,
  aunque su salida pública de lectura conserve el salvage actual. Ausencia usa defaultGuides.
- Blog: blogSourceContent/blogLocalizedContent preservan aside y fallbacks. Sólo hojas EN
  no vacías autorizan traducciones legacy; una traducción vieja no revive un override EN
  vaciado. Ausencia/invalidez usa defaultBlog públicamente; fuente corrupta no se repara
  desde el editor. Esto no restringe futuros JSON ES propios una vez adoptado el motor.

Published bootstrap reproduce el baseline público real de cada locale. Targets no públicos
se conservan como draft de ese locale, con su valor pendiente (incluso si deberá corregirse
para guardar/publicar); no se publican automáticamente, no se alteran filas legacy ni drafts
JSON preexistentes. Campos opcionales vacíos siguen siendo overrides vacíos con fallback,
no mensajes EN materializados que eliminen el fallback del visitante.

Separar status/integridad de fuente legacy y fallback público: invalid source puede tener
salida de lectura, pero bloquea mutaciones de adopción. Con cuatro snapshots persistidos,
el JSON editorial es autoritativo y no se bloquea por consultar de nuevo una fuente legacy
que ya no gobierna la página. No relajar identidad About ni mezclar políticas de otras keys.

## Renderer único, catálogos y bloques que viven en fichas

ServicesListing, GuidesListing y BlogListing reciben PageResult opcional y preview por
contratos de su slice, como BuildingsListingRenderer. AboutPage recibe inyección interna.
Público omite props privadas. Cada listing conserva sus queries de catálogo publicado;
JSON Pages no congela tarjetas, filtros, featured posts, recomendaciones ni categorías.
No imports de internals entre slices ni otra copia JSX de los listados.

Guide_aside aparece en todas las fichas de guías, no en el listado. Post_aside aparece en
artículos; su botón puede estar reemplazado por el CTA propio del artículo. Newsletter se
usa tanto en listado Blog como en artículos. Todos esos campos deben poder verse en live:

- Una extensión opcional común sectionPreviews selecciona la superficie shared_aside al
  seleccionar guide_aside/post_aside y vuelve a page al seleccionar otra sección.
- /admin/preview/[key]?locale=…&surface=shared_aside muestra el mismo componente público
  extraído de la ficha, dentro de un contexto privado claramente rotulado «bloque compartido».
  No inventa su colocación al final del listado ni necesita seleccionar un artículo entero.
- La superficie se valida por key en ruta y acción live; sólo Guides/Blog admiten esa
  alternativa. El renderer recibe el mismo envelope local completo, nunca HTML ni overrides
  URL. Locale/Refresh/cola live/origen/instancia conservan sus guards y sin writes.
- La selección de sección puede cambiar URL/contexto; escribir dentro de ella mantiene
  URL, foco/caret y estado local. No otro shell/estado de formulario ni nueva toolbar de builder.
- Extraer componentes GuideSharedAside/BlogSharedAside de sus call sites actuales y usarlos
  tanto en fichas públicas como en preview. Conservar el CTA propio de post sobre el botón
  global, destinos Buildings/Owners y newsletter existente. Preview siempre bloquea submits.

La composición pública debe seguir idéntica; nuevas anotaciones sólo privadas sobre DOM
existente o wrappers exclusivamente privados. Ninguna modificación kernel prevista.

## Publicación y aceptación

Services/About invalidan page:<key>:<locale> y su página de ese locale. Guides/Blog invalidan
ese tag y el subárbol del locale (revalidatePath(path,"layout"), como su política legacy):
Guide aside y Blog aside/newsletter deben cambiar en fichas ya cacheadas sin rebuild.
No invalidar los otros idiomas ni publicar entidades; fichas deben consumir el getter
published con el nuevo tag. Save/preview no invalidan el público.

Al habilitar cada key aterrizan juntos adapter/editor, getter/SEO, bootstrap y guards legacy.
savePage y todas las mutaciones/review/inbox/generate de Translation bloquean sólo keys
adaptadas; servicios, guías y artículos individuales conservan sus workflows.

Aceptación: cuatro adaptadores en la UI común, identidad About preservada, fallbacks y
pendientes legacy equivalentes, city-filter collapse y {city} correctos, ambos shared asides
previsualizables, publicación de copy compartida efectiva en fichas, SEO/cuatro locales,
autenticación y preview guardada/live con foco estable. QA concreto y presupuesto en plan.
Entrega sólo local en nueva tarea después de autorización de implementación;3068 preservado.
