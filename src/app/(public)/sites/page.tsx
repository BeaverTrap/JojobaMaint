import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchSites } from "@/lib/sites";
import LotSyncButton from "@/components/LotSyncButton";
import MascotEmptyState from "@/components/MascotEmptyState";
import PageMascotHeading from "@/components/PageMascotHeading";
import SitesLookup from "@/components/SitesLookup";

export const dynamic = "force-dynamic";

export default async function SitesIndexPage() {
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();
  const sites = await fetchSites(supabase);

  return (
    <div className="space-y-6">
      <PageMascotHeading
        scene="map"
        title="All sites"
        description="Lots, named sites, and park amenities — search or pick from the list for zones, valves, CCCP, and map details."
      >
        <Link
          href="/map"
          className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-hover"
        >
          ← Map
        </Link>
        {isAuthorized ? <LotSyncButton /> : null}
      </PageMascotHeading>

      {sites.length === 0 ? (
        <MascotEmptyState
          scene="map"
          title="No sites in the database yet"
          description={
            isAuthorized
              ? "Tap Sync to load site data from the sheet."
              : "Site details appear here once they're available."
          }
        />
      ) : (
        <SitesLookup sites={sites} />
      )}
    </div>
  );
}
