import type { VandenbergLaunch } from "@/lib/sky/types";

type Ll2Launch = {
  id?: string;
  name?: string;
  status?: { name?: string; abbrev?: string };
  net?: string;
  launch_service_provider?: { name?: string };
  pad?: {
    name?: string;
    location?: { name?: string };
  };
  window_start?: string | null;
  window_end?: string | null;
};

type Ll2Response = {
  results?: Ll2Launch[];
};

function isVandenbergLaunch(launch: Ll2Launch): boolean {
  const loc = launch.pad?.location?.name?.toLowerCase() ?? "";
  const pad = launch.pad?.name?.toLowerCase() ?? "";
  return loc.includes("vandenberg") || pad.includes("vandenberg");
}

function viewingHintForLaunch(
  windowStart: string | null,
  sunsetIso: string | null,
  weatherCode: number,
): Pick<VandenbergLaunch, "viewingHint" | "viewingNote"> {
  if (!windowStart) {
    return {
      viewingHint: "unknown",
      viewingNote: "Launch window TBD — check again closer to the date.",
    };
  }

  const start = new Date(windowStart);
  if (Number.isNaN(start.getTime())) {
    return {
      viewingHint: "unknown",
      viewingNote: "Launch timing not confirmed yet.",
    };
  }

  const hour = start.toLocaleString("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: "America/Los_Angeles",
  });
  const hourNum = Number.parseInt(hour, 10);
  const isEvening = hourNum >= 17 || hourNum <= 5;
  const isClearish = weatherCode <= 3;

  if (isEvening && isClearish) {
    return {
      viewingHint: "good",
      viewingNote:
        "Evening launch + clear skies — look west after liftoff; you may see the plume or exhaust glow.",
    };
  }
  if (isEvening && !isClearish) {
    return {
      viewingHint: "maybe",
      viewingNote:
        "Evening launch but cloudy — might still see a glow if breaks in the clouds.",
    };
  }
  if (!isEvening && isClearish) {
    return {
      viewingHint: "unlikely",
      viewingNote:
        "Daytime launch — hard to see from inland SoCal unless you know where to look.",
    };
  }
  return {
    viewingHint: "unlikely",
    viewingNote: "Daytime and cloudy — unlikely to be visible from the park.",
  };
}

export async function fetchVandenbergLaunches(
  sunsetIso: string | null,
  currentWeatherCode: number,
): Promise<VandenbergLaunch[]> {
  const url =
    "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?format=json&limit=50";

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Launch schedule unavailable (${res.status})`);
  }

  const json = (await res.json()) as Ll2Response;
  const vandenberg = (json.results ?? []).filter(isVandenbergLaunch);

  return vandenberg.slice(0, 8).map((launch) => {
    const { viewingHint, viewingNote } = viewingHintForLaunch(
      launch.window_start ?? null,
      sunsetIso,
      currentWeatherCode,
    );
    return {
      id: launch.id ?? launch.name ?? "launch",
      name: launch.name ?? "Upcoming launch",
      provider:
        launch.launch_service_provider?.name ?? launch.net ?? "Unknown provider",
      status: launch.status?.name ?? "Scheduled",
      windowStart: launch.window_start ?? null,
      windowEnd: launch.window_end ?? null,
      padName: launch.pad?.name ?? "Vandenberg",
      viewingHint,
      viewingNote,
    };
  });
}

export function formatLaunchWindow(
  start: string | null,
  end: string | null,
): string {
  if (!start) return "Window TBD";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Los_Angeles",
    });
  if (!end) return fmt(start);
  return `${fmt(start)} – ${new Date(end).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  })}`;
}
