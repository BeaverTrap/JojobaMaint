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
  isDay: boolean;
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
  latitude: number;
  longitude: number;
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
  imageUrl: string | null;
  missionDescription: string | null;
  /** Official webcast / live stream or info page, when known. */
  watchUrl: string | null;
  watchLabel: string | null;
  /** Rough hint for SoCal inland viewing */
  viewingHint: "good" | "maybe" | "unlikely" | "unknown";
  viewingNote: string;
};

export type IssPass = {
  riseTime: string;
  durationSeconds: number;
  maxElevationNote: string;
};

export type NasaApod = {
  title: string;
  date: string | null;
  explanation: string;
  imageUrl: string;
  hdUrl: string | null;
  mediaType: "image" | "video";
  /** Link to the full-res image or the source video. */
  sourceUrl: string | null;
  copyright: string | null;
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
  apod: NasaApod | null;
  errors: Partial<Record<SkyFeedId, string>>;
};

export type SkyFeedId =
  | "astronomy"
  | "alerts"
  | "earthquakes"
  | "launches"
  | "iss"
  | "apod";
