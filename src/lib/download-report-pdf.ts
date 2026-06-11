import type { jsPDF } from "jspdf";
import {
  collectPdfBlocks,
  pdfCanvasScaleForElement,
  prepareClonedDocumentForPdf,
  prepareLiveDocumentForPdf,
  shouldIgnorePdfElement,
  usesSectionalPdfCapture,
} from "@/lib/pdf-export-prepare";
import { sanitizePrintFileName } from "@/lib/print-file-name";

const PDF_MARGIN_IN = 0.65;

async function loadHtml2Canvas() {
  const mod = await import("html2canvas");
  return mod.default ?? mod;
}

async function loadJsPDF() {
  const mod = await import("jspdf");
  return mod.jsPDF;
}

function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  try {
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    return canvas.toDataURL("image/png");
  }
}

async function captureBlock(
  element: HTMLElement,
  scale: number,
): Promise<HTMLCanvasElement> {
  const html2canvas = await loadHtml2Canvas();

  return html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    ignoreElements: shouldIgnorePdfElement,
    onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
      prepareClonedDocumentForPdf(clonedDoc, element, clonedElement);
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
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  margin: number,
): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvasToDataUrl(canvas);
  const format = imgData.startsWith("data:image/png") ? "PNG" : "JPEG";

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, format, margin, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - position - margin;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, format, margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }
}

export async function downloadReportPdf(
  root: HTMLElement,
  fileName: string,
): Promise<void> {
  const jsPDF = await loadJsPDF();
  const safeName = sanitizePrintFileName(fileName);
  const sectional = usesSectionalPdfCapture(root);
  const blocks = sectional
    ? collectPdfBlocks(root)
    : [root.querySelector<HTMLElement>(".print-report-content") ?? root];

  window.scrollTo(0, 0);
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  const restoreLive = prepareLiveDocumentForPdf(root);
  try {
    const pdf = new jsPDF({
      unit: "in",
      format: "letter",
      orientation: "portrait",
    });

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]!;
      const canvas = await captureWithRetry(block);

      if (i > 0) {
        pdf.addPage();
      }
      addCanvasFromTop(pdf, canvas, PDF_MARGIN_IN);
    }

    pdf.save(`${safeName}.pdf`);
  } finally {
    restoreLive();
  }
}
