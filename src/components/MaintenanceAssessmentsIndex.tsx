"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import SearchBar from "@/components/SearchBar";
import ShareButtons from "@/components/ShareButtons";
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
            <article
              key={a.id}
              className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm"
            >
              <Link
                href={`/maintenance-assessments/${a.slug}`}
                className="block transition hover:bg-hover/50"
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
                        {labelBySlug.get(a.work_type) ?? a.work_type}
                      </span>
                      {!a.published && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                          Draft
                        </span>
                      )}
                    </div>
                    <h2 className="mt-1 text-lg font-semibold text-ink">
                      {a.title}
                    </h2>
                    <p className="mt-0.5 text-base font-medium text-brand-700">
                      {maintenanceLocationLine(a)}
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
                  </div>
                </div>
              </Link>
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
            </article>
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
