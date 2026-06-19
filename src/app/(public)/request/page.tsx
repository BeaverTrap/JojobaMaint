import RequestPortalPlaceholder from "@/components/RequestPortalPlaceholder";
import { getMaintainXPortalUrl } from "@/lib/maintainx";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Work Request",
  description:
    "Submit a maintenance work request for Jojoba Hills SKP Resort.",
};

export default function RequestPage() {
  const portalUrl = getMaintainXPortalUrl();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          Submit a Work Request
        </h1>
        <p className="text-sm text-muted">
          Report maintenance issues, request repairs, or ask for help from the
          maintenance team.
        </p>
      </header>

      {portalUrl ? (
        <section className="rounded-2xl border border-line bg-surface px-6 py-12 text-center shadow-sm sm:px-10 sm:py-16">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-200 dark:bg-brand-950/50 dark:text-brand-200 dark:ring-brand-900/60">
            <svg
              className="h-7 w-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2Z" />
              <path d="M9 12h6M9 16h4" />
            </svg>
          </div>

          <h2 className="mt-6 text-lg font-bold text-ink sm:text-xl">
            Welcome, residents
          </h2>

          <div className="mx-auto mt-4 max-w-lg space-y-3 text-sm leading-relaxed text-muted">
            <p>
              Use our work request portal to let the maintenance team know about
              repairs, park issues, or anything that needs attention around
              Jojoba Hills.
            </p>
            <p>
              You will complete your request on a secure MaintainX page in a new
              browser tab. Include as much detail as you can — location, photos,
              and a clear description help us respond faster.
            </p>
          </div>

          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex min-h-[3.25rem] items-center justify-center rounded-xl bg-brand-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Open Work Request Portal
          </a>

          <p className="mt-4 text-xs text-muted">
            Opens in a new tab · For emergencies, contact the maintenance office
            directly.
          </p>
        </section>
      ) : (
        <RequestPortalPlaceholder />
      )}
    </div>
  );
}
