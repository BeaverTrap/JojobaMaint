"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatCrossConnection } from "@/lib/lots";
import {
  siteTypeLabel,
  type SiteLocationType,
  type SiteRecord,
} from "@/lib/site-types";

const INPUT_CLASS =
  "w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:border-brand-500 dark:focus:ring-brand-800";

type TypeFilter = "all" | SiteLocationType;

const TYPE_FILTER_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "lot", label: "Lots only" },
  { value: "site", label: "Named sites" },
  { value: "amenity", label: "Amenities" },
];

function siteMatchesQuery(site: SiteRecord, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (site.name.toLowerCase().includes(q)) return true;
  if (site.slug.toLowerCase().includes(q)) return true;
  if (site.unit_id?.toLowerCase().includes(q)) return true;
  if (site.zones.some((z) => z.toLowerCase().includes(q))) return true;
  if (site.valves.some((v) => v.toLowerCase().includes(q))) return true;
  return false;
}

function siteSummary(site: SiteRecord): string {
  if (site.location_type === "amenity") return "Park amenity";
  const parts: string[] = [];
  if (site.zones.length > 0) parts.push(site.zones.join(", "));
  if (site.unit_id) parts.push(`CCCP ${site.unit_id}`);
  if (site.location_type === "lot" && site.has_cross_connection !== null) {
    parts.push(formatCrossConnection(site.has_cross_connection));
  }
  return parts.length > 0 ? parts.join(" · ") : "No sheet data yet";
}

function groupSites(sites: SiteRecord[]) {
  return {
    lots: sites.filter((s) => s.location_type === "lot"),
    sites: sites.filter((s) => s.location_type === "site"),
    amenities: sites.filter((s) => s.location_type === "amenity"),
  };
}

type SitesLookupProps = {
  sites: SiteRecord[];
};

export default function SitesLookup({ sites }: SitesLookupProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [jumpValue, setJumpValue] = useState("");

  const normalizedQuery = searchQuery.trim();
  const showResults = normalizedQuery.length > 0 || typeFilter !== "all";

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      if (typeFilter !== "all" && site.location_type !== typeFilter) return false;
      return siteMatchesQuery(site, normalizedQuery);
    });
  }, [sites, typeFilter, normalizedQuery]);

  const grouped = useMemo(() => groupSites(sites), [sites]);

  function handleJump(slug: string) {
    if (!slug) return;
    setJumpValue("");
    router.push(`/sites/${slug}`);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="site-search" className="text-sm font-medium text-ink">
            Search
          </label>
          <input
            id="site-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Lot #, name, zone, valve, or CCCP unit ID"
            className={`mt-1.5 ${INPUT_CLASS}`}
            autoComplete="off"
          />
        </div>
        <div className="sm:min-w-[10rem]">
          <label htmlFor="site-type-filter" className="text-sm font-medium text-ink">
            Show
          </label>
          <select
            id="site-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className={`mt-1.5 ${INPUT_CLASS}`}
          >
            {TYPE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="site-jump" className="text-sm font-medium text-ink">
          Jump to site
        </label>
        <select
          id="site-jump"
          value={jumpValue}
          onChange={(e) => {
            const slug = e.target.value;
            setJumpValue(slug);
            handleJump(slug);
          }}
          className={`mt-1.5 ${INPUT_CLASS}`}
        >
          <option value="">Choose a lot, site, or amenity…</option>
          {grouped.lots.length > 0 && (
            <optgroup label="Lots">
              {grouped.lots.map((site) => (
                <option key={site.slug} value={site.slug}>
                  {site.name}
                </option>
              ))}
            </optgroup>
          )}
          {grouped.sites.length > 0 && (
            <optgroup label="Named sites">
              {grouped.sites.map((site) => (
                <option key={site.slug} value={site.slug}>
                  {site.name}
                </option>
              ))}
            </optgroup>
          )}
          {grouped.amenities.length > 0 && (
            <optgroup label="Amenities">
              {grouped.amenities.map((site) => (
                <option key={site.slug} value={site.slug}>
                  {site.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {showResults && (
        <div className="rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {filteredSites.length} match{filteredSites.length === 1 ? "" : "es"}
            </p>
            {(normalizedQuery || typeFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                }}
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {filteredSites.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">
              No sites match that search. Try a lot number, zone, or amenity name.
            </p>
          ) : (
            <ul className="max-h-[min(24rem,50dvh)] divide-y divide-line overflow-y-auto">
              {filteredSites.map((site) => (
                <li key={site.slug}>
                  <Link
                    href={`/sites/${site.slug}`}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-hover"
                  >
                    <span className="min-w-[3.5rem] shrink-0 font-semibold tabular-nums text-ink">
                      {site.name}
                    </span>
                    <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 dark:bg-brand-900/40">
                      {siteTypeLabel(site.location_type)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-muted">
                      {siteSummary(site)}
                    </span>
                    <span className="shrink-0 text-sm text-brand-700">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!showResults && (
        <p className="text-sm text-muted">
          Search or filter above, or pick from the dropdown to open a site profile.
        </p>
      )}
    </div>
  );
}
