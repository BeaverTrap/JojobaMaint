import WeatherConditionIcon from "@/components/WeatherConditionIcon";
import MoonPhaseIcon from "@/components/MoonPhaseIcon";
import { moonPhaseLabel } from "@/lib/moon-phase";
import type { ParkWeatherDaily } from "@/lib/park-weather";

function formatDay(dateIso: string): string {
  const date = new Date(`${dateIso}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

export default function DailyOutlookList({
  days,
  showMoon = false,
  compact = false,
}: {
  days: ParkWeatherDaily[];
  showMoon?: boolean;
  compact?: boolean;
}) {
  const iconSize = compact ? 18 : 22;
  const moonSize = compact ? 16 : 18;

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line/80 bg-surface/90 shadow-sm dark:bg-surface/80">
      {days.map((day) => (
        <li
          key={day.date}
          className={`grid items-center gap-x-2 gap-y-0.5 px-3 py-2 text-sm sm:gap-2 sm:py-2.5 ${
            showMoon
              ? "grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] sm:grid-cols-[auto_7rem_1fr_auto_auto_auto]"
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
          <span className="shrink-0 tabular-nums font-medium text-ink">
            {day.highF}° / {day.lowF}°
          </span>
          <span className="shrink-0 text-xs text-muted">
            {day.precipChancePercent}% rain
          </span>
          {showMoon ? (
            <span
              className="flex shrink-0 items-center justify-end gap-1"
              title={moonPhaseLabel(day.moonPhase)}
            >
              <MoonPhaseIcon phase={day.moonPhase} size={moonSize} />
              <span className="hidden text-[10px] text-muted lg:inline">
                {moonPhaseLabel(day.moonPhase).split(" ")[0]}
              </span>
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
