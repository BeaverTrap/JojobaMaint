"use client";

import { useMemo } from "react";
import { ParkMap } from "@/components/ParkMap";
import { buildZoneColorMap } from "@/lib/zone-colors";

export default function LotDetailMap({
  lotNumber,
  zones,
  valves,
}: {
  lotNumber: string;
  zones: string[];
  valves: string[];
}) {
  const zoneColors = buildZoneColorMap(zones);
  const lotZones = useMemo(
    () => ({ [lotNumber]: zones }),
    [lotNumber, zones],
  );

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-ink">On the map</h2>
      <ParkMap
        lotsToShow={[lotNumber]}
        highlightLot={lotNumber}
        contextZones={zones}
        lotZones={lotZones}
        zoneColors={zoneColors}
        highlightValve={valves[0] ?? null}
        contextZone={zones[0] ?? null}
        contextLot={lotNumber}
        contextValve={valves[0] ?? null}
        contextValves={valves}
      />
    </section>
  );
}
