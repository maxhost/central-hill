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

Estado: entrega integrada enmain local y apertura final aprobada; contratosb3f5366,
A/B aislados e independienteQA completos. Ownschema-only DBs guestcontactpagesqa20261112
y guestcontactunitqa20261112 preparados; 1344objetosGit/183mediaSHA exactos verificados.

Root pre-QA focus review: private inertbody fields must be excluded from focusablelist;
ContactDialog now filters inert descendants. Current ownbuild stopped beforeQA to include
this fix in the first browsercandidate; no other process/runtime/cache touched.


## Candidato integrado

A34264f9 integrado2cdafd5; Bac27238 integrado50d83cf. Root6aca247 previewbodyinert y
8aa7a2e focusfilter de inertdescendants; candidato final752c791cb271a941f90a36f284ea04fee60d2730.
No cambios src/pages/forms/leads/messages entre2cdafd5 de pruebas y752c791; solo el
ajuste root de foco privado y documentación. No Settingspubliclayout/width changes.

El defaultGuest anterior usa applyDefaults, que materializaba el nuevo hiddenstring
como ''. A detectó esto con su propio testDB y lo corrigió eliminando únicamente ese
nuevo campo del scaffold devuelto por guestAdapter.defaultContent; ausencia sigue
siendo ausencia, sin defaults en schema ni escriturasGET. Pureassertion cubre el caso.

- Root153pruebas afectadas de30archivos explícitos pasan,0skip: pnpm exec tsx
  --tsconfig src/slices/pages/tests/tsconfig.json --test con Guest helpers/regresiones,
  About helpers/editor/adapters, engine/preview/drafts, Forms/layout/date/file/attachments/
  public/queries/cache/archive y Leads. Log integrated-tests.log.
- Root8realDBForms+2realDBPages pasan,0skip, contra fuentes finales enintegration y
  cwd/env/preload de las bases propias. Flags GUEST_CONTACT_DB_TEST=1 para Forms;
  GUEST_CONTACT_PAGES_DB_TEST=1 +GUEST_CONTACT_ABOUT_REGRESSION=1 para Pages;
  pnpm exec tsx --tsconfig <integration>/src/slices/pages/tests/tsconfig.json --test
  --test-concurrency=1 sobre about-placement-db/public-rate-db/configured-form-db
  y guest-contact-db/about-contact-db, respectivamente. Logs integrated-db-{forms,pages}.log.
  Archivo con uppercase ENdraft/publicado, identidad estable con draftSave, all3origins/
  seisclavescruzadas, legacyHeader/About hashcompat, staleguard, atomicidad y cuotas reales;
  GuestCAS uno ganador y esperaArchive→freshsnapshotPublishreject, targetJSONexacto.
- pnpm typecheck0; pnpm lint0(7warnings antiguos); scopedSettingseslint0 después delfocusfix.
  pnpm db:check0/31ledger, solo antigua advertencia0008. DetectorUI0 en5targets cambiados.
- Fullbuild final0/215rutas con2workers (4.7min) y cap4queries/preloadbuildonly;
  compilación+TypeScript0. El build anterior propio se interrumpió antesQA para incluir
  focusfix; no se abrió ni ensayó ese binario como candidatoQA. Sin borrar cachés.

Main3071PID42708 y media9081PID42630 siguen en ejecución, no reiniciados. Rootreadonly
main-conservation.json44tablas/1504filas (negocio+ledger) exactos al nuevocheckpoint,
auth excluido para login normal; ningún Save/fixture en main.


## Runtime de QA independiente

Candidato exacto24fa21331cefa041396911a43c21782eaf1fc09b (producto752c791), cwdintegration.
Producción3084PID53549/session86247, login200 y strictpreloadguestcontactqa20261112.cjs.
QA autorizado a iniciar tras todosloschecks; creaA/BporUI (A desde newsletter para probar
kindcontact independiente de template), solo fixturespropios y excepciones Guest/About/Settings
del cloneQA con baseline. Resendconsole, medias9081local. No mainwrites ni cache/quotaresets.


## QA aprobado y datos protegidos

Aprobación independiente exacta24fa21331cefa041396911a43c21782eaf1fc09b/producto752c791.
33casos (9editor+10captura+3locales/móvil+11lifecycle),0pageerrors/adminerrors,0defectos
abiertos y0correcciones/retests de producto duranteQA. Una tanda visual posicionada aprobada.

Selector bajoIntro, refreshsinperderedits, legacy/configuredpreviewbodyinert+CloseTab/ShiftTab
contenidos, puenteShow/Hide, ENworkingunsavedtargetES/selecciónreadonly, savedraftpublicanterior,
PublishEN4conJSONtargetexacto/titleintroGuest, Date/File/2columnasdesktop1móvil/modal-scroll/
focus-close-reopen, capturacontact+sourceguests-dual-cta aunqueAtemplateNewsletter, actualPOST
replay/alteredpayload/carrera1winner, histórico legible yconsent/adjuntometadata correctos;
independencia/compartido3ubicaciones, seiscrucesDB y amboscrucesGuest/HeaderporPOST real,
identitynodraftSave/stalepublish0capture, archiveporambossnapshots, FormSave/ApprovePTcache
sinGuestrepublish, staffTestseparadologged ynullfallbackEN/PT+CTAbooking/About/Header intactos.

QA35tablas ajenas y filasoriginalesForms/Leads/Fields/otrasPages/translations exactas, excepción
explícita solo Guest/About/Settings(+susTranslations), propiosA/B/capturas/tests yratecounters.
Ledger31exacto. FinalcloneQA Guest/Aboutpublishednull+draftnull, headernull;5propiosleads
(4Guest+1header),1stafftest,console1notificación porganador. No recepción real Resend.
Root mantiene main-conservation por separado; ninguna escritura de QA en authoredmain.


## Main integrado y apertura final

Main8aa7a2e→8b17ef7 por fast-forward después de QA; último commit solo documental
resuelve con gitlog-1. Producto src/messages/SQL idéntico al752c791 aprobado, sin cambios
de producto después deQA ni push/deploy. Trespreexistentes retenidos sinabsorber enGit:
PNGlogo y public/neoncontentlocal +public/propertylocalesqa.

Main3071PID42708/parent42702/session64963 sigueenworkspace, SINreinicio ni cacheflush.
Mismo Node22, env original exacto y REQUIRED NODE_OPTIONS=
--require=/private/tmp/central-hill-neon-content-local-copy/runtime.cjs (exclusivoDB/rol
neoncontentlocal20261111→proxy4558). Media9081PID42630/session56332 retenido. Solo elruntime
QA3084PID53549/parent53543 fue detenido después de aprobación; bases/fixtures/build/env/
cachés/worktrees/artifacts preservados.

main-open.json:5aperturas readonly200 (Guesteditor+Forms+GuestsEN/PT+AboutEN), selector
exactamentebajoOwnerIntro, null/legacyselected; modalOwnerGuest yHeader conservan contacto
anterior activo, Aboutinline igual;0pageerrors/0writesbloqueadas. No Save/Publish/Test ni
captura/fixture en main. Única mutación legítima: login local normal; catálogo y preview
privada son acciones de lectura. main-assignments.json antesfinal confirma3null intactos.

main-conservation.json posterior:44tablas negocio+ledger/1504filas EXACTAS alcheckpoint,
auth excluida por login normal.42negociosoriginales/1473filas +ratevacío +ledger31 intactos.
Envprincipal, logo y ambos symlinks exactos. No migración de producto/remoteDB/R2writes,
rolecleanup ni configuración externa. Resendconsole siguependiente de key/sender/prueba
real autorizada; ninguna entrega ni recepción real de adjuntos afirmada.
