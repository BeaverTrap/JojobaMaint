/** URL slug for a lot or named site (e.g. "101" → "101", "Club House" → "club-house"). */
export function lotToSlug(lotNumber: string): string {
  const trimmed = lotNumber.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function lotHref(lotNumber: string): string {
  return `/lots/${lotToSlug(lotNumber)}`;
}
