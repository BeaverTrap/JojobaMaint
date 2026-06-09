import Link from "next/link";

function PickupLeafIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 20c4-6 8-10 14-12-2 6-6 10-12 14 2-4 4-8 6-12-6 2-10 6-14 12 4-2 8-4 12-6-4 6-8 10-14 12Z" />
    </svg>
  );
}

export default function PickupBanner({
  isSummerSchedule,
  showGuidelinesLink = true,
}: {
  isSummerSchedule: boolean;
  showGuidelinesLink?: boolean;
}) {
  const scheduleLabel = isSummerSchedule
    ? "SUMMER SCHEDULE: Mondays Only"
    : "Mondays & Thursdays";

  return (
    <aside
      role="status"
      aria-label="Weekly waste pickup schedule"
      className="no-print border-b border-brand-200 bg-brand-50 dark:border-brand-800/60 dark:bg-brand-950/50"
    >
      <div className="mx-auto flex max-w-5xl items-start gap-3 px-3 py-3 sm:items-center sm:gap-3.5 sm:px-4 sm:py-3.5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600/10 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300 sm:mt-0">
          <PickupLeafIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1 space-y-1 text-sm leading-snug">
          <p>
            <span className="inline-block rounded-md bg-brand-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white dark:bg-brand-500">
              {scheduleLabel}
            </span>
          </p>
          <p className="font-medium text-ink">
            Weekly green waste and cactus waste pickups — material bound for the
            chipping pits — occur on{" "}
            <span className="font-semibold text-brand-700 dark:text-brand-300">
              {isSummerSchedule ? "Mondays" : "Mondays and Thursdays"}
            </span>
            .
          </p>
          {isSummerSchedule && (
            <p className="text-xs text-muted">
              Thursday pickups are temporarily paused for the summer schedule.
            </p>
          )}
          {showGuidelinesLink && (
            <p>
              <Link
                href="/pickup-guidelines"
                className="text-xs font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800 dark:text-brand-300"
              >
                Full pickup guidelines →
              </Link>
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
