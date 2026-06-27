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
      className={`group flex w-14 shrink-0 flex-col items-center gap-2 rounded-2xl bg-gradient-to-b px-1 py-2.5 text-center transition-colors ${
        isNow
          ? "ring-2 ring-brand-500/60"
          : "ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
      } ${style.cardClass}`}
      aria-label={`${formatHour(hour.time)}, ${hour.temperatureF} degrees, ${hour.weatherLabel}`}
    >
      <span
        className={`text-[11px] font-semibold tabular-nums leading-none ${
          isNow ? "text-brand-600 dark:text-brand-300" : "text-muted"
        }`}
      >
        {isNow ? "Now" : formatHour(hour.time)}
      </span>

      <WeatherConditionIcon
        code={hour.weatherCode}
        isDay={hour.isDay}
        size={30}
      />

      <span className="text-base font-bold tabular-nums leading-none text-ink">
        {hour.temperatureF}°
      </span>

      {hour.precipChancePercent > 0 ? (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold leading-none text-sky-700 dark:text-sky-300">
          <MdWaterDrop className="h-2.5 w-2.5 shrink-0" aria-hidden />
          {hour.precipChancePercent}%
        </span>
      ) : (
        <span className="text-[10px] leading-none text-muted">
          {hour.windMph}
          <span className="text-[8px]"> mph</span>
        </span>
      )}
    </article>
  );
}

function DayBreak({ label }: { label: string }) {
  return (
    <div
      className="flex shrink-0 items-center self-stretch px-0.5"
      aria-hidden
    >
      <span className="rounded-full bg-line/60 px-1.5 py-2 text-[9px] font-bold uppercase tracking-widest text-muted [writing-mode:vertical-rl] rotate-180">
        {label}
      </span>
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
    <div className="scroll-slim -mx-1 flex gap-1.5 overflow-x-auto overscroll-x-contain px-1 pb-2 pt-0.5">
      {hours.map((hour, index) => {
        const prevDay =
          index > 0 ? hours[index - 1].time.slice(0, 10) : null;
        const dayKey = hour.time.slice(0, 10);
        const showDayBreak = index > 0 && dayKey !== prevDay;

        return (
          <div key={hour.time} className="flex shrink-0 items-stretch gap-1.5">
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
