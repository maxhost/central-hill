# Real Estate Enquiry — ejecución

Baseb7741eddf059487b7e5cceb536a76d233b213ff6. Usuario solicita selector debajo deNote en
Enquiry de /admin/pages/real_estate para Forms público. Plan real-estate-enquiry-assignment-plan.md.
Checkpoint verified antes de producto: restore/real-estate-enquiry-2026-11-12-1794508510198,
49tablas1514filas/ledger31 exactos en2restores,1353Gitobjects/183mediaSHA exactos. Main3071
PID42708/parent42702/session64963 ymedia9081PID42630/session56332 retenidos. Main DB/rol
neoncontentlocal20261111→proxy4558/PG5658, env/preload originales, emailconsole. Preexistentes
logoPNG+2symlinks preservados; no fixtures en authoredmain.

## Contratos y write sets

Root posee server/real-estate-enquiry-assignment.ts +Pages/server-contract exportando
readRealEstateEnquiryAssignment():{formId,identity}|null,
realEstateEnquiryAssignmentGuard(id,identity), realEstateEnquiryUsageGuard(id).
PublishedEN keyreal_estate pathcontent.deal_enquiry.form_id, identidad ID+published_at,
usage draftEN OR publishedEN y UUIDcase-insensitive. Root extiende PublicFormModel/Leads
sourcePage union con real-estate-enquiry; B implementa readRealEstateEnquiryForm(locale,
override?:string|null) por Forms/server-contract y submitRealEstateEnquiryForm público.
Kindderivado en capture para este source esdeal_enquiry; no parámetrokind libre delcliente.
Root docs/ADR0083/provisión/scripts externos/integración. Sin core ni schemaSQL.

Integration /private/tmp/central-hill-real-estate-enquiry-integration branch
real-estate-enquiry/integration. A /private/tmp/central-hill-real-estate-enquiry-pages branch
real-estate-enquiry/pages, único escritor src/slices/pages excepto server-contract y los4
server/*-assignment.ts existentes/root-owned. Incluye schema/helper/selector/store/preview/
RealEstate renderer/DealEnquirySection/tests/README; messages/{en,es,pt,fr}.json solo subtree
pages.admin.realEstateEnquiry +labels necesarios. No Forms/Leads/Settings/core edits. Preservar
3placements y evitar anidarFormCard(<form>) con Runtime(<form>); slot seleccionado presentacional.
Selector puedeampliar AboutContactSelector con tercerplacement defaultAPI intacta.

B /private/tmp/central-hill-real-estate-enquiry-forms branch real-estate-enquiry/forms,
únicoescritor Forms/Leads incltests/README (public-types/form-capture-types root iniciales;
ampliar solo avisando). Reader/acción/runtime/snapshot/replaykind+origen/invalidation4placements/
archivo4ubicaciones. No Pages edits; solo contrato serverPages. Preservar hashes/replays de
Header/About/Guest exactamente. Testcaptura realkinddeal_enquiry y kindincorrecto no-replay.
No core/SQL/DDL. Node22/pnpm, rootpreparadeps yenv; NO ln en node_modules existente.

DBs schema-only por writer realestateenquirypagesqa20261112 yrealestateenquiryunitqa20261112;
QAclone realestateenquiryqa20261112, producción3085. Env/preload estrictospropios. SoloQA
puede modificarRealEstate/About/Guest/Settings del clone para independencia, fixturesA/B,
translations/rate; baseline yexcepciones explícitos, todasotrasfilas intactas. No antiguosDBs.
QA independiente escribe solo artefactos /private/tmp/central-hill-real-estate-enquiry/qa y
qa-independent.md; browser/DBespera exactocandidato+runtime readiness. Login normal, sin
extraer cookies/tokens. No nesteddelegation; rootintegra trasaprobación. Pruebas explícitas
pnpm exec tsx --test, typecheck/lint/build/dbcheck. No placeholders comoevidencia.

Estado: contratos iniciales en preparación tras checkpoint completo verificado.
