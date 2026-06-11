const PDF_LINE = "#d1d5db";
const PDF_MUTED = "#6b7280";
const PDF_INK = "#1a201c";

function usesCssVar(value: string | null): boolean {
  return Boolean(value && value.includes("var("));
}

/** Max canvas edge html2canvas can safely use in most browsers. */
const MAX_CANVAS_SIDE = 16384;
/** Total pixel budget per capture (width × height × scale²). */
const MAX_CANVAS_PIXELS = 12_000_000;

export function shouldIgnorePdfElement(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el.classList.contains("no-print") ||
    el.classList.contains("print-exclude") ||
    el.classList.contains("print-screen-only")
  );
}

export function pdfCanvasScaleForElement(el: HTMLElement): number {
  const height = Math.max(el.scrollHeight, el.offsetHeight, 1);
  const width = Math.max(el.scrollWidth, el.offsetWidth, 1);
  const byHeight = (MAX_CANVAS_SIDE / height) * 0.97;
  const byWidth = (MAX_CANVAS_SIDE / width) * 0.97;
  const byArea = Math.sqrt(MAX_CANVAS_PIXELS / (width * height)) * 0.97;
  const scale = Math.min(2, byHeight, byWidth, byArea);
  return Math.max(0.75, Math.round(scale * 10) / 10);
}

/** @deprecated Use pdfCanvasScaleForElement */
export function pdfCanvasScale(root: HTMLElement): number {
  return pdfCanvasScaleForElement(root);
}

/** Printable blocks in document order (section-by-section for tall reports). */
export function collectPdfBlocks(root: HTMLElement): HTMLElement[] {
  const blocks: HTMLElement[] = [];

  root.querySelectorAll<HTMLElement>(":scope > .print-only").forEach((el) => {
    blocks.push(el);
  });

  const meta = root.querySelector<HTMLElement>(":scope > .print-report-meta");
  if (meta) blocks.push(meta);

  const content = root.querySelector<HTMLElement>(".print-report-content");
  if (!content) {
    return blocks.length > 0 ? blocks : [root];
  }

  for (const child of content.children) {
    if (!(child instanceof HTMLElement)) continue;
    if (shouldIgnorePdfElement(child)) continue;

    if (child.classList.contains("flex")) {
      for (const section of child.children) {
        if (
          section instanceof HTMLElement &&
          !shouldIgnorePdfElement(section)
        ) {
          blocks.push(section);
        }
      }
      continue;
    }

    blocks.push(child);
  }

  return blocks.length > 0 ? blocks : [root];
}

/** Fix cloned DOM so html2canvas can rasterize charts and theme tokens. */
export function prepareClonedDocumentForPdf(clonedDoc: Document): void {
  clonedDoc.documentElement.classList.remove("dark");
  clonedDoc.documentElement.style.background = "#ffffff";
  clonedDoc.body.style.background = "#ffffff";
  clonedDoc.body.style.color = PDF_INK;

  clonedDoc
    .querySelectorAll(".no-print, .print-exclude, .print-screen-only")
    .forEach((node) => {
      node.remove();
    });

  const root = clonedDoc.querySelector(".print-report");
  if (root instanceof HTMLElement) {
    root.style.background = "#ffffff";
    root.style.color = PDF_INK;
  }

  clonedDoc.querySelectorAll<HTMLElement>("[style*='order']").forEach((node) => {
    node.style.order = "0";
  });

  clonedDoc.querySelectorAll<HTMLElement>("*").forEach((node) => {
    node.style.boxShadow = "none";
    node.style.filter = "none";
  });

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
