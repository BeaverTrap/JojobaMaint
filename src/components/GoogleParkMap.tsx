"use client";

import { useEffect, useMemo, useState } from "react";
import { MdPlumbing } from "react-icons/md";
import {
  APIProvider,
  AdvancedMarker,
  Map,
  Polygon,
  useMap,
} from "@vis.gl/react-google-maps";
import { getPlaceIcon, getPlaceColor } from "@/lib/map-place-icons";
import { PARK_MAP_IMAGE_PATH } from "@/lib/map-constants";
import {
  googleMapId,
  googleMapsApiKey,
  parkMapBoundsLiteral,
  parkMapCenter,
  percentToLatLng,
} from "@/lib/map-geography";
import type { MapPositions } from "@/lib/map-positions";
import { computeZoneBlobs } from "@/lib/map-zone-blobs";
import type { ParkMapProps } from "@/components/ParkMap";

const FOCUS_ZOOM_DETAIL = 18;
const FOCUS_ZOOM_SELECTION = 17;
const DEFAULT_ZOOM = 16;

function formatValveDisplay(id: string): string {
  if (!id) return "V?";
  return /^\d+$/.test(id) ? `V${id}` : id;
}

function ParkMapGroundOverlay({ imageUrl }: { imageUrl: string }) {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof google === "undefined") return;
    const bounds = parkMapBoundsLiteral();
    const overlay = new google.maps.GroundOverlay(imageUrl, bounds, {
      opacity: 1,
    });
    overlay.setMap(map);
    return () => {
      overlay.setMap(null);
    };
  }, [map, imageUrl]);

  return null;
}

function MapFocusController({
  loading,
  autoFocusHighlight,
  highlightLot,
  highlightPlace,
  highlightValve,
  lots,
  places,
  valves,
  resetWhenHighlightClears,
}: {
  loading: boolean;
  autoFocusHighlight: boolean;
  highlightLot: string | null | undefined;
  highlightPlace: string | null | undefined;
  highlightValve: string | null | undefined;
  lots: Record<string, { x: number; y: number }>;
  places: Record<string, { x: number; y: number }>;
  valves: Record<string, { x: number; y: number }>;
  resetWhenHighlightClears: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || loading || !autoFocusHighlight) return;

    const timer = window.setTimeout(() => {
      if (highlightLot && lots[highlightLot]) {
        const pos = lots[highlightLot]!;
        map.panTo(percentToLatLng(pos.x, pos.y));
        map.setZoom(FOCUS_ZOOM_DETAIL);
        return;
      }
      if (highlightPlace && places[highlightPlace]) {
        const pos = places[highlightPlace]!;
        map.panTo(percentToLatLng(pos.x, pos.y));
        map.setZoom(FOCUS_ZOOM_DETAIL);
        return;
      }
      if (highlightValve && valves[highlightValve]) {
        const pos = valves[highlightValve]!;
        map.panTo(percentToLatLng(pos.x, pos.y));
        map.setZoom(FOCUS_ZOOM_SELECTION);
        return;
      }
      if (resetWhenHighlightClears) {
        map.panTo(parkMapCenter());
        map.setZoom(DEFAULT_ZOOM);
      }
    }, 50);

    return () => window.clearTimeout(timer);
  }, [
    map,
    loading,
    autoFocusHighlight,
    highlightLot,
    highlightPlace,
    highlightValve,
    lots,
    places,
    valves,
    resetWhenHighlightClears,
  ]);

  return null;
}

function rgbaToPolygonColors(rgba: string): { fillColor: string; fillOpacity: number } {
  const match = rgba.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i,
  );
  if (!match) return { fillColor: "#f59e0b", fillOpacity: 0.28 };
  const [, r, g, b, a] = match;
  const fillOpacity = a ? Number(a) : 1;
  const fillColor = `#${[r, g, b]
    .map((v) => Number(v).toString(16).padStart(2, "0"))
    .join("")}`;
  return { fillColor, fillOpacity };
}

export function GoogleParkMap({
  lotsToShow = [],
  highlightLot = null,
  contextZones = [],
  lotZones = {},
  zoneColors = {},
  highlightValve = null,
  highlightPlace = null,
  onLotClick,
  onPlaceClick,
  onValveClick,
  showLots = true,
  showPlaces = true,
  showValves = true,
  fillHeight = false,
  contextZone = null,
  contextLot = null,
  contextValve = null,
  contextValves = [],
  initialMapData,
  autoFocusHighlight = false,
  resetWhenHighlightClears = false,
}: ParkMapProps) {
  const [lots, setLots] = useState(initialMapData?.lots ?? {});
  const [places, setPlaces] = useState(initialMapData?.places ?? {});
  const [valves, setValves] = useState(initialMapData?.valves ?? {});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialMapData);

  useEffect(() => {
    if (initialMapData) return;
    fetch("/api/map")
      .then((res) => {
        if (!res.ok) throw new Error(`Map data failed (${res.status})`);
        return res.json();
      })
      .then((data: MapPositions) => {
        setLots(data.lots || {});
        setPlaces(data.places || {});
        setValves(data.valves || {});
        setLoading(false);
      })
      .catch((err: Error) => {
        setLoadError(err.message);
        setLoading(false);
      });
  }, [initialMapData]);

  const highlightSet = new Set(lotsToShow.map((id) => String(id)));
  const hasZoneColors =
    Object.keys(zoneColors).length > 0 && Object.keys(lotZones).length > 0;

  const zoneBlobs = useMemo(
    () =>
      computeZoneBlobs({
        lotsToShow,
        lots,
        lotZones,
        contextZones,
        contextZone,
        zoneColors,
      }),
    [lotsToShow, lots, lotZones, contextZones, contextZone, zoneColors],
  );

  const allLotIds = Object.keys(lots);
  const allPlaceNames = Object.keys(places);
  const allValveIds = Object.keys(valves);
  const hasMarkers =
    allLotIds.length > 0 ||
    allPlaceNames.length > 0 ||
    allValveIds.length > 0;

  const hasContext =
    contextZone || contextLot || contextValve || contextValves.length > 0;

  const apiKey = googleMapsApiKey();
  if (!apiKey) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center rounded-lg border border-amber-700/50 bg-gray-900 p-8">
        <p className="text-sm text-amber-200">
          Google Maps API key is not configured.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center rounded-lg border border-gray-700 bg-gray-900 p-8">
        <p className="text-gray-400">Loading map...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center rounded-lg border border-amber-700/50 bg-gray-900 p-8">
        <p className="text-sm text-amber-200">{loadError}</p>
      </div>
    );
  }

  const mapHeightClass = fillHeight
    ? "h-full min-h-0 flex-1"
    : "min-h-[55dvh] w-full sm:min-h-[28rem]";

  return (
    <div
      className={`w-full overflow-hidden rounded-lg border border-gray-700 bg-gray-900 ${fillHeight ? "flex min-h-0 flex-1 flex-col" : ""}`}
    >
      <div className={`relative ${mapHeightClass}`}>
        {hasContext && (
          <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col gap-1 rounded-lg border border-gray-600 bg-gray-900/95 px-3 py-2 shadow-lg backdrop-blur-sm">
            {contextZone && (
              <span className="text-sm font-semibold text-amber-400">
                Zone {contextZone}
              </span>
            )}
            {contextLot && (
              <span className="text-sm font-medium text-blue-300">
                Lot {contextLot}
              </span>
            )}
            {contextValve && (
              <span className="text-sm font-medium text-slate-300">
                Valve {formatValveDisplay(contextValve)}
              </span>
            )}
            {contextValves.length > 0 && (
              <span className="text-sm font-medium text-slate-300">
                Valves:{" "}
                {contextValves.map((id) => formatValveDisplay(id)).join(", ")}
              </span>
            )}
          </div>
        )}

        <APIProvider apiKey={apiKey} libraries={["marker"]}>
          <Map
            mapId={googleMapId()}
            defaultCenter={parkMapCenter()}
            defaultZoom={DEFAULT_ZOOM}
            gestureHandling="greedy"
            mapTypeId="satellite"
            disableDefaultUI={false}
            className="h-full w-full"
            style={{ width: "100%", height: "100%" }}
            restriction={{
              latLngBounds: parkMapBoundsLiteral(),
              strictBounds: false,
            }}
          >
            <ParkMapGroundOverlay imageUrl={PARK_MAP_IMAGE_PATH} />
            <MapFocusController
              loading={loading}
              autoFocusHighlight={autoFocusHighlight}
              highlightLot={highlightLot}
              highlightPlace={highlightPlace}
              highlightValve={highlightValve}
              lots={lots}
              places={places}
              valves={valves}
              resetWhenHighlightClears={resetWhenHighlightClears}
            />

            {zoneBlobs.map((blob, i) => {
              const { fillColor, fillOpacity } = rgbaToPolygonColors(blob.fill);
              return (
                <Polygon
                  key={`zone-${i}`}
                  paths={blob.points.map((p) => percentToLatLng(p.x, p.y))}
                  fillColor={fillColor}
                  fillOpacity={fillOpacity}
                  strokeColor="rgba(255,255,255,0.35)"
                  strokeWeight={1}
                  clickable={false}
                />
              );
            })}

            {showLots &&
              allLotIds.map((lotId) => {
                const pos = lots[lotId];
                if (!pos) return null;
                const zones = lotZones[lotId] ?? [];
                const zone =
                  contextZones.length > 0
                    ? (contextZones.find((z) => zones.includes(z)) ?? zones[0])
                    : zones[0];
                const colors = zone && zoneColors[zone];
                const isHighlight =
                  highlightLot != null && String(lotId) === String(highlightLot);
                const isInSearch = highlightSet.has(String(lotId));
                let lotClass = "bg-black/75 text-white";
                if (hasZoneColors && isInSearch && colors) {
                  lotClass = isHighlight ? colors.highlight : colors.base;
                } else if (isHighlight) {
                  lotClass = "bg-blue-800 text-white ring-2 ring-white";
                } else if (isInSearch) {
                  lotClass = "bg-amber-600/90 text-white";
                }

                return (
                  <AdvancedMarker
                    key={`lot-${lotId}`}
                    position={percentToLatLng(pos.x, pos.y)}
                    title={`Lot ${lotId}`}
                    onClick={() => onLotClick?.(lotId)}
                  >
                    <span
                      className={`inline-flex cursor-pointer items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold leading-none shadow-md touch-manipulation ${lotClass} ${isHighlight ? "scale-110 ring-2 ring-white" : ""}`}
                    >
                      {lotId}
                    </span>
                  </AdvancedMarker>
                );
              })}

            {showPlaces &&
              allPlaceNames.map((placeName) => {
                const pos = places[placeName];
                if (!pos) return null;
                const IconComponent = getPlaceIcon(pos.icon || "MdPlace");
                const isHighlight =
                  highlightPlace != null && placeName === highlightPlace;
                return (
                  <AdvancedMarker
                    key={`place-${placeName}`}
                    position={percentToLatLng(pos.x, pos.y)}
                    title={placeName}
                    onClick={() => onPlaceClick?.(placeName)}
                  >
                    <span
                      className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full p-1.5 shadow-md touch-manipulation ${isHighlight ? "bg-blue-700 text-white ring-2 ring-white scale-110" : getPlaceColor(pos.icon ?? "MdPlace")}`}
                    >
                      <IconComponent className="h-4 w-4 shrink-0" />
                    </span>
                  </AdvancedMarker>
                );
              })}

            {showValves &&
              allValveIds.map((valveId) => {
                const pos = valves[valveId];
                if (!pos) return null;
                const isHighlight =
                  highlightValve != null &&
                  String(valveId) === String(highlightValve);
                const displayId = formatValveDisplay(valveId);
                return (
                  <AdvancedMarker
                    key={`valve-${valveId}`}
                    position={percentToLatLng(pos.x, pos.y)}
                    title={`Valve ${displayId}`}
                    onClick={() => onValveClick?.(valveId)}
                  >
                    <span className="inline-flex cursor-pointer flex-col items-center touch-manipulation">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full p-1.5 shadow-md ${isHighlight ? "bg-slate-700 text-white ring-2 ring-white" : "bg-slate-600 text-white"}`}
                      >
                        <MdPlumbing className="h-4 w-4 shrink-0" />
                      </span>
                      <span
                        className={`mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold leading-none shadow ${isHighlight ? "bg-slate-700 text-white" : "bg-slate-700/90 text-white"}`}
                      >
                        {displayId}
                      </span>
                    </span>
                  </AdvancedMarker>
                );
              })}
          </Map>
        </APIProvider>
      </div>

      {!hasMarkers && (
        <p className="border-t border-gray-800 p-2 text-xs text-amber-300/90">
          Map image loaded, but lot markers are missing — check that{" "}
          <code className="rounded bg-gray-800 px-1">data/map-positions.json</code>{" "}
          is deployed.
        </p>
      )}
      {!fillHeight && (
        <p className="border-t border-gray-800 p-2 text-[10px] text-gray-400 sm:text-xs">
          Lot numbers and facility icons on the map.{" "}
          {lotsToShow.length > 0
            ? `${lotsToShow.length} lot(s) highlighted for current search.`
            : "Select a zone, lot, or valve to highlight."}
        </p>
      )}
    </div>
  );
}
