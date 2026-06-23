"use client";

import { useEffect, useRef } from "react";
import { AdvancedMarkerAnchorPoint, useMap } from "@vis.gl/react-google-maps";
import { isGeoCoords, mapPositionToLatLng } from "@/lib/map-coords";
import { isValidCoord } from "@/lib/map-edit-validation";
import type { MapLatLng, MapLatLngBounds } from "@/lib/map-geography";
import { parkFocusBoundsLiteral } from "@/lib/map-geography";
import type { MapPositions } from "@/lib/map-positions";

/** Match schematic PNG map: marker center sits on the coordinate. */
export const GOOGLE_MAP_MARKER_ANCHOR = AdvancedMarkerAnchorPoint.CENTER;

const DEFAULT_FIT_PADDING = { top: 24, right: 24, bottom: 24, left: 24 } as const;
/** Legacy %-based lots above this x sit in far-east amenities — omit from startup frame. */
const FOCUS_MAX_PERCENT_X = 82;
const FOCUS_BOUNDS_PADDING_DEG = 0.0012;

export function computeLotFocusBounds(
  lots: MapPositions["lots"],
): MapLatLngBounds | null {
  const lngs: number[] = [];
  const lats: number[] = [];

  for (const pos of Object.values(lots)) {
    if (!pos || !isValidCoord(pos)) continue;
    if (!isGeoCoords(pos) && pos.x > FOCUS_MAX_PERCENT_X) continue;
    const { lat, lng } = mapPositionToLatLng(pos);
    lngs.push(lng);
    lats.push(lat);
  }

  if (lngs.length < 3) return null;

  return {
    north: Math.max(...lats) + FOCUS_BOUNDS_PADDING_DEG,
    south: Math.min(...lats) - FOCUS_BOUNDS_PADDING_DEG,
    east: Math.max(...lngs) + FOCUS_BOUNDS_PADDING_DEG,
    west: Math.min(...lngs) - FOCUS_BOUNDS_PADDING_DEG,
  };
}

export function collectMapLatLngs(
  lots: MapPositions["lots"],
  places: MapPositions["places"],
  valves: MapPositions["valves"],
): MapLatLng[] {
  const out: MapLatLng[] = [];
  for (const pos of Object.values(lots)) {
    if (pos && isValidCoord(pos)) out.push(mapPositionToLatLng(pos));
  }
  for (const pos of Object.values(places)) {
    if (pos && isValidCoord(pos)) out.push(mapPositionToLatLng(pos));
  }
  for (const pos of Object.values(valves)) {
    if (pos && isValidCoord(pos)) out.push(mapPositionToLatLng(pos));
  }
  return out;
}

function toGoogleBounds(
  bounds: MapLatLngBounds,
): google.maps.LatLngBounds {
  return new google.maps.LatLngBounds(
    { lat: bounds.south, lng: bounds.west },
    { lat: bounds.north, lng: bounds.east },
  );
}

export function fitMapToLatLngBounds(
  map: google.maps.Map,
  bounds: MapLatLngBounds,
  options?: {
    padding?: number | google.maps.Padding;
    maxZoom?: number;
    minZoom?: number;
  },
): void {
  const padding = options?.padding ?? DEFAULT_FIT_PADDING;
  map.fitBounds(toGoogleBounds(bounds), padding);

  google.maps.event.addListenerOnce(map, "idle", () => {
    const zoom = map.getZoom();
    if (zoom == null) return;
    if (options?.maxZoom != null && zoom > options.maxZoom) {
      map.setZoom(options.maxZoom);
    }
    if (options?.minZoom != null && zoom < options.minZoom) {
      map.setZoom(options.minZoom);
    }
  });
}

type MapFitBoundsProps = {
  /** Geographic rectangle to frame (default: main resort focus). */
  bounds?: MapLatLngBounds;
  /** When true, only fit once on load — map won't reset while editing markers. */
  once?: boolean;
  enabled?: boolean;
  maxZoom?: number;
  minZoom?: number;
};

/** Frames the map to a fixed geographic area. Does not track marker positions. */
export function MapFitBounds({
  bounds = parkFocusBoundsLiteral(),
  once = false,
  enabled = true,
  maxZoom,
  minZoom,
}: MapFitBoundsProps) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (!map || !enabled) return;
    if (once && hasFittedRef.current) return;

    const timer = window.setTimeout(() => {
      fitMapToLatLngBounds(map, bounds, { maxZoom, minZoom });
      hasFittedRef.current = true;
    }, 80);

    return () => window.clearTimeout(timer);
  }, [map, enabled, once, bounds, maxZoom, minZoom]);

  return null;
}
