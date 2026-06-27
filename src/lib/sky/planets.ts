import {
  Body,
  Equator,
  Horizon,
  Illumination,
  KM_PER_AU,
  Observer,
  SearchAltitude,
  SearchRiseSet,
} from "astronomy-engine";
import { moonPhaseForDateIso, moonPhaseLabel } from "@/lib/moon-phase";
import type { NightSkyTonight, VisiblePlanet } from "@/lib/sky/types";

const PARK_TZ = "America/Los_Angeles";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Naked-eye planets vs. those that need binoculars/a scope. */
const NAKED_EYE = new Set<Body>([
  Body.Mercury,
  Body.Venus,
  Body.Mars,
  Body.Jupiter,
  Body.Saturn,
]);

const PLANET_ORDER: Body[] = [
  Body.Venus,
  Body.Jupiter,
  Body.Saturn,
  Body.Mars,
  Body.Mercury,
  Body.Uranus,
  Body.Neptune,
];

/** Minimum altitude (degrees) we treat as realistically "up" for viewing. */
const MIN_ALT_DEG = 5;

function altitudeOf(body: Body, date: Date, observer: Observer): number {
  const eq = Equator(body, date, observer, true, true);
  const hor = Horizon(date, observer, eq.ra, eq.dec, "normal");
  return hor.altitude;
}

function azimuthAltOf(
  body: Body,
  date: Date,
  observer: Observer,
): { altitude: number; azimuth: number } {
  const eq = Equator(body, date, observer, true, true);
  const hor = Horizon(date, observer, eq.ra, eq.dec, "normal");
  return { altitude: hor.altitude, azimuth: hor.azimuth };
}

function nextEvent(
  body: Body,
  direction: number,
  after: Date,
  observer: Observer,
): Date | null {
  const ev = SearchRiseSet(body, observer, direction, after, 2);
  return ev ? ev.date : null;
}

/** Most recent rise/set at or before `before`. */
function lastEventBefore(
  body: Body,
  direction: number,
  before: Date,
  observer: Observer,
): Date | null {
  let cursor = new Date(before.getTime() - DAY_MS);
  let last: Date | null = null;
  for (let i = 0; i < 4; i += 1) {
    const ev = SearchRiseSet(body, observer, direction, cursor, 2);
    if (!ev) break;
    if (ev.date.getTime() <= before.getTime()) {
      last = ev.date;
      cursor = new Date(ev.date.getTime() + 60_000);
    } else {
      break;
    }
  }
  return last;
}

function compassFromAzimuth(azimuth: number): string {
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const idx = Math.round(azimuth / 45) % 8;
  return points[idx];
}

function dirlabel(azimuth: number): string {
  const map: Record<string, string> = {
    N: "north",
    NE: "northeast",
    E: "east",
    SE: "southeast",
    S: "south",
    SW: "southwest",
    W: "west",
    NW: "northwest",
  };
  return map[compassFromAzimuth(azimuth)] ?? "the horizon";
}

function withinWindow(d: Date | null, start: Date, end: Date): Date | null {
  if (!d) return null;
  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime()
    ? d
    : null;
}

function dateLabel(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: PARK_TZ,
  });
}

/**
 * Computes which planets (and the moon) are visible over the park tonight,
 * with directions, altitudes, brightness, and a best-viewing hint.
 *
 * All ephemeris is computed locally via astronomy-engine — no network calls.
 */
export function computeNightSky(
  lat: number,
  lng: number,
  now: Date = new Date(),
): NightSkyTonight {
  const observer = new Observer(lat, lng, 0);

  // Anchor the night window on sunset/sunrise around `now`.
  const sunUpNow = altitudeOf(Body.Sun, now, observer) >= 0;
  const sunset = sunUpNow
    ? nextEvent(Body.Sun, -1, now, observer)
    : lastEventBefore(Body.Sun, -1, now, observer);
  const windowStart = sunset ?? now;
  const sunrise =
    nextEvent(Body.Sun, 1, windowStart, observer) ??
    new Date(windowStart.getTime() + 12 * 60 * 60 * 1000);

  // Astronomical dusk/dawn (Sun at -18°) bound the truly dark hours.
  const astroDusk = SearchAltitude(Body.Sun, observer, -1, windowStart, 1, -18);
  const astroDawn = SearchAltitude(Body.Sun, observer, 1, windowStart, 1, -18);

  // Sample the night to find each planet's best (highest) moment.
  const stepMs = 15 * 60 * 1000;
  const planets: VisiblePlanet[] = [];

  for (const body of PLANET_ORDER) {
    let bestAlt = -90;
    let bestAz = 0;
    let bestTime: Date | null = null;

    for (let t = windowStart.getTime(); t <= sunrise.getTime(); t += stepMs) {
      const sample = new Date(t);
      const { altitude, azimuth } = azimuthAltOf(body, sample, observer);
      if (altitude > bestAlt) {
        bestAlt = altitude;
        bestAz = azimuth;
        bestTime = sample;
      }
    }

    if (bestAlt < MIN_ALT_DEG || !bestTime) continue;

    const illum = Illumination(body, bestTime);
    const rise = withinWindow(
      nextEvent(body, 1, windowStart, observer),
      windowStart,
      sunrise,
    );
    const set = withinWindow(
      nextEvent(body, -1, windowStart, observer),
      windowStart,
      sunrise,
    );

    planets.push({
      name: String(body),
      visibleNakedEye: NAKED_EYE.has(body),
      magnitude: Math.round(illum.mag * 10) / 10,
      altitudeDeg: Math.round(bestAlt),
      azimuthDeg: Math.round(bestAz),
      compass: compassFromAzimuth(bestAz),
      direction: dirlabel(bestAz),
      bestTimeIso: bestTime.toISOString(),
      riseIso: rise ? rise.toISOString() : null,
      setIso: set ? set.toISOString() : null,
      distanceKm: Math.round(illum.geo_dist * KM_PER_AU),
      ringTiltDeg:
        body === Body.Saturn && illum.ring_tilt != null
          ? Math.round(illum.ring_tilt)
          : null,
    });
  }

  // Brightest (lowest magnitude) first.
  planets.sort((a, b) => a.magnitude - b.magnitude);

  // Moon tonight — sample the night for best viewing position.
  const midNight = new Date((windowStart.getTime() + sunrise.getTime()) / 2);
  let moonBestAlt = -90;
  let moonBestAz = 0;
  let moonBestTime: Date | null = null;

  for (let t = windowStart.getTime(); t <= sunrise.getTime(); t += stepMs) {
    const sample = new Date(t);
    const { altitude, azimuth } = azimuthAltOf(Body.Moon, sample, observer);
    if (altitude > moonBestAlt) {
      moonBestAlt = altitude;
      moonBestAz = azimuth;
      moonBestTime = sample;
    }
  }

  const moonSample = moonBestTime ?? midNight;
  const moonIllum = Illumination(Body.Moon, moonSample);
  const illuminationPercent = Math.round(moonIllum.phase_fraction * 100);
  const tonightIso = windowStart.toLocaleDateString("en-CA", {
    timeZone: PARK_TZ,
  });
  const moonPhase = moonPhaseForDateIso(tonightIso);
  const moonAgeDays =
    Math.round(moonPhase * 29.530588853 * 10) / 10;
  const moonrise = withinWindow(
    nextEvent(Body.Moon, 1, windowStart, observer),
    windowStart,
    sunrise,
  );
  const moonset = withinWindow(
    nextEvent(Body.Moon, -1, windowStart, observer),
    windowStart,
    sunrise,
  );

  const bestViewingNote = buildViewingNote({
    astroDusk: astroDusk ? astroDusk.date : null,
    astroDawn: astroDawn ? astroDawn.date : null,
    illuminationPercent,
    moonrise,
    moonset,
  });

  return {
    dateLabel: dateLabel(windowStart),
    sunsetIso: windowStart.toISOString(),
    sunriseIso: sunrise.toISOString(),
    darkAfterIso: astroDusk ? astroDusk.date.toISOString() : null,
    moon: {
      phase: moonPhase,
      illuminationPercent,
      phaseLabel: moonPhaseLabel(moonPhase),
      riseIso: moonrise ? moonrise.toISOString() : null,
      setIso: moonset ? moonset.toISOString() : null,
      altitudeDeg: Math.max(0, Math.round(moonBestAlt)),
      compass: compassFromAzimuth(moonBestAz),
      direction: dirlabel(moonBestAz),
      bestTimeIso: moonSample.toISOString(),
      distanceKm: Math.round(moonIllum.geo_dist * KM_PER_AU),
      moonAgeDays,
    },
    planets,
    bestViewingNote,
  };
}

function fmt(d: Date | null): string | null {
  if (!d) return null;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: PARK_TZ,
  });
}

function buildViewingNote({
  astroDusk,
  astroDawn,
  illuminationPercent,
  moonrise,
  moonset,
}: {
  astroDusk: Date | null;
  astroDawn: Date | null;
  illuminationPercent: number;
  moonrise: Date | null;
  moonset: Date | null;
}): string {
  const parts: string[] = [];

  const dusk = fmt(astroDusk);
  const dawn = fmt(astroDawn);
  if (dusk && dawn) {
    parts.push(`Skies are fully dark from about ${dusk} until ${dawn}.`);
  } else if (dusk) {
    parts.push(`Skies are fully dark after about ${dusk}.`);
  }

  const bright = illuminationPercent >= 40;
  const moonsetStr = fmt(moonset);
  const moonriseStr = fmt(moonrise);

  if (bright && moonsetStr) {
    parts.push(
      `The ${illuminationPercent}%-lit moon sets at ${moonsetStr}, leaving darker skies after.`,
    );
  } else if (bright && moonriseStr) {
    parts.push(
      `A ${illuminationPercent}%-lit moon rises at ${moonriseStr} and can wash out fainter objects.`,
    );
  } else if (bright) {
    parts.push(
      `A bright ${illuminationPercent}%-lit moon is up most of the night.`,
    );
  } else {
    parts.push(
      `With the moon only ${illuminationPercent}% lit, fainter objects show well.`,
    );
  }

  return parts.join(" ");
}
