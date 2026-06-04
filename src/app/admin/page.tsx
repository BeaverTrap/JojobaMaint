import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchCategories } from "@/lib/posts";
import PostForm from "@/components/PostForm";
import type { PostCategory } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section } = await searchParams;
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

  const initialCategory =
    categories.find((c) => c.slug === section)?.slug ?? "maintenance";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">
          Staff dashboard
        </h1>
        <p className="text-sm text-muted">
          The feed is the catch-all — every post shows there. Pick a section
          below when logging work, or open assessments and articles for longer
          write-ups.
        </p>
      </div>

      <StaffQuickLinks categories={categories} activeSection={initialCategory} />

      <div>
        <h2 className="text-sm font-semibold text-ink">New feed post</h2>
        <p className="mt-0.5 text-sm text-muted">
          Title, details, photos, and optional site or common area.
        </p>
        <div className="mt-3">
          <PostForm
            mode="create"
            categories={categories}
            recentPosts={recentPosts}
            initialCategory={initialCategory}
            redirectTo="/"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ResourceCard
          title="Maintenance assessments"
          description="Pipes, halls, big projects, cross-connection, pond work — published transparency pages."
          href="/admin/maintenance-assessments"
          cta="Manage →"
        />
        <ResourceCard
          title="Tree assessments"
          description="Lot-specific tree and plant evaluations — damage, inquiries, findings."
          href="/admin/tree-assessments"
          cta="Manage →"
        />
        <ResourceCard
          title="Articles"
          description="Long-form guides with inline photos."
          href="/admin/articles"
          cta="Manage →"
        />
        <ResourceCard
          title="All feed posts"
          description="Browse and edit anything already on the feed."
          href="/admin/posts"
          cta="View posts →"
        />
      </div>
    </div>
  );
}

function StaffQuickLinks({
  categories,
  activeSection,
}: {
  categories: PostCategory[];
  activeSection: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-ink">Quick start</h2>
      <p className="mt-1 text-xs text-muted">
        Feed posts (any section) · assessments · articles
      </p>

      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Feed section
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/admin?section=${c.slug}`}
            className={
              activeSection === c.slug
                ? "rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
                : "rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-hover"
            }
          >
            + {c.label}
          </Link>
        ))}
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
        Longer write-ups
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <QuickLink href="/admin/maintenance-assessments/new" label="+ Maintenance assessment" />
        <QuickLink href="/admin/tree-assessments/new" label="+ Tree assessment" />
        <QuickLink href="/admin/articles/new" label="+ Article" />
        <QuickLink href="/admin/posts" label="Edit feed posts" />
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-hover"
    >
      {label}
    </Link>
  );
}

function ResourceCard({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <Link
        href={href}
        className="mt-3 inline-flex rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-hover"
      >
        {cta}
      </Link>
    </div>
  );
}
