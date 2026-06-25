import type {
  ParkWeatherAirQuality,
  ParkWeatherCurrent,
  ParkWeatherDaily,
} from "@/lib/park-weather";

export type ParkWeatherHourly = {
  time: string;
  temperatureF: number;
  precipChancePercent: number;
  weatherLabel: string;
  weatherCode: number;
  windMph: number;
  uvIndex: number | null;
};

export type ParkAstronomyToday = {
  sunrise: string;
  sunset: string;
  moonrise: string | null;
  moonset: string | null;
  /** 0 = new, 0.5 = full */
  moonPhase: number;
  moonPhaseLabel: string;
  daylightHours: number;
  uvIndexMax: number | null;
};

export type NwsAlert = {
  id: string;
  event: string;
  severity: string;
  headline: string;
  description: string;
  expires: string | null;
};

export type RecentEarthquake = {
  id: string;
  magnitude: number;
  place: string;
  time: string;
  distanceMiles: number;
  depthKm: number | null;
  url: string;
};

export type VandenbergLaunch = {
  id: string;
  name: string;
  provider: string;
  status: string;
  windowStart: string | null;
  windowEnd: string | null;
  padName: string;
  /** Rough hint for SoCal inland viewing */
  viewingHint: "good" | "maybe" | "unlikely" | "unknown";
  viewingNote: string;
};

export type IssPass = {
  riseTime: string;
  durationSeconds: number;
  maxElevationNote: string;
};

export type SkyPageData = {
  locationLabel: string;
  latitude: number;
  longitude: number;
  fetchedAt: string;
  current: ParkWeatherCurrent;
  daily: ParkWeatherDaily[];
  hourly: ParkWeatherHourly[];
  airQuality: ParkWeatherAirQuality;
  astronomy: ParkAstronomyToday | null;
  alerts: NwsAlert[];
  earthquakes: RecentEarthquake[];
  launches: VandenbergLaunch[];
  issPasses: IssPass[];
  errors: Partial<Record<SkyFeedId, string>>;
};

export type SkyFeedId =
  | "astronomy"
  | "alerts"
  | "earthquakes"
  | "launches"
  | "iss";
