import Link from "next/link";
import Image from "next/image";
import {
  postBody,
  postLocationLabel,
  postTitle,
} from "@/lib/post-display";
import { postImageUrls, type PostWithAuthor } from "@/lib/database.types";
import ShareButtons from "@/components/ShareButtons";
import PostPostHeader from "@/components/PostPostHeader";

export default function PostCard({
  post,
  canEdit = false,
}: {
  post: PostWithAuthor;
  canEdit?: boolean;
}) {
  const images = postImageUrls(post);
  const headline = postTitle(post);
  const details = postBody(post);
  const location = postLocationLabel(post);

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <PostPostHeader
        posterAvatar={post.poster_avatar}
        feedSection={post.category}
        createdAt={post.created_at}
        updatedAt={post.updated_at}
        canEdit={canEdit}
        editHref={`/admin/posts/${post.id}/edit`}
      />

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

      <div className="border-t border-line bg-hover/50 dark:bg-black/60">
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
