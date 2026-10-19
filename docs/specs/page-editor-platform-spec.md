# Editor común de Pages — spec de conversión

2026-10-18. **Sólo spec/plan en este turno. No implementar ni lanzar agentes.**
Usuario aceptó Home y su live preview, acordó convertir la capa en editor común y pidió
estos documentos antes de hacer clear. Implementación se inicia en contexto nuevo con su
siguiente encargo. Base documental/producto8de459a; ejecutable Home8da3519, QA f8d7c91.
Checkout actual /private/tmp/central-hill-page-drafts-integration, page-drafts/integration,
status limpio al comenzar. Ejecución: [plan](page-editor-platform-plan.md).
Retomar: [handoff](page-editor-platform-handoff.md).

## Resultado y alcance cerrado

Un motor editorial, una interfaz contextual y adaptadores explícitos para:

| Key | Editor | Página pública |
|---|---|---|
| home | /admin/pages/home | /{locale} |
| owners | /admin/pages/owners | /{locale}/owners |
| buildings | /admin/pages/buildings | /{locale}/buildings |
| real_estate | /admin/pages/real_estate | /{locale}/real-estate |
| guest | /admin/pages/guest | /{locale}/guests |

Home permanece funcional y se convierte en el primer consumidor del motor extraído.
Owners es el segundo adaptador y prueba la estructura anidada antes de los tres restantes.
Las URLs editoriales solicitadas conservan sus paths; la key guest no cambia a guests.

Buildings significa contenido editorial del LISTADO, no /admin/buildings ni fichas de
edificios/apartamentos. La cuadrícula lee el catálogo publicado por su contrato, sin editarlo
ni congelarlo dentro del JSON de Pages. About, Blog, Guides, Services y todos los editores
individuales de entidades quedan fuera; sus workflows actuales se conservan.

Esta conversión conserva los formularios actuales de Owners, Buildings y Real Estate,
su copy editable y sus límites existentes. **No crea selector Forms, releases, captura
pública nueva ni integración Leads/Resend.** La propuesta anterior de Owners que incluía
Forms público queda aplazada como arco distinto; no bloquea convertir este editor. No
presentar la conversión como arreglo de envíos que hoy no capturan datos. ContactDialog,
Settings, FAQ, Testimonials y catálogos mantienen su propietario y comportamiento.

## Conducta común que se conserva

- Misma interfaz validada: Sections, Element, inspector, Desktop/Tablet/Mobile, selección
  desde preview, SEO exclusivamente en toolbar por idioma, EN/ES/PT/FR.
- Exactamente Guardar borrador y Publicar como acciones editoriales. Ambas afectan sólo
  la página y el idioma seleccionados; ninguna aprobación/revisión/stale de traducciones.
- JSON completo draft/published y revisión persistente por (page_key,locale), CAS y borrado
  sólo del JSON draft propio al publicar. Publicar Owners EN no modifica Owners ES ni Home EN.
- Guardar borrador permite campos incompletos según schema draft, conserva tipos/límites/
  IDs/MIME y espera flush de medios. No invalida web pública. Publicar valida schema completo
  y referencias guardadas; commit antes de invalidar sólo tag/ruta del idioma correcto.
- Publicar deshabilitado sin draft guardado o con cambios locales en ese idioma. Trabajo
  local de otros idiomas no se descarta ni bloquea innecesariamente esa publicación.
- Preview en vivo temporal de los cambios locales: debounce300ms, una petición en vuelo y
  último snapshot pendiente, respuestas antiguas descartadas, mismo renderer público con
  PageResult inyectado. Sin autosave, escritura de contenido, upload ni invalidación pública.
- Refresh Preview reenvía estado local sin recargar iframe. Foco/caret del formulario,
  scroll y selección sobreviven a renders. Reload del editor recupera sólo draft guardado
  o published; los blobs/cambios locales no se vuelven persistentes por previsualizarlos.
- Payload inválido conserva última salida válida con mensaje localizado. Autenticación
  staff y guard de origen/ventana/instancia/revisión/tamaño vigentes. Sin HTML arbitrario,
  URLs remotas suministradas como overrides ni manipulación de textos DOM para simular render.
- SEO title/description editables en cada idioma aunque EN esté vacío; OG compartida desde
  EN. Canonical/hreflang, destinos/anclas y fallbacks actuales se conservan. Formularios y
  enlaces no navegan ni envían desde la preview privada, incluida apertura directa.

## Qué extraer realmente

Ya reutilizable: PageEditorShell, bridge/cola live, controles, cola diferida de medios,
tabla page_locale_content y formato V1 de envelope. Aún Home-specific: tipos content,
key literal, SQL, bootstrap, rutas de publicación, validadores, metadata de listas y React
HomeContextualEditor. No habilitar cuatro keys dejando cualquiera de esas capas fija en Home.

1. **Motor Pages común.** Lectura/bootstrap, revisión/CAS, preparación de idioma, draft,
   publicación, media resolver, preview guardada/live y política legacy reciben key tipada.
2. **Editor contextual común.** Un componente maneja envelopes/idiomas/locales/medios,
   selección/dirty/conflictos y acciones. La página aporta configuración serializable;
   no crear cuatro copias del estado React o handlers de guardado de Home.
3. **Adaptador por página.** Contiene schema draft/publicación, normalización/identidades,
   paths traducibles, secciones/bindings, referencias/MIME y render con PageResult inyectado.
   Registry explícito habilita sólo los cinco adaptadores anteriores.

## Contratos propuestos para estabilizar antes de consumidores

Tipos por key: EditorialPageKey y PageContentMap; PageEnvelope<K> conserva
{schemaVersion:1,content:PageContentMap[K],ogImageMediaId}. No any ni parser Home para todos.
El JSON existente Home y su metadata no se reescriben por cambiar tipos TypeScript.

PageEditorialAdapter<K> define, mediante tipos separados de runtime servidor/descriptor UI:
- key, publicPath, schemaVersion, draftSchema, publishSchema, defaultContent;
- normalize, validateIdentities(previous), retireIds, translatable field key mapping;
- list definitions con scope de padre estable, límites y políticas actuales;
- collectMediaReferences con tipo admitido por slot y límite de refs local por página;
- loadLegacyPublished(locale) y loadLegacyPending(locale) sin invocar getter público nuevo;
- render({locale,page:PageResult<...>,preview:true}) del MISMO árbol público;
- descriptor UI serializable: title/section IDs, grupos, notas externas, bindings y rootNode.

APIs comunes mantienen su forma y se generalizan por key:
getPageEditorialModel, savePageDraft, publishPageDraft, getPageDraftPreview,
getPublishedPageLocale y renderPageLivePreview. Home wrappers compatibles pueden delegar;
no mantener otra implementación Home de CAS/publicación como excepción permanente.
El registro servidor no llega al cliente; el modelo transporta el descriptor sin queries,
credenciales ni callbacks servidor arbitrarios. Imports entre slices sólo por contract.ts.

page_locale_content ya tiene unique(page_key,locale), JSONB y revisión. No se prevé otra
tabla/columna ni migración SQL; ampliar tipos del JSON no requiere migración. Si el audit
encuentra necesidad DDL, raíz debe justificarla, actualizar plan/ADR y reservar siguiente
número real antes de ejecutarla, sólo en DB nueva aislada. No cambios kernel previstos.

## Identidades y bootstrap compatibles

Inicializar published con lo que cada renderer público muestra actualmente en sus cuatro
idiomas, usando su pipeline legacy exacto; no traducir de nuevo ni publicar pendientes.
Capturar traducciones legacy no públicas como draft sólo de su idioma; dejar filas legacy
originales intactas. Inicialización por página idempotente sin sobrescribir drafts existentes;
lecturas públicas nunca crean filas. Mantener fallback read-only hasta baseline disponible.
Buildings conserva defaultBuildings y sus fallbacks localizados cuando no hay row válida;
no convertir ese caso actual en404. Para las otras páginas se conserva el comportamiento
actual de ausencia/invalidación, sin inventar páginas nuevas.

Toda lista con mover/add/remove debe conservar textos, medios y defaults por identidad,
incluidas listas de strings. Bootstrap asigna IDs legacy por posición original; las nuevas
filas usan UUID. Paths de traducción legacy numéricos se siguen resolviendo al capturar;
identidades nuevas usan @UUID. Retirar IDs por lista y padre; no reutilizarlos.

En listas anidadas, hijos se identifican por ID del padre, nunca por su índice actual.
Ejemplo: plans.tiers.@<tierId>.features; mover un plan mantiene sus IDs de features y textos.
La representación concreta se fija en el contrato de raíz antes de delegar Owners.
Home mantiene su representación actual y se verifica al extraer helpers.

Targets sin draft se preparan desde EN guardado más reciente, preservando textos por IDs.
Targets con draft se mantienen exactos, aunque EN cambie. Estructura/medios se editan en EN;
las hojas traducibles respetan las marcas [T] existentes (no inferirlas por nombre del campo).
Campos ocultos/URLs ignoradas por renderer conservan su valor; no aparecen nuevos destinos.

## Inventario por adaptador

| Página | Secciones / variantes que conservar | Identidades / caso distintivo |
|---|---|---|
| Home | Composición actual completa, Avantio sólo placeholder privado | Sus tres listas e IDs actuales; regresión foco/live |
| Owners | hero/contact, earnings_form, stats, why, services, plans, journey, dashboard, testimonials, FAQ, final_cta | stats0–8; benefits6/4/4; tiers1–4 y features1–20 por tier; helpers1; journey5; fotos fallback asociadas al step original |
| Buildings | hero/contact, catálogo externo readonly, owner_panel, stats, calculator y SEO | stats.figures0–8 con label+description; defaultBuildings; formulario y #estimate; no editar grid/catálogos |
| Real Estate | hero, partners, capabilities, asset_management, deal_structures, market, track_record, process, FAQ, deal_enquiry | benefits4/3/6; models3 y points3–10 por modelo; market.stats3, fundamentals.body2, thesis.points3–8; tiles3–6; steps3–8; PDF capability statement |
| Guest | hero, welcome, why, portfolio, services_teaser, activities_teaser, testimonials, FAQ, dual_cta | benefits4; items6 en cada teaser con fotos fallback por identidad; portfolio/reviews/FAQ externos; URLs fijas y copy ContactDialog |

Counts/límites arriba son los schemas actuales, no permiso para nuevas secciones o cambiar
cardinalidades. Los detalles se confirman contra schemas/layout/renderers al ejecutar.
Todas las hojas actuales deben seguir accesibles, aunque estén ocultas/no renderizadas en
una variante; SEO fuera de Sections/Element. Listas anidadas se editan con controles comunes,
sin convertir Home o las páginas en un builder de bloques/reordenar secciones.

Medios: Owners Hero/Journey/final/OG imagen, Services/Dashboard mixto; Buildings hero/OG
imagen, calculator mixto; Guest hero vídeo+poster, welcome mixto, teasers/OG imagen;
Real Estate hero/OG imagen, showcases mixtos y hero.capability_statement_media_id PDF.
El límite Home de6refs/locales no se copia a páginas con más slots. Calcular límite acotado
por schema/adaptador y conservar techo total de payload razonado; no límites ilimitados.
PDF se valida y muestra como adjunto de su CTA, sin convertirlo en imagen ni navegar la preview.

## Renderer, rutas y política legacy

OwnersPage/RealEstatePage/GuestPage reciben PageResult opcional y preview bindings, como
Home. Público omite esos props. Sin duplicar su JSX. Buildings necesita una seam en su
propio slice: BuildingsListingRenderer vía Buildings contract acepta el contenido editorial
inyectado y preview; grid sigue usando listBuildings interno de ese slice. Pages no importa
internals de Buildings ni copia BuildingListingCard. Evitar ciclos con carga del renderer
sólo al renderizar preview. Raíz controla y documenta esta seam fuera de Pages.

Ruta privada común /admin/preview/[key] con helper compartido; la ruta Home puede ser wrapper
compatible. No JS/atributos editoriales en rutas públicas nuevas. El live renderer elige
adaptador validado y conserva header/footer/localización, auth/noindex/no-cache y bloqueos.

Al habilitar un adaptador: editor, lector publicado, SEO y guards cambian juntos. savePage
legacy rechaza esa key; Translation inbox/review redirige y todas sus mutaciones/generator
rechazan sólo entidades de páginas adaptadas. No basta ocultar botones ni hardcodear sólo
Home. Tags page:<key>:<locale> y ruta pública desde registry (guest→guests,
real_estate→real-estate, Home sin segmento); no invalidar todas las páginas/idiomas.

## Aceptación y entrega

Las cinco páginas usan el editor común y cumplen el comportamiento anterior; Home no
regresa. Bootstrap equivalente, IDs anidados y separación página/idioma probados. Cada nueva
página tiene cobertura de campos y su caso distintivo, flujo real draft/reload/publicación/
público/SEO y un pase desktop/mobile acotado. El motor se prueba una vez; no multiplicar
la batería por cuatro. Plan fija presupuesto y comandos, QA independiente consume logs.
Entregar commits/archivos incluidos nuevos, QA, URL local y handoff. Sólo rama local de tarea;
sin main/push/despliegue/GitHub/producción. Formularios conservados, Forms público pendiente.
