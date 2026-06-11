const PDF_LINE = "#d1d5db";
const PDF_MUTED = "#6b7280";
const PDF_INK = "#1a201c";

function usesCssVar(value: string | null): boolean {
  return Boolean(value && value.includes("var("));
}

const MAX_CANVAS_SIDE = 16384;
const MAX_CANVAS_PIXELS = 12_000_000;

export type PdfExportRestore = () => void;

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

export function usesSectionalPdfCapture(root: HTMLElement): boolean {
  return root.querySelector(".water-report-charts") !== null;
}

/** Printable blocks in document order (one chart section at a time on water reports). */
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
      const sections = [...child.querySelectorAll<HTMLElement>(":scope > section")]
        .filter((section) => !shouldIgnorePdfElement(section))
        .sort(
          (a, b) =>
            (a.style.order ? Number(a.style.order) : 0) -
            (b.style.order ? Number(b.style.order) : 0),
        );
      blocks.push(...sections);
      continue;
    }

    blocks.push(child);
  }

  return blocks.length > 0 ? blocks : [root];
}

/** Hide chart toolbars and other screen-only UI on the live page before capture. */
export function prepareLiveDocumentForPdf(root: HTMLElement): PdfExportRestore {
  const restores: Array<() => void> = [];

  const pushStyle = (
    el: HTMLElement,
    property: "display" | "order",
    value: string,
  ) => {
    const previous = el.style.getPropertyValue(property);
    el.style.setProperty(property, value);
    restores.push(() => {
      if (previous) el.style.setProperty(property, previous);
      else el.style.removeProperty(property);
    });
  };

  root.classList.add("pdf-export-mode");
  document.documentElement.classList.add("pdf-export-mode");
  restores.push(() => {
    root.classList.remove("pdf-export-mode");
    document.documentElement.classList.remove("pdf-export-mode");
  });

  root
    .querySelectorAll<HTMLElement>(".no-print, .print-screen-only, .print-exclude")
    .forEach((el) => pushStyle(el, "display", "none"));

  root.querySelectorAll<HTMLElement>(".print-only").forEach((el) => {
    pushStyle(el, "display", "block");
  });

  root.querySelectorAll<HTMLElement>("[style*='order']").forEach((el) => {
    pushStyle(el, "order", "0");
  });

  return () => {
    for (let i = restores.length - 1; i >= 0; i--) restores[i]!();
  };
}

/** Fix cloned DOM so html2canvas can rasterize charts and theme tokens. */
export function prepareClonedDocumentForPdf(clonedDoc: Document): void {
  clonedDoc.documentElement.classList.remove("dark");
  clonedDoc.documentElement.classList.add("pdf-export-mode");
  clonedDoc.documentElement.style.background = "#ffffff";
  clonedDoc.body.style.background = "#ffffff";
  clonedDoc.body.style.color = PDF_INK;

  clonedDoc
    .querySelectorAll(".no-print, .print-exclude, .print-screen-only")
    .forEach((node) => {
      node.remove();
    });

  clonedDoc.querySelectorAll<HTMLElement>(".print-only").forEach((el) => {
    el.style.display = "block";
  });

  const root = clonedDoc.querySelector(".print-report");
  if (root instanceof HTMLElement) {
    root.classList.add("pdf-export-mode");
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
