"use client";

import { useId } from "react";
import { MOON_PHASE_LABELS, moonPhaseLabel } from "@/lib/moon-phase";
import {
  isNearFullMoon,
  isNearNewMoon,
  moonPhaseLightPath,
} from "@/lib/moon-phase-svg";

type MoonPhaseIconProps = {
  phase: number;
  size?: number;
  className?: string;
};

const CX = 12;
const CY = 12;
const MOON_R = 9.2;
const SKY_R = 11;

export default function MoonPhaseIcon({
  phase,
  size = 20,
  className = "",
}: MoonPhaseIconProps) {
  const gradientId = useId().replace(/:/g, "");
  const lightPath = moonPhaseLightPath(CX, CY, MOON_R, phase);
  const newMoon = isNearNewMoon(phase);
  const fullMoon = isNearFullMoon(phase);

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`shrink-0 ${className}`.trim()}
      aria-hidden
    >
      <defs>
        <radialGradient id={gradientId} cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#fffef5" />
          <stop offset="55%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#d4a574" />
        </radialGradient>
      </defs>

      {/* Night sky */}
      <circle cx={CX} cy={CY} r={SKY_R} fill="#0f172a" />

      {/* Dark limb */}
      <circle
        cx={CX}
        cy={CY}
        r={MOON_R}
        fill={fullMoon ? `url(#${gradientId})` : "#475569"}
      />

      {/* Sunlit portion */}
      {lightPath && !fullMoon ? (
        <path
          d={lightPath}
          fill={`url(#${gradientId})`}
          fillRule="evenodd"
        />
      ) : null}

      {/* Limb + craters hint on full moon */}
      <circle
        cx={CX}
        cy={CY}
        r={MOON_R}
        fill="none"
        stroke="#94a3b8"
        strokeWidth={newMoon ? 1.1 : 0.65}
        strokeOpacity={newMoon ? 0.85 : 0.45}
      />

      {fullMoon ? (
        <>
          <circle cx={10.2} cy={10.5} r={1.1} fill="#c4a574" opacity={0.35} />
          <circle cx={14.1} cy={13.8} r={0.75} fill="#c4a574" opacity={0.28} />
          <circle cx={12.8} cy={9.2} r={0.55} fill="#c4a574" opacity={0.22} />
        </>
      ) : null}

      {newMoon ? (
        <>
          <circle cx={8.5} cy={9} r={0.35} fill="#64748b" opacity={0.5} />
          <circle cx={15} cy={14.5} r={0.25} fill="#64748b" opacity={0.4} />
        </>
      ) : null}
    </svg>
  );
}

export function MoonPhaseIconLabeled({
  phase,
  size = 22,
  showLabel = true,
  className = "",
}: MoonPhaseIconProps & { showLabel?: boolean }) {
  const label = moonPhaseLabel(phase);

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`.trim()}
      title={label}
    >
      <MoonPhaseIcon phase={phase} size={size} />
      {showLabel ? (
        <span className="text-sm font-medium text-ink">{label}</span>
      ) : null}
    </span>
  );
}

export { MOON_PHASE_LABELS };
