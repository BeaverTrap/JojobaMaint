"use client";

import { useEffect, useMemo, useState } from "react";
import type { ValveRecord } from "@/lib/google-valves";
import {
  analyzeShutoff,
  computeValveSearchResults,
  naturalSort,
} from "@/lib/valve-lookup";
import ShutoffProfileContent from "@/components/ShutoffProfileContent";

type ValvesResponse = {
  updatedAt: number;
  stale: boolean;
  count: number;
  valves: ValveRecord[];
};

export default function SiteShutoffPanel({ lotName }: { lotName: string }) {
  const [data, setData] = useState<ValvesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zonesForSearchedLot, setZonesForSearchedLot] = useState<string[]>([]);
  const [lotsForSearchedZone, setLotsForSearchedZone] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/valves")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ValvesResponse>;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load valve data",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lotName]);

  const searchResults = useMemo(
    () => computeValveSearchResults(data?.valves ?? [], lotName),
    [data?.valves, lotName],
  );

  useEffect(() => {
    if (!lotName.trim() || !data?.valves) {
      setZonesForSearchedLot([]);
      return;
    }
    const isLotSearch = data.valves.some((valve) =>
      valve.lots.some((lot) => lot.toLowerCase() === lotName.toLowerCase()),
    );
    if (!isLotSearch) {
      setZonesForSearchedLot([]);
      return;
    }
    fetch(`/api/valves?lot=${encodeURIComponent(lotName)}`)
      .then((res) => res.json())
      .then((result: { zones?: string[] }) => {
        setZonesForSearchedLot(result.zones ?? []);
      })
      .catch(() => setZonesForSearchedLot([]));
  }, [lotName, data]);

  useEffect(() => {
    if (!zonesForSearchedLot.length) {
      setLotsForSearchedZone([]);
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
        setLotsForSearchedZone(Array.from(all).sort(naturalSort));
      })
      .catch(() => setLotsForSearchedZone([]));
  }, [zonesForSearchedLot.join(",")]);

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

  if (loading) {
    return <p className="text-sm text-muted">Loading shutoff details…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
        {error}
      </div>
    );
  }

  if (searchResults.valves.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-surface px-4 py-6 text-sm text-muted">
        No valve shutoff data found for this site.
      </p>
    );
  }

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-ink">Shutoff &amp; valves</h2>
      {data?.updatedAt && (
        <p className="text-xs text-muted">
          Sheet data as of {new Date(data.updatedAt).toLocaleString()}
          {data.stale ? " (cached)" : ""}
        </p>
      )}
      <ShutoffProfileContent
        searchQuery={lotName}
        searchResults={searchResults}
        zonesForSearchedLot={zonesForSearchedLot}
        lotsForSearchedZone={lotsForSearchedZone}
        shutoff={shutoff}
        linkLotsToSite
        showSiteSummary={false}
      />
    </section>
  );
}
