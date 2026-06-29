"use client";

import Image from "next/image";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  BoltIcon,
  CheckIcon,
  ClockIcon,
  DropletIcon,
  InfoIcon,
  LaundryIcon,
  RestroomIcon,
  StatusBadge,
  WarningIcon,
  type StatusTone,
} from "@/components/StatusIcon";

/**
 * Cartoony status icons. Drop matching PNGs in /public/assets/status/
 * (see README there). Until a file exists, the line-icon fallback renders.
 */
export type StatusArtId =
  | "water-ok"
  | "water-issue"
  | "power-ok"
  | "power-issue"
  | "planned"
  | "laundry-ok"
  | "laundry-issue"
  | "bathroom-ok"
  | "bathroom-issue"
  | "alert"
  | "info"
  | "all-clear";

const ART_SRC: Record<StatusArtId, string> = {
  "water-ok": "/assets/status/water-ok.png",
  "water-issue": "/assets/status/water-issue.png",
  "power-ok": "/assets/status/power-ok.png",
  "power-issue": "/assets/status/power-issue.png",
  planned: "/assets/status/planned.png",
  "laundry-ok": "/assets/status/laundry-ok.png",
  "laundry-issue": "/assets/status/laundry-issue.png",
  "bathroom-ok": "/assets/status/bathroom-ok.png",
  "bathroom-issue": "/assets/status/bathroom-issue.png",
  alert: "/assets/status/alert.png",
  info: "/assets/status/info.png",
  "all-clear": "/assets/status/all-clear.png",
};

const FALLBACK: Record<StatusArtId, ReactNode> = {
  "water-ok": <DropletIcon />,
  "water-issue": <WarningIcon />,
  "power-ok": <BoltIcon />,
  "power-issue": <WarningIcon />,
  planned: <ClockIcon />,
  "laundry-ok": <LaundryIcon />,
  "laundry-issue": <WarningIcon />,
  "bathroom-ok": <RestroomIcon />,
  "bathroom-issue": <WarningIcon />,
  alert: <WarningIcon />,
  info: <InfoIcon />,
  "all-clear": <CheckIcon />,
};

export default function StatusArt({
  art,
  tone,
  size = "md",
}: {
  art: StatusArtId;
  tone: StatusTone;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const px = size === "sm" ? 32 : size === "lg" ? 56 : 36;

  return (
    <StatusBadge tone={tone} size={size}>
      {failed ? (
        FALLBACK[art]
      ) : (
        <Image
          src={ART_SRC[art]}
          alt=""
          width={px}
          height={px}
          unoptimized
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-0.5"
        />
      )}
    </StatusBadge>
  );
}

/**
 * Big, badge-less status mascot meant to be blown up and cropped into a card
 * corner (like the Quick Link cards). Falls back to the line icon in a tinted
 * circle if the PNG is missing.
 */
export function StatusArtBleed({
  art,
  tone,
  size = 150,
  className = "",
  objectClassName = "object-contain",
}: {
  art: StatusArtId;
  tone: StatusTone;
  size?: number;
  className?: string;
  objectClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute ${className}`}
      style={{ width: size, height: size }}
    >
      {failed ? (
        <span className="flex h-full w-full items-end justify-center">
          <span className="scale-[2.2]">
            <StatusBadge tone={tone} size="lg">
              {FALLBACK[art]}
            </StatusBadge>
          </span>
        </span>
      ) : (
        <Image
          src={ART_SRC[art]}
          alt=""
          width={size * 2}
          height={size * 2}
          unoptimized
          onError={() => setFailed(true)}
          className={`h-full w-full ${objectClassName}`}
        />
      )}
    </span>
  );
}
