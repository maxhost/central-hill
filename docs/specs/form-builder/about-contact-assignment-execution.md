# About Contact — ejecución

Base estable d9c87760242d9d544bb37435575858f4447d7d3b, main. Plan aprobado por el usuario 2026-11-12: mismo formulario EN/ES/PT/FR, Resend console sin configuración externa.

Checkpoint nuevo verificado antes de editar producto: restore/about-contact-2026-11-12-1794500271340. Artefactos privados /private/tmp/central-hill-about-contact/checkpoint. Dump completo consistente: 49 tablas/1511 filas incluyendo auth y ledger, dos restores con esquema/constraints/conteos/huellas exactos: aboutcontactrestore20261112 (preservar) y aboutcontactqa20261112 (dataset aislado de QA). Archivo de código, patch, cuatro archivos/symlinks no seguidos, env y preload preservados. RESTORE.md exige preservar primero el estado posterior y restaurar código+DB juntos en checkout/base nuevos. Main DB/rol neoncontentlocal20261111, proxy4558/PG5658; main3071 PID2270. Media9081 retenido. Sin DDL de producto previsto.

Preexistentes: plan About no seguido, PNGlogo y ambos symlinks públicos. No absorber logo/symlinks en Git. No fixtures ni Save en authored main. No remoteDB/R2 writes, push/deploy, limpieza de roles/bases/cachés.

## Contratos y asignaciones

Raíz estabiliza contratos antes de delegar. Pages server-contract.ts (server-only) ofrece readAboutContactAssignment(), aboutContactAssignmentGuard(id, identity), aboutContactUsageGuard(id). Autoridad exclusiva JSON published EN; identidad publicada independiente de revision draft. Exporta forma {formId, identity}. Forms server-contract ofrece catálogo/validación general mediante alias de los helpers actuales y readAboutContactForm(locale, override?) para público/preview. PublicFormModel añade placement?: header-contact|about-contact y assignmentIdentity?:string. Leads ContactCaptureInput añade sourcePage opcional (default header-contact para compatibilidad), identidad/origen incluidos para los nuevos replays sin invalidar reintentos antiguos del header.

Worktrees aislados, base común de contratos; Node22/pnpm. Integration /private/tmp/central-hill-about-contact-integration branch about-contact/integration. A /private/tmp/central-hill-about-contact-pages branch about-contact/pages. B /private/tmp/central-hill-about-contact-forms branch about-contact/forms.

A único escritor de src/slices/pages excepto server-contract.ts y server/about-contact-assignment.ts (raíz); incluye schema opcional nullable sin default, selector debajo Subtitle, messages4, servidor editorial/preview/render, tests propios y README. Puede leer contratos Forms; no editar Forms/Leads/core. Preserve EN omitted; targets cannot alter; published authority only EN; explicit authenticated preview override unsaved EN; serialize About mutations with shared HEADER_CONTACT_LOCK using executeSerialized, preserve optimistic guards. EN publish invalidates all4 About paths/tags.

B único escritor de src/slices/forms y src/slices/leads (excepto public-types.ts y form-capture-types.ts inicialmente raíz); generalizar catálogo, readAboutContactForm y runtime about action, snapshot/replay origen, archive draft+published, cache4, tests DB/concurrencia en dataset propio. No Pages internals; use Pages server-contract. Sin core/SQL cambios.

Raíz posee docs, contratos iniciales, integración, provisión/verificación/entrega y scripts externos. Si hay cambios de contrato necesarios acordarlos con raíz. No delegación anidada. Independent QA después integración: auditoría adversarial y browser desktop/móvil + guardado/recarga/publicación solo QA DB. Plan aprobado contiene aceptación completa. Comandos reales pnpm exec tsx --test <files>, typecheck, lint, build, db:check. UI revisión agrupada, sin matriz global repetida.

Estado: entrega local completada; contratos f744299, dos implementadores aislados e independiente QA aprobados. Root confirma 44 tablas (negocio+ledger, 1504 filas) exactas tras delegación; 1331 objetos Git del archivo restaurado exactos y183 medios SHA256 inventariados. Bases schema-only separadas aboutcontactpagesqa20261112 para A y aboutcontactunitqa20261112 para B; ninguna colisión con QA browser. Ownership A ampliado solo a pages.admin.aboutContact en messages/{en,es,pt,fr}.json. ADR0081 documenta contratos y autoridad.


## Candidato integrado y comprobaciones

Contratos f744299; A a8d355b (integrado b19c5a1), B9aa1417 (integrado053a4e8).
Root17b3199 corrige guards SQL case-insensitive y lector UUID canónico: una referencia
manual válida en mayúsculas no puede eludir el bloqueo de archivo. TestDB real con
referencia uppercase, guard y lector pasa. Harness-only79cec74 (A22d0878) declara las
nuevas dependencias de preview y sigue demostrando que Owners no las invoca.
Producto estable17b3199, candidato con tests79cec74; src/messages/SQL de producto
sin cambios durante build. Logs privados en /private/tmp/central-hill-about-contact.

- A18pure+1grupoDB inicial: dos writers optimistas/uno ganador, About Publish espera
  lock de Archive y rechaza formulario archivado con snapshot fresco, draft/publicado
  separados, target JSON exacto y published_at estable ante Save draft.
- B49dominio/UI+6DB inicial, typecheck y scopedlint0.
- Root123pruebas afectadas de23archivos explícitos:0fallos/0skip en integrated-tests-final.log.
  Se ejecutan con pnpm exec tsx --tsconfig src/slices/pages/tests/tsconfig.json --test,
  incluyendo About/schema/engine/preview y Forms/layout/date/file/public/Leads.
- Root6DBForms+1DBPages finales contra la fuente integrada, usando cwd/env/preload de
  las dos bases schema-only propias:0fallos/0skip. Sin fixtures en authored main.
- pnpm lint0 (7warnings antiguos), pnpm db:check0/31migraciones (advertencia0008 antigua),
  detector UI0. pnpm typecheck0; pnpm build0/215rutas estáticas/2workers (6.7min).

Primera prueba de build falló por un symlink recursivo accidental de dependencias,
creado por ln sobre node_modules ya enlazado. Solo ese link nuevo se retiró de main
(y su copia QA); dependencias/cachés existentes conservadas. Segundo build con
node_modules local por copia clonefile: compilación/TypeScript/generación estática0.
Se usa únicamente preload de build con2workers y máximo4queries locales simultáneas,
sin cambiar next.config.ts de producto.

Exploración adicional: editorial-rollout.test.ts (Guides city_filter.note) falla
idénticamente en la base Pages anterior f744299 del worktreeB, cuyos archivos Guides
no cambiaron. Es un fallo preexistente ajeno al alcance, documentado en guide-baseline-test.log;
no se declara aprobado ni se cambia Guides para hacerlo pasar. Los6fallos iniciales
Owners preview eran mocks incompletos tras los nuevos imports; corregidos en79cec74,
7casos preview pasan y el conjunto afectado123pasa.


## QA independiente

QA funcional sobre8dee5d6 (producto17b3199):33casos (8editor+10captura+
3locales/móvil+12lifecycle),0pageerrors/adminerrors. No corrección de producto duranteQA.
Tres tandas acotadas; screenshots posicionados en una sola tanda visual desktop/móvil.
La supuesta observación de puntos suspensivos era un falso positivo del root al leer
JSON serializado por las herramientas: los8valores decodificados contienen U+2026.
El script de cambio falló en una aserción antes de escribir; git productdiff0, sin
nuevo commit ni otro build. QA confirmó los8valores U+2026 y los dos textos de carga reales en browser,0errores;
aprobación final exacta8dee5d680f84864263156c04bd95a083badaf316.

Se crearon A/B desde UI, seed solo layout9tipos/2steps/textos target del propioA;
Save draft mantiene público, PublishEN común4idiomas sin alterar JSON targets;
Date/File sobrevivientes, validación5MiB/PDFreal, capturas anónimas/contacto/About,
replay/alteración/carrera, ambos cruces de claves con header rechazados, archivo
por draft/publicado, FormSave/Approve cache sin PagePublish, histórico intacto,
staffTest separado y null/regresiones focales aprobados. No inbox/Resendreal.

QA35tablas ajenas y originalesForms/Leads/Fields/otrasPages/translations exactas,
con excepciones explícitas solo About/Settings(+susTranslations), fixturesA/B y
rate counters. Ledger31 exacto. QA termina AboutpublicadoA/draftnull y headernull,
cincoleads propios (4About+1header), unteststaff. Preservarfixtures/bases/artefactos.

Antes de apertura final, los procesos heredados3071/9081 ya no estaban activos;
root no los había detenido.9081 reabierto con el mismo script/files/env, PID42630/
session56332 y archivo existente200. Main reabierto con Node22 y el preload
actual exclusivo de neoncontentlocal20261111; ningún servidor ajeno fue detenido.


## Integración y apertura final

Main4b28638→7d11b76 por fast-forward después de QA aprobado. Commit final únicamente
documental resuelve con gitlog-1; producto src/messages/SQL exacto al17b3199, con
harness-only79cec74 y documentación posterior. Sin push/deploy.

Único actual-main dev3071 PID42708/parent42702/session64963, cwdworkspace verificado.
REQUIRED NODE_OPTIONS=--require=/private/tmp/central-hill-neon-content-local-copy/runtime.cjs
con .env.local original exacto (DB/rol neoncontentlocal20261111→proxy4558). Media9081
PID42630/session56332, mismo script y183archivos originales. ProducciónQA3083
PID42376/parent42370 detenida después de aprobación; build/env/caché/fixtures intactos.

main-open.json: Settings+Forms+Abouteditor200, selector debajo deSubtitle con opción
actual seleccionada, AboutEN/PT200 con ContactForm previo inline y en header,
0pageerrors/0writes bloqueadas. Ningún Save/Publish/Test/capture en authoredmain.
Solo login local normal y acciones GET/lectura privada catálogo/preview. Primer intento
usó locator de botón Contact inexistente; se corrigió el harness al select real de
secciones, preservando Settings ya aprobado y sin cambio de producto.

main-conservation.json posterior a apertura:44tablas negocio+ledger/1504filas exactas
respecto al snapshot (auth excluida solo por login normal). Los42negocios/1473filas
originales siguen exactos, igual que ledger31 y rate vacío; ningún dato de About,
Forms o Leads main cambiado. Env principal, logo y ambos symlinks originales exactos.
No cacheflush, nueva matriz ni datos sintéticos sobre main. Workingtree solo conserva
los3preexistentes ajenos: PNGlogo +public/neoncontentlocal +public/propertylocalesqa.

Resend sin configurar; EMAIL_PROVIDERconsole. Recepción real y adjuntos por email
siguen pendientes del hito autorizado por separado; no se enviaron correos reales.
