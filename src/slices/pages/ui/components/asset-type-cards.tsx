import type { ReactNode } from "react";
import { ButtonLink, SectionHead } from "@core/ui";

export type AssetTypeCard = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  image: ReactNode;
};

/** The Real Estate asset section: six photo-backed cards within the established page shell. */
export function AssetTypeCards({
  headline,
  body,
  items,
  cta,
  preview = false,
}: {
  headline: string;
  body?: string;
  items: AssetTypeCard[];
  cta?: { label: string; note?: string };
  preview?: boolean;
}) {
  return (
    <section className="py-[70px]">
      <div className="mx-auto max-w-[1240px] px-[28px]">
        <SectionHead
          align="center"
          headline={headline}
          intro={body || undefined}
        />
        <ul
          className="grid list-none gap-5 min-[681px]:grid-cols-2 min-[981px]:grid-cols-3"
          {...(preview
            ? { "data-editor-binding": "asset_management.benefits" }
            : {})}
        >
          {items.map((item) => (
            <li
              key={item.id}
              className="relative isolate flex min-h-[360px] flex-col overflow-hidden rounded-[6px] bg-feature p-7"
            >
              {item.image}
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/75 to-ink/15"
              />
              <div className="mt-auto pt-24">
                <div className="mb-4 text-feature-accent">{item.icon}</div>
                <h3 className="text-xl font-semibold leading-tight text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-[14.5px] leading-[1.65] text-on-feature">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
        {cta?.label ? (
          <div className="mt-8 text-center">
            <ButtonLink href="#deal-enquiry">{cta.label} →</ButtonLink>
            {cta.note ? (
              <p className="mt-3 text-sm text-ink-soft">{cta.note}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
