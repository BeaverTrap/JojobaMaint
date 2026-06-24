import Image from "next/image";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import PostPostHeader from "@/components/PostPostHeader";
import FeedSectionBadge from "@/components/FeedSectionBadge";
import ShareButtons from "@/components/ShareButtons";
import type { FeedItem } from "@/lib/feed";
import { formatPostedEditedLines } from "@/lib/content-dates";

/** One row on the home feed — posts use PostCard; everything else uses this layout. */
export default function FeedItemCard({
  item,
  canEdit = false,
}: {
  item: FeedItem;
  canEdit?: boolean;
}) {
  if (item.post) {
    return <PostCard post={item.post} canEdit={canEdit} />;
  }

  const dateLines = formatPostedEditedLines(item.createdAt, item.updatedAt);
  const images = item.imageUrls;
  const useCrewIcon = item.posterAvatar != null;

  return (
    <article className="motion-card overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      {useCrewIcon ? (
        <PostPostHeader
          posterAvatar={item.posterAvatar}
          feedSection={item.feedSection}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          canEdit={canEdit}
          editHref={item.editHref ?? undefined}
          isDraft={item.isDraft}
        />
      ) : (
        <div className="flex items-center gap-3 px-4 pt-4">
          {item.authorAvatar ? (
            <Image
              src={item.authorAvatar}
              alt={item.authorName}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {item.authorName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink">{item.authorName}</p>
            {dateLines.map((line) => (
              <p key={line} className="text-xs text-muted">
                {line}
              </p>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <FeedSectionBadge section={item.feedSection} />
            {item.isDraft && (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                Draft
              </span>
            )}
            {canEdit && item.editHref && (
              <Link
                href={item.editHref}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted transition hover:bg-hover hover:text-ink"
              >
                Edit
              </Link>
            )}
          </div>
        </div>
      )}

      <Link href={item.href} className="block px-4 py-3">
        <h2 className="text-[15px] font-semibold leading-snug text-ink">
          {item.title}
        </h2>
        {item.locationLine && (
          <p className="mt-1 text-xs font-medium text-brand-700">
            {item.locationLine}
          </p>
        )}
        {item.summary && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
            {item.summary}
          </p>
        )}
      </Link>

      {images.length === 1 && (
        <Link href={item.href} className="block">
          <div className="relative aspect-[16/9] w-full bg-canvas">
            <Image
              src={images[0]}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 640px"
              unoptimized
            />
          </div>
        </Link>
      )}

      {images.length > 1 && (
        <div className="grid grid-cols-2 gap-0.5">
          {images.slice(0, 4).map((url, i) => (
            <Link
              key={url}
              href={item.href}
              className="relative aspect-square bg-canvas"
            >
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes="50vw"
                unoptimized
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
            path: item.href,
            title: item.title,
            description: item.summary ?? item.locationLine ?? undefined,
          }}
        />
      </div>
    </article>
  );
}
