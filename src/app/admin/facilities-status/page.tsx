import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireStaffRole } from "@/lib/require-staff-role";
import { fetchFacilities } from "@/lib/facility-status";
import FacilityStatusForm from "@/components/FacilityStatusForm";

export const dynamic = "force-dynamic";

export default async function AdminFacilitiesStatusPage() {
  await requireStaffRole("manager");
  const supabase = await createClient();
  const locations = await fetchFacilities(supabase);

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
          Facilities
        </h1>
        <p className="text-sm text-muted">
          West Laundry, East Laundry, Boondocks, Friendship Hall, and Office
          &amp; Ranch House — mark units working or down, or close an entire building.
        </p>
      </div>

      <FacilityStatusForm initial={locations} />
    </div>
  );
}
