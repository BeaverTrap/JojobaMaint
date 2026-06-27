"use client";

import WeatherMascotStack from "@/components/WeatherMascotStack";
import { useParkWeather } from "@/components/ParkWeatherProvider";
import { quailRotationSeed } from "@/lib/weather-mascot-layers";

function MascotPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={`aspect-[5/4] animate-pulse rounded-lg bg-sky-100/70 dark:bg-sky-900/25 ${className ?? ""}`}
      aria-hidden
    />
  );
}

export default function SkyPageMascotHeader() {
  const { data } = useParkWeather();

  if (!data) {
    return (
      <>
        <MascotPlaceholder className="w-[200px] shrink-0 sm:hidden" />
        <MascotPlaceholder className="hidden w-[300px] shrink-0 sm:block" />
      </>
    );
  }

  const { current } = data;
  const rotationSeed = quailRotationSeed(data.fetchedAt);

  return (
    <>
      <WeatherMascotStack
        temperatureF={current.temperatureF}
        weatherLabel={current.weatherLabel}
        weatherCode={current.weatherCode}
        isDay={current.isDay}
        rotationSeed={rotationSeed}
        width={200}
        className="shrink-0 sm:hidden"
      />
      <WeatherMascotStack
        temperatureF={current.temperatureF}
        weatherLabel={current.weatherLabel}
        weatherCode={current.weatherCode}
        isDay={current.isDay}
        rotationSeed={rotationSeed}
        width={300}
        className="hidden shrink-0 sm:block"
      />
    </>
  );
}
