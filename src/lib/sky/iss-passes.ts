import type { IssPass } from "@/lib/sky/types";

type OpenNotifyResponse = {
  message?: string;
  response?: Array<{
    duration?: number;
    risetime?: number;
  }>;
};

export async function fetchIssPasses(
  lat: number,
  lng: number,
): Promise<IssPass[]> {
  const url = new URL("https://api.open-notify.org/iss-pass.json");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("n", "5");

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`ISS pass feed unavailable (${res.status})`);
  }

  const json = (await res.json()) as OpenNotifyResponse;
  if (json.message !== "success" || !json.response?.length) {
    return [];
  }

  return json.response
    .filter((p) => p.risetime != null && p.duration != null)
    .map((p) => ({
      riseTime: new Date((p.risetime ?? 0) * 1000).toISOString(),
      durationSeconds: p.duration ?? 0,
      maxElevationNote:
        "Look toward the west-northwest sky — the station moves quickly across the sky.",
    }));
}

export function formatIssPassTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
}

export function formatIssDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  return mins <= 1 ? "about 1 min" : `${mins} min`;
}
