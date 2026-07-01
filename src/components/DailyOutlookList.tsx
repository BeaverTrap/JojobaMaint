import WeatherConditionIcon from "@/components/WeatherConditionIcon";
import MoonPhaseIcon from "@/components/MoonPhaseIcon";
import { moonPhaseLabel } from "@/lib/moon-phase";
import { formatParkDate } from "@/lib/park-weather";
import type { ParkWeatherDaily } from "@/lib/park-weather";

function formatDay(dateIso: string): string {
  return formatParkDate(dateIso, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function DailyOutlookList({
  days,
  showMoon = false,
  showTempBar = false,
  compact = false,
}: {
  days: ParkWeatherDaily[];
  showMoon?: boolean;
  showTempBar?: boolean;
  compact?: boolean;
}) {
  const iconSize = compact ? 18 : 22;
  const moonSize = compact ? 16 : 18;
  const weekLow = Math.min(...days.map((d) => d.lowF));
  const weekHigh = Math.max(...days.map((d) => d.highF));
  const tempSpan = Math.max(weekHigh - weekLow, 1);

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line/80 bg-surface/90 shadow-sm dark:bg-surface/80">
      {days.map((day) => {
        const barLeft = ((day.lowF - weekLow) / tempSpan) * 100;
        const barWidth = Math.max(
          ((day.highF - day.lowF) / tempSpan) * 100,
          6,
        );

        return (
        <li
          key={day.date}
          className={`grid items-center gap-x-2 gap-y-0.5 px-3 py-2 text-sm sm:gap-2 sm:py-2.5 ${
            showMoon
              ? "grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] sm:grid-cols-[auto_7rem_1fr_auto_auto_auto]"
              : showTempBar
                ? "grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:grid-cols-[auto_7rem_1fr_minmax(5rem,7rem)_auto]"
                : "grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:grid-cols-[auto_7rem_1fr_auto_auto]"
          }`}
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 ring-1 ring-sky-100 dark:bg-sky-950/40 dark:ring-sky-900/50"
            title={day.weatherLabel}
          >
            <WeatherConditionIcon
              code={day.weatherCode}
              isDay
              size={iconSize}
            />
          </span>
          <span className="min-w-0 font-medium text-ink">{formatDay(day.date)}</span>
          <span className="min-w-0 truncate text-muted sm:col-start-3">
            {day.weatherLabel}
          </span>
          {showTempBar ? (
            <div className="hidden items-center gap-1 sm:flex">
              <span className="w-6 text-right text-[10px] tabular-nums text-muted">
                {day.lowF}°
              </span>
              <div className="relative h-1.5 min-w-[4rem] flex-1 rounded-full bg-line">
                <div
                  className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-400 to-amber-400"
                  style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                />
              </div>
              <span className="w-6 text-[10px] tabular-nums text-muted">
                {day.highF}°
              </span>
            </div>
          ) : (
            <span className="shrink-0 tabular-nums font-medium text-ink">
              {day.highF}° / {day.lowF}°
            </span>
          )}
          <span className="shrink-0 text-xs text-muted">
            {day.precipChancePercent}% rain
          </span>
          {showMoon ? (
            <span
              className="flex shrink-0 items-center justify-end gap-1"
              title={moonPhaseLabel(
                day.moonPhase,
                day.moonIlluminationPercent,
              )}
            >
              <MoonPhaseIcon phase={day.moonPhase} size={moonSize} />
              <span className="hidden text-[10px] text-muted lg:inline">
                {moonPhaseLabel(
                  day.moonPhase,
                  day.moonIlluminationPercent,
                ).split(" ")[0]}
              </span>
            </span>
          ) : null}
        </li>
        );
      })}
    </ul>
  );
}
