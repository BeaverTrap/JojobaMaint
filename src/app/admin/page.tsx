import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/staff-roles";
import AdminHubSections from "@/components/AdminHubSections";
import RecentPostsCard from "@/components/RecentPostsCard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { staffRole, profile } = await getCurrentUser();
  const role = staffRole ?? "staff";

  const supabase = await createClient();
  const { data: recent } = await supabase
    .from("posts")
    .select("id, title, description")
    .order("created_at", { ascending: false })
    .limit(8);

  const recentPosts = (recent ?? []) as { id: string; title: string; description: string }[];

  return (
    <div className="space-y-6">
      <AdminHubSections
        staffRole={role}
        displayName={profile?.display_name ?? undefined}
      />

      <RecentPostsCard posts={recentPosts} />
    </div>
  );
}
