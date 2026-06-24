"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import ShutoffProfileContent from "@/components/ShutoffProfileContent";
import type { ValveRecord } from "@/lib/google-valves";
import { siteHref, siteToSlug } from "@/lib/site-slug";
import {
  analyzeShutoff,
  buildLotZoneMap,
  computeValveSearchResults,
  naturalSort,
  uniqueSortedValveIds,
  uniqueSortedZones,
} from "@/lib/valve-lookup";
import { buildZoneColorMap } from "@/lib/zone-colors";

type ValvesResponse = {
  updatedAt: number;
  stale: boolean;
  count: number;
  valves: ValveRecord[];
};

export type SiteSummary = {
  name: string;
  slug: string;
  zones: string[];
  valves: string[];
  unit_id: string | null;
  has_cross_connection: boolean | null;
};

export type ValveLookupMapState = {
  lotsToShow: string[];
  highlightLot: string | null;
  highlightValve: string | null;
  contextZones: string[];
  lotZones: Record<string, string[]>;
  zoneColors: ReturnType<typeof buildZoneColorMap>;
  contextZone: string | null;
  contextLot: string | null;
  contextValve: string | null;
  contextValves: string[];
  autoFocusHighlight: boolean;
};

type ValveLookupPanelProps = {
  initialQuery?: string;
  onQueryChange?: (query: string) => void;
  onMapStateChange?: (state: ValveLookupMapState) => void;
  compact?: boolean;
  /** Authorized maintenance staff can pull fresh valve data from the sheet. */
  canRefreshFromSheet?: boolean;
};

export default function ValveLookupPanel({
  initialQuery = "",
  onQueryChange,
  onMapStateChange,
  compact = false,
  canRefreshFromSheet = false,
}: ValveLookupPanelProps) {
  const router = useRouter();
  const [data, setData] = useState<ValvesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [zonesForSearchedLot, setZonesForSearchedLot] = useState<string[]>([]);
  const [lotsForSearchedZone, setLotsForSearchedZone] = useState<string[]>([]);
  const [lotsInZonesOfSearchedLot, setLotsInZonesOfSearchedLot] = useState<
    string[]
  >([]);
  const [lotsForPrimaryZones, setLotsForPrimaryZones] = useState<string[]>([]);
  const [siteSummary, setSiteSummary] = useState<SiteSummary | null>(null);

  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  const updateQuery = useCallback(
    (query: string) => {
      setSearchQuery(query);
      onQueryChange?.(query);
    },
    [onQueryChange],
  );

  async function loadValves(refresh = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const url = refresh ? "/api/valves?refresh=1" : "/api/valves";
      const res = await fetch(url);
      const json = (await res.json()) as ValvesResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load valves");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadValves();
  }, []);

  const searchResults = useMemo(
    () => computeValveSearchResults(data?.valves ?? [], searchQuery),
    [data?.valves, searchQuery],
  );

  const hasSearchResults = searchQuery.trim().length > 0;

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || !data?.valves) {
      setZonesForSearchedLot([]);
      return;
    }
    const isLotSearch = data.valves.some((valve) =>
      valve.lots.some((lot) => lot.toLowerCase() === trimmed.toLowerCase()),
    );
    if (!isLotSearch) {
      setZonesForSearchedLot([]);
      return;
    }
    fetch(`/api/valves?lot=${encodeURIComponent(trimmed)}`)
      .then((res) => res.json())
      .then((result: { zones?: string[] }) => {
        setZonesForSearchedLot(result.zones ?? []);
      })
      .catch(() => setZonesForSearchedLot([]));
  }, [searchQuery, data]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || !data?.valves) {
      setLotsForSearchedZone([]);
      return;
    }
    const isZoneSearch = data.valves.some((valve) =>
      valve.zones.some((zone) => zone.toLowerCase() === trimmed.toLowerCase()),
    );
    if (!isZoneSearch) {
      setLotsForSearchedZone([]);
      return;
    }
    fetch(`/api/valves?zone=${encodeURIComponent(trimmed)}`)
      .then((res) => res.json())
      .then((result: { lots?: string[] }) => {
        setLotsForSearchedZone(result.lots ?? []);
      })
      .catch(() => setLotsForSearchedZone([]));
  }, [searchQuery, data]);

  useEffect(() => {
    if (!zonesForSearchedLot.length || !searchQuery.trim()) {
      setLotsInZonesOfSearchedLot([]);
      return;
    }
    Promise.all(
      zonesForSearchedLot.map((zone) =>
        fetch(`/api/valves?zone=${encodeURIComponent(zone)}`).then((r) =>
          r.json(),
        ),
      ),
    )
      .then((results) => {
        const all = new Set<string>();
        for (const r of results) {
          for (const lot of r.lots ?? []) all.add(lot);
        }
        setLotsInZonesOfSearchedLot(Array.from(all).sort(naturalSort));
      })
      .catch(() => setLotsInZonesOfSearchedLot([]));
  }, [zonesForSearchedLot.join(","), searchQuery]);

  const searchResultsForEffect = useMemo(() => {
    if (!data?.valves || !searchQuery.trim()) return null;
    const query = searchQuery.trim().toLowerCase();
    const primaryZones = new Set<string>();
    let isValveMatch = false;
    for (const valve of data.valves) {
      if (valve.valveId.toLowerCase() === query) {
        isValveMatch = true;
        for (const z of valve.zones) primaryZones.add(z);
      }
    }
    if (!isValveMatch || primaryZones.size === 0) return null;
    return { primaryZones: Array.from(primaryZones) };
  }, [data?.valves, searchQuery]);

  useEffect(() => {
    if (!searchResultsForEffect?.primaryZones?.length) {
      setLotsForPrimaryZones([]);
      return;
    }
    Promise.all(
      searchResultsForEffect.primaryZones.map((zone) =>
        fetch(`/api/valves?zone=${encodeURIComponent(zone)}`).then((r) =>
          r.json(),
        ),
      ),
    )
      .then((results) => {
        const all = new Set<string>();
        for (const r of results) {
          for (const lot of r.lots ?? []) all.add(lot);
        }
        setLotsForPrimaryZones(Array.from(all).sort(naturalSort));
      })
      .catch(() => setLotsForPrimaryZones([]));
  }, [
    searchResultsForEffect?.primaryZones?.join(","),
    searchResultsForEffect?.primaryZones?.length,
  ]);

  useEffect(() => {
    const lot = searchResults.lots[0];
    if (!lot) {
      setSiteSummary(null);
      return;
    }
    fetch(`/api/sites/${encodeURIComponent(siteToSlug(lot))}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: SiteSummary | null) => setSiteSummary(json))
      .catch(() => setSiteSummary(null));
  }, [searchResults.lots.join(",")]);

  const shutoff = useMemo(
    () =>
      analyzeShutoff({
        allValves: data?.valves ?? [],
        searchResults,
        zonesForSearchedLot,
        lotsForSearchedZone,
      }),
    [data?.valves, searchResults, zonesForSearchedLot, lotsForSearchedZone],
  );

  const mapLotsToShow = useMemo(() => {
    if (!hasSearchResults) return [];
    if (lotsForSearchedZone.length > 0) return lotsForSearchedZone;
    if (lotsInZonesOfSearchedLot.length > 0) return lotsInZonesOfSearchedLot;
    if (searchResults.lots.length > 0) return [searchResults.lots[0]];
    if (lotsForPrimaryZones.length > 0) return lotsForPrimaryZones;
    return [];
  }, [
    hasSearchResults,
    lotsForSearchedZone,
    lotsInZonesOfSearchedLot,
    searchResults.lots,
    lotsForPrimaryZones,
  ]);

  const mapHighlightLot =
    searchResults.lots.length === 1 ? searchResults.lots[0] : null;
  const mapHighlightValve =
    searchResults.valves.length === 1 ? searchResults.valves[0].valveId : null;

  const mapContextZones = useMemo(() => {
    if (!hasSearchResults) return [];
    if (lotsForSearchedZone.length > 0 && searchQuery.trim()) {
      return [searchQuery.trim()];
    }
    if (lotsInZonesOfSearchedLot.length > 0 && zonesForSearchedLot.length > 0) {
      return zonesForSearchedLot;
    }
    if (lotsForPrimaryZones.length > 0 && searchResults.primaryZones?.length) {
      return searchResults.primaryZones;
    }
    return [];
  }, [
    hasSearchResults,
    lotsForSearchedZone,
    lotsInZonesOfSearchedLot,
    lotsForPrimaryZones,
    searchQuery,
    zonesForSearchedLot,
    searchResults.primaryZones,
  ]);

  const { lotZones, zoneColors } = useMemo(() => {
    if (!data?.valves?.length) {
      return {
        lotZones: {} as Record<string, string[]>,
        zoneColors: {} as ReturnType<typeof buildZoneColorMap>,
      };
    }
    const zoneSet = new Set(data.valves.flatMap((v) => v.zones));
    return {
      lotZones: buildLotZoneMap(data.valves),
      zoneColors: buildZoneColorMap(Array.from(zoneSet)),
    };
  }, [data?.valves]);

  useEffect(() => {
    onMapStateChange?.({
      lotsToShow: mapLotsToShow,
      highlightLot: mapHighlightLot,
      highlightValve: mapHighlightValve,
      contextZones: mapContextZones,
      lotZones,
      zoneColors,
      contextZone: mapContextZones[0] ?? null,
      contextLot: mapHighlightLot,
      contextValve: mapHighlightValve,
      contextValves: searchResults.valves.map((v) => v.valveId),
      autoFocusHighlight: !!(mapHighlightLot || mapHighlightValve),
    });
  }, [
    mapLotsToShow,
    mapHighlightLot,
    mapHighlightValve,
    mapContextZones,
    lotZones,
    zoneColors,
    searchResults.valves,
    onMapStateChange,
  ]);

  if (loading) {
    return <p className="text-sm text-muted">Loading valve data…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
        {error}
      </div>
    );
  }

  const valveOptions = uniqueSortedValveIds(data?.valves ?? []);
  const zoneOptions = uniqueSortedZones(data?.valves ?? []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {data?.updatedAt && (
          <p className="text-xs text-muted">
            Sheet data as of {new Date(data.updatedAt).toLocaleString()}
            {data.stale ? " (cached)" : ""}
          </p>
        )}
        {canRefreshFromSheet && (
          <button
            type="button"
            onClick={() => void loadValves(true)}
            disabled={refreshing}
            className="text-sm font-medium text-brand-700 hover:underline disabled:opacity-60"
          >
            {refreshing ? "Refreshing…" : "Refresh from sheet"}
          </button>
        )}
      </div>

      {data?.valves && data.valves.length > 0 && (
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 md:max-w-[12rem]">
            <label
              htmlFor="valve-select"
              className="text-sm font-medium text-ink"
            >
              Valve
            </label>
            <select
              id="valve-select"
              value={searchQuery}
              onChange={(e) => updateQuery(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">— Select valve —</option>
              {valveOptions.map((valveId) => (
                <option key={valveId} value={valveId}>
                  {valveId}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 md:max-w-[12rem]">
            <label htmlFor="zone-select" className="text-sm font-medium text-ink">
              Zone
            </label>
            <select
              id="zone-select"
              value={searchQuery}
              onChange={(e) => updateQuery(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">— Select zone —</option>
              {zoneOptions.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 md:max-w-xs">
            <label htmlFor="valve-search" className="text-sm font-medium text-ink">
              Search
            </label>
            <input
              id="valve-search"
              type="search"
              value={searchQuery}
              onChange={(e) => updateQuery(e.target.value)}
              placeholder="Zone, lot, or location…"
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
          </div>
        </div>
      )}

      {!hasSearchResults && (
        <p className="rounded-xl border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
          Select a valve or zone, or search by lot number or location.
        </p>
      )}

      {hasSearchResults && searchResults.valves.length === 0 && (
        <p className="text-sm text-muted">
          No valves found matching &ldquo;{searchQuery}&rdquo;.
        </p>
      )}

      {hasSearchResults && searchResults.valves.length > 0 && (
        <ShutoffProfileContent
          searchQuery={searchQuery}
          searchResults={searchResults}
          zonesForSearchedLot={zonesForSearchedLot}
          lotsForSearchedZone={lotsForSearchedZone}
          shutoff={shutoff}
          siteSummary={siteSummary}
          onSelect={(id) => {
            if (/^\d+$/.test(id.trim())) {
              router.push(siteHref(id));
              return;
            }
            updateQuery(id);
          }}
          linkLotsToSite
          showRelatedValves={!compact}
        />
      )}
    </div>
  );
}
