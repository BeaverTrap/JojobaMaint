import Link from "next/link";
import { notFound } from "next/navigation";
import LocationPhotoGallery from "@/components/LocationPhotoGallery";
import { ParkMap } from "@/components/ParkMap";
import { getCurrentUser } from "@/lib/auth";
import { getValveById } from "@/lib/google-valves";
import { createClient } from "@/lib/supabase/server";
import { siteHref } from "@/lib/site-slug";
import { buildZoneColorMap } from "@/lib/zone-colors";
import { fetchMapPositions } from "@/lib/map-positions";

export const dynamic = "force-dynamic";

function mapsLink(location: string): string | null {
  if (!location) return null;
  const lotPattern = /Lot\s*\d+/i;
  const addressPattern =
    /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct)/i;
  if (lotPattern.test(location) || addressPattern.test(location)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  }
  return null;
}

export default async function ValveDetailPage({
  params,
}: {
  params: Promise<{ valveId: string }>;
}) {
  const { valveId } = await params;
  const [valve, { isAuthorized }, mapData] = await Promise.all([
    getValveById(valveId),
    getCurrentUser(),
    fetchMapPositions(await createClient()),
  ]);

  if (!valve) notFound();

  const zoneColors = buildZoneColorMap(valve.zones);
  const lotZones: Record<string, string[]> = {};
  for (const lot of valve.lots) {
    lotZones[lot] = valve.zones;
  }
  const externalMaps = mapsLink(valve.location);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/map"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Map &amp; lookup
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">
          Valve {valve.valveId}
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface px-5 py-4 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Location
          </p>
          <p className="mt-1 text-base text-ink">{valve.location || "—"}</p>
          {externalMaps && (
            <a
              href={externalMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline"
            >
              Open in Maps →
            </a>
          )}
        </div>
        <div className="rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Function
          </p>
          <p className="mt-1 text-base text-ink">{valve.function || "—"}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Zones
          </p>
          <p className="mt-1 text-base text-ink">
            {valve.zones.length > 0 ? valve.zones.join(", ") : "—"}
          </p>
        </div>
      </div>

      {valve.locationNotes && (
        <section className="rounded-2xl border border-line bg-surface px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Location notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
            {valve.locationNotes}
          </p>
        </section>
      )}

      {valve.lots.length > 0 && (
        <section className="rounded-2xl border border-line bg-surface px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Lots on this valve</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {valve.lots.map((lot) => (
              <Link
                key={lot}
                href={siteHref(lot)}
                className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-hover"
              >
                Lot {lot}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-ink">On the map</h2>
        <ParkMap
          initialMapData={mapData}
          lotsToShow={valve.lots}
          highlightValve={valve.valveId}
          highlightLot={valve.lots[0] ?? null}
          contextZones={valve.zones}
          lotZones={lotZones}
          zoneColors={zoneColors}
          autoFocusHighlight
          contextZone={valve.zones[0] ?? null}
          contextLot={valve.lots[0] ?? null}
          contextValve={valve.valveId}
          contextValves={[valve.valveId]}
        />
      </section>

      <p className="text-sm text-muted">
        <Link
          href={`/map?valve=${encodeURIComponent(valve.valveId)}`}
          className="font-medium text-brand-700 hover:underline"
        >
          Shutoff details on map →
        </Link>
      </p>

      <LocationPhotoGallery
        entityType="valve"
        entityKey={valve.valveId}
        isAuthorized={isAuthorized}
      />
    </div>
  );
}
