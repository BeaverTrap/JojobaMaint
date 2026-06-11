const PDF_LINE = "#d1d5db";
const PDF_MUTED = "#6b7280";
const PDF_INK = "#1a201c";

const MODERN_COLOR_RE = /\b(?:lab|oklch|color)\(/;

/** Layout + typography props copied as inline styles after stylesheets are stripped. */
const PDF_INLINE_PROPS = [
  "display",
  "visibility",
  "position",
  "top",
  "left",
  "right",
  "bottom",
  "width",
  "height",
  "min-width",
  "min-height",
  "max-width",
  "max-height",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-top-style",
  "border-right-style",
  "border-bottom-style",
  "border-left-style",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "border-radius",
  "flex",
  "flex-grow",
  "flex-shrink",
  "flex-basis",
  "flex-direction",
  "flex-wrap",
  "align-items",
  "align-self",
  "justify-content",
  "gap",
  "order",
  "grid-template-columns",
  "grid-template-rows",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-decoration",
  "white-space",
  "color",
  "background-color",
  "opacity",
  "overflow",
  "object-fit",
  "list-style-type",
] as const;

let colorParseCtx: CanvasRenderingContext2D | null = null;

function usesCssVar(value: string | null): boolean {
  return Boolean(value && value.includes("var("));
}

function getColorParseCtx(): CanvasRenderingContext2D {
  if (!colorParseCtx) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    colorParseCtx = canvas.getContext("2d")!;
  }
  return colorParseCtx;
}

/** html2canvas cannot parse Tailwind v4 lab()/oklch() colors from stylesheets. */
function toSafeCssColor(value: string): string {
  const ctx = getColorParseCtx();
  try {
    ctx.fillStyle = "#000000";
    ctx.fillStyle = value;
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (a < 255) {
      return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(4)})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return "#000000";
  }
}

function safeCSSValue(value: string): string {
  if (!value || value === "none" || value === "normal") return value;
  if (MODERN_COLOR_RE.test(value)) return toSafeCssColor(value);
  return value;
}

function pdfChildren(el: Element): Element[] {
  return [...el.children].filter((child) => !shouldIgnorePdfElement(child));
}

function stripCloneStylesheets(clonedDoc: Document): void {
  clonedDoc
    .querySelectorAll('link[rel="stylesheet"], style')
    .forEach((node) => node.remove());
}

function inlineComputedStylesForPdf(source: Element, clone: Element): void {
  if (!(source instanceof HTMLElement) || !(clone instanceof HTMLElement)) return;

  const computed = window.getComputedStyle(source);
  for (const prop of PDF_INLINE_PROPS) {
    const value = computed.getPropertyValue(prop);
    if (!value) continue;
    clone.style.setProperty(
      prop,
      safeCSSValue(value),
      computed.getPropertyPriority(prop),
    );
  }

  const sourceKids = pdfChildren(source);
  const cloneKids = pdfChildren(clone);
  for (let i = 0; i < sourceKids.length && i < cloneKids.length; i++) {
    inlineComputedStylesForPdf(sourceKids[i]!, cloneKids[i]!);
  }
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
export function prepareClonedDocumentForPdf(
  clonedDoc: Document,
  sourceRoot: HTMLElement,
  clonedRoot: HTMLElement,
): void {
  stripCloneStylesheets(clonedDoc);

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

  inlineComputedStylesForPdf(sourceRoot, clonedRoot);

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
