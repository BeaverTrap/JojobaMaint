import TurndownService from "turndown";

/**
 * Convert HTML from a Google Docs paste into clean Markdown for storage.
 */
export function htmlToMarkdown(html: string): string {
  const td = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
  });

  // Drop Docs-specific noise (inline styles, spans with ids).
  td.remove(["style", "meta", "script"]);

  td.addRule("googleDocsBold", {
    filter: ["b", "strong"],
    replacement: (content) => (content ? `**${content}**` : ""),
  });

  td.addRule("underline", {
    filter: ["u"],
    replacement: (content) => (content ? `<u>${content}</u>` : ""),
  });

  td.addRule("inlineImage", {
    filter: "img",
    replacement: (_content, node) => {
      const el = node as HTMLImageElement;
      const src = el.getAttribute("src") ?? "";
      const alt = (el.getAttribute("alt") ?? "Photo").replace(/[\[\]]/g, "");
      if (!src) return "";
      return `\n\n![${alt}](${src})\n\n`;
    },
  });

  let md = td.turndown(html);
  md = md.replace(/\n{3,}/g, "\n\n").trim();
  return md;
}

/**
 * Google Docs often pastes as plain text with one newline per line inside a
 * paragraph (no blank lines). Rebuild real paragraphs and list items.
 */
export function normalizeDocsPlainText(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(paragraph.join(" "));
    paragraph = [];
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    // Headings (if user typed markdown-style)
    if (/^#{1,3}\s/.test(line)) {
      flushParagraph();
      blocks.push(line);
      continue;
    }

    // Bullets: •, -, *, or common Docs bullet char
    if (/^[-•*]\s+/.test(line)) {
      flushParagraph();
      blocks.push(line.replace(/^•\s+/, "- "));
      continue;
    }

    // Numbered lists
    if (/^\d+[.)]\s+/.test(line)) {
      flushParagraph();
      blocks.push(line.replace(/^(\d+)[.)]\s+/, "$1. "));
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks.join("\n\n");
}

/** Normalize stored body before render (fixes legacy plain-text pastes). */
export function prepareArticleBody(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return "";

  // Already has markdown structure (headings, lists, or double newlines).
  if (
    /\n\n/.test(trimmed) ||
    /^#{1,3}\s/m.test(trimmed) ||
    /^[-*]\s/m.test(trimmed) ||
    /^\d+\.\s/m.test(trimmed) ||
    /\*\*[^*]+\*\*/.test(trimmed)
  ) {
    return trimmed;
  }

  return normalizeDocsPlainText(trimmed);
}
