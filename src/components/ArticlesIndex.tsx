"use client";

import { useMemo, useState } from "react";
import { formatPostedEditedLines } from "@/lib/content-dates";
import SearchBar from "@/components/SearchBar";
import AnimateIn from "@/components/AnimateIn";
import MascotEmptyState from "@/components/MascotEmptyState";
import ShareButtons from "@/components/ShareButtons";
import ContentTagList from "@/components/ContentTagList";
import { ContentIndexCardLink } from "@/components/ContentIndexCard";
import type { ArticleWithTags } from "@/lib/articles";
import type { ContentTag } from "@/lib/content-tags";

export default function ArticlesIndex({
  articles,
  tags,
  canEdit = false,
}: {
  articles: ArticleWithTags[];
  tags: ContentTag[];
  canEdit?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      const matchesTag =
        activeTag === "all" || a.tags.some((t) => t.slug === activeTag);
      const tagText = a.tags.map((t) => t.label).join(" ");
      const haystack =
        `${a.title} ${a.summary ?? ""} ${a.body} ${a.reference_list ?? ""} ${tagText}`.toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      return matchesTag && matchesQuery;
    });
  }, [query, activeTag, articles]);

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
          active={activeTag === "all"}
          onClick={() => setActiveTag("all")}
        />
        {tags.map((t) => (
          <Tab
            key={t.slug}
            label={t.label}
            active={activeTag === t.slug}
            onClick={() => setActiveTag(t.slug)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <MascotEmptyState
          scene={
            query.trim().length > 0 || activeTag !== "all" ? "search" : "reading"
          }
          title={
            query.trim().length > 0 || activeTag !== "all"
              ? "No articles matched"
              : "No articles yet"
          }
          description={
            query.trim().length > 0 || activeTag !== "all"
              ? "Try another search or tag."
              : canEdit
                ? "Create your first guide from the dashboard."
                : "Check back soon for park guides and best practices."
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((a, index) => (
            <AnimateIn key={a.id} delay={Math.min(index * 70, 420)}>
              <ContentIndexCardLink
              key={a.id}
              href={`/articles/${a.slug}`}
              coverUrl={a.cover_image_url}
              coverAlt={a.title}
              footer={
                <div className="border-t border-line bg-hover/50 dark:bg-black/60">
                  <ShareButtons
                    variant="inline"
                    content={{
                      path: `/articles/${a.slug}`,
                      title: a.title,
                      description: a.summary,
                    }}
                  />
                </div>
              }
            >
              <ContentTagList tags={a.tags} />
              {!a.published && (
                <span className="mt-2 inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  Draft
                </span>
              )}
              <h2 className="mt-1 text-lg font-semibold text-ink">{a.title}</h2>
              {a.summary && (
                <p className="mt-1 line-clamp-2 text-base text-muted">
                  {a.summary}
                </p>
              )}
              <div className="mt-2 text-sm text-muted">
                {formatPostedEditedLines(a.created_at, a.updated_at).map(
                  (line) => (
                    <p key={line}>{line}</p>
                  ),
                )}
                <p>
                  <span className="font-medium text-brand-700">
                    Read more →
                  </span>
                </p>
              </div>
            </ContentIndexCardLink>
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
