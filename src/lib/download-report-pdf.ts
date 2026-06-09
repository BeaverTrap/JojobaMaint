import { sanitizePrintFileName } from "@/lib/print-file-name";

export async function downloadReportPdf(
  root: HTMLElement,
  fileName: string,
): Promise<void> {
  const html2pdf = (await import("html2pdf.js")).default;
  const safeName = sanitizePrintFileName(fileName);

  root.classList.add("pdf-export-mode");
  try {
    await html2pdf()
      .set({
        margin: [0.65, 0.65, 0.65, 0.65],
        filename: `${safeName}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(root)
      .save();
  } finally {
    root.classList.remove("pdf-export-mode");
  }
}
