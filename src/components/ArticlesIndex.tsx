"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import SearchBar from "@/components/SearchBar";
import type { ArticleWithAuthor, ArticleCategory } from "@/lib/database.types";

export default function ArticlesIndex({
  articles,
  categories,
  canEdit = false,
}: {
  articles: ArticleWithAuthor[];
  categories: ArticleCategory[];
  canEdit?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const labelBySlug = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.slug, c.label));
    return m;
  }, [categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      const matchesCategory =
        activeCategory === "all" || a.category === activeCategory;
      const haystack =
        `${a.title} ${a.summary ?? ""} ${a.body} ${a.reference_list ?? ""}`.toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory, articles]);

  return (
    <div className="space-y-4">
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search articles… (e.g. mulberry, irrigation, pruning)"
      />

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
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
          <p className="text-3xl">📖</p>
          <p className="mt-3 text-sm font-medium text-ink">No articles yet</p>
          <p className="mt-1 text-sm text-muted">
            {canEdit
              ? "Create your first guide from the dashboard."
              : "Check back soon for park guides and best practices."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Link
              key={a.id}
              href={`/articles/${a.slug}`}
              className="block overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:shadow-md"
            >
              <div className="flex gap-4 p-4">
                {a.cover_image_url && (
                  <div className="relative hidden h-20 w-20 shrink-0 overflow-hidden rounded-xl sm:block">
                    <Image
                      src={a.cover_image_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40">
                      {labelBySlug.get(a.category) ?? a.category}
                    </span>
                    {!a.published && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                        Draft
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1 font-semibold text-ink">{a.title}</h2>
                  {a.summary && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      {a.summary}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted">
                    {formatDistanceToNow(new Date(a.updated_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </Link>
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
