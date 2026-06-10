import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchWaterUsageReadings } from "@/lib/water-usage";
import WaterUsageDashboard from "@/components/WaterUsageDashboard";
import WaterSyncButton from "@/components/WaterSyncButton";

export const dynamic = "force-dynamic";

export default async function WaterPage() {
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();
  const readings = await fetchWaterUsageReadings(supabase);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Water usage
          </h1>
          <p className="text-sm text-muted">
            Monthly gallons from the Usage Calculations tab — synced from Google
            Sheets (2025 vs 2026 comparison).
          </p>
        </div>
        {isAuthorized && <WaterSyncButton />}
      </div>

      <WaterUsageDashboard readings={readings} />
    </div>
  );
}
