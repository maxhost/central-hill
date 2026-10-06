/**
 * "Conditions & Notes" list: small `ink-soft` lines, each led by an `accent-deep` em dash
 * (decorative, `aria-hidden`). Port of the old `.mk .notes`. Bare and presentational.
 */
export function ServiceNotes({ notes }: { notes: string[] }) {
  return (
    <ul className="max-w-[68ch] space-y-[11px]">
      {notes.map((n, i) => (
        <li key={i} className="relative pl-5 text-[14px] leading-[1.7] text-ink-soft">
          <span aria-hidden className="absolute left-0 text-accent-deep">
            —
          </span>
          {n}
        </li>
      ))}
    </ul>
  );
}
