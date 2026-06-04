import Link from "next/link";
import PostPosterAvatar from "@/components/PostPosterAvatar";

export default function PostPostHeader({
  posterAvatar,
  categoryLabel,
  timeAgo,
  avatarSize = 36,
  canEdit = false,
  editHref,
}: {
  posterAvatar: string | null | undefined;
  categoryLabel: string;
  timeAgo: string;
  avatarSize?: number;
  canEdit?: boolean;
  editHref?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 pt-4">
      <PostPosterAvatar
        slug={posterAvatar}
        size={avatarSize}
        className={avatarSize >= 40 ? "h-10 w-10" : "h-9 w-9"}
      />
      <div className="min-w-0 leading-tight">
        <p className="text-sm font-semibold text-ink">{categoryLabel}</p>
        <p className="text-xs text-muted">{timeAgo}</p>
      </div>
      {canEdit && editHref && (
        <Link
          href={editHref}
          className="ml-auto shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-muted transition hover:bg-hover hover:text-ink"
        >
          Edit
        </Link>
      )}
    </div>
  );
}
