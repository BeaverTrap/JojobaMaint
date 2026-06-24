"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import MapSyncButton from "@/components/MapSyncButton";
import PageMascotHeading from "@/components/PageMascotHeading";
import ValveLookupPanel, {
  type ValveLookupMapState,
} from "@/components/ValveLookupPanel";

type MapPageMobileProps = {
  isAuthorized: boolean;
  lookupQuery: string;
  onQueryChange: (query: string) => void;
  onMapStateChange: (state: ValveLookupMapState) => void;
  mapSlot: ReactNode;
  showLots: boolean;
  showPlaces: boolean;
  showValves: boolean;
  onShowLots: (value: boolean) => void;
  onShowPlaces: (value: boolean) => void;
  onShowValves: (value: boolean) => void;
};

function LayerChip({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
        active
          ? "bg-brand-600 text-white shadow-sm"
          : "border border-line bg-surface text-muted"
      }`}
    >
      {label}
    </button>
  );
}

export default function MapPageMobile({
  isAuthorized,
  lookupQuery,
  onQueryChange,
  onMapStateChange,
  mapSlot,
  showLots,
  showPlaces,
  showValves,
  onShowLots,
  onShowPlaces,
  onShowValves,
}: MapPageMobileProps) {
  const mapSectionRef = useRef<HTMLElement>(null);
  const lookupSectionRef = useRef<HTMLElement>(null);
  const prevQueryRef = useRef(lookupQuery);

  useEffect(() => {
    const trimmed = lookupQuery.trim();
    const prev = prevQueryRef.current.trim();
    prevQueryRef.current = lookupQuery;
    if (!trimmed || trimmed === prev) return;
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [lookupQuery]);

  function scrollToLookup() {
    lookupSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const activeQuery = lookupQuery.trim();

  return (
    <div className="space-y-4 pb-2">
      <PageMascotHeading
        scene="map"
        title="Park map"
        description="Search below, then see highlights on the map. Tap lots, places, or valves for site details."
      />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/sites"
          className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-hover"
        >
          All sites
        </Link>
        {isAuthorized ? (
          <>
            <Link
              href="/map/edit"
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-hover"
            >
              Edit map
            </Link>
            <MapSyncButton compact />
          </>
        ) : null}
      </div>

      <section
        ref={mapSectionRef}
        className="scroll-mt-24 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2.5">
          <p className="text-sm font-semibold text-ink">Map</p>
          <div className="flex flex-wrap gap-1.5">
            <LayerChip
              label="Lots"
              active={showLots}
              onToggle={() => onShowLots(!showLots)}
            />
            <LayerChip
              label="Places"
              active={showPlaces}
              onToggle={() => onShowPlaces(!showPlaces)}
            />
            <LayerChip
              label="Valves"
              active={showValves}
              onToggle={() => onShowValves(!showValves)}
            />
          </div>
        </div>

        <div className="relative flex h-[min(50dvh,26rem)] min-h-[220px] w-full flex-col">
          {mapSlot}
        </div>

        {activeQuery ? (
          <div className="flex items-center gap-2 border-t border-line bg-brand-50/60 px-3 py-2 dark:bg-brand-950/25">
            <p className="min-w-0 flex-1 truncate text-xs text-ink">
              Highlighting{" "}
              <span className="font-semibold">{activeQuery}</span>
            </p>
            <button
              type="button"
              onClick={scrollToLookup}
              className="shrink-0 text-xs font-semibold text-brand-700 dark:text-brand-300"
            >
              Shutoff details
            </button>
          </div>
        ) : (
          <p className="border-t border-line px-3 py-2 text-xs text-muted">
            Pinch to zoom · tap markers for site profiles
          </p>
        )}
      </section>

      <section ref={lookupSectionRef} className="scroll-mt-24 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-ink">
            Valve &amp; shutoff lookup
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Search by lot, zone, or valve — results update the map above.
          </p>
        </div>
        <ValveLookupPanel
          initialQuery={lookupQuery}
          onQueryChange={onQueryChange}
          onMapStateChange={onMapStateChange}
          compact
          canRefreshFromSheet={isAuthorized}
        />
      </section>
    </div>
  );
}
