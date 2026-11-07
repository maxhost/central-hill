# Edificios y Departamentos — formularios, herencia y datos compartidos

2026-11-06. Implementación local solicitada. Base29db0c5 en blog-form/integration;
main0e72983 contiene sólo Blog/topbar y no se modifica en esta entrega. Rama nueva
property-forms/integration, /private/tmp/central-hill-property-forms-integration.
Conservar3071,3073(editor anterior),3075(Blog), todos sus fixtures y worktrees.

## Reglas confirmadas explícitamente

- Formularios tradicionales, sin PageEditorShell/canvas/inspector/preview embebida.
  Mantener pestañas EN/ES/PT/FR y Save draft/Publish del idioma seleccionado.
- EN se prepara automáticamente en idiomas sin contenido propio. Al modificar
  textos/SEO/URL de un idioma, ese documento queda independiente y cambios EN
  posteriores no lo pisan, incluidos borradores/trabajo local aún no guardado.
- **Publicar cada idioma explícitamente**, confirmado. EN Publish no publica PT
  ni cambia textos/SEO ya publicados en otro idioma. Nuevo idioma sin Publish404.
- **Imágenes compartidas actualizadas en todos al guardar**, confirmado; incluye
  portada, OG y galería. No copias ni adopción manual por idioma.
- **Datos físicos únicos y compartidos actualizados al guardar**, confirmado:
  capacidad/dormitorios/ubicación/amenities y demás datos no traducibles.
- SEO textual por idioma; URL de reserva override por idioma. Default URL/Avantio
  ID y booking_enabled compartidos. PToverride explícito nunca se sustituye porEN.

## Modelo de contenido

Building shared: position,is_new,is_featured,city_id,neighbourhood_id,street_address,
latitude,longitude,cover_media_id,og_image_media_id,gallery,amenity_ids,avantio_id,
default_booking_url,booking_enabled. Apartment shared: bedrooms,bathrooms,max_guests,
beds_count,size_m2,floor,cover_media_id,og_image_media_id,gallery,avantio_id,
default_booking_url. Apartment position sigue operacional global existente.

Todo lo demás es documento localizado: nombre/teaser/prosa legacy/FAQ con UUIDs
estables/SEO/booking_url en Building; nombre/badge/prosa legacy/SEO/booking_url en
Apartment. No restaurar prose/campos retirados; sí exponer meta_title/description
Apartment porque el usuario pide SEO por idioma. No nueva URL pública Apartment.
FAQ puede editarse por idioma, sin sincronizar arrays por posición; EN se copia
sólo mientras ese idioma no se personalice. Mantener filasFAQlegacy para redirects.

Envelope añade localeMode?:'inherit'|'custom', sin renumerar schemaVersion1. ENcustom;
target sin documento ni traducción propia inherit. Legacy con cualquier texto
propio/pending, o snapshots revision>0 previos, se trata custom conservadoramente.
Snapshot baseline revision0 sin target real puede ser inherit. No inferir propiedad
sólo por igualdad conEN: una traducción guardada igual sigue siendo propia.

Modelo working de inherit toma últimos textos EN guardados (draft o published),
con localeMode inherit. Draft inglés previamente guardado en target no personalizado
no frena futuras actualizaciones EN: no es una traducción propia. Publicado queda
congelado hasta Publish de ese idioma. Primera edición localizada fija custom en
estado local inmediatamente y luego Save lo persiste; no-op/imagen/dato físico
no personaliza textos. Custom no vuelve a inherit automáticamente al vaciar texto.

Save inherited debe comprobar fuente EN vigente; Publish inherited no publica un
borrador obsoleto si cambió el contenido EN desde Save. Comparar proyección textual
semántica, no rechazar únicamente porque EN Publish aumentó revisión sin cambiar
texto. Guardas de revisión del idioma y graph lock siguen vigentes. No nuevas vías
legacy live para texto ni Translationgen; los bloqueos anteriores se conservan.

## Datos compartidos y compatibilidad

ADR0061. Dos tablas aditivas por dueño: building_shared_content y
apartment_shared_content, FKidentityCASCADE, uniqueentity, data JSONB version1 de
sólo shared fields, revision monotónica, actor text y timestamps. Propuesta
migración0026_property_shared_content; preparar antes de pedir permiso de aplicación.
No aplicar DB ni migración hasta autorización explícita adicional de ese cambio.

Sin fila shared: getter puro usa shared de ENpublicado; si no, primer idioma
publicado; si ninguno, ENdraft o identidad legacy. GET/preview no inicializa nada.
Conservar common pending de un ENdraft viejo como working compartido local inicial
si aún no hay shared row; visible como cambios comunes pendientes hasta Save.
No llevar ese draft al público por leerlo. Una vez hay shared row, es la única
fuente de datos comunes; ignorar copias históricas de shared en locale envelopes.

Save de cualquier idioma puede guardar shared propuesto. Cambio shared exige
expectedSharedRevision actual (0 virtual sin fila). Si sharedChanged=false,
ignorar copias stale del payload y usar shared actual; una traducción textual no
revierte imágenes/capacidad nuevas ni debe fallar por un cambio común ajeno.
Resultado devuelve shared actual y previews normalizados; UI actualiza comunes en
todas las tabs, conserva cualquier texto/SEO local independiente sin guardar.

Mutación atómica db.batch HTTP: graph lock7158/1 primero, statement fresco con
CASlocale + CASshared si se edita common; ninguna escritura parcial si falla.
Inicialización de shared en primera escritura conserva la salida common efectiva.
Persistir localeMode y shareddata en la misma transacción; mirror de columnas
neutrales y relaciones legacy para guards/indexes/lectores operacionales existentes.
No cambiar textos/SEO de otras filas ni sus revisiones. Referencias a entidades
ajenas sólo por contratos/seams. Un sharedSave invalida público/listados/Home/parent
porque el usuario pidió efecto inmediato; sólo textoSave no invalida público.

Apartment sharedcapacitySave actualiza contadores publicados en todos los idiomas,
una vez por unidad visible, sin multiplicar traducciones. Stats legacy por identidad
usan common actual, no una copia locale antigua. Parent gating/archivo/borrado/
orden global/booking_enabled mantienen garantías de la entrega anterior.

## Formularios

Cabecera sticky con volver, tabs/estado, Save draft y Publish. Controles todos en
formularios por grupos, sin selector de sección. Shared editables desde cualquier
idioma; ayuda explícita: se aplican en todos al guardar. Textos/SEO independientes
tras modificación. Mostrar estado heredado/personalizado con texto, no sólo color.
Language dirty compara documento localizado semánticamente; shared dirty separado.
Publish requiere draft guardado y sin cambios locales/shared pendientes. No falsa
suciedad por orden JSONB, inicialización o metadatos. Guardas cubren cualquier tab.

Nuevo EN primer Save real→Edit, UUIDestable, luego habilita targets. Campos ocultos
legacy preservados, no borrados al reorganizar. MediaField/GalleryField y cola
existente; IDs comunes, flush sólo IDs referenciados por este inmueble; persistido
normalizado prevalece a blob y keys por id/url. No preview/send/renderer paralelo.

## Contratos root antes de delegar

PropertyEnvelope añade localeMode opcional. PropertySharedState<C> contiene
revision,content:Partial<C>,working?:Partial<C> (working sólo compatibilidad inicial).
PropertyEditorialModel.shared opcional para compatibilidad de fixtures; servidor
nuevo siempre lo proporciona. Resultado success.shared/previews opcionales.
SavePropertyDraftInput añade expectedSharedRevision?:number,sharedChanged?:boolean.
Schemas estrictos aceptan esos campos y localeMode; ambas implementaciones adoptan
el mismo significado. Shared false nunca escribe payload common stale.

Root define BUILDING_SHARED_KEYS/APARTMENT_SHARED_KEYS y tipos SharedContent en
editorial-types.ts, schemas de tablas y migración/snapshot/journal. Actions/rutas
actuales y firmas UI se mantienen. A/B exportan getBuildingSharedState(id),
getApartmentSharedState(id) desde sus stores si los necesita root; SQL/helpers
internos son de su dueño. No ciclos por leer tags al inicializar contratos.

## Ownership

Root: este doc/ADR0061 y docs de cierre/AGENTS/data-model; Backoffice
property-editor-types.ts/contract.ts y ui/admin-workspace.tsx; Buildings y Apartments
editorial-types.ts/schema.ts/contract.ts; migración0026/snapshot/journal; mensajes4;
app/admin routes si requieren adaptación. Root sólo añade schemas DTO compartidos
en ambos editorial-validation.ts antes del contrato y transfiere luego a writers.
No cambios core ni Blog ni main, salvo documentación en esta rama.

A Buildings (worktree /private/tmp/central-hill-property-forms-buildings,
branchproperty-forms/buildings): admin/actions.ts,editorial-actions.ts,queries.ts;
admin/ui/building-locale-editor.tsx,property-editor-state.ts,property-editor-sections.ts,
list.tsx; server/editorial-{bootstrap,model,store,validation}.ts,queries.ts,publish.ts,
stats.ts; tests/property-locale-*.test.ts y nuevos tests/property-form-*.test.ts;
README. Puede añadir server/shared-content.ts y admin/ui/building-form-layout.tsx.
No schema/types/contracts/mensajes/rutas ni Apartmentfiles.

B Apartments (worktree /private/tmp/central-hill-property-forms-apartments,
branchproperty-forms/apartments): admin/actions.ts,editorial-actions.ts,queries.ts;
admin/ui/apartment-locale-editor.tsx,property-editor-state.ts,property-editor-sections.ts,
list.tsx; server/editorial-{bootstrap,model,store,validation}.ts,queries.ts,stats.ts;
tests/property-locale-*.test.ts y nuevos tests/property-form-*.test.ts;README.
Puede añadir server/shared-content.ts y admin/ui/apartment-form-layout.tsx. No archivosA.

QA independiente: sólo docs/specs/property-form-editors-qa.md; harness/artifacts
fuera del repo. No producto. Root integra y corrige ownership antes de ampliar.

## Entorno y aceptación

Node22/pnpm. Runtime nuevo3077, storage9077, artifacts
/private/tmp/central-hill-property-forms-qa; DBpropertylocalesqa existente, sin
remoto. Preparar migración y pedir autorización de aplicación antes de mutar DB.
Fixtures nuevos UUID e* propios, no d*/f* previos; antiguo3073 permanece intacto.

Tests integrados explícitos estado/validación/store de ambos y consumers existentes;
typecheck/lint/build/db:check. Ronda normal funcional agrupada4idiomas desktop/móvil:
formularios/noiframe, ENheredaES sin traducción, PTeditado no cambia tras ENSave,
SEO/bookingPTown; Publicación explícita cadaidioma; sharedimages y físicos Save
actualizan público de todos sin publicar textos/SEO;2uploads y previewsnormalizados;
stats padre grilla coherentes; CAS/guardas, Save/reload, NewdosSaves/navegación;
compatibilidad oldsnapshots/legacy/PTpending/GETsinwrites. Sin matriz ampliada.

## Progress and verification log

- Root contracts/spec/schema commit4b18112. Before delegation typecheck exit0.
- Migration generation is file-only, no DB connection/write. First db:check was
  sandbox-blocked (tsx IPC); escalated check exposed generated timestamp older
  than0025. Root corrected only new0026 journal time to1794000000001 in01adc06.
  Recheck exit0,27migrations, existing0008 breakpoint warning only.
- A/B worktrees created from4b18112 and their actual branches verified. Dependencies
  use integration's installed node_modules for writer checks; production build
  runs only integration with a real node_modules directory.
- Root UI copy four languages committed01adc06/ba52852. Common forms restore
  normal sidebar/max-width; stable editor workspace keys remain for New→Edit.
- QA artifacts/config/scripts prepared in/private/tmp/central-hill-property-forms-qa,
  preview3077/storage9077. SQL read-only identity check independently confirmed
  db/rolepropertylocalesqa. Old d*/f* fixture hashes recorded before any mutation.
- This synthetic DB was initialized from individual SQL files, without a Drizzle
  ledger. Application script validates existing0025 tables and absent0026 tables,
  then applies only0026 SQL in one transaction; no historical migration replay.
  Explicit user approval requested asynchronously; **not yet applied**.
- New browser fixtures prepared (not executed): e400...001 Building,e500...001
  Apartment,e700...001 FAQ. New writer DB tests use e410/e420/e520 prefixes.
  Existing d*/f* entities are reference-only and preserved.

- Buildings092d89b integratedd3d160d; Apartments53a4f36 integrated97c6fdb.
  Both owners stayed in assigned slices. Current fixes integrated8cbd0e0:
  Apartmentfbd871d(sourcef4aa18d), Building8cbd0e0(source879839a).
- Integrated d3d160d: pnpm typecheck0; pnpm lint0(7existingwarnings);
  92/92puretests0; compile-only Nextbuild0. Logs inQAartifact root.
  No static page generation/fullbuild, DBtest, browser or content writes.
- Independent source review found old ENdraft common pending could bypassSave
  through directPublish: Buildings could publish it; Apartments could discard it.
  Both fixed by rejecting Publish while shared.working exists. Prepared DB
  regressions, not yet executed. Owner typecheck/lint/diffcheck0 after fixes.
- Pure integrated command, withQAenv and AsyncLocalStorage/server-only/image
  metadata loader (no data/query substitutions):
  pnpm exec tsx --import /private/tmp/central-hill-property-forms-qa/test-runtime.mjs --test
  src/slices/buildings/tests/property-locale-state.test.ts
  src/slices/buildings/tests/property-form-model.test.ts
  src/slices/buildings/tests/buildings.test.ts
  src/slices/buildings/tests/buildings-admin.test.ts
  src/slices/buildings/tests/amenity-admin.test.ts
  src/slices/apartments/tests/property-locale-editor.test.ts
  src/slices/apartments/tests/apartments.test.ts
  src/slices/apartments/tests/apartments-admin.test.ts
  src/slices/apartments/tests/apartments-admin-derive.test.ts
  src/slices/blog/tests/post-editor-state.test.ts
  src/slices/backoffice/tests/page-editor-bridge.test.ts
- Pending authorization is a DB change permission, not an automatic-review
  rejection. No migration application/fixtures performed. Preview3077 not started.

- Final integrated8cbd0e0 root pnpm typecheck0 and compile-only Nextbuild0.
  Logs typecheck-final.log/build-compile-final.log. No need to repeat unchanged
  pure cases; guard DB regressions await authorized schema. Independent source
  report8c6521b confirms both corrections, no additional code blocker; functional
  QA explicitly pending. No DB approval answer received at this checkpoint.

## User-approved runtime/main follow-up

User now says 'aplicala y mata todos los ocalhost de este env y relanza uno solo
 del main local para poder probar el cambio en el editor'. This explicitly
supersedes earlier no-main/old-preview preservation boundaries for local delivery.
0026 applied only to propertylocalesqa; new e* fixtures seeded. Old d/f remain.
See property-forms-main-integration.md for exact process/env/application boundary.
First real DB run:3/12pass,9failed; most downstream after two SQL precedence bugs.
Fixed by source72f0957/ede4284, now2bb313d; main candidatefed9fb8. Owner8/8+4/4
and integrated104/104pass. Main candidate typecheck/lint/dbcheck/fullbuild all0;
full independent browser QA in progress, no main fast-forward yet at this entry.

- Final independent browser QA approved executablefed9fb8:10groups/3scripts0,
  no browser exceptions; screenshots desktop/mobile/public reviewed one round.
  Four locales, actualmedia3uploads/commonSave/privatePTtext/SEO, physicalstats,
  Newstableidentity/parentgate and mobilefocus/guards passed. Oldd*/f*hashes match.
  Root now fast-forwards actualmain and transfers the same testedbuild after
  stopping candidatePID84271; no product changes, only narrow runtime confirmation.
