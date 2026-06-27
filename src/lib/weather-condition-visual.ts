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

export type HeroSkyStyle = {
  sectionClass: string;
  borderClass: string;
  titleClass: string;
  statLabelClass: string;
  statValueClass: string;
  statSubClass: string;
  metaClass: string;
};

const HERO_DAY_BY_VARIANT: Record<WeatherMapVariant, HeroSkyStyle> = {
  clear: {
    sectionClass:
      "bg-gradient-to-br from-sky-300 via-sky-100 to-amber-50 dark:from-sky-800/60 dark:via-sky-900/40 dark:to-amber-950/30",
    borderClass: "border-sky-200/80 dark:border-sky-800/50",
    titleClass: "text-ink",
    statLabelClass: "text-muted",
    statValueClass: "text-ink",
    statSubClass: "text-muted",
    metaClass: "text-muted",
  },
  cloudy: {
    sectionClass:
      "bg-gradient-to-br from-slate-200 via-sky-100 to-slate-50 dark:from-slate-800/60 dark:via-sky-950/30 dark:to-slate-900/50",
    borderClass: "border-slate-200/80 dark:border-slate-700/50",
    titleClass: "text-ink",
    statLabelClass: "text-muted",
    statValueClass: "text-ink",
    statSubClass: "text-muted",
    metaClass: "text-muted",
  },
  rain: {
    sectionClass:
      "bg-gradient-to-br from-sky-300/90 via-sky-100 to-slate-100 dark:from-sky-900/60 dark:via-slate-900/50 dark:to-sky-950/60",
    borderClass: "border-sky-300/70 dark:border-sky-800/50",
    titleClass: "text-ink",
    statLabelClass: "text-muted",
    statValueClass: "text-ink",
    statSubClass: "text-muted",
    metaClass: "text-muted",
  },
  storm: {
    sectionClass:
      "bg-gradient-to-br from-slate-400/80 via-slate-200 to-sky-100 dark:from-slate-800/60 dark:via-slate-900/60 dark:to-sky-950/50",
    borderClass: "border-slate-400/60 dark:border-slate-700/50",
    titleClass: "text-ink",
    statLabelClass: "text-muted",
    statValueClass: "text-ink",
    statSubClass: "text-muted",
    metaClass: "text-muted",
  },
  fog: {
    sectionClass:
      "bg-gradient-to-br from-slate-300/90 via-slate-100 to-sky-50 dark:from-slate-800/70 dark:via-slate-800/40 dark:to-sky-950/40",
    borderClass: "border-slate-300/70 dark:border-slate-700/50",
    titleClass: "text-ink",
    statLabelClass: "text-muted",
    statValueClass: "text-ink",
    statSubClass: "text-muted",
    metaClass: "text-muted",
  },
  snow: {
    sectionClass:
      "bg-gradient-to-br from-sky-100 via-slate-50 to-white dark:from-sky-900/50 dark:via-slate-900/40 dark:to-slate-950/50",
    borderClass: "border-sky-200/80 dark:border-sky-800/40",
    titleClass: "text-ink",
    statLabelClass: "text-muted",
    statValueClass: "text-ink",
    statSubClass: "text-muted",
    metaClass: "text-muted",
  },
};

/** Twilight / night sky — deep dusk tones, light text. Distinct from the space section. */
const HERO_NIGHT_LIGHT = {
  titleClass: "text-white",
  statLabelClass: "text-white/55",
  statValueClass: "text-white",
  statSubClass: "text-white/70",
  metaClass: "text-white/50",
} as const;

const HERO_NIGHT_BY_VARIANT: Record<WeatherMapVariant, HeroSkyStyle> = {
  clear: {
    sectionClass:
      "bg-gradient-to-br from-sky-900 via-blue-900 to-indigo-900",
    borderClass: "border-blue-600/40",
    ...HERO_NIGHT_LIGHT,
  },
  cloudy: {
    sectionClass:
      "bg-gradient-to-br from-slate-700 via-blue-900 to-slate-700",
    borderClass: "border-slate-500/40",
    ...HERO_NIGHT_LIGHT,
  },
  rain: {
    sectionClass:
      "bg-gradient-to-br from-slate-700 via-sky-800 to-blue-900",
    borderClass: "border-sky-600/40",
    ...HERO_NIGHT_LIGHT,
  },
  storm: {
    sectionClass:
      "bg-gradient-to-br from-slate-800 via-slate-700 to-blue-900",
    borderClass: "border-slate-500/40",
    ...HERO_NIGHT_LIGHT,
  },
  fog: {
    sectionClass:
      "bg-gradient-to-br from-slate-600 via-slate-700 to-blue-900",
    borderClass: "border-slate-400/40",
    ...HERO_NIGHT_LIGHT,
  },
  snow: {
    sectionClass:
      "bg-gradient-to-br from-blue-900 via-slate-600 to-sky-800",
    borderClass: "border-sky-500/40",
    ...HERO_NIGHT_LIGHT,
  },
};

/** Sky-themed hero panel — gradient follows current conditions and day/night. */
export function heroSkyStyle(code: number, isDay: boolean): HeroSkyStyle {
  const variant = weatherCodeToMapVariant(code);
  return isDay ? HERO_DAY_BY_VARIANT[variant] : HERO_NIGHT_BY_VARIANT[variant];
}
