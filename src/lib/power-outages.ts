import { parkMapCenter } from "@/lib/map-geography";

export type PowerOutage = {
  id: string;
  utility: string;
  cause: string | null;
  outageType: string | null;
  status: string | null;
  impactedCustomers: number | null;
  county: string | null;
  startedAt: string | null;
  estimatedRestoreAt: string | null;
  distanceMiles: number;
  lat: number;
  lon: number;
};

export type PowerOutageResult = {
  outages: PowerOutage[];
  fetchedAt: string;
};

/** Cal OES statewide outage feed (PG&E, SCE, SDG&E, SMUD), refreshed ~15 min. */
const FEATURE_URL =
  "https://services.arcgis.com/BLN4oKB0N1YSgvY8/arcgis/rest/services/Power_Outages_(View)/FeatureServer/0/query";

/** Tight radius — we only care about outages at/around the park, not county-wide. */
const RADIUS_MILES = 3;
const REVALIDATE_SECONDS = 900;

function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusMiles * 2 * Math.asin(Math.sqrt(a));
}

function toIso(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return new Date(value).toISOString();
}

export async function fetchNearbyPowerOutages(): Promise<PowerOutageResult> {
  const { lat, lng } = parkMapCenter();
  const dLat = 0.5;
  const dLng = 0.6;
  const params = new URLSearchParams({
    where: "1=1",
    outFields:
      "OBJECTID,UtilityCompany,StartDate,EstimatedRestoreDate,Cause,ImpactedCustomers,County,OutageStatus,OutageType,IncidentId",
    geometry: `${lng - dLng},${lat - dLat},${lng + dLng},${lat + dLat}`,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    outSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    returnGeometry: "true",
    resultRecordCount: "1000",
    f: "json",
  });

  const res = await fetch(`${FEATURE_URL}?${params.toString()}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`Cal OES request failed: ${res.status}`);
  }

  const json = (await res.json()) as {
    features?: {
      attributes?: Record<string, unknown>;
      geometry?: { x?: number; y?: number };
    }[];
  };

  const features = Array.isArray(json.features) ? json.features : [];
  const outages: PowerOutage[] = [];

  for (const feature of features) {
    const attrs = feature.attributes ?? {};
    const geometry = feature.geometry ?? {};
    const olon = typeof geometry.x === "number" ? geometry.x : null;
    const olat = typeof geometry.y === "number" ? geometry.y : null;
    if (olat === null || olon === null) continue;

    const distance = haversineMiles(lat, lng, olat, olon);
    if (distance > RADIUS_MILES) continue;

    outages.push({
      id: String(attrs.IncidentId ?? attrs.OBJECTID ?? `${olat},${olon}`),
      utility:
        typeof attrs.UtilityCompany === "string"
          ? attrs.UtilityCompany
          : "Unknown utility",
      cause: typeof attrs.Cause === "string" ? attrs.Cause : null,
      outageType: typeof attrs.OutageType === "string" ? attrs.OutageType : null,
      status: typeof attrs.OutageStatus === "string" ? attrs.OutageStatus : null,
      impactedCustomers:
        typeof attrs.ImpactedCustomers === "number"
          ? attrs.ImpactedCustomers
          : null,
      county: typeof attrs.County === "string" ? attrs.County : null,
      startedAt: toIso(attrs.StartDate),
      estimatedRestoreAt: toIso(attrs.EstimatedRestoreDate),
      distanceMiles: Math.round(distance * 10) / 10,
      lat: olat,
      lon: olon,
    });
  }

  outages.sort((a, b) => a.distanceMiles - b.distanceMiles);
  return { outages, fetchedAt: new Date().toISOString() };
}
