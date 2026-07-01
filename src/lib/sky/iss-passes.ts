import { formatParkDateTime } from "@/lib/park-time";
import type { IssPass } from "@/lib/sky/types";

const ISS_PASS_API = "https://iss-api.polluxlabs.io/iss-pass";

type PolluxIssPass = {
  rise?: { time?: string; compass?: string };
  culmination?: { elevation_deg?: number };
  set?: { compass?: string };
  duration_sec?: number;
  visible?: boolean;
  visible_duration_sec?: number;
};

type PolluxIssResponse = {
  passes?: PolluxIssPass[];
};

function passElevationNote(pass: PolluxIssPass): string {
  const peak = pass.culmination?.elevation_deg;
  const rise = pass.rise?.compass;
  const set = pass.set?.compass;

  const parts: string[] = [];
  if (peak != null && Number.isFinite(peak)) {
    parts.push(`Peaks about ${Math.round(peak)}° above the horizon`);
  }
  if (rise && set) {
    parts.push(`from the ${rise} toward the ${set}`);
  } else if (rise) {
    parts.push(`look toward the ${rise}`);
  }

  return parts.length > 0
    ? `${parts.join(" ")}.`
    : "Look up — the station moves quickly across the sky.";
}

export async function fetchIssPasses(
  lat: number,
  lng: number,
): Promise<IssPass[]> {
  const url = new URL(ISS_PASS_API);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("n", "5");
  url.searchParams.set("visible_only", "true");

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`ISS pass feed unavailable (${res.status})`);
  }

  const json = (await res.json()) as PolluxIssResponse;
  const passes = json.passes ?? [];

  return passes
    .filter((pass) => pass.rise?.time != null)
    .map((pass) => {
      const durationSeconds =
        pass.visible_duration_sec ?? pass.duration_sec ?? 0;

      return {
        riseTime: pass.rise!.time!,
        durationSeconds,
        maxElevationNote: passElevationNote(pass),
      };
    });
}

export function formatIssPassTime(iso: string): string {
  return formatParkDateTime(iso, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatIssDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  return mins <= 1 ? "about 1 min" : `${mins} min`;
}
