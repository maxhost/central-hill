"use client";

import { useState, type ReactNode } from "react";
import { ChipBar } from "@core/ui";
import { initialListingCity, selectListingCity, type ListingCityChoice } from "../listing-presentation";

/** Server-rendered cards remain in HTML; selection only controls their containing panels. */
export function GuidesCityFilter({ cities, label, note, soonLabel, icon, panels, empty }: {
  cities: ListingCityChoice[];
  label: string; note?: string; soonLabel: string; icon: ReactNode;
  panels: { cityId: string; guides: ReactNode; recommendations: ReactNode }[];
  empty: ReactNode;
}) {
  const [selected, setSelected] = useState(() => initialListingCity(cities));
  return <>
    <ChipBar label={label} note={note}
      className="[&_.whitespace-nowrap]:max-w-full [&_.whitespace-nowrap]:whitespace-normal [&_.whitespace-nowrap]:[overflow-wrap:anywhere] [&_button]:max-w-full [&_button]:[overflow-wrap:anywhere]"
      items={cities.map((city) => ({
      key: city.key, label: city.label, active: city.available && city.key === selected,
      soon: !city.available, soonLabel, icon: city.available ? icon : undefined,
    }))} onSelect={(key) => setSelected((current) => selectListingCity(current, key, cities))} />
    {selected === null ? empty : null}
    {panels.map((panel) => <div key={panel.cityId} hidden={panel.cityId !== selected} data-guides-city={panel.cityId}>
      {panel.guides}{panel.recommendations}
    </div>)}
  </>;
}
