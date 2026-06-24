import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchSites } from "@/lib/sites";
import LotSyncButton from "@/components/LotSyncButton";
import MascotEmptyState from "@/components/MascotEmptyState";
import SitesLookup from "@/components/SitesLookup";

export const dynamic = "force-dynamic";

export default async function SitesIndexPage() {
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();
  const sites = await fetchSites(supabase);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/map"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            ← Park map &amp; lookup
          </Link>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">
            All sites
          </h1>
          <p className="text-sm text-muted">
            Lots, named sites, and park amenities — search or pick from the list
            for zones, valves, CCCP, and map details.
          </p>
        </div>
        {isAuthorized && <LotSyncButton />}
      </div>

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
