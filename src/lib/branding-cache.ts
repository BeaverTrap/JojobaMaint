import type { SiteBranding } from "@/app/api/branding/route";

let cached: SiteBranding | null = null;
let fetchPromise: Promise<SiteBranding | null> | null = null;

const DEFAULTS: SiteBranding = {
  brand_50: "#f1f7f2", brand_100: "#dcede0", brand_200: "#bbdcc3",
  brand_300: "#8fc29e", brand_400: "#5da176", brand_500: "#3d8459",
  brand_600: "#2d6a47", brand_700: "#25553a", brand_800: "#204430",
  brand_900: "#1b3829", brand_950: "#0f1f17", gold: "#c0882c",
  wordmark_primary: "ink", wordmark_accent: "brand-600",
  avatar_ring: "brand-500",
};

async function load(): Promise<SiteBranding | null> {
  try {
    const res = await fetch("/api/branding");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function getBranding(onReady?: () => void): SiteBranding {
  if (cached) return cached;
  if (!fetchPromise) {
    fetchPromise = load().then((data) => {
      cached = data;
      return data;
    });
  }
  fetchPromise.then(() => onReady?.());
  return DEFAULTS;
}

export function invalidateBranding() {
  cached = null;
  fetchPromise = null;
}
