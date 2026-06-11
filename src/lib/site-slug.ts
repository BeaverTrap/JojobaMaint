/** URL slug for a lot, named site, or amenity. */
export function siteToSlug(name: string): string {
  const trimmed = name.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function siteHref(name: string): string {
  return `/sites/${siteToSlug(name)}`;
}

/** @deprecated Use siteHref — kept for gradual migration */
export function lotHref(lotNumber: string): string {
  return siteHref(lotNumber);
}

export function lotToSlug(lotNumber: string): string {
  return siteToSlug(lotNumber);
}
