import Link from "next/link";
import Image from "next/image";

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

  const scheduleDays = isSummerSchedule
    ? "Mondays"
    : "Mondays and Thursdays";

  return (
    <aside
      role="status"
      aria-label="Weekly waste pickup schedule"
      className="no-print border-b border-brand-200 bg-brand-50 motion-slide-down dark:border-brand-800/60 dark:bg-brand-950/50"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-0 sm:gap-3 sm:px-4 sm:py-0.5">
        <Image
          src="/assets/mascot/pickup.png"
          alt="Quail clearing green waste with a pitchfork"
          width={112}
          height={112}
          className="-my-3 h-20 w-20 shrink-0 object-contain drop-shadow-sm sm:h-24 sm:w-24"
        />
        <div className="min-w-0 flex-1 space-y-0.5 text-sm leading-tight">
          <p>
            <span className="inline-block rounded-md bg-brand-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white dark:bg-brand-500">
              {scheduleLabel}
            </span>
          </p>
          <p className="font-medium text-ink">
            Weekly waste pickups — material bound for the chipper or the cactus
            pits — occur on {scheduleDays}.
          </p>
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
