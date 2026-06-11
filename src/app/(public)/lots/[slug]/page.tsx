import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchLotBySlug, formatCrossConnection } from "@/lib/lots";
import LotStaffNotesForm from "@/components/LotStaffNotesForm";
import LotDetailMap from "@/components/LotDetailMap";

export const dynamic = "force-dynamic";

export default async function LotDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();
  const lot = await fetchLotBySlug(supabase, slug);

  if (!lot) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/lots"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← All lots
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">
          Lot {lot.lot_number}
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Irrigation zone
          </p>
          <p className="mt-1 text-base text-ink">
            {lot.zones.length > 0 ? lot.zones.join(", ") : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Unit ID
          </p>
          <p className="mt-1 text-base text-ink">{lot.unit_id ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Cross-connection
          </p>
          <p className="mt-1 text-base text-ink">
            {formatCrossConnection(lot.has_cross_connection)}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Shutoff valve(s)
          </p>
          <p className="mt-1 text-base text-ink">
            {lot.valves.length > 0
              ? lot.valves.map((v) => `V${v.replace(/^V/i, "")}`).join(", ")
              : "—"}
          </p>
        </div>
      </div>

      {lot.sheet_notes && (
        <section className="rounded-2xl border border-line bg-surface px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">From spreadsheet</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
            {lot.sheet_notes}
          </p>
        </section>
      )}

      <LotDetailMap
        lotNumber={lot.lot_number}
        zones={lot.zones}
        valves={lot.valves}
      />

      <p className="text-sm text-muted">
        <Link href={`/valves?lot=${encodeURIComponent(lot.lot_number)}`} className="font-medium text-brand-700 hover:underline">
          Valve shutoff details →
        </Link>
      </p>

      {isAuthorized && (
        <LotStaffNotesForm slug={lot.slug} initialNotes={lot.staff_notes} />
      )}

      {lot.sheet_synced_at && (
        <p className="text-xs text-muted">
          Sheet data last synced {new Date(lot.sheet_synced_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
