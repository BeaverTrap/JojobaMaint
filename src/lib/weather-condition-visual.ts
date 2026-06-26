import {
  weatherCodeToMapVariant,
  type WeatherMapVariant,
} from "@/lib/weather-mascot-layers";

export type HourlyConditionStyle = {
  variant: WeatherMapVariant;
  isNight: boolean;
  cardClass: string;
  iconHaloClass: string;
};

const CARD_BY_VARIANT: Record<WeatherMapVariant, string> = {
  clear:
    "from-amber-50/90 via-sky-50/80 to-sky-100/90 dark:from-amber-950/25 dark:via-sky-950/20 dark:to-sky-900/30",
  cloudy:
    "from-slate-100/90 via-sky-50/70 to-slate-50/90 dark:from-slate-900/40 dark:via-sky-950/20 dark:to-slate-900/30",
  rain: "from-sky-200/80 via-sky-100/80 to-blue-50/90 dark:from-sky-950/50 dark:via-sky-900/30 dark:to-blue-950/25",
  storm:
    "from-violet-200/70 via-slate-200/80 to-sky-100/80 dark:from-violet-950/40 dark:via-slate-900/35 dark:to-sky-950/25",
  fog: "from-slate-200/80 via-slate-100/80 to-sky-50/80 dark:from-slate-900/45 dark:via-slate-800/30 dark:to-sky-950/20",
  snow: "from-sky-50/90 via-slate-50/90 to-white/90 dark:from-sky-950/35 dark:via-slate-900/30 dark:to-slate-950/25",
};

const HALO_BY_VARIANT: Record<WeatherMapVariant, string> = {
  clear: "bg-white/80 ring-amber-200/70 dark:bg-slate-900/50 dark:ring-amber-500/25",
  cloudy: "bg-white/80 ring-slate-200/70 dark:bg-slate-900/50 dark:ring-slate-500/25",
  rain: "bg-white/80 ring-sky-200/70 dark:bg-slate-900/50 dark:ring-sky-400/25",
  storm:
    "bg-white/80 ring-violet-200/70 dark:bg-slate-900/50 dark:ring-violet-400/25",
  fog: "bg-white/80 ring-slate-200/70 dark:bg-slate-900/50 dark:ring-slate-400/25",
  snow: "bg-white/80 ring-sky-100/80 dark:bg-slate-900/50 dark:ring-sky-300/25",
};

const CLEAR_NIGHT_CARD =
  "from-indigo-950/20 via-slate-900/15 to-sky-950/25 dark:from-indigo-950/45 dark:via-slate-950/35 dark:to-sky-950/40";

const CLEAR_NIGHT_HALO =
  "bg-indigo-950/15 ring-indigo-300/35 dark:bg-indigo-950/40 dark:ring-indigo-400/30";

export function hourlyConditionStyle(
  code: number,
  isDay: boolean,
): HourlyConditionStyle {
  const variant = weatherCodeToMapVariant(code);
  const isNight = !isDay;

  return {
    variant,
    isNight,
    cardClass:
      isNight && variant === "clear"
        ? CLEAR_NIGHT_CARD
        : CARD_BY_VARIANT[variant],
    iconHaloClass:
      isNight && variant === "clear"
        ? CLEAR_NIGHT_HALO
        : HALO_BY_VARIANT[variant],
  };
}

/** Open-Meteo hourly buckets are whole hours in park local time. */
export function weatherHourBucket(iso: string): string {
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})/);
  if (!match) return iso;
  return `${match[1]}T${match[2]}`;
}

export function isCurrentWeatherHour(
  hourTime: string,
  fetchedAt: string,
): boolean {
  return weatherHourBucket(hourTime) === weatherHourBucket(fetchedAt);
}
