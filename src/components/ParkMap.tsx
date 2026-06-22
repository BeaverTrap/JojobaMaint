"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MdPlumbing } from "react-icons/md";
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import { getPlaceIcon, getPlaceMarkerClasses } from "@/lib/map-place-icons";
import { PARK_MAP_IMAGE_PATH } from "@/lib/map-constants";
import {
  MAP_STAGE_CLASS,
  MAP_STAGE_FIT_STYLE,
  MAP_VIEWPORT_CLASS,
} from "@/lib/map-stage";
import type { MapPlacePosition, MapPositions } from "@/lib/map-positions";
import {
  centerMapOnPercent,
  focusMapMarker,
  MAP_FOCUS_SCALE_DETAIL,
  MAP_FOCUS_SCALE_SELECTION,
  MAP_PINCH_STEP,
  MAP_WHEEL_STEP,
} from "@/lib/map-viewport";
import { useTapHandler } from "@/lib/map-tap";
import { siteToSlug } from "@/lib/site-slug";
import { getZoneFillColor, type ZoneColorMap } from "@/lib/zone-colors";
import { isValidCoord } from "@/lib/map-edit-validation";

type LotPositions = Record<string, { x: number; y: number }>;
type PlacePositions = Record<string, MapPlacePosition>;
type ValvePositions = Record<string, { x: number; y: number }>;

export type ParkMapProps = {
  /** Lot IDs to highlight on the map (e.g. lots in selected zone); all lots are always shown */
  lotsToShow?: string[];
  /** Optional: extra highlight for this lot (e.g. selected lot) – same zone color but darker */
  highlightLot?: string | null;
  /** Zones we're currently showing (for zone color) */
  contextZones?: string[];
  /** Lot id -> zone names (for zone color) */
  lotZones?: Record<string, string[]>;
  /** Zone name -> { base, highlight } Tailwind classes */
  zoneColors?: ZoneColorMap;
  /** Optional: highlight this valve (e.g. selected valve) */
  highlightValve?: string | null;
  /** Optional: highlight this place/amenity marker */
  highlightPlace?: string | null;
  /** When provided, lot labels are clickable and this is called with the lot id */
  onLotClick?: (lotId: string) => void;
  /** When provided, place markers are clickable and this is called with the place name */
  onPlaceClick?: (placeName: string) => void;
  /** When provided, valve markers are clickable and this is called with the valve id */
  onValveClick?: (valveId: string) => void;
  /** Show/hide layers (default true for each) */
  showLots?: boolean;
  showPlaces?: boolean;
  showValves?: boolean;
  /** When true, map container fills available height (for full-screen mobile) */
  fillHeight?: boolean;
  /** When true, map is zoomable and pannable (pinch, wheel, drag) with zoom controls. Default true so all maps have full features. */
  zoomable?: boolean;
  /** Shown on the map when set (e.g. current zone / lot / valve for at-a-glance context) */
  contextZone?: string | null;
  contextLot?: string | null;
  contextValve?: string | null;
  /** Valve IDs for the current zone (e.g. ["1", "2"] → "Valves: V1, V2") */
  contextValves?: string[];
  /** Skip client fetch when positions are loaded on the server */
  initialMapData?: MapPositions;
  /** Pan/zoom to highlighted lot or place when it changes */
  autoFocusHighlight?: boolean;
  /** Target zoom when focusing a marker (default depends on autoFocusHighlight) */
  focusScale?: number;
  /** Return to full view when highlight is cleared */
  resetWhenHighlightClears?: boolean;
};

function formatValveDisplay(id: string): string {
  if (!id) return "V?";
  return /^\d+$/.test(id) ? `V${id}` : id;
}

function LotMarker({
  lotId,
  pos,
  isHighlight,
  lotClass,
  onLotClick,
}: {
  lotId: string;
  pos: { x: number; y: number } | undefined;
  isHighlight: boolean;
  isInSearch: boolean;
  lotClass: string;
  onLotClick?: (lotId: string) => void;
}) {
  const tap = useTapHandler(() => onLotClick?.(lotId));
  if (!pos) return null;
  return (
    <div
      id={`map-lot-${lotId}`}
      className="absolute -translate-x-1/2 -translate-y-1/2 transform"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        pointerEvents: onLotClick ? "auto" : "none",
      }}
    >
      <span
        role={onLotClick ? "button" : undefined}
        tabIndex={onLotClick ? 0 : undefined}
        onKeyDown={
          onLotClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") onLotClick(lotId);
              }
            : undefined
        }
        className={`
          map-marker-btn inline-flex items-center justify-center rounded px-[clamp(2px,0.8cqw,6px)] py-[clamp(1px,0.4cqw,4px)] text-[clamp(7px,2.4cqw,10px)] font-bold leading-none transition-colors duration-200
          ${onLotClick ? "cursor-pointer touch-manipulation hover:ring-2 hover:ring-white/80 active:scale-95" : ""}
          ${isHighlight ? "scale-110 ring-2 ring-white" : ""}
          ${lotClass}
        `}
        {...(onLotClick ? tap : {})}
      >
        {lotId}
      </span>
    </div>
  );
}

function PlaceMarker({
  placeName,
  pos,
  isHighlight,
  onPlaceClick,
}: {
  placeName: string;
  pos: MapPlacePosition & { x: number; y: number };
  isHighlight?: boolean;
  onPlaceClick?: (placeName: string) => void;
}) {
  const tap = useTapHandler(() => onPlaceClick?.(placeName));
  const IconComponent = getPlaceIcon(pos.icon || "MdPlace");
  const isClickable = !!onPlaceClick;
  return (
    <div
      id={`map-place-${siteToSlug(placeName)}`}
      className="group absolute flex -translate-x-1/2 -translate-y-1/2 transform flex-col items-center"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        pointerEvents: isClickable ? "auto" : "none",
      }}
      title={placeName}
    >
      <span
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={
          isClickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") onPlaceClick?.(placeName);
              }
            : undefined
        }
        className={`
          map-marker-btn inline-flex h-[clamp(18px,4.5cqw,30px)] w-[clamp(18px,4.5cqw,30px)] items-center justify-center rounded-full p-[clamp(2px,0.8cqw,6px)] transition-colors duration-200
          ${isHighlight ? "bg-blue-700 text-white ring-2 ring-white" : getPlaceMarkerClasses(pos)}
          ${isHighlight ? "scale-110" : ""}
          ${isClickable ? "cursor-pointer touch-manipulation hover:opacity-90 hover:ring-2 hover:ring-white/80 active:scale-95" : ""}
        `}
        {...(isClickable ? tap : {})}
      >
        <IconComponent className="h-[clamp(10px,2.6cqw,16px)] w-[clamp(10px,2.6cqw,16px)] shrink-0" />
      </span>
      <span className="pointer-events-none invisible absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-lg group-hover:visible">
        {placeName}
      </span>
    </div>
  );
}

function ValveMarker({
  valveId,
  pos,
  isHighlight,
  onValveClick,
}: {
  valveId: string;
  pos: { x: number; y: number };
  isHighlight: boolean;
  onValveClick?: (valveId: string) => void;
}) {
  const tap = useTapHandler(() => onValveClick?.(valveId));
  const isClickable = !!onValveClick;
  const displayId =
    valveId === ""
      ? "V?"
      : /^\d+$/.test(valveId)
        ? `V${valveId}`
        : valveId;
  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 transform flex-col items-center"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        pointerEvents: isClickable ? "auto" : "none",
      }}
      title={`Valve ${displayId}`}
    >
      <span
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={
          isClickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") onValveClick?.(valveId);
              }
            : undefined
        }
        className={`
          map-marker-btn inline-flex flex-col items-center transition-colors duration-200
          ${isClickable ? "cursor-pointer touch-manipulation rounded hover:opacity-90 hover:ring-2 hover:ring-white/80 active:scale-95" : ""}
        `}
        {...(isClickable ? tap : {})}
      >
        <span
          className={`
            inline-flex h-[clamp(18px,4.5cqw,30px)] w-[clamp(18px,4.5cqw,30px)] items-center justify-center rounded-full p-[clamp(2px,0.8cqw,6px)]
            ${isHighlight ? "bg-slate-700 text-white ring-2 ring-white" : "bg-slate-600 text-white"}
          `}
        >
          <MdPlumbing className="h-[clamp(10px,2.6cqw,16px)] w-[clamp(10px,2.6cqw,16px)] shrink-0" />
        </span>
        <span
          className={`
            mt-[clamp(1px,0.4cqw,4px)] rounded px-[clamp(2px,0.8cqw,6px)] py-[clamp(1px,0.3cqw,3px)] text-center text-[clamp(7px,2.2cqw,10px)] font-bold leading-none
            ${isHighlight ? "bg-slate-700 text-white ring-1 ring-white/50" : "bg-slate-700/90 text-white"}
          `}
        >
          {displayId}
        </span>
      </span>
    </div>
  );
}

/** Convex hull (Gift wrapping) of points in % coords. Returns ordered polygon points. */
function convexHull(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length < 3) return points;
  const out: { x: number; y: number }[] = [];
  let left = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].x < points[left].x) left = i;
  }
  let p = left;
  do {
    out.push(points[p]);
    let q = (p + 1) % points.length;
    for (let r = 0; r < points.length; r++) {
      if (r === p || r === q) continue;
      const cross =
        (points[q].x - points[p].x) * (points[r].y - points[p].y) -
        (points[q].y - points[p].y) * (points[r].x - points[p].x);
      if (cross < 0) q = r;
    }
    p = q;
  } while (p !== left);
  return out;
}

export function ParkMap({ lotsToShow = [], highlightLot = null, contextZones = [], lotZones = {}, zoneColors = {}, highlightValve = null, highlightPlace = null, onLotClick, onPlaceClick, onValveClick, showLots = true, showPlaces = true, showValves = true, fillHeight = false, zoomable = true, contextZone = null, contextLot = null, contextValve = null, contextValves = [], initialMapData, autoFocusHighlight = false, focusScale, resetWhenHighlightClears = false }: ParkMapProps) {
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const [lots, setLots] = useState<LotPositions>(initialMapData?.lots ?? {});
  const [places, setPlaces] = useState<PlacePositions>(initialMapData?.places ?? {});
  const [valves, setValves] = useState<ValvePositions>(initialMapData?.valves ?? {});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialMapData);

  useEffect(() => {
    if (initialMapData) return;

    fetch("/api/map")
      .then((res) => {
        if (!res.ok) throw new Error(`Map data failed (${res.status})`);
        return res.json();
      })
      .then((data) => {
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

  const resolvedFocusScale =
    focusScale ??
    (autoFocusHighlight && !onLotClick && !onPlaceClick
      ? MAP_FOCUS_SCALE_DETAIL
      : MAP_FOCUS_SCALE_SELECTION);

  useEffect(() => {
    if (!zoomable || !autoFocusHighlight || loading || !transformRef.current) {
      return;
    }

    const ref = transformRef.current;
    const timer = window.setTimeout(() => {
      if (highlightLot) {
        if (
          focusMapMarker(ref, `map-lot-${highlightLot}`, resolvedFocusScale)
        ) {
          return;
        }
        const pos = lots[highlightLot];
        if (pos) {
          centerMapOnPercent(ref, pos.x, pos.y, resolvedFocusScale);
        }
        return;
      }

      if (highlightPlace) {
        if (
          focusMapMarker(
            ref,
            `map-place-${siteToSlug(highlightPlace)}`,
            resolvedFocusScale,
          )
        ) {
          return;
        }
        const pos = places[highlightPlace];
        if (pos && isValidCoord(pos)) {
          centerMapOnPercent(ref, pos.x, pos.y, resolvedFocusScale);
        }
        return;
      }

      if (resetWhenHighlightClears) {
        ref.resetTransform(280, "easeOut");
      }
    }, 50);

    return () => window.clearTimeout(timer);
  }, [
    zoomable,
    autoFocusHighlight,
    loading,
    highlightLot,
    highlightPlace,
    lots,
    places,
    resolvedFocusScale,
    resetWhenHighlightClears,
  ]);

  // Zone blobs: group lots by zone, compute convex hull per zone; fill uses same color family as lot labels (zoneColors order)
  const zoneBlobs = useMemo(() => {
    if (lotsToShow.length === 0) return [];
    const zoneToLots = new Map<string, string[]>();
    for (const lotId of lotsToShow) {
      const zones = lotZones[lotId] ?? (contextZone ? [contextZone] : []);
      const zone = contextZones?.length
        ? (contextZones.find((z) => zones.includes(z)) ?? zones[0])
        : zones[0] ?? (contextZone || "Zone");
      if (!zoneToLots.has(zone)) zoneToLots.set(zone, []);
      zoneToLots.get(zone)!.push(lotId);
    }
    // Use same zone order as zoneColors so blob color matches lot label color (same palette index)
    const zoneOrderForFill =
      Object.keys(zoneColors).length > 0
        ? Object.keys(zoneColors).sort((a, b) => a.localeCompare(b))
        : contextZones.length > 0
          ? [...contextZones].sort((a, b) => a.localeCompare(b))
          : contextZone
            ? [contextZone]
            : [];
    const result: { points: { x: number; y: number }[]; fill: string }[] = [];
    zoneToLots.forEach((lotIds, zoneName) => {
      const points = lotIds
        .map((id) => lots[id])
        .filter((p): p is { x: number; y: number } => p != null);
      if (points.length < 3) return;
      const hull = convexHull(points);
      const fill = getZoneFillColor(zoneName, zoneOrderForFill);
      result.push({ points: hull, fill });
    });
    return result;
  }, [lotsToShow, lots, lotZones, contextZones, contextZone, zoneColors]);

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

  const allLotIds = Object.keys(lots);
  const allPlaceNames = Object.keys(places);
  const allValveIds = Object.keys(valves);
  const hasMarkers =
    allLotIds.length > 0 ||
    allPlaceNames.length > 0 ||
    allValveIds.length > 0;

  const highlightSet = new Set(lotsToShow.map((id) => String(id)));
  const hasZoneColors = Object.keys(zoneColors).length > 0 && Object.keys(lotZones).length > 0;

  const mapStage = (
    <div className={MAP_STAGE_CLASS} style={MAP_STAGE_FIT_STYLE}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={PARK_MAP_IMAGE_PATH}
        alt="Park map"
        className="absolute inset-0 h-full w-full select-none"
        draggable={false}
      />
      {zoneBlobs.length > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          {zoneBlobs.map((blob, i) => (
            <polygon
              key={i}
              points={blob.points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill={blob.fill}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="0.5"
            />
          ))}
        </svg>
      )}
      {showLots && allLotIds.map((lotId) => (
        <LotMarker
          key={`lot-${lotId}`}
          lotId={lotId}
          pos={lots[lotId]}
          isHighlight={highlightLot != null && String(lotId) === String(highlightLot)}
          isInSearch={highlightSet.has(String(lotId))}
          lotClass={(() => {
            const zones = lotZones[lotId] ?? [];
            const zone = contextZones.length > 0
              ? (contextZones.find((z) => zones.includes(z)) ?? zones[0])
              : zones[0];
            const colors = zone && zoneColors[zone];
            const isHighlight = highlightLot != null && String(lotId) === String(highlightLot);
            const isInSearch = highlightSet.has(String(lotId));
            if (hasZoneColors && isInSearch && colors) {
              return isHighlight ? colors.highlight : colors.base;
            }
            if (isHighlight) return "bg-blue-800 text-white ring-2 ring-white";
            if (isInSearch) return "bg-amber-600/90 text-white";
            return "bg-black/60 text-white";
          })()}
          onLotClick={onLotClick}
        />
      ))}
      {showPlaces && allPlaceNames.map((placeName) => {
        const pos = places[placeName];
        if (!pos || !isValidCoord(pos)) return null;
        return (
          <PlaceMarker
            key={`place-${placeName}`}
            placeName={placeName}
            pos={pos}
            isHighlight={
              highlightPlace != null && placeName === highlightPlace
            }
            onPlaceClick={onPlaceClick}
          />
        );
      })}
      {showValves && allValveIds.map((valveId) => {
        const pos = valves[valveId];
        if (!pos) return null;
        return (
          <ValveMarker
            key={`valve-${valveId}`}
            valveId={valveId}
            pos={pos}
            isHighlight={
              highlightValve != null && String(valveId) === String(highlightValve)
            }
            onValveClick={onValveClick}
          />
        );
      })}
    </div>
  );

  const viewportClassName = fillHeight
    ? `${MAP_VIEWPORT_CLASS} h-full min-h-0`
    : `${MAP_VIEWPORT_CLASS} min-h-[55dvh] sm:min-h-0`;

  const mapContent = mapStage;

  const hasContext = contextZone || contextLot || contextValve || contextValves.length > 0;
  const contextBadge = hasContext ? (
    <div className="absolute left-2 top-2 z-20 flex flex-col gap-1 rounded-lg border border-gray-600 bg-gray-900/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      {contextZone && (
        <span className="text-sm font-semibold text-amber-400">Zone {contextZone}</span>
      )}
      {contextLot && (
        <span className="text-sm font-medium text-blue-300">Lot {contextLot}</span>
      )}
      {contextValve && (
        <span className="text-sm font-medium text-slate-300">Valve {formatValveDisplay(contextValve)}</span>
      )}
      {contextValves.length > 0 && (
        <span className="text-sm font-medium text-slate-300">
          Valves: {contextValves.map((id) => formatValveDisplay(id)).join(", ")}
        </span>
      )}
    </div>
  ) : null;

  const mapInner = zoomable ? (
    <div
      className={
        fillHeight
          ? "relative h-full min-h-0 w-full touch-none"
          : "relative h-full min-h-[55dvh] w-full touch-none"
      }
    >
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        limitToBounds={true}
        centerOnInit={false}
        smooth={false}
        panning={{ velocityDisabled: true, excluded: ["map-marker-btn"] }}
        pinch={{ step: MAP_PINCH_STEP }}
        wheel={{ step: MAP_WHEEL_STEP }}
        doubleClick={{ mode: "reset", animationTime: 200 }}
        velocityAnimation={{ disabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {contextBadge}
            <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5 rounded-lg border border-gray-600 bg-gray-800/95 p-1.5 shadow-lg pb-[env(safe-area-inset-bottom,0px)]">
              <button
                type="button"
                onClick={() => zoomIn(0.2, 180, "easeOut")}
                className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-700 text-lg font-bold text-white hover:bg-gray-600 active:bg-gray-500 touch-manipulation sm:h-9 sm:w-9"
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => zoomOut(0.2, 180, "easeOut")}
                className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-700 text-lg font-bold text-white hover:bg-gray-600 active:bg-gray-500 touch-manipulation sm:h-9 sm:w-9"
                aria-label="Zoom out"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => resetTransform(280, "easeOut")}
                className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-700 text-white hover:bg-gray-600 active:bg-gray-500 touch-manipulation sm:h-9 sm:w-9"
                aria-label="Reset zoom"
                title="Reset zoom"
              >
                ⟲
              </button>
            </div>
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%", touchAction: "none" }}
              contentStyle={{ width: "100%", height: "100%" }}
            >
              <div className={viewportClassName}>{mapContent}</div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  ) : (
    <div className="relative h-full w-full min-h-0">
      {contextBadge}
      <div className={viewportClassName}>{mapContent}</div>
    </div>
  );

  return (
    <div
      className={`w-full overflow-hidden rounded-lg border border-gray-700 bg-gray-900 ${fillHeight ? "flex min-h-0 flex-1 flex-col" : ""}`}
    >
      <div
        className={
          fillHeight
            ? "relative min-h-0 w-full flex-1"
            : "relative w-full"
        }
      >
        {mapInner}
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
