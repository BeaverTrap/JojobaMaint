import {
  pdfCanvasScale,
  prepareClonedDocumentForPdf,
} from "@/lib/pdf-export-prepare";
import { sanitizePrintFileName } from "@/lib/print-file-name";

export async function downloadReportPdf(
  root: HTMLElement,
  fileName: string,
): Promise<void> {
  const html2pdf = (await import("html2pdf.js")).default;
  const safeName = sanitizePrintFileName(fileName);
  const scale = pdfCanvasScale(root);

  window.scrollTo(0, 0);
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  root.classList.add("pdf-export-mode");
  try {
    await html2pdf()
      .set({
        margin: [0.65, 0.65, 0.65, 0.65],
        filename: `${safeName}.pdf`,
        image: { type: "jpeg", quality: 0.92 },
        html2canvas: {
          scale,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: -window.scrollY,
          windowWidth: root.scrollWidth,
          windowHeight: root.scrollHeight,
          onclone: (clonedDoc: Document) => {
            prepareClonedDocumentForPdf(clonedDoc);
          },
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
