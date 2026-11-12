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

Estado: checkpoint aprobado; contratos en preparación.
