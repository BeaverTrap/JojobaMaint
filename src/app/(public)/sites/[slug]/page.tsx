import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchSiteBySlug, siteTypeLabel } from "@/lib/sites";
import { formatCrossConnection } from "@/lib/lots";
import LocationPhotoGallery from "@/components/LocationPhotoGallery";
import LotStaffNotesForm from "@/components/LotStaffNotesForm";
import SiteDetailMap from "@/components/SiteDetailMap";
import SiteShutoffPanel from "@/components/SiteShutoffPanel";

export const dynamic = "force-dynamic";

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();
  const site = await fetchSiteBySlug(supabase, slug);

  if (!site) notFound();

  const isAmenity = site.location_type === "amenity";
  const hasSheetData =
    !isAmenity &&
    (site.zones.length > 0 ||
      site.valves.length > 0 ||
      site.unit_id ||
      site.has_cross_connection !== null);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/sites"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← All sites
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {site.name}
          </h1>
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:bg-brand-900/40">
            {siteTypeLabel(site.location_type)}
          </span>
        </div>
      </div>

      {isAmenity ? (
        <p className="text-sm text-muted">
          Park amenity on the resort map
          {site.place_icon ? ` (${site.place_icon.replace(/^Md|Fa|Gi/, "")})` : ""}.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Irrigation zone
            </p>
            <p className="mt-1 text-base text-ink">
              {site.zones.length > 0 ? site.zones.join(", ") : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              CCCP unit ID
            </p>
            <p className="mt-1 text-base text-ink">{site.unit_id ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Cross-connection (CCCP)
            </p>
            <p className="mt-1 text-base text-ink">
              {formatCrossConnection(site.has_cross_connection)}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Shutoff valve(s)
            </p>
            <p className="mt-1 text-base text-ink">
              {site.valves.length > 0
                ? site.valves
                    .map((v) => `V${v.replace(/^V/i, "")}`)
                    .join(", ")
                : "—"}
            </p>
          </div>
        </div>
      )}

      {site.sheet_notes && (
        <section className="rounded-2xl border border-line bg-surface px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">From spreadsheet</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
            {site.sheet_notes}
          </p>
        </section>
      )}

      {hasSheetData && <SiteShutoffPanel lotName={site.name} />}

      <LocationPhotoGallery
        entityType="site"
        entityKey={site.name}
        isAuthorized={isAuthorized}
      />

      {isAuthorized && !isAmenity && (
        <LotStaffNotesForm slug={site.slug} initialNotes={site.staff_notes} />
      )}

      {site.sheet_synced_at && (
        <p className="text-xs text-muted">
          Sheet data last synced{" "}
          {new Date(site.sheet_synced_at).toLocaleString()}
        </p>
      )}

      <SiteDetailMap site={site} />
    </div>
  );
}
