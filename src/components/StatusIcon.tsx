import type { ReactNode } from "react";

export type StatusTone = "ok" | "warn" | "alert" | "info";

const TONE_STYLES: Record<StatusTone, string> = {
  ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  warn: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  alert: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  info: "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200",
};

/** Full-card gradient + border tinted by status tone. */
export const TONE_CARD_GRADIENT: Record<StatusTone, string> = {
  ok: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/70 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-emerald-900/15",
  warn: "border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/70 dark:border-amber-900/50 dark:from-amber-950/40 dark:to-amber-900/15",
  alert: "border-red-300 bg-gradient-to-br from-red-50 to-red-100/70 dark:border-red-900/50 dark:from-red-950/40 dark:to-red-900/15",
  info: "border-brand-200 bg-gradient-to-br from-brand-50 to-brand-100/70 dark:border-brand-900/50 dark:from-brand-950/40 dark:to-brand-900/15",
};

/** Text-side fade so copy stays legible over the blown-up mascot art. */
export const TONE_CARD_OVERLAY: Record<StatusTone, string> = {
  ok: "from-emerald-50 via-emerald-50/55 dark:from-surface dark:via-surface/55",
  warn: "from-amber-50 via-amber-50/55 dark:from-surface dark:via-surface/55",
  alert: "from-red-50 via-red-50/55 dark:from-surface dark:via-surface/55",
  info: "from-brand-50 via-brand-50/55 dark:from-surface dark:via-surface/55",
};

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function DropletIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} {...svgProps}>
      <path d="M12 3.5c3 3.6 5.5 6.4 5.5 9.5a5.5 5.5 0 1 1-11 0c0-3.1 2.5-5.9 5.5-9.5Z" />
    </svg>
  );
}

export function BoltIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} {...svgProps}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

export function WarningIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} {...svgProps}>
      <path d="M10.3 3.7 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}

export function ClockIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} {...svgProps}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function CheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} {...svgProps}>
      <path d="m5 13 4 4 10-10" strokeWidth="2" />
    </svg>
  );
}

export function InfoIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} {...svgProps}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5" />
      <path d="M12 7.75h.01" />
    </svg>
  );
}

export function LaundryIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} {...svgProps}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="13" r="4.5" />
      <path d="M8 7h.01" />
      <path d="M11 7h.01" />
    </svg>
  );
}

export function RestroomIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} {...svgProps}>
      <path d="M12 3v3" />
      <path d="M9 6h6" />
      <path d="M10 6v2.5a2 2 0 0 0 4 0V6" />
      <path d="M8 14v4" />
      <path d="M16 14v4" />
      <path d="M6 18h12" />
      <path d="M10 11h4v3h-4z" />
    </svg>
  );
}

/** Circular tone-colored badge wrapping a status icon. */
export function StatusBadge({
  tone,
  size = "md",
  children,
}: {
  tone: StatusTone;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}) {
  const box =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-9 w-9";
  return (
    <span
      aria-hidden
      className={`flex ${box} shrink-0 items-center justify-center rounded-full ${TONE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}
