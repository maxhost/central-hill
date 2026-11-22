# ADR 0089 — Explicit editor feedback and client contract

2026-11-22. Status: implementation candidate; independent acceptance pending.

The Pages, Guide, Service and Blog Post editors need consistent English feedback for Save draft, Publish and uploads, while preserving each domain's draft/publication contract. The existing backoffice contract also exports server entry points. A shared feedback component must not pull those entry points into client code.

Expose the opt-in feedback catalog, types and presentation components through `backoffice/contract-client.ts`. Consumers use that public client-safe entry point; backoffice UI internals remain private. Domain validators and actions own semantic outcomes. A confirmed content commit followed by failed refresh is successful with a refresh warning; a lost transport response is uncertain. The client does not infer rollback or automatically retry content actions.

Errors are scoped by editor/entity/locale and action attempt. Only known current errors appear in summaries and language tab indicators. Save does not certify that publication requirements are resolved, and successful publication of one locale preserves known errors in other locales. Publish targets the captured locale alone, retaining revision/concurrency checks and existing shared-save semantics.

The English catalog, required markers and upload feedback are explicitly enabled for these four editor flows. Legacy consumers keep their current language, messages, requirements and queue defaults. The existing ToastProvider and media queue remain the single systems. Retry handles media only; content Save and Publish remain explicit actions. No migration, content field, auth, locale or file-limit change is introduced.

Acceptance requires focused state/validator tests, an isolated immutable local production build, independent browser/SQL evidence for each publication contract, real-byte upload faults, and compatibility checks of legacy shared consumers. Delivery stays on the isolated candidate branch; main integration, push and deployment are outside this execution's authorization.
