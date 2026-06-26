"use client";

import { useState } from "react";

/** Park branding shown at the top of printed / PDF reports only. */
export default function PrintReportHeader() {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div
      aria-hidden
      className="print-only mb-6 hidden border-b border-line pb-4 print:block"
    >
      <div className="flex items-center gap-4">
        {logoFailed ? (
          <span
            className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white"
            aria-hidden
          >
            JW
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/assets/logo_quail_wht.jpg"
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 rounded-xl object-contain"
            onError={() => setLogoFailed(true)}
          />
        )}
        <div>
          <p className="text-lg font-bold tracking-tight text-ink">JojobaWorks</p>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Maintenance Dept.
          </p>
        </div>
      </div>
    </div>
  );
}
