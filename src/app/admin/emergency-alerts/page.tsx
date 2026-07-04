import Link from "next/link";
import PageMascotHeading from "@/components/PageMascotHeading";
import { createClient } from "@/lib/supabase/server";
import EmergencySmsDashboard from "@/components/EmergencySmsDashboard";
import { fetchSmsHistory } from "@/lib/sms-history";
import { fetchSmsTemplates } from "@/lib/sms-templates";
import { requireAdminRole } from "@/lib/require-admin-role";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminEmergencyAlertsPage() {
  await requireAdminRole();
  const { staffRole } = await getCurrentUser();

  const supabase = await createClient();
  const [templates, history] = await Promise.all([
    fetchSmsTemplates(supabase),
    fetchSmsHistory(supabase),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Dashboard
        </Link>
        <div className="mt-2">
          <PageMascotHeading
            scene="alert"
            title="Emergency SMS Dashboard"
            description="Mass-text park alerts — templates, audience tags, message types, scheduling, and delivery log."
          />
        </div>
      </div>

      <EmergencySmsDashboard
        templates={templates}
        history={history}
        viewerRole={staffRole ?? "admin"}
      />
    </div>
  );
}
