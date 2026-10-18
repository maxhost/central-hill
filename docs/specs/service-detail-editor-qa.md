# Servicios individuales — QA independiente aprobada

Fecha: 2026-10-18. Código final aprobado: `9faffe95789d31984c69b03b00d6af0ded03fec0`.
Savepoint anterior: `a1107f8`, etiqueta `savepoint/pre-service-detail-editor-2026-10-18`.
No quedan bloqueantes de producto. La aprobación cubre el candidato local, sin despliegue.

## Verificación integrada del orquestador

Desde `/private/tmp/central-hill-service-detail-integration`, Node22.23.3/pnpm10.8.0,
entorno ficticio propio. Secuencia con `set -e`: typecheck, lint, suite explícita de
240tests reales, db:check y pnpm build; todos exit0 sobre código9faffe9. Logs final-*.log
en `/private/tmp/central-hill-service-detail-qa`. Comandos explícitos de suites en la spec;
se añadió `src/core/i18n/tests/actor-attribution.test.ts` por ADR0036.

Lint5warnings y db0008 breakpoint son previos. Build normal Turbopack generó134páginas.
Dependencias instaladas offline desde lockfile,466paquetes de caché/0descargas, sin cambiar
manifests. Adaptador exclusivamente QA limitó2requestsNeon/proceso para no agotar el
PostgreSQLlocal; no workaround de aplicación/configuración de producción.

Import/ownership review manual: nuevos imports de otros slices por contract; kernel
limitado a ADR0036 y orquestador. No contar placeholders test/boundary ni afirmar CI automático.
Migraciones0019/0020 verificadas en DBs locales vacías/previas y preservación de datos/actor.

A continuación se conserva el informe independiente y su apéndice de retest. La sección
inicial describe el estado histórico antes de corregir AC18; el apéndice final lo cierra.
Errores de fixtures/extractores están diferenciados de los defectos de producto.

---

# Independent QA — service detail editor

Candidate reviewed: cbc65473f0c9d734f47d86a5d3693e7a70c63364, branch service-detail/integration, cwd /private/tmp/central-hill-service-detail-integration. Application code not edited by QA. All scripts/assets/reports created in this temporary QA directory; writes restricted to the dedicated local DB/bucket and synthetic fixtures.

Status after initial round: **not approved pending AC18 corrections/retest**. One grouped product issue confirmed: long mobile booking bar overlaps WhatsApp and obscures footer copyright/language at maximum scroll. No other product defect confirmed.

Environment: Node22.23.3, pnpm10.8.0; production app127.0.0.1:3059, PostgreSQL servicedetailqa5558, Neon proxy4458, S3rver9058/bucketservicedetailqa. StaffUUID55555555-5555-4555-8555-555555555558 and textual servicedetail-text-staff, plus authenticated nonstaff fixture. No remote login, production DB/media, repository changes, deployment or push.

## Findings requiring correction

F1 / P2 / AC18: /en/services/qa-long-mobile-label, viewport390x960, requestShort80chars. Label: `Reservar esta experiencia privada y solicitar disponibilidad para nuestra estancia`.slice(0,80). Bar box x0 y825.4375 width390 height134.5625. WhatsApp box x314 y808 width56 height56. Intersection38.5625px, barz55 coversFABz50. service-mobile-bar.tsx hardcodes --fab-lift76px. At page bottom, copyright/language lie underneath the same fixed bar and cannot be reached by further scrolling. Repro script qa-mobile-long.cjs; screenshots qa-mobile-long-cta.png and qa-mobile-long-footer.png. Initial footer-link extractor erroneously returned PASS on no matching legal links; this is not accepted evidence. Copyright/language assertions replace it for retest.

## Executed checks

Scripts run with /Users/maxi/.nvm/versions/node/v22.23.3/bin/node; browser launched via Playwright against only127.0.0.1. Evidence lines in qa-results.jsonl.

- qa-inspect.cjs exit0: anonymous admin→login, UUIDlogin200, actual no-op saveSaved, captured real ServerAction and payload; baseline editor screenshot.
- qa-baseline.cjs exit0: ten seed-derived synthetic service patterns, four locales each (40SSR/browser checks), expected itinerary/options/rates/partners presence, h1/alternates, no horizontal overflow; ten actual no-op saves preserve presentationNULL and zero copy overrides. Mobile public captures Chef/Sintra/Surf.
- qa-actions.cjs exit0: eight combinations of included/itinerary/options; seven modules hidden and reactivated with sourceJSON unchanged and previously-approved complete targetdetailJSON inPT/ES/FR; independent pricing/extras/partners and no dead#partnersCTA; auto/from/on_request/hidden, zero and3550, monetary-note suppression; external/enquiry/none mobilelabel differentiation and single decorative arrow; seven iconoverrideSVG instances and restoring presentationNULL; approved/draft/missing copy fallbacks, invalid placeholder fallback, clearing overrides removes targets, omitted copy preserves; omitted presentation still enforces persistedtrue minima; negative/overlimit/fractional cents rejected before writes; nonexistent media refs rejected across4surfaces; slug conflict leaves row unchanged; UUID/textual actual source writes and attribution; invalid stored detail/presentation reject save (UI disabled for corruptdetail); SEOtitle/canonical/hreflang/OG in4locales and404; anonymous action no mutation.
- qa-copy-only.cjs exit0: corrected extractor observes **38/38 copy overrides** across service/experience, enquiry/none, from/onrequest, including breadcrumbnavARIA and bookingasideARIA. Photos dialog title/close verified with real open/close. The original qa-actions extractor reported37/38 because it inspected text/aside labels but omitted navARIA; code already rendered breadcrumbLabel correctly. This was a harness defect, not an app defect.
- qa-ui.cjs exit0: actual checkboxhide→save→reload→reactivate→save→reload→automatic; invalid itinerarytitle remains in hiddenblock, opens on save with aria-invalid and focus; discard restores only section and preserves unrelated Name/visibility; UI decimal35,50/35.50/zero/max exact persistence and invalid negative/exponent/thirddecimal/overflow retention; ownformlink confirm dismissed, beforeunload cancellation; realJPEGuploads cover/gallery/OG/itinerarythumbnail save/reload and localS3object existence for cover/OG; editor1440x960/390x960 no horizontaloverflow, named controls, checkboxkeyboard.
- qa-extra.cjs exit0: actual translationUI targetsave/approve using textualstaff, canonical actor exact text and legacyUUIDnull, approvedtarget h1 visible; temporary galleryinserttrigger causes real partialsave, errorfeedback withoutSaved, formvalue retained, SSR reflects partialname after invalidation, recovery saves; trigger/function removed in finally; legacynotes visible→hidden; application/pdf media rejected before writes on4surfaces; authenticatednonstaff login200 but action denied/no row mutation and adminredirect.
- qa-cache.cjs final exit0: created synthetic Home via existing savePage action (prior Home absent), then warmed Home/list/detail caches, saved serviceName, verified all three SSRresponses immediately contain newName and omit oldName without serverrestart/cachecleanup. Backup qa-home-backup.json records priorabsence. First attempt failed because noHome existed; second attempted relativeCTA URLs which existingHome schema rejected. Correct absoluteURLs permit fixture and final ISRcheckPASS. These fixture failures are not product defects.
- qa-final-cases.cjs final exit0: approvedrelatedTitle201chars falls back independently to valid source while validenquiryTitle interpolates localizedapprovedname; deliberate localS3PUTabort reports failure, keeps changedformName, and leaves persistedcover unchanged. Initial harness expected sourceName but SpanishName had been approved earlier; expected localizedh1 fixed, no product fix.
- qa-mobile-long.cjs initial currentproduct reproduces F1FAIL. Initial81char requestShort rejected correctly; fixture reduced to allowed80chars. FooterNoLegalLinksPASS excluded as noted.

Root-provided verification evidence reviewed separately: integrated240tests/typecheck/lint/dbcheck passed. Root pnpm build final exit0 generated114pages after QA-only transportthrottle; first build symlinkissue resolved by installing actual cachedlockeddeps; initial prerender proxy500 traced by QA to PostgreSQLmaxclients. Temporarypreload limits localNeonfetch2perprocess, no retries; concurrency-probe100queries exit0 allIsolatedtrue. No applicationcode workaround. MigrationAC19 commands exited0 in separate servicedetailmigrationqa: schema0000–0018 emptyDB; existingservice3550/slug preserved by0019 with presentationNULL; legacyUUIDactor preserved by0020 with canonicalnewcolumnNULL. SQLfiles migration-preservation.sql and migration-actor-preservation.sql retain assertions.

## Limits and remaining work

- Await integrated correction candidate, affected checks, rebuild and AC18retest before QAapproval.
- Actual uploadbytes exercised JPEG. MIME guards also exercised nonexistentrefs and actualPDF-mimeDBfixture. This round does not claim browserupload of every supportedformat or animation-frameinspection.
- All38 copy overrides were persisted and observed as rendered tokens/ARIA in applicable contexts; mapping was additionally read in renderer. This is not38separate pixelcomparisons.
- ConsumerISRHome needed a synthetic configuredHome because fixtureDB initially lackedHome; initial404 was environmental.
- No LLMprovider generation or remote deployment tested; authored/approved targetfixtures exercise the existing gating path.

## Final correction retest and QA approval

Final code candidate: **9faffe95789d31984c69b03b00d6af0ded03fec0**. Root integrated grouped mobile fixes652c98b/3fb889c and media-alt/EURcopy changes, then reported fresh typecheck/lint/240tests/dbcheck/normalbuild all exit0 (134pages); production3059 restarted on that candidate. QA verified HEAD9faffe95789d31984c69b03b00d6af0ded03fec0 and read corrected component/messages before retest. Root-owned documentation edits remained outside QA writes.

Final `node /private/tmp/central-hill-service-detail-qa/qa-mobile-long.cjs` **exit0**:

-390x960 with80charlabel: measuredbar134.5625px; rootinline--fab-lift135px; bodypadding-bottom135px. Bar top825.4375, FABtop749/bottom805; no intersection.
-Atmaximumscroll copyrightbox y725.296875,height16 and localecontrol y753.296875,height36, both abovebar825.4375 and reachable. Screenshot qa-mobile-long-footer.png visually inspected.
-Resize1440x960: bodypadding0px and rootinline--fab-lift empty.
-Return390 then actual SPAclick breadcrumbServices: barunmounted, bodypadding0px, rootinline--fab-lift empty after effectcleanup.
-ActualBO hintvisible: altmanaged/sharedinMedia; EURhint `Enter euros, for example 35.50.` without technicalstoragecopy. All4locale messagekeys independently read.

Retest-harness corrections: first hintselector saw both sr-onlydescription and visibleparagraph, so selector narrowed; another immediateURL-based assertion ran before Reacteffectcleanup, so final script waits for the effect's observable cleanup state. Final run above passes with no application changes during retest. Earlier FAILlines remain in JSONL for transparency; final statuses supersede those harness runs.

**QA APPROVED for local integration of final code candidate9faffe95789d31984c69b03b00d6af0ded03fec0**, with the scope/limits above. F1closed; no unresolved blocking product findings. This approval does not authorize push/deployment/remote migrations. Evidence beforefix retained as qa-mobile-long-cta-before.png and qa-mobile-long-footer-before.png; final images use unsuffixed filenames. No test scripts remain running; the dedicated DB/proxy/S3 infrastructure remains available. The temporary failure trigger/function were removed.
