"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import AnimateIn from "@/components/AnimateIn";
import MascotEmptyState from "@/components/MascotEmptyState";
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
      <AnimateIn>
        <SearchBar value={query} onChange={setQuery} placeholder="Search the feed…" />
      </AnimateIn>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f, index) => (
          <AnimateIn key={f.id} delay={index * 45} variant="fade">
            <Tab
              label={f.label}
              active={activeFilter === f.id}
              onClick={() => setActiveFilter(f.id)}
            />
          </AnimateIn>
        ))}
      </div>

      {filtered.length === 0 ? (
        <MascotEmptyState
          scene={query.trim().length > 0 ? "search" : "welcome"}
          title={query.trim().length > 0 ? "Nothing matched" : "Nothing on the feed yet"}
          description={
            query.trim().length > 0
              ? "Try another search or filter."
              : "Posts, articles, and assessments will all show here."
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((item, index) => (
            <AnimateIn key={item.id} delay={Math.min(index * 70, 420)}>
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

