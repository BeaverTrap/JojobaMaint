"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import SearchBar from "@/components/SearchBar";
import ShareButtons from "@/components/ShareButtons";
import { ContentIndexCardLink } from "@/components/ContentIndexCard";
import { assessmentLocationLine } from "@/lib/tree-assessment-display";
import type {
  TreeAssessmentConcern,
  TreeAssessmentWithAuthor,
} from "@/lib/database.types";

export default function TreeAssessmentsIndex({
  assessments,
  concerns,
  canEdit = false,
}: {
  assessments: TreeAssessmentWithAuthor[];
  concerns: TreeAssessmentConcern[];
  canEdit?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [activeConcern, setActiveConcern] = useState("all");

  const labelBySlug = useMemo(() => {
    const m = new Map<string, string>();
    concerns.forEach((c) => m.set(c.slug, c.label));
    return m;
  }, [concerns]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assessments.filter((a) => {
      const matchesConcern =
        activeConcern === "all" || a.concern_type === activeConcern;
      const haystack = [
        a.title,
        a.summary,
        a.body,
        a.reference_list,
        a.site_number,
        a.tree_description,
        a.plant_type,
        a.how_found,
        a.resolution_status,
        a.resolution_notes,
        assessmentLocationLine(a),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      return matchesConcern && matchesQuery;
    });
  }, [query, activeConcern, assessments]);

  return (
    <div className="space-y-4">
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search by site, tree, or concern…"
      />

      <div className="flex flex-wrap gap-2">
        <Tab
          label="All"
          active={activeConcern === "all"}
          onClick={() => setActiveConcern("all")}
        />
        {concerns.map((c) => (
          <Tab
            key={c.slug}
            label={c.label}
            active={activeConcern === c.slug}
            onClick={() => setActiveConcern(c.slug)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
          <p className="text-3xl">🌳</p>
          <p className="mt-3 text-sm font-medium text-ink">
            No assessments yet
          </p>
          <p className="mt-1 text-sm text-muted">
            {canEdit
              ? "Publish lot-specific assessments so residents can see our findings."
              : "Published assessments will appear here for transparency."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <ContentIndexCardLink
              key={a.id}
              href={`/tree-assessments/${a.slug}`}
              coverUrl={a.cover_image_url}
              coverAlt={a.title}
              footer={
                <div className="border-t border-line bg-hover/50 dark:bg-black/60">
                  <ShareButtons
                    variant="inline"
                    content={{
                      path: `/tree-assessments/${a.slug}`,
                      title: a.title,
                      description: assessmentLocationLine(a),
                    }}
                  />
                </div>
              }
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40">
                  {labelBySlug.get(a.concern_type) ?? a.concern_type}
                </span>
                {!a.published && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                    Draft
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-lg font-semibold text-ink">{a.title}</h2>
              <p className="mt-0.5 text-base font-medium text-brand-700">
                {assessmentLocationLine(a)}
              </p>
              {a.summary && (
                <p className="mt-1 line-clamp-2 text-base text-muted">
                  {a.summary}
                </p>
              )}
              <p className="mt-2 text-sm text-muted">
                {formatDistanceToNow(new Date(a.updated_at), {
                  addSuffix: true,
                })}
                <span className="ml-2 font-medium text-brand-700">
                  Read more →
                </span>
              </p>
            </ContentIndexCardLink>
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
