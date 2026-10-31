# ADR 0044 — Footer office contact details

Accepted by explicit user request, 2026-10-31.

Footer displays the configured office address, bookings phone, check-in phone
and email, with phone/mail icons and localized labels in EN/PT/ES/FR.
Reuse existing Settings fields, including `checkin_phone` (migration 0018).
Its existing BO hint now mentions both Footer and About. Blank check-in values
hide that row. The pre-configuration address fallback uses the supplied address.
Configured settings take precedence; no database values are changed.

Core Footer accepts these optional presentation props and caller-supplied icons.
Existing WhatsApp and social links remain available.
No migration or database writes. Aesthetic L0: user validates on localhost,
without automated tests or QA.
