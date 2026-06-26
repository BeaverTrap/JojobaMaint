import MoonPhaseIcon from "@/components/MoonPhaseIcon";
import { moonPhaseLabel } from "@/lib/moon-phase";
import type { ParkWeatherDaily } from "@/lib/park-weather";

function formatWeekdayShort(dateIso: string): string {
  const date = new Date(`${dateIso}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "America/Los_Angeles",
  });
}

export default function LunarWeekStrip({ days }: { days: ParkWeatherDaily[] }) {
  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Lunar cycle this week
      </p>
      <div className="-mx-1 flex justify-between gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        {days.map((day) => (
          <div
            key={day.date}
            className="flex min-w-[3.25rem] shrink-0 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-center"
            title={moonPhaseLabel(day.moonPhase)}
          >
            <MoonPhaseIcon phase={day.moonPhase} size={26} />
            <span className="text-[10px] font-medium text-ink">
              {formatWeekdayShort(day.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
