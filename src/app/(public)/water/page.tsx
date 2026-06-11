import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchWaterUsageReadings, fetchWaterSyncState } from "@/lib/water-usage";
import WaterUsageDashboard from "@/components/WaterUsageDashboard";
import WaterSyncButton from "@/components/WaterSyncButton";

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
      <div className="no-print flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Water usage
          </h1>
          <p className="text-sm text-muted">
            Monthly water usage reports. Pick any past month below.
          </p>
        </div>
        {isAuthorized && <WaterSyncButton />}
      </div>

      <Suspense
        fallback={<p className="text-sm text-muted">Loading report…</p>}
      >
        <WaterUsageDashboard readings={readings} lastSyncedAt={lastSyncedAt} />
      </Suspense>
    </div>
  );
}
