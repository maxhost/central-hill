import type { Locale } from "@core/db/columns";
import { Container } from "@core/ui";
import { RichTextBody, headingIds } from "@slices/blog/rich-text-render-contract";
import type { PageResult } from "../contract";
import type { LegalPageContent, LegalPageKey } from "../legal-page-content";

/** Text-only public document; shared navbar/footer are supplied by the locale layout. */
export function LegalPage({ pageKey, locale, page, preview = false }: {
  pageKey: LegalPageKey;
  locale: Locale;
  page: PageResult<LegalPageContent>;
  preview?: boolean;
}) {
  const { title, body } = page.content;
  return (
    <section data-legal-page={pageKey} data-locale={locale} className="bg-bg pb-20 pt-[120px] md:pb-28 md:pt-[144px]">
      <Container>
        <div className="mx-auto max-w-[68ch]">
          <h1 data-editor-binding={preview ? "title" : undefined} className="mb-10 min-h-[1em] text-balance font-serif text-4xl leading-tight text-ink md:mb-14 md:text-5xl">
            {title}
          </h1>
          <article data-legal-body data-editor-binding={preview ? "body" : undefined} className="min-h-24">
            <RichTextBody body={body} media={{}} ids={headingIds(body)} bulletIcon="check" />
          </article>
        </div>
      </Container>
    </section>
  );
}
