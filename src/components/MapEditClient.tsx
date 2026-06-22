"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdPlumbing } from "react-icons/md";
import { getPlaceIcon, getPlaceColor } from "@/lib/map-place-icons";
import { PARK_MAP_IMAGE_PATH } from "@/lib/map-constants";
import {
  MAP_STAGE_CLASS,
  MAP_STAGE_FIT_STYLE,
  MAP_VIEWPORT_CLASS,
} from "@/lib/map-stage";
import type { MapPositions } from "@/lib/map-positions";
import {
  isValidCoord,
  summarizeMapEditIssues,
  validateMapPositions,
  type MapEditIssue,
  type MapMarkerKind,
} from "@/lib/map-edit-validation";

type LotPositions = MapPositions["lots"];
type PlacePositions = MapPositions["places"];
type ValvePositions = MapPositions["valves"];

function naturalSort(a: string, b: string): number {
  const na = parseInt(a.replace(/\D/g, "") || "0", 10);
  const nb = parseInt(b.replace(/\D/g, "") || "0", 10);
  if (na !== nb) return na - nb;
  return a.localeCompare(b);
}

function coordsFromPointer(
  img: HTMLImageElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const rect = img.getBoundingClientRect();
  const x = Math.round(((clientX - rect.left) / rect.width) * 1000) / 10;
  const y = Math.round(((clientY - rect.top) / rect.height) * 1000) / 10;
  if (x < 0 || x > 100 || y < 0 || y > 100) return null;
  return { x, y };
}

export default function MapEditClient({
  initialData,
}: {
  initialData: MapPositions;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    kind: "lots" | "places" | "valves";
    id: string;
  } | null>(null);

  const [lots, setLots] = useState<LotPositions>(initialData.lots);
  const [places, setPlaces] = useState<PlacePositions>(initialData.places);
  const [valves, setValves] = useState<ValvePositions>(initialData.valves);
  const [valveIdsFromApi, setValveIdsFromApi] = useState<string[]>([]);
  const [sheetLots, setSheetLots] = useState<string[]>([]);
  const [sheetLoadError, setSheetLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"lots" | "places" | "valves">("lots");
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [selectedValve, setSelectedValve] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/valves")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        if (data.valves?.length) {
          const rawIds: string[] = data.valves
            .map((v: { valveId: string }) => (v.valveId ?? "").trim())
            .filter((id: string) => id.length > 0);
          setValveIdsFromApi(Array.from(new Set(rawIds)).sort(naturalSort));

          const lots = new Set<string>();
          for (const valve of data.valves as { lots: string[] }[]) {
            for (const lot of valve.lots ?? []) {
              const trimmed = lot.trim();
              if (trimmed) lots.add(trimmed);
            }
          }
          setSheetLots(
            Array.from(lots).sort((a, b) => naturalSort(a, b)),
          );
        }
        setSheetLoadError(null);
      })
      .catch((err: Error) => {
        setSheetLoadError(err.message || "Could not load valve sheet data");
      });
  }, []);

  const lotIds = useMemo(() => {
    const merged = new Set([...Object.keys(lots), ...sheetLots]);
    return Array.from(merged).sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }, [lots, sheetLots]);
  const placeNames = Object.keys(places).sort((a, b) => a.localeCompare(b));
  const valveIdsOnMap = Object.keys(valves).sort(naturalSort);

  const issues = useMemo(
    () =>
      validateMapPositions({
        lots,
        places,
        valves,
        sheetLots,
        sheetValveIds: valveIdsFromApi,
      }),
    [lots, places, valves, sheetLots, valveIdsFromApi],
  );
  const issueSummary = useMemo(() => summarizeMapEditIssues(issues), [issues]);

  const selectMarker = useCallback((kind: MapMarkerKind, label: string) => {
    if (kind === "lot") {
      setMode("lots");
      setSelectedLot(label);
      setSelectedPlace(null);
      setSelectedValve(null);
    } else if (kind === "place") {
      setMode("places");
      setSelectedPlace(label);
      setSelectedLot(null);
      setSelectedValve(null);
    } else {
      setMode("valves");
      setSelectedValve(label);
      setSelectedLot(null);
      setSelectedPlace(null);
    }
    setMessage(`Selected ${label} — click the map or drag its marker to fix.`);
  }, []);

  const placeMarker = useCallback(
    (coords: { x: number; y: number }) => {
      if (mode === "lots" && selectedLot) {
        setLots((prev) => ({ ...prev, [selectedLot]: coords }));
        setMessage(
          `Placed lot "${selectedLot}" at ${coords.x.toFixed(1)}%, ${coords.y.toFixed(1)}%`,
        );
      } else if (mode === "places" && selectedPlace) {
        const existing = places[selectedPlace];
        setPlaces((prev) => ({
          ...prev,
          [selectedPlace]: { ...coords, icon: existing?.icon },
        }));
        setMessage(
          `Placed "${selectedPlace}" at ${coords.x.toFixed(1)}%, ${coords.y.toFixed(1)}%`,
        );
      } else if (mode === "valves" && selectedValve) {
        setValves((prev) => ({ ...prev, [selectedValve]: coords }));
        setMessage(
          `Placed valve "${selectedValve}" at ${coords.x.toFixed(1)}%, ${coords.y.toFixed(1)}%`,
        );
      }
    },
    [mode, selectedLot, selectedPlace, selectedValve, places],
  );

  const handleSave = useCallback(async () => {
    if (issueSummary.errors > 0) {
      const proceed = window.confirm(
        `${issueSummary.errors} error(s) still open (missing or invalid coordinates). Save anyway?`,
      );
      if (!proceed) return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lots, places, valves }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setMessage("Saved map positions.");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to save positions.",
      );
    } finally {
      setSaving(false);
    }
  }, [lots, places, valves, issueSummary.errors]);

  const handleMapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const img = imgRef.current;
      if (!img) return;
      const coords = coordsFromPointer(img, e.clientX, e.clientY);
      if (!coords) return;
      placeMarker(coords);
    },
    [placeMarker],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    const img = imgRef.current;
    if (!drag || !img) return;
    const coords = coordsFromPointer(img, e.clientX, e.clientY);
    if (!coords) return;

    if (drag.kind === "lots") {
      setLots((prev) => ({ ...prev, [drag.id]: coords }));
    } else if (drag.kind === "places") {
      setPlaces((prev) => {
        const existing = prev[drag.id];
        return {
          ...prev,
          [drag.id]: { ...coords, icon: existing?.icon },
        };
      });
    } else {
      setValves((prev) => ({ ...prev, [drag.id]: coords }));
    }
  }, []);

  const endDrag = useCallback(() => {
    const drag = dragRef.current;
    if (drag) {
      setMessage(`Moved "${drag.id}" — click Save to persist.`);
    }
    dragRef.current = null;
  }, []);

  const startDrag = useCallback(
    (
      e: React.PointerEvent,
      kind: "lots" | "places" | "valves",
      id: string,
    ) => {
      e.stopPropagation();
      e.preventDefault();
      dragRef.current = { kind, id };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      if (kind === "lots") {
        setMode("lots");
        setSelectedLot(id);
        setSelectedPlace(null);
        setSelectedValve(null);
      } else if (kind === "places") {
        setMode("places");
        setSelectedPlace(id);
        setSelectedLot(null);
        setSelectedValve(null);
      } else {
        setMode("valves");
        setSelectedValve(id);
        setSelectedLot(null);
        setSelectedPlace(null);
      }
    },
    [],
  );

  const issueByLabel = useMemo(() => {
    const map = new Map<string, MapEditIssue>();
    for (const issue of issues) {
      const key = `${issue.kind}:${issue.label}`;
      const existing = map.get(key);
      if (!existing || issue.severity === "error") {
        map.set(key, issue);
      }
    }
    return map;
  }, [issues]);

  function getMarkerIssue(kind: MapMarkerKind, label: string): MapEditIssue | undefined {
    return issueByLabel.get(`${kind}:${label}`);
  }

  const hasLots = lotIds.length > 0;
  const hasPlaces = placeNames.length > 0;
  const hasValves = valveIdsFromApi.length > 0;
  if (!hasLots && !hasPlaces && !hasValves) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">
          No lots, places, or valves found. Sync from the Google Sheet first.
        </p>
        <Link href="/map" className="text-sm font-medium text-brand-700 hover:underline">
          ← Back to map
        </Link>
      </div>
    );
  }

  const selected =
    mode === "lots"
      ? selectedLot
      : mode === "places"
        ? selectedPlace
        : selectedValve;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Map position editor
          </h1>
          <p className="mt-1 text-sm text-muted">
            Select a lot, place, or valve, then click the map to place it — or
            drag an existing marker. Save when done.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/map"
            className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-hover"
          >
            ← Map
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save positions"}
          </button>
        </div>
      </div>

      {sheetLoadError && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          Could not compare against the valve sheet: {sheetLoadError}. Lot
          missing-coordinate checks may be incomplete until sheet data loads.
        </p>
      )}

      <section
        className={`rounded-xl border px-4 py-3 ${
          issueSummary.ok
            ? "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30"
            : issueSummary.errors > 0
              ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
              : "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">
            {issueSummary.ok
              ? "All checks passed — no coordinate errors."
              : `${issueSummary.errors} error${issueSummary.errors === 1 ? "" : "s"}, ${issueSummary.warnings} warning${issueSummary.warnings === 1 ? "" : "s"}`}
          </p>
          {!issueSummary.ok && issues.length > 0 && (
            <p className="text-xs text-muted">Tap an issue to select and fix it.</p>
          )}
        </div>
        {!issueSummary.ok && issues.length > 0 && (
          <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto">
            {issues.map((issue) => (
              <li key={issue.id}>
                <button
                  type="button"
                  onClick={() => selectMarker(issue.kind, issue.label)}
                  className={`w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-hover ${
                    issue.severity === "error"
                      ? "text-red-800 dark:text-red-200"
                      : "text-amber-900 dark:text-amber-100"
                  }`}
                >
                  <span className="font-medium">
                    {issue.severity === "error" ? "Error" : "Warning"}:
                  </span>{" "}
                  {issue.message}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div
          className={`${MAP_VIEWPORT_CLASS} min-h-[55dvh] flex-1 cursor-crosshair overflow-hidden rounded-xl border border-line bg-black`}
          onClick={handleMapClick}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          role="presentation"
        >
          <div className={MAP_STAGE_CLASS} style={MAP_STAGE_FIT_STYLE}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={PARK_MAP_IMAGE_PATH}
              alt="Park map — click or drag markers"
              className="pointer-events-none absolute inset-0 h-full w-full select-none"
              draggable={false}
            />
          {lotIds.map((lotId) => {
            const pos = lots[lotId];
            if (!pos) return null;
            const isSelected = mode === "lots" && selectedLot === lotId;
            return (
              <div
                key={`lot-${lotId}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 touch-none"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onPointerDown={(e) => startDrag(e, "lots", lotId)}
              >
                <span
                  className={`inline-flex min-h-[36px] min-w-[36px] cursor-grab items-center justify-center rounded px-2 py-1 text-xs font-bold active:cursor-grabbing ${
                    isSelected
                      ? "bg-blue-600 text-white ring-2 ring-white"
                      : "bg-black/70 text-white"
                  }`}
                >
                  {lotId}
                </span>
              </div>
            );
          })}
          {placeNames.map((placeName) => {
            const pos = places[placeName];
            if (!pos) return null;
            const IconComponent = getPlaceIcon(pos.icon ?? "MdPlace");
            const isSelected = mode === "places" && selectedPlace === placeName;
            return (
              <div
                key={`place-${placeName}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 touch-none"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                title={placeName}
                onPointerDown={(e) => startDrag(e, "places", placeName)}
              >
                <span
                  className={`inline-flex cursor-grab items-center justify-center rounded-full p-2 active:cursor-grabbing ${
                    isSelected
                      ? "bg-blue-600 text-white ring-2 ring-white"
                      : getPlaceColor(pos.icon ?? "MdPlace")
                  }`}
                >
                  <IconComponent size={18} />
                </span>
              </div>
            );
          })}
          {valveIdsOnMap.map((valveId) => {
            const pos = valves[valveId];
            if (!pos) return null;
            const isSelected = mode === "valves" && selectedValve === valveId;
            const displayId = /^\d+$/.test(valveId) ? `V${valveId}` : valveId;
            return (
              <div
                key={`valve-${valveId}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 touch-none"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onPointerDown={(e) => startDrag(e, "valves", valveId)}
              >
                <span
                  className={`inline-flex cursor-grab flex-col items-center active:cursor-grabbing ${
                    isSelected ? "text-blue-400" : "text-white"
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center rounded-full p-2 ${
                      isSelected
                        ? "bg-blue-600 ring-2 ring-white"
                        : "bg-slate-600"
                    }`}
                  >
                    <MdPlumbing size={18} />
                  </span>
                  <span className="mt-0.5 rounded bg-slate-700/90 px-1.5 py-0.5 text-[10px] font-bold">
                    {displayId}
                  </span>
                </span>
              </div>
            );
          })}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 lg:w-80">
          <div className="flex overflow-hidden rounded-xl border border-line">
            {(["lots", "places", "valves"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setMode(tab);
                  if (tab === "lots") {
                    setSelectedPlace(null);
                    setSelectedValve(null);
                  } else if (tab === "places") {
                    setSelectedLot(null);
                    setSelectedValve(null);
                  } else {
                    setSelectedLot(null);
                    setSelectedPlace(null);
                  }
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium capitalize ${
                  mode === tab
                    ? "bg-brand-600 text-white"
                    : "bg-surface text-ink hover:bg-hover"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="max-h-96 flex-1 overflow-y-auto rounded-xl border border-line bg-surface p-2">
            {mode === "lots" &&
              lotIds.map((lotId) => {
                const pos = lots[lotId];
                const isSelected = selectedLot === lotId;
                const issue = getMarkerIssue("lot", lotId);
                const hasCoords = isValidCoord(pos);
                return (
                  <button
                    key={lotId}
                    type="button"
                    onClick={() => selectMarker("lot", lotId)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                      isSelected
                        ? "bg-brand-600 text-white"
                        : issue?.severity === "error"
                          ? "bg-red-50 text-red-900 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-100"
                          : issue?.severity === "warning"
                            ? "bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-100"
                            : "text-ink hover:bg-hover"
                    }`}
                  >
                    <span className="font-medium">{lotId}</span>
                    {hasCoords ? (
                      <span className="ml-auto shrink-0 text-xs opacity-70">
                        {pos.x.toFixed(1)}%, {pos.y.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="ml-auto shrink-0 text-xs font-medium opacity-80">
                        No coords
                      </span>
                    )}
                  </button>
                );
              })}
            {mode === "places" &&
              placeNames.map((placeName) => {
                const pos = places[placeName];
                const isSelected = selectedPlace === placeName;
                const IconComponent = getPlaceIcon(pos?.icon ?? "MdPlace");
                const issue = getMarkerIssue("place", placeName);
                const hasCoords = isValidCoord(pos);
                return (
                  <button
                    key={placeName}
                    type="button"
                    onClick={() => selectMarker("place", placeName)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                      isSelected
                        ? "bg-brand-600 text-white"
                        : issue?.severity === "error"
                          ? "bg-red-50 text-red-900 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-100"
                          : "text-ink hover:bg-hover"
                    }`}
                  >
                    <IconComponent size={16} className="shrink-0" />
                    <span className="truncate">{placeName}</span>
                    {hasCoords ? (
                      <span className="ml-auto shrink-0 text-xs opacity-70">
                        {pos.x.toFixed(1)}%, {pos.y.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="ml-auto shrink-0 text-xs font-medium opacity-80">
                        No coords
                      </span>
                    )}
                  </button>
                );
              })}
            {mode === "valves" &&
              valveIdsFromApi.map((valveId) => {
                const pos = valves[valveId];
                const isSelected = selectedValve === valveId;
                const displayId = /^\d+$/.test(valveId) ? `V${valveId}` : valveId;
                const issue = getMarkerIssue("valve", valveId);
                const hasCoords = isValidCoord(pos);
                return (
                  <button
                    key={valveId}
                    type="button"
                    onClick={() => selectMarker("valve", valveId)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                      isSelected
                        ? "bg-brand-600 text-white"
                        : issue?.severity === "warning" || issue?.severity === "error"
                          ? "bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-100"
                          : "text-ink hover:bg-hover"
                    }`}
                  >
                    <MdPlumbing size={16} className="shrink-0" />
                    <span className="font-medium">{displayId}</span>
                    {hasCoords ? (
                      <span className="ml-auto shrink-0 text-xs opacity-70">
                        {pos.x.toFixed(1)}%, {pos.y.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="ml-auto shrink-0 text-xs font-medium opacity-80">
                        No pin
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
          {selected && (
            <p className="text-xs text-muted">
              Selected: <strong>{selected}</strong> — click the map or drag its
              marker.
            </p>
          )}
          {message && (
            <p
              className={`text-sm ${message.includes("Failed") || message.includes("failed") ? "text-red-600" : "text-muted"}`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
