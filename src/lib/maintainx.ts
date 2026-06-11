/** Public MaintainX work-request portal embed URL. */
export function getMaintainXPortalUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_MAINTAINX_URL?.trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}
