"use client";

import { useMemo, useState } from "react";
import SearchBar from "@/components/SearchBar";
import ShareButtons from "@/components/ShareButtons";
import { ContentIndexCardLink } from "@/components/ContentIndexCard";
import AssessmentListCardLead from "@/components/AssessmentListCardLead";
import { maintenanceLocationLine } from "@/lib/maintenance-assessment-display";
import type {
  MaintenanceAssessmentWorkType,
  MaintenanceAssessmentWithAuthor,
} from "@/lib/database.types";

export default function MaintenanceAssessmentsIndex({
  assessments,
  workTypes,
  canEdit = false,
}: {
  assessments: MaintenanceAssessmentWithAuthor[];
  workTypes: MaintenanceAssessmentWorkType[];
  canEdit?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [activeWorkType, setActiveWorkType] = useState("all");

  const labelBySlug = useMemo(() => {
    const m = new Map<string, string>();
    workTypes.forEach((w) => m.set(w.slug, w.label));
    return m;
  }, [workTypes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assessments.filter((a) => {
      const matchesType =
        activeWorkType === "all" || a.work_type === activeWorkType;
      const haystack = [
        a.title,
        a.summary,
        a.body,
        a.reference_list,
        a.site_number,
        a.common_area,
        a.work_description,
        a.how_found,
        a.resolution_status,
        a.resolution_notes,
        maintenanceLocationLine(a),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      return matchesType && matchesQuery;
    });
  }, [query, activeWorkType, assessments]);

  return (
    <div className="space-y-4">
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search by site, area, pipes, pond, project…"
      />

      <div className="flex flex-wrap gap-2">
        <Tab
          label="All"
          active={activeWorkType === "all"}
          onClick={() => setActiveWorkType("all")}
        />
        {workTypes.map((w) => (
          <Tab
            key={w.slug}
            label={w.label}
            active={activeWorkType === w.slug}
            onClick={() => setActiveWorkType(w.slug)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
          <p className="text-3xl">🔧</p>
          <p className="mt-3 text-sm font-medium text-ink">
            No maintenance assessments yet
          </p>
          <p className="mt-1 text-sm text-muted">
            {canEdit
              ? "Publish assessments for halls, pipes, big projects, landscaping, ponds, and more."
              : "Published maintenance work will appear here for transparency."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <ContentIndexCardLink
              key={a.id}
              href={`/maintenance-assessments/${a.slug}`}
              coverUrl={a.cover_image_url}
              coverAlt={a.title}
              footer={
                <div className="border-t border-line bg-hover/50 dark:bg-black/60">
                  <ShareButtons
                    variant="inline"
                    content={{
                      path: `/maintenance-assessments/${a.slug}`,
                      title: a.title,
                      description: maintenanceLocationLine(a),
                    }}
                  />
                </div>
              }
            >
              <AssessmentListCardLead
                posterAvatar={a.poster_avatar}
                sectionLabel="Maintenance"
                metaLabel={labelBySlug.get(a.work_type) ?? a.work_type}
                createdAt={a.created_at}
                updatedAt={a.updated_at}
                published={a.published}
              />
              <h2 className="mt-1 text-lg font-semibold text-ink">{a.title}</h2>
              <p className="mt-0.5 text-base font-medium text-brand-700">
                {maintenanceLocationLine(a)}
              </p>
              {a.summary && (
                <p className="mt-1 line-clamp-2 text-base text-muted">
                  {a.summary}
                </p>
              )}
              <p className="mt-2 text-sm font-medium text-brand-700">Read more →</p>
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
