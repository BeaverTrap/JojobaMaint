"use client";

import { useRef, useState } from "react";
import { downloadReportPdf } from "@/lib/download-report-pdf";
import { openReportPrintDialog } from "@/lib/print-report";

export default function PrintReportButton({
  fileName,
  onBeforeExport,
}: {
  fileName: string;
  onBeforeExport?: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const reportRef = useRef<HTMLElement | null>(null);

  const getReportRoot = () => {
    if (reportRef.current) return reportRef.current;
    const root = document.querySelector<HTMLElement>(".print-report");
    reportRef.current = root;
    return root;
  };

  const handleDownload = async () => {
    const root = getReportRoot();
    if (!root || busy) return;

    setBusy(true);
    try {
      await onBeforeExport?.();
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      await downloadReportPdf(root, fileName);
    } catch (error) {
      console.error("PDF export failed:", error);
      window.alert(
        "Could not create the PDF. Try Print instead, or check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
      >
        <DownloadIcon />
        {busy ? "Creating PDF…" : "Download PDF"}
      </button>
      <button
        type="button"
        onClick={() => openReportPrintDialog(fileName)}
        className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-hover"
      >
        <PrintIcon />
        Print
      </button>
    </div>
  );
}

function DownloadIcon() {
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
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
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
