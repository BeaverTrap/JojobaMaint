import Link from "next/link";
import { redirect } from "next/navigation";
import MapEditClient from "@/components/MapEditClient";
import { getCurrentUser } from "@/lib/auth";
import { canManageSiteContent } from "@/lib/staff-roles";
import { createClient } from "@/lib/supabase/server";
import { fetchMapPositions } from "@/lib/map-positions";

export const dynamic = "force-dynamic";

export default async function MapEditPage() {
  const [{ staffRole, userId }, supabase] = await Promise.all([
    getCurrentUser(),
    createClient(),
  ]);

  if (!userId) {
    redirect("/login?next=/map/edit");
  }
  if (!canManageSiteContent(staffRole)) {
    redirect("/map");
  }

  const mapData = await fetchMapPositions(supabase);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MapEditClient initialData={mapData} />
      <p className="mt-2 shrink-0 text-xs text-muted">
        Need sheet data?{" "}
        <Link href="/sites" className="font-medium text-brand-700 hover:underline">
          Sync on Sites
        </Link>
      </p>
    </div>
  );
}
