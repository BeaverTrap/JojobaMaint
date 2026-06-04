import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  postBody,
  postLocationLabel,
  postTitle,
} from "@/lib/post-display";
import { postImageUrls, type PostWithAuthor } from "@/lib/database.types";
import ShareButtons from "@/components/ShareButtons";

export default function PostCard({
  post,
  canEdit = false,
  categoryLabel,
}: {
  post: PostWithAuthor;
  canEdit?: boolean;
  categoryLabel?: string;
}) {
  const authorName = post.author?.display_name ?? "Team member";
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
  });
  const images = postImageUrls(post);
  const headline = postTitle(post);
  const details = postBody(post);
  const location = postLocationLabel(post);

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

        <div className="ml-auto flex items-center gap-2">
          {categoryLabel && (
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/40">
              {categoryLabel}
            </span>
          )}
          {canEdit && (
            <Link
              href={`/admin/posts/${post.id}/edit`}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted transition hover:bg-hover hover:text-ink"
            >
              Edit
            </Link>
          )}
        </div>
      </div>

      {post.parent && (
        <Link
          href={`/posts/${post.parent.id}`}
          className="mx-4 mt-3 flex items-center gap-1.5 rounded-lg bg-hover px-3 py-2 text-xs font-medium text-muted transition hover:text-ink"
        >
          <span aria-hidden>↩</span>
          Continues:{" "}
          <span className="truncate text-ink">{postTitle(post.parent)}</span>
        </Link>
      )}

      <Link href={`/posts/${post.id}`} className="block px-4 py-3">
        <h2 className="text-[15px] font-semibold leading-snug text-ink">
          {headline}
        </h2>
        {location && (
          <p className="mt-1 text-xs font-medium text-brand-700">{location}</p>
        )}
        {details && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted whitespace-pre-wrap">
            {details}
          </p>
        )}
      </Link>

      {images.length === 1 && (
        <Link href={`/posts/${post.id}`} className="block">
          <div className="relative aspect-[4/3] w-full bg-canvas">
            <Image
              src={images[0]}
              alt={headline.slice(0, 80) || "Maintenance photo"}
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover"
            />
          </div>
        </Link>
      )}

      {images.length > 1 && (
        <div className="grid grid-cols-2 gap-0.5">
          {images.slice(0, 4).map((url, i) => (
            <Link
              key={url}
              href={`/posts/${post.id}`}
              className="relative aspect-square bg-canvas"
            >
              <Image
                src={url}
                alt={`Photo ${i + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 320px"
                className="object-cover"
              />
              {i === 3 && images.length > 4 && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
                  +{images.length - 4}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      <div className="border-t border-line bg-canvas/50">
        <ShareButtons
          variant="inline"
          content={{
            path: `/posts/${post.id}`,
            title: headline,
            description: location ?? details,
          }}
        />
      </div>
    </article>
  );
}
