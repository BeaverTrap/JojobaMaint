import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchCategories } from "@/lib/posts";
import PostForm from "@/components/PostForm";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [categories, { data: recent }] = await Promise.all([
    fetchCategories(supabase),
    supabase
      .from("posts")
      .select("id, title, description")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const recentPosts = (recent ?? []) as {
    id: string;
    title: string;
    description: string;
  }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">
          Create a post
        </h1>
        <p className="text-sm text-muted">
          Log a job with a title, details, section, optional location, photos,
          and link to a previous job when it&apos;s a continuation.
        </p>
      </div>

      <PostForm
        mode="create"
        categories={categories}
        recentPosts={recentPosts}
        redirectTo="/"
      />

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-ink">Articles</h2>
        <p className="mt-1 text-sm text-muted">
          Long-form guides — trees, best practices, park knowledge. Paste from
          Google Docs.
        </p>
        <Link
          href="/admin/articles"
          className="mt-3 inline-flex rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-hover"
        >
          Manage articles →
        </Link>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-ink">Galleries</h2>
        <p className="mt-1 text-sm text-muted">
          Create project albums and upload multiple photos at once.
        </p>
        <Link
          href="/admin/galleries"
          className="mt-3 inline-flex rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-hover"
        >
          Manage galleries →
        </Link>
      </div>
    </div>
  );
}
