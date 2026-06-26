import {
  MdAcUnit,
  MdCloudQueue,
  MdFoggy,
  MdGrain,
  MdNightlight,
  MdThunderstorm,
  MdWaterDrop,
  MdWbCloudy,
  MdWbSunny,
} from "react-icons/md";
import { weatherCodeToMapVariant } from "@/lib/weather-mascot-layers";

type WeatherConditionIconProps = {
  code: number;
  isDay?: boolean;
  size?: number;
  className?: string;
};

export default function WeatherConditionIcon({
  code,
  isDay = true,
  size = 20,
  className = "",
}: WeatherConditionIconProps) {
  const variant = weatherCodeToMapVariant(code);
  const style = { width: size, height: size };
  const base = `shrink-0 ${className}`.trim();

  if (variant === "clear") {
    if (!isDay) {
      return (
        <MdNightlight
          className={`text-indigo-400 ${base}`}
          style={style}
          aria-hidden
        />
      );
    }
    return (
      <MdWbSunny
        className={`text-amber-500 ${base}`}
        style={style}
        aria-hidden
      />
    );
  }

  if (variant === "cloudy") {
    if (code === 2) {
      return (
        <MdWbCloudy
          className={`${isDay ? "text-sky-500" : "text-indigo-300"} ${base}`}
          style={style}
          aria-hidden
        />
      );
    }
    if (code === 3) {
      return (
        <MdCloudQueue
          className={`text-slate-500 ${base}`}
          style={style}
          aria-hidden
        />
      );
    }
    return (
      <MdWbCloudy
        className={`text-slate-500 ${base}`}
        style={style}
        aria-hidden
      />
    );
  }

  if (variant === "fog") {
    return (
      <MdFoggy className={`text-slate-400 ${base}`} style={style} aria-hidden />
    );
  }

  if (variant === "snow") {
    return (
      <MdAcUnit className={`text-sky-400 ${base}`} style={style} aria-hidden />
    );
  }

  if (variant === "storm") {
    return (
      <MdThunderstorm
        className={`text-violet-600 ${base}`}
        style={style}
        aria-hidden
      />
    );
  }

  if (code >= 80 && code <= 82) {
    return (
      <MdGrain className={`text-sky-600 ${base}`} style={style} aria-hidden />
    );
  }

  return (
    <MdWaterDrop
      className={`text-sky-600 ${base}`}
      style={style}
      aria-hidden
    />
  );
}
