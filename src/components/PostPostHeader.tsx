import Link from "next/link";
import PostPosterAvatar from "@/components/PostPosterAvatar";
import FeedSectionBadge from "@/components/FeedSectionBadge";
import { formatPostedEditedLines } from "@/lib/content-dates";
import { parseFeedSection, type FeedSection } from "@/lib/feed-section";

export default function PostPostHeader({
  posterAvatar,
  categoryLabel,
  feedSection,
  createdAt,
  updatedAt,
  avatarSize = 36,
  canEdit = false,
  editHref,
  isDraft = false,
}: {
  posterAvatar: string | null | undefined;
  categoryLabel?: string;
  feedSection?: FeedSection | string;
  createdAt: string;
  updatedAt?: string | null;
  avatarSize?: number;
  canEdit?: boolean;
  editHref?: string;
  isDraft?: boolean;
}) {
  const dateLines = formatPostedEditedLines(createdAt, updatedAt);
  const section = feedSection
    ? parseFeedSection(feedSection)
    : categoryLabel
      ? parseFeedSection(
          categoryLabel.toLowerCase() === "landscaping"
            ? "landscaping"
            : categoryLabel.toLowerCase() === "both"
              ? "both"
              : "maintenance",
        )
      : "maintenance";

  return (
    <div className="flex items-center gap-3 px-4 pt-4">
      <PostPosterAvatar
        slug={posterAvatar}
        size={avatarSize}
        className={avatarSize >= 40 ? "h-10 w-10" : "h-9 w-9"}
      />
      <div className="min-w-0 leading-tight">
        <FeedSectionBadge section={section} />
        {dateLines.map((line) => (
          <p key={line} className="mt-1 text-xs text-muted">
            {line}
          </p>
        ))}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {isDraft && (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Draft
          </span>
        )}
        {canEdit && editHref && (
          <Link
            href={editHref}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted transition hover:bg-hover hover:text-ink"
          >
            Edit
          </Link>
        )}
      </div>
    </div>
  );
}
