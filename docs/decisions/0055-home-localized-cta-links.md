# ADR0055 — Localized Home CTA links and annotated CTA labels

2026-11-05. Accepted for the user's Home button request.

## Context

Home's hero primary and guests-pitch destinations were shared fields; the closing
guest panel had a fixed Avantio target. Staff now need label and target per locale
and direct selection of all three buttons in the private preview.

## Decision

Home declares these three URL leaves locale-specific within its existing complete
per-locale JSON snapshots (ADR0040). Existing paths stay intact; the closing guest
URL is optional and falls back to localized Avantio when absent/blank. Only HTTP(S)
destinations are accepted. No migration, backfill or kernel validation changes.

Add optional `editorBinding` to ButtonLink and the CTA props consumed by
TwoColumnShowcase/DualCtaPanels. It forwards `data-editor-binding` to the actual
anchor, so the whole button (including padding or an empty label) is selectable.
Pages supplies the value only in private previews; normal callers omit it. Core
does not know editor IDs, persistence, authentication or locale policy.

## Consequences

Existing callers retain identical output. Pages owns selection and URL semantics.
The editor presents label and URL together for the requested Home buttons, using
the existing independent Save draft/Publish lifecycle. Other Pages, navbar booking
and fixed Owners targets are unchanged. Preview never writes content.
