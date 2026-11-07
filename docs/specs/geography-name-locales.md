# Nombres de ciudades/barrios EN/ES/PT/FR

2026-11-07. Usuario autoriza cuatro inputs en misma ficha como Amenities, sólo
name, no traducción de slugs. Base main983ca51, tracked limpio y únicos untracked
PNGlogo/symlinkmedia previos. Entrega main local/único3071, sin push/deploy/remoto.
Intro queda EN existente, sin nuevos campos target ni cambio en textos históricos.

## Inventario y contrato

Geography city/neighbourhood reutilizan translation.name; public readers YA cargan
loadContent(locale) con approved/fallbackEN. CityForm guarda ciudad y barrios
inline (add/remove/reorder), una ficha y un Save. Slug/position/status/country/hero
son comunes; barrios conservan city_id e ID. No nuevos tabs, publicaciones por
idioma, traducción automática, tablas/migración ni API kernel.

Payload actual añade translations?:{es,pt,fr}:string a city y cada barrio. ENname
trim/min1/max120; targets trim/max120, blanco permitido. Ausentes conservan targets
de clientes antiguos; presentes aplican tres hojas: no vacío aprobado, vacío borra
sólo name de ese idioma para fallbackEN. Queries cargan targets RAW incluyendo
pending, ausentes vacíos sin copias de EN. EN posterior conserva textos propios.
Intro/copy, media, datos físicos y asignaciones no se localizan en este cambio.

Dos riesgos observados en seam actual requieren acotar los Name-only Saves:
1Save actual reescribe cuatro slugs aun sin editar slug. En update con plain slug
igual al guardado NO llamar setSlugs; conservar todas las filas/URLs anteriores
(incluidas target custom y ausentes). En creación sí cuatro slugs idénticos; un
cambio REAL del único campo slug mantiene comportamiento previo de slug común.
2setSourceContent intro:null borra traducciones intro de TODOS los idiomas.
Omitir escritura intro si ENintro no cambió, preservando hashes incluso con source
ausente/targets propios. Si ENintro se edita realmente, reutilizar preserveTargetsOnClear
de ADR0067 para no borrar targets históricos. No promover/copiar/aprobar intro
targets desde estos campos name. No cambios de kernel ni nuevo control intro.

Mantener IDs de barrios también al Save de una nueva fila en ciudad existente:
success añade neighbourhoodIds?:string[] en orden payload, devuelto tras persistir;
UI adopta esos IDs al éxito antes de futuros Saves. Evita que fila nueva siga sin
id en estado local y se vuelva a crear/elimine al segundo Save. Compatibilidad de
clientes antiguos preservada. Existing sequential writes siguen, sin nueva promesa
de atomicidad; deletes/foreign refs/fallo de slug conservan capacidades actuales.

Selector labels: tipos GeographyNameOption con id/nameEN y labels?:Record<Locale,string>,
neighbourhood añade cityId. Nuevo contrato staff-gated listLocationNameOptions()
devuelve ciudades/barrios publicados como el selector Building existente; IDs y
filtrado por cityId iguales. listGuideCityOptions mantiene ALL statuses pero añade
labels aprobadas/fallback; GuideCityOption acepta labels opcionales. Building y
Guide editors muestran labels[locale]??name, sólo texto, sin otro estado/selección.
Public Building/list/filter/Guides/cityParams ya resuelven locale; auditar cachés
GEO_TAGS.list y no republicar ni modificar sus textos/SEO/snapshots/revisiones.
Save City invalida catálogo y admin consumers además de rutas actuales.

No retirar todavía city/neighbourhood de Translations en esta entrega: City.intro
mantiene datos/workflow anterior, y el cierre de esa segunda vía es técnico después
del inventario completo. No afirmar que todas las traducciones de Geography están
cubiertas. No testimonios/Settings/ALT ni otra implementación automática.

## Contratos y propietarios

Root prepara antes de consumidores: reference-name-types.ts/validación/querytypes/
CitySaveResult adicional, contract exports, GuideCityOption optional labels,
Building LocationOptions tipo y adaptación de listLocationOptions al nuevo contrato;
spec/ADR0069/index/AGENTS/roadmap/data-model, messages4locales, fixtures/runtime.
Integración geography-name-locales/integration en
/private/tmp/central-hill-geography-name-locales-integration.

Backend /private/tmp/central-hill-geography-name-locales-backend rama
geography-name-locales/backend: owns Geography admin/actions.ts, admin/queries.ts,
server/guide-city-options.ts, nuevo server/reference-names.ts y
server/location-name-options.ts; README; tests/geography-name-locales.test.ts y
tests/geography-name-locales.integration.test.ts nuevos. No schema/core/types/
validation/messages/UI/Building/Guide product edits. Root proves/public metadata.

UI /private/tmp/central-hill-geography-name-locales-ui rama geography-name-locales/ui:
owns Geography admin/ui/city-form.tsx, nuevo admin/ui/name-locale-payload.ts y
tests/geography-name-payload.test.ts; Building admin/ui/building-locale-editor.tsx
sólo dos option labels y Guide admin/ui/guide-editor.tsx sólo city option label.
Mantener resto formulario/UI, 4names ciudad y cada barrio inline, sin tabs. Un
slug por entidad, IntroEN actual, foto única. Inputs IDs/htmlFor/max/errorpaths/
busy correctos. Arraytargets viajan con row al add/remove/reorder. Adoptar IDs
devueltos al Save para no recrear filas. No mirroring testsmarkup ni helpers extras.
Skill Impeccable/craft-floor antes UI; launcher ya ejecutado conversación, no repetir.

Dos writers aislados, sin nested agents. Root cherry-pick secuencial y checks; QA
independiente luego owns docs/specs/geography-name-locales-qa.md y artifacts
/private/tmp/central-hill-geography-name-locales-qa/independent. Tres grupos acotados:
1New/Edit cuatroinputs/rawpending/Save+reload, nuevosbarrios/add/order/dobleSaveIDs;
2selectores Building/Guide y públicos4locales, IDs/slugs/intro/pub/rev intactos;
3ENrename/targetclear/fallback/noRepublish/legacy customslugs+intro/móvil/auth y
42hashes antiguos iguales. No estética/screenshots/polish loops/matriz amplia.

## Entorno y verificación

Main dev3071 PID49382/parent49376/session31847 vive hasta candidato listo. Root
controla único3071 QA→main; DB/rol propertylocalesqa5658/proxy4558/storage9077PID30456.
Safeenv /private/tmp/central-hill-building-status-qa/env.sh Node22, verificar hostname
y SQL DB/rol ANTES writes. No env remoto ni secretos. Contenido sintético propio
autorizado vigente, no schema/migración. Tests e820 propios limpian; browser e821
nuevaCity+2barrios+Building+Guide+section se retienen, d300media sólo referencia.
No tocar d/f/e78/e79/e80/e81 ni Home/Pages anteriores; hashes42business protegidos.

Checks reales: typecheck/lint, tsx nuevos pure/DB y Geography/Building/Guide labels
consumers pertinentes; sin placeholders. Build CIRCLE_NODE_TOTAL=3/2workers sólo
DESPUÉS cleanup e820. QA production3071, mainff local y apertura final readonly.
Sin nuevas suites amplias de Pages:11expectativas previas fallan en baseline y
están documentadas en tarea FAQ; no reabrir/reparar aquí.

## Progreso

Inventario/spec completados antes de implementación, contratos root siguen.

Rootcontratos b4f2d37 antes de consumidores. Mensajes4locales listos, deps propias
instaladas offline desde caché existente (517reused), mainnode_modules intacto.
Seed e821 nuevaCity+2barrios+Building+Guide/section con slugsPTcustom, introENausente/
PTapproved/ESpending y nombrespending/custom. Medio d300 sólo lectura. Preflight
host/DB/rol y42hashes previos en /private/tmp/central-hill-geography-name-locales-qa/.

UI0e6abf integradoa01cc5c; Rootwire90072f3; backendb4289b8 integradoa69f5f6.
UI24pure0 (9nuevos+15previos), backend26casos0 (4puros+7DB+15previos), e820limpios.
Revisiónroot mantiene lectura LocationOptions para cualquierstaff como el caller
BuildingNew existente (requireStaff sin estrechar roles); Guide conserva sus roles
anteriores. Cambios sólo nombres/seguridad de intro/slugs y adopciónIDs prometidos.

Integración e11dfcf: typecheck0, lint0 (7warnings previos), 36casos0:
15Geographyprevios+9payload/IDs+4namespuros+7DB+1Guidecityoptions. e820limpios.
Comando real: safeenv + NODE_OPTIONS node-runtime.cjs + pnpm exec tsx --import
/private/tmp/central-hill-geography-name-locales-qa/backend/test-runtime.mjs --test
src/slices/geography/tests/{geography,geography-admin,geography-name-payload,
geography-name-locales,geography-name-locales.integration}.test.ts y
src/slices/guides/tests/city-options.test.ts (lista explícita, no pnpm test placeholder).
Loader externo sólo sustituye auth/nextcache para acciones fuera de request;
QA browser conserva auth/cache reales. Sin cambios de kernel/schema/migración.
Build0 con CIRCLE_NODE_TOTAL=3/2workers/144rutas después de cleanupDB. Logs en
artifactdir raíz. Maindev49382/49376 detenido tras verificar cwd; candidato
production3071PID69672/session39094 único listener, login200, QA independiente
habilitada. Root no muta contenido durante sus tres grupos acotados.
