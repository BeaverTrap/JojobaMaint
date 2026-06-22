"use client";

import { useMemo } from "react";
import { ParkMapView } from "@/components/ParkMapView";
import { buildZoneColorMap } from "@/lib/zone-colors";
import { MAP_FOCUS_SCALE_DETAIL } from "@/lib/map-viewport";
import type { SiteRecord } from "@/lib/site-types";

export default function SiteDetailMap({ site }: { site: SiteRecord }) {
  const zoneColors = buildZoneColorMap(site.zones);
  const lotZones = useMemo(
    () =>
      site.location_type === "amenity"
        ? {}
        : { [site.name]: site.zones },
    [site.name, site.zones, site.location_type],
  );

  const lotsToShow =
    site.location_type === "amenity" ? [] : [site.name];
  const highlightLot =
    site.location_type === "amenity" ? null : site.name;

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-ink">On the map</h2>
      <ParkMapView
        lotsToShow={lotsToShow}
        highlightLot={highlightLot}
        highlightPlace={
          site.location_type === "amenity" ? site.name : null
        }
        autoFocusHighlight
        focusScale={MAP_FOCUS_SCALE_DETAIL}
        contextZones={site.zones}
        lotZones={lotZones}
        zoneColors={zoneColors}
        highlightValve={site.valves[0] ?? null}
        contextZone={site.zones[0] ?? null}
        contextLot={highlightLot}
        contextValve={site.valves[0] ?? null}
        contextValves={site.valves}
        showLots={site.location_type !== "amenity"}
        showPlaces={true}
        showValves={true}
      />
    </section>
  );
}
