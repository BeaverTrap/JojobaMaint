"use client";

import { useEffect, useMemo } from "react";
import { AdvancedMarkerAnchorPoint, useMap } from "@vis.gl/react-google-maps";
import { mapPositionToLatLng } from "@/lib/map-coords";
import type { MapLatLng } from "@/lib/map-geography";
import type { MapPositions } from "@/lib/map-positions";

/** Match schematic PNG map: marker center sits on the coordinate. */
export const GOOGLE_MAP_MARKER_ANCHOR = AdvancedMarkerAnchorPoint.CENTER;

const FIT_PADDING = { top: 40, right: 40, bottom: 40, left: 40 } as const;

export function collectMapLatLngs(
  lots: MapPositions["lots"],
  places: MapPositions["places"],
  valves: MapPositions["valves"],
): MapLatLng[] {
  const out: MapLatLng[] = [];
  for (const pos of Object.values(lots)) {
    if (pos) out.push(mapPositionToLatLng(pos));
  }
  for (const pos of Object.values(places)) {
    if (pos) out.push(mapPositionToLatLng(pos));
  }
  for (const pos of Object.values(valves)) {
    if (pos) out.push(mapPositionToLatLng(pos));
  }
  return out;
}

export function MapFitBounds({
  positions,
  enabled,
  maxZoom = 18,
}: {
  positions: MapLatLng[];
  enabled: boolean;
  maxZoom?: number;
}) {
  const map = useMap();
  const key = useMemo(
    () =>
      positions
        .map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`)
        .join("|"),
    [positions],
  );

  useEffect(() => {
    if (!map || !enabled || positions.length === 0) return;

    let listener: google.maps.MapsEventListener | null = null;
    const timer = window.setTimeout(() => {
      const bounds = new google.maps.LatLngBounds();
      for (const p of positions) {
        bounds.extend(p);
      }
      map.fitBounds(bounds, FIT_PADDING);
      listener = google.maps.event.addListenerOnce(map, "idle", () => {
        const zoom = map.getZoom();
        if (zoom != null && zoom > maxZoom) {
          map.setZoom(maxZoom);
        }
      });
    }, 80);

    return () => {
      window.clearTimeout(timer);
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [map, enabled, key, positions, maxZoom]);

  return null;
}
