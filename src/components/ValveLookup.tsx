"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ValveRecord } from "@/lib/google-valves";
import { lotHref } from "@/lib/lot-slug";
import { ParkMap } from "@/components/ParkMap";
import { buildZoneColorMap } from "@/lib/zone-colors";

type ValvesResponse = {
  updatedAt: number;
  stale: boolean;
  count: number;
  valves: ValveRecord[];
};

export default function ValveLookup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ValvesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const q = searchParams.get("lot") || searchParams.get("search");
    if (q) setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/valves")
      .then(async (res) => {
        const json = (await res.json()) as ValvesResponse & { error?: string };
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        setData(json);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchedValves = useMemo(() => {
    if (!data?.valves || !normalizedQuery) return [];
    return data.valves.filter((v) => {
      const q = normalizedQuery;
      if (v.valveId.toLowerCase().includes(q)) return true;
      if (v.location.toLowerCase().includes(q)) return true;
      if (v.zones.some((z) => z.toLowerCase().includes(q))) return true;
      if (v.lots.some((l) => l.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [data, normalizedQuery]);

  const primaryValve = matchedValves[0] ?? null;
  const highlightLots = primaryValve?.lots ?? [];
  const contextZones = primaryValve?.zones ?? [];
  const zoneColors = buildZoneColorMap(
    data?.valves.flatMap((v) => v.zones) ?? [],
  );
  const lotZones = useMemo(() => {
    const map: Record<string, string[]> = {};
    if (!primaryValve) return map;
    for (const lot of primaryValve.lots) {
      map[lot] = primaryValve.zones;
    }
    return map;
  }, [primaryValve]);

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

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="valve-search" className="text-sm font-medium text-ink">
          Search valve, zone, or lot
        </label>
        <input
          id="valve-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="e.g. 207, Z3, V12"
          className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink"
        />
      </div>

      {normalizedQuery && matchedValves.length === 0 && (
        <p className="text-sm text-muted">No matches for that search.</p>
      )}

      {primaryValve && (
        <section className="space-y-4 rounded-2xl border border-line bg-surface p-4">
          <div>
            <h2 className="text-lg font-bold text-ink">
              Valve {primaryValve.valveId}
            </h2>
            <p className="mt-1 text-sm text-muted">{primaryValve.location}</p>
            {primaryValve.function && (
              <p className="mt-2 text-sm text-ink">{primaryValve.function}</p>
            )}
            {primaryValve.locationNotes && (
              <p className="mt-2 text-sm text-muted">
                {primaryValve.locationNotes}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {primaryValve.zones.map((zone) => (
              <span
                key={zone}
                className="rounded-full bg-brand-50 px-2.5 py-0.5 font-medium text-brand-700 dark:bg-brand-900/40"
              >
                {zone}
              </span>
            ))}
          </div>
          {primaryValve.lots.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Lots on this valve
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {primaryValve.lots.map((lot) => (
                  <Link
                    key={lot}
                    href={lotHref(lot)}
                    className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-hover"
                  >
                    Lot {lot}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <ParkMap
        lotsToShow={highlightLots}
        highlightLot={highlightLots[0] ?? null}
        contextZones={contextZones}
        lotZones={lotZones}
        zoneColors={zoneColors}
        highlightValve={primaryValve?.valveId ?? null}
        contextZone={contextZones[0] ?? null}
        contextLot={highlightLots[0] ?? null}
        contextValve={primaryValve?.valveId ?? null}
        contextValves={primaryValve ? [primaryValve.valveId] : []}
        onLotClick={(lotId) => router.push(lotHref(lotId))}
      />

      {matchedValves.length > 1 && (
        <div className="text-sm text-muted">
          {matchedValves.length - 1} more valve match(es). Refine your search.
        </div>
      )}
    </div>
  );
}
