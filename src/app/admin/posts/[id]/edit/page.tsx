import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchContentTags, fetchPostTagSlugs } from "@/lib/content-tags";
import { fetchCategories, normalizePostRow, POST_SELECT } from "@/lib/posts";
import PostForm from "@/components/PostForm";
import DeletePostButton from "@/components/DeletePostButton";
import { postImageUrls, type PostWithAuthor } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: post }, categories, contentTags, initialTags, { data: recent }] =
    await Promise.all([
    supabase.from("posts").select(POST_SELECT).eq("id", id).maybeSingle(),
    fetchCategories(supabase),
    fetchContentTags(supabase),
    fetchPostTagSlugs(supabase, id),
    supabase
      .from("posts")
      .select("id, title, description")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (!post) notFound();
  const p = normalizePostRow(post as unknown as PostWithAuthor);

  // Build the existing-images list: legacy single image first, then rows.
  const sortedImages = [...p.images].sort((a, b) => a.position - b.position);
  const existingImages = [
    ...(p.image_url
      ? [{ key: "legacy", url: p.image_url, isLegacy: true }]
      : []),
    ...sortedImages.map((img) => ({
      key: img.id,
      url: img.image_url,
      isLegacy: false,
    })),
  ];

  const recentPosts = (recent ?? []) as {
    id: string;
    title: string;
    description: string;
  }[];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Back to feed
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">
          Edit post
        </h1>
        <p className="text-sm text-muted">
          Update the title, details, section, location, photos, or job link.
        </p>
      </div>

      <PostForm
        mode="edit"
        postId={p.id}
        initialTitle={p.title}
        initialBody={p.body}
        initialCategory={p.category}
        initialParentId={p.parent_post_id}
        initialSiteNumber={p.site_number ?? ""}
        initialCommonArea={p.common_area ?? ""}
        initialImages={existingImages}
        categories={categories}
        contentTags={contentTags}
        initialTags={initialTags}
        recentPosts={recentPosts}
        redirectTo={`/posts/${p.id}`}
      />

      <div className="border-t border-line pt-4">
        <DeletePostButton
          postId={p.id}
          imageUrls={postImageUrls(p)}
          redirectTo="/"
        />
      </div>
    </div>
  );
}
