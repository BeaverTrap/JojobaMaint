import { MdWaterDrop } from "react-icons/md";
import WeatherConditionIcon from "@/components/WeatherConditionIcon";
import {
  hourlyConditionStyle,
  isCurrentWeatherHour,
} from "@/lib/weather-condition-visual";
import type { ParkWeatherHourly } from "@/lib/sky/types";

function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

function formatDayShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "America/Los_Angeles",
  });
}

function HourlyCard({
  hour,
  isNow,
}: {
  hour: ParkWeatherHourly;
  isNow: boolean;
}) {
  const style = hourlyConditionStyle(hour.weatherCode, hour.isDay);

  return (
    <article
      className={`flex w-[4.75rem] shrink-0 flex-col items-center rounded-xl border bg-gradient-to-b px-1.5 py-2 text-center shadow-sm ${
        isNow
          ? "border-brand-500 ring-2 ring-brand-500/35"
          : "border-line/80 ring-1 ring-black/5 dark:ring-white/5"
      } ${style.cardClass}`}
      aria-label={`${formatHour(hour.time)}, ${hour.temperatureF} degrees, ${hour.weatherLabel}`}
    >
      <div className="flex w-full items-center justify-between gap-1">
        <span className="text-[10px] font-semibold text-muted">
          {formatHour(hour.time)}
        </span>
        {isNow ? (
          <span className="rounded-full bg-brand-600 px-1 py-px text-[8px] font-bold uppercase tracking-wide text-white">
            Now
          </span>
        ) : null}
      </div>

      <div
        className={`mt-2 flex h-11 w-11 items-center justify-center rounded-full ring-1 ${style.iconHaloClass}`}
      >
        <WeatherConditionIcon
          code={hour.weatherCode}
          isDay={hour.isDay}
          size={28}
        />
      </div>

      <span className="mt-2 text-lg font-bold tabular-nums leading-none text-ink">
        {hour.temperatureF}°
      </span>

      {hour.precipChancePercent > 0 ? (
        <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300">
          <MdWaterDrop className="h-3 w-3 shrink-0" aria-hidden />
          {hour.precipChancePercent}%
        </span>
      ) : (
        <span className="mt-1 text-[10px] text-muted">{hour.windMph} mph</span>
      )}
    </article>
  );
}

function DayBreak({ label }: { label: string }) {
  return (
    <div
      className="flex w-8 shrink-0 flex-col items-center justify-center self-stretch"
      aria-hidden
    >
      <div className="h-full w-px bg-line" />
      <span className="my-2 -rotate-90 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-muted">
        {label}
      </span>
      <div className="h-full w-px bg-line" />
    </div>
  );
}

export default function HourlyForecastStrip({
  hours,
  fetchedAt,
}: {
  hours: ParkWeatherHourly[];
  fetchedAt: string;
}) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-2 pt-0.5 [scrollbar-width:thin]">
      {hours.map((hour, index) => {
        const prevDay =
          index > 0 ? hours[index - 1].time.slice(0, 10) : null;
        const dayKey = hour.time.slice(0, 10);
        const showDayBreak = index > 0 && dayKey !== prevDay;

        return (
          <div key={hour.time} className="flex shrink-0 items-stretch gap-2">
            {showDayBreak ? <DayBreak label={formatDayShort(hour.time)} /> : null}
            <HourlyCard
              hour={hour}
              isNow={isCurrentWeatherHour(hour.time, fetchedAt)}
            />
          </div>
        );
      })}
    </div>
  );
}
