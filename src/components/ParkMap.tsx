"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { MdPlumbing } from "react-icons/md";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { getPlaceIcon, getPlaceColor } from "@/lib/map-place-icons";
import { getZoneFillColor, type ZoneColorMap } from "@/lib/zone-colors";

type LotPositions = Record<string, { x: number; y: number }>;
type PlacePosition = { x: number; y: number; icon?: string };
type PlacePositions = Record<string, PlacePosition>;
type ValvePositions = Record<string, { x: number; y: number }>;

type ParkMapProps = {
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
};

function formatValveDisplay(id: string): string {
  if (!id) return "V?";
  return /^\d+$/.test(id) ? `V${id}` : id;
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

export function ParkMap({ lotsToShow = [], highlightLot = null, contextZones = [], lotZones = {}, zoneColors = {}, highlightValve = null, onLotClick, onPlaceClick, onValveClick, showLots = true, showPlaces = true, showValves = true, fillHeight = false, zoomable = true, contextZone = null, contextLot = null, contextValve = null, contextValves = [] }: ParkMapProps) {
  const [lots, setLots] = useState<LotPositions>({});
  const [places, setPlaces] = useState<PlacePositions>({});
  const [valves, setValves] = useState<ValvePositions>({});
  const [imageVersion, setImageVersion] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/map")
      .then((res) => res.json())
      .then((data) => {
        setLots(data.lots || {});
        setPlaces(data.places || {});
        setValves(data.valves || {});
        setImageVersion(data.imageVersion ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-gray-400">Loading map...</p>
      </div>
    );
  }

  const allLotIds = Object.keys(lots);
  const allPlaceNames = Object.keys(places);
  const allValveIds = Object.keys(valves);
  if (allLotIds.length === 0 && allPlaceNames.length === 0 && allValveIds.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
        <p className="text-gray-400 text-sm">
          No lot, place, or valve positions in <code className="bg-gray-800 px-1 rounded">data/map-positions.json</code>.
        </p>
      </div>
    );
  }

  const highlightSet = new Set(lotsToShow.map((id) => String(id)));
  const hasZoneColors = Object.keys(zoneColors).length > 0 && Object.keys(lotZones).length > 0;

  const mapContent = (
    <>
        <Image
          src={`/api/map/image?v=${imageVersion}`}
          alt="Park map"
          fill
          className="object-contain"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1024px"
          unoptimized
        />
        {zoneBlobs.length > 0 && (
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none"
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
        {showLots && allLotIds.map((lotId) => {
          const pos = lots[lotId];
          if (!pos) return null;
          const isHighlight = highlightLot != null && String(lotId) === String(highlightLot);
          const isInSearch = highlightSet.has(String(lotId));
          const zones = lotZones[lotId] ?? [];
          const zone = contextZones.length > 0
            ? (contextZones.find((z) => zones.includes(z)) ?? zones[0])
            : zones[0];
          const colors = zone && zoneColors[zone];
          const lotClass = hasZoneColors && isInSearch && colors
            ? (isHighlight ? colors.highlight : colors.base)
            : isHighlight
              ? "bg-blue-800 text-white ring-2 ring-white"
              : isInSearch
                ? "bg-amber-600/90 text-white"
                : "bg-black/60 text-white";
          return (
            <div
              key={`lot-${lotId}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                pointerEvents: onLotClick ? "auto" : "none",
              }}
            >
              <span
                role={onLotClick ? "button" : undefined}
                tabIndex={onLotClick ? 0 : undefined}
                onClick={onLotClick ? () => onLotClick(lotId) : undefined}
                onKeyDown={onLotClick ? (e) => { if (e.key === "Enter" || e.key === " ") onLotClick(lotId); } : undefined}
                className={`
                  inline-flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 px-2 py-1.5 sm:px-1.5 sm:py-0.5 text-[11px] sm:text-xs font-bold rounded touch-manipulation
                  ${onLotClick ? "cursor-pointer hover:ring-2 hover:ring-white/80 active:scale-95 transition-all" : ""}
                  ${lotClass}
                `}
              >
                {lotId}
              </span>
            </div>
          );
        })}
        {showPlaces && allPlaceNames.map((placeName) => {
          const pos = places[placeName];
          if (!pos) return null;
          const IconComponent = getPlaceIcon(pos.icon || "MdPlace");
          const isClickable = !!onPlaceClick;
          return (
            <div
              key={`place-${placeName}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
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
                onClick={isClickable ? () => onPlaceClick?.(placeName) : undefined}
                onKeyDown={isClickable ? (e) => { if (e.key === "Enter" || e.key === " ") onPlaceClick?.(placeName); } : undefined}
                className={`
                  inline-flex items-center justify-center rounded-full w-11 h-11 sm:w-9 sm:h-9 p-2.5 sm:p-1.5 touch-manipulation
                  ${getPlaceColor(pos.icon ?? "MdPlace")}
                  ${isClickable ? "cursor-pointer hover:opacity-90 active:scale-95 hover:ring-2 hover:ring-white/80 transition-all" : ""}
                `}
              >
                <IconComponent className="shrink-0 w-5 h-5 sm:w-[18px] sm:h-[18px]" size={20} />
              </span>
              {/* Name: hover on desktop; on mobile native tooltip via title */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg whitespace-nowrap pointer-events-none z-10 invisible group-hover:visible">
                {placeName}
              </span>
            </div>
          );
        })}
        {showValves && allValveIds.map((valveId) => {
          const pos = valves[valveId];
          if (!pos) return null;
          const isHighlight = highlightValve != null && String(valveId) === String(highlightValve);
          const isClickable = !!onValveClick;
          const displayId =
            valveId === ""
              ? "V?"
              : /^\d+$/.test(valveId)
                ? `V${valveId}`
                : valveId;
          return (
            <div
              key={`valve-${valveId}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
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
                onClick={isClickable ? () => onValveClick?.(valveId) : undefined}
                onKeyDown={isClickable ? (e) => { if (e.key === "Enter" || e.key === " ") onValveClick?.(valveId); } : undefined}
                className={`
                  inline-flex flex-col items-center touch-manipulation
                  ${isClickable ? "cursor-pointer hover:opacity-90 active:scale-95 hover:ring-2 hover:ring-white/80 rounded transition-all" : ""}
                `}
              >
                <span
                  className={`
                    inline-flex items-center justify-center rounded-full w-11 h-11 sm:w-9 sm:h-9 p-2.5 sm:p-1.5
                    ${isHighlight ? "bg-slate-700 text-white ring-2 ring-white" : "bg-slate-600 text-white"}
                  `}
                >
                  <MdPlumbing className="shrink-0 w-5 h-5 sm:w-[18px] sm:h-[18px]" size={20} />
                </span>
                <span
                  className={`
                    mt-1 sm:mt-0.5 px-2 py-0.5 sm:px-1.5 sm:py-0.5 text-[11px] sm:text-[10px] font-bold rounded min-w-[2rem] sm:min-w-[1.75rem] text-center
                    ${isHighlight ? "bg-slate-700 text-white ring-1 ring-white/50" : "bg-slate-700/90 text-white"}
                  `}
                >
                  {displayId}
                </span>
              </span>
            </div>
          );
        })}
    </>
  );

  const innerClassName = `relative w-full ${fillHeight ? "flex-1 min-h-0" : "min-h-[55dvh] sm:min-h-0"}`;
  const innerStyle = fillHeight ? undefined : { aspectRatio: "4/3" as const };

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
    <TransformWrapper
      initialScale={1}
      minScale={0.4}
      maxScale={5}
      limitToBounds={true}
      centerOnInit={false}
      doubleClick={{ mode: "reset" }}
    >
      {({ zoomIn, zoomOut, resetTransform }) => (
        <>
          {contextBadge}
          <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5 rounded-lg border border-gray-600 bg-gray-800/95 p-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => zoomIn()}
              className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-700 text-lg font-bold text-white hover:bg-gray-600 active:bg-gray-500 touch-manipulation sm:h-9 sm:w-9"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => zoomOut()}
              className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-700 text-lg font-bold text-white hover:bg-gray-600 active:bg-gray-500 touch-manipulation sm:h-9 sm:w-9"
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => resetTransform()}
              className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-700 text-white hover:bg-gray-600 active:bg-gray-500 touch-manipulation sm:h-9 sm:w-9"
              aria-label="Reset zoom"
              title="Reset zoom"
            >
              ⟲
            </button>
          </div>
          <TransformComponent
            wrapperClass="!w-full !h-full"
            contentClass="!w-full !h-full !min-w-full !min-h-full"
          >
            <div className={innerClassName} style={innerStyle}>
              {mapContent}
            </div>
          </TransformComponent>
        </>
      )}
    </TransformWrapper>
  ) : (
    <div className={innerClassName} style={innerStyle}>
      {contextBadge}
      {mapContent}
    </div>
  );

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 overflow-hidden w-full ${fillHeight ? "flex flex-col flex-1 min-h-0" : ""}`}>
      <div className={fillHeight ? "flex-1 min-h-0 min-w-0 flex flex-col w-full" : "w-full"}>
        {mapInner}
      </div>
      {!fillHeight && (
        <p className="text-gray-400 text-[10px] sm:text-xs p-2 border-t border-gray-800">
          Lot numbers and facility icons on the map. {lotsToShow.length > 0 ? `${lotsToShow.length} lot(s) highlighted for current search.` : "Select a zone, lot, or valve to highlight."}
        </p>
      )}
    </div>
  );
}
