import Image from "next/image";
import {
  MOON_PHASE_LABELS,
  moonPhaseFrameSrc,
  moonPhaseLabel,
} from "@/lib/moon-phase";

type MoonPhaseIconProps = {
  phase: number;
  size?: number;
  className?: string;
};

export default function MoonPhaseIcon({
  phase,
  size = 20,
  className = "",
}: MoonPhaseIconProps) {
  return (
    <Image
      src={moonPhaseFrameSrc(phase)}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`.trim()}
      unoptimized
    />
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
