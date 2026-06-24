"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdPlumbing } from "react-icons/md";
import MapEditGoogleMap from "@/components/MapEditGoogleMap";
import {
  MapEditSelectionToolbar,
  type MapListFilter,
} from "@/components/MapEditSelectionToolbar";
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
import { applyListSelection } from "@/lib/map-lot-selection";
import { initialMapEditSnapshot } from "@/lib/map-edit-history";
import type { MapPositions } from "@/lib/map-positions";
import { useMapEditHistory } from "@/hooks/use-map-edit-history";
import {
  isValidCoord,
  summarizeMapEditIssues,
  validateMapPositions,
  type MapEditIssue,
  type MapMarkerKind,
} from "@/lib/map-edit-validation";


function selectionMessage(
  kind: "lot" | "place" | "valve",
  count: number,
  id: string,
  isPlaced: boolean,
): string {
  const label = kind === "lot" ? "lots" : kind === "place" ? "places" : "valves";
  if (count > 1) {
    return `${count} ${label} selected — Reset to pull off the map, or drag markers.`;
  }
  if (isPlaced) {
    return `Selected ${id} — drag to move or Reset to pull off the map.`;
  }
  return `Selected ${id} — pan here and click the map to place it.`;
}

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
  const lastPlaceClickIndex = useRef<number | null>(null);
  const lastValveClickIndex = useRef<number | null>(null);
  const dragRef = useRef<{
    kind: "lots" | "places" | "valves";
    id: string;
  } | null>(null);

  const {
    lots,
    places,
    valves,
    mutate,
    patch,
    record,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useMapEditHistory(initialMapEditSnapshot(initialData));
  const [selectedLotIds, setSelectedLotIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedValveIds, setSelectedValveIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [lotListFilter, setLotListFilter] = useState<MapListFilter>("all");
  const [placeListFilter, setPlaceListFilter] = useState<MapListFilter>("all");
  const [valveListFilter, setValveListFilter] = useState<MapListFilter>("all");
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

  const placedLotIds = useMemo(
    () => lotIds.filter((id) => isValidCoord(lots[id])),
    [lotIds, lots],
  );

  const unplacedLotCount = lotIds.length - placedLotIds.length;
  const filteredLotIds = useMemo(() => {
    if (lotListFilter === "on-map") {
      return lotIds.filter((id) => isValidCoord(lots[id]));
    }
    if (lotListFilter === "unplaced") {
      return lotIds.filter((id) => !isValidCoord(lots[id]));
    }
    return lotIds;
  }, [lotIds, lotListFilter, lots]);

  const placeNames = useMemo(
    () => Object.keys(places).sort((a, b) => a.localeCompare(b)),
    [places],
  );
  const placedPlaceNames = useMemo(
    () => placeNames.filter((name) => isValidCoord(places[name])),
    [placeNames, places],
  );
  const filteredPlaceNames = useMemo(() => {
    if (placeListFilter === "on-map") {
      return placeNames.filter((name) => isValidCoord(places[name]));
    }
    if (placeListFilter === "unplaced") {
      return placeNames.filter((name) => !isValidCoord(places[name]));
    }
    return placeNames;
  }, [placeNames, placeListFilter, places]);

  const valveIds = useMemo(() => {
    const merged = new Set([...Object.keys(valves), ...valveIdsFromApi]);
    return Array.from(merged).sort(naturalSort);
  }, [valves, valveIdsFromApi]);
  const placedValveIds = useMemo(
    () => valveIds.filter((id) => isValidCoord(valves[id])),
    [valveIds, valves],
  );
  const filteredValveIds = useMemo(() => {
    if (valveListFilter === "on-map") {
      return valveIds.filter((id) => isValidCoord(valves[id]));
    }
    if (valveListFilter === "unplaced") {
      return valveIds.filter((id) => !isValidCoord(valves[id]));
    }
    return valveIds;
  }, [valveIds, valveListFilter, valves]);

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
      setSelectedPlaceIds(new Set());
      setSelectedValve(null);
      setSelectedValveIds(new Set());
      setMessage(
        !isValidCoord(lots[label])
          ? `Selected ${label} — pan to the right area and click the map to place.`
          : `Selected ${label} — click the map or drag its marker to fix.`,
      );
    } else if (kind === "place") {
      setMode("places");
      setSelectedPlace(label);
      setSelectedPlaceIds(new Set([label]));
      lastPlaceClickIndex.current = placeNames.indexOf(label);
      setSelectedLot(null);
      setSelectedLotIds(new Set());
      setSelectedValve(null);
      setSelectedValveIds(new Set());
      setMessage(
        !isValidCoord(places[label])
          ? `Selected ${label} — pan to the right area and click the map to place.`
          : `Selected ${label} — click the map or drag its marker to fix.`,
      );
    } else {
      setMode("valves");
      setSelectedValve(label);
      setSelectedValveIds(new Set([label]));
      lastValveClickIndex.current = valveIds.indexOf(label);
      setSelectedLot(null);
      setSelectedLotIds(new Set());
      setSelectedPlace(null);
      setSelectedPlaceIds(new Set());
      setMessage(
        !isValidCoord(valves[label])
          ? `Selected ${label} — pan to the right area and click the map to place.`
          : `Selected ${label} — click the map or drag its marker to fix.`,
      );
    }
  }, [lotIds, lots, placeNames, places, valveIds, valves]);

  const handleLotSidebarClick = useCallback(
    (lotId: string, event: React.MouseEvent) => {
      const { selected, lastIndex } = applyListSelection(
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
      setSelectedPlaceIds(new Set());
      setSelectedValve(null);
      setSelectedValveIds(new Set());
      setMessage(
        selectionMessage("lot", selected.size, lotId, isValidCoord(lots[lotId])),
      );
    },
    [lotIds, selectedLotIds, lots],
  );

  const handlePlaceSidebarClick = useCallback(
    (placeName: string, event: React.MouseEvent) => {
      const { selected, lastIndex } = applyListSelection(
        placeNames,
        placeName,
        selectedPlaceIds,
        lastPlaceClickIndex.current,
        event,
      );
      setSelectedPlaceIds(selected);
      lastPlaceClickIndex.current = lastIndex;
      setMode("places");
      setSelectedPlace(placeName);
      setSelectedLot(null);
      setSelectedLotIds(new Set());
      setSelectedValve(null);
      setSelectedValveIds(new Set());
      setMessage(
        selectionMessage(
          "place",
          selected.size,
          placeName,
          isValidCoord(places[placeName]),
        ),
      );
    },
    [placeNames, places, selectedPlaceIds],
  );

  const handleValveSidebarClick = useCallback(
    (valveId: string, event: React.MouseEvent) => {
      const { selected, lastIndex } = applyListSelection(
        valveIds,
        valveId,
        selectedValveIds,
        lastValveClickIndex.current,
        event,
      );
      setSelectedValveIds(selected);
      lastValveClickIndex.current = lastIndex;
      setMode("valves");
      setSelectedValve(valveId);
      setSelectedLot(null);
      setSelectedLotIds(new Set());
      setSelectedPlace(null);
      setSelectedPlaceIds(new Set());
      setMessage(
        selectionMessage(
          "valve",
          selected.size,
          valveId,
          isValidCoord(valves[valveId]),
        ),
      );
    },
    [valveIds, valves, selectedValveIds],
  );

  const handleLotMapClick = useCallback(
    (
      lotId: string,
      modifiers: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
    ) => {
      const { selected, lastIndex } = applyListSelection(
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
      setSelectedPlaceIds(new Set());
      setSelectedValve(null);
      setSelectedValveIds(new Set());
      setMessage(
        selectionMessage("lot", selected.size, lotId, isValidCoord(lots[lotId])),
      );
    },
    [lotIds, selectedLotIds, lots],
  );

  const handlePlaceMapClick = useCallback(
    (
      placeName: string,
      modifiers: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
    ) => {
      const { selected, lastIndex } = applyListSelection(
        placeNames,
        placeName,
        selectedPlaceIds,
        lastPlaceClickIndex.current,
        modifiers,
      );
      setSelectedPlaceIds(selected);
      lastPlaceClickIndex.current = lastIndex;
      setMode("places");
      setSelectedPlace(placeName);
      setSelectedLot(null);
      setSelectedLotIds(new Set());
      setSelectedValve(null);
      setSelectedValveIds(new Set());
      setMessage(
        selectionMessage(
          "place",
          selected.size,
          placeName,
          isValidCoord(places[placeName]),
        ),
      );
    },
    [placeNames, places, selectedPlaceIds],
  );

  const handleValveMapClick = useCallback(
    (
      valveId: string,
      modifiers: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
    ) => {
      const { selected, lastIndex } = applyListSelection(
        valveIds,
        valveId,
        selectedValveIds,
        lastValveClickIndex.current,
        modifiers,
      );
      setSelectedValveIds(selected);
      lastValveClickIndex.current = lastIndex;
      setMode("valves");
      setSelectedValve(valveId);
      setSelectedLot(null);
      setSelectedLotIds(new Set());
      setSelectedPlace(null);
      setSelectedPlaceIds(new Set());
      setMessage(
        selectionMessage(
          "valve",
          selected.size,
          valveId,
          isValidCoord(valves[valveId]),
        ),
      );
    },
    [valveIds, valves, selectedValveIds],
  );

  const resetLotPositions = useCallback(
    (ids: Iterable<string>) => {
      const idList = Array.from(ids);
      if (idList.length === 0) return;
      mutate((prev) => {
        const nextLots = { ...prev.lots };
        for (const id of idList) {
          delete nextLots[id];
        }
        return { ...prev, lots: nextLots };
      });
    },
    [mutate],
  );

  const handleResetSelectedLots = useCallback(() => {
    if (selectedLotIds.size === 0) return;
    const ids = Array.from(selectedLotIds);
    const placedCount = ids.filter((id) => isValidCoord(lots[id])).length;
    resetLotPositions(ids);
    setMessage(
      placedCount > 0
        ? `Pulled ${placedCount} lot(s) off the map (${ids.length} selected) — click the map to place again.`
        : `${ids.length} selected lot(s) are already unplaced.`,
    );
  }, [resetLotPositions, selectedLotIds, lots]);

  const resetLotsWithSelection = useCallback(
    (lotId: string) => {
      const ids =
        selectedLotIds.size > 1 && selectedLotIds.has(lotId)
          ? Array.from(selectedLotIds)
          : [lotId];
      const placedCount = ids.filter((id) => isValidCoord(lots[id])).length;
      resetLotPositions(ids);
      if (ids.length > 1) {
        setMessage(
          placedCount > 0
            ? `Pulled ${placedCount} selected lot(s) off the map — click the map to place again.`
            : `${ids.length} selected lots are already unplaced.`,
        );
      } else {
        selectMarker("lot", lotId);
        setMessage(
          `Reset lot "${lotId}" — pan to the right spot and click the map.`,
        );
      }
    },
    [lots, resetLotPositions, selectMarker, selectedLotIds],
  );

  const handleResetAllPlacedLots = useCallback(() => {
    const placed = lotIds.filter((id) => isValidCoord(lots[id]));
    if (placed.length === 0) return;
    if (
      !window.confirm(
        `Pull all ${placed.length} placed lots off the map? Coordinates will be cleared until you place them again.`,
      )
    ) {
      return;
    }
    resetLotPositions(placed);
    setLotListFilter("unplaced");
    setMessage(
      `Pulled ${placed.length} lots off the map. Filter set to Unplaced — place them one area at a time.`,
    );
  }, [lotIds, lots, resetLotPositions]);

  const resetPlacePositions = useCallback(
    (ids: Iterable<string>) => {
      const idList = Array.from(ids);
      if (idList.length === 0) return;
      mutate((prev) => {
        const nextPlaces = { ...prev.places };
        for (const id of idList) {
          const existing = nextPlaces[id];
          if (!existing) continue;
          nextPlaces[id] = {
            icon: existing.icon ?? DEFAULT_PLACE_ICON,
            color: existing.color,
          };
        }
        return { ...prev, places: nextPlaces };
      });
    },
    [mutate],
  );

  const resetValvePositions = useCallback(
    (ids: Iterable<string>) => {
      const idList = Array.from(ids);
      if (idList.length === 0) return;
      mutate((prev) => {
        const nextValves = { ...prev.valves };
        for (const id of idList) {
          delete nextValves[id];
        }
        return { ...prev, valves: nextValves };
      });
    },
    [mutate],
  );

  const handleResetSelectedPlaces = useCallback(() => {
    if (selectedPlaceIds.size === 0) return;
    const ids = Array.from(selectedPlaceIds);
    const placedCount = ids.filter((id) => isValidCoord(places[id])).length;
    resetPlacePositions(ids);
    setMessage(
      placedCount > 0
        ? `Pulled ${placedCount} place(s) off the map (${ids.length} selected) — click the map to place again.`
        : `${ids.length} selected place(s) are already unplaced.`,
    );
  }, [places, resetPlacePositions, selectedPlaceIds]);

  const resetPlacesWithSelection = useCallback(
    (placeName: string) => {
      const ids =
        selectedPlaceIds.size > 1 && selectedPlaceIds.has(placeName)
          ? Array.from(selectedPlaceIds)
          : [placeName];
      const placedCount = ids.filter((id) => isValidCoord(places[id])).length;
      resetPlacePositions(ids);
      if (ids.length > 1) {
        setMessage(
          placedCount > 0
            ? `Pulled ${placedCount} selected place(s) off the map — click the map to place again.`
            : `${ids.length} selected places are already unplaced.`,
        );
      } else {
        selectMarker("place", placeName);
        setMessage(
          `Reset "${placeName}" — pan to the right spot and click the map.`,
        );
      }
    },
    [places, resetPlacePositions, selectMarker, selectedPlaceIds],
  );

  const handleResetAllPlacedPlaces = useCallback(() => {
    const placed = placeNames.filter((name) => isValidCoord(places[name]));
    if (placed.length === 0) return;
    if (
      !window.confirm(
        `Pull all ${placed.length} placed locations off the map? Coordinates will be cleared until you place them again.`,
      )
    ) {
      return;
    }
    resetPlacePositions(placed);
    setPlaceListFilter("unplaced");
    setMessage(
      `Pulled ${placed.length} places off the map. Filter set to Unplaced.`,
    );
  }, [placeNames, places, resetPlacePositions]);

  const handleResetSelectedValves = useCallback(() => {
    if (selectedValveIds.size === 0) return;
    const ids = Array.from(selectedValveIds);
    const placedCount = ids.filter((id) => isValidCoord(valves[id])).length;
    resetValvePositions(ids);
    setMessage(
      placedCount > 0
        ? `Pulled ${placedCount} valve(s) off the map (${ids.length} selected) — click the map to place again.`
        : `${ids.length} selected valve(s) are already unplaced.`,
    );
  }, [resetValvePositions, selectedValveIds, valves]);

  const resetValvesWithSelection = useCallback(
    (valveId: string) => {
      const ids =
        selectedValveIds.size > 1 && selectedValveIds.has(valveId)
          ? Array.from(selectedValveIds)
          : [valveId];
      const placedCount = ids.filter((id) => isValidCoord(valves[id])).length;
      resetValvePositions(ids);
      if (ids.length > 1) {
        setMessage(
          placedCount > 0
            ? `Pulled ${placedCount} selected valve(s) off the map — click the map to place again.`
            : `${ids.length} selected valves are already unplaced.`,
        );
      } else {
        selectMarker("valve", valveId);
        setMessage(
          `Reset valve "${valveId}" — pan to the right spot and click the map.`,
        );
      }
    },
    [resetValvePositions, selectMarker, selectedValveIds, valves],
  );

  const handleResetAllPlacedValves = useCallback(() => {
    const placed = valveIds.filter((id) => isValidCoord(valves[id]));
    if (placed.length === 0) return;
    if (
      !window.confirm(
        `Pull all ${placed.length} placed valves off the map? Coordinates will be cleared until you place them again.`,
      )
    ) {
      return;
    }
    resetValvePositions(placed);
    setValveListFilter("unplaced");
    setMessage(
      `Pulled ${placed.length} valves off the map. Filter set to Unplaced.`,
    );
  }, [resetValvePositions, valveIds, valves]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (mod) {
        if (key === "z" && !event.shiftKey) {
          event.preventDefault();
          undo();
          setMessage("Undid last change.");
        } else if (key === "y" || (key === "z" && event.shiftKey)) {
          event.preventDefault();
          redo();
          setMessage("Redid change.");
        }
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (mode === "lots" && selectedLotIds.size > 0) {
          event.preventDefault();
          handleResetSelectedLots();
        } else if (mode === "places" && selectedPlaceIds.size > 0) {
          event.preventDefault();
          handleResetSelectedPlaces();
        } else if (mode === "valves" && selectedValveIds.size > 0) {
          event.preventDefault();
          handleResetSelectedValves();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    undo,
    redo,
    mode,
    selectedLotIds,
    selectedPlaceIds,
    selectedValveIds,
    handleResetSelectedLots,
    handleResetSelectedPlaces,
    handleResetSelectedValves,
  ]);

  const placeMarker = useCallback(
    (coords: { x: number; y: number }) => {
      if (mode === "lots" && selectedLot) {
        mutate((prev) => ({
          ...prev,
          lots: { ...prev.lots, [selectedLot]: coords },
        }));
        setMessage(
          `Placed lot "${selectedLot}" at ${formatMapPosition(coords)}`,
        );
      } else if (mode === "places" && selectedPlace) {
        mutate((prev) => {
          const existing = prev.places[selectedPlace];
          return {
            ...prev,
            places: {
              ...prev.places,
              [selectedPlace]: {
                ...coords,
                icon: existing?.icon ?? DEFAULT_PLACE_ICON,
                color: existing?.color,
              },
            },
          };
        });
        setMessage(
          `Placed "${selectedPlace}" at ${formatMapPosition(coords)}`,
        );
      } else if (mode === "valves" && selectedValve) {
        mutate((prev) => ({
          ...prev,
          valves: { ...prev.valves, [selectedValve]: coords },
        }));
        setMessage(
          `Placed valve "${selectedValve}" at ${formatMapPosition(coords)}`,
        );
      }
    },
    [mode, selectedLot, selectedPlace, selectedValve, mutate],
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
          hiddenLots: [],
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
      patch((prev) => ({
        ...prev,
        lots: { ...prev.lots, [drag.id]: coords },
      }));
    } else if (drag.kind === "places") {
      patch((prev) => {
        const existing = prev.places[drag.id];
        return {
          ...prev,
          places: {
            ...prev.places,
            [drag.id]: { ...coords, icon: existing?.icon, color: existing?.color },
          },
        };
      });
    } else {
      patch((prev) => ({
        ...prev,
        valves: { ...prev.valves, [drag.id]: coords },
      }));
    }
  }, [patch]);

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
      record();
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
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          handlePlaceMapClick(id, {
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey,
          });
          return;
        }
        setMode("places");
        setSelectedPlace(id);
        setSelectedPlaceIds(new Set([id]));
        lastPlaceClickIndex.current = placeNames.indexOf(id);
        setSelectedLot(null);
        setSelectedLotIds(new Set());
        setSelectedValve(null);
        setSelectedValveIds(new Set());
      } else {
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          handleValveMapClick(id, {
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey,
          });
          return;
        }
        setMode("valves");
        setSelectedValve(id);
        setSelectedValveIds(new Set([id]));
        lastValveClickIndex.current = valveIds.indexOf(id);
        setSelectedLot(null);
        setSelectedLotIds(new Set());
        setSelectedPlace(null);
        setSelectedPlaceIds(new Set());
      }
    },
    [
      handleLotMapClick,
      handlePlaceMapClick,
      handleValveMapClick,
      lotIds,
      placeNames,
      valveIds,
      record,
    ],
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

      mutate((prev) => {
        const nextLots = { ...prev.lots };
        delete nextLots[lotId];
        return { ...prev, lots: nextLots };
      });
      setAddedLotIds((prev) => prev.filter((id) => id !== lotId));
      if (selectedLot === lotId) setSelectedLot(null);
      setSelectedLotIds((prev) => {
        const next = new Set(prev);
        next.delete(lotId);
        return next;
      });
      setMessage(`Removed lot "${lotId}" from the map. Save to persist.`);
    },
    [sheetLots, selectedLot, mutate],
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
      mutate((prev) => ({
        ...prev,
        places: {
          ...prev.places,
          [name]: { icon: newPlaceIcon, color: newPlaceColor },
        },
      }));
      setNewPlaceName("");
      setNewPlaceIcon(DEFAULT_PLACE_ICON);
      setNewPlaceColor(undefined);
      selectMarker("place", name);
      setMessage(`Added "${name}" — click the map to place it.`);
    },
    [newPlaceName, newPlaceIcon, newPlaceColor, places, selectMarker, mutate],
  );

  const handleRemovePlace = useCallback(
    (placeName: string) => {
      if (!window.confirm(`Remove "${placeName}" from the map?`)) return;

      mutate((prev) => {
        const nextPlaces = { ...prev.places };
        delete nextPlaces[placeName];
        return { ...prev, places: nextPlaces };
      });
      if (selectedPlace === placeName) setSelectedPlace(null);
      setSelectedPlaceIds((prev) => {
        const next = new Set(prev);
        next.delete(placeName);
        return next;
      });
      setMessage(`Removed "${placeName}". Save to persist.`);
    },
    [selectedPlace, mutate],
  );

  const handlePlaceIconChange = useCallback(
    (placeName: string, icon: PlaceIconName) => {
      mutate((prev) => {
        const existing = prev.places[placeName];
        if (!existing) return prev;
        return {
          ...prev,
          places: {
            ...prev.places,
            [placeName]: { ...existing, icon },
          },
        };
      });
      setMessage(`Updated icon for "${placeName}".`);
    },
    [mutate],
  );

  const handlePlaceColorChange = useCallback(
    (placeName: string, color: PlaceMarkerColor | undefined) => {
      mutate((prev) => {
        const existing = prev.places[placeName];
        if (!existing) return prev;
        return {
          ...prev,
          places: {
            ...prev.places,
            [placeName]: { ...existing, color },
          },
        };
      });
      setMessage(
        color
          ? `Updated color for "${placeName}".`
          : `Reset "${placeName}" to auto color from icon.`,
      );
    },
    [mutate],
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
            Pull misplaced lots, places, or valves off the map (Reset), pan to
            the right area, select an item, and click to place. Shift+click to
            select a range, then Reset all selected or press Delete. Ctrl+Z /
            Ctrl+Y undo/redo. Save when done.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-hover disabled:opacity-40"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-hover disabled:opacity-40"
          >
            Redo
          </button>
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

      <div className="flex min-h-[calc(100dvh-13rem)] flex-col gap-4 xl:min-h-[calc(100dvh-11rem)] xl:flex-row xl:items-stretch">
        {isGoogleMapsEnabled() ? (
          <div className="flex min-h-[55dvh] min-w-0 flex-1 flex-col xl:min-h-0">
          <MapEditGoogleMap
            lots={lots}
            places={places}
            valves={valves}
            lotIds={placedLotIds}
            placeNames={placedPlaceNames}
            valveIdsOnMap={placedValveIds}
            mode={mode}
            selectedLot={selectedLot}
            selectedLotIds={selectedLotIds}
            selectedPlace={selectedPlace}
            selectedPlaceIds={selectedPlaceIds}
            selectedValve={selectedValve}
            selectedValveIds={selectedValveIds}
            onPlaceCoords={placeMarker}
            onMoveLot={(lotId, coords) => {
              mutate((prev) => ({
                ...prev,
                lots: { ...prev.lots, [lotId]: coords },
              }));
              setMessage(`Moved lot "${lotId}" to ${formatMapPosition(coords)}`);
            }}
            onMovePlace={(placeName, coords) => {
              mutate((prev) => {
                const existing = prev.places[placeName];
                return {
                  ...prev,
                  places: {
                    ...prev.places,
                    [placeName]: {
                      ...coords,
                      icon: existing?.icon,
                      color: existing?.color,
                    },
                  },
                };
              });
              setMessage(`Moved "${placeName}" to ${formatMapPosition(coords)}`);
            }}
            onMoveValve={(valveId, coords) => {
              mutate((prev) => ({
                ...prev,
                valves: { ...prev.valves, [valveId]: coords },
              }));
              setMessage(`Moved valve "${valveId}" to ${formatMapPosition(coords)}`);
            }}
            onSelectLot={handleLotMapClick}
            onSelectPlace={handlePlaceMapClick}
            onSelectValve={handleValveMapClick}
          />
          </div>
        ) : (
        <div
          className={`${MAP_VIEWPORT_CLASS} min-h-[55dvh] min-w-0 flex-1 cursor-crosshair overflow-hidden rounded-xl border border-line bg-black xl:min-h-0`}
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
          {placedLotIds.map((lotId) => {
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
          {placedPlaceNames.map((placeName) => {
            const pos = places[placeName];
            if (!pos || !isValidCoord(pos)) return null;
            const IconComponent = getPlaceIcon(pos.icon ?? "MdPlace");
            const isSelected =
              mode === "places" &&
              (selectedPlace === placeName || selectedPlaceIds.has(placeName));
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
          {placedValveIds.map((valveId) => {
            const pos = valves[valveId];
            if (!pos || !isValidCoord(pos)) return null;
            const isSelected =
              mode === "valves" &&
              (selectedValve === valveId || selectedValveIds.has(valveId));
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

        <aside className="flex w-full shrink-0 flex-col gap-2 xl:w-80 2xl:w-96">
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
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-line bg-surface p-2 xl:max-h-none">
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
              <MapEditSelectionToolbar
                itemLabel="lots"
                filter={lotListFilter}
                onFilterChange={setLotListFilter}
                placedCount={placedLotIds.length}
                unplacedCount={unplacedLotCount}
                selectedCount={selectedLotIds.size}
                onResetSelected={handleResetSelectedLots}
                onResetAllOnMap={handleResetAllPlacedLots}
                onClearSelection={() => {
                  setSelectedLotIds(new Set());
                  setSelectedLot(null);
                }}
              />
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
            {mode === "places" && (
              <MapEditSelectionToolbar
                itemLabel="places"
                filter={placeListFilter}
                onFilterChange={setPlaceListFilter}
                placedCount={placedPlaceNames.length}
                unplacedCount={placeNames.length - placedPlaceNames.length}
                selectedCount={selectedPlaceIds.size}
                onResetSelected={handleResetSelectedPlaces}
                onResetAllOnMap={handleResetAllPlacedPlaces}
                onClearSelection={() => {
                  setSelectedPlaceIds(new Set());
                  setSelectedPlace(null);
                }}
              />
            )}
            {mode === "valves" && (
              <MapEditSelectionToolbar
                itemLabel="valves"
                filter={valveListFilter}
                onFilterChange={setValveListFilter}
                placedCount={placedValveIds.length}
                unplacedCount={valveIds.length - placedValveIds.length}
                selectedCount={selectedValveIds.size}
                onResetSelected={handleResetSelectedValves}
                onResetAllOnMap={handleResetAllPlacedValves}
                onClearSelection={() => {
                  setSelectedValveIds(new Set());
                  setSelectedValve(null);
                }}
              />
            )}
            {mode === "lots" &&
              filteredLotIds.map((lotId) => {
                const pos = lots[lotId];
                const isMultiSelected = selectedLotIds.has(lotId);
                const isPlaced = isValidCoord(pos);
                const issue = getMarkerIssue("lot", lotId);
                const hasCoords = isPlaced;
                const isUserAdded = addedLotIds.includes(lotId);
                const isReadyToPlace =
                  isMultiSelected && selectedLot === lotId && !isPlaced;
                return (
                  <div
                    key={lotId}
                    className={`flex items-center gap-1 rounded-lg ${
                      isMultiSelected ? "bg-brand-600" : ""
                    } ${!isPlaced && !isMultiSelected ? "opacity-80" : ""}`}
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
                      {isReadyToPlace && (
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            isMultiSelected
                              ? "bg-white/20 text-white"
                              : "bg-brand-100 text-brand-800 dark:bg-brand-950/50 dark:text-brand-200"
                          }`}
                        >
                          Click map
                        </span>
                      )}
                      {!isPlaced && !isReadyToPlace && (
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            isMultiSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          }`}
                        >
                          Unplaced
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
                    {isPlaced ? (
                      <button
                        type="button"
                        title={
                          selectedLotIds.size > 1 && isMultiSelected
                            ? `Reset all ${selectedLotIds.size} selected lots`
                            : `Reset lot ${lotId} — pull off map to place again`
                        }
                        onClick={() => resetLotsWithSelection(lotId)}
                        className={`shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium ${
                          isMultiSelected
                            ? "text-white/90 hover:bg-white/20"
                            : "text-muted hover:bg-hover"
                        }`}
                      >
                        {selectedLotIds.size > 1 && isMultiSelected
                          ? `Reset (${selectedLotIds.size})`
                          : "Reset"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        title={`Select lot ${lotId} to place on map`}
                        onClick={() => selectMarker("lot", lotId)}
                        className={`shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium ${
                          isMultiSelected
                            ? "text-white/90 hover:bg-white/20"
                            : "text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/40"
                        }`}
                      >
                        Place
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
              filteredPlaceNames.map((placeName) => {
                const pos = places[placeName];
                const isMultiSelected = selectedPlaceIds.has(placeName);
                const isPlaced = isValidCoord(pos);
                const IconComponent = getPlaceIcon(pos?.icon ?? "MdPlace");
                const issue = getMarkerIssue("place", placeName);
                const isReadyToPlace =
                  isMultiSelected && selectedPlace === placeName && !isPlaced;
                return (
                  <div
                    key={placeName}
                    className={`flex items-center gap-1 rounded-lg ${
                      isMultiSelected ? "bg-brand-600" : ""
                    } ${!isPlaced && !isMultiSelected ? "opacity-80" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={(e) => handlePlaceSidebarClick(placeName, e)}
                      className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                        isMultiSelected
                          ? "text-white"
                          : issue?.severity === "error"
                            ? "bg-red-50 text-red-900 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-100"
                            : "text-ink hover:bg-hover"
                      }`}
                    >
                      <IconComponent size={16} className="shrink-0" />
                      <span className="truncate">{placeName}</span>
                      {isReadyToPlace && (
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            isMultiSelected
                              ? "bg-white/20 text-white"
                              : "bg-brand-100 text-brand-800 dark:bg-brand-950/50 dark:text-brand-200"
                          }`}
                        >
                          Click map
                        </span>
                      )}
                      {!isPlaced && !isReadyToPlace && (
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            isMultiSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          }`}
                        >
                          Unplaced
                        </span>
                      )}
                      {isPlaced ? (
                        <span className="ml-auto shrink-0 text-xs opacity-70">
                          {formatMapPosition(pos)}
                        </span>
                      ) : (
                        <span className="ml-auto shrink-0 text-xs font-medium opacity-80">
                          No coords
                        </span>
                      )}
                    </button>
                    {isPlaced ? (
                      <button
                        type="button"
                        title={
                          selectedPlaceIds.size > 1 && isMultiSelected
                            ? `Reset all ${selectedPlaceIds.size} selected places`
                            : `Reset ${placeName}`
                        }
                        onClick={() => resetPlacesWithSelection(placeName)}
                        className={`shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium ${
                          isMultiSelected
                            ? "text-white/90 hover:bg-white/20"
                            : "text-muted hover:bg-hover"
                        }`}
                      >
                        {selectedPlaceIds.size > 1 && isMultiSelected
                          ? `Reset (${selectedPlaceIds.size})`
                          : "Reset"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        title={`Select ${placeName} to place on map`}
                        onClick={() => selectMarker("place", placeName)}
                        className={`shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium ${
                          isMultiSelected
                            ? "text-white/90 hover:bg-white/20"
                            : "text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/40"
                        }`}
                      >
                        Place
                      </button>
                    )}
                    <button
                      type="button"
                      title={`Delete ${placeName}`}
                      onClick={() => handleRemovePlace(placeName)}
                      className={`shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium ${
                        isMultiSelected
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
              filteredValveIds.map((valveId) => {
                const pos = valves[valveId];
                const isMultiSelected = selectedValveIds.has(valveId);
                const isPlaced = isValidCoord(pos);
                const displayId = /^\d+$/.test(valveId) ? `V${valveId}` : valveId;
                const issue = getMarkerIssue("valve", valveId);
                const isReadyToPlace =
                  isMultiSelected && selectedValve === valveId && !isPlaced;
                return (
                  <div
                    key={valveId}
                    className={`flex items-center gap-1 rounded-lg ${
                      isMultiSelected ? "bg-brand-600" : ""
                    } ${!isPlaced && !isMultiSelected ? "opacity-80" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={(e) => handleValveSidebarClick(valveId, e)}
                      className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                        isMultiSelected
                          ? "text-white"
                          : issue?.severity === "warning" ||
                              issue?.severity === "error"
                            ? "bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-100"
                            : "text-ink hover:bg-hover"
                      }`}
                    >
                      <MdPlumbing size={16} className="shrink-0" />
                      <span className="font-medium">{displayId}</span>
                      {isReadyToPlace && (
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            isMultiSelected
                              ? "bg-white/20 text-white"
                              : "bg-brand-100 text-brand-800 dark:bg-brand-950/50 dark:text-brand-200"
                          }`}
                        >
                          Click map
                        </span>
                      )}
                      {!isPlaced && !isReadyToPlace && (
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            isMultiSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          }`}
                        >
                          Unplaced
                        </span>
                      )}
                      {isPlaced ? (
                        <span className="ml-auto shrink-0 text-xs opacity-70">
                          {formatMapPosition(pos)}
                        </span>
                      ) : (
                        <span className="ml-auto shrink-0 text-xs font-medium opacity-80">
                          No pin
                        </span>
                      )}
                    </button>
                    {isPlaced ? (
                      <button
                        type="button"
                        title={
                          selectedValveIds.size > 1 && isMultiSelected
                            ? `Reset all ${selectedValveIds.size} selected valves`
                            : `Reset valve ${displayId}`
                        }
                        onClick={() => resetValvesWithSelection(valveId)}
                        className={`shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium ${
                          isMultiSelected
                            ? "text-white/90 hover:bg-white/20"
                            : "text-muted hover:bg-hover"
                        }`}
                      >
                        {selectedValveIds.size > 1 && isMultiSelected
                          ? `Reset (${selectedValveIds.size})`
                          : "Reset"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        title={`Select valve ${displayId} to place on map`}
                        onClick={() => selectMarker("valve", valveId)}
                        className={`shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium ${
                          isMultiSelected
                            ? "text-white/90 hover:bg-white/20"
                            : "text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/40"
                        }`}
                      >
                        Place
                      </button>
                    )}
                  </div>
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
              Selected: <strong>{selected}</strong>
              {mode === "lots" &&
              selectedLot &&
              !isValidCoord(lots[selectedLot])
                ? " — pan to the correct area and click the map to place."
                : mode === "places" &&
                    selectedPlace &&
                    !isValidCoord(places[selectedPlace])
                  ? " — pan to the correct area and click the map to place."
                  : mode === "valves" &&
                      selectedValve &&
                      !isValidCoord(valves[selectedValve])
                    ? " — pan to the correct area and click the map to place."
                    : " — click the map or drag its marker."}
            </p>
          )}
          {message && (
            <p
              className={`text-sm ${message.includes("Failed") || message.includes("failed") ? "text-red-600" : "text-muted"}`}
            >
              {message}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
