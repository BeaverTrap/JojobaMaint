import Link from "next/link";
import { redirect } from "next/navigation";
import MapEditClient from "@/components/MapEditClient";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchMapPositions } from "@/lib/map-positions";

export const dynamic = "force-dynamic";

export default async function MapEditPage() {
  const [{ isAuthorized, userId }, supabase] = await Promise.all([
    getCurrentUser(),
    createClient(),
  ]);

  if (!userId) {
    redirect("/login?next=/map/edit");
  }
  if (!isAuthorized) {
    redirect("/map");
  }

  const mapData = await fetchMapPositions(supabase);

  return (
    <div className="space-y-4">
      <MapEditClient initialData={mapData} />
      <p className="text-xs text-muted">
        Need sheet data first?{" "}
        <Link href="/sites" className="font-medium text-brand-700 hover:underline">
          Sync sites from sheet
        </Link>{" "}
        on the Sites page.
      </p>
    </div>
  );
}
