"use client";

import Link from "next/link";
import type { ValveRecord } from "@/lib/google-valves";
import { formatCrossConnection } from "@/lib/lots";
import { siteHref } from "@/lib/site-slug";
import type { ShutoffAnalysis, ValveSearchResults } from "@/lib/valve-lookup";
import type { SiteSummary } from "@/components/ValveLookupPanel";

type ShutoffProfileContentProps = {
  searchQuery: string;
  searchResults: ValveSearchResults;
  zonesForSearchedLot: string[];
  lotsForSearchedZone: string[];
  shutoff: ShutoffAnalysis;
  siteSummary?: SiteSummary | null;
  onSelect?: (id: string) => void;
  linkLotsToSite?: boolean;
  showSiteSummary?: boolean;
  showRelatedValves?: boolean;
};

export default function ShutoffProfileContent({
  searchQuery,
  searchResults,
  zonesForSearchedLot,
  lotsForSearchedZone,
  shutoff,
  siteSummary,
  onSelect,
  linkLotsToSite = false,
  showSiteSummary = true,
  showRelatedValves = true,
}: ShutoffProfileContentProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-sm font-semibold text-ink">
          Found {searchResults.valves.length} valve
          {searchResults.valves.length !== 1 ? "s" : ""}
          {searchResults.zones.length > 0 && (
            <>
              {" "}
              in {searchResults.zones.length} zone
              {searchResults.zones.length !== 1 ? "s" : ""}
            </>
          )}
          {searchResults.lots.length > 0 && (
            <>
              {" "}
              across {searchResults.lots.length} lot
              {searchResults.lots.length !== 1 ? "s" : ""}
            </>
          )}
        </p>

        {showSiteSummary && siteSummary && (
          <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-900/40 dark:bg-brand-950/30">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Lot profile
                </p>
                <p className="mt-1 text-lg font-bold text-ink">
                  Lot {siteSummary.name}
                </p>
              </div>
              <Link
                href={siteHref(siteSummary.name)}
                className="rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
              >
                Full profile →
              </Link>
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted">Zone</dt>
                <dd className="font-medium text-ink">
                  {siteSummary.zones.length > 0
                    ? siteSummary.zones.join(", ")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Valves</dt>
                <dd className="font-medium text-ink">
                  {siteSummary.valves.length > 0
                    ? siteSummary.valves.join(", ")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">CCCP</dt>
                <dd className="font-medium text-ink">
                  {formatCrossConnection(siteSummary.has_cross_connection)}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <div className="mt-4 rounded-xl border-2 border-red-300 bg-red-50/50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
          <p className="text-sm font-bold text-ink">Shutoff instructions</p>
          <p className="mt-2 text-sm text-muted">
            These valves share zones or lots on the same water circuit. Closing
            one may affect pressure in those areas; to fully shut off a zone,
            close every valve that feeds that zone.
          </p>

          {searchResults.lots.length > 0 && zonesForSearchedLot.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-ink">
                Lot {searchResults.lots[0]} is in zone
                {zonesForSearchedLot.length > 1 ? "s" : ""}:{" "}
                <span className="font-semibold text-brand-700">
                  {zonesForSearchedLot.join(", ")}
                </span>
              </p>
              <p className="text-sm font-medium text-ink">
                To completely shut off Lot {searchResults.lots[0]}, close:
              </p>
              <div className="flex flex-wrap gap-2">
                {searchResults.valves.map((valve) => (
                  <ValveChip
                    key={valve.valveId}
                    valveId={valve.valveId}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </div>
          )}

          <p className="mt-3 text-sm font-medium text-ink">
            Valves by zone — close all listed for a zone to fully shut it off:
          </p>
          <div className="mt-2 space-y-2">
            {shutoff.valvesByZone.map(({ zone, valves }) => (
              <div key={zone} className="flex flex-wrap items-center gap-2">
                {onSelect ? (
                  <button
                    type="button"
                    onClick={() => onSelect(zone)}
                    className="shrink-0 text-sm font-medium text-brand-700 hover:underline"
                  >
                    {zone}:
                  </button>
                ) : (
                  <span className="shrink-0 text-sm font-medium text-brand-700">
                    {zone}:
                  </span>
                )}
                <div className="flex flex-wrap gap-2">
                  {valves.map((valveId) => (
                    <ValveChip
                      key={valveId}
                      valveId={valveId}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!searchResults.singleValveLookup &&
          shutoff.completelyShutOffZones.length > 0 && (
            <ZoneBadgeSection
              title={`Completely shut off zones (${shutoff.completelyShutOffZones.length})`}
              description="Closing all valves above for these zones will completely shut off water."
              zones={shutoff.completelyShutOffZones}
              onSelect={onSelect}
              variant="danger"
            />
          )}

        {shutoff.affectedZones.length > 0 && (
          <ZoneBadgeSection
            title={`Affected zones (${shutoff.affectedZones.length})`}
            description="Pressure may be affected but zones are not fully shut off."
            zones={shutoff.affectedZones}
            onSelect={onSelect}
            variant="warning"
          />
        )}

        {lotsForSearchedZone.length > 0 && (
          <LotBadgeSection
            title={`Lots in ${searchResults.zones[0] ?? searchQuery} (${lotsForSearchedZone.length})`}
            description="All lots in this zone from the Zone Sheet."
            lots={lotsForSearchedZone}
            onSelect={onSelect}
            linkLotsToSite={linkLotsToSite}
            variant="success"
          />
        )}

        {shutoff.affectedLots.length > 0 && (
          <LotBadgeSection
            title={`Affected lots (${shutoff.affectedLots.length})`}
            description={
              lotsForSearchedZone.length > 0
                ? "Lots in other zones that share valves with this zone."
                : "Lots connected to the valves above — pressure may be affected."
            }
            lots={shutoff.affectedLots}
            onSelect={onSelect}
            linkLotsToSite={linkLotsToSite}
            variant="warning"
          />
        )}
      </div>

      {showRelatedValves && searchResults.valves.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-ink">Related valves</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {searchResults.valves.map((valve) => (
              <ValveCard key={valve.valveId} valve={valve} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ValveChip({
  valveId,
  onSelect,
}: {
  valveId: string;
  onSelect?: (id: string) => void;
}) {
  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(valveId)}
        className="rounded-lg bg-slate-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-500"
      >
        {valveId}
      </button>
    );
  }

  return (
    <Link
      href={`/valves/${encodeURIComponent(valveId)}`}
      className="rounded-lg bg-slate-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-500"
    >
      {valveId}
    </Link>
  );
}

function ZoneBadgeSection({
  title,
  description,
  zones,
  onSelect,
  variant,
}: {
  title: string;
  description: string;
  zones: string[];
  onSelect?: (zone: string) => void;
  variant: "danger" | "warning";
}) {
  const colors =
    variant === "danger"
      ? "border-red-300 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20"
      : "border-amber-300 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20";
  const badge =
    variant === "danger"
      ? "bg-red-600 border-red-400 hover:bg-red-500"
      : "bg-amber-600 border-amber-400 hover:bg-amber-500";

  return (
    <div className={`mt-4 rounded-xl border p-4 ${colors}`}>
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="mt-1 text-xs text-muted">{description}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {zones.map((zone) =>
          onSelect ? (
            <button
              key={zone}
              type="button"
              onClick={() => onSelect(zone)}
              className={`rounded-md border px-3 py-1 text-sm font-medium text-white ${badge}`}
            >
              {zone}
            </button>
          ) : (
            <Link
              key={zone}
              href={`/map?zone=${encodeURIComponent(zone)}`}
              className={`rounded-md border px-3 py-1 text-sm font-medium text-white ${badge}`}
            >
              {zone}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}

function LotBadgeSection({
  title,
  description,
  lots,
  onSelect,
  linkLotsToSite,
  variant,
}: {
  title: string;
  description: string;
  lots: string[];
  onSelect?: (lot: string) => void;
  linkLotsToSite?: boolean;
  variant: "success" | "warning";
}) {
  const colors =
    variant === "success"
      ? "border-green-300 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20"
      : "border-amber-300 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20";
  const badge =
    variant === "success"
      ? "bg-green-600 border-green-400 hover:bg-green-500"
      : "bg-amber-600 border-amber-400 hover:bg-amber-500";

  return (
    <div className={`mt-4 rounded-xl border p-4 ${colors}`}>
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="mt-1 text-xs text-muted">{description}</p>
      <div className="mt-2 flex max-h-48 flex-wrap gap-2 overflow-y-auto">
        {lots.map((lot) =>
          linkLotsToSite ? (
            <Link
              key={lot}
              href={siteHref(lot)}
              className={`rounded-md border px-3 py-1 text-sm font-medium text-white ${badge}`}
            >
              {lot}
            </Link>
          ) : (
            <button
              key={lot}
              type="button"
              onClick={() => onSelect?.(lot)}
              className={`rounded-md border px-3 py-1 text-sm font-medium text-white ${badge}`}
            >
              {lot}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

function ValveCard({
  valve,
  onSelect,
}: {
  valve: ValveRecord;
  onSelect?: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(valve.valveId)}
          className="w-full text-left"
        >
          <ValveCardBody valve={valve} />
        </button>
      ) : (
        <ValveCardBody valve={valve} />
      )}
      <Link
        href={`/valves/${encodeURIComponent(valve.valveId)}`}
        className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline"
      >
        Valve details →
      </Link>
    </div>
  );
}

function ValveCardBody({ valve }: { valve: ValveRecord }) {
  return (
    <>
      <p className="text-lg font-bold text-brand-700">{valve.valveId}</p>
      <p className="mt-1 text-sm text-muted">{valve.location || "—"}</p>
      {valve.function && (
        <p className="mt-2 text-sm text-ink">{valve.function}</p>
      )}
      {valve.zones.length > 0 && (
        <p className="mt-2 text-xs text-muted">
          Zones: {valve.zones.join(", ")}
        </p>
      )}
    </>
  );
}
