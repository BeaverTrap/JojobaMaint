import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchCategories } from "@/lib/posts";
import PostForm from "@/components/PostForm";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
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

  const showPostForm = type === "maintenance" || type === "landscaping";
  const postCategory = type === "landscaping" ? "landscaping" : "maintenance";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Create</h1>
        <p className="text-sm text-muted">
          Pick what you are posting. It all appears on the feed.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ComposeChoice
          href="/admin?type=maintenance"
          active={type === "maintenance"}
          title="Maintenance post"
          description="Job log for the feed"
        />
        <ComposeChoice
          href="/admin?type=landscaping"
          active={type === "landscaping"}
          title="Landscaping post"
          description="Grounds work for the feed"
        />
        <ComposeChoice
          href="/admin/articles/new"
          active={false}
          title="Article"
          description="Long guide (also on the feed)"
        />
      </div>

      {showPostForm ? (
        <div>
          <h2 className="text-sm font-semibold text-ink">
            {type === "landscaping" ? "Landscaping post" : "Maintenance post"}
          </h2>
          <div className="mt-3">
            <PostForm
              mode="create"
              categories={categories}
              recentPosts={recentPosts}
              initialCategory={postCategory}
              redirectTo="/"
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">
          Choose maintenance post, landscaping post, or article above.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <LinkCard
          href="/admin/tree-assessments"
          title="Tree assessments"
          description="Separate from feed posts — lot evaluations"
        />
        <LinkCard
          href="/admin/maintenance-assessments"
          title="Maintenance assessments"
          description="Pond, big projects, cross-connection, etc."
        />
      </div>
    </div>
  );
}

function ComposeChoice({
  href,
  active,
  title,
  description,
}: {
  href: string;
  active: boolean;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-2xl border-2 border-brand-600 bg-brand-600 p-4 text-white shadow-sm"
          : "rounded-2xl border border-line bg-surface p-4 shadow-sm transition hover:bg-hover"
      }
    >
      <p className="font-semibold">{title}</p>
      <p
        className={
          active ? "mt-1 text-sm text-brand-100" : "mt-1 text-sm text-muted"
        }
      >
        {description}
      </p>
    </Link>
  );
}

function LinkCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-line bg-surface p-4 shadow-sm transition hover:bg-hover"
    >
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </Link>
  );
}
