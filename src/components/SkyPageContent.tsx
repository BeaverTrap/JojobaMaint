import type { ReactNode } from "react";
import {
  MdCheckCircle,
  MdPublic,
  MdWarningAmber,
} from "react-icons/md";
import EarthquakeActivity from "@/components/EarthquakeActivity";
import ParkLocalClock from "@/components/ParkLocalClock";
import SkyPageMascotHeader from "@/components/SkyPageMascotHeader";
import SkySpaceSection from "@/components/SkySpaceSection";
import WeatherConditionIcon from "@/components/WeatherConditionIcon";
import WeatherForecastSection from "@/components/WeatherForecastSection";
import { isGoogleMapsEnabled } from "@/lib/map-geography";
import { formatSkyTime } from "@/lib/sky/astronomy";
import type { SkyPageData } from "@/lib/sky/types";
import { heroSkyStyle } from "@/lib/weather-condition-visual";

function RegionalAreaSection({
  title,
  topContent,
  children,
}: {
  title: string;
  topContent: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="motion-card relative overflow-hidden rounded-2xl border border-white/40 shadow-lg ring-1 ring-inset ring-white/20 dark:border-white/10"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-100 via-stone-100 to-emerald-100 dark:from-amber-200/25 dark:via-stone-300/20 dark:to-emerald-200/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 -top-20 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-300/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl dark:bg-emerald-300/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-white/45 backdrop-blur-xl dark:bg-stone-950/55"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70 dark:bg-white/20"
        aria-hidden
      />
      <div className="relative space-y-4 p-4 pt-3 sm:p-5 sm:pt-4">
        <div className="flex items-end gap-3 sm:gap-5">
          <div className="min-w-0 flex-1 space-y-3">
            <h2 className="text-xl font-bold leading-tight tracking-tight text-ink sm:text-2xl">
              {title}
            </h2>
            {topContent}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/mascot/ranger.png"
            alt=""
            aria-hidden
            width={176}
            height={176}
            className="-mb-4 -mr-1 h-28 w-28 shrink-0 object-contain object-bottom drop-shadow-md sm:-mb-5 sm:h-40 sm:w-40"
          />
        </div>
        {children}
      </div>
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

function AreaPanel({
  icon,
  iconClassName,
  title,
  subtitle,
  badge,
  children,
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  subtitle: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface/60">
      <div className="flex items-center gap-3 border-b border-line bg-gradient-to-r from-canvas/60 to-surface px-4 py-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${iconClassName}`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
        {badge ? <div className="ml-auto shrink-0">{badge}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function WeatherAlertsStatus({
  alerts,
  error,
}: {
  alerts: SkyPageData["alerts"];
  error?: string;
}) {
  if (error) return <FeedError message={error} />;

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900/60">
          <MdCheckCircle className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">NWS all clear</p>
          <p className="text-xs text-muted">
            No active weather alerts for the park location.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-red-200 bg-red-50/70 p-3 dark:border-red-900/50 dark:bg-red-950/20">
      <div className="flex items-center gap-2 text-sm font-semibold text-red-900 dark:text-red-100">
        <MdWarningAmber className="h-5 w-5" aria-hidden />
        {alerts.length} active NWS alert{alerts.length === 1 ? "" : "s"}
      </div>
      <ul className="space-y-2">
        {alerts.map((alert) => (
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
    </div>
  );
}

export default function SkyPageContent({ data }: { data: SkyPageData }) {
  const { current, astronomy, errors } = data;
  const hasMap = isGoogleMapsEnabled();
  const hero = heroSkyStyle(current.weatherCode, current.isDay);

  return (
    <div className="space-y-6 pb-4">
      <section
        className={`motion-card relative overflow-hidden rounded-2xl border px-4 py-3 shadow-lg ring-1 ring-inset ring-white/25 sm:px-7 sm:py-6 dark:ring-white/10 ${hero.sectionClass} ${hero.borderClass}`}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/35 via-white/5 to-transparent backdrop-blur-[2px] dark:from-white/10 dark:via-white/[0.03]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/50 dark:bg-white/20"
          aria-hidden
        />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
          <SkyPageMascotHeader />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <h1
                className={`text-xl font-bold leading-tight tracking-tight sm:text-2xl ${hero.titleClass}`}
              >
                Jojoba Weather
              </h1>
              <ParkLocalClock
                labelClassName={hero.statLabelClass}
                valueClassName={hero.statValueClass}
              />
            </div>

            <div className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <div className="min-w-[8.5rem]">
                <div className="flex items-center gap-2">
                  <WeatherConditionIcon
                    code={current.weatherCode}
                    isDay={current.isDay}
                    size={32}
                  />
                  <p
                    className={`text-4xl font-bold tabular-nums leading-none ${hero.statValueClass}`}
                  >
                    {current.temperatureF}°F
                  </p>
                </div>
                <p className={`mt-1 text-sm ${hero.statValueClass}`}>
                  {current.weatherLabel}
                  <span className={hero.statSubClass}>
                    {" "}
                    · Feels like {current.apparentTemperatureF}°F
                  </span>
                </p>
              </div>

              {data.airQuality ? (
                <div className="min-w-[8rem]">
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${hero.statLabelClass}`}
                  >
                    Air quality
                  </p>
                  <p
                    className={`mt-1 text-sm font-semibold ${hero.statValueClass}`}
                  >
                    AQI {data.airQuality.usAqi} · {data.airQuality.label}
                  </p>
                  {data.airQuality.pm25 != null && (
                    <p className={`text-sm ${hero.statSubClass}`}>
                      PM2.5 {data.airQuality.pm25.toFixed(1)} µg/m³
                    </p>
                  )}
                </div>
              ) : null}

              <div className="min-w-[8rem]">
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${hero.statLabelClass}`}
                >
                  Wind & humidity
                </p>
                <p className={`mt-1 text-sm ${hero.statValueClass}`}>
                  {current.windMph} mph {current.windDirection}
                </p>
                <p className={`text-sm ${hero.statSubClass}`}>
                  Humidity {current.humidityPercent}%
                </p>
              </div>

              {astronomy ? (
                <>
                  <div className="min-w-[8rem]">
                    <p
                      className={`text-xs font-semibold uppercase tracking-wide ${hero.statLabelClass}`}
                    >
                      Sunrise
                    </p>
                    <p
                      className={`mt-1 text-sm font-semibold ${hero.statValueClass}`}
                    >
                      {formatSkyTime(astronomy.sunrise)}
                    </p>
                  </div>
                  <div className="min-w-[8rem]">
                    <p
                      className={`text-xs font-semibold uppercase tracking-wide ${hero.statLabelClass}`}
                    >
                      Sunset
                    </p>
                    <p
                      className={`mt-1 text-sm font-semibold ${hero.statValueClass}`}
                    >
                      {formatSkyTime(astronomy.sunset)}
                    </p>
                  </div>
                  <div className="min-w-[8rem]">
                    <p
                      className={`text-xs font-semibold uppercase tracking-wide ${hero.statLabelClass}`}
                    >
                      UV index (max)
                    </p>
                    <p
                      className={`mt-1 text-sm font-semibold ${hero.statValueClass}`}
                    >
                      {astronomy.uvIndexMax ?? "—"}
                    </p>
                    <p className={`text-sm ${hero.statSubClass}`}>
                      {astronomy.daylightHours}h daylight
                    </p>
                  </div>
                </>
              ) : null}
            </div>

            {errors.astronomy ? (
              <div className="mt-4">
                <FeedError message={errors.astronomy} />
              </div>
            ) : null}
          </div>
        </div>
        <p className={`relative mt-1 text-xs sm:mt-3 ${hero.metaClass}`}>
          Updated {formatUpdated(data.fetchedAt)} · refreshes about every 15
          minutes
        </p>
      </section>

      <WeatherForecastSection
        hourly={data.hourly}
        daily={data.daily}
        fetchedAt={data.fetchedAt}
      />

      <SkySpaceSection
        current={data.current}
        airQuality={data.airQuality}
        launches={data.launches}
        issPasses={data.issPasses}
        nightSky={data.nightSky}
        lunarWeek={data.daily}
        apod={data.apod}
        launchesError={errors.launches}
        issError={errors.iss}
        apodError={errors.apod}
      />

      <RegionalAreaSection
        title="Alerts & Earthquakes"
        topContent={
          <WeatherAlertsStatus alerts={data.alerts} error={errors.alerts} />
        }
      >
        <AreaPanel
            title="Recent earthquakes"
            subtitle="Magnitude 2.5+ within ~155 mi, last 30 days"
            icon={<MdPublic className="h-5 w-5" aria-hidden />}
            iconClassName="bg-sky-50 text-sky-600 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900/50"
            badge={
              !errors.earthquakes && data.earthquakes.length > 0 ? (
                <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900/50">
                  {data.earthquakes.length} logged
                </span>
              ) : null
            }
          >
            {errors.earthquakes ? (
              <FeedError message={errors.earthquakes} />
            ) : (
              <EarthquakeActivity
                quakes={data.earthquakes}
                parkLat={data.latitude}
                parkLng={data.longitude}
                hasMap={hasMap}
              />
            )}
        </AreaPanel>
      </RegionalAreaSection>
    </div>
  );
}
