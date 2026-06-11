import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchLots, formatCrossConnection } from "@/lib/lots";
import LotSyncButton from "@/components/LotSyncButton";

export const dynamic = "force-dynamic";

export default async function LotsIndexPage() {
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();
  const lots = await fetchLots(supabase);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Lots</h1>
          <p className="text-sm text-muted">
            Every site lot and named location — zones, valves, unit ID, and
            cross-connection status from the spreadsheet.
          </p>
        </div>
        {isAuthorized && <LotSyncButton />}
      </div>

      {lots.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
          No lots in the database yet.
          {isAuthorized
            ? " Tap Sync lots from sheet once GOOGLE_VALVE_SHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON are configured."
            : " Staff sync lot data from the Google Sheet."}
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {lots.map((lot) => (
            <li key={lot.lot_number}>
              <Link
                href={`/lots/${lot.slug}`}
                className="block rounded-xl border border-line bg-surface px-4 py-3 transition hover:bg-hover"
              >
                <p className="font-semibold text-ink">Lot {lot.lot_number}</p>
                <p className="mt-1 text-xs text-muted">
                  {lot.zones.length > 0
                    ? lot.zones.join(", ")
                    : "No zone assigned"}
                  {lot.unit_id ? ` · Unit ${lot.unit_id}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Cross-connection: {formatCrossConnection(lot.has_cross_connection)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
