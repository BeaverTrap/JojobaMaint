import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EmergencyAlertsForm from "@/components/EmergencyAlertsForm";
import { fetchResidentTags } from "@/lib/residents";
import { requireAdminRole } from "@/lib/require-admin-role";

export const dynamic = "force-dynamic";

export default async function AdminEmergencyAlertsPage() {
  await requireAdminRole();

  const supabase = await createClient();
  const availableTags = await fetchResidentTags(supabase);

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
          Emergency SMS alerts
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Send a mass text to resident groups. Admin access only. Messages are
          limited to {160} characters per segment.
        </p>
      </div>

      <EmergencyAlertsForm availableTags={availableTags} />
    </div>
  );
}
