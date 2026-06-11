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
const SECTION_GAP_IN = 0.1;

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

/** Place a captured block on the current page(s), continuing from startY. */
function appendCanvas(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  margin: number,
  startY: number,
): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const contentBottom = pageHeight - margin;
  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvasToDataUrl(canvas);
  const format = imgData.startsWith("data:image/png") ? "PNG" : "JPEG";

  let y = startY;
  if (y > contentBottom - 0.2) {
    pdf.addPage();
    y = margin;
  }

  let drawn = 0;

  while (drawn < imgHeight - 0.01) {
    const available = contentBottom - y;
    if (available <= 0.05) {
      pdf.addPage();
      y = margin;
      continue;
    }

    const remaining = imgHeight - drawn;
    pdf.addImage(imgData, format, margin, y - drawn, imgWidth, imgHeight);

    if (remaining <= available) {
      return y + remaining + SECTION_GAP_IN;
    }

    drawn += available;
    pdf.addPage();
    y = margin;
  }

  return y + SECTION_GAP_IN;
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

    let cursorY = PDF_MARGIN_IN;
    for (const block of blocks) {
      block.scrollIntoView({ block: "start" });
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      await new Promise<void>((resolve) => setTimeout(resolve, 150));

      const canvas = await captureWithRetry(block);
      if (canvas.width < 2 || canvas.height < 2) continue;

      cursorY = appendCanvas(pdf, canvas, PDF_MARGIN_IN, cursorY);
    }

    pdf.save(`${safeName}.pdf`);
  } finally {
    restoreLive();
  }
}
