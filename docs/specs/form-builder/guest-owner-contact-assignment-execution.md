# Guest owner Contact — ejecución

Base613b798391de3524e875bbadec85109b2ed6cc04. Usuario autoriza implementación análoga
al About entregado. Plan guest-owner-contact-assignment-plan.md. Checkpoint verified
restore/guest-contact-2026-11-12-1794504562503,49tablas1513filas/ledger31 exactas en2restores.
Runtime main3071PID42708/parent42702/session64963, media9081PID42630/session56332.
Main DB/rol neoncontentlocal20261111, proxy4558/PG5658, EMAIL_PROVIDERconsole.
Preexistentes solo logoPNG y symlinks public/neoncontentlocal y public/propertylocalesqa;
preservados. Sin producto editado antes de restore verificado.

## Contratos y propiedad antes de delegar

Root: server/guest-contact-assignment.ts + Pages/server-contract exports
readGuestContactAssignment():{formId,identity}|null, guestContactAssignmentGuard(id,identity),
guestContactUsageGuard(id). Solo publishedEN keyguest; uso ENdraft/publicado, pathsJSON
content.dual_cta.owner.contact.form_id. PublicFormModel y Leads sourcePage union amplían
'guests-dual-cta'. Forms B expondrá readGuestContactForm(locale, override?:string|null)
por Forms/server-contract y submitGuestOwnerContactForm acción explícita. Override requiere
staff, solo preview. Root docs/ADR0082/provisión/scripts externos/integración y único escritor
src/slices/settings/ui/components/contact-dialog.tsx: envolver solo body con inert
cuando editorPreviewId privado, preservando ancho/markup público y controles diálogo.

Integration /private/tmp/central-hill-guest-contact-integration branch guest-contact/integration.
A /private/tmp/central-hill-guest-contact-pages branch guest-contact/pages, único escritor
src/slices/pages excepto ambos server-contract.ts y server/{about,guest}-contact-assignment.ts
(root). Incluye Guest schema/helpers/editor/store/preview/render, tests/README; messages/
{en,es,pt,fr}.json solo subtree pages.admin.guestContact (y Guest labels necesarios). No edits
Forms/Leads/Settings/core. Si hace falta shared selector generalización también está en Pages
asignadoA, conservar About API/textos/comportamiento. Dialog ya acepta children; no requiere
cambio Settings. Contratos Header/About quedan independientes.

B /private/tmp/central-hill-guest-contact-forms branch guest-contact/forms, único escritor
src/slices/forms y src/slices/leads (public-types y form-capture-types root iniciales; ampliar
solo avisando). Reader/acción/runtime Guest, snapshot/origen sin cambiar hashes Header/About,
archive y invalidación3placements, testsDB/crosskeys/guardfalse stale y READMEs. No Pages edits;
solo Pages/server-contract. Sin core ni SQL/DDL. Node22/pnpm, node_modules symlink solo si ausente
(no ln sobre destino existente). DBs schema-only separados por writer; browser cloneQA3084.

QA independiente solo artefactos externos /private/tmp/central-hill-guest-contact/qa;
no browser/fixtures hasta candidato integrado exacto+runtime readiness. DatasetQA propio,
mutaciones Guest/About/Settings solo allí cuando necesarios para independencia3ubicaciones,
baseline y excepciones explícitos. No token/cookie extraction; login normal local.

Aceptación y comandos en plan: pnpm exec tsx --test <archivos explícitos>/typecheck/lint/build/
dbcheck. Slice imports solo contratos declarados, server-only fuera de clientbarrels. Sin
nesteddelegation, sharedfiles singlewriter; solo root integra después QA aprobado.

Estado: contratos b3f5366 entregados; A/B en worktrees aislados y QA independiente
prepara harness sin browser hasta readiness. Ownschema-only DBs guestcontactpagesqa20261112
y guestcontactunitqa20261112 preparados; 1344objetosGit/183mediaSHA exactos verificados.

Root pre-QA focus review: private inertbody fields must be excluded from focusablelist;
ContactDialog now filters inert descendants. Current ownbuild stopped beforeQA to include
this fix in the first browsercandidate; no other process/runtime/cache touched.
