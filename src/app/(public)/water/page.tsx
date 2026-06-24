import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchWaterUsageReadings, fetchWaterSyncState } from "@/lib/water-usage";
import WaterUsageDashboard from "@/components/WaterUsageDashboard";
import WaterSyncButton from "@/components/WaterSyncButton";
import PageMascotHeading from "@/components/PageMascotHeading";

export const dynamic = "force-dynamic";

export default async function WaterPage() {
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();
  const [readings, lastSyncedAt] = await Promise.all([
    fetchWaterUsageReadings(supabase),
    fetchWaterSyncState(supabase),
  ]);

  return (
    <div className="space-y-6">
      <PageMascotHeading
        scene="tools"
        title="Water usage"
        description="Monthly water usage reports. Pick any past month below."
      >
        {isAuthorized ? <WaterSyncButton /> : null}
      </PageMascotHeading>

      <Suspense
        fallback={<p className="text-sm text-muted">Loading report…</p>}
      >
        <WaterUsageDashboard readings={readings} lastSyncedAt={lastSyncedAt} />
      </Suspense>
    </div>
  );
}
