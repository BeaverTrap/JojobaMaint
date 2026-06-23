"use client";

import { useEffect, useMemo, useState } from "react";
import { MdPlumbing } from "react-icons/md";
import {
  AdvancedMarker,
  Map,
  Polygon,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  GOOGLE_MAP_MARKER_ANCHOR,
  MapFitBounds,
  fitMapToLatLngBounds,
} from "@/components/GoogleMapMarkers";
import { GoogleMapFrame, useGoogleMapColorScheme } from "@/components/GoogleMapFrame";
import { getPlaceIcon, getPlaceMarkerClasses } from "@/lib/map-place-icons";
import { mapPositionToLatLng } from "@/lib/map-coords";
import { isValidCoord } from "@/lib/map-edit-validation";
import {
  googleMapId,
  parkMapBoundsLiteral,
  parkMapCenter,
} from "@/lib/map-geography";
import type { MapPositions } from "@/lib/map-positions";
import { computeZoneBlobs } from "@/lib/map-zone-blobs";
import type { ParkMapProps } from "@/components/ParkMap";

const FOCUS_ZOOM_DETAIL = 18;
const FOCUS_ZOOM_SELECTION = 17;
const OVERVIEW_MAX_ZOOM = 18;
const OVERVIEW_MIN_ZOOM = 16;

function formatValveDisplay(id: string): string {
  if (!id) return "V?";
  return /^\d+$/.test(id) ? `V${id}` : id;
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
  lots: MapPositions["lots"];
  places: MapPositions["places"];
  valves: MapPositions["valves"];
  resetWhenHighlightClears: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || loading || !autoFocusHighlight) return;

    const timer = window.setTimeout(() => {
      if (highlightLot && lots[highlightLot] && isValidCoord(lots[highlightLot])) {
        map.panTo(mapPositionToLatLng(lots[highlightLot]!));
        map.setZoom(FOCUS_ZOOM_DETAIL);
        return;
      }
      if (highlightPlace && places[highlightPlace] && isValidCoord(places[highlightPlace])) {
        map.panTo(mapPositionToLatLng(places[highlightPlace]!));
        map.setZoom(FOCUS_ZOOM_DETAIL);
        return;
      }
      if (highlightValve && valves[highlightValve] && isValidCoord(valves[highlightValve])) {
        map.panTo(mapPositionToLatLng(valves[highlightValve]!));
        map.setZoom(FOCUS_ZOOM_SELECTION);
        return;
      }
      if (resetWhenHighlightClears) {
        fitMapToLatLngBounds(map, parkMapBoundsLiteral(), {
          maxZoom: OVERVIEW_MAX_ZOOM,
          minZoom: OVERVIEW_MIN_ZOOM,
        });
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
  hiddenLots: hiddenLotsProp,
  autoFocusHighlight = false,
  resetWhenHighlightClears = false,
}: ParkMapProps) {
  const [lots, setLots] = useState(initialMapData?.lots ?? {});
  const [places, setPlaces] = useState(initialMapData?.places ?? {});
  const [valves, setValves] = useState(initialMapData?.valves ?? {});
  const [hiddenLots, setHiddenLots] = useState<string[]>(
    hiddenLotsProp ?? initialMapData?.hiddenLots ?? [],
  );
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
        setHiddenLots(data.hiddenLots || []);
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

  const hiddenLotSet = useMemo(
    () => new Set(hiddenLotsProp ?? hiddenLots),
    [hiddenLotsProp, hiddenLots],
  );

  const allLotIds = useMemo(
    () => Object.keys(lots).filter((id) => !hiddenLotSet.has(id)),
    [lots, hiddenLotSet],
  );
  const allPlaceNames = Object.keys(places);
  const allValveIds = Object.keys(valves);
  const hasMarkers =
    allLotIds.length > 0 ||
    allPlaceNames.length > 0 ||
    allValveIds.length > 0;

  const hasContext =
    contextZone || contextLot || contextValve || contextValves.length > 0;
  const colorScheme = useGoogleMapColorScheme();

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-gray-700 bg-gray-900 p-8">
        <p className="text-gray-400">Loading map...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-amber-700/50 bg-gray-900 p-8">
        <p className="text-sm text-amber-200">{loadError}</p>
      </div>
    );
  }

  return (
    <div
      className={`w-full overflow-hidden rounded-lg border border-gray-700 bg-gray-900 ${fillHeight ? "flex min-h-0 flex-1 flex-col" : ""}`}
    >
      <div className={`relative ${fillHeight ? "min-h-0 flex-1" : ""}`}>
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

        <GoogleMapFrame fillHeight={fillHeight}>
          <Map
            mapId={googleMapId()}
            defaultCenter={parkMapCenter()}
            defaultZoom={OVERVIEW_MAX_ZOOM}
            gestureHandling="greedy"
            mapTypeId="roadmap"
            colorScheme={colorScheme}
            disableDefaultUI={false}
            className="h-full w-full"
            style={{ width: "100%", height: "100%" }}
            restriction={{
              latLngBounds: parkMapBoundsLiteral(),
              strictBounds: false,
            }}
          >
            <MapFitBounds
              once
              enabled={!loading}
              minZoom={OVERVIEW_MIN_ZOOM}
              maxZoom={OVERVIEW_MAX_ZOOM}
            />
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
                  paths={blob.points.map((p) => mapPositionToLatLng(p))}
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
                if (!pos || !isValidCoord(pos)) return null;
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
                    position={mapPositionToLatLng(pos)}
                    title={`Lot ${lotId}`}
                    anchorPoint={GOOGLE_MAP_MARKER_ANCHOR}
                    onClick={() => onLotClick?.(lotId)}
                  >
                    <span
                      className={`inline-flex cursor-pointer items-center justify-center rounded px-0.5 py-px text-[7px] font-bold leading-none shadow-sm touch-manipulation sm:text-[8px] ${lotClass} ${isHighlight ? "scale-110 ring-2 ring-white" : ""}`}
                    >
                      {lotId}
                    </span>
                  </AdvancedMarker>
                );
              })}

            {showPlaces &&
              allPlaceNames.map((placeName) => {
                const pos = places[placeName];
                if (!pos || !isValidCoord(pos)) return null;
                const IconComponent = getPlaceIcon(pos.icon || "MdPlace");
                const isHighlight =
                  highlightPlace != null && placeName === highlightPlace;
                return (
                  <AdvancedMarker
                    key={`place-${placeName}`}
                    position={mapPositionToLatLng(pos)}
                    title={placeName}
                    anchorPoint={GOOGLE_MAP_MARKER_ANCHOR}
                    onClick={() => onPlaceClick?.(placeName)}
                  >
                    <span
                      className={`inline-flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded-full p-0.5 shadow-sm touch-manipulation sm:h-5 sm:w-5 ${isHighlight ? "bg-blue-700 text-white ring-2 ring-white scale-110" : getPlaceMarkerClasses(pos)}`}
                    >
                      <IconComponent className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
                    </span>
                  </AdvancedMarker>
                );
              })}

            {showValves &&
              allValveIds.map((valveId) => {
                const pos = valves[valveId];
                if (!pos || !isValidCoord(pos)) return null;
                const isHighlight =
                  highlightValve != null &&
                  String(valveId) === String(highlightValve);
                const displayId = formatValveDisplay(valveId);
                return (
                  <AdvancedMarker
                    key={`valve-${valveId}`}
                    position={mapPositionToLatLng(pos)}
                    title={`Valve ${displayId}`}
                    anchorPoint={GOOGLE_MAP_MARKER_ANCHOR}
                    onClick={() => onValveClick?.(valveId)}
                  >
                    <span className="inline-flex cursor-pointer flex-col items-center touch-manipulation">
                      <span
                        className={`inline-flex h-[18px] w-[18px] items-center justify-center rounded-full p-0.5 shadow-sm sm:h-5 sm:w-5 ${isHighlight ? "bg-slate-700 text-white ring-2 ring-white" : "bg-slate-600 text-white"}`}
                      >
                        <MdPlumbing className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
                      </span>
                      <span
                        className={`mt-px rounded px-0.5 py-px text-[7px] font-bold leading-none shadow sm:text-[8px] ${isHighlight ? "bg-slate-700 text-white" : "bg-slate-700/90 text-white"}`}
                      >
                        {displayId}
                      </span>
                    </span>
                  </AdvancedMarker>
                );
              })}
          </Map>
        </GoogleMapFrame>
      </div>

      {!hasMarkers && (
        <p className="border-t border-gray-800 p-2 text-xs text-amber-300/90">
          Map loaded, but markers are missing — use{" "}
          <code className="rounded bg-gray-800 px-1">/map/edit</code> to place
          lots, places, and valves.
        </p>
      )}
      {!fillHeight && (
        <p className="border-t border-gray-800 p-2 text-[10px] text-gray-400 sm:text-xs">
          Park map with lot numbers and facility icons.{" "}
          {lotsToShow.length > 0
            ? `${lotsToShow.length} lot(s) highlighted for current search.`
            : "Select a zone, lot, or valve to highlight."}
        </p>
      )}
    </div>
  );
}
