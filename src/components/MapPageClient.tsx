"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import MapPageMobile from "@/components/MapPageMobile";
import MapSyncButton from "@/components/MapSyncButton";
import PageMascotHeading from "@/components/PageMascotHeading";
import { ParkMapView } from "@/components/ParkMapView";
import ValveLookupPanel, {
  type ValveLookupMapState,
} from "@/components/ValveLookupPanel";
import { siteHref } from "@/lib/site-slug";
import type { MapPositions } from "@/lib/map-positions";

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

function initialLookupQuery(searchParams: URLSearchParams): string {
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
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

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
    },
    [syncUrl],
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

  const highlightLot = mapState.highlightLot ?? searchParams.get("lot");
  const highlightValve = mapState.highlightValve ?? searchParams.get("valve");
  const autoFocus =
    mapState.autoFocusHighlight || !!(highlightLot || highlightValve);

  function handleLotClick(lotId: string) {
    router.push(siteHref(lotId));
  }

  function handlePlaceClick(placeName: string) {
    router.push(siteHref(placeName));
  }

  function handleValveClick(valveId: string) {
    handleQueryChange(valveId);
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

  const mapElement = (
    <ParkMapView
      fillHeight
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

  return (
    <>
      {isMobile === null ? (
        <p className="text-sm text-muted">Loading map…</p>
      ) : isMobile ? (
        <MapPageMobile
          isAuthorized={isAuthorized}
          lookupQuery={lookupQuery}
          onQueryChange={handleQueryChange}
          onMapStateChange={handleMapStateChange}
          mapSlot={mapElement}
          showLots={showLots}
          showPlaces={showPlaces}
          showValves={showValves}
          onShowLots={setShowLots}
          onShowPlaces={setShowPlaces}
          onShowValves={setShowValves}
        />
      ) : (
      <div className="flex min-h-[70dvh] flex-col gap-4">
        <PageMascotHeading
          scene="map"
          title="Park map & lookup"
          description="Find valves, zones, and lots — then see them on the map. Click places for site profiles, or use lookup for valve shutoff details. Live weather is in the bar below the navigation menu."
        >
          {isAuthorized ? (
            <>
              <Link
                href="/map/edit"
                className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-hover"
              >
                Edit positions
              </Link>
              <MapSyncButton />
            </>
          ) : null}
          <Link
            href="/sites"
            className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-hover"
          >
            Browse all sites
          </Link>
        </PageMascotHeading>

        <ValveLookupPanel
          initialQuery={lookupQuery}
          onQueryChange={handleQueryChange}
          onMapStateChange={handleMapStateChange}
          compact
          canRefreshFromSheet={isAuthorized}
        />

        <div className="flex flex-wrap items-center gap-4">{layerControls}</div>

        <div className="min-h-[55dvh] flex-1">{mapElement}</div>
      </div>
      )}
    </>
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
