import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchCategories, normalizePostRow, normalizePostRows, POST_SELECT } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import {
  postBody,
  postLocationLabel,
  postTitle,
} from "@/lib/post-display";
import { postImageUrls, type PostWithAuthor } from "@/lib/database.types";
import { buildContentMetadata } from "@/lib/content-metadata";
import ShareButtons from "@/components/ShareButtons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (!post) return { title: "Post" };
  const p = normalizePostRow(post as unknown as PostWithAuthor);
  const images = postImageUrls(p);
  return buildContentMetadata({
    title: postTitle(p),
    description: postBody(p) || postLocationLabel(p),
    path: `/posts/${id}`,
    imageUrl: images[0] ?? null,
  });
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();

  const [{ data: post }, categories, { data: childData }] = await Promise.all([
    supabase.from("posts").select(POST_SELECT).eq("id", id).maybeSingle(),
    fetchCategories(supabase),
    supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("parent_post_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!post) notFound();
  const p = normalizePostRow(post as unknown as PostWithAuthor);
  const children = normalizePostRows(
    (childData ?? []) as unknown as PostWithAuthor[],
  );

  const labelBySlug = new Map(categories.map((c) => [c.slug, c.label]));
  const authorName = p.author?.display_name ?? "Team member";
  const timeAgo = formatDistanceToNow(new Date(p.created_at), {
    addSuffix: true,
  });
  const images = postImageUrls(p);

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="text-sm font-medium text-brand-700 hover:underline"
      >
        ← Back to feed
      </Link>

      {p.parent && (
        <Link
          href={`/posts/${p.parent.id}`}
          className="flex items-center gap-1.5 rounded-xl bg-hover px-4 py-3 text-sm font-medium text-muted transition hover:text-ink"
        >
          <span aria-hidden>↩</span> Continues from:{" "}
          <span className="truncate text-ink">{postTitle(p.parent)}</span>
        </Link>
      )}

      <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="flex items-center gap-3 px-4 pt-4">
          {p.author?.avatar_url ? (
            <Image
              src={p.author.avatar_url}
              alt={authorName}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {authorName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink">{authorName}</p>
            <p className="text-xs text-muted">{timeAgo}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:border dark:border-brand-700/50 dark:bg-brand-900/70 dark:text-brand-200">
              {labelBySlug.get(p.category) ?? p.category}
            </span>
            {isAuthorized && (
              <Link
                href={`/admin/posts/${p.id}/edit`}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted transition hover:bg-hover hover:text-ink"
              >
                Edit
              </Link>
            )}
          </div>
        </div>

        <div className="px-4 py-3">
          <h1 className="text-lg font-bold leading-snug text-ink">
            {postTitle(p)}
          </h1>
          {postLocationLabel(p) && (
            <p className="mt-1 text-sm font-medium text-brand-700">
              {postLocationLabel(p)}
            </p>
          )}
          {postBody(p) && (
            <p className="mt-3 text-[15px] leading-relaxed text-ink whitespace-pre-wrap">
              {postBody(p)}
            </p>
          )}
        </div>

        {images.length > 0 && (
          <div className="space-y-0.5">
            {images.map((url, i) => (
              <div key={url} className="relative aspect-[4/3] w-full bg-canvas">
                <Image
                  src={url}
                  alt={`Photo ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 640px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-line px-4 py-4">
          <ShareButtons
            content={{
              path: `/posts/${p.id}`,
              title: postTitle(p),
              description: postLocationLabel(p) ?? postBody(p),
            }}
          />
        </div>
      </article>

      {children.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            Continued by ({children.length})
          </h2>
          {children.map((child) => (
            <PostCard
              key={child.id}
              post={child}
              canEdit={isAuthorized}
              categoryLabel={labelBySlug.get(child.category)}
            />
          ))}
        </section>
      )}
    </div>
  );
}
