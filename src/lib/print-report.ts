import { sanitizePrintFileName } from "@/lib/print-file-name";

/** Opens the system print dialog so the user can choose Save as PDF. */
export function openReportPrintDialog(fileName: string): void {
  const safeName = sanitizePrintFileName(fileName);
  const previousTitle = document.title;

  document.title = safeName;
  window.scrollTo(0, 0);

  const restoreTitle = () => {
    document.title = previousTitle;
    window.removeEventListener("afterprint", restoreTitle);
  };
  window.addEventListener("afterprint", restoreTitle);

  window.print();
}
