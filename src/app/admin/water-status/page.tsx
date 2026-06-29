import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireStaffRole } from "@/lib/require-staff-role";
import { fetchWaterSystemStatus } from "@/lib/water-status";
import WaterStatusForm from "@/components/WaterStatusForm";

export const dynamic = "force-dynamic";

export default async function AdminWaterStatusPage() {
  await requireStaffRole("manager");
  const supabase = await createClient();
  const status = await fetchWaterSystemStatus(supabase);

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
          Water status
        </h1>
        <p className="text-sm text-muted">
          Set the park&apos;s water supply mode and any active or planned
          shutoff shown on the home page.
        </p>
      </div>

      <WaterStatusForm initial={status} />
    </div>
  );
}
