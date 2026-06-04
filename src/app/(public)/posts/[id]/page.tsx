import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchCategories, normalizePostRow, normalizePostRows, POST_SELECT } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import PostPostHeader from "@/components/PostPostHeader";
import {
  postBody,
  postCategoryLabel,
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

  const categoryLabel = postCategoryLabel(p.category, categories);
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
        <PostPostHeader
          posterAvatar={p.poster_avatar}
          categoryLabel={categoryLabel}
          timeAgo={timeAgo}
          avatarSize={40}
          canEdit={isAuthorized}
          editHref={`/admin/posts/${p.id}/edit`}
        />

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
            />
          ))}
        </section>
      )}
    </div>
  );
}
