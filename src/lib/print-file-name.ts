/** Safe default filename for browser Save as PDF (no extension). */
export function sanitizePrintFileName(title: string): string {
  const cleaned = title
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);

  return cleaned || "Jojoba Hills report";
}
