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
import { formatLaunchWindow } from "@/lib/sky/launches";
import { formatIssDuration, formatIssPassTime } from "@/lib/sky/iss-passes";
import type {
  IssPass,
  NasaApod,
  NightSkyTonight,
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
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
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

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur-sm">
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
    <GlassCard>
      <Image
        src="/images/spacex.png"
        alt=""
        aria-hidden
        width={385}
        height={1254}
        className="pointer-events-none absolute -bottom-8 left-3 h-80 w-auto object-contain object-bottom opacity-95 drop-shadow-[0_0_26px_rgba(125,211,252,0.3)] sm:left-5 sm:h-[25rem]"
      />
      <Image
        src="/images/Astronaught_003.png"
        alt=""
        aria-hidden
        width={200}
        height={200}
        className="pointer-events-none absolute -right-3 -top-3 h-40 w-40 object-contain opacity-95 drop-shadow-[0_0_28px_rgba(125,211,252,0.35)] sm:-right-4 sm:h-48 sm:w-48"
      />
      <div className="relative ml-auto max-w-[68%]">
        <Eyebrow>Next rocket launch</Eyebrow>
        {error ? (
          <p className="mt-2 text-sm text-amber-200/90">{error}</p>
        ) : !next ? (
          <p className="mt-2 text-sm text-white/70">
            Nothing on the Vandenberg schedule right now. New launches usually
            appear a few days out.
          </p>
        ) : (
          <p className="mt-1 text-lg font-bold leading-tight text-white">
            {next.name}
          </p>
        )}
      </div>

      {next && !error ? (
        <div className="relative ml-auto mt-4 max-w-[68%]">
          <p className="text-xs text-white/55">
            {next.provider} · {next.padName}
          </p>
          <div className="mt-3">
            {next.windowStart ? (
              <Countdown target={next.windowStart} nowLabel="Liftoff window open" />
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
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400"
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
                      <p className="text-sm font-semibold text-white">{l.name}</p>
                      <p className="text-xs text-white/55">
                        {formatLaunchWindow(l.windowStart, l.windowEnd)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
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
    <GlassCard>
      <Image
        src="/images/iss.png"
        alt=""
        aria-hidden
        width={320}
        height={180}
        className="pointer-events-none absolute -right-24 top-5 h-28 w-72 -rotate-6 object-contain opacity-90 drop-shadow-[0_0_28px_rgba(251,191,36,0.22)] sm:-right-28 sm:top-4 sm:h-36 sm:w-96"
      />
      <Image
        src="/images/Astronaught_001.png"
        alt=""
        aria-hidden
        width={160}
        height={160}
        className="pointer-events-none absolute -bottom-8 -right-5 h-32 w-32 object-contain opacity-95 drop-shadow-[0_0_25px_rgba(165,180,252,0.3)] sm:h-40 sm:w-40"
      />
      <div className="relative max-w-[66%]">
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
      </div>

      {next && !error ? (
        <div className="relative mt-4">
          <p className="text-xs text-white/55">
            Overhead for {formatIssDuration(next.durationSeconds)} ·{" "}
            {next.maxElevationNote}
          </p>
          <div className="mt-3">
            <Countdown target={next.riseTime} nowLabel="Look up — overhead now" />
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
                        {formatIssDuration(p.durationSeconds)} · {p.maxElevationNote}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </GlassCard>
  );
}

function PlanetCard({ planet }: { planet: VisiblePlanet }) {
  const color = PLANET_COLOR[planet.name] ?? "#e2e8f0";
  const imageSrc = PLANET_IMAGE_SRC[planet.name];
  // Saturn's rings extend beyond the disc, so it needs a wider box to read well.
  const sizeClass = planet.name === "Saturn" ? "h-10 w-10" : "h-8 w-8";
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
            title={moonPhaseLabel(day.moonPhase)}
          >
            <MoonPhaseIcon phase={day.moonPhase} size={28} />
            <span className="text-[10px] font-medium text-white/70">
              {new Date(`${day.date}T12:00:00`).toLocaleDateString("en-US", {
                weekday: "short",
                timeZone: "America/Los_Angeles",
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanetsPanel({
  current,
  airQuality,
  nightSky,
  lunarWeek,
}: {
  current: ParkWeatherCurrent;
  airQuality: ParkWeatherAirQuality;
  nightSky: NightSkyTonight;
  lunarWeek: ParkWeatherDaily[];
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

      <LunarStrip days={lunarWeek} />

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
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

      <p className="mt-4 flex items-start gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs leading-relaxed text-white/70 ring-1 ring-white/10">
        <span aria-hidden className="mt-0.5">
          ✨
        </span>
        <span>{nightSky.bestViewingNote}</span>
      </p>
    </div>
  );
}

function formatApodDate(date: string | null): string | null {
  if (!date) return null;
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
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

      <div className="relative p-5 text-white sm:p-7">
        <div className="flex items-start gap-4">
          <Image
            src="/images/Astronaught_002.png"
            alt="Quail astronaut mascot"
            width={120}
            height={120}
            className="hidden h-24 w-24 shrink-0 object-contain drop-shadow-[0_0_22px_rgba(125,211,252,0.35)] sm:block"
          />
          <div className="max-w-xl">
            <h2 className="text-xl font-bold tracking-tight">Look up — sky &amp; space</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-white/70">
              From the park you can sometimes catch rockets climbing out of
              Vandenberg (about 100 miles west) and the International Space
              Station gliding silently overhead. Here&apos;s what&apos;s next and
              when to look.
            </p>
          </div>
        </div>

        {nightSky ? (
          <PlanetsPanel
            current={current}
            airQuality={airQuality}
            nightSky={nightSky}
            lunarWeek={lunarWeek}
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
