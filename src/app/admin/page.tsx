import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { fetchCategories } from "@/lib/posts";
import {
  fetchMaintenanceAssessmentIssueTypes,
  fetchMaintenanceAssessmentWorkTypes,
} from "@/lib/maintenance-assessments";
import { fetchTreeAssessmentConcerns } from "@/lib/tree-assessments";
import ComposeArea from "@/components/ComposeArea";
import type { ComposeFormat } from "@/components/ComposeFormatToggle";

export const dynamic = "force-dynamic";

type ComposeAreaKey = "landscaping" | "maintenance";

function resolveArea(
  area?: string,
  legacyType?: string,
): ComposeAreaKey | undefined {
  if (area === "landscaping" || area === "maintenance") return area;
  if (legacyType === "landscaping" || legacyType === "maintenance") {
    return legacyType;
  }
  return undefined;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; type?: string; format?: string }>;
}) {
  const { area: areaParam, type: legacyType, format: formatParam } =
    await searchParams;
  const activeArea = resolveArea(areaParam, legacyType);
  const format: ComposeFormat =
    formatParam === "structured" ? "structured" : "quick";

  const supabase = await createClient();

  const [
    categories,
    { data: recent },
    treeConcerns,
    maintenanceWorkTypes,
    maintenanceIssueTypes,
  ] = await Promise.all([
    fetchCategories(supabase),
    supabase
      .from("posts")
      .select("id, title, description")
      .order("created_at", { ascending: false })
      .limit(50),
    fetchTreeAssessmentConcerns(supabase),
    fetchMaintenanceAssessmentWorkTypes(supabase),
    fetchMaintenanceAssessmentIssueTypes(supabase),
  ]);

  const recentPosts = (recent ?? []) as {
    id: string;
    title: string;
    description: string;
  }[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Create</h1>
        <p className="text-sm text-muted">
          Pick landscaping or maintenance, then use the toggle for a quick post or
          a structured one. Everything goes to the feed.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AreaChoice
          href="/admin?area=landscaping"
          active={activeArea === "landscaping"}
          title="Landscaping"
          description="Grounds, trees, lot work"
        />
        <AreaChoice
          href="/admin?area=maintenance"
          active={activeArea === "maintenance"}
          title="Maintenance"
          description="Daily work, ponds, projects"
        />
      </div>

      {activeArea ? (
        <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-ink">
            {activeArea === "landscaping" ? "Landscaping" : "Maintenance"}
          </h2>
          <div className="mt-4">
            <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
              <ComposeArea
                key={activeArea}
                area={activeArea}
                initialFormat={format}
                categories={categories}
                recentPosts={recentPosts}
                treeConcerns={treeConcerns}
                maintenanceWorkTypes={maintenanceWorkTypes}
                maintenanceIssueTypes={maintenanceIssueTypes}
              />
            </Suspense>
          </div>
        </section>
      ) : (
        <p className="text-sm text-muted">
          Choose landscaping or maintenance above, or write an article below.
        </p>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Article
          </h2>
          <p className="mt-1 text-sm text-muted">
            Long-form guides — also on the feed.
          </p>
        </div>
        <AreaChoice
          href="/admin/articles/new"
          active={false}
          title="Article"
          description="Step-by-step guide or reference"
        />
      </section>
    </div>
  );
}

function AreaChoice({
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
