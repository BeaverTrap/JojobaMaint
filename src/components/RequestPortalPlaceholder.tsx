export default function RequestPortalPlaceholder() {
  return (
    <div className="flex min-h-[calc(100dvh-12rem)] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-gradient-to-b from-canvas to-surface px-6 py-16 text-center shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-200 dark:bg-brand-950/50 dark:text-brand-200 dark:ring-brand-900/60">
        <svg
          className="h-8 w-8"
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
      <h2 className="mt-6 text-lg font-bold text-ink">Request portal offline</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        The online work request form is not available right now. Please check
        back later or contact the maintenance office for urgent needs.
      </p>
    </div>
  );
}
