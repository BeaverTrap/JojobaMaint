import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchCategories, normalizePostRow, normalizePostRows, POST_SELECT } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import PostPostHeader from "@/components/PostPostHeader";
import PrintReportHeader from "@/components/PrintReportHeader";
import PrintReportToolbar from "@/components/PrintReportToolbar";
import ArticleBody from "@/components/ArticleBody";
import {
  postBody,
  postLocationLabel,
  postTitle,
} from "@/lib/post-display";
import { postImageUrls, type PostWithAuthor } from "@/lib/database.types";
import { buildContentMetadata } from "@/lib/content-metadata";
import { formatPostedEditedLines } from "@/lib/content-dates";

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

  const [{ data: post }, { data: childData }] = await Promise.all([
    supabase.from("posts").select(POST_SELECT).eq("id", id).maybeSingle(),
    supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("parent_post_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!post) notFound();
  const p = normalizePostRow(post as unknown as PostWithAuthor);

  if (!p.published && !isAuthorized) {
    notFound();
  }

  const allChildren = normalizePostRows(
    (childData ?? []) as unknown as PostWithAuthor[],
  );
  const children = isAuthorized
    ? allChildren
    : allChildren.filter((c) => c.published);

  const images = postImageUrls(p);
  const dateLines = formatPostedEditedLines(p.created_at, p.updated_at);

  return (
    <div className="print-report space-y-6">
      <PrintReportHeader />
      <PrintReportToolbar
        backHref="/"
        backLabel="← Back to feed"
        fileName={postTitle(p)}
        shareContent={{
          path: `/posts/${p.id}`,
          title: postTitle(p),
          description: postLocationLabel(p) ?? postBody(p),
        }}
      />

      {p.parent && (
        <Link
          href={`/posts/${p.parent.id}`}
          className="no-print flex items-center gap-1.5 rounded-xl bg-hover px-4 py-3 text-sm font-medium text-muted transition hover:text-ink"
        >
          <span aria-hidden>↩</span> Continues from:{" "}
          <span className="truncate text-ink">{postTitle(p.parent)}</span>
        </Link>
      )}

      <article className="print-report-content overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <PostPostHeader
          posterAvatar={p.poster_avatar}
          feedSection={p.category}
          createdAt={p.created_at}
          avatarSize={40}
          canEdit={isAuthorized}
          editHref={`/admin/posts/${p.id}/edit`}
          isDraft={!p.published}
        />

        <div className="px-4 py-3">
          <h1 className="text-lg font-bold leading-snug text-ink">{postTitle(p)}</h1>
          {postLocationLabel(p) && (
            <p className="print-report-meta mt-1 text-sm font-medium text-brand-700">
              {postLocationLabel(p)}
            </p>
          )}
          <div className="print-report-meta mt-2 text-xs text-muted">
            {dateLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          {postBody(p) && (
            <div className="mt-3">
              <ArticleBody body={postBody(p)} />
            </div>
          )}
        </div>

        {images.length > 0 && (
          <>
            <div className="no-print space-y-0.5">
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
            <div className="print-only hidden print-report-photos px-4 pb-4 print:grid">
              {images.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt={`Photo ${i + 1}`} />
              ))}
            </div>
          </>
        )}

      </article>

      {children.length > 0 && (
        <section className="no-print space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            Continued by ({children.length})
          </h2>
          {children.map((child) => (
            <PostCard key={child.id} post={child} canEdit={isAuthorized} />
          ))}
        </section>
      )}
    </div>
  );
}
