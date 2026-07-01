import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EmergencySmsDashboard from "@/components/EmergencySmsDashboard";
import { fetchSmsHistory } from "@/lib/sms-history";
import { fetchSmsTemplates } from "@/lib/sms-templates";
import { fetchResidentTags } from "@/lib/sms-dispatch";
import { requireAdminRole } from "@/lib/require-admin-role";

export const dynamic = "force-dynamic";

export default async function AdminEmergencyAlertsPage() {
  await requireAdminRole();

  const supabase = await createClient();
  const [availableTags, templates, history] = await Promise.all([
    fetchResidentTags(supabase),
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
        <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">
          Emergency SMS Dashboard
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Enterprise mass-text alerts with templates, tier-aware audience
          filtering, AI polish, scheduling, calendar sync, landline voice
          fallback, and a full audit log. Admin access only.
        </p>
      </div>

      <EmergencySmsDashboard
        templates={templates}
        availableTags={availableTags}
        history={history}
      />
    </div>
  );
}
