import type { ReactNode } from "react";
import { StatusArtBleed, type StatusArtId } from "@/components/StatusArt";
import {
  TONE_CARD_GRADIENT,
  TONE_CARD_OVERLAY,
  type StatusTone,
} from "@/components/StatusIcon";

/**
 * Status card with a focal status mascot and a full-card gradient tinted by
 * status tone.
 *
 * - `crop` (default): the mascot is blown up and cropped into a bottom corner.
 * - `crop={false}`: the mascot is shown in full and allowed to rise above the
 *   top edge of the card so it "sits on top" without any cropping.
 *
 * All text/links live in a content column on the side opposite the mascot, so
 * copy never overlaps the artwork.
 */
export default function StatusCard({
  tone,
  art,
  title,
  headerRight,
  children,
  crop = true,
  mascotSide = "right",
  mascotSize,
  mascotClassName,
  className = "",
}: {
  tone: StatusTone;
  art: StatusArtId;
  title: ReactNode;
  headerRight?: ReactNode;
  children?: ReactNode;
  crop?: boolean;
  mascotSide?: "left" | "right";
  mascotSize?: number;
  mascotClassName?: string;
  className?: string;
}) {
  const size = mascotSize ?? (crop ? 158 : 150);
  const onRight = mascotSide === "right";
  const defaultPos = crop
    ? onRight
      ? "-bottom-9 -right-3 origin-bottom-right"
      : "-bottom-9 -left-3 origin-bottom-left"
    : onRight
      ? "bottom-0 right-1 origin-bottom"
      : "bottom-0 left-1 origin-bottom";
  const mascotPos = mascotClassName ?? defaultPos;
  const contentPad = onRight ? "pr-32" : "pl-32";

  return (
    <div
      className={`relative flex flex-col rounded-2xl border px-4 py-4 shadow-sm ${
        crop ? "overflow-hidden" : "mt-7 min-h-[116px] overflow-visible"
      } ${TONE_CARD_GRADIENT[tone]} ${className}`.trim()}
    >
      <StatusArtBleed
        art={art}
        tone={tone}
        size={size}
        objectClassName={crop ? "object-contain" : "object-contain object-bottom"}
        className={`z-0 drop-shadow-sm ${mascotPos}`}
      />
      <span
        aria-hidden
        className={`absolute inset-0 z-[1] ${
          onRight ? "bg-gradient-to-r" : "bg-gradient-to-l"
        } ${TONE_CARD_OVERLAY[tone]} from-35% to-transparent to-85%`}
      />

      <div className={`relative z-10 flex flex-col ${contentPad}`}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold leading-tight text-ink">{title}</h3>
          {headerRight}
        </div>
        {children ? <div className="mt-2">{children}</div> : null}
      </div>
    </div>
  );
}
