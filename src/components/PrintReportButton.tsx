"use client";

import { openReportPrintDialog } from "@/lib/print-report";

export default function PrintReportButton({ fileName }: { fileName: string }) {
  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <button
        type="button"
        onClick={() => openReportPrintDialog(fileName)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        <PrintIcon />
        Save as PDF
      </button>
      <p className="text-center text-xs text-muted sm:text-right">
        Opens print — choose <span className="font-medium">Save as PDF</span> as
        the printer.
      </p>
    </div>
  );
}

function PrintIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 8V3h10v5M7 16H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M7 12h10v9H7z" />
    </svg>
  );
}
