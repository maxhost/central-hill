/** Props every embeddable lead form accepts (S9 pages, S5 blog embed these). */
export interface LeadFormProps {
  /** Recorded as `lead.source_page` (e.g. "owners", "real-estate", "blog"). */
  source: string;
  /** Optional wrapper class for layout in the embedding section. */
  className?: string;
}
