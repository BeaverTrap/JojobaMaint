"use client";

import { useMemo, useState } from "react";
import SearchBar from "@/components/SearchBar";
import FeedItemCard from "@/components/FeedItemCard";
import { filterFeedItems, type FeedFilter, type FeedItem } from "@/lib/feed";

const FILTERS: { id: FeedFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "maintenance", label: "Maintenance" },
  { id: "landscaping", label: "Landscaping" },
];

export default function Feed({
  items,
  canEdit = false,
}: {
  items: FeedItem[];
  canEdit?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");

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
          {filtered.map((item) => (
            <FeedItemCard key={item.id} item={item} canEdit={canEdit} />
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
          ? "rounded-full bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white"
          : "rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-medium text-ink transition hover:bg-hover"
      }
    >
      {label}
    </button>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
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
  );
}
