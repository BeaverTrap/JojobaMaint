import {
  collectPdfBlocks,
  pdfCanvasScaleForElement,
  prepareClonedDocumentForPdf,
  shouldIgnorePdfElement,
} from "@/lib/pdf-export-prepare";
import { sanitizePrintFileName } from "@/lib/print-file-name";

const PDF_MARGIN_IN = 0.65;

async function captureBlock(
  element: HTMLElement,
  scale: number,
): Promise<HTMLCanvasElement> {
  const html2canvas = (await import("html2canvas")).default;

  return html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    ignoreElements: shouldIgnorePdfElement,
    onclone: (clonedDoc: Document) => {
      prepareClonedDocumentForPdf(clonedDoc);
    },
  });
}

async function captureWithRetry(
  element: HTMLElement,
): Promise<HTMLCanvasElement> {
  let scale = pdfCanvasScaleForElement(element);
  let lastError: unknown;

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await captureBlock(element, scale);
    } catch (error) {
      lastError = error;
      scale = Math.max(0.5, Math.round(scale * 0.75 * 10) / 10);
    }
  }

  throw lastError;
}

function addCanvasFromTop(
  pdf: import("jspdf").jsPDF,
  canvas: HTMLCanvasElement,
  margin: number,
): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/jpeg", 0.92);

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - position - margin;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }
}

export async function downloadReportPdf(
  root: HTMLElement,
  fileName: string,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const safeName = sanitizePrintFileName(fileName);
  const blocks = collectPdfBlocks(root);

  window.scrollTo(0, 0);
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  root.classList.add("pdf-export-mode");
  try {
    const pdf = new jsPDF({
      unit: "in",
      format: "letter",
      orientation: "portrait",
    });

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]!;
      block.scrollIntoView({ block: "start" });
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

      const canvas = await captureWithRetry(block);

      if (i > 0) {
        pdf.addPage();
      }
      addCanvasFromTop(pdf, canvas, PDF_MARGIN_IN);
    }

    pdf.save(`${safeName}.pdf`);
  } finally {
    root.classList.remove("pdf-export-mode");
  }
}
