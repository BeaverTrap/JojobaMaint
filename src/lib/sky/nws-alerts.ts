import type { NwsAlert } from "@/lib/sky/types";

const NWS_USER_AGENT =
  process.env.NWS_USER_AGENT ??
  "JojobaMaint/1.0 (https://jojoba-maint.vercel.app, weather@jojoba.local)";

type NwsAlertsResponse = {
  features?: Array<{
    id?: string;
    properties?: {
      id?: string;
      event?: string;
      severity?: string;
      headline?: string;
      description?: string;
      expires?: string;
    };
  }>;
};

export async function fetchNwsAlerts(
  lat: number,
  lng: number,
): Promise<NwsAlert[]> {
  const url = new URL("https://api.weather.gov/alerts/active");
  url.searchParams.set("point", `${lat.toFixed(4)},${lng.toFixed(4)}`);

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/geo+json",
      "User-Agent": NWS_USER_AGENT,
    },
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    throw new Error(`NWS alerts unavailable (${res.status})`);
  }

  const json = (await res.json()) as NwsAlertsResponse;
  const features = json.features ?? [];

  return features
    .map((f) => {
      const p = f.properties;
      if (!p?.event) return null;
      return {
        id: p.id ?? f.id ?? p.event,
        event: p.event,
        severity: p.severity ?? "Unknown",
        headline: p.headline ?? p.event,
        description: (p.description ?? "").slice(0, 500),
        expires: p.expires ?? null,
      } satisfies NwsAlert;
    })
    .filter((a): a is NwsAlert => a != null)
    .slice(0, 8);
}
