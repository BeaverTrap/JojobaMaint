"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import MapSyncButton from "@/components/MapSyncButton";
import { ParkMap } from "@/components/ParkMap";
import ValveLookupPanel, {
  type ValveLookupMapState,
} from "@/components/ValveLookupPanel";
import { siteHref } from "@/lib/site-slug";
import type { MapPositions } from "@/lib/map-positions";

type SelectedMarker = { type: "valve"; id: string };

const EMPTY_MAP_STATE: ValveLookupMapState = {
  lotsToShow: [],
  highlightLot: null,
  highlightValve: null,
  contextZones: [],
  lotZones: {},
  zoneColors: {},
  contextZone: null,
  contextLot: null,
  contextValve: null,
  contextValves: [],
  autoFocusHighlight: false,
};

function initialLookupQuery(
  searchParams: URLSearchParams,
): string {
  return (
    searchParams.get("search") ||
    searchParams.get("lot") ||
    searchParams.get("zone") ||
    searchParams.get("valve") ||
    ""
  );
}

function MapPageContent({
  isAuthorized,
  mapData,
}: {
  isAuthorized: boolean;
  mapData: MapPositions;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lookupQuery, setLookupQuery] = useState(() =>
    initialLookupQuery(searchParams),
  );
  const [mapState, setMapState] = useState<ValveLookupMapState>(EMPTY_MAP_STATE);
  const [showLots, setShowLots] = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);
  const [showValves, setShowValves] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<"map" | "lookup">("map");
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker | null>(
    null,
  );
  const [layersOpen, setLayersOpen] = useState(false);

  useEffect(() => {
    setLookupQuery(initialLookupQuery(searchParams));
  }, [searchParams]);

  useEffect(() => {
    const m = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);

  const syncUrl = useCallback(
    (query: string) => {
      const params = new URLSearchParams();
      const trimmed = query.trim();
      if (trimmed) {
        if (/^\d+$/.test(trimmed)) {
          params.set("lot", trimmed);
        } else if (
          /^z\d+$/i.test(trimmed) ||
          /^zone\s*\d+$/i.test(trimmed)
        ) {
          params.set("zone", trimmed);
        } else {
          params.set("search", trimmed);
        }
      }
      const qs = params.toString();
      router.replace(qs ? `/map?${qs}` : "/map", { scroll: false });
    },
    [router],
  );

  const handleQueryChange = useCallback(
    (query: string) => {
      setLookupQuery(query);
      syncUrl(query);
      if (isMobile && query.trim()) setMobileView("map");
    },
    [syncUrl, isMobile],
  );

  const handleMapStateChange = useCallback((state: ValveLookupMapState) => {
    setMapState(state);
  }, []);

  const lotsToShow = useMemo(() => {
    if (mapState.lotsToShow.length > 0) return mapState.lotsToShow;
    const lotParam = searchParams.get("lot");
    if (lotParam) return [lotParam];
    return [];
  }, [mapState.lotsToShow, searchParams]);

  const highlightLot =
    mapState.highlightLot ?? searchParams.get("lot");
  const highlightValve =
    mapState.highlightValve ?? searchParams.get("valve");
  const autoFocus = mapState.autoFocusHighlight || !!(highlightLot || highlightValve);

  function handleLotClick(lotId: string) {
    router.push(siteHref(lotId));
  }

  function handlePlaceClick(placeName: string) {
    router.push(siteHref(placeName));
  }

  function handleValveClick(valveId: string) {
    if (isMobile && mobileView === "map") {
      setSelectedMarker({ type: "valve", id: valveId });
      return;
    }
    handleQueryChange(valveId);
  }

  function handleSearchThis() {
    if (!selectedMarker) return;
    handleQueryChange(selectedMarker.id);
    setSelectedMarker(null);
  }

  const layerControls = (
    <>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted hover:text-ink">
        <input
          type="checkbox"
          checked={showLots}
          onChange={(e) => setShowLots(e.target.checked)}
          className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
        />
        Lots
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted hover:text-ink">
        <input
          type="checkbox"
          checked={showPlaces}
          onChange={(e) => setShowPlaces(e.target.checked)}
          className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
        />
        Places
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted hover:text-ink">
        <input
          type="checkbox"
          checked={showValves}
          onChange={(e) => setShowValves(e.target.checked)}
          className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
        />
        Valves
      </label>
    </>
  );

  const wipBanner = (
    <div
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <span className="font-semibold">Work in progress</span>
      {" — "}
      Park map and lookup are still being built out. Features and layout may
      change.
    </div>
  );

  const mapElement = (
    <ParkMap
      fillHeight={isMobile && mobileView === "map"}
      zoomable
      initialMapData={mapData}
      lotsToShow={lotsToShow}
      highlightLot={highlightLot}
      highlightValve={highlightValve}
      contextZones={mapState.contextZones}
      lotZones={mapState.lotZones}
      zoneColors={mapState.zoneColors}
      onLotClick={handleLotClick}
      onPlaceClick={handlePlaceClick}
      onValveClick={handleValveClick}
      showLots={showLots}
      showPlaces={showPlaces}
      showValves={showValves}
      autoFocusHighlight={autoFocus}
      resetWhenHighlightClears={false}
      contextZone={mapState.contextZone}
      contextLot={mapState.contextLot}
      contextValve={mapState.contextValve}
      contextValves={mapState.contextValves}
    />
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-canvas md:relative md:z-auto">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-surface/95 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setMobileView("lookup")}
              className={`inline-flex min-h-[44px] items-center rounded-xl px-3 py-2 text-sm font-medium ${
                mobileView === "lookup"
                  ? "bg-brand-600 text-white"
                  : "border border-line text-ink hover:bg-hover"
              }`}
            >
              Lookup
            </button>
            <button
              type="button"
              onClick={() => setMobileView("map")}
              className={`inline-flex min-h-[44px] items-center rounded-xl px-3 py-2 text-sm font-medium ${
                mobileView === "map"
                  ? "bg-brand-600 text-white"
                  : "border border-line text-ink hover:bg-hover"
              }`}
            >
              Map
            </button>
          </div>
          {mobileView === "map" && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setLayersOpen((open) => !open)}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-hover"
              >
                Layers
              </button>
              {layersOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40"
                    aria-label="Close layers menu"
                    onClick={() => setLayersOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] rounded-xl border border-line bg-surface py-2 shadow-lg">
                    <div className="flex flex-col gap-2 px-3">{layerControls}</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {mobileView === "lookup" && (
          <div className="shrink-0 px-3 py-2">{wipBanner}</div>
        )}

        {mobileView === "lookup" ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 pb-[env(safe-area-inset-bottom)]">
            <ValveLookupPanel
              initialQuery={lookupQuery}
              onQueryChange={handleQueryChange}
              onMapStateChange={handleMapStateChange}
              compact
            />
          </div>
        ) : (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {mapElement}
          </div>
        )}

        {mobileView === "map" &&
          selectedMarker?.type === "valve" &&
          selectedMarker && (
          <div className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-line bg-surface/95 px-3 py-2 pb-[env(safe-area-inset-bottom)]">
            <button
              type="button"
              onClick={() => setSelectedMarker(null)}
              className="p-1 text-xl leading-none text-muted hover:text-ink"
              aria-label="Close"
            >
              ×
            </button>
            <span className="min-w-0 flex-1 truncate text-xs uppercase text-muted">
              Valve {selectedMarker.id}
            </span>
            <button
              type="button"
              onClick={handleSearchThis}
              className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Look up
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-[70dvh] flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Park map &amp; lookup
          </h1>
          <p className="text-sm text-muted">
            Find valves, zones, and lots — then see them on the map. Click a
            lot or place to open its site profile, or use lookup for valve
            shutoff details.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-start gap-2">
          {isAuthorized && (
            <>
              <Link
                href="/map/edit"
                className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-hover"
              >
                Edit positions
              </Link>
              <MapSyncButton />
            </>
          )}
          <Link
            href="/sites"
            className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-hover"
          >
            Browse all sites
          </Link>
        </div>
      </div>

      {wipBanner}

      <ValveLookupPanel
        initialQuery={lookupQuery}
        onQueryChange={handleQueryChange}
        onMapStateChange={handleMapStateChange}
        compact
      />

      <div className="flex flex-wrap items-center gap-4">{layerControls}</div>

      <div className="min-h-[55dvh] flex-1">{mapElement}</div>
    </div>
  );
}

export default function MapPageClient({
  isAuthorized,
  mapData,
}: {
  isAuthorized: boolean;
  mapData: MapPositions;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading map…</p>}>
      <MapPageContent isAuthorized={isAuthorized} mapData={mapData} />
    </Suspense>
  );
}
