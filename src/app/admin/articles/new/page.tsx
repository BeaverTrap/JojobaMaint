import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireStaffRole } from "@/lib/require-staff-role";
import { isAdminRole } from "@/lib/staff-roles";
import {
  fetchArticleCategories,
  fetchRecentArticlesForPicker,
} from "@/lib/articles";
import ArticleForm from "@/components/ArticleForm";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const role = await requireStaffRole("manager");
  const canPublish = isAdminRole(role);
  const supabase = await createClient();
  const [tags, recentArticles] = await Promise.all([
    fetchArticleCategories(supabase),
    fetchRecentArticlesForPicker(supabase),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/articles"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Manage articles
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">
          New article
        </h1>
        <p className="text-sm text-muted">
          Write in Google Docs, then paste the body here. Save as draft or
          publish when ready.
        </p>
      </div>

      <ArticleForm
        mode="create"
        tags={tags}
        recentArticles={recentArticles}
        redirectTo="/admin/articles"
        canPublish={canPublish}
      />
    </div>
  );
}
