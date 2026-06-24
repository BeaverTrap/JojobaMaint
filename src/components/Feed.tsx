"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import AnimateIn from "@/components/AnimateIn";
import FeedItemCard from "@/components/FeedItemCard";
import { filterFeedItems, type FeedItem } from "@/lib/feed";
import { parseFeedFilter, type FeedFilter } from "@/lib/feed-section";

const FILTERS: { id: FeedFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "maintenance", label: "Maintenance" },
  { id: "landscaping", label: "Landscaping" },
];

export default function Feed({
  items,
  canEdit = false,
  initialFilter = "all",
}: {
  items: FeedItem[];
  canEdit?: boolean;
  initialFilter?: FeedFilter;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FeedFilter>(initialFilter);

  useEffect(() => {
    setActiveFilter(parseFeedFilter(searchParams.get("section")));
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeFilter === "all") params.delete("section");
    else params.set("section", activeFilter);
    const next = params.toString();
    const current = searchParams.toString();
    if (next === current) return;
    router.replace(next ? `/?${next}` : "/", { scroll: false });
  }, [activeFilter, router, searchParams]);

  const filtered = useMemo(
    () => filterFeedItems(items, activeFilter, query),
    [items, activeFilter, query],
  );

  return (
    <div className="space-y-4">
      <SearchBar value={query} onChange={setQuery} placeholder="Search the feed…" />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Tab
            key={f.id}
            label={f.label}
            active={activeFilter === f.id}
            onClick={() => setActiveFilter(f.id)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState hasQuery={query.trim().length > 0} />
      ) : (
        <div className="space-y-4">
          {filtered.map((item, index) => (
            <AnimateIn key={item.id} delay={Math.min(index * 55, 330)}>
              <FeedItemCard item={item} canEdit={canEdit} />
            </AnimateIn>
          ))}
        </div>
      )}
    </div>
  );
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "motion-tab motion-press rounded-full bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm"
          : "motion-tab motion-press rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-medium text-ink hover:bg-hover"
      }
    >
      {label}
    </button>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <AnimateIn variant="scale">
      <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <p className="text-3xl">{hasQuery ? "🔍" : "🛠️"}</p>
      <p className="mt-3 text-sm font-medium text-ink">
        {hasQuery ? "Nothing matched" : "Nothing on the feed yet"}
      </p>
      <p className="mt-1 text-sm text-muted">
        {hasQuery
          ? "Try another search or filter."
          : "Posts, articles, and assessments will all show here."}
      </p>
    </div>
    </AnimateIn>
  );
}
