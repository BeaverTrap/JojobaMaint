"use client";

import { MdPlumbing } from "react-icons/md";
import {
  AdvancedMarker,
  Map,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";
import { GoogleMapFrame, useGoogleMapColorScheme } from "@/components/GoogleMapFrame";
import {
  collectMapLatLngs,
  GOOGLE_MAP_MARKER_ANCHOR,
  MapFitBounds,
} from "@/components/GoogleMapMarkers";
import { getPlaceIcon, getPlaceColor } from "@/lib/map-place-icons";
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
  selectedPlace: string | null;
  selectedValve: string | null;
  onPlaceCoords: (coords: { x: number; y: number }) => void;
  onMoveLot: (lotId: string, coords: { x: number; y: number }) => void;
  onMovePlace: (placeName: string, coords: { x: number; y: number }) => void;
  onMoveValve: (valveId: string, coords: { x: number; y: number }) => void;
  onSelectLot: (lotId: string) => void;
  onSelectPlace: (placeName: string) => void;
  onSelectValve: (valveId: string) => void;
};

function coordsFromMapEvent(
  event: MapMouseEvent,
): { x: number; y: number } | null {
  const latLng = event.detail.latLng;
  if (!latLng) return null;
  return latLngToMapPosition(latLng.lat, latLng.lng);
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
  selectedPlace,
  selectedValve,
  onPlaceCoords,
  onMoveLot,
  onMovePlace,
  onMoveValve,
  onSelectLot,
  onSelectPlace,
  onSelectValve,
}: MapEditGoogleMapProps) {
  const colorScheme = useGoogleMapColorScheme();
  const overviewPositions = collectMapLatLngs(lots, places, valves);

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
        defaultZoom={17}
        gestureHandling="greedy"
        mapTypeId="roadmap"
        colorScheme={colorScheme}
        disableDefaultUI={false}
        onClick={handleMapClick}
        className="h-full w-full"
        style={{ width: "100%", height: "100%" }}
        restriction={{
          latLngBounds: parkMapBoundsLiteral(),
          strictBounds: false,
        }}
      >
        <MapFitBounds
          positions={overviewPositions}
          enabled={overviewPositions.length > 0}
          maxZoom={18}
        />
        {lotIds.map((lotId) => {
          const pos = lots[lotId];
          if (!pos) return null;
          const isSelected = mode === "lots" && selectedLot === lotId;
          return (
            <AdvancedMarker
              key={`edit-lot-${lotId}`}
              position={mapPositionToLatLng(pos)}
              title={`Lot ${lotId}`}
              anchorPoint={GOOGLE_MAP_MARKER_ANCHOR}
              draggable
              onClick={(e) => {
                e.domEvent?.stopPropagation();
                onSelectLot(lotId);
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
          if (!pos) return null;
          const IconComponent = getPlaceIcon(pos.icon ?? "MdPlace");
          const isSelected = mode === "places" && selectedPlace === placeName;
          return (
            <AdvancedMarker
              key={`edit-place-${placeName}`}
              position={mapPositionToLatLng(pos)}
              title={placeName}
              anchorPoint={GOOGLE_MAP_MARKER_ANCHOR}
              draggable
              onClick={(e) => {
                e.domEvent?.stopPropagation();
                onSelectPlace(placeName);
              }}
              onDragEnd={(e) =>
                handleDragEnd(e, (coords) => onMovePlace(placeName, coords))
              }
            >
              <span
                className={`inline-flex h-5 w-5 cursor-grab items-center justify-center rounded-full p-0.5 shadow-sm active:cursor-grabbing ${
                  isSelected
                    ? "bg-blue-600 text-white ring-2 ring-white"
                    : getPlaceColor(pos.icon ?? "MdPlace")
                }`}
              >
                <IconComponent className="h-2.5 w-2.5 shrink-0" />
              </span>
            </AdvancedMarker>
          );
        })}

        {valveIdsOnMap.map((valveId) => {
          const pos = valves[valveId];
          if (!pos) return null;
          const isSelected = mode === "valves" && selectedValve === valveId;
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
                onSelectValve(valveId);
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