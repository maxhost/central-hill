import { ButtonLink, Carousel, PhotoFeatureGrid, type PhotoFeatureGridItem } from "@core/ui";

/** Shared Guests catalogue layout: six photo cards per page and one listing CTA. */
export function GuestCatalogueCarousel({ items, cta, prevLabel, nextLabel }: {
  items: PhotoFeatureGridItem[];
  cta?: { href: string; label: string; note?: string };
  prevLabel: string;
  nextLabel: string;
}) {
  const slides = [];
  for (let offset = 0; offset < items.length; offset += 6)
    slides.push(<PhotoFeatureGrid
      key={items[offset]!.id ?? offset}
      items={items.slice(offset, offset + 6)}
      overlayClassName="bg-[linear-gradient(180deg,rgba(12,10,8,0.08)_0%,rgba(12,10,8,0.35)_60%,rgba(12,10,8,0.65)_100%)]"
    />);
  return (
    <>
      <Carousel slides={slides} prevLabel={prevLabel} nextLabel={nextLabel} basis={{ base: "100%" }} buttonPlacement="below" />
      {cta ? (
        <div className="mt-11 text-center">
          <ButtonLink href={cta.href}>{cta.label}</ButtonLink>
          {cta.note ? <p className="mt-4 text-[13px] text-ink-soft">{cta.note}</p> : null}
        </div>
      ) : null}
    </>
  );
}
