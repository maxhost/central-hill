# Edificios y apartamentos — ejecución local por idioma

2026-11-06. Usuario solicita nuevo savepoint y continuar el siguiente hito
del plan después de Blog. Implementación local autorizada; spec detallada
se cierra antes de contratos/delegación. Sin main merge/push/deploy/Neon remoto.

## Savepoint antes de comenzar

Base Blog aprobado: código58ba96a, QA060c195, cierreaf3a4a1 en
post-locales/integration (/private/tmp/central-hill-post-locales-integration).
Este commit documental registra el checkpoint nuevo antes de escribir código
de edificios/apartamentos. Resolver su hash con git log -1. Preservar3071/3072,
DB postlocalesqa/storage9072, public/postlocalesqa sin rastrear, todos los
worktrees/artefactos y logo original no rastreado.

Siguiente rama/worktree: property-locales/integration en
/private/tmp/central-hill-property-locales-integration, desde este checkpoint.
DB sintética propuesta propertylocalesqa, puertos5658/4558/9073, preview3073;
autorización de DB se solicita separadamente según acuerdo vigente.

## Dirección de producto confirmada por la hoja de ruta

EN/ES/PT/FR manual, Save draft/Publish por idioma; slugs existentes conservados.
Apartamentos siguen dentro de su edificio y sin nueva URL pública propia.
Cada idioma controla textos y override de reserva; media/operaciones/estructura
se authoran EN y se adoptan explícitamente en drafts target cuando hace falta.
Baseline publicado y targets pendientes preservados. Sin guardado live legacy
ni mutaciones de otros idiomas al traducir. FAQs del edificio con IDs estables.

Cierre de spec pendiente de auditoría: parent visibility, counters por idioma,
orden operacional global de apartamentos, borrado seguro de padre, todas las
superficies de booking y previews con renderer real. La auditoría de código
no consulta ni modifica DB remota.

## Contratos y ejecución cerrados antes de delegar

Spec property-locale-editors-spec.md cerrada para implementar. Savepoint5a1456d,
baseejecutableBlog58ba96a. Integración property-locales/integration en
/private/tmp/central-hill-property-locales-integration. Dos escritores separados:
/private/tmp/central-hill-property-locales-buildings (property-locales/buildings),
/private/tmp/central-hill-property-locales-apartments (property-locales/apartments),
creados desde el commit de contratos que se resolverá antes de lanzar agentes.
Node22.23.3/pnpm10.8.0; dependencias existentes copiadas sin credenciales.

Root: spec/plan/ADR0058, schemas/types/contracts de ambos slices, migración0025
y su snapshot/journal, Backoffice property-editor-types.ts/contract.ts y nuevo
ui/property-live-preview.tsx, ui/admin-workspace.tsx; todos los app/admin routes
Buildings y preview/buildings|apartments/[id]; Translation actions/queries/review/
generate y README; mensajes root4locales, scripts seed relacionados y docs.
Root es único escritor de esos archivos. Sin cambios coreDB/auth/i18n.

A Buildings: admin/actions.ts,queries.ts; nuevos server/editorial-store.ts,
editorial-bootstrap.ts,editorial-validation.ts,editorial-model.ts según necesite;
admin/editorial-actions.ts; nuevos admin/ui/building-locale-editor.tsx y
property-editor-state.ts,property-editor-sections.ts; admin/ui/list.tsx,
workspace-header.tsx/workspace-tabs.tsx; server/queries.ts,publish.ts,stats.ts;
ui/building-detail.tsx; README/tests/property-locale-*.test.ts. Puede conservar
building-form.tsx antiguo sin convertirlo o adaptarlo dentro de su ownership.
No toca schema/types/contract/rutas/mensajes ni archivos Apartments.

B Apartments: admin/actions.ts,queries.ts,derive.ts; nuevos server/editorial-store.ts,
editorial-bootstrap.ts,editorial-validation.ts,editorial-model.ts;
admin/editorial-actions.ts; admin/ui/apartment-locale-editor.tsx y
property-editor-state.ts,property-editor-sections.ts nuevos; admin/ui/list.tsx,
move-buttons.tsx,apartment-form.tsx si necesario; server/queries.ts,publish.ts,
stats.ts; README/tests/property-locale-*.test.ts. No toca schema/types/contract/
rutas/mensajes ni archivos Buildings.

Tipos comunes PropertyEnvelope/LocaleModel/EditorialModel/SavePropertyDraftInput/
PublishPropertyDraftInput/EditorialResult/PreviewInput, constantes locales
exportadas desde Backofficecontract. Dominio en cada editorial-types.ts.
A implementa en server/editorial-store.ts exports getBuildingEditorialModel(id),
getBuildingLocaleScope(id,locale):BuildingLocaleScope|null (sin consultar unidades),
getBuildingDraftPreview(id,locale):BuildingDetail|null,
buildingIdentityExistsSql(id:string,allowArchived?:boolean):SQL (fragmento SELECTid).
Actions admin/editorial-actions.ts: saveBuildingLocaleDraft(input),
publishBuildingLocaleDraft(input), archiveBuilding(id), renderBuildingLivePreview(raw).
A BuildingDetailRenderer({locale,detail,apartments?:ApartmentSummary[],preview?:boolean,
editorBindings?:boolean}) usa exactamente renderer público y suprime JSONLD en preview.

B implementa en server/editorial-store.ts getApartmentEditorialModel(id,parentId?),
getPublishedApartmentStats(buildingId,locale):BuildingStats (sin guardapadre, para
evitar recursión A->Bstats->A), apartmentIdentityGuardSql(buildingId):SQL (SELECTid).
B público listByBuilding/getApartmentBySlug sí consulta getBuildingLocaleScope
para ocultar hijos cuando padre no publicado/archivado. Refs entre slices sólo
por contract. Actions admin/editorial-actions.ts: saveApartmentLocaleDraft(input
con parentId),publishApartmentLocaleDraft(input),archiveApartment(id,parentId),
renderApartmentLivePreview(raw), usa getBuildingDraftPreview + BuildingDetailRenderer
e inyecta unidad local dentro de colección publicada del padre.

Root routes montan BuildingLocaleEditor(initial:BuildingEditorialModel|null,
newEntityId?:string,initialLocale?:string,locations:LocationOptions,amenities:
Awaited<ReturnType<listAmenitiesAdmin>>). ApartmentLocaleEditor(initial:
ApartmentEditorialModel|null,newEntityId?:string,initialLocale?:string,buildingId:string).
Naming props se fija así; comunicar cambios a root, no editar contrato en writers.
Preview wrappers root PropertyLivePreview con bindings por kind.
A bindingIDs ['identity','hero','gallery','amenities','faq','booking','seo'];
B ['card','details','booking']. ID 'card' anota UnitCard correspondiente en el
renderer Building cuando previewApartmentId?:string coincide; A acepta ese prop
para que B no cree una tarjeta paralela.

Common messages propertyEditor: saveDraft,publish,unpublished,published,draftSaved,
unsaved,sourceFields,firstSave,manual,url,immutableSlug,back,archive,archiveConfirm,
archived,deleteConfirm,leaveTitle,leaveBody,cancel,continue,saving,publishing,error,
conflict,legacyInvalid,slugConflict,noDraft,validation,refreshWarning,preparing,
previewIncomplete,previewEmpty,seo,shared,newEntity,reload,inUse,adoptSource,
adoptSourceHint,bookingBase,bookingUrl,bookingHint,globalOrder. Domainlabels
existentes buildings.admin/apartments.admin. Root escribirá4locales.

Verificación integrada: pnpm typecheck/lint/build/db:check; tests explícitos nuevos
y consumers afectados (lista al integrar); QA independiente normal browser4idiomas/
desktopmóvil,2stagednew entities/parents/counters/booking links/FAQ/scopeduploads/
preview/nav/legacyguards/SEO/lifecycle. Sin placeholders pnpmtest/boundary ni DBremota.
No lanzados agentes antes de este contrato. Permiso DB nueva autorizado explícitamente por el usuario; sólo DB/rol
propertylocalesqa, sin tocar postlocalesqa ni Neon remoto.

Usuario confirma explícitamente DB local y pruebas sintéticas propertylocalesqa.
Se provisiona nueva red/containers central-hill-property-locales-qa/db/proxy,
5658/4558/storage9073/preview3073, sin reutilizar ni alterar postlocalesqa.
Artifact /private/tmp/central-hill-property-locales-qa; sólo credenciales sintéticas,
preloader local rechaza Neon remoto y sólo envía propertylocalesqa.local/api.local
al proxy4558. Startup QA optimizer permite únicamente endpointlocal9073, sin
cambiar next.config.ts del producto. Baseline relativo en public/propertylocalesqa
symlink no rastreado. Servidores3071/3072 preservados.

Provisionado:26migraciones0000..0025 aplicadas con psql ON_ERROR_STOP sólo
propertylocalesqa, SQLDB/rol verificados por driver real, max_connections400
desde inicio para prerender. db:check exit0,26archivos/snapshots, warning0008
preexistente. Storage9073 sesión9222. Fixture root d* incluye city/neighbour/media,
Buildingpublic+Apartmentpublic, amenity+FAQ, ESapproved/PTpendingBuildingFAQ y
FRpendingApartmentbadge, stat1/4/3. Authsintético propertyqa@example.test /
PropertyLocalesQA2026!, editor. Env/seed/fixtures sólo en artifact QA.
Legacy seed-demo.ts retirado antes de escrituras, root exactscope incluye ese
archivo. getApartmentEditorParentId rootexportcontract/Bimplementa.

Contrato adicional BuildingstatsUpdateSql(buildingId,aggregate:SQL):SQL en
Buildingsserver/stats.ts, rootcontractexport/Aimplementa. Baporta agregadoSQL
de su propiedad y usa UPDATEfragment bajo mismographlock/db.batch para impedir
stale denormoverwrite concurrente. No consulta directa de tabla ajena.
ApartmentLocaleEditor acepta parentPublication?:Partial<Record<EditorLocale,boolean>>,
rootobtiene scopes4idiomas en ruta yB muestra aviso parentUnpublished.

Integrados A beff67b +eb25e6e (lazycachetags elimina cicloESM), B b93e178
+2ae1170 (nulls de snapshots no reviven legacy) +429b48f (parentlookup mínimo).
Candidate632c54d inicialtypecheck/lint0 con7warningspreexistentes. WriterA
6gruposDB+6nuevospurosexit0, B3gruposDB+8nuevospurosexit0, propiosb*/c*limpios.
Root verificación integrada corre tests explícitos y build después de terminar
writers para no competir por fixtures. Se añade sólo texto4locales corregido
antes de la etapa build para no hablar de artículos en editores de propiedades.
QA independiente property_qa revisa código y verificó DB/rol propio antesdelecturas.

Root scope addition antesdeeditar: src/app/[locale]/buildings/[slug]/page.tsx.
QA source detecta metadata aún inventaba4hreflang confallbackslug a pesar de
lectorfiltrado. Se usan sólo alternateSlugs publicados, canonical detail.slug
real y x-default EN si existe o primer idioma publicado. Es corrección funcional
requerida por ES-beforeEN; no requiere nuevo test redundante, browserQA comprueba
HTMLreal y sitemap. Primera integración93tests0/typecheck0/lint0; buildinicial
en curso, despuéscorrección build final y confirmación SEO acotada.

## Candidato integrado y revisión independiente

Candidato funcional76cd66c. Typecheck/lint exit0,93/93pruebas reales
(Buildings/Apartments stores + estado/derivaciones, Blogstate y previewbridge)
exit0. Compilación inicial y compilación final76cd66c exit0; db:check exit0
(26migraciones, advertencia histórica0008). Artefactos/logs en
/private/tmp/central-hill-property-locales-qa; el preload sólo enruta a proxy4558
y rechaza dominiosNeon. DetectorImpeccable sobre4archivosUI: exit0, lista vacía.

Preview3073 PID14719/session22769, login200, compilación76cd66c; DB/rol
propertylocalesqa, storage9073. QA independiente autorizado a iniciar un pase
funcional agrupado de navegador/persistencia; reporte y aprobación pendientes.
No revisión automática nueva de3071/3072, ni escrituras allí. Root añade
docs/data-model.md y TranslationREADME a su documentación de cierre.

Cierre documental root: se añade AGENTS.md al ownership para registrar el nuevo
handoff local una vez que termine QA, junto a property-locale-editors-delivery.md.
No autoridad nueva sobre main ni otros previews; sólo estas notas en la rama task.

## Cierre del hito

Revisión independiente completa del candidato76cd66c sin fallos de producto
bloqueantes. No nuevos casos después del último grupo:4idiomas Save/Publish,
preview/guardas/móvil, FAQs/adopción, nuevas identidades, visibilidad ES-beforeEN,
SEO público/sitemap, counter/lifecycle/orden,2uploads scoped, booking overrides y
fallbacks congelados, guardas HTTP/auth/legacy. HomeFeatured source-reviewed por
falta de fixtureHome; no nuevo alcance. Primeras aserciones de harness ajustadas
a sincronización real/selector semántico, registradas con evidencia, sin reset
de DB ni cambios de producto. Typecheck/lint finales76cd66c exit0; suite93casos
en632c54d, diferencias posteriores de copy/metadata cubiertas por build final y
navegador. Entrega y QA registran evidencia exacta; no main merge/push/deploy.

QA aprobada en informe9fb41e3 (8e130ee inicial; follow-up sólo redacción).
Candidato funcional76cd66c permanece intacto. Entrega local cerrada, no gates
pendientes. Próximo hitoServices requiere nueva solicitud; no se inicia aquí.
