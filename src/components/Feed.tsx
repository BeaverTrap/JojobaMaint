"use client";

import { useMemo, useState } from "react";
import SearchBar from "@/components/SearchBar";
import PostCard from "@/components/PostCard";
import { postBody, postTitle, postLocationLabel } from "@/lib/post-display";
import type { PostWithAuthor, PostCategory } from "@/lib/database.types";

export default function Feed({
  initialPosts,
  categories,
  canEdit = false,
}: {
  initialPosts: PostWithAuthor[];
  categories: PostCategory[];
  canEdit?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const labelBySlug = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.slug, c.label));
    return m;
  }, [categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialPosts.filter((p) => {
      const matchesCategory =
        activeCategory === "all" || p.category === activeCategory;
      const haystack = [
        postTitle(p),
        postBody(p),
        p.description,
        p.site_number,
        p.common_area,
        postLocationLabel(p),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory, initialPosts]);

  return (
    <div className="space-y-4">
      <SearchBar value={query} onChange={setQuery} />

      <p className="text-xs text-muted">
        <span className="font-semibold text-ink">All</span> shows every post
        regardless of section.
      </p>

      <div className="flex flex-wrap gap-2">
        <Tab
          label="All"
          active={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
        />
        {categories.map((c) => (
          <Tab
            key={c.slug}
            label={c.label}
            active={activeCategory === c.slug}
            onClick={() => setActiveCategory(c.slug)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState hasQuery={query.trim().length > 0} />
      ) : (
        <div className="space-y-4">
          {filtered.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              canEdit={canEdit}
              categoryLabel={labelBySlug.get(post.category)}
            />
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
        {hasQuery ? "No matching posts" : "No posts here yet"}
      </p>
      <p className="mt-1 text-sm text-muted">
        {hasQuery
          ? "Try a different keyword or section."
          : "Posts will appear here once staff start logging work."}
      </p>
    </div>
  );
}
