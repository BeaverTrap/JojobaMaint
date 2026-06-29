import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireStaffRole } from "@/lib/require-staff-role";
import { fetchPowerStatus } from "@/lib/power-status";
import PowerStatusForm from "@/components/PowerStatusForm";

export const dynamic = "force-dynamic";

export default async function AdminPowerStatusPage() {
  await requireStaffRole("manager");
  const supabase = await createClient();
  const status = await fetchPowerStatus(supabase);

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
          Power status
        </h1>
        <p className="text-sm text-muted">
          Manual override for the home page power card. Live SCE outages are
          pulled automatically from Cal OES.
        </p>
      </div>

      <PowerStatusForm initial={status} />
    </div>
  );
}
