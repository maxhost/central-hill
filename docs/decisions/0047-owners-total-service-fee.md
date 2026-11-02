# ADR 0047 — Owners total service fee

Accepted: explicit user request with visual reference, 2026-10-31.

PricingCards accepts an optional localized live summary, replacing its static
footer on Owners. Following the user's visual correction, keep the previous
CalloutBand's warm tinted background, accent border,10px corners, shadow,
spacing, serif typography and standard primary ButtonLink. Total / Service fee
appears on the left, an empty-state prompt or percentage in the center, and the
CTA on the right. Below681px the CTA moves beneath the first two columns.
The user's subsequent compact layout request narrows the summary to
the last two desktop cards, aligned right, including their intervening gap.
Padding is24px and the standard button uses size sm. On mobile the summary
retains the available width. This supersedes the
reference image's white surface and dark pill button.

The displayed corner_badge percentages are authoritative: current Core10%,
Prime14%, Manage+5%, Complete+9%. Sum the selected base plus selected independent
extras; changes update a polite live region. Without selection show the prompt.
Missing/invalid selected percentages show unavailable copy, never an invented
zero. Do not use the hidden legacy commission field. Percentage parsing accepts
an optional plus, spaces, period/comma decimals and a percent sign (0–100).
Sum integer hundredths of a percentage point and localize the output.

Keep the existing helper CTA label with the localized fallback. ADR0048 later
replaces the #worth link with a modal containing the same earnings wizard.
The previous helper title/body remain stored but
are no longer rendered. No persistence, schema migration or database writes.
