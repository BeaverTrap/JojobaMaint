import type { ReactNode } from "react";
import DailyOutlookList from "@/components/DailyOutlookList";
import EarthquakeActivity from "@/components/EarthquakeActivity";
import HourlyForecastStrip from "@/components/HourlyForecastStrip";
import IssPassesList from "@/components/IssPassesList";
import LunarWeekStrip from "@/components/LunarWeekStrip";
import { MoonPhaseIconLabeled } from "@/components/MoonPhaseIcon";
import NasaApodCard from "@/components/NasaApodCard";
import ParkLocalClock from "@/components/ParkLocalClock";
import SkyPageMascotHeader from "@/components/SkyPageMascotHeader";
import VandenbergLaunchesList from "@/components/VandenbergLaunchesList";
import { isGoogleMapsEnabled } from "@/lib/map-geography";
import { formatSkyTime } from "@/lib/sky/astronomy";
import type { SkyPageData } from "@/lib/sky/types";

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

function formatUpdated(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
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
  const hasMap = isGoogleMapsEnabled();

  return (
    <div className="space-y-6 pb-4">
      <section className="motion-card overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-sky-50 to-surface px-4 py-3 shadow-sm dark:from-sky-950/30 dark:to-surface sm:px-7 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
          <SkyPageMascotHeader />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-ink sm:text-2xl">
                Jojoba Outdoors
              </h1>
              <ParkLocalClock />
            </div>

            <div className="mt-6 grid gap-x-6 gap-y-3 md:grid-cols-[minmax(9rem,10rem)_minmax(8rem,9rem)_minmax(8rem,9rem)] lg:gap-x-9">
              <div className="min-w-[8.5rem]">
                <p className="text-4xl font-bold tabular-nums leading-none text-ink">
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

              {data.airQuality ? (
                <div className="min-w-[8rem]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Air quality
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    AQI {data.airQuality.usAqi} · {data.airQuality.label}
                  </p>
                  {data.airQuality.pm25 != null && (
                    <p className="text-sm text-muted">
                      PM2.5 {data.airQuality.pm25.toFixed(1)} µg/m³
                    </p>
                  )}
                </div>
              ) : null}

              <div className="min-w-[8rem]">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Wind & humidity
                </p>
                <p className="mt-1 text-sm text-ink">
                  {current.windMph} mph {current.windDirection}
                </p>
                <p className="text-sm text-muted">
                  Humidity {current.humidityPercent}%
                </p>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted sm:mt-0">
          Updated {formatUpdated(data.fetchedAt)} · refreshes about every 15
          minutes
        </p>
      </section>

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
                <MoonPhaseIconLabeled phase={astronomy.moonPhase} size={22} />
                {astronomy.moonrise ? (
                  <span className="mt-1 block text-xs font-normal text-muted">
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
          <LunarWeekStrip days={data.daily} />
        </Section>
      ) : errors.astronomy ? (
        <Section title="Today & tonight">
          <FeedError message={errors.astronomy} />
        </Section>
      ) : null}

      {data.hourly.length > 0 ? (
        <Section
          title="Next 48 hours"
          description="Hour-by-hour sun, clouds, rain, and temperature — scroll for all 48 hours."
        >
          <HourlyForecastStrip hours={data.hourly} fetchedAt={data.fetchedAt} />
        </Section>
      ) : null}

      <Section title="7-day outlook">
        <DailyOutlookList days={data.daily} showMoon />
      </Section>

      <Section
        title="Around the area"
        description="Official alerts and recent seismic activity near the park."
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
              Magnitude 2.5+ within ~155 miles, last 30 days
            </p>
            {errors.earthquakes ? (
              <div className="mt-2">
                <FeedError message={errors.earthquakes} />
              </div>
            ) : (
              <EarthquakeActivity
                quakes={data.earthquakes}
                parkLat={data.latitude}
                parkLng={data.longitude}
                hasMap={hasMap}
              />
            )}
          </div>
        </div>
      </Section>

      <Section
        title="Sky & space"
        description="Vandenberg launches to the west and ISS flyovers — what to watch for overhead."
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-ink">
              Look west — next Vandenberg launch
            </h3>
            <p className="text-xs text-muted">
              From Vandenberg Space Force Base (~100 mi west). Visibility depends
              on timing, weather, and how far inland you are.
            </p>
            <div className="mt-2">
              {errors.launches ? (
                <FeedError message={errors.launches} />
              ) : (
                <VandenbergLaunchesList launches={data.launches} />
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink">ISS passes</h3>
            <p className="text-xs text-muted">
              When the space station may be visible looking up (next visible
              pass).
            </p>
            {errors.iss ? (
              <div className="mt-2">
                <FeedError message={errors.iss} />
              </div>
            ) : (
              <IssPassesList passes={data.issPasses} />
            )}
          </div>
        </div>
      </Section>

      {data.apod ? (
        <Section
          title="NASA image of the day"
          description="The Astronomy Picture of the Day, straight from NASA."
        >
          <NasaApodCard apod={data.apod} />
        </Section>
      ) : errors.apod ? (
        <Section title="NASA image of the day">
          <FeedError message={errors.apod} />
        </Section>
      ) : null}
    </div>
  );
}
