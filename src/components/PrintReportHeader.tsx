/** Park branding shown at the top of printed reports only. */
export default function PrintReportHeader() {
  return (
    <div
      aria-hidden
      className="print-only mb-6 hidden border-b border-line pb-4 print:block"
    >
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/logo.png"
          alt="Jojoba Hills logo"
          width={56}
          height={56}
          className="h-14 w-14 rounded-xl object-contain"
        />
        <div>
          <p className="text-lg font-bold tracking-tight text-ink">Jojoba Hills</p>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Maintenance Department
          </p>
        </div>
      </div>
    </div>
  );
}
