/** One markdown image line: ![alt](url) */
const IMAGE_LINE =
  /^!\[([^\]]*)\]\((\S+)\)\s*$/;

export type BodySegment =
  | { kind: "markdown"; text: string }
  | { kind: "gallery"; images: { url: string; alt: string }[] };

/** Split stored body into text blocks and consecutive image runs (galleries). */
export function splitArticleBody(body: string): BodySegment[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const segments: BodySegment[] = [];
  let mdLines: string[] = [];
  let gallery: { url: string; alt: string }[] = [];

  const flushMd = () => {
    const text = mdLines.join("\n").trim();
    if (text) segments.push({ kind: "markdown", text });
    mdLines = [];
  };

  const flushGallery = () => {
    if (gallery.length > 0) {
      segments.push({ kind: "gallery", images: [...gallery] });
      gallery = [];
    }
  };

  for (const line of lines) {
    const m = line.match(IMAGE_LINE);
    if (m) {
      flushMd();
      gallery.push({ url: m[2], alt: m[1] || "Photo" });
    } else {
      flushGallery();
      mdLines.push(line);
    }
  }

  flushGallery();
  flushMd();

  return segments;
}
