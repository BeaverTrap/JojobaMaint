import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchMapPositions } from "@/lib/map-positions";
import MapPageClient from "@/components/MapPageClient";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const supabase = await createClient();
  const [{ isAuthorized }, mapData] = await Promise.all([
    getCurrentUser(),
    fetchMapPositions(supabase),
  ]);

  return <MapPageClient isAuthorized={isAuthorized} mapData={mapData} />;
}
