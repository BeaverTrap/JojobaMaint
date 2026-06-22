"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdPlumbing } from "react-icons/md";
import MapEditGoogleMap from "@/components/MapEditGoogleMap";
import { PlaceStylePicker } from "@/components/PlaceStylePicker";
import {
  DEFAULT_PLACE_ICON,
  getPlaceIcon,
  getPlaceMarkerClasses,
  type PlaceIconName,
  type PlaceMarkerColor,
} from "@/lib/map-place-icons";
import { PARK_MAP_IMAGE_PATH } from "@/lib/map-constants";
import {
  MAP_STAGE_CLASS,
  MAP_STAGE_FIT_STYLE,
  MAP_VIEWPORT_CLASS,
} from "@/lib/map-stage";
import { formatMapPosition } from "@/lib/map-coords";
import { isGoogleMapsEnabled } from "@/lib/map-geography";
import { applyLotListSelection, sortLotIds } from "@/lib/map-lot-selection";
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
  const lastLotClickIndex = useRef<number | null>(null);
  const dragRef = useRef<{
    kind: "lots" | "places" | "valves";
    id: string;
  } | null>(null);

  const [lots, setLots] = useState<LotPositions>(initialData.lots);
  const [places, setPlaces] = useState<PlacePositions>(initialData.places);
  const [valves, setValves] = useState<ValvePositions>(initialData.valves);
  const [hiddenLotIds, setHiddenLotIds] = useState<Set<string>>(
    () => new Set(initialData.hiddenLots ?? []),
  );
  const [selectedLotIds, setSelectedLotIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [valveIdsFromApi, setValveIdsFromApi] = useState<string[]>([]);
  const [sheetLots, setSheetLots] = useState<string[]>([]);
  const [sheetLoadError, setSheetLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"lots" | "places" | "valves">("lots");
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [selectedValve, setSelectedValve] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [addedLotIds, setAddedLotIds] = useState<string[]>([]);
  const [newLotId, setNewLotId] = useState("");
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceIcon, setNewPlaceIcon] =
    useState<PlaceIconName>(DEFAULT_PLACE_ICON);
  const [newPlaceColor, setNewPlaceColor] = useState<
    PlaceMarkerColor | undefined
  >(undefined);

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
    const merged = new Set([
      ...Object.keys(lots),
      ...sheetLots,
      ...addedLotIds,
    ]);
    return Array.from(merged).sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }, [lots, sheetLots, addedLotIds]);

  const visibleLotIds = useMemo(
    () => lotIds.filter((id) => !hiddenLotIds.has(id)),
    [lotIds, hiddenLotIds],
  );

  const hiddenLotCount = hiddenLotIds.size;
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
      setSelectedLotIds(new Set([label]));
      lastLotClickIndex.current = lotIds.indexOf(label);
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
  }, [lotIds]);

  const handleLotSidebarClick = useCallback(
    (lotId: string, event: React.MouseEvent) => {
      const { selected, lastIndex } = applyLotListSelection(
        lotIds,
        lotId,
        selectedLotIds,
        lastLotClickIndex.current,
        event,
      );
      setSelectedLotIds(selected);
      lastLotClickIndex.current = lastIndex;
      setMode("lots");
      setSelectedLot(lotId);
      setSelectedPlace(null);
      setSelectedValve(null);
      const count = selected.size;
      setMessage(
        count > 1
          ? `${count} lots selected — use Hide/Show, or click the map to place "${lotId}".`
          : `Selected ${lotId} — click the map or drag its marker.`,
      );
    },
    [lotIds, selectedLotIds],
  );

  const handleLotMapClick = useCallback(
    (
      lotId: string,
      modifiers: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
    ) => {
      const { selected, lastIndex } = applyLotListSelection(
        lotIds,
        lotId,
        selectedLotIds,
        lastLotClickIndex.current,
        modifiers,
      );
      setSelectedLotIds(selected);
      lastLotClickIndex.current = lastIndex;
      setMode("lots");
      setSelectedLot(lotId);
      setSelectedPlace(null);
      setSelectedValve(null);
      const count = selected.size;
      setMessage(
        count > 1
          ? `${count} lots selected — Hide/Show from toolbar, or drag markers.`
          : `Selected ${lotId} — click the map or drag its marker.`,
      );
    },
    [lotIds, selectedLotIds],
  );

  const hideLotsFromMap = useCallback((ids: Iterable<string>) => {
    setHiddenLotIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const showLotsOnMap = useCallback((ids: Iterable<string>) => {
    setHiddenLotIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleHideSelectedLots = useCallback(() => {
    if (selectedLotIds.size === 0) return;
    hideLotsFromMap(selectedLotIds);
    setMessage(
      `Hid ${selectedLotIds.size} lot(s) from the map — coords kept. Save to persist.`,
    );
  }, [hideLotsFromMap, selectedLotIds]);

  const handleShowSelectedLots = useCallback(() => {
    if (selectedLotIds.size === 0) return;
    showLotsOnMap(selectedLotIds);
    setMessage(
      `Showing ${selectedLotIds.size} lot(s) on the map again. Save to persist.`,
    );
  }, [showLotsOnMap, selectedLotIds]);

  const placeMarker = useCallback(
    (coords: { x: number; y: number }) => {
      if (mode === "lots" && selectedLot) {
        setLots((prev) => ({ ...prev, [selectedLot]: coords }));
        setHiddenLotIds((prev) => {
          if (!prev.has(selectedLot)) return prev;
          const next = new Set(prev);
          next.delete(selectedLot);
          return next;
        });
        setMessage(
          `Placed lot "${selectedLot}" at ${formatMapPosition(coords)}`,
        );
      } else if (mode === "places" && selectedPlace) {
        const existing = places[selectedPlace];
        setPlaces((prev) => ({
          ...prev,
          [selectedPlace]: {
            ...coords,
            icon: existing?.icon ?? DEFAULT_PLACE_ICON,
            color: existing?.color,
          },
        }));
        setMessage(
          `Placed "${selectedPlace}" at ${formatMapPosition(coords)}`,
        );
      } else if (mode === "valves" && selectedValve) {
        setValves((prev) => ({ ...prev, [selectedValve]: coords }));
        setMessage(
          `Placed valve "${selectedValve}" at ${formatMapPosition(coords)}`,
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
        body: JSON.stringify({
          lots,
          places,
          valves,
          hiddenLots: sortLotIds(hiddenLotIds),
        }),
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
  }, [lots, places, valves, hiddenLotIds, issueSummary.errors]);

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
          [drag.id]: { ...coords, icon: existing?.icon, color: existing?.color },
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
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          handleLotMapClick(id, {
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey,
          });
          return;
        }
        setMode("lots");
        setSelectedLot(id);
        setSelectedLotIds(new Set([id]));
        lastLotClickIndex.current = lotIds.indexOf(id);
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
    [handleLotMapClick, lotIds],
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

  const handleAddLot = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const id = newLotId.trim();
      if (!id) return;
      if (places[id]) {
        setMessage(`"${id}" is already a place name — use a different lot id.`);
        return;
      }
      setAddedLotIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setNewLotId("");
      selectMarker("lot", id);
      setMessage(`Added lot "${id}" — click the map to place it.`);
    },
    [newLotId, places, selectMarker],
  );

  const handleRemoveLot = useCallback(
    (lotId: string) => {
      const onSheet = sheetLots.includes(lotId);
      const prompt = onSheet
        ? `Remove map position for lot "${lotId}"? It will stay on the valve sheet list until you place it again.`
        : `Remove lot "${lotId}" from the map?`;
      if (!window.confirm(prompt)) return;

      setLots((prev) => {
        const next = { ...prev };
        delete next[lotId];
        return next;
      });
      setAddedLotIds((prev) => prev.filter((id) => id !== lotId));
      setHiddenLotIds((prev) => {
        const next = new Set(prev);
        next.delete(lotId);
        return next;
      });
      if (selectedLot === lotId) setSelectedLot(null);
      setSelectedLotIds((prev) => {
        const next = new Set(prev);
        next.delete(lotId);
        return next;
      });
      setMessage(`Removed lot "${lotId}" from the map. Save to persist.`);
    },
    [sheetLots, selectedLot],
  );

  const handleAddPlace = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const name = newPlaceName.trim();
      if (!name) return;
      if (places[name]) {
        setMessage(`Place "${name}" already exists.`);
        return;
      }
      setPlaces((prev) => ({
        ...prev,
        [name]: { icon: newPlaceIcon, color: newPlaceColor },
      }));
      setNewPlaceName("");
      setNewPlaceIcon(DEFAULT_PLACE_ICON);
      setNewPlaceColor(undefined);
      selectMarker("place", name);
      setMessage(`Added "${name}" — click the map to place it.`);
    },
    [newPlaceName, newPlaceIcon, newPlaceColor, places, selectMarker],
  );

  const handleRemovePlace = useCallback(
    (placeName: string) => {
      if (!window.confirm(`Remove "${placeName}" from the map?`)) return;

      setPlaces((prev) => {
        const next = { ...prev };
        delete next[placeName];
        return next;
      });
      if (selectedPlace === placeName) setSelectedPlace(null);
      setMessage(`Removed "${placeName}". Save to persist.`);
    },
    [selectedPlace],
  );

  const handlePlaceIconChange = useCallback(
    (placeName: string, icon: PlaceIconName) => {
      setPlaces((prev) => {
        const existing = prev[placeName];
        if (!existing) return prev;
        return {
          ...prev,
          [placeName]: { ...existing, icon },
        };
      });
      setMessage(`Updated icon for "${placeName}".`);
    },
    [],
  );

  const handlePlaceColorChange = useCallback(
    (placeName: string, color: PlaceMarkerColor | undefined) => {
      setPlaces((prev) => {
        const existing = prev[placeName];
        if (!existing) return prev;
        return {
          ...prev,
          [placeName]: { ...existing, color },
        };
      });
      setMessage(
        color
          ? `Updated color for "${placeName}".`
          : `Reset "${placeName}" to auto color from icon.`,
      );
    },
    [],
  );

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
            Select a lot, place, or valve, then click the map to place
            it — or drag an existing marker. For lots: Shift+click a range,
            Ctrl+click to toggle, then Hide/Show to declutter the map. Save when
            done.
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
        {isGoogleMapsEnabled() ? (
          <MapEditGoogleMap
            lots={lots}
            places={places}
            valves={valves}
            lotIds={visibleLotIds}
            placeNames={placeNames}
            valveIdsOnMap={valveIdsOnMap}
            mode={mode}
            selectedLot={selectedLot}
            selectedLotIds={selectedLotIds}
            selectedPlace={selectedPlace}
            selectedValve={selectedValve}
            onPlaceCoords={placeMarker}
            onMoveLot={(lotId, coords) => {
              setLots((prev) => ({ ...prev, [lotId]: coords }));
              setHiddenLotIds((prev) => {
                if (!prev.has(lotId)) return prev;
                const next = new Set(prev);
                next.delete(lotId);
                return next;
              });
              setMessage(`Moved lot "${lotId}" to ${formatMapPosition(coords)}`);
            }}
            onMovePlace={(placeName, coords) => {
              setPlaces((prev) => {
                const existing = prev[placeName];
                return {
                  ...prev,
                  [placeName]: {
                    ...coords,
                    icon: existing?.icon,
                    color: existing?.color,
                  },
                };
              });
              setMessage(`Moved "${placeName}" to ${formatMapPosition(coords)}`);
            }}
            onMoveValve={(valveId, coords) => {
              setValves((prev) => ({ ...prev, [valveId]: coords }));
              setMessage(`Moved valve "${valveId}" to ${formatMapPosition(coords)}`);
            }}
            onSelectLot={handleLotMapClick}
            onSelectPlace={(placeName) => selectMarker("place", placeName)}
            onSelectValve={(valveId) => selectMarker("valve", valveId)}
          />
        ) : (
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
          {visibleLotIds.map((lotId) => {
            const pos = lots[lotId];
            if (!pos || !isValidCoord(pos)) return null;
            const isSelected =
              mode === "lots" &&
              (selectedLot === lotId || selectedLotIds.has(lotId));
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
            if (!pos || !isValidCoord(pos)) return null;
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
                      : getPlaceMarkerClasses(pos)
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
        )}

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
            {mode === "lots" && (
              <form
                onSubmit={handleAddLot}
                className="mb-2 flex flex-col gap-2 border-b border-line pb-2"
              >
                <label className="text-xs font-medium text-muted">
                  Add lot
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLotId}
                    onChange={(e) => setNewLotId(e.target.value)}
                    placeholder="Lot number"
                    className="min-w-0 flex-1 rounded-lg border border-line bg-page px-2 py-1.5 text-sm text-ink"
                  />
                  <button
                    type="submit"
                    disabled={!newLotId.trim()}
                    className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </form>
            )}
            {mode === "lots" && (
              <div className="mb-2 flex flex-col gap-2 border-b border-line pb-2">
                <p className="text-[11px] leading-snug text-muted">
                  Shift+click range · Ctrl+click toggle ·{" "}
                  {hiddenLotCount > 0
                    ? `${hiddenLotCount} hidden from map`
                    : "Hide lots to reduce clutter"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={selectedLotIds.size === 0}
                    onClick={handleHideSelectedLots}
                    className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink hover:bg-hover disabled:opacity-50"
                  >
                    Hide from map
                    {selectedLotIds.size > 0 ? ` (${selectedLotIds.size})` : ""}
                  </button>
                  <button
                    type="button"
                    disabled={selectedLotIds.size === 0}
                    onClick={handleShowSelectedLots}
                    className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink hover:bg-hover disabled:opacity-50"
                  >
                    Show on map
                    {selectedLotIds.size > 0 ? ` (${selectedLotIds.size})` : ""}
                  </button>
                  {selectedLotIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLotIds(new Set());
                        setSelectedLot(null);
                      }}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted hover:bg-hover"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
            {mode === "places" && (
              <form
                onSubmit={handleAddPlace}
                className="mb-2 flex flex-col gap-2 border-b border-line pb-2"
              >
                <label className="text-xs font-medium text-muted">
                  Add place
                </label>
                <input
                  type="text"
                  value={newPlaceName}
                  onChange={(e) => setNewPlaceName(e.target.value)}
                  placeholder="Place name"
                  className="w-full rounded-lg border border-line bg-page px-2 py-1.5 text-sm text-ink"
                />
                <PlaceStylePicker
                  icon={newPlaceIcon}
                  color={newPlaceColor}
                  onIconChange={setNewPlaceIcon}
                  onColorChange={setNewPlaceColor}
                />
                <button
                  type="submit"
                  disabled={!newPlaceName.trim()}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  Add place
                </button>
              </form>
            )}
            {mode === "lots" &&
              lotIds.map((lotId) => {
                const pos = lots[lotId];
                const isMultiSelected = selectedLotIds.has(lotId);
                const isHidden = hiddenLotIds.has(lotId);
                const issue = getMarkerIssue("lot", lotId);
                const hasCoords = isValidCoord(pos);
                const isUserAdded = addedLotIds.includes(lotId);
                return (
                  <div
                    key={lotId}
                    className={`flex items-center gap-1 rounded-lg ${
                      isMultiSelected ? "bg-brand-600" : ""
                    } ${isHidden && !isMultiSelected ? "opacity-55" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={(e) => handleLotSidebarClick(lotId, e)}
                      className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                        isMultiSelected
                          ? "text-white"
                          : issue?.severity === "error"
                            ? "bg-red-50 text-red-900 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-100"
                            : issue?.severity === "warning"
                              ? "bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-100"
                              : "text-ink hover:bg-hover"
                      }`}
                    >
                      <span className="font-medium">{lotId}</span>
                      {isHidden && (
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            isMultiSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          }`}
                        >
                          Hidden
                        </span>
                      )}
                      {hasCoords ? (
                        <span className="ml-auto shrink-0 text-xs opacity-70">
                          {formatMapPosition(pos)}
                        </span>
                      ) : (
                        <span className="ml-auto shrink-0 text-xs font-medium opacity-80">
                          No coords
                        </span>
                      )}
                    </button>
                    {isHidden ? (
                      <button
                        type="button"
                        title={`Show lot ${lotId} on map`}
                        onClick={() => {
                          showLotsOnMap([lotId]);
                          setMessage(`Showing lot "${lotId}" on the map.`);
                        }}
                        className={`shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium ${
                          isMultiSelected
                            ? "text-white/90 hover:bg-white/20"
                            : "text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/40"
                        }`}
                      >
                        Show
                      </button>
                    ) : (
                      <button
                        type="button"
                        title={`Hide lot ${lotId} from map`}
                        onClick={() => {
                          hideLotsFromMap([lotId]);
                          setMessage(`Hid lot "${lotId}" from the map.`);
                        }}
                        className={`shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium ${
                          isMultiSelected
                            ? "text-white/90 hover:bg-white/20"
                            : "text-muted hover:bg-hover"
                        }`}
                      >
                        Hide
                      </button>
                    )}
                    {isUserAdded && !sheetLots.includes(lotId) && (
                      <button
                        type="button"
                        title={`Delete lot ${lotId}`}
                        onClick={() => handleRemoveLot(lotId)}
                        className={`shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium ${
                          isMultiSelected
                            ? "text-white/90 hover:bg-white/20"
                            : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        }`}
                      >
                        Del
                      </button>
                    )}
                  </div>
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
                  <div
                    key={placeName}
                    className={`flex items-center gap-1 rounded-lg ${
                      isSelected ? "bg-brand-600" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => selectMarker("place", placeName)}
                      className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                        isSelected
                          ? "text-white"
                          : issue?.severity === "error"
                            ? "bg-red-50 text-red-900 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-100"
                            : "text-ink hover:bg-hover"
                      }`}
                    >
                      <IconComponent size={16} className="shrink-0" />
                      <span className="truncate">{placeName}</span>
                      {hasCoords ? (
                        <span className="ml-auto shrink-0 text-xs opacity-70">
                          {formatMapPosition(pos)}
                        </span>
                      ) : (
                        <span className="ml-auto shrink-0 text-xs font-medium opacity-80">
                          No coords
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      title={`Remove ${placeName}`}
                      onClick={() => handleRemovePlace(placeName)}
                      className={`shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium ${
                        isSelected
                          ? "text-white/90 hover:bg-white/20"
                          : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                      }`}
                    >
                      Delete
                    </button>
                  </div>
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
                        {formatMapPosition(pos)}
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
          {selected && mode === "places" && selectedPlace && places[selectedPlace] && (
            <div className="rounded-xl border border-line bg-surface p-2">
              <p className="mb-2 text-xs font-medium text-muted">
                Style for {selectedPlace}
              </p>
              <PlaceStylePicker
                icon={
                  (places[selectedPlace]?.icon ??
                    DEFAULT_PLACE_ICON) as PlaceIconName
                }
                color={places[selectedPlace]?.color}
                onIconChange={(icon) =>
                  handlePlaceIconChange(selectedPlace, icon)
                }
                onColorChange={(color) =>
                  handlePlaceColorChange(selectedPlace, color)
                }
              />
            </div>
          )}
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
