"use client";

import { useEffect, useState } from "react";
import {
  weatherConditionIconKey,
  weatherConditionIconSrc,
} from "@/lib/weather-condition-icons";

type WeatherConditionIconProps = {
  code: number;
  isDay?: boolean;
  size?: number;
  className?: string;
};

function FallbackGlyph({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 opacity-70"
      aria-hidden
    >
      <path d="M6.5 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A3.5 3.5 0 0 1 17.5 18z" />
    </svg>
  );
}

export default function WeatherConditionIcon({
  code,
  isDay = true,
  size = 24,
  className,
}: WeatherConditionIconProps) {
  const key = weatherConditionIconKey(code, isDay);
  const src = weatherConditionIconSrc(key);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    return <FallbackGlyph size={size} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={`shrink-0 object-contain ${className ?? ""}`}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}
