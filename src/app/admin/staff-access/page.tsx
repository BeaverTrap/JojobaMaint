import Link from "next/link";
import StaffAccessManager from "@/components/StaffAccessManager";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAuthorizedEmails } from "@/lib/staff-access";
import { requireStaffRole } from "@/lib/require-staff-role";

export const dynamic = "force-dynamic";

export default async function AdminStaffAccessPage() {
  const actorRole = await requireStaffRole("admin");

  const supabase = createAdminClient();
  const rows = await fetchAuthorizedEmails(supabase);

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
          Staff access
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Whitelist Google emails and assign roles. Changes take effect when
          each person signs in again.
        </p>
      </div>

      <StaffAccessManager initialRows={rows} actorRole={actorRole} />
    </div>
  );
}
