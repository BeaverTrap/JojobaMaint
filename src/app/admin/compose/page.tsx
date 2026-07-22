import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireStaffRole } from "@/lib/require-staff-role";
import { isAdminRole } from "@/lib/staff-roles";
import { fetchCategories } from "@/lib/posts";
import {
  fetchMaintenanceAssessmentIssueTypes,
  fetchMaintenanceAssessmentWorkTypes,
} from "@/lib/maintenance-assessments";
import { fetchContentTags } from "@/lib/content-tags";
import { fetchTreeAssessmentConcerns } from "@/lib/tree-assessments";
import ComposeArea from "@/components/ComposeArea";
import type { ComposeFormat } from "@/components/ComposeFormatToggle";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type ComposeAreaKey = "landscaping" | "maintenance";

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; format?: string }>;
}) {
  const role = await requireStaffRole("staff");
  const canPublish = isAdminRole(role);
  const { area: areaParam, format: formatParam } = await searchParams;

  const activeArea: ComposeAreaKey =
    areaParam === "landscaping"
      ? "landscaping"
      : areaParam === "maintenance"
        ? "maintenance"
        : "maintenance";

  if (areaParam !== "landscaping" && areaParam !== "maintenance") {
    redirect("/admin/compose?area=maintenance");
  }

  const format: ComposeFormat =
    formatParam === "structured" ? "structured" : "quick";

  const supabase = await createClient();

  const [categories, treeConcerns, maintenanceWorkTypes, maintenanceIssueTypes, contentTags, { data: recent }] =
    await Promise.all([
      fetchCategories(supabase),
      fetchTreeAssessmentConcerns(supabase),
      fetchMaintenanceAssessmentWorkTypes(supabase),
      fetchMaintenanceAssessmentIssueTypes(supabase),
      fetchContentTags(supabase),
      supabase
        .from("posts")
        .select("id, title, description")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const recentPosts = (recent ?? []) as { id: string; title: string; description: string }[];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm font-medium text-brand-700 hover:underline">
          ← Dashboard
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <Image
            src={activeArea === "landscaping" ? "/assets/Mascot_Sunhat.png" : "/assets/Mascot_Hardhat.png"}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink">
              {activeArea === "landscaping" ? "Landscaping" : "Maintenance"} post
            </h1>
            <p className="text-sm text-muted">
              {activeArea === "landscaping"
                ? "Create a quick or structured post for landscaping work."
                : "Create a quick or structured post for maintenance work."}
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-6">
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
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
            canPublish={canPublish}
          />
        </Suspense>
      </section>
    </div>
  );
}
