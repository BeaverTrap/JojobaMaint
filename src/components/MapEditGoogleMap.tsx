"use client";

import { useEffect, useRef } from "react";
import { MdPlumbing } from "react-icons/md";
import {
  AdvancedMarker,
  Map,
  type MapMouseEvent,
  useMap,
} from "@vis.gl/react-google-maps";
import { GoogleMapFrame, useGoogleMapColorScheme } from "@/components/GoogleMapFrame";
import { GOOGLE_MAP_MARKER_ANCHOR, MapFitBounds } from "@/components/GoogleMapMarkers";
import { getPlaceIcon, getPlaceMarkerClasses } from "@/lib/map-place-icons";
import { isValidCoord } from "@/lib/map-edit-validation";
import {
  formatMapPosition,
  latLngToMapPosition,
  mapPositionToLatLng,
} from "@/lib/map-coords";
import {
  googleMapId,
  parkMapBoundsLiteral,
  parkMapCenter,
} from "@/lib/map-geography";
import type { MapPositions } from "@/lib/map-positions";

type MapEditGoogleMapProps = {
  lots: MapPositions["lots"];
  places: MapPositions["places"];
  valves: MapPositions["valves"];
  lotIds: string[];
  placeNames: string[];
  valveIdsOnMap: string[];
  mode: "lots" | "places" | "valves";
  selectedLot: string | null;
  selectedLotIds?: ReadonlySet<string>;
  selectedPlace: string | null;
  selectedPlaceIds?: ReadonlySet<string>;
  selectedValve: string | null;
  selectedValveIds?: ReadonlySet<string>;
  onPlaceCoords: (coords: { x: number; y: number }) => void;
  onMoveLot: (lotId: string, coords: { x: number; y: number }) => void;
  onMovePlace: (placeName: string, coords: { x: number; y: number }) => void;
  onMoveValve: (valveId: string, coords: { x: number; y: number }) => void;
  onSelectLot: (
    lotId: string,
    modifiers: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
  ) => void;
  onSelectPlace: (
    placeName: string,
    modifiers: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
  ) => void;
  onSelectValve: (
    valveId: string,
    modifiers: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
  ) => void;
};

function coordsFromMapEvent(
  event: MapMouseEvent,
): { x: number; y: number } | null {
  const latLng = event.detail.latLng;
  if (!latLng) return null;
  return latLngToMapPosition(latLng.lat, latLng.lng);
}

/** Pan to a selected marker without changing zoom (e.g. issue list pick). */
function MapEditSelectionPan({
  mode,
  selectedLot,
  selectedPlace,
  selectedValve,
  lots,
  places,
  valves,
}: {
  mode: "lots" | "places" | "valves";
  selectedLot: string | null;
  selectedPlace: string | null;
  selectedValve: string | null;
  lots: MapPositions["lots"];
  places: MapPositions["places"];
  valves: MapPositions["valves"];
}) {
  const map = useMap();
  const lastFocusKey = useRef<string | null>(null);

  useEffect(() => {
    if (!map) return;

    let focusKey: string | null = null;
    let position: ReturnType<typeof mapPositionToLatLng> | null = null;

    if (mode === "lots" && selectedLot && isValidCoord(lots[selectedLot])) {
      focusKey = `lot:${selectedLot}`;
      position = mapPositionToLatLng(lots[selectedLot]!);
    } else if (mode === "places" && selectedPlace && isValidCoord(places[selectedPlace])) {
      focusKey = `place:${selectedPlace}`;
      position = mapPositionToLatLng(places[selectedPlace]!);
    } else if (mode === "valves" && selectedValve && isValidCoord(valves[selectedValve])) {
      focusKey = `valve:${selectedValve}`;
      position = mapPositionToLatLng(valves[selectedValve]!);
    }

    if (!focusKey || !position || focusKey === lastFocusKey.current) return;
    lastFocusKey.current = focusKey;
    map.panTo(position);
  }, [
    map,
    mode,
    selectedLot,
    selectedPlace,
    selectedValve,
    lots,
    places,
    valves,
  ]);

  return null;
}

export default function MapEditGoogleMap({
  lots,
  places,
  valves,
  lotIds,
  placeNames,
  valveIdsOnMap,
  mode,
  selectedLot,
  selectedLotIds,
  selectedPlace,
  selectedPlaceIds,
  selectedValve,
  selectedValveIds,
  onPlaceCoords,
  onMoveLot,
  onMovePlace,
  onMoveValve,
  onSelectLot,
  onSelectPlace,
  onSelectValve,
}: MapEditGoogleMapProps) {
  const colorScheme = useGoogleMapColorScheme();

  function handleMapClick(event: MapMouseEvent) {
    const coords = coordsFromMapEvent(event);
    if (!coords) return;
    onPlaceCoords(coords);
  }

  function handleDragEnd(
    event: google.maps.MapMouseEvent,
    onMove: (coords: { x: number; y: number }) => void,
  ) {
    const latLng = event.latLng;
    if (!latLng) return;
    onMove(latLngToMapPosition(latLng.lat(), latLng.lng()));
  }

  return (
    <GoogleMapFrame className="overflow-hidden rounded-xl border border-line">
      <Map
        mapId={googleMapId()}
        defaultCenter={parkMapCenter()}
        defaultZoom={18}
        gestureHandling="greedy"
        mapTypeId="roadmap"
        colorScheme={colorScheme}
        disableDefaultUI={false}
        onClick={handleMapClick}
        className="h-full w-full"
        style={{ width: "100%", height: "100%" }}
        restriction={{
          latLngBounds: parkMapBoundsLiteral(),
          strictBounds: true,
        }}
      >
        <MapFitBounds once minZoom={17} maxZoom={19} />
        <MapEditSelectionPan
          mode={mode}
          selectedLot={selectedLot}
          selectedPlace={selectedPlace}
          selectedValve={selectedValve}
          lots={lots}
          places={places}
          valves={valves}
        />
        {lotIds.map((lotId) => {
          const pos = lots[lotId];
          if (!pos || !isValidCoord(pos)) return null;
          const isSelected =
            mode === "lots" &&
            (selectedLot === lotId || selectedLotIds?.has(lotId));
          return (
            <AdvancedMarker
              key={`edit-lot-${lotId}`}
              position={mapPositionToLatLng(pos)}
              title={`Lot ${lotId}`}
              anchorPoint={GOOGLE_MAP_MARKER_ANCHOR}
              draggable
              onClick={(e) => {
                e.domEvent?.stopPropagation();
                const dom = e.domEvent;
                onSelectLot(lotId, {
                  shiftKey: dom instanceof MouseEvent ? dom.shiftKey : false,
                  ctrlKey: dom instanceof MouseEvent ? dom.ctrlKey : false,
                  metaKey: dom instanceof MouseEvent ? dom.metaKey : false,
                });
              }}
              onDragEnd={(e) => handleDragEnd(e, (coords) => onMoveLot(lotId, coords))}
            >
              <span
                className={`inline-flex min-h-[24px] min-w-[24px] cursor-grab items-center justify-center rounded px-1 py-0.5 text-[8px] font-bold shadow-sm active:cursor-grabbing ${
                  isSelected
                    ? "bg-blue-600 text-white ring-2 ring-white"
                    : "bg-black/80 text-white"
                }`}
              >
                {lotId}
              </span>
            </AdvancedMarker>
          );
        })}

        {placeNames.map((placeName) => {
          const pos = places[placeName];
          if (!pos || !isValidCoord(pos)) return null;
          const IconComponent = getPlaceIcon(pos.icon ?? "MdPlace");
          const isSelected =
            mode === "places" &&
            (selectedPlace === placeName || selectedPlaceIds?.has(placeName));
          return (
            <AdvancedMarker
              key={`edit-place-${placeName}`}
              position={mapPositionToLatLng(pos)}
              title={placeName}
              anchorPoint={GOOGLE_MAP_MARKER_ANCHOR}
              draggable
              onClick={(e) => {
                e.domEvent?.stopPropagation();
                const dom = e.domEvent;
                onSelectPlace(placeName, {
                  shiftKey: dom instanceof MouseEvent ? dom.shiftKey : false,
                  ctrlKey: dom instanceof MouseEvent ? dom.ctrlKey : false,
                  metaKey: dom instanceof MouseEvent ? dom.metaKey : false,
                });
              }}
              onDragEnd={(e) =>
                handleDragEnd(e, (coords) => onMovePlace(placeName, coords))
              }
            >
              <span
                className={`inline-flex h-5 w-5 cursor-grab items-center justify-center rounded-full p-0.5 shadow-sm active:cursor-grabbing ${
                  isSelected
                    ? "bg-blue-600 text-white ring-2 ring-white"
                    : getPlaceMarkerClasses(pos)
                }`}
              >
                <IconComponent className="h-2.5 w-2.5 shrink-0" />
              </span>
            </AdvancedMarker>
          );
        })}

        {valveIdsOnMap.map((valveId) => {
          const pos = valves[valveId];
          if (!pos || !isValidCoord(pos)) return null;
          const isSelected =
            mode === "valves" &&
            (selectedValve === valveId || selectedValveIds?.has(valveId));
          const displayId = /^\d+$/.test(valveId) ? `V${valveId}` : valveId;
          return (
            <AdvancedMarker
              key={`edit-valve-${valveId}`}
              position={mapPositionToLatLng(pos)}
              title={`Valve ${displayId}`}
              anchorPoint={GOOGLE_MAP_MARKER_ANCHOR}
              draggable
              onClick={(e) => {
                e.domEvent?.stopPropagation();
                const dom = e.domEvent;
                onSelectValve(valveId, {
                  shiftKey: dom instanceof MouseEvent ? dom.shiftKey : false,
                  ctrlKey: dom instanceof MouseEvent ? dom.ctrlKey : false,
                  metaKey: dom instanceof MouseEvent ? dom.metaKey : false,
                });
              }}
              onDragEnd={(e) =>
                handleDragEnd(e, (coords) => onMoveValve(valveId, coords))
              }
            >
              <span className="inline-flex cursor-grab flex-col items-center active:cursor-grabbing">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full p-0.5 shadow-sm ${
                    isSelected
                      ? "bg-blue-600 text-white ring-2 ring-white"
                      : "bg-slate-600 text-white"
                  }`}
                >
                  <MdPlumbing className="h-2.5 w-2.5 shrink-0" />
                </span>
                <span className="mt-px rounded bg-slate-800/95 px-0.5 py-px text-[7px] font-bold text-white shadow">
                  {displayId}
                </span>
              </span>
            </AdvancedMarker>
          );
        })}
      </Map>
    </GoogleMapFrame>
  );
}