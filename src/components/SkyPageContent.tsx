import type { ReactNode } from "react";
import WeatherMascotStack from "@/components/WeatherMascotStack";
import { formatSkyTime } from "@/lib/sky/astronomy";
import {
  formatIssDuration,
  formatIssPassTime,
} from "@/lib/sky/iss-passes";
import { formatLaunchWindow } from "@/lib/sky/launches";
import type { SkyPageData, VandenbergLaunch } from "@/lib/sky/types";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="motion-card rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function formatDay(dateIso: string): string {
  const date = new Date(`${dateIso}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

function formatUpdated(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
}

function launchHintClass(hint: VandenbergLaunch["viewingHint"]): string {
  switch (hint) {
    case "good":
      return "bg-green-100 text-green-900 dark:bg-green-950/50 dark:text-green-100";
    case "maybe":
      return "bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100";
    case "unlikely":
      return "bg-surface text-muted ring-1 ring-line";
    case "unknown":
      return "bg-surface text-muted ring-1 ring-line";
    default: {
      const _exhaustive: never = hint;
      return _exhaustive;
    }
  }
}

function FeedError({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
      {message}
    </p>
  );
}

export default function SkyPageContent({ data }: { data: SkyPageData }) {
  const { current, astronomy, errors } = data;

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-start gap-3 sm:gap-4">
        <WeatherMascotStack
          temperatureF={current.temperatureF}
          weatherLabel={current.weatherLabel}
          weatherCode={current.weatherCode}
          rotationSeed={data.fetchedAt}
          width={88}
          className="shrink-0 sm:hidden"
        />
        <WeatherMascotStack
          temperatureF={current.temperatureF}
          weatherLabel={current.weatherLabel}
          weatherCode={current.weatherCode}
          rotationSeed={data.fetchedAt}
          width={112}
          className="hidden shrink-0 sm:block"
        />
        <div className="min-w-0 pt-1">
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Jojoba Weather &amp; sky
          </h1>
          <p className="mt-1 text-sm text-muted">
            Conditions at the park, plus launches, alerts, and what to look for
            in the sky.
          </p>
        </div>
      </div>

      <Section title="Right now">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-line bg-gradient-to-br from-sky-50 to-surface p-4 dark:from-sky-950/30 dark:to-surface">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              {data.locationLabel}
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-ink">
              {current.temperatureF}°F
            </p>
            <p className="mt-1 text-sm text-ink">
              {current.weatherLabel}
              <span className="text-muted">
                {" "}
                · Feels like {current.apparentTemperatureF}°F
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Wind & humidity
            </p>
            <p className="mt-2 text-sm text-ink">
              {current.windMph} mph {current.windDirection}
            </p>
            <p className="text-sm text-muted">
              Humidity {current.humidityPercent}%
            </p>
          </div>
          {data.airQuality ? (
            <div className="rounded-xl border border-line bg-surface/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Air quality
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                AQI {data.airQuality.usAqi} · {data.airQuality.label}
              </p>
              {data.airQuality.pm25 != null && (
                <p className="text-sm text-muted">
                  PM2.5 {data.airQuality.pm25.toFixed(1)} µg/m³
                </p>
              )}
            </div>
          ) : null}
        </div>
        <p className="mt-3 text-xs text-muted">
          Updated {formatUpdated(data.fetchedAt)} · refreshes about every 15
          minutes
        </p>
      </Section>

      {astronomy ? (
        <Section
          title="Today & tonight"
          description="Sun, moon, and UV for planning outdoor work or stargazing."
        >
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold uppercase text-muted">
                Sunrise
              </dt>
              <dd className="text-sm font-medium text-ink">
                {formatSkyTime(astronomy.sunrise)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-muted">
                Sunset
              </dt>
              <dd className="text-sm font-medium text-ink">
                {formatSkyTime(astronomy.sunset)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-muted">
                Moon
              </dt>
              <dd className="text-sm font-medium text-ink">
                {astronomy.moonPhaseLabel}
                {astronomy.moonrise ? (
                  <span className="block text-xs font-normal text-muted">
                    Rises {formatSkyTime(astronomy.moonrise)}
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-muted">
                UV index (max)
              </dt>
              <dd className="text-sm font-medium text-ink">
                {astronomy.uvIndexMax ?? "—"}
                <span className="block text-xs font-normal text-muted">
                  {astronomy.daylightHours}h daylight
                </span>
              </dd>
            </div>
          </dl>
        </Section>
      ) : errors.astronomy ? (
        <Section title="Today & tonight">
          <FeedError message={errors.astronomy} />
        </Section>
      ) : null}

      {data.hourly.length > 0 ? (
        <Section
          title="Next 48 hours"
          description="Hourly temperature, rain chance, and wind."
        >
          <div className="-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1">
            {data.hourly.slice(0, 24).map((hour) => (
              <div
                key={hour.time}
                className="flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-xl border border-line bg-surface/90 px-2 py-2 text-center"
              >
                <span className="text-[10px] font-medium text-muted">
                  {formatHour(hour.time)}
                </span>
                <span className="mt-1 text-sm font-bold tabular-nums text-ink">
                  {hour.temperatureF}°
                </span>
                <span className="mt-0.5 text-[10px] text-muted">
                  {hour.precipChancePercent}%
                </span>
                <span className="text-[10px] text-muted">{hour.windMph} mph</span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="7-day outlook">
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
          {data.daily.map((day) => (
            <li
              key={day.date}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 bg-surface/90 px-3 py-2.5 text-sm sm:grid-cols-[7rem_1fr_auto_auto]"
            >
              <span className="font-medium text-ink">{formatDay(day.date)}</span>
              <span className="truncate text-muted">{day.weatherLabel}</span>
              <span className="shrink-0 tabular-nums font-medium text-ink">
                {day.highF}° / {day.lowF}°
              </span>
              <span className="shrink-0 text-xs text-muted">
                {day.precipChancePercent}% rain
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Look west — Vandenberg launches"
        description="Rocket launches from Vandenberg Space Force Base (~100 mi west). Visibility depends on timing, weather, and how far inland you are."
      >
        {errors.launches ? (
          <FeedError message={errors.launches} />
        ) : data.launches.length === 0 ? (
          <p className="text-sm text-muted">
            No upcoming Vandenberg launches in the schedule right now.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.launches.map((launch) => (
              <li
                key={launch.id}
                className="rounded-xl border border-line bg-surface/90 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{launch.name}</p>
                    <p className="text-xs text-muted">
                      {launch.provider} · {launch.padName} · {launch.status}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${launchHintClass(launch.viewingHint)}`}
                  >
                    {launch.viewingHint === "good"
                      ? "Good chance"
                      : launch.viewingHint === "maybe"
                        ? "Maybe"
                        : launch.viewingHint === "unlikely"
                          ? "Unlikely"
                          : "TBD"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink">
                  {formatLaunchWindow(launch.windowStart, launch.windowEnd)}
                </p>
                <p className="mt-1 text-xs text-muted">{launch.viewingNote}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Around the area"
        description="Official alerts, recent seismic activity, and ISS passes overhead."
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-ink">Weather alerts</h3>
            {errors.alerts ? (
              <div className="mt-2">
                <FeedError message={errors.alerts} />
              </div>
            ) : data.alerts.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                No active NWS alerts for the park location.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {data.alerts.map((alert) => (
                  <li
                    key={alert.id}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900/50 dark:bg-red-950/30"
                  >
                    <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                      {alert.event}
                      <span className="ml-2 text-xs font-normal text-red-800/80 dark:text-red-200/80">
                        {alert.severity}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-red-900/90 dark:text-red-100/90">
                      {alert.headline}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink">
              Recent earthquakes
            </h3>
            <p className="text-xs text-muted">
              Magnitude 2.5+ within ~150 miles, last 7 days
            </p>
            {errors.earthquakes ? (
              <div className="mt-2">
                <FeedError message={errors.earthquakes} />
              </div>
            ) : data.earthquakes.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                No recent quakes in range.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line">
                {data.earthquakes.map((eq) => (
                  <li key={eq.id} className="bg-surface/90 px-3 py-2">
                    <a
                      href={eq.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
                    >
                      M{eq.magnitude.toFixed(1)} · {eq.place}
                    </a>
                    <p className="text-xs text-muted">
                      {formatUpdated(eq.time)} · ~{eq.distanceMiles} mi away
                      {eq.depthKm != null ? ` · ${eq.depthKm} km deep` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink">ISS passes</h3>
            <p className="text-xs text-muted">
              When the space station may be visible looking up (next few passes)
            </p>
            {errors.iss ? (
              <div className="mt-2">
                <FeedError message={errors.iss} />
              </div>
            ) : data.issPasses.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                No upcoming passes listed — check back later.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {data.issPasses.map((pass) => (
                  <li
                    key={pass.riseTime}
                    className="rounded-lg border border-line bg-surface/90 px-3 py-2"
                  >
                    <p className="text-sm font-medium text-ink">
                      {formatIssPassTime(pass.riseTime)}
                    </p>
                    <p className="text-xs text-muted">
                      Visible for {formatIssDuration(pass.durationSeconds)} ·{" "}
                      {pass.maxElevationNote}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}
