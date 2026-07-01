"use client";

import Image from "next/image";
import { useState } from "react";
import { MdExpandMore, MdPlayCircle } from "react-icons/md";
import Countdown from "@/components/Countdown";
import MoonPhaseIcon from "@/components/MoonPhaseIcon";
import { moonPhaseLabel } from "@/lib/moon-phase";
import type {
  ParkWeatherAirQuality,
  ParkWeatherCurrent,
  ParkWeatherDaily,
} from "@/lib/park-weather";
import {
  formatParkDate,
  formatParkDateTime,
  openMeteoLocalToDate,
  parkMonthFromDateIso,
} from "@/lib/park-weather";
import { formatLaunchWindow } from "@/lib/sky/launches";
import { formatIssDuration, formatIssPassTime } from "@/lib/sky/iss-passes";
import type {
  IssPass,
  NasaApod,
  NightSkyTonight,
  ParkWeatherHourly,
  VandenbergLaunch,
  VisiblePlanet,
} from "@/lib/sky/types";

const PLANET_COLOR: Record<string, string> = {
  Mercury: "#cbd5e1",
  Venus: "#fde68a",
  Mars: "#f87171",
  Jupiter: "#e8c39e",
  Saturn: "#f5e0b0",
  Uranus: "#a5f3fc",
  Neptune: "#93c5fd",
};

const PLANET_IMAGE_SRC: Record<string, string> = {
  Mercury: "/images/Mercury.png",
  Venus: "/images/Venus.png",
  Mars: "/images/Mars.png",
  Jupiter: "/images/Jupiter.png",
  Saturn: "/images/Saturn.png",
  Uranus: "/images/Uranus.png",
  Neptune: "/images/Neptune.png",
};

function formatClock(iso: string): string {
  return formatParkDateTime(iso, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDistanceKm(km: number): string {
  if (km >= 1_000_000) {
    return `${(km / 1_000_000).toFixed(1)}M km away`;
  }
  if (km >= 10_000) {
    return `${Math.round(km / 1000)}k km away`;
  }
  return `${km.toLocaleString()} km away`;
}

function formatRiseSet(
  riseIso: string | null,
  setIso: string | null,
): string | null {
  if (!riseIso && !setIso) return null;
  const rise = riseIso ? formatClock(riseIso) : "—";
  const set = setIso ? formatClock(setIso) : "—";
  return `${rise} → ${set}`;
}

function formatDurationBetween(startIso: string | null, endIso: string): string {
  if (!startIso) return "—";
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return "—";
  const hours = (end - start) / (1000 * 60 * 60);
  return `${hours.toFixed(1)}h`;
}

function forecastHoursBetween(
  hourly: ParkWeatherHourly[],
  startIso: string,
  endIso: string,
): ParkWeatherHourly[] {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) return [];

  return hourly.filter((hour) => {
    const time = openMeteoLocalToDate(hour.time).getTime();
    return !Number.isNaN(time) && time >= start && time <= end;
  });
}

function formatTempRange(hours: ParkWeatherHourly[]): string {
  if (hours.length === 0) return "—";
  const temps = hours.map((hour) => hour.temperatureF);
  return `${Math.min(...temps)}–${Math.max(...temps)}°F`;
}

function maxWind(hours: ParkWeatherHourly[], current: ParkWeatherCurrent): number {
  if (hours.length === 0) return current.windMph;
  return Math.max(current.windMph, ...hours.map((hour) => hour.windMph));
}

function isOffshoreWind(direction: string): boolean {
  return ["N", "NNE", "NE", "ENE", "E"].includes(direction.toUpperCase());
}

function parkMonth(dateIso: string): number {
  return parkMonthFromDateIso(dateIso);
}

function timelinePercent(iso: string, startIso: string, endIso: string): number {
  const time = new Date(iso).getTime();
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();

  if (
    Number.isNaN(time) ||
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    end <= start
  ) {
    return 0;
  }

  return Math.max(0, Math.min(100, ((time - start) / (end - start)) * 100));
}

function skyViewingStatus(
  current: ParkWeatherCurrent,
): { label: string; className: string } {
  const cloudy = current.weatherCode >= 2 && current.weatherCode <= 3;
  const obscured =
    (current.weatherCode >= 45 && current.weatherCode <= 48) ||
    current.weatherCode >= 51;

  if (obscured) {
    return {
      label: "Limited",
      className: "bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/25",
    };
  }

  if (cloudy) {
    return {
      label: "Fair",
      className: "bg-sky-400/15 text-sky-100 ring-1 ring-sky-300/25",
    };
  }

  return {
    label: "Good",
    className: "bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/25",
  };
}

function tonightViewingVerdict({
  current,
  airQuality,
  nightSky,
}: {
  current: ParkWeatherCurrent;
  airQuality: ParkWeatherAirQuality;
  nightSky: NightSkyTonight;
}): {
  label: string;
  summary: string;
  className: string;
  reasons: string[];
  bestWindow: string;
  target: string;
} {
  const cloudy = current.weatherCode >= 2 && current.weatherCode <= 3;
  const obscured =
    (current.weatherCode >= 45 && current.weatherCode <= 48) ||
    current.weatherCode >= 51;
  const brightMoon = nightSky.moon.illuminationPercent >= 80;
  const hazyAir = (airQuality?.usAqi ?? 0) > 50;
  const windy = current.windMph >= 18;
  const darkStart = nightSky.darkAfterIso ?? nightSky.sunsetIso;
  const nakedEyePlanets = nightSky.planets
    .filter((planet) => planet.visibleNakedEye)
    .slice(0, 3)
    .map((planet) => planet.name);

  const reasons = [
    obscured
      ? current.weatherLabel
      : cloudy
        ? `${current.weatherLabel} overhead`
        : "Clear sky window",
    brightMoon
      ? `${nightSky.moon.illuminationPercent}% moon washes out faint stars`
      : `${nightSky.moon.illuminationPercent}% moon keeps the sky darker`,
    airQuality?.usAqi != null
      ? `AQI ${airQuality.usAqi} (${airQuality.label})`
      : "AQI unavailable",
  ];

  if (windy) {
    reasons.push(`${current.windMph} mph wind`);
  }

  const target =
    nakedEyePlanets.length > 0
      ? `Moon + ${nakedEyePlanets.join(", ")}`
      : "Moon and bright stars";

  if (obscured || (hazyAir && cloudy)) {
    return {
      label: "Skip it",
      summary: "Sky viewing looks rough tonight.",
      className: "bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/25",
      reasons,
      bestWindow: `${formatClock(darkStart)}–${formatClock(nightSky.sunriseIso)}`,
      target,
    };
  }

  if (cloudy || brightMoon || hazyAir || windy) {
    return {
      label: "Fair",
      summary: "Good for the moon and bright planets, not faint stars.",
      className: "bg-sky-400/15 text-sky-100 ring-1 ring-sky-300/25",
      reasons,
      bestWindow: `${formatClock(darkStart)}–${formatClock(nightSky.sunriseIso)}`,
      target,
    };
  }

  return {
    label: "Great",
    summary: "A solid night to step outside and look up.",
    className: "bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/25",
    reasons,
    bestWindow: `${formatClock(darkStart)}–${formatClock(nightSky.sunriseIso)}`,
    target,
  };
}

function eveningComfortSummary({
  current,
  nightSky,
  hourly,
}: {
  current: ParkWeatherCurrent;
  nightSky: NightSkyTonight;
  hourly: ParkWeatherHourly[];
}): {
  label: string;
  summary: string;
  detail: string;
  className: string;
} {
  const eveningHours = forecastHoursBetween(
    hourly,
    nightSky.sunsetIso,
    nightSky.sunriseIso,
  );
  const wind = maxWind(eveningHours, current);
  const temps = eveningHours.map((hour) => hour.temperatureF);
  const low = temps.length > 0 ? Math.min(...temps) : current.temperatureF;
  const high = temps.length > 0 ? Math.max(...temps) : current.temperatureF;
  const range = formatTempRange(eveningHours);

  if (wind >= 22) {
    return {
      label: "Secure the patio",
      summary: "Wind may make sitting outside annoying.",
      detail: `${range} after sunset · gusty feel around ${wind} mph`,
      className: "bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/25",
    };
  }

  if (low <= 52) {
    return {
      label: "Bring a layer",
      summary: "Good evening air, but it cools off fast.",
      detail: `${range} after sunset · light jacket weather late`,
      className: "bg-sky-400/15 text-sky-100 ring-1 ring-sky-300/25",
    };
  }

  if (high >= 82) {
    return {
      label: "Warm sit-out night",
      summary: "Best after the heat backs off.",
      detail: `${range} after sunset · wait for the shade to settle in`,
      className: "bg-orange-400/15 text-orange-100 ring-1 ring-orange-300/25",
    };
  }

  return {
    label: "Patio friendly",
    summary: "Comfortable enough to step outside for a while.",
    detail: `${range} after sunset · wind near ${wind} mph`,
    className: "bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/25",
  };
}

function windHazeSummary({
  current,
  airQuality,
  hourly,
}: {
  current: ParkWeatherCurrent;
  airQuality: ParkWeatherAirQuality;
  hourly: ParkWeatherHourly[];
}): {
  label: string;
  summary: string;
  detail: string;
  className: string;
} {
  const next12Hours = hourly.slice(0, 12);
  const wind = maxWind(next12Hours, current);
  const offshore = isOffshoreWind(current.windDirection);
  const dry = current.humidityPercent <= 30;
  const hot = current.temperatureF >= 80;
  const aqi = airQuality?.usAqi ?? null;

  if (offshore && dry && wind >= 15) {
    return {
      label: "Santa Ana signal",
      summary: "Dry offshore wind could kick up dust and haze.",
      detail: `${current.windDirection} wind · ${current.humidityPercent}% humidity · ${wind} mph`,
      className: "bg-orange-400/15 text-orange-100 ring-1 ring-orange-300/25",
    };
  }

  if (wind >= 20 || (aqi != null && aqi > 75)) {
    return {
      label: "Dust / haze watch",
      summary: "Visibility may look milky even if the sky is clear.",
      detail:
        aqi != null
          ? `AQI ${aqi} · ${current.windDirection} wind up to ${wind} mph`
          : `${current.windDirection} wind up to ${wind} mph`,
      className: "bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/25",
    };
  }

  if (offshore && dry && hot) {
    return {
      label: "Dry offshore feel",
      summary: "Not windy enough for a full watch, but it has that dry SoCal feel.",
      detail: `${current.temperatureF}°F · ${current.humidityPercent}% humidity · ${current.windDirection}`,
      className: "bg-yellow-400/15 text-yellow-100 ring-1 ring-yellow-300/25",
    };
  }

  return {
    label: "No wind watch",
    summary: "No obvious Santa Ana or dust signal right now.",
    detail:
      aqi != null
        ? `AQI ${aqi} · ${current.windMph} mph ${current.windDirection}`
        : `${current.windMph} mph ${current.windDirection}`,
    className: "bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/25",
  };
}

function deepSkySeasonSummary(nightSky: NightSkyTonight): {
  label: string;
  summary: string;
  detail: string;
  className: string;
} {
  const month = parkMonth(nightSky.sunsetIso);
  const moonBright = nightSky.moon.illuminationPercent >= 60;
  const milkyWaySeason = month >= 3 && month <= 10;
  const primeMilkyWay = month >= 6 && month <= 8;
  const zodiacalSeason = month >= 2 && month <= 4;
  const dawnZodiacalSeason = month >= 9 && month <= 11;

  if (primeMilkyWay && !moonBright) {
    return {
      label: "Milky Way window",
      summary: "The season is right and the Moon is dark enough.",
      detail: "Look south after full dark for the bright core.",
      className: "bg-violet-400/15 text-violet-100 ring-1 ring-violet-300/25",
    };
  }

  if (milkyWaySeason) {
    return {
      label: "Milky Way season",
      summary: moonBright
        ? "The season is right, but moonlight will wash out the core tonight."
        : "The core is in season; darker hours are your friend.",
      detail: `${nightSky.moon.illuminationPercent}% moon · best near ${formatClock(nightSky.moon.bestTimeIso)}`,
      className: moonBright
        ? "bg-sky-400/15 text-sky-100 ring-1 ring-sky-300/25"
        : "bg-violet-400/15 text-violet-100 ring-1 ring-violet-300/25",
    };
  }

  if (zodiacalSeason || dawnZodiacalSeason) {
    return {
      label: "Zodiacal light watch",
      summary: zodiacalSeason
        ? "Spring evenings can show the faint cone after dusk."
        : "Fall mornings can show the faint cone before dawn.",
      detail: moonBright
        ? `${nightSky.moon.illuminationPercent}% moon makes it harder`
        : "Needs a very dark, clear horizon",
      className: "bg-indigo-400/15 text-indigo-100 ring-1 ring-indigo-300/25",
    };
  }

  return {
    label: "Deep-sky off season",
    summary: "Planets, the Moon, and satellites are the better show tonight.",
    detail: "Milky Way core is not in a prime evening window.",
    className: "bg-white/10 text-white/70 ring-1 ring-white/15",
  };
}

function hintBadge(hint: VandenbergLaunch["viewingHint"]): {
  label: string;
  className: string;
} {
  switch (hint) {
    case "good":
      return {
        label: "Good chance to see it",
        className: "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-400/30",
      };
    case "maybe":
      return {
        label: "Maybe visible",
        className: "bg-amber-400/20 text-amber-100 ring-1 ring-amber-400/30",
      };
    case "unlikely":
      return {
        label: "Hard to see from here",
        className: "bg-white/10 text-white/70 ring-1 ring-white/20",
      };
    case "unknown":
      return {
        label: "Visibility TBD",
        className: "bg-white/10 text-white/70 ring-1 ring-white/20",
      };
    default: {
      const _exhaustive: never = hint;
      return _exhaustive;
    }
  }
}

function GlassCard({
  children,
  decorations,
}: {
  children: React.ReactNode;
  decorations?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10 backdrop-blur-sm sm:p-5">
      {decorations}
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300/80">
      {children}
    </p>
  );
}

function LaunchPanel({
  launches,
  error,
}: {
  launches: VandenbergLaunch[];
  error?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [next, ...rest] = launches;

  return (
    <GlassCard
      decorations={
        <>
          <Image
            src="/images/spacex.png"
            alt=""
            aria-hidden
            width={385}
            height={1254}
            className="pointer-events-none absolute -bottom-8 left-5 hidden h-[25rem] w-auto object-contain object-bottom opacity-95 drop-shadow-[0_0_26px_rgba(125,211,252,0.3)] sm:block"
          />
          <Image
            src="/images/Astronaught_003.png"
            alt=""
            aria-hidden
            width={200}
            height={200}
            className="pointer-events-none absolute -right-6 -top-6 hidden h-48 w-48 object-contain opacity-95 drop-shadow-[0_0_28px_rgba(125,211,252,0.35)] sm:block"
          />
        </>
      }
    >
      <div className="relative sm:pl-32">
        <Eyebrow>Next rocket launch</Eyebrow>
        {error ? (
          <p className="mt-2 text-sm text-amber-200/90">{error}</p>
        ) : !next ? (
          <p className="mt-2 text-sm text-white/70">
            Nothing on the Vandenberg schedule right now. New launches usually
            appear a few days out.
          </p>
        ) : (
          <p className="mt-1 text-lg font-bold leading-tight text-white sm:pr-32">
            {next.name}
          </p>
        )}

        {next && !error ? (
          <>
            <p className="mt-2 text-xs text-white/55 sm:pr-32">
              {next.provider} · {next.padName}
            </p>
            <div className="mt-3">
              {next.windowStart ? (
                <Countdown
                  target={next.windowStart}
                  nowLabel="Liftoff window open"
                />
              ) : (
                <p className="rounded-lg bg-white/10 px-2.5 py-1 text-sm font-semibold text-white/80 ring-1 ring-white/15">
                  Date to be confirmed
                </p>
              )}
            </div>
            <p className="mt-3 text-sm text-white/80">
              {formatLaunchWindow(next.windowStart, next.windowEnd)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${hintBadge(next.viewingHint).className}`}
              >
                {hintBadge(next.viewingHint).label}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/60">
              {next.viewingNote}
            </p>
            {next.watchUrl ? (
              <a
                href={next.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 sm:w-auto sm:justify-start sm:py-1.5"
              >
                <MdPlayCircle className="h-4 w-4" aria-hidden />
                {next.watchLabel ?? "Watch live"}
              </a>
            ) : null}

            {rest.length > 0 ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setExpanded((o) => !o)}
                  aria-expanded={expanded}
                  className="inline-flex items-center gap-0.5 text-xs font-semibold text-sky-300 hover:text-sky-200"
                >
                  {expanded
                    ? "Hide later launches"
                    : `${rest.length} more launch${rest.length === 1 ? "" : "es"} scheduled`}
                  <MdExpandMore
                    className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {expanded ? (
                  <ul className="mt-2 space-y-2">
                    {rest.map((l) => (
                      <li
                        key={l.id}
                        className="rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10"
                      >
                        <p className="text-sm font-semibold text-white">
                          {l.name}
                        </p>
                        <p className="text-xs text-white/55">
                          {formatLaunchWindow(l.windowStart, l.windowEnd)}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </GlassCard>
  );
}

function IssPanel({
  passes,
  error,
}: {
  passes: IssPass[];
  error?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [next, ...rest] = passes;

  return (
    <GlassCard
      decorations={
        <>
          <Image
            src="/images/iss.png"
            alt=""
            aria-hidden
            width={320}
            height={180}
            className="pointer-events-none absolute -right-28 top-4 hidden h-36 w-96 -rotate-6 object-contain opacity-90 drop-shadow-[0_0_28px_rgba(251,191,36,0.22)] sm:block"
          />
          <Image
            src="/images/Astronaught_001.png"
            alt=""
            aria-hidden
            width={160}
            height={160}
            className="pointer-events-none absolute -bottom-8 -right-5 hidden h-40 w-40 object-contain opacity-95 drop-shadow-[0_0_25px_rgba(165,180,252,0.3)] sm:block"
          />
        </>
      }
    >
      <div className="relative sm:max-w-[66%]">
        <Eyebrow>Next ISS flyover</Eyebrow>
        {error ? (
          <p className="mt-2 text-sm text-amber-200/90">{error}</p>
        ) : !next ? (
          <p className="mt-2 text-sm text-white/70">
            No bright passes in the next few days. The station is only visible
            for a short window after dusk or before dawn.
          </p>
        ) : (
          <p className="mt-1 text-lg font-bold leading-tight text-white">
            {formatIssPassTime(next.riseTime)}
          </p>
        )}

        {next && !error ? (
          <>
            <p className="mt-2 text-xs text-white/55">
              Overhead for {formatIssDuration(next.durationSeconds)} ·{" "}
              {next.maxElevationNote}
            </p>
            <div className="mt-3">
              <Countdown
                target={next.riseTime}
                nowLabel="Look up — overhead now"
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/60">
              The ISS looks like a bright, fast-moving star with no blinking
              lights. Find a spot away from glare and look up at the time above.
            </p>

            {rest.length > 0 ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setExpanded((o) => !o)}
                  aria-expanded={expanded}
                  className="inline-flex items-center gap-0.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                >
                  {expanded
                    ? "Hide later passes"
                    : `${rest.length} more pass${rest.length === 1 ? "" : "es"} this week`}
                  <MdExpandMore
                    className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {expanded ? (
                  <ul className="mt-2 space-y-2">
                    {rest.map((p) => (
                      <li
                        key={p.riseTime}
                        className="rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10"
                      >
                        <p className="text-sm font-semibold text-white">
                          {formatIssPassTime(p.riseTime)}
                        </p>
                        <p className="text-xs text-white/55">
                          {formatIssDuration(p.durationSeconds)} ·{" "}
                          {p.maxElevationNote}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </GlassCard>
  );
}

function PlanetCard({ planet }: { planet: VisiblePlanet }) {
  const color = PLANET_COLOR[planet.name] ?? "#e2e8f0";
  const imageSrc = PLANET_IMAGE_SRC[planet.name];
  // Saturn's rings extend beyond the disc, so it renders larger but uses negative
  // margins to keep the same layout footprint and optical center as the other planets.
  const sizeClass =
    planet.name === "Saturn" ? "h-12 w-12 -my-2 -ml-2" : "h-8 w-8";
  // Altitude as a share of the sky dome (0–90°), floored so low objects still show.
  const altPct = Math.max(6, Math.min(100, (planet.altitudeDeg / 90) * 100));

  return (
    <div
      className="group relative overflow-hidden rounded-xl bg-white/[0.04] p-2.5 ring-1 ring-white/10 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.07] hover:ring-white/25"
      style={{
        backgroundImage: `radial-gradient(110px 70px at 88% -15%, ${color}24, transparent 70%)`,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-7 -top-7 h-16 w-16 rounded-full opacity-30 blur-2xl transition-opacity duration-200 group-hover:opacity-70"
        style={{ backgroundColor: color }}
      />

      <div className="relative flex items-start gap-2.5">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            aria-hidden
            width={48}
            height={48}
            className={`${sizeClass} shrink-0 object-contain transition-transform duration-200 group-hover:scale-110`}
            style={{ filter: `drop-shadow(0 0 9px ${color}aa)` }}
          />
        ) : (
          <span
            aria-hidden
            className="mt-1 h-4 w-4 shrink-0 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight text-white">
            {planet.name}
          </p>
          <span
            className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
              planet.visibleNakedEye
                ? "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-400/30"
                : "bg-white/10 text-white/70 ring-1 ring-white/20"
            }`}
          >
            {planet.visibleNakedEye ? "Naked eye" : "Binoculars"}
          </span>
        </div>
      </div>

      <dl className="relative mt-2 grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Look
          </dt>
          <dd className="font-semibold text-white">
            {planet.compass}{" "}
            <span className="font-normal text-white/50">{planet.direction}</span>
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Height up
          </dt>
          <dd className="font-semibold tabular-nums text-white">
            {planet.altitudeDeg}° high
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Best time
          </dt>
          <dd className="font-semibold text-white">
            {formatClock(planet.bestTimeIso)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Brightness
          </dt>
          <dd className="font-semibold tabular-nums text-white">
            mag {planet.magnitude.toFixed(1)}
          </dd>
        </div>
        {formatRiseSet(planet.riseIso, planet.setIso) ? (
          <div className="col-span-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
              Up tonight
            </dt>
            <dd className="font-semibold text-white">
              {formatRiseSet(planet.riseIso, planet.setIso)}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="relative mt-2">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full"
            style={{
              width: `${altPct}%`,
              background: `linear-gradient(90deg, ${color}66, ${color})`,
            }}
          />
        </div>
        <p className="mt-0.5 text-[9px] text-white/40">
          {formatDistanceKm(planet.distanceKm)}
          {planet.ringTiltDeg != null
            ? ` · Rings tilted ${planet.ringTiltDeg}°`
            : ""}
        </p>
      </div>
    </div>
  );
}

function MoonCard({ moon }: { moon: NightSkyTonight["moon"] }) {
  const color = "#e2e8f0";
  const altPct = Math.max(6, Math.min(100, (moon.altitudeDeg / 90) * 100));

  return (
    <div
      className="group relative col-span-full overflow-hidden rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/15 transition duration-200 hover:bg-white/[0.08]"
      style={{
        backgroundImage: `radial-gradient(160px 100px at 12% -20%, ${color}20, transparent 70%)`,
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex shrink-0 items-center gap-3 sm:w-36 sm:flex-col sm:text-center">
          <MoonPhaseIcon phase={moon.phase} size={44} className="h-11 w-11" />
          <div>
            <p className="text-sm font-bold leading-tight text-white">The Moon</p>
            <p className="text-[11px] text-white/55">
              {moon.phaseLabel} · {moon.illuminationPercent}% lit
            </p>
          </div>
        </div>

        <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-2 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
              Look
            </dt>
            <dd className="font-semibold text-white">
              {moon.compass}{" "}
              <span className="font-normal text-white/50">{moon.direction}</span>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
              Height up
            </dt>
            <dd className="font-semibold tabular-nums text-white">
              {moon.altitudeDeg}° high
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
              Best time
            </dt>
            <dd className="font-semibold text-white">
              {formatClock(moon.bestTimeIso)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
              Moon age
            </dt>
            <dd className="font-semibold tabular-nums text-white">
              {moon.moonAgeDays} days
            </dd>
          </div>
          {moon.riseIso ? (
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
                Rises
              </dt>
              <dd className="font-semibold text-white">
                {formatClock(moon.riseIso)}
              </dd>
            </div>
          ) : null}
          {moon.setIso ? (
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
                Sets
              </dt>
              <dd className="font-semibold text-white">
                {formatClock(moon.setIso)}
              </dd>
            </div>
          ) : null}
          <div className={moon.riseIso && moon.setIso ? "" : "col-span-2"}>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
              Distance
            </dt>
            <dd className="font-semibold text-white">
              {formatDistanceKm(moon.distanceKm)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{
            width: `${altPct}%`,
            background: `linear-gradient(90deg, ${color}66, ${color})`,
          }}
        />
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-white/40">
        Orbit · 27.3 days around Earth · Rotation · tidally locked (one face
        toward us) · Surface temps · about 260°F in sunlight, -280°F in shadow
      </p>
    </div>
  );
}

function SkyConditionsCard({
  current,
  airQuality,
  nightSky,
}: {
  current: ParkWeatherCurrent;
  airQuality: ParkWeatherAirQuality;
  nightSky: NightSkyTonight;
}) {
  const visibility =
    current.weatherCode === 0 || current.weatherCode === 1
      ? "Clear view"
      : current.weatherCode === 2
        ? "Some clouds"
        : "Limited view";
  const darkStart = nightSky.darkAfterIso
    ? formatClock(nightSky.darkAfterIso)
    : formatClock(nightSky.sunsetIso);
  const darkWindow = formatDurationBetween(
    nightSky.darkAfterIso ?? nightSky.sunsetIso,
    nightSky.sunriseIso,
  );
  const status = skyViewingStatus(current);

  return (
    <div className="relative overflow-hidden rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10 sm:col-span-2">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-emerald-300/20 blur-2xl"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Image
            src="/images/Earth.png"
            alt=""
            aria-hidden
            width={48}
            height={48}
            className="h-10 w-10 shrink-0 object-contain drop-shadow-[0_0_10px_rgba(110,231,183,0.5)]"
          />
          <div>
            <p className="text-sm font-bold leading-tight text-white">
              Sky conditions at Jojoba
            </p>
            <p className="mt-0.5 text-[11px] text-white/50">
              {visibility} · dark after {darkStart}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <dl className="relative mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Sky
          </dt>
          <dd className="font-semibold text-white">{current.weatherLabel}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Air
          </dt>
          <dd className="font-semibold text-white">
            {airQuality?.usAqi != null ? `AQI ${airQuality.usAqi}` : "No AQI"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Wind
          </dt>
          <dd className="font-semibold text-white">
            {current.windMph} mph {current.windDirection}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Sunset
          </dt>
          <dd className="font-semibold text-white">
            {formatClock(nightSky.sunsetIso)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Humidity
          </dt>
          <dd className="font-semibold text-white">{current.humidityPercent}%</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            PM2.5
          </dt>
          <dd className="font-semibold text-white">
            {airQuality?.pm25 != null ? airQuality.pm25.toFixed(1) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Dark window
          </dt>
          <dd className="font-semibold text-white">{darkWindow}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Feels like
          </dt>
          <dd className="font-semibold text-white">
            {current.apparentTemperatureF}°F
          </dd>
        </div>
      </dl>

      <p className="relative mt-3 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-white/55">
        Best viewing starts after {darkStart}. Local haze, cloud cover, and wind
        affect how much you can see from the park.
      </p>
    </div>
  );
}

function TonightViewingCard({
  current,
  airQuality,
  nightSky,
}: {
  current: ParkWeatherCurrent;
  airQuality: ParkWeatherAirQuality;
  nightSky: NightSkyTonight;
}) {
  const verdict = tonightViewingVerdict({ current, airQuality, nightSky });

  return (
    <div className="mt-4 overflow-hidden rounded-xl bg-gradient-to-br from-sky-400/10 via-white/[0.06] to-indigo-400/10 p-3 ring-1 ring-white/10 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-white">Tonight at Jojoba</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${verdict.className}`}
            >
              {verdict.label}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-white/65">
            {verdict.summary}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs sm:min-w-64">
          <div className="rounded-lg bg-white/[0.05] px-2.5 py-2 ring-1 ring-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
              Best window
            </p>
            <p className="mt-0.5 font-semibold text-white">
              {verdict.bestWindow}
            </p>
          </div>
          <div className="rounded-lg bg-white/[0.05] px-2.5 py-2 ring-1 ring-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
              Look for
            </p>
            <p className="mt-0.5 font-semibold text-white">{verdict.target}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
        {verdict.reasons.map((reason) => (
          <div
            key={reason}
            className="rounded-lg bg-black/10 px-2.5 py-2 text-white/65 ring-1 ring-white/10"
          >
            {reason}
          </div>
        ))}
      </div>
    </div>
  );
}

function DarkSkyTimeline({ nightSky }: { nightSky: NightSkyTonight }) {
  const startIso = nightSky.sunsetIso;
  const endIso = nightSky.sunriseIso;
  const moonEvent =
    nightSky.moon.setIso &&
    new Date(nightSky.moon.setIso).getTime() >
      new Date(nightSky.sunsetIso).getTime()
      ? {
          label: "Moonset",
          time: nightSky.moon.setIso,
          color: "bg-slate-200",
        }
      : nightSky.moon.riseIso
        ? {
            label: "Moonrise",
            time: nightSky.moon.riseIso,
            color: "bg-slate-200",
          }
        : null;
  const events = [
    {
      label: "Sunset",
      time: nightSky.sunsetIso,
      color: "bg-amber-300",
    },
    nightSky.darkAfterIso
      ? {
          label: "Full dark",
          time: nightSky.darkAfterIso,
          color: "bg-sky-300",
        }
      : null,
    moonEvent,
    {
      label: "Sunrise",
      time: nightSky.sunriseIso,
      color: "bg-orange-200",
    },
  ].filter((event): event is { label: string; time: string; color: string } =>
    Boolean(event),
  );

  return (
    <div className="mt-3 overflow-hidden rounded-xl bg-slate-950/25 p-3 ring-1 ring-white/10 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300/80">
          Dark-sky timeline
        </p>
        <span className="text-[11px] font-semibold text-white/50">
          {formatDurationBetween(nightSky.darkAfterIso ?? startIso, endIso)} of
          usable darkness
        </span>
      </div>

      <div className="relative mt-5 h-6">
        <div className="absolute left-0 right-0 top-4 h-2 overflow-hidden rounded-full bg-gradient-to-r from-amber-200/50 via-slate-950 to-orange-200/50 ring-1 ring-white/10">
          {nightSky.darkAfterIso ? (
            <div
              className="absolute bottom-0 top-0 rounded-r-full bg-sky-400/20"
              style={{
                left: `${timelinePercent(nightSky.darkAfterIso, startIso, endIso)}%`,
                right: 0,
              }}
            />
          ) : null}
        </div>

        {events.map((event, index) => {
          const alignClass =
            index === 0
              ? "translate-x-0"
              : index === events.length - 1
                ? "-translate-x-full"
                : "-translate-x-1/2";

          return (
            <div
              key={`${event.label}-${event.time}`}
              className={`absolute top-0 ${alignClass}`}
              style={{
                left: `${timelinePercent(event.time, startIso, endIso)}%`,
              }}
            >
              <div
                className={`h-3 w-3 rounded-full ${event.color} shadow-[0_0_16px_rgba(255,255,255,0.25)] ring-2 ring-slate-950 ${
                  index === 0
                    ? ""
                    : index === events.length - 1
                      ? "ml-auto"
                      : "mx-auto"
                }`}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {events.map((event) => (
          <div
            key={`${event.label}-${event.time}-label`}
            className="flex items-center gap-2 rounded-lg bg-white/[0.045] px-2.5 py-2 ring-1 ring-white/10"
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${event.color}`} />
            <span className="min-w-0">
              <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-white/45">
                {event.label}
              </span>
              <span className="block text-xs font-semibold text-white">
                {formatClock(event.time)}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DesertNightGuide({
  current,
  airQuality,
  nightSky,
  hourly,
}: {
  current: ParkWeatherCurrent;
  airQuality: ParkWeatherAirQuality;
  nightSky: NightSkyTonight;
  hourly: ParkWeatherHourly[];
}) {
  const cards = [
    {
      title: "Evening comfort",
      ...eveningComfortSummary({ current, nightSky, hourly }),
    },
    {
      title: "Wind & haze",
      ...windHazeSummary({ current, airQuality, hourly }),
    },
    {
      title: "Deep sky season",
      ...deepSkySeasonSummary(nightSky),
    },
  ];

  return (
    <div className="mt-3 grid gap-2.5 md:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-xl bg-white/[0.045] p-3 ring-1 ring-white/10"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
              {card.title}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${card.className}`}
            >
              {card.label}
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-white">
            {card.summary}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/50">
            {card.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

function LunarStrip({ days }: { days: ParkWeatherDaily[] }) {
  if (days.length === 0) return null;
  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
        Lunar cycle this week
      </p>
      <div className="-mx-1 flex justify-between gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        {days.map((day) => (
          <div
            key={day.date}
            className="flex min-w-[3.25rem] shrink-0 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-center"
            title={moonPhaseLabel(day.moonPhase, day.moonIlluminationPercent)}
          >
            <MoonPhaseIcon phase={day.moonPhase} size={28} />
            <span className="text-[10px] font-medium text-white/70">
              {formatParkDate(day.date, { weekday: "short" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function skyDomePosition(azimuthDeg: number, altitudeDeg: number) {
  const azimuthRad = (azimuthDeg * Math.PI) / 180;
  const altitude = Math.max(0, Math.min(90, altitudeDeg));
  const radius = ((90 - altitude) / 90) * 43;

  return {
    left: 50 + Math.sin(azimuthRad) * radius,
    top: 50 - Math.cos(azimuthRad) * radius,
  };
}

function planetMarkerSize(magnitude: number): number {
  return Math.max(7, Math.min(16, 12 - magnitude * 1.25));
}

function SkyDomeCard({ nightSky }: { nightSky: NightSkyTonight }) {
  const moonPos = skyDomePosition(
    nightSky.moon.azimuthDeg,
    nightSky.moon.altitudeDeg,
  );
  const planets = nightSky.planets
    .filter((planet) => planet.altitudeDeg > 0)
    .sort((a, b) => b.altitudeDeg - a.altitudeDeg);

  return (
    <div className="relative col-span-full overflow-hidden rounded-xl bg-slate-950/45 p-4 ring-1 ring-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-sky-300/10 blur-3xl"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold leading-tight text-white">
            Jojoba&apos;s Sky Dome Tonight
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
            Center is overhead. Outer ring is the horizon. Use the compass
            labels to face the right direction from the park.
          </p>
        </div>
        <span className="rounded-full bg-sky-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-100 ring-1 ring-sky-200/15">
          Best around {formatClock(nightSky.moon.bestTimeIso)}
        </span>
      </div>

      <div className="relative mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-center">
        <div className="relative mx-auto aspect-square w-full max-w-[28rem]">
          <Image
            src="/assets/mascot/telescope.png"
            alt=""
            aria-hidden
            width={220}
            height={220}
            className="pointer-events-none absolute -bottom-3 -left-6 z-30 hidden h-28 w-28 object-contain object-bottom drop-shadow-[0_0_22px_rgba(125,211,252,0.35)] lg:block xl:h-32 xl:w-32"
          />
          <svg
            viewBox="0 0 100 100"
            role="img"
            aria-label="Sky dome showing visible planet and moon positions"
            className="h-full w-full overflow-visible"
          >
            <defs>
              <radialGradient id="sky-dome-fill" cx="50%" cy="44%" r="58%">
                <stop offset="0%" stopColor="rgba(56, 189, 248, 0.18)" />
                <stop offset="58%" stopColor="rgba(99, 102, 241, 0.1)" />
                <stop offset="100%" stopColor="rgba(15, 23, 42, 0.72)" />
              </radialGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="url(#sky-dome-fill)"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="0.7"
            />
            <circle
              cx="50"
              cy="50"
              r="29"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeDasharray="1.5 2.4"
              strokeWidth="0.45"
            />
            <circle
              cx="50"
              cy="50"
              r="14"
              fill="none"
              stroke="rgba(255,255,255,0.09)"
              strokeDasharray="1.2 2"
              strokeWidth="0.4"
            />
            <path
              d="M50 6 V94 M6 50 H94"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.45"
            />
            {["N", "E", "S", "W"].map((label) => {
              const coords =
                label === "N"
                  ? { x: 50, y: 2.7 }
                  : label === "E"
                    ? { x: 97, y: 52 }
                    : label === "S"
                      ? { x: 50, y: 99 }
                      : { x: 3, y: 52 };

              return (
                <text
                  key={label}
                  x={coords.x}
                  y={coords.y}
                  textAnchor="middle"
                  className="fill-white/45 text-[4px] font-bold"
                >
                  {label}
                </text>
              );
            })}
            <text
              x="50"
              y="51.3"
              textAnchor="middle"
              className="fill-white/35 text-[3.5px] font-semibold"
            >
              overhead
            </text>
          </svg>

          <div
            className="pointer-events-none absolute z-20"
            suppressHydrationWarning
            style={{
              left: `${moonPos.left}%`,
              top: `${moonPos.top}%`,
              transform: "translate(-50%, -50%)",
            }}
            title={`Moon · ${nightSky.moon.compass} ${nightSky.moon.direction} · ${nightSky.moon.altitudeDeg}° high`}
          >
            <div className="absolute inset-0 scale-150 rounded-full bg-sky-100/20 blur-xl" />
            <MoonPhaseIcon
              phase={nightSky.moon.phase}
              size={36}
              className="relative h-8 w-8 drop-shadow-[0_0_18px_rgba(226,232,240,0.55)] sm:h-9 sm:w-9"
            />
          </div>

          {planets.map((planet) => {
            const pos = skyDomePosition(planet.azimuthDeg, planet.altitudeDeg);
            const color = PLANET_COLOR[planet.name] ?? "#bae6fd";
            const size = planetMarkerSize(planet.magnitude);

            return (
              <div
                key={planet.name}
                className="pointer-events-none absolute z-10 flex items-center gap-1.5"
                suppressHydrationWarning
                style={{
                  left: `${pos.left}%`,
                  top: `${pos.top}%`,
                  transform: "translate(-50%, -50%)",
                }}
                title={`${planet.name} · ${planet.compass} ${planet.direction} · ${planet.altitudeDeg}° high`}
              >
                <span
                  className="rounded-full ring-1 ring-white/40"
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: color,
                    boxShadow: `0 0 ${size + 8}px ${color}99`,
                  }}
                />
                <span className="hidden rounded-full bg-slate-950/55 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white/80 ring-1 ring-white/10 backdrop-blur-sm sm:block">
                  {planet.name}
                </span>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl bg-white/[0.045] p-3 ring-1 ring-white/10">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300/80">
            Visible tonight
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-white">
                <MoonPhaseIcon
                  phase={nightSky.moon.phase}
                  size={18}
                  className="h-4.5 w-4.5"
                />
                <span className="truncate">Moon</span>
              </span>
              <span className="shrink-0 text-white/55">
                {nightSky.moon.compass} · {nightSky.moon.altitudeDeg}°
              </span>
            </div>
            {planets.map((planet) => {
              const color = PLANET_COLOR[planet.name] ?? "#bae6fd";

              return (
                <div
                  key={planet.name}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="flex min-w-0 items-center gap-2 text-white">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}99`,
                      }}
                    />
                    <span className="truncate">{planet.name}</span>
                    {!planet.visibleNakedEye ? (
                      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white/45">
                        bins
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-white/55">
                    {planet.compass} · {planet.altitudeDeg}°
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanetsPanel({
  current,
  airQuality,
  nightSky,
  lunarWeek,
  hourly,
}: {
  current: ParkWeatherCurrent;
  airQuality: ParkWeatherAirQuality;
  nightSky: NightSkyTonight;
  lunarWeek: ParkWeatherDaily[];
  hourly: ParkWeatherHourly[];
}) {
  return (
    <div className="relative mt-5 overflow-hidden rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>Planets &amp; the moon tonight</Eyebrow>
      </div>
      <p className="mt-1 text-xs text-white/55">
        What&apos;s up over the park after dark on {nightSky.dateLabel}. Look
        toward the listed direction at the time shown.
      </p>

      <TonightViewingCard
        current={current}
        airQuality={airQuality}
        nightSky={nightSky}
      />
      <DarkSkyTimeline nightSky={nightSky} />
      <DesertNightGuide
        current={current}
        airQuality={airQuality}
        nightSky={nightSky}
        hourly={hourly}
      />

      <LunarStrip days={lunarWeek} />

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
        <MoonCard moon={nightSky.moon} />
        <SkyConditionsCard
          current={current}
          airQuality={airQuality}
          nightSky={nightSky}
        />
        {nightSky.planets.length > 0 ? (
          nightSky.planets.map((planet) => (
            <PlanetCard key={planet.name} planet={planet} />
          ))
        ) : (
          <p className="col-span-full text-sm text-white/70">
            No bright planets are above the horizon tonight — but the moon and
            stars are still worth a look.
          </p>
        )}
      </div>

      <div className="mt-4">
        <SkyDomeCard nightSky={nightSky} />
      </div>
    </div>
  );
}

function formatApodDate(date: string | null): string | null {
  if (!date) return null;
  return formatParkDate(date, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function ApodPanel({ apod, error }: { apod: NasaApod | null; error?: string }) {
  const [expanded, setExpanded] = useState(false);

  if (!apod) {
    return (
      <div className="relative mt-5 overflow-hidden rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur-sm">
        <Eyebrow>NASA picture of the day</Eyebrow>
        <p className="mt-2 text-sm text-amber-200/90">
          {error ?? "NASA's image of the day isn't available right now."}
        </p>
      </div>
    );
  }

  const dateLabel = formatApodDate(apod.date);

  return (
    <figure className="relative mt-5 overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/10 backdrop-blur-sm">
      <div className="grid gap-0 md:grid-cols-[1.4fr_1fr]">
        <div className="relative min-h-[14rem] bg-black/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={apod.imageUrl}
            alt={apod.title}
            loading="lazy"
            className="h-full max-h-[26rem] w-full object-cover"
          />
          {apod.mediaType === "video" ? (
            <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ring-1 ring-white/20">
              Video
            </span>
          ) : null}
        </div>
        <figcaption className="flex flex-col p-5">
          <Eyebrow>NASA picture of the day</Eyebrow>
          <p className="mt-2 text-lg font-bold leading-tight text-white">
            {apod.title}
          </p>
          <p className="mt-1 text-xs text-white/55">
            {dateLabel ? `${dateLabel} · ` : ""}Astronomy Picture of the Day
            {apod.copyright ? ` · © ${apod.copyright}` : ""}
          </p>
          {apod.explanation ? (
            <>
              <p
                className={`mt-3 text-sm leading-relaxed text-white/70 ${expanded ? "" : "line-clamp-4"}`}
              >
                {apod.explanation}
              </p>
              <button
                type="button"
                onClick={() => setExpanded((o) => !o)}
                aria-expanded={expanded}
                className="mt-1 self-start text-xs font-semibold text-sky-300 hover:text-sky-200"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            </>
          ) : null}
          {apod.sourceUrl ? (
            <a
              href={apod.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 self-start text-xs font-semibold text-sky-300 hover:text-sky-200"
            >
              {apod.mediaType === "video"
                ? "Watch on source →"
                : "View full resolution →"}
            </a>
          ) : null}
        </figcaption>
      </div>
    </figure>
  );
}

export default function SkySpaceSection({
  current,
  airQuality,
  hourly,
  launches,
  issPasses,
  nightSky,
  lunarWeek,
  apod,
  launchesError,
  issError,
  apodError,
}: {
  current: ParkWeatherCurrent;
  airQuality: ParkWeatherAirQuality;
  hourly: ParkWeatherHourly[];
  launches: VandenbergLaunch[];
  issPasses: IssPass[];
  nightSky: NightSkyTonight | null;
  lunarWeek: ParkWeatherDaily[];
  apod: NasaApod | null;
  launchesError?: string;
  issError?: string;
  apodError?: string;
}) {
  return (
    <section className="motion-card relative overflow-hidden rounded-2xl border border-line shadow-sm">
      {/* Night-sky backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900" />
      {/* Base starfield spread across the whole panel */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 12% 18%, rgba(255,255,255,0.9), transparent), radial-gradient(1.5px 1.5px at 78% 12%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 35% 45%, rgba(255,255,255,0.6), transparent), radial-gradient(1.5px 1.5px at 62% 68%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 88% 52%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 22% 78%, rgba(255,255,255,0.5), transparent), radial-gradient(1.5px 1.5px at 50% 28%, rgba(255,255,255,0.6), transparent)",
        }}
      />
      {/* Dense star band concentrated at the top, fading downward */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-2/3 opacity-95"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 5% 8%, rgba(255,255,255,0.95), transparent), radial-gradient(1px 1px at 11% 25%, rgba(255,255,255,0.72), transparent), radial-gradient(1px 1px at 17% 22%, rgba(255,255,255,0.8), transparent), radial-gradient(2px 2px at 27% 6%, rgba(255,255,255,0.95), transparent), radial-gradient(1px 1px at 29% 20%, rgba(255,255,255,0.75), transparent), radial-gradient(1px 1px at 33% 30%, rgba(255,255,255,0.7), transparent), radial-gradient(1.5px 1.5px at 39% 5%, rgba(255,255,255,0.78), transparent), radial-gradient(1.5px 1.5px at 44% 14%, rgba(255,255,255,0.9), transparent), radial-gradient(1px 1px at 49% 24%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 55% 4%, rgba(255,255,255,0.85), transparent), radial-gradient(1px 1px at 58% 36%, rgba(255,255,255,0.65), transparent), radial-gradient(1.5px 1.5px at 67% 20%, rgba(255,255,255,0.9), transparent), radial-gradient(1px 1px at 72% 9%, rgba(255,255,255,0.75), transparent), radial-gradient(1px 1px at 75% 31%, rgba(255,255,255,0.72), transparent), radial-gradient(2px 2px at 83% 26%, rgba(255,255,255,0.95), transparent), radial-gradient(1px 1px at 87% 5%, rgba(255,255,255,0.68), transparent), radial-gradient(1px 1px at 90% 14%, rgba(255,255,255,0.8), transparent), radial-gradient(1px 1px at 96% 32%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 8% 38%, rgba(255,255,255,0.6), transparent), radial-gradient(1.5px 1.5px at 21% 46%, rgba(255,255,255,0.62), transparent), radial-gradient(1px 1px at 36% 52%, rgba(255,255,255,0.58), transparent), radial-gradient(1.5px 1.5px at 48% 44%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 64% 48%, rgba(255,255,255,0.58), transparent), radial-gradient(1px 1px at 78% 42%, rgba(255,255,255,0.65), transparent), radial-gradient(1px 1px at 92% 50%, rgba(255,255,255,0.56), transparent), radial-gradient(1px 1px at 3% 16%, rgba(255,255,255,0.7), transparent), radial-gradient(2px 2px at 14% 11%, rgba(255,255,255,0.9), transparent), radial-gradient(1px 1px at 23% 33%, rgba(255,255,255,0.64), transparent), radial-gradient(1px 1px at 41% 28%, rgba(255,255,255,0.6), transparent), radial-gradient(1.5px 1.5px at 52% 16%, rgba(255,255,255,0.82), transparent), radial-gradient(1px 1px at 61% 11%, rgba(255,255,255,0.7), transparent), radial-gradient(2px 2px at 70% 34%, rgba(255,255,255,0.85), transparent), radial-gradient(1px 1px at 80% 13%, rgba(255,255,255,0.72), transparent), radial-gradient(1px 1px at 85% 38%, rgba(255,255,255,0.6), transparent), radial-gradient(1.5px 1.5px at 94% 22%, rgba(255,255,255,0.8), transparent), radial-gradient(1px 1px at 99% 9%, rgba(255,255,255,0.66), transparent)",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 45%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 45%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl"
      />

      {/* Decorative moon — reflects tonight's real phase */}
      {nightSky ? (
        <div
          aria-hidden
          className="pointer-events-none absolute right-6 top-4 hidden sm:right-12 sm:top-8 sm:block"
        >
          <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-sky-200/20 blur-2xl" />
          <MoonPhaseIcon
            phase={nightSky.moon.phase}
            size={120}
            className="h-20 w-20 opacity-90 drop-shadow-[0_0_28px_rgba(191,219,254,0.45)] sm:h-28 sm:w-28"
          />
        </div>
      ) : null}

      <div className="relative p-5 text-white sm:p-7">
        <div>
          <div className="flex items-end gap-4 sm:gap-5">
            <Image
              src="/images/Astronaught_002.png"
              alt="Quail astronaut mascot"
              width={180}
              height={180}
              className="h-28 w-28 shrink-0 object-contain drop-shadow-[0_0_22px_rgba(125,211,252,0.35)] sm:h-40 sm:w-40"
            />
            <h2 className="pb-2 text-2xl font-bold leading-tight tracking-tight sm:pb-4 sm:text-3xl">
              Look up — sky &amp; space
            </h2>
          </div>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/75">
            From the park you can sometimes catch rockets climbing out of
            Vandenberg (about 100 miles west) and the International Space
            Station gliding silently overhead. Here&apos;s what&apos;s next and
            when to look.
          </p>
        </div>

        {nightSky ? (
          <PlanetsPanel
            current={current}
            airQuality={airQuality}
            nightSky={nightSky}
            lunarWeek={lunarWeek}
            hourly={hourly}
          />
        ) : null}

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <LaunchPanel launches={launches} error={launchesError} />
          <IssPanel passes={issPasses} error={issError} />
        </div>

        <ApodPanel apod={apod} error={apodError} />
      </div>
    </section>
  );
}
