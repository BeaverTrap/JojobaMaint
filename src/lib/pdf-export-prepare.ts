const PDF_LINE = "#d1d5db";
const PDF_MUTED = "#6b7280";
const PDF_INK = "#1a201c";

function usesCssVar(value: string | null): boolean {
  return Boolean(value && value.includes("var("));
}

/** Max canvas edge html2canvas can safely use in most browsers. */
const MAX_CANVAS_SIDE = 16384;

export function pdfCanvasScale(root: HTMLElement): number {
  const height = Math.max(root.scrollHeight, root.offsetHeight, 1);
  const width = Math.max(root.scrollWidth, root.offsetWidth, 1);
  const byHeight = (MAX_CANVAS_SIDE / height) * 0.97;
  const byWidth = (MAX_CANVAS_SIDE / width) * 0.97;
  const scale = Math.min(2, byHeight, byWidth);
  return Math.max(1, Math.round(scale * 10) / 10);
}

/** Fix cloned DOM so html2canvas can rasterize charts and theme tokens. */
export function prepareClonedDocumentForPdf(clonedDoc: Document): void {
  const root = clonedDoc.querySelector(".print-report");
  if (root instanceof HTMLElement) {
    root.style.background = "#ffffff";
    root.style.color = PDF_INK;
  }

  clonedDoc.querySelectorAll<SVGElement>("svg *").forEach((node) => {
    const stroke = node.getAttribute("stroke");
    if (usesCssVar(stroke)) node.setAttribute("stroke", PDF_LINE);

    const fill = node.getAttribute("fill");
    if (usesCssVar(fill)) node.setAttribute("fill", PDF_MUTED);
  });

  clonedDoc.querySelectorAll<HTMLElement>(".recharts-text").forEach((node) => {
    node.style.fill = PDF_MUTED;
  });

  clonedDoc.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    if (!img.complete || img.naturalWidth === 0) {
      img.removeAttribute("src");
      img.style.display = "none";
    }
  });
}
