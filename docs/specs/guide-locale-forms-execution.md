# Guías — formulario agregado e idiomas

2026-11-06. Implementación autorizada por el usuario desde main `97fa285`.
Entrega main local + único frontend3071, sin push/deploy/escrituras remotas.
Preservar logo y public/propertylocalesqa (únicos untracked iniciales), todos los
worktrees, envs ignorados, archivos y datos anteriores. No retirar Translations
global ni iniciar auxiliares/Apartment lifecycle. Sí cerrar su vía antigua para
los tres tipos de Guías, como en Blog/Properties, mediante contratos existentes.

## Inventario y decisiones ejecutables

El CMS actual guarda EN live de forma granular y secuencial: guía, sección y
lugar requieren padres ya guardados. Se conserva el formulario y sus módulos,
pero una guía completa será la unidad de Guardar borrador/Publicar por idioma.
Añadir/editar/quitar/reordenar secciones y lugares será local desde New, antes de
todo guardado y upload. Ningún botón hijo persistirá independientemente.

| Nivel | Localizado en envelope por idioma | Compartido vivo al Guardar |
|---|---|---|
| Guía | title, intro, meta_title, meta_description, árbol y orden propios | city_id, template, position, hero_media_id, og_image_media_id |
| Sección | title, body, local_tip, cta_label, cta_url, orden y pertenencia de lugares | header_media_id, layout legacy, presentation (enabled/modules) por id |
| Lugar | name, description, category visible, opening_hours, website_url, booking_url | media_id, address, phone, price_tier, latitude, longitude por id |
| Identidad | referencias de padres coherentes con su árbol localizado | UUID raíz/nodos; slugs existentes estables; ciudad resuelta vía contrato Geography |

Los iconos de plantilla/globales y el aside compartido conservan sus dueños; no
se duplican por guía. La categoría visible de lugar podrá traducirse sin perder
la clasificación neutral de recomendaciones (restaurant/viewpoint/beach). Guardar
EN deriva recommendation_type del category EN; otros idiomas no lo cambian. No
nuevo campo técnico visible. Categorías no reconocidas siguen fuera de Top Picks.

EN inicia New. ES/PT/FR sin personalizar siguen el último EN guardado, nunca su
trabajo local sin guardar. Primer cambio real localizado (incluida estructura)
hace propio el idioma; EN posterior no sobrescribe su texto/SEO/enlaces/árbol,
borrador ni publicación. Cambiar tab o sólo datos comunes no toma propiedad.
Publicar consume sólo el draft guardado elegido; cambios visibles o EN heredado
más reciente requieren Guardar antes. Publicación de otros idiomas siempre
explícita. Mantener trabajo local de otros idiomas tras cualquier acción.

Imágenes son únicas compartidas (raíz/sección/lugar). Save común actualiza su
uso público en todos los idiomas ya publicados, sin publicar sus textos. Mismo
modelo actual Services/Buildings; controles comunes claramente identificados.
Mapas por UUID, nunca mezcla por índices. Árboles personalizados pueden divergir;
claves históricas guardadas permanecen, claves nuevas sin referencia en NINGÚN
idioma se podan para no bloquear Save por un upload descartado. Enviar documento
común COMPLETO incluso al guardar EN tras elegir foto de nodo sólo presente PT.
Cada idioma conserva su orden y textos al cambiar fotos/orden EN.

New permite Añadir sección y Añadir lugar de inmediato. Sección nueva de este
flujo inicia enabled=true en borrador local (no live); Publish valida sus módulos.
El helper legacy newSection puede conservar su default histórico para clientes
retirados; el nuevo editor configura explícitamente su draft. Ocultar módulos
preserva contenido. Secciones: título visible, explicación de lo que se puede
añadir, botón inequívoco, vacío instructivo, resumen de lugares/fotos y expansión
automática/foco de nuevas filas. Conservar campos y controles por módulo, no canvas.

Cabecera igual a Services/Buildings aprobados: vuelta al catálogo; h1 + estado;
Ver en la web arriba derecha, _blank/noopener noreferrer, idioma publicado actual;
barra sticky max-w-3xl con Archive/Restore izquierda y Save draft/Publish derecha,
tabs abajo/estado EN·Published a la derecha. Sin Cancel, duplicado Status, pie de
acciones ni select status=published. Guías tenía Archive, no Delete raíz: conservar
esa capacidad; Remove sección/lugar cambia el árbol del draft, no borra filas live.
Archive/Restore global conserva drafts/pubs; Save archivado retiene archivo;
Publish elegido puede reactivar, como Services. Navegación protegida en todos los
idiomas (links/back/close), excepto enlace público en pestaña nueva.

## Persistencia / compatibilidad

ADR0066 + migración aditiva0028: guide_locale_content y guide_shared_content,
misma estructura CAS/revisiones/text actor/version1 que Services. Tablas inicialmente
vacías; GET proyecta baseline legacy sin writes. Primera mutación bootstrappea
cuatro idiomas conservando contenido público por idioma y pending sólo privado.
Targets authored conservadoramente custom. No fallback a draft EN en web. Sin
publicación propia de nuevo idioma: no listado/detalle/relacionados/recomendación/
sitemap/hreflang. Snapshot incluye TODOS los hijos; no publicar árbol parcial.

Guardado de shared + draft + registro neutral de nodos en un db.batch/graph lock
con CAS de selected revision, ENtemplate revision cuando inherit, shared revision.
Rechazar conflictos sin sobrescribir otros trabajos. IDs globales de nodo se
registran también en tablas guide_section/guide_place existentes, insertando sólo
nuevas identidades bajo el mismo lock; revisar propiedad dentro del commit para
evitar anexar IDs de otra guía. No borrar filas/hijos/traducciones al adaptar o
quitar nodo de un idioma. Árbol y orden autoritativos de adaptados son snapshots;
filas legacy conservan propiedad/compatibilidad. shared.places.section_id conserva
el primer padre de registro, no cambia el árbol localizado ni se superpone a él.
Root neutral columns pueden reflejar datos comunes para agrupación/guards.

Validación estricta/versionada con límites (máximo64secciones/256lugares por guía,
payload512KiB; mapas históricos1024entradas; UUID únicos/ownership/padres correctos).
Draft admite texto incompleto, Publish exige título/slugs/ciudad publicada y al
menos una sección visible completa con algún módulo; límites/couples/phone/coords/
MIME y referencias siguiendo reglas actuales. No promover columnas retiradas
cta_label como fallback si el lector actual usa sólo traducciones. Raw presentation
desconocida bloquea mutación; aviso de integridad legible. URLs legacy permitidas
por renderer conservadas; nuevas validadas según uso, sin protocolos ejecutables.

Viejas acciones live/reorder/delete deben rechazar raíces adaptadas antes de
escribir. Public readers usan las publicaciones de idioma y shared overlay en
TODAS las superficies: listado, detalle, mosaic/TOC/counts, related, recommendations,
Pages/Home teaser, parámetros estáticos, metadata y sitemap. Ciudad publicada y
slugs localizados mediante contrato Geography; nunca importar tablas extranjeras.
Revalidate guide-list + sitemap en sharedSave/Publish/visibility; draft textual no
cambia público aunque invalide cache compartida. No correo/envíos externos.

## Contratos y propietarios

Root define primero editorial-types.ts / locale-content.ts y schema/migration/
snapshot/journal/ADR0066. GuideEnvelope{schemaVersion:1,localeMode,content}; content
es GuidePageEdit sin id/slug/slugs/status. Shared{root keys,sections[id],places[id]},
clasificación neutral de recommendations. Modelo entero contiene cuatro modelos
locale (working/draft/published/revision/templateRevision), shared(revision/content),
slugs por idioma, status, cities/previews. Save{guideId,locale,expectedRevision,
templateRevision,expectedSharedRevision,payload,shared,slug?}; Publish raíz/locale/rev.
Result{ok:true,model} o typed errors/fieldErrors. Mutaciones retornan modelo completo;
cliente conserva todos los idiomas no guardados y common pendiente al visibilizar.

Worktree integración `/private/tmp/central-hill-guide-locales-integration`, rama
guide-locales/integration. Root: este plan, docs/ADR/index/data-model/AGENTS,
editorial-types.ts, locale-content.ts, schema/migración, contract.ts, messages4locales,
composición app/admin/guides/{new,[id]} y app/[locale]/guides/[city]/[slug] si precisa,
Translation admin/{queries,actions}.ts, admin/ui/review.tsx, server/generate.ts y README.
Contratos Guide isGuideEditorialEntity / getGuideEditorialRedirect vía contract.

Backend: guide-locales/backend en /private/tmp/central-hill-guide-locales-backend.
Own guides/server/**, admin/{actions,queries}.ts, admin/locale-actions.ts nuevo,
README.md, tests/guide-locale-model.test.ts y guide-locales.integration.test.ts.
Funciones acordadas server/locale-model.ts getGuideEditorialModel(id) staff-gated;
admin/locale-actions.ts saveGuideLocaleDraft(raw), publishGuideLocaleDraft(raw),
setGuideVisibility(raw). getGuideEditorialRedirect(type,id,locale?) en policy server.
No tipos/helpers/schema/messages/UI/core ni nested agents sin expansión root.

UI: guide-locales/ui en /private/tmp/central-hill-guide-locales-ui. Own guides/admin/ui/**
(incluida nueva locale-form-state.ts), tests/guide-locale-form-state.test.ts.
GuideEditor props initial:GuideEditorialModel|null, cities, draft:GuidePageEdit
(legacy prop existente para rootId/new defaults), initialLocale?:string. Reusar
controles/formularios/módulos con cambios locales, sin Save hijo. Nuevos UUIDs
estables antes del primer Save, foco/errores/preview de medios. No server/schema/
types/helpers/messages/core. Solicitar keys a root. Nuevos helpers no deben copiar
bugs resueltos de Services: JSONB key order, stale inherited draft, full maps,
pending media prune, cambios locales de otros idiomas y visibilidad.

QA independiente después del ensamblaje: sólo docs/specs/guide-locale-forms-qa.md
y artifacts /private/tmp/central-hill-guide-locales-qa/independent. Cuatro grupos
normales acotados desktop/mobile:1New→secciones/lugares antes Save y Save/reload/
Publish por idioma;2inherit/custom+sharedmedia/maps/reorder/removal/uploadfailretry/
alltab navigation;3legacy public/pending/SEO/city/TOC/recommendations/sitemap/oldlinks;
4stale/ownership/auth/validation/visibility y hashes antiguos intactos. No estética
automática/matriz expandida; apariencia la valida usuario. Sólo correcciones
demostradas y confirmaciones dirigidas, sin repetir grupos aprobados sin causa.

## Entorno / autorizaciones / verificación

Node22/pnpm y safeenv existente /private/tmp/central-hill-building-status-qa/env.sh;
propertylocalesqa DB5658/proxy4558/storage9077, verificar DB+rol antes de writes.
Preservar actual main3071PID44149/session88324 hasta candidato listo. Root controla
único frontend, candidate3071 para QA y vuelve actual-main dev tras aprobación.
No copiar .env remoto/backup ni imprimir credenciales. Mantener storage y symlink.
Pruebas autorizadas de contenido sintético propio e790(store, limpiar) y e791
(browserdemo, retener), más UUID de creación/upload registrados. Proteger todos
los demás datos/tablas con hashes. Migración0028 requiere NUEVA autorización
explícita; preparar SQL concreto y pedirla antes de ejecutar. No producción.

Checks integrados: pnpm typecheck, pnpm lint, tsx --test con archivos explícitos
afectados de guides + regresiones; backend real en synthetic con loaders
property-forms-qa/test-runtime.mjs y node-runtime.cjs, safeenv. db:check por0028;
pnpm build CIRCLE_NODE_TOTAL=3 (2workers), sin cambio de config. Revisar límites
de slice, cuatro idiomas, SSR/SEO/ISR. No pnpm test/boundary placebo. Reportar
hash/commands/exits. Tras QA, ff main local y apertura final sólo lectura; no push.

## Progreso

Inventario/plan completados antes de implementar. Base contratos470c23b creada
antes de abrir los dos worktrees consumidores. UI/backend trabajan en sus archivos
asignados; root integra composición, mensajes y retiro de las vías legacy de Guías.

Usuario autorizó explícitamente «Sí, aplicar 0028 sólo a propertylocalesqa».
Aplicada únicamente allí tras verificar DB y rol propertylocalesqa. Dos tablas
nuevas vacías; hashes de40tablas de negocio preexistentes sin cambios. SHA256SQL
b8a3f79039985b878f91db49c9cbc98d51ce105e617c5b288939888d1611e923.
Evidencia: /private/tmp/central-hill-guide-locales-qa/migration.json y
pre-migration-data.json. No backfill ni escrituras remotas. Fixtures browser e791
nuevas: legacy publicada EN/PT + ES pending, dos secciones/dos lugares/fotos
existentes sólo referenciadas; position9999. Script seed.cjs registra identidades.
Backend dispone e790 para tests propios con limpieza; no tocar datos anteriores.

Root wiring1f326bf integra rutas New/Edit, mensajes4locales y exclusión/redirect/
writeguards de guide_page/section/place en Translations. UI b90eb6c integrada como
a546862. Regresiones iniciales root:67grupos Guías +25Translations/Services,
todos exit0. db:check exit0,29migraciones consistentes; warning0008preexistente.
Backend completó14grupos (4puros+10DB) con cleanup e790, typecheck/lint0;
se repite dirigido firstSave tras endurecer registro raíz bajo el mismo graphlock.
La comprobación integrada final y QA independiente siguen pendientes.
