/** Canonical site origin for OAuth redirects and server metadata. */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const vercelHost = process.env.VERCEL_URL?.trim();

  // Localhost in env is for dev; on Vercel use the real deployment host.
  if (configured?.includes("localhost")) {
    if (vercelProduction) {
      return `https://${vercelProduction.replace(/\/$/, "")}`;
    }
    if (vercelHost) {
      return `https://${vercelHost.replace(/\/$/, "")}`;
    }
  }

  if (configured) return configured.replace(/\/$/, "");
  if (vercelProduction) {
    return `https://${vercelProduction.replace(/\/$/, "")}`;
  }
  if (vercelHost) return `https://${vercelHost.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

/** Origin for share/copy links — always the page the user is on in the browser. */
export function getShareOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return getSiteUrl();
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** Share and clipboard links (client uses live origin, not build-time localhost). */
export function shareAbsoluteUrl(path: string): string {
  const base = getShareOrigin().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
