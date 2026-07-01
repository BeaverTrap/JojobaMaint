export const SMS_GSM_LIMIT = 160;
export const SMS_UCS2_LIMIT = 70;

const EMOJI_PATTERN =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}]/u;

export function containsEmoji(text: string): boolean {
  return EMOJI_PATTERN.test(text);
}

export function smsCharLimit(text: string): number {
  return containsEmoji(text) ? SMS_UCS2_LIMIT : SMS_GSM_LIMIT;
}

export function applyTemplateVariables(
  template: string,
  resident: { name: string; lot_id: string | null },
): string {
  const lot = resident.lot_id?.trim() || "—";
  return template
    .replaceAll("{Name}", resident.name.trim() || "Resident")
    .replaceAll("{Lot}", lot);
}

export function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
