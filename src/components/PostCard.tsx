import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import type { PostWithAuthor } from "@/lib/database.types";

export default function PostCard({ post }: { post: PostWithAuthor }) {
  const authorName = post.author?.display_name ?? "Team member";
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
  });

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="flex items-center gap-3 px-4 pt-4">
        {post.author?.avatar_url ? (
          <Image
            src={post.author.avatar_url}
            alt={authorName}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
            {authorName.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="leading-tight">
          <p className="text-sm font-semibold text-ink">{authorName}</p>
          <p className="text-xs text-muted">{timeAgo}</p>
        </div>
      </div>

      <p className="px-4 py-3 text-[15px] leading-relaxed text-ink whitespace-pre-wrap">
        {post.description}
      </p>

      {post.image_url && (
        <div className="relative aspect-[4/3] w-full bg-canvas">
          <Image
            src={post.image_url}
            alt={post.description.slice(0, 80) || "Maintenance photo"}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover"
          />
        </div>
      )}
    </article>
  );
}
