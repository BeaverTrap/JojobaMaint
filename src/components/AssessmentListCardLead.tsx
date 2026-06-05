import PostPosterAvatar from "@/components/PostPosterAvatar";
import { formatPostedEditedLines } from "@/lib/content-dates";

/** Index card header — section + crew icon, like feed posts. */
export default function AssessmentListCardLead({
  posterAvatar,
  sectionLabel,
  metaLabel,
  createdAt,
  updatedAt,
  published,
}: {
  posterAvatar: string | null | undefined;
  sectionLabel: string;
  metaLabel?: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
}) {
  const dateLines = formatPostedEditedLines(createdAt, updatedAt);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <PostPosterAvatar slug={posterAvatar} size={28} className="h-7 w-7" />
        <div className="min-w-0 leading-tight">
          <p className="text-sm font-semibold text-ink">{sectionLabel}</p>
          {dateLines.map((line) => (
            <p key={line} className="text-xs text-muted">
              {line}
            </p>
          ))}
        </div>
      </div>
      {(metaLabel || !published) && (
        <div className="flex flex-wrap items-center gap-2">
          {metaLabel && (
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40">
              {metaLabel}
            </span>
          )}
          {!published && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              Draft
            </span>
          )}
        </div>
      )}
    </div>
  );
}
