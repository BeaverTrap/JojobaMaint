import type { jsPDF } from "jspdf";
import {
  collectPdfBlocks,
  pdfCanvasScaleForElement,
  prepareBlockWidthForCapture,
  prepareClonedDocumentForPdf,
  prepareLiveDocumentForPdf,
  reportCaptureWidth,
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
  return canvas.toDataURL("image/png");
}

async function captureBlock(
  element: HTMLElement,
  scale: number,
  captureWidthPx: number,
): Promise<HTMLCanvasElement> {
  const html2canvas = await loadHtml2Canvas();

  return html2canvas(element, {
    scale,
    width: captureWidthPx,
    windowWidth: captureWidthPx,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    ignoreElements: shouldIgnorePdfElement,
    onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
      prepareClonedDocumentForPdf(
        clonedDoc,
        element,
        clonedElement,
        captureWidthPx,
      );
    },
  });
}

async function captureWithRetry(
  element: HTMLElement,
  captureWidthPx: number,
): Promise<HTMLCanvasElement> {
  let scale = pdfCanvasScaleForElement(element);
  let lastError: unknown;

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await captureBlock(element, scale, captureWidthPx);
    } catch (error) {
      lastError = error;
      scale = Math.max(0.5, Math.round(scale * 0.75 * 10) / 10);
    }
  }

  throw lastError;
}

/**
 * Place one captured section on the PDF without slicing through it.
 * Scales down to fit a single page; starts a new page when needed.
 */
function appendCanvas(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  margin: number,
  startY: number,
  keepTogether: boolean,
): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;
  const contentBottom = pageHeight - margin;

  const imgData = canvasToDataUrl(canvas);
  const format = imgData.startsWith("data:image/png") ? "PNG" : "JPEG";

  let y = startY;
  let available = contentBottom - y;

  if (available < 0.2) {
    pdf.addPage();
    y = margin;
    available = contentHeight;
  }

  let imgWidth = contentWidth;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (keepTogether && imgHeight > contentHeight) {
    const fitScale = contentHeight / imgHeight;
    imgWidth *= fitScale;
    imgHeight = contentHeight;
  }

  if (imgHeight > available) {
    pdf.addPage();
    y = margin;
    available = contentHeight;
  }

  if (keepTogether) {
    pdf.addImage(imgData, format, margin, y, imgWidth, imgHeight);
    return y + imgHeight + SECTION_GAP_IN;
  }

  return appendCanvasAcrossPages(
    pdf,
    imgData,
    format,
    margin,
    y,
    imgWidth,
    imgHeight,
    contentBottom,
    contentHeight,
  );
}

/** Last resort for unusually tall blocks (not chart sections). */
function appendCanvasAcrossPages(
  pdf: jsPDF,
  imgData: string,
  format: "PNG" | "JPEG",
  margin: number,
  startY: number,
  imgWidth: number,
  imgHeight: number,
  contentBottom: number,
  contentHeight: number,
): number {
  let y = startY;
  let drawn = 0;

  while (drawn < imgHeight - 0.01) {
    let available = contentBottom - y;
    if (available <= 0.05) {
      pdf.addPage();
      y = margin;
      available = contentHeight;
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

function blockKeepsTogether(block: HTMLElement): boolean {
  return (
    block.matches("section") ||
    block.classList.contains("print-only") ||
    block.classList.contains("print-report-meta")
  );
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
    await document.fonts.ready;

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

      const captureWidth = reportCaptureWidth(root, block);
      const restoreWidth = prepareBlockWidthForCapture(block, captureWidth);
      try {
        const canvas = await captureWithRetry(block, captureWidth);
        if (canvas.width < 2 || canvas.height < 2) continue;

        cursorY = appendCanvas(
          pdf,
          canvas,
          PDF_MARGIN_IN,
          cursorY,
          blockKeepsTogether(block),
        );
      } finally {
        restoreWidth();
      }
    }

    pdf.save(`${safeName}.pdf`);
  } finally {
    restoreLive();
  }
}
