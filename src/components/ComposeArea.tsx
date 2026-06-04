"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ComposeFormatToggle, {
  type ComposeFormat,
} from "@/components/ComposeFormatToggle";
import PostForm from "@/components/PostForm";
import TreeAssessmentForm from "@/components/TreeAssessmentForm";
import MaintenanceAssessmentForm from "@/components/MaintenanceAssessmentForm";
import type {
  MaintenanceAssessmentIssueType,
  MaintenanceAssessmentWorkType,
  PostCategory,
  TreeAssessmentConcern,
} from "@/lib/database.types";

type RecentPost = { id: string; title: string; description: string };

type Props = {
  area: "landscaping" | "maintenance";
  initialFormat: ComposeFormat;
  categories: PostCategory[];
  recentPosts: RecentPost[];
  treeConcerns: TreeAssessmentConcern[];
  maintenanceWorkTypes: MaintenanceAssessmentWorkType[];
  maintenanceIssueTypes: MaintenanceAssessmentIssueType[];
};

export default function ComposeArea({
  area,
  initialFormat,
  categories,
  recentPosts,
  treeConcerns,
  maintenanceWorkTypes,
  maintenanceIssueTypes,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [format, setFormat] = useState<ComposeFormat>(initialFormat);

  const syncUrl = useCallback(
    (nextFormat: ComposeFormat) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("area", area);
      params.set("format", nextFormat);
      router.replace(`/admin?${params.toString()}`, { scroll: false });
    },
    [area, router, searchParams],
  );

  function onFormatChange(next: ComposeFormat) {
    setFormat(next);
    syncUrl(next);
  }

  const postCategory = area === "landscaping" ? "landscaping" : "maintenance";

  const areaLabel = area === "landscaping" ? "Landscaping" : "Maintenance";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">{areaLabel}</h2>
        <ComposeFormatToggle value={format} onChange={onFormatChange} />
      </div>

      {format === "quick" ? (
        <PostForm
          mode="create"
          categories={categories}
          recentPosts={recentPosts}
          initialCategory={postCategory}
          redirectTo="/"
        />
      ) : area === "landscaping" ? (
        <TreeAssessmentForm
          mode="create"
          concerns={treeConcerns}
          redirectTo="/"
        />
      ) : (
        <MaintenanceAssessmentForm
          mode="create"
          workTypes={maintenanceWorkTypes}
          issueTypes={maintenanceIssueTypes}
          redirectTo="/"
        />
      )}
    </div>
  );
}
