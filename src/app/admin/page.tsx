import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchCategories } from "@/lib/posts";
import {
  fetchMaintenanceAssessmentIssueTypes,
  fetchMaintenanceAssessmentWorkTypes,
} from "@/lib/maintenance-assessments";
import { fetchContentTags } from "@/lib/content-tags";
import { fetchTreeAssessmentConcerns } from "@/lib/tree-assessments";
import ComposeArea from "@/components/ComposeArea";
import AdminHubSections from "@/components/AdminHubSections";
import RecentPostsCard from "@/components/RecentPostsCard";
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

  const { staffRole, profile } = await getCurrentUser();
  const role = staffRole ?? "staff";

  const supabase = await createClient();

  const [
    categories,
    { data: recent },
    treeConcerns,
    maintenanceWorkTypes,
    maintenanceIssueTypes,
    contentTags,
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
    fetchContentTags(supabase),
  ]);

  const recentPosts = (recent ?? []) as {
    id: string;
    title: string;
    description: string;
  }[];

  return (
    <div className="space-y-6">
      <AdminHubSections
        staffRole={role}
        displayName={profile?.display_name ?? undefined}
        activeArea={activeArea}
      />

      {activeArea && (
        <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
            {activeArea === "landscaping" ? "Landscaping" : "Maintenance"} post
          </h2>
          <Suspense fallback={<p className="mt-3 text-sm text-muted">Loading…</p>}>
            <div className="mt-4">
              <ComposeArea
                key={activeArea}
                area={activeArea}
                initialFormat={format}
                categories={categories}
                contentTags={contentTags}
                recentPosts={recentPosts}
                treeConcerns={treeConcerns}
                maintenanceWorkTypes={maintenanceWorkTypes}
                maintenanceIssueTypes={maintenanceIssueTypes}
              />
            </div>
          </Suspense>
        </section>
      )}

      {!activeArea && <RecentPostsCard posts={recentPosts.slice(0, 8)} />}
    </div>
  );
}
