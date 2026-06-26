import { getCurrentUser } from "@/lib/auth";
import { canManageSiteContent } from "@/lib/staff-roles";
import { createClient } from "@/lib/supabase/server";
import { fetchMapPositions } from "@/lib/map-positions";
import MapPageClient from "@/components/MapPageClient";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const supabase = await createClient();
  const [{ staffRole }, mapData] = await Promise.all([
    getCurrentUser(),
    fetchMapPositions(supabase),
  ]);

  return (
    <MapPageClient
      isAuthorized={canManageSiteContent(staffRole)}
      mapData={mapData}
    />
  );
}
