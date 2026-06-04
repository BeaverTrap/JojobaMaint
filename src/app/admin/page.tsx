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
    <div className="space-y-5">
      <h1 className="text-xl font-bold tracking-tight text-ink">Create</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AreaChoice
          href="/admin?area=landscaping"
          active={activeArea === "landscaping"}
          title="Landscaping"
        />
        <AreaChoice
          href="/admin?area=maintenance"
          active={activeArea === "maintenance"}
          title="Maintenance"
        />
        <AreaChoice
          href="/admin/articles/new"
          active={false}
          title="Article"
        />
      </div>

      {activeArea && (
        <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-6">
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
        </section>
      )}
    </div>
  );
}

function AreaChoice({
  href,
  active,
  title,
}: {
  href: string;
  active: boolean;
  title: string;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "flex min-h-[3.25rem] items-center justify-center rounded-2xl border-2 border-brand-600 bg-brand-600 px-4 py-3 text-center font-semibold text-white shadow-sm"
          : "flex min-h-[3.25rem] items-center justify-center rounded-2xl border border-line bg-surface px-4 py-3 text-center font-semibold text-ink shadow-sm transition hover:bg-hover"
      }
    >
      {title}
    </Link>
  );
}
