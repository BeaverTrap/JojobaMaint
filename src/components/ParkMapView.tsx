"use client";

import { GoogleParkMap } from "@/components/GoogleParkMap";
import { ParkMap, type ParkMapProps } from "@/components/ParkMap";
import { isGoogleMapsEnabled } from "@/lib/map-geography";

/** Park map with Google Maps + ground overlay when API key is set; otherwise PNG fallback. */
export function ParkMapView(props: ParkMapProps) {
  if (isGoogleMapsEnabled()) {
    return <GoogleParkMap {...props} />;
  }
  return <ParkMap {...props} />;
}
